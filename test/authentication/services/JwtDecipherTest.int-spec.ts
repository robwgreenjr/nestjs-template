import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { JwtDecipher } from "../../../src/authentication/services/JwtDecipher";
import { UserPasswordManager } from "../../../src/authentication/services/UserPasswordManager";
import { SimpleUserLogin } from "../../../src/authentication/services/SimpleUserLogin";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { UsersModule } from "../../../src/users/UsersModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { JwtSpecialist } from "../../../src/authentication/helpers/JwtSpecialist";
import { UserModel } from "../../../src/users/models/UserModel";
import { UserPasswordModel } from "../../../src/authentication/models/UserPasswordModel";
import { JwtModule } from "@nestjs/jwt";

describe("JwtDecipher (int)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "jwt_decipher";

    let jwtDecipher: JwtDecipher;
    let userPasswordManager: UserPasswordManager;
    let simpleUserLogin: SimpleUserLogin;

    const emitProvider = {
        emit: () => {},
        on: () => {},
        removeAllListeners: () => {},
    };

    beforeAll(async () => {
        await buildDatabase({
            host: process.env.TEST_CONTAINER_HOST ?? "",
            port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
            user: TestDatabase.USER as string,
            password: TestDatabase.PASSWORD as string,
            name: databaseName,
        });

        const e2eDatabaseConfiguration: PoolConfig = {
            host: process.env.TEST_CONTAINER_HOST,
            port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
            user: TestDatabase.USER as string,
            password: TestDatabase.PASSWORD as string,
            database: databaseName,
        };

        databaseConnection = new Pool(e2eDatabaseConfiguration);

        module = await Test.createTestingModule({
            imports: [
                ...mikroOrmConfig({
                    host: process.env.TEST_CONTAINER_HOST ?? "",
                    port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
                    user: TestDatabase.USER as string,
                    password: TestDatabase.PASSWORD as string,
                    name: databaseName,
                }),
                EventEmitterModule.forRoot(),
                JwtModule,
                DatabaseModule,
                GlobalModule,
                HypermediaModule,
                UsersModule,
                AuthorizationModule,
                AuthenticationModule,
            ],
            providers: [
                JwtSpecialist,
                JwtDecipher,
                UserPasswordManager,
                SimpleUserLogin,
            ],
        })
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        jwtDecipher = module.get<JwtDecipher>(JwtDecipher);
        userPasswordManager =
            module.get<UserPasswordManager>(UserPasswordManager);
        simpleUserLogin = module.get<SimpleUserLogin>(SimpleUserLogin);
    });

    beforeEach(async () => {
        await runSqlScript(
            databaseConnection,
            path.join(__dirname, "../../", "sql/truncateDatabase.sql"),
        );
    });

    afterAll(async () => {
        await databaseConnection.end();
        await app.close();
    });

    describe("JwtDecipher", () => {
        it("should be defined", async () => {
            expect(jwtDecipher).toBeDefined();
        });
    });

    describe("validate", () => {
        it("given token should set valid user id", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../global",
                    "sql/createConfiguration.sql",
                ),
            );

            const user = await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING *",
            );

            const userModel = new UserModel();
            userModel.id = user.rows[0].id;
            const userPasswordModel = new UserPasswordModel();
            userPasswordModel.user = userModel;
            userPasswordModel.password = "password";

            await userPasswordManager.create(userPasswordModel);

            const jwtModel = await simpleUserLogin.jwtProvider(
                "tester.blue@gmail.com",
                "password",
            );

            const actual = await jwtDecipher.validate(
                "Bearer " + jwtModel.token,
            );

            expect(actual?.userId).toEqual(user.rows[0].id);
        });
    });
});
