import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    entities,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { UserPasswordManager } from "../../../src/authentication/services/UserPasswordManager";
import { SimpleUserLogin } from "../../../src/authentication/services/SimpleUserLogin";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { AuthorizationGuard } from "../../../src/authorization/guards/AuthorizationGuard";
import { HypermediaExceptionFilter } from "../../../src/hypermedia/filters/HypermediaExceptionFilter";
import { UserModel } from "../../../src/users/models/UserModel";
import { UserPasswordModel } from "../../../src/authentication/models/UserPasswordModel";
import { AuthenticationVerifier } from "../../../src/authentication/middleware/AuthenticationVerifier";
import { EnvironmentSetter } from "../../../src/global/middleware/EnvironmentSetter";

describe("AuthorizationE2E (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "authorization_e2e";

    let userPasswordManager: UserPasswordManager;
    let simpleUserLogin: SimpleUserLogin;

    const emitProvider = {
        emit: () => {},
        on: () => {},
        removeAllListeners: () => {},
    };

    const configService = {
        get(key: string) {
            if (key === "BACKEND_URL") {
                return process.env.BACKEND_URL;
            }
            return "";
        },
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

        @Module({
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
        class TestModule implements NestModule {
            configure(consumer: MiddlewareConsumer) {
                consumer
                    .apply(EnvironmentSetter)
                    .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
                consumer
                    .apply(AuthenticationVerifier)
                    .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
            }
        }

        module = await Test.createTestingModule({
            imports: [TestModule],
        })
            .overrideProvider(ConfigService)
            .useValue(configService)
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        app.useGlobalGuards(new AuthorizationGuard());
        app.useGlobalFilters(new HypermediaExceptionFilter());
        userPasswordManager =
            module.get<UserPasswordManager>(UserPasswordManager);
        simpleUserLogin = module.get<SimpleUserLogin>(SimpleUserLogin);

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
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

    describe("valid authorization", () => {
        it("given JWT with no roles should return 403", async () => {
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
                    url: "/users",
                    headers: {
                        Authorization: "Bearer " + jwtModel.token,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(403);
                });
        });

        it("given environment is test should return 200", async () => {
            jest.spyOn(configService, "get").mockImplementation((key) => {
                if (key === "BACKEND_URL") {
                    return process.env.BACKEND_URL;
                } else if (key === "ENV") {
                    return "test";
                }
                return "";
            });

            return app
                .inject({
                    method: "GET",
                    url: "/users",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });
        });

        it("given environment is local should return 200", async () => {
            jest.spyOn(configService, "get").mockImplementation(() => "local");

            return app
                .inject({
                    method: "GET",
                    url: "/users",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });
        });

        it("given environment is prod and no valid authentication should return 403", async () => {
            jest.spyOn(configService, "get").mockImplementation(() => "prod");

            return app
                .inject({
                    method: "GET",
                    url: "/users",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(403);
                });
        });

        it("given JWT with valid roles should return 200", async () => {
            const user = await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING *;",
            );

            const userModel = new UserModel();
            userModel.id = user.rows[0].id;
            const userPasswordModel = new UserPasswordModel();
            userPasswordModel.user = userModel;
            userPasswordModel.password = "password";

            await userPasswordManager.create(userPasswordModel);

            const permission = await databaseConnection.query(
                "INSERT INTO authorization_permission (name, type, description) VALUES ('users', 'read', 'description') RETURNING *;",
            );

            const role = await databaseConnection.query(
                "INSERT INTO authorization_role (name, description) VALUES ('admin', 'description') RETURNING *;",
            );

            await databaseConnection.query(
                `INSERT INTO authorization_role_permission (role_id, permission_id)
                 VALUES (${role.rows[0].id}, ${permission.rows[0].id})`,
            );

            await databaseConnection.query(
                `INSERT INTO authorization_role_user (role_id, user_id)
                 VALUES (${role.rows[0].id}, ${user.rows[0].id})`,
            );

            const jwtModel = await simpleUserLogin.jwtProvider(
                "tester.blue@gmail.com",
                "password",
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users",
                    headers: {
                        Authorization: "Bearer " + jwtModel.token,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });
        });

        it("given JWT with valid roles and calling users?offset=200 should return 200", async () => {
            const user = await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING *;",
            );

            const userModel = new UserModel();
            userModel.id = user.rows[0].id;
            const userPasswordModel = new UserPasswordModel();
            userPasswordModel.user = userModel;
            userPasswordModel.password = "password";

            await userPasswordManager.create(userPasswordModel);

            const permission = await databaseConnection.query(
                "INSERT INTO authorization_permission (name, type, description) VALUES ('users', 'read', 'description') RETURNING *;",
            );

            const role = await databaseConnection.query(
                "INSERT INTO authorization_role (name, description) VALUES ('admin', 'description') RETURNING *;",
            );

            await databaseConnection.query(
                `INSERT INTO authorization_role_permission (role_id, permission_id)
                     VALUES (${role.rows[0].id}, ${permission.rows[0].id})`,
            );

            await databaseConnection.query(
                `INSERT INTO authorization_role_user (role_id, user_id)
                     VALUES (${role.rows[0].id}, ${user.rows[0].id})`,
            );

            const jwtModel = await simpleUserLogin.jwtProvider(
                "tester.blue@gmail.com",
                "password",
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?offset=200",
                    headers: {
                        Authorization: "Bearer " + jwtModel.token,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });
        });
    });
});
