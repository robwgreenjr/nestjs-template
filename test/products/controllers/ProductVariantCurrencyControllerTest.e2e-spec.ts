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

describe("ProductVariantCurrencyController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "product_variant_currency_controller";

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

    describe("/product/variant-currencies (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "..",
                    "sql/createProductVariantCurrency.sql",
                ),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/product/variant-currencies",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/product/variant-currency/{id} (GET)", () => {
        it("given product variant currency id should return product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "..",
                    "sql/createProductVariantCurrency.sql",
                ),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_variant_currency
                                                           where price = 45.45;`);

            return app
                .inject({
                    method: "GET",
                    url: `/product/variant-currency/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].price).toBe(45.45);
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/product/variant-currency/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/product/variant-currency (POST)", () => {
        it("given new product should create product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            const productVariant = await databaseConnection.query(`SELECT *
                                                                   FROM product_variant
                                                                   where sku = 'sku';`);

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            const productCurrency = await databaseConnection.query(`SELECT *
                                                                    FROM product_currency
                                                                    WHERE value = 'currency';`);

            await app.inject({
                method: "POST",
                url: "/product/variant-currency",
                payload: {
                    price: 45.45,
                    productVariant: {
                        id: productVariant.rows[0].id,
                    },
                    productCurrency: {
                        id: productCurrency.rows[0].id,
                    },
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_variant_currency
                                                           WHERE price = 45.45;`);

            expect(result.rows.length).toBe(1);
        });

        it("given new product without price should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            const productVariant = await databaseConnection.query(`SELECT *
                                                                   FROM product_variant
                                                                   where sku = 'sku';`);

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            const productCurrency = await databaseConnection.query(`SELECT *
                                                                    FROM product_currency
                                                                    WHERE value = 'currency';`);

            return app
                .inject({
                    method: "POST",
                    url: "/product/variant-currency",
                    payload: {
                        price: null,
                        productVariant: {
                            id: productVariant.rows[0].id,
                        },
                        productCurrency: {
                            id: productCurrency.rows[0].id,
                        },
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/product/variant-currencies (POST)", () => {
        it("given list of new products should create all products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            const productVariantList = await databaseConnection.query(`SELECT *
                                                                       FROM product_variant;`);

            const productCurrencyList = await databaseConnection.query(`SELECT *
                                                                        FROM product_currency;`);

            const listOfProducts = [
                {
                    price: 45.45,
                    productVariant: {
                        id: productVariantList.rows[0].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[0].id,
                    },
                },
                {
                    price: 55.45,
                    productVariant: {
                        id: productVariantList.rows[1].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[1].id,
                    },
                },
                {
                    price: 65.45,
                    productVariant: {
                        id: productVariantList.rows[2].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[2].id,
                    },
                },
                {
                    price: 75.45,
                    productVariant: {
                        id: productVariantList.rows[3].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[3].id,
                    },
                },
                {
                    price: 85.45,
                    productVariant: {
                        id: productVariantList.rows[4].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[4].id,
                    },
                },
            ];

            await app.inject({
                method: "POST",
                url: "/product/variant-currencies",
                payload: listOfProducts,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant_currency
                                                         WHERE price = 45.45`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 55.45`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 65.45`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 75.45`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 85.45`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/variant-currency/1 (PUT)", () => {
        it("given updated values should update product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "..",
                    "sql/createProductVariantCurrency.sql",
                ),
            );

            const productCurrencyList = await databaseConnection.query(`SELECT *
                                                                        FROM product_currency;`);

            const productVariantList = await databaseConnection.query(`SELECT *
                                                                       FROM product_variant;`);

            const productVariantCurrency =
                await databaseConnection.query(`SELECT *
                                                FROM product_variant_currency
                                                where price = 45.45;`);

            await app.inject({
                method: "PUT",
                url: `/product/variant-currency/${productVariantCurrency.rows[0].id}`,
                payload: {
                    price: 45.45,
                    productVariant: {
                        id: productVariantList.rows[0].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[0].id,
                    },
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_variant_currency
                                                           WHERE price = 45.45;`);

            expect(result.rows[0].price).toBe(45.45);
        });
    });

    describe("/product/variant-currencies (PUT)", () => {
        it("given list of updated products should update existing products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductCurrency.sql"),
            );

            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "..",
                    "sql/createProductVariantCurrency.sql",
                ),
            );

            const productVariantList = await databaseConnection.query(`SELECT *
                                                                       FROM product_variant;`);

            const productCurrencyList = await databaseConnection.query(`SELECT *
                                                                        FROM product_currency;`);

            const productVariantCurrencyList =
                await databaseConnection.query(`SELECT *
                                                FROM product_variant_currency;`);

            const listOfProductVariantCurrencies = [
                {
                    id: productVariantCurrencyList.rows[0].id,
                    price: 45.55,
                    productVariant: {
                        id: productVariantList.rows[0].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[0].id,
                    },
                },
                {
                    id: productVariantCurrencyList.rows[1].id,
                    price: 55.65,
                    productVariant: {
                        id: productVariantList.rows[1].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[1].id,
                    },
                },
                {
                    id: productVariantCurrencyList.rows[2].id,
                    price: 65.75,
                    productVariant: {
                        id: productVariantList.rows[2].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[2].id,
                    },
                },
                {
                    id: productVariantCurrencyList.rows[3].id,
                    price: 75.85,
                    productVariant: {
                        id: productVariantList.rows[3].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[3].id,
                    },
                },
                {
                    id: productVariantCurrencyList.rows[4].id,
                    price: 85.95,
                    productVariant: {
                        id: productVariantList.rows[4].id,
                    },
                    productCurrency: {
                        id: productCurrencyList.rows[4].id,
                    },
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/product/variant-currencies",
                payload: listOfProductVariantCurrencies,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant_currency
                                                         WHERE price = 45.55`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 55.65`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 65.75`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 75.85`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 85.95`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/variant-currency/1 (DELETE)", () => {
        it("given deleted product should remove product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(
                    __dirname,
                    "..",
                    "sql/createProductVariantCurrency.sql",
                ),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant_currency
                                                         where price = 45.45;`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/product/variant-currency/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant_currency
                                                     WHERE price = 45.55;`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing product should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/product/variant-currency/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
