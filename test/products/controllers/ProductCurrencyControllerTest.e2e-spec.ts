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

describe("ProductCurrencyController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "product_currency_controller";

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

    describe("/product/currencies (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/product/currencies",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/product/currency/{id} (GET)", () => {
        it("given product id should return product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_currency
                                                           where value = 'currency';`);

            return app
                .inject({
                    method: "GET",
                    url: `/product/currency/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].value).toBe(
                        "currency",
                    );
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/product/currency/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/product/currency (POST)", () => {
        it("given new product should create product", async () => {
            await app.inject({
                method: "POST",
                url: "/product/currency",
                payload: {
                    value: "currency",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_currency
                                                           WHERE value = 'currency'`);

            expect(result.rows[0].value).toBe("currency");
        });

        it("given new product without value should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/product/currency",
                    payload: {
                        value: null,
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });

        it("given duplicate product should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            return await app
                .inject({
                    method: "POST",
                    url: "/product/currency",
                    payload: {
                        value: "currency",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/product/currencies (POST)", () => {
        it("given list of new products should create all products", async () => {
            const listOfProducts = [
                {
                    value: "currency",
                },
                {
                    value: "currency2",
                },
                {
                    value: "currency3",
                },
                {
                    value: "currency4",
                },
                {
                    value: "currency5",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/product/currencies",
                payload: listOfProducts,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_currency
                                                         WHERE value = 'currency'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'currency2'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'currency3'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'currency4'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'currency5'`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/currency/1 (PUT)", () => {
        it("given updated values should update product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_currency
                                                         where value = 'currency';`);

            await app.inject({
                method: "PUT",
                url: `/product/currency/${result.rows[0].id}`,
                payload: {
                    value: "Update currency",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency'`);

            expect(result.rows[0].value).toBe("Update currency");
        });

        it("given update should create updateOn value", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_currency
                                                         where value = 'currency';`);

            await app.inject({
                method: "PUT",
                url: `/product/currency/${result.rows[0].id}`,
                payload: {
                    value: "Update currency",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency'`);

            expect(result.rows[0].updated_on).not.toBeNull();
        });
    });

    describe("/product/currencies (PUT)", () => {
        it("given list of updated products should update existing products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_currency;`);

            const listOfProducts = [
                {
                    id: result.rows[0].id,
                    value: "Update currency",
                },
                {
                    id: result.rows[1].id,
                    value: "Update currency2",
                },
                {
                    id: result.rows[2].id,
                    value: "Update currency3",
                },
                {
                    id: result.rows[3].id,
                    value: "Update currency4",
                },
                {
                    id: result.rows[4].id,
                    value: "Update currency5",
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/product/currencies",
                payload: listOfProducts,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency'`);

            expect(result.rows[0].value).toBe("Update currency");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency2'`);

            expect(result.rows[0].value).toBe("Update currency2");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency3'`);

            expect(result.rows[0].value).toBe("Update currency3");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency4'`);

            expect(result.rows[0].value).toBe("Update currency4");

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'Update currency5'`);

            expect(result.rows[0].value).toBe("Update currency5");
        });
    });

    describe("/product/currency/1 (DELETE)", () => {
        it("given deleted product should remove product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_currency
                                                         where value = 'currency';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/product/currency/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_currency
                                                     WHERE value = 'currency'`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing product should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/product/currency/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
