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
import { ProductsModule } from "../../../src/products/ProductsModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";

describe("ProductController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "product_controller";

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
                ProductsModule,
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

    describe("/products (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/products",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/product/{id} (GET)", () => {
        it("given product id should return product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product
                                                           where pid = 'pid';`);

            return app
                .inject({
                    method: "GET",
                    url: `/product/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].pid).toBe("pid");
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/product/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/product (POST)", () => {
        it("given new product should create product", async () => {
            await app.inject({
                method: "POST",
                url: "/product",
                payload: {
                    pid: "pid",
                    name: "name",
                    url: "url.com",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product
                                                           WHERE pid = 'pid'`);

            expect(result.rows[0].name).toBe("name");
        });

        it("given new product without pid should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/product",
                    payload: {
                        pid: null,
                        name: "name",
                        url: "url.com",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given new product without name should return 400", async () => {
            return await app
                .inject({
                    method: "POST",
                    url: "/product",
                    payload: {
                        pid: "pid",
                        name: null,
                        url: "url.com",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given duplicate product should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            return await app
                .inject({
                    method: "POST",
                    url: "/product",
                    payload: {
                        pid: "pid",
                        name: "name",
                        url: "url.com",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/products (POST)", () => {
        it("given list of new products should create all products", async () => {
            const listOfProducts = [
                {
                    pid: "Created Product",
                    name: "name",
                    url: "createdProduct@gmail.com",
                },
                {
                    pid: "Created Product2",
                    name: "name2",
                    url: "createdProduct2@gmail.com",
                },
                {
                    pid: "Created Product3",
                    name: "name3",
                    url: "createdProduct3@gmail.com",
                },
                {
                    pid: "Created Product4",
                    name: "name4",
                    url: "createdProduct4@gmail.com",
                },
                {
                    pid: "Created Product5",
                    name: "name5",
                    url: "createdProduct5@gmail.com",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/products",
                payload: listOfProducts,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product
                                                         WHERE url = 'createdProduct@gmail.com'`);

            expect(result.rows[0].pid).toBe("Created Product");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'createdProduct2@gmail.com'`);

            expect(result.rows[0].pid).toBe("Created Product2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'createdProduct3@gmail.com'`);

            expect(result.rows[0].pid).toBe("Created Product3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'createdProduct4@gmail.com'`);

            expect(result.rows[0].pid).toBe("Created Product4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'createdProduct5@gmail.com'`);

            expect(result.rows[0].pid).toBe("Created Product5");
        });
    });

    describe("/product/1 (PUT)", () => {
        it("given updated values should update product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product
                                                         where pid = 'pid';`);

            await app.inject({
                method: "PUT",
                url: `/product/${result.rows[0].id}`,
                payload: {
                    pid: "Updated Product",
                    name: "name",
                    url: "updatedProduct@gmail.com",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product");
        });

        it("given update should create updateOn value", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product
                                                         where pid = 'pid';`);

            await app.inject({
                method: "PUT",
                url: `/product/${result.rows[0].id}`,
                payload: {
                    pid: "Updated Product",
                    name: "name",
                    url: "updatedProduct@gmail.com",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct@gmail.com'`);

            expect(result.rows[0].updated_on).not.toBeNull();
        });
    });

    describe("/products (PUT)", () => {
        it("given list of updated products should update existing products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product;`);

            const listOfProducts = [
                {
                    id: result.rows[0].id,
                    pid: "Updated Product",
                    name: "name",
                    url: "updatedProduct@gmail.com",
                },
                {
                    id: result.rows[1].id,
                    pid: "Updated Product2",
                    name: "name2",
                    url: "updatedProduct2@gmail.com",
                },
                {
                    id: result.rows[2].id,
                    pid: "Updated Product3",
                    name: "name3",
                    url: "updatedProduct3@gmail.com",
                },
                {
                    id: result.rows[3].id,
                    pid: "Updated Product4",
                    name: "name4",
                    url: "updatedProduct4@gmail.com",
                },
                {
                    id: result.rows[4].id,
                    pid: "Updated Product5",
                    name: "name5",
                    url: "updatedProduct5@gmail.com",
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/products",
                payload: listOfProducts,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct2@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct3@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct4@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE url = 'updatedProduct5@gmail.com'`);

            expect(result.rows[0].pid).toBe("Updated Product5");
        });
    });

    describe("/product/1 (DELETE)", () => {
        it("given deleted product should remove product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product
                                                         where pid = 'pid';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/product/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product
                                                     WHERE pid = 'pid'`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing product should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/product/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
