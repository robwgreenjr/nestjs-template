import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import * as path from "path";
import {
    buildDatabase,
    entities,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { TestDatabase } from "../../enums/TestDatabase";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { UsersModule } from "../../../src/users/UsersModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";

describe("ApiKeyController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "api_key_controller";

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
                UsersModule,
                AuthenticationModule,
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

    describe("/authentication/api-keys (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createApiKey.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authentication/api-keys",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/authentication/api-key/{id} (GET)", () => {
        it("given api key id should return api key", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createApiKey.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authentication_api_key
                                                           where role_id =
                                                                 (SELECT id from authorization_role WHERE name = 'aname');`);

            return app
                .inject({
                    method: "GET",
                    url: `/authentication/api-key/${result.rows[0].id}`,
                })
                .then((response) => {
                    expect(JSON.parse(response.body).data[0].role.id).toBe(
                        result.rows[0].role_id,
                    );
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/authentication/api-key/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/authentication/api-key (POST)", () => {
        it("given new api key should create api key", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../global",
                    "sql/createConfiguration.sql",
                ),
            );

            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            const authorizationRole = await databaseConnection.query(`SELECT id
                                                                      from authorization_role
                                                                      WHERE name = 'dname4';`);

            const response = await app.inject({
                method: "POST",
                url: "/authentication/api-key",
                payload: {
                    role: authorizationRole.rows[0],
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authentication_api_key
                                                           WHERE id = ${
                                                               JSON.parse(
                                                                   response.body,
                                                               ).data[0].id
                                                           }`);

            expect(result.rows[0].key.length).toBe(60);
        });

        it("given null key value should store new api key", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            const authorizationRole = await databaseConnection.query(`SELECT id
                                                                      from authorization_role
                                                                      WHERE name = 'dname4';`);

            await app.inject({
                method: "POST",
                url: "/authentication/api-key",
                payload: {
                    key: null,
                    role: {
                        id: authorizationRole.rows[0].id,
                    },
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authentication_api_key
                                                           WHERE role_id = ${authorizationRole.rows[0].id}`);

            expect(result.rows.length).toBe(1);
        });

        it("given new api key without role should return 400", async () => {
            return await app
                .inject({
                    method: "POST",
                    url: "/authentication/api-key",
                    payload: {
                        key: "testing-api-key",
                        role: null,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/authentication/api-key/{id} (PUT)", () => {
        it("given updated values should update api key", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createApiKey.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authentication_api_key
                                                         where role_id =
                                                               (SELECT id from authorization_role WHERE name = 'aname');`);

            const authorizationRole = await databaseConnection.query(`SELECT id
                                                                      from authorization_role
                                                                      WHERE name = 'dname4';`);

            await app.inject({
                method: "PUT",
                url: `/authentication/api-key/${result.rows[0].id}`,
                payload: {
                    key: result.rows[0].key,
                    role: {
                        id: authorizationRole.rows[0].id,
                    },
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authentication_api_key
                                                     where id = ${result.rows[0].id};`);

            expect(result.rows[0].role_id).toBe(authorizationRole.rows[0].id);
        });
    });

    describe("/authentication/api-key/{id} (DELETE)", () => {
        it("given deleted api key should remove api key", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "../../authorization",
                    "sql/createRole.sql",
                ),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createApiKey.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authentication_api_key
                                                         where role_id =
                                                               (SELECT id from authorization_role WHERE name = 'aname');`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/authentication/api-key/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authentication_api_key
                                                     WHERE id = ${result.rows[0].id}`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing api key should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/authentication/api-key/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
