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
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { TestDatabase } from "../../enums/TestDatabase";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { UsersModule } from "../../../src/users/UsersModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";

describe("UserController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "user_controller";

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
                UsersModule,
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

    describe("/users (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });

        it("given email parameter should return correct user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?email=ctesting3@gmail.com",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "ctesting3@gmail.com",
                    );
                });
        });

        it("given 2 values exist should return correct users", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'blue', 'tester.blue@gmail.com', '555-515-5555') RETURNING *",
            );
            await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'green', 'tester.green@gmail.com', '555-525-5555') RETURNING *",
            );
            await databaseConnection.query(
                "INSERT INTO user_simple (first_name, last_name, email, phone)  VALUES ('tester', 'orange', 'tester.orange@gmail.com', '555-535-5555') RETURNING *",
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?sort_by=asc(id)&[or]firstName[like]=tester[or]lastName[like]=tester[or]email[like]=tester[or]phone[like]=tester",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(3);
                });
        });

        it("given first name parameter should return correct user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?firstName=first_name2",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].firstName).toBe(
                        "first_name2",
                    );
                });
        });

        it("given phone parameter should return correct user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?phone=555-555-5554",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].phone).toBe(
                        "555-555-5554",
                    );
                });
        });

        it("given email and phone parameter should return correct user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?email=ctesting3@gmail.com&phone=555-555-5553",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].phone).toBe(
                        "555-555-5553",
                    );
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "ctesting3@gmail.com",
                    );
                });
        });

        it("given invalid email parameter should return empty list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?email=test",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(0);
                });
        });

        it("given email asc sort parameter should return asc sorted list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?sort_by=asc(email)",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "atesting@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[1].email).toBe(
                        "btesting2@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[2].email).toBe(
                        "ctesting3@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[3].email).toBe(
                        "dtesting4@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[4].email).toBe(
                        "etesting5@gmail.com",
                    );
                });
        });

        it("given email desc sort parameter should return asc sorted list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?sort_by=desc(email)",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                    expect(JSON.parse(result.body).data[4].email).toBe(
                        "atesting@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[3].email).toBe(
                        "btesting2@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[2].email).toBe(
                        "ctesting3@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[1].email).toBe(
                        "dtesting4@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "etesting5@gmail.com",
                    );
                });
        });

        it("given limit parameter should return limited list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?sort_by=desc(email)&limit=2",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(2);
                    expect(JSON.parse(result.body).data[1].email).toBe(
                        "dtesting4@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "etesting5@gmail.com",
                    );
                });
        });

        it("given limit and offset parameter should return correct list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/users?sort_by=desc(email)&limit=2&offset=1",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(2);
                    expect(JSON.parse(result.body).data[1].email).toBe(
                        "ctesting3@gmail.com",
                    );
                    expect(JSON.parse(result.body).data[0].email).toBe(
                        "dtesting4@gmail.com",
                    );
                });
        });
    });

    describe("/user/{id} (GET)", () => {
        it("given user id should return user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           where first_name = 'first_name';`);

            return app
                .inject({
                    method: "GET",
                    url: `/user/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].firstName).toBe(
                        "first_name",
                    );
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/user/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/user (POST)", () => {
        it("given new user should create user", async () => {
            await app.inject({
                method: "POST",
                url: "/user",
                payload: {
                    firstName: "Created User",
                    lastName: "lastName",
                    email: "createdUser@gmail.com",
                    phone: "555-555-5555",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           WHERE email = 'createdUser@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User");
        });

        it("given empty strings with null values should set values as null", async () => {
            await app.inject({
                method: "POST",
                url: "/user",
                payload: {
                    firstName: "Created User",
                    lastName: "",
                    email: "createdUser@gmail.com",
                    phone: "",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           WHERE email = 'createdUser@gmail.com'`);

            expect(result.rows[0].last_name).toBeNull();
            expect(result.rows[0].phone).toBeNull();
        });

        it("given last name should update last name", async () => {
            await app.inject({
                method: "POST",
                url: "/user",
                payload: {
                    firstName: "Created User",
                    lastName: "Updated",
                    email: "createdUser@gmail.com",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           WHERE email = 'createdUser@gmail.com'`);

            expect(result.rows[0].last_name).toBe("Updated");
        });

        it("given null createdOn should still store date values", async () => {
            await app.inject({
                method: "POST",
                url: "/user",
                payload: {
                    firstName: "Created User",
                    lastName: "Last Name",
                    email: "createdUser@gmail.com",
                    phone: "555-555-5555",
                    createdOn: null,
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           WHERE email = 'createdUser@gmail.com'`);

            expect(result.rows[0].created_on).not.toBeNull();
        });

        it("given new user without email should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/user",
                    payload: {
                        firstName: "Created User",
                        lastName: "lastName",
                        email: null,
                        phone: "555-555-5555",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given new user without name should return 400", async () => {
            return await app
                .inject({
                    method: "POST",
                    url: "/user",
                    payload: {
                        firstName: null,
                        lastName: "lastName",
                        email: "createdUser@gmail.com",
                        phone: "555-555-5555",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given duplicate user should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            return await app
                .inject({
                    method: "POST",
                    url: "/user",
                    payload: {
                        firstName: "first_name",
                        lastName: "last_name",
                        email: "atesting@gmail.com",
                        phone: "555-555-5555",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/users (POST)", () => {
        it("given list of new users should create all users", async () => {
            const listOfUsers = [
                {
                    firstName: "Created User",
                    lastName: "lastName",
                    email: "createdUser@gmail.com",
                    phone: "555-555-5551",
                },
                {
                    firstName: "Created User2",
                    lastName: "lastName2",
                    email: "createdUser2@gmail.com",
                    phone: "555-555-5552",
                },
                {
                    firstName: "Created User3",
                    lastName: "lastName3",
                    email: "createdUser3@gmail.com",
                    phone: "555-555-5553",
                },
                {
                    firstName: "Created User4",
                    lastName: "lastName4",
                    email: "createdUser4@gmail.com",
                    phone: "555-555-5554",
                },
                {
                    firstName: "Created User5",
                    lastName: "lastName5",
                    email: "createdUser5@gmail.com",
                    phone: "555-555-5555",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/users",
                payload: listOfUsers,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM user_simple
                                                         WHERE email = 'createdUser@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'createdUser2@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'createdUser3@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'createdUser4@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'createdUser5@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Created User5");
        });
    });

    describe("/user/1 (PUT)", () => {
        it("given updated values should update user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM user_simple
                                                         where first_name = 'first_name';`);

            await app.inject({
                method: "PUT",
                url: `/user/${result.rows[0].id}`,
                payload: {
                    firstName: "Updated User",
                    lastName: "lastName",
                    email: "updatedUser@gmail.com",
                    phone: "555-555-5555",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User");
        });

        it("given update should create updateOn value", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM user_simple
                                                         where first_name = 'first_name';`);

            await app.inject({
                method: "PUT",
                url: `/user/${result.rows[0].id}`,
                payload: {
                    firstName: "Updated User",
                    lastName: "lastName",
                    email: "updatedUser@gmail.com",
                    phone: "555-555-5555",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser@gmail.com'`);

            expect(result.rows[0].updated_on).not.toBeNull();
        });
    });

    describe("/users (PUT)", () => {
        it("given list of updated users should update existing users", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM user_simple;`);

            const listOfUsers = [
                {
                    id: result.rows[0].id,
                    firstName: "Updated User",
                    lastName: "lastName",
                    email: "updatedUser@gmail.com",
                    phone: result.rows[0].phone,
                },
                {
                    id: result.rows[1].id,
                    firstName: "Updated User2",
                    lastName: "lastName2",
                    email: "updatedUser2@gmail.com",
                    phone: result.rows[1].phone,
                },
                {
                    id: result.rows[2].id,
                    firstName: "Updated User3",
                    lastName: "lastName3",
                    email: "updatedUser3@gmail.com",
                    phone: result.rows[2].phone,
                },
                {
                    id: result.rows[3].id,
                    firstName: "Updated User4",
                    lastName: "lastName4",
                    email: "updatedUser4@gmail.com",
                    phone: result.rows[3].phone,
                },
                {
                    id: result.rows[4].id,
                    firstName: "Updated User5",
                    lastName: "lastName5",
                    email: "updatedUser5@gmail.com",
                    phone: result.rows[4].phone,
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/users",
                payload: listOfUsers,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser2@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser3@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser4@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE email = 'updatedUser5@gmail.com'`);

            expect(result.rows[0].first_name).toBe("Updated User5");
        });
    });

    describe("/user/1 (DELETE)", () => {
        it("given deleted user should remove user", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createUser.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM user_simple
                                                         where first_name = 'first_name';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/user/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM user_simple
                                                     WHERE first_name = 'first_name'`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing user should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/user/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
