import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";

describe("PermissionController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "permission_controller";

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

    describe("/authorization/permissions (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authorization/permissions",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });

        it("given no permissions when request should return empty list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "../../", "sql/truncateDatabase.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authorization/permissions",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(0);
                });
        });
    });

    describe("/authorization/permission/{id} (GET)", () => {
        it("given permission id should return permission", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_permission
                                                           where name = 'aname';`);

            return app
                .inject({
                    method: "GET",
                    url: `/authorization/permission/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].name).toBe("aname");
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/authorization/permission/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/authorization/permission (POST)", () => {
        it("given new permission should create permission", async () => {
            await app.inject({
                method: "POST",
                url: "/authorization/permission",
                payload: {
                    name: "Created Permission",
                    type: "type",
                    description: "Testing this out.",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_permission
                                                           WHERE name = 'Created Permission'`);

            expect(result.rows.length).toBe(1);
        });

        it("given new permission without name should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/authorization/permission",
                    payload: {
                        name: undefined,
                        type: "type",
                        description: "Testing this out.",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given new permission without type should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/authorization/permission",
                    payload: {
                        name: "Created Permission",
                        type: undefined,
                        description: "Testing this out.",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given duplicate permission should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            return app
                .inject({
                    method: "POST",
                    url: "/authorization/permission",
                    payload: {
                        name: "aname",
                        type: "atype",
                        description: "Testing this out.",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/authorization/permissions (POST)", () => {
        it("given list of new permissions should create all permissions", async () => {
            const listOfPermissions = [
                {
                    name: "Created Permission",
                    type: "type",
                    description: "Testing this out.",
                },
                {
                    name: "Created Permission2",
                    type: "type2",
                    description: "Testing this out.",
                },
                {
                    name: "Created Permission3",
                    type: "type3",
                    description: "Testing this out.",
                },
                {
                    name: "Created Permission4",
                    type: "type4",
                    description: "Testing this out.",
                },
                {
                    name: "Created Permission5",
                    type: "type5",
                    description: "Testing this out.",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/authorization/permissions",
                payload: listOfPermissions,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_permission
                                                         WHERE name = 'Created Permission'`);

            expect(result.rows[0].name).toBe("Created Permission");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Created Permission2'`);

            expect(result.rows[0].name).toBe("Created Permission2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Created Permission3'`);

            expect(result.rows[0].name).toBe("Created Permission3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Created Permission4'`);

            expect(result.rows[0].name).toBe("Created Permission4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Created Permission5'`);

            expect(result.rows[0].name).toBe("Created Permission5");
        });
    });

    describe("/authorization/permission/1 (PUT)", () => {
        it("given updated values should update permission", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_permission
                                                         where name = 'aname';`);

            await app.inject({
                method: "PUT",
                url: `/authorization/permission/${result.rows[0].id}`,
                payload: {
                    name: "Updated Name",
                    type: "Updated Type",
                    description: "Testing this out.",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Name'`);

            expect(result.rows[0].name).toBe("Updated Name");
        });
    });

    describe("/authorization/permissions (PUT)", () => {
        it("given list of updated permissions should update existing permissions", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_permission;`);

            const listOfPermissions = [
                {
                    id: result.rows[0].id,
                    name: "Updated Permission",
                    type: "Updated type",
                    description: "Testing this out.",
                },
                {
                    id: result.rows[1].id,
                    name: "Updated Permission2",
                    type: "Updated type2",
                    description: "Testing this out.",
                },
                {
                    id: result.rows[2].id,
                    name: "Updated Permission3",
                    type: "Updated type3",
                    description: "Testing this out.",
                },
                {
                    id: result.rows[3].id,
                    name: "Updated Permission4",
                    type: "Updated type4",
                    description: "Testing this out.",
                },
                {
                    id: result.rows[4].id,
                    name: "Updated Permission5",
                    type: "Updated type5",
                    description: "Testing this out.",
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/authorization/permissions",
                payload: listOfPermissions,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Permission'`);

            expect(result.rows[0].name).toBe("Updated Permission");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Permission2'`);

            expect(result.rows[0].name).toBe("Updated Permission2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Permission3'`);

            expect(result.rows[0].name).toBe("Updated Permission3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Permission4'`);

            expect(result.rows[0].name).toBe("Updated Permission4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'Updated Permission5'`);

            expect(result.rows[0].name).toBe("Updated Permission5");
        });
    });

    describe("/authorization/permission/1 (DELETE)", () => {
        it("given deleted permission should remove permission", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createPermission.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_permission
                                                         where name = 'aname';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/authorization/permission/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_permission
                                                     WHERE name = 'aname'`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing permission should return 404", async () => {
            return app
                .inject({
                    method: "DELETE",
                    url: "/authorization/permission/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
