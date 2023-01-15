import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { HypermediaExceptionFilter } from "../../../src/hypermedia/filters/HypermediaExceptionFilter";
import {
    buildDatabase,
    entities,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { TestDatabase } from "../../enums/TestDatabase";
import { UserPasswordManager } from "../../../src/authentication/services/UserPasswordManager";
import { SimpleUserLogin } from "../../../src/authentication/services/SimpleUserLogin";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { UserModel } from "../../../src/users/models/UserModel";
import { UserPasswordModel } from "../../../src/authentication/models/UserPasswordModel";

describe("JwtController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "jwt_controller";

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
                    entities,
                }),
                AutomapperModule.forRoot({
                    strategyInitializer: mikro(),
                    namingConventions: new CamelCaseNamingConvention(),
                }),
                EventEmitterModule.forRoot(),
                DatabaseModule,
                GlobalModule,
                HypermediaModule,
                AuthorizationModule,
                AuthenticationModule,
            ],
            providers: [UserPasswordManager, SimpleUserLogin],
        })
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );
        app.useGlobalFilters(new HypermediaExceptionFilter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        userPasswordManager =
            module.get<UserPasswordManager>(UserPasswordManager);
        simpleUserLogin = module.get<SimpleUserLogin>(SimpleUserLogin);
    });

    beforeEach(async () => {
        await runSqlScript(
            databaseConnection,
            path.join(__dirname, "../../", "sql/truncateDatabase.sql"),
        );

        await runSqlScript(
            databaseConnection,
            path.join(__dirname, "../../global", "sql/createConfiguration.sql"),
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

    describe("SimpleUserLogin", () => {
        it("should be defined", async () => {
            expect(simpleUserLogin).toBeDefined();
        });
    });

    describe("/authentication/jwt (GET)", () => {
        it("given valid JWT should return user details", async () => {
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

            return app
                .inject({
                    method: "GET",
                    url: "/authentication/jwt",
                    headers: {
                        Authorization: "Bearer " + jwtModel.token,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "tester.blue@gmail.com",
                    );
                });
        });

        it("given invalid JWT should return 401", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/authentication/jwt",
                    headers: {
                        Authorization: "Bearer " + "token",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(401);
                });
        });

        it("given expired JWT should return error array", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/authentication/jwt",
                    headers: {
                        Authorization: "Bearer " + "token",
                    },
                })
                .then((result) => {
                    expect(JSON.parse(result.body).errors).toBeDefined();
                    expect(JSON.parse(result.body).errors.length).toBe(1);
                });
        });
    });

    describe("/authentication/jwt (POST)", () => {
        it("given valid credentials should return token", async () => {
            const user = await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING *",
            );

            const userModel = new UserModel();
            userModel.id = user.rows[0].id;
            const userPasswordModel = new UserPasswordModel();
            userPasswordModel.user = userModel;
            userPasswordModel.password = "password";

            await userPasswordManager.create(userPasswordModel);

            return app
                .inject({
                    method: "POST",
                    url: "/authentication/jwt",
                    payload: {
                        email: "tester.blue@gmail.com",
                        password: "password",
                    },
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].token).toBeDefined();
                    expect(
                        JSON.parse(result.body).data[0].token,
                    ).not.toBeNull();
                });
        });

        it("given invalid credentials should return 401", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/authentication/jwt",
                    payload: {
                        email: "invalid@email.com",
                        password: "password",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(401);
                });
        });

        it("given invalid credentials should return error array", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/authentication/jwt",
                    payload: {
                        email: "invalid@email.com",
                        password: "password",
                    },
                })
                .then((result) => {
                    expect(JSON.parse(result.body).errors).toBeDefined();
                    expect(JSON.parse(result.body).errors.length).toBe(1);
                });
        });
    });
});
