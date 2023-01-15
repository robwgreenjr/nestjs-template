import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { UserPasswordManager } from "../../../src/authentication/services/UserPasswordManager";
import { ResetPasswordTokenManager } from "../../../src/authentication/services/ResetPasswordTokenManager";
import { SimpleUserLogin } from "../../../src/authentication/services/SimpleUserLogin";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { UserModel } from "../../../src/users/models/UserModel";
import { UserPasswordModel } from "../../../src/authentication/models/UserPasswordModel";
import { ResetPasswordTokenModel } from "../../../src/authentication/models/ResetPasswordTokenModel";

describe("PasswordManagementController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "password_management_controller";

    let userPasswordManager: UserPasswordManager;
    let resetPasswordTokenManager: ResetPasswordTokenManager;
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
            providers: [
                UserPasswordManager,
                ResetPasswordTokenManager,
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

        userPasswordManager =
            module.get<UserPasswordManager>(UserPasswordManager);
        resetPasswordTokenManager = module.get<ResetPasswordTokenManager>(
            ResetPasswordTokenManager,
        );
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

    describe("UserPasswordManager", () => {
        it("should be defined", async () => {
            expect(userPasswordManager).toBeDefined();
        });
    });

    describe("ResetPasswordTokenManager", () => {
        it("should be defined", async () => {
            expect(resetPasswordTokenManager).toBeDefined();
        });
    });

    describe("SimpleUserLogin", () => {
        it("should be defined", async () => {
            expect(simpleUserLogin).toBeDefined();
        });
    });

    describe("/authentication/password (PUT)", () => {
        it("given valid change password should change password", async () => {
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

            await app.inject({
                method: "PUT",
                url: "/authentication/password",
                payload: {
                    password: "passwords",
                    passwordConfirmation: "passwords",
                    emailConfirmation: "tester.blue@gmail.com",
                    passwordCurrent: "password",
                },
            });

            const actual = await simpleUserLogin.login(
                "tester.blue@gmail.com",
                "passwords",
            );

            expect(actual.password).not.toBeNull();
        });
    });

    describe("/authentication/password/forgot (POST)", () => {
        it("given valid forgot password should create reset password", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../global",
                    "sql/createConfiguration.sql",
                ),
            );

            await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-555-5555') RETURNING *",
            );

            await app
                .inject({
                    method: "POST",
                    url: "/authentication/password/forgot",
                    payload: {
                        email: "tester.blue@gmail.com",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toEqual(201);
                });

            const actual = await resetPasswordTokenManager.findByUserEmail(
                "tester.blue@gmail.com",
            );

            expect(actual).not.toBeNull();
        });
    });

    describe("/authentication/password/reset (POST)", () => {
        it("given valid reset password should update password", async () => {
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

            let resetPasswordTokenModel = new ResetPasswordTokenModel();
            resetPasswordTokenModel.user = userModel;

            resetPasswordTokenModel = await resetPasswordTokenManager.create(
                resetPasswordTokenModel,
            );

            await app.inject({
                method: "POST",
                url: "/authentication/password/reset",
                payload: {
                    token: resetPasswordTokenModel.token,
                    password: "passwords",
                    passwordConfirmation: "passwords",
                },
            });

            const actual = await simpleUserLogin.login(
                "tester.blue@gmail.com",
                "passwords",
            );

            expect(actual.password).not.toBeNull();
        });

        it("given no current password should create password", async () => {
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

            let resetPasswordTokenModel = new ResetPasswordTokenModel();
            resetPasswordTokenModel.user = userModel;

            resetPasswordTokenModel = await resetPasswordTokenManager.create(
                resetPasswordTokenModel,
            );

            await app.inject({
                method: "POST",
                url: "/authentication/password/reset",
                payload: {
                    token: resetPasswordTokenModel.token,
                    password: "passwords",
                    passwordConfirmation: "passwords",
                },
            });

            const actual = await simpleUserLogin.login(
                "tester.blue@gmail.com",
                "passwords",
            );

            expect(actual.password).not.toBeNull();
        });
    });
});
