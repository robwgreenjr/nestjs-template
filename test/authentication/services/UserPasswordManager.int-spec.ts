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
import { UserPasswordManager } from "../../../src/authentication/services/UserPasswordManager";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { UserModel } from "../../../src/users/models/UserModel";
import { UserPasswordModel } from "../../../src/authentication/models/UserPasswordModel";

describe("UserPasswordManager (int)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "user_password_manager";

    let userPasswordManager: UserPasswordManager;

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
                DatabaseModule,
                GlobalModule,
                HypermediaModule,
                AuthorizationModule,
                AuthenticationModule,
            ],
            providers: [UserPasswordManager],
        })
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        userPasswordManager =
            module.get<UserPasswordManager>(UserPasswordManager);
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

    describe("UserPasswordManager", () => {
        it("should be defined", async () => {
            expect(userPasswordManager).toBeDefined();
        });
    });

    describe("create", () => {
        it("given valid user should create user password", async () => {
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

            const actual = await databaseConnection.query(
                `SELECT *
                 FROM authentication_user_password
                 WHERE user_id = ${userModel.id}`,
            );

            expect(actual.rows.length).toEqual(1);
        });
    });

    describe("delete", () => {
        it("given user password exists should delete user password", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../global",
                    "sql/createConfiguration.sql",
                ),
            );

            const user = await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING id",
            );
            await databaseConnection.query(
                `INSERT INTO authentication_user_password (user_id, password)
                 VALUES (${user.rows[0].id}, 'password')`,
            );

            await userPasswordManager.delete(user.rows[0].id);

            const actual = await databaseConnection.query(
                `SELECT *
                 FROM authentication_user_password
                 WHERE user_id = ${user.rows[0].id}`,
            );

            expect(actual.rows.length).toEqual(0);
        });
    });
});
