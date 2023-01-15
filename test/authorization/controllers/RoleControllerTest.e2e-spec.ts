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
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";

describe("RoleController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "role_controller";

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

    describe("/authorization/roles (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authorization/roles",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });

        it("when filter on permission should return correct role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authorization/roles?permissions.name=dname4",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(1);
                });
        });

        it("given no roles when request should return empty list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "../../", "sql/truncateDatabase.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/authorization/roles",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(0);
                });
        });
    });

    describe("/authorization/role/{id} (GET)", () => {
        it("given role id should return role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_role
                                                           where name = 'aname';`);

            return app
                .inject({
                    method: "GET",
                    url: `/authorization/role/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].name).toBe("aname");
                });
        });

        it("given role id should return role with permissions", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_role
                                                           where name = 'aname';`);

            return app
                .inject({
                    method: "GET",
                    url: `/authorization/role/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(
                        JSON.parse(result.body).data[0].permissions,
                    ).toBeDefined();
                    expect(
                        JSON.parse(result.body).data[0].permissions.length,
                    ).toBe(1);
                    expect(
                        JSON.parse(result.body).data[0].permissions[0].name,
                    ).toBe("aname");
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/authorization/role/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/authorization/role (POST)", () => {
        it("given new role should create role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUsersPermissions.sql"),
            );

            const users = await databaseConnection.query(`SELECT *
                                                          FROM user_simple;`);

            const permissions = await databaseConnection.query(`SELECT *
                                                                FROM authorization_permission;`);

            await app.inject({
                method: "POST",
                url: "/authorization/role",
                payload: {
                    name: "Created Role",
                    description: "Testing this out.",
                    permissions: [permissions.rows[0]],
                    users: [
                        {
                            id: users.rows[0].id,
                            firstName: users.rows[0].first_name,
                            lastName: users.rows[0].last_name,
                            email: users.rows[0].email,
                            phone: users.rows[0].phone,
                            createdOn: users.rows[0].created_on,
                            updatedOn: users.rows[0].updated_on,
                        },
                    ],
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_role_user
                                                           WHERE user_id = ${users.rows[0].id}`);

            expect(result.rows.length).toBe(1);
        });

        it("given new role without name should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/authorization/role",
                    payload: {
                        name: undefined,
                        description: "Testing this out.",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given duplicate role should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            return app
                .inject({
                    method: "POST",
                    url: "/authorization/role",
                    payload: {
                        name: "aname",
                        description: "Testing this out.",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/authorization/roles (POST)", () => {
        it("given list of new roles should create all roles", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUsersPermissions.sql"),
            );

            const users = await databaseConnection.query(`SELECT *
                                                          FROM user_simple;`);

            const permissions = await databaseConnection.query(`SELECT *
                                                                FROM authorization_permission;`);

            const listOfRoles = [
                {
                    name: "Created Role",
                    description: "Testing this out.",
                    permissions: [permissions.rows[0]],
                    users: [
                        {
                            id: users.rows[0].id,
                            firstName: users.rows[0].first_name,
                            lastName: users.rows[0].last_name,
                            email: users.rows[0].email,
                            phone: users.rows[0].phone,
                            createdOn: users.rows[0].created_on,
                            updatedOn: users.rows[0].updated_on,
                        },
                    ],
                },
                {
                    name: "Created Role2",
                    description: "Testing this out.",
                    permissions: [permissions.rows[1]],
                    users: [
                        {
                            id: users.rows[1].id,
                            firstName: users.rows[1].first_name,
                            lastName: users.rows[1].last_name,
                            email: users.rows[1].email,
                            phone: users.rows[1].phone,
                            createdOn: users.rows[1].created_on,
                            updatedOn: users.rows[1].updated_on,
                        },
                    ],
                },
                {
                    name: "Created Role3",
                    description: "Testing this out.",
                    permissions: [permissions.rows[2]],
                    users: [
                        {
                            id: users.rows[2].id,
                            firstName: users.rows[2].first_name,
                            lastName: users.rows[2].last_name,
                            email: users.rows[2].email,
                            phone: users.rows[2].phone,
                            createdOn: users.rows[2].created_on,
                            updatedOn: users.rows[2].updated_on,
                        },
                    ],
                },
                {
                    name: "Created Role4",
                    description: "Testing this out.",
                    permissions: [permissions.rows[3]],
                    users: [
                        {
                            id: users.rows[3].id,
                            firstName: users.rows[3].first_name,
                            lastName: users.rows[3].last_name,
                            email: users.rows[3].email,
                            phone: users.rows[3].phone,
                            createdOn: users.rows[3].created_on,
                            updatedOn: users.rows[3].updated_on,
                        },
                    ],
                },
                {
                    name: "Created Role5",
                    description: "Testing this out.",
                    permissions: [permissions.rows[4]],
                    users: [
                        {
                            id: users.rows[4].id,
                            firstName: users.rows[4].first_name,
                            lastName: users.rows[4].last_name,
                            email: users.rows[4].email,
                            phone: users.rows[4].phone,
                            createdOn: users.rows[4].created_on,
                            updatedOn: users.rows[4].updated_on,
                        },
                    ],
                },
            ];

            await app.inject({
                method: "POST",
                url: "/authorization/roles",
                payload: listOfRoles,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_role
                                                         WHERE name = 'Created Role'`);

            expect(result.rows[0].name).toBe("Created Role");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Created Role2'`);

            expect(result.rows[0].name).toBe("Created Role2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Created Role3'`);

            expect(result.rows[0].name).toBe("Created Role3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Created Role4'`);

            expect(result.rows[0].name).toBe("Created Role4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Created Role5'`);

            expect(result.rows[0].name).toBe("Created Role5");
        });
    });

    describe("/authorization/role/1 (PUT)", () => {
        it("given updated values should update role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_role
                                                         where name = 'aname';`);

            const users = await databaseConnection.query(`SELECT *
                                                          FROM user_simple;`);

            const permissions = await databaseConnection.query(`SELECT *
                                                                FROM authorization_permission;`);

            await app.inject({
                method: "PUT",
                url: `/authorization/role/${result.rows[0].id}`,
                payload: {
                    name: "Updated Name",
                    description: "Testing this out.",
                    permissions: [permissions.rows[0]],
                    users: [
                        {
                            id: users.rows[3].id,
                            firstName: users.rows[3].first_name,
                            lastName: users.rows[3].last_name,
                            email: users.rows[3].email,
                            phone: users.rows[3].phone,
                            createdOn: users.rows[3].created_on,
                            updatedOn: users.rows[3].updated_on,
                        },
                    ],
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role_user
                                                     WHERE user_id = ${users.rows[3].id}
                                                       AND role_id = ${result.rows[0].id}`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/authorization/roles (PUT)", () => {
        it("given list of updated roles should update existing roles", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_role;`);

            const users = await databaseConnection.query(`SELECT *
                                                          FROM user_simple;`);

            const permissions = await databaseConnection.query(`SELECT *
                                                                FROM authorization_permission;`);

            const listOfRoles = [
                {
                    id: result.rows[0].id,
                    name: "Updated Role",
                    description: "Testing this out.",
                    permissions: [permissions.rows[0]],
                    users: [
                        {
                            id: users.rows[0].id,
                            firstName: users.rows[0].first_name,
                            lastName: users.rows[0].last_name,
                            email: users.rows[0].email,
                            phone: users.rows[0].phone,
                            createdOn: users.rows[0].created_on,
                            updatedOn: users.rows[0].updated_on,
                        },
                    ],
                },
                {
                    id: result.rows[1].id,
                    name: "Updated Role2",
                    description: "Testing this out.",
                    permissions: [permissions.rows[1]],
                    users: [
                        {
                            id: users.rows[1].id,
                            firstName: users.rows[1].first_name,
                            lastName: users.rows[1].last_name,
                            email: users.rows[1].email,
                            phone: users.rows[1].phone,
                            createdOn: users.rows[1].created_on,
                            updatedOn: users.rows[1].updated_on,
                        },
                    ],
                },
                {
                    id: result.rows[2].id,
                    name: "Updated Role3",
                    description: "Testing this out.",
                    permissions: [permissions.rows[2]],
                    users: [
                        {
                            id: users.rows[2].id,
                            firstName: users.rows[2].first_name,
                            lastName: users.rows[2].last_name,
                            email: users.rows[2].email,
                            phone: users.rows[2].phone,
                            createdOn: users.rows[2].created_on,
                            updatedOn: users.rows[2].updated_on,
                        },
                    ],
                },
                {
                    id: result.rows[3].id,
                    name: "Updated Role4",
                    description: "Testing this out.",
                    permissions: [permissions.rows[3]],
                    users: [
                        {
                            id: users.rows[3].id,
                            firstName: users.rows[3].first_name,
                            lastName: users.rows[3].last_name,
                            email: users.rows[3].email,
                            phone: users.rows[3].phone,
                            createdOn: users.rows[3].created_on,
                            updatedOn: users.rows[3].updated_on,
                        },
                    ],
                },
                {
                    id: result.rows[4].id,
                    name: "Updated Role5",
                    description: "Testing this out.",
                    permissions: [permissions.rows[4]],
                    users: [
                        {
                            id: users.rows[4].id,
                            firstName: users.rows[4].first_name,
                            lastName: users.rows[4].last_name,
                            email: users.rows[4].email,
                            phone: users.rows[4].phone,
                            createdOn: users.rows[4].created_on,
                            updatedOn: users.rows[4].updated_on,
                        },
                    ],
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/authorization/roles",
                payload: listOfRoles,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Updated Role'`);

            expect(result.rows[0].name).toBe("Updated Role");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Updated Role2'`);

            expect(result.rows[0].name).toBe("Updated Role2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Updated Role3'`);

            expect(result.rows[0].name).toBe("Updated Role3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Updated Role4'`);

            expect(result.rows[0].name).toBe("Updated Role4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'Updated Role5'`);

            expect(result.rows[0].name).toBe("Updated Role5");
        });
    });

    describe("/authorization/role/1 (DELETE)", () => {
        it("given deleted role should remove role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM authorization_role
                                                         where name = 'aname';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/authorization/role/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM authorization_role
                                                     WHERE name = 'aname'`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing role should return 404", async () => {
            return app
                .inject({
                    method: "DELETE",
                    url: "/authorization/role/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
