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

describe("ProductVariantController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "product_variant_controller";

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

    describe("/product/variants (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/product/variants",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/product/variant/{id} (GET)", () => {
        it("given product variant id should return product variant", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_variant
                                                           where sku = 'sku';`);

            return app
                .inject({
                    method: "GET",
                    url: `/product/variant/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].sku).toBe("sku");
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/product/variant/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/product/variant (POST)", () => {
        it("given new product variant should create product variant", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            const product = await databaseConnection.query(`SELECT *
                                                            FROM product
                                                            where pid = 'pid';`);

            await app.inject({
                method: "POST",
                url: "/product/variant",
                payload: {
                    product: {
                        id: product.rows[0].id,
                    },
                    sku: "sku",
                    url: "test.com",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_variant
                                                           WHERE sku = 'sku'`);

            expect(result.rows.length).toBe(1);
        });

        it("given new product without sku should return 400", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            const product = await databaseConnection.query(`SELECT *
                                                            FROM product
                                                            where pid = 'pid';`);

            return app
                .inject({
                    method: "POST",
                    url: "/product/variant",
                    payload: {
                        product: {
                            id: product.rows[0].id,
                        },
                        sku: null,
                        url: "test.com",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/product/variants (POST)", () => {
        it("given list of new products should create all products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProducts.sql"),
            );

            const productList = await databaseConnection.query(`SELECT *
                                                                FROM product;`);

            const listOfProductVariants = [
                {
                    product: {
                        id: productList.rows[0].id,
                    },
                    sku: "sku",
                    url: "test.com",
                },
                {
                    product: {
                        id: productList.rows[1].id,
                    },
                    sku: "sku2",
                    url: "test2.com",
                },
                {
                    product: {
                        id: productList.rows[2].id,
                    },
                    sku: "sku3",
                    url: "test3.com",
                },
                {
                    product: {
                        id: productList.rows[3].id,
                    },
                    sku: "sku4",
                    url: "test4.com",
                },
                {
                    product: {
                        id: productList.rows[4].id,
                    },
                    sku: "sku5",
                    url: "test5.com",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/product/variants",
                payload: listOfProductVariants,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant
                                                         WHERE sku = 'sku'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku2'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku3'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku4'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku5'`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/variant/1 (PUT)", () => {
        it("given updated values should update product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant
                                                         where sku = 'sku';`);

            const product = await databaseConnection.query(`SELECT *
                                                            FROM product
                                                            where pid = 'pid';`);

            await app.inject({
                method: "PUT",
                url: `/product/variant/${result.rows[0].id}`,
                payload: {
                    product: {
                        id: product.rows[0].id,
                    },
                    sku: "sku",
                    url: "test.com",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku'`);

            expect(result.rows[0].sku).toBe("sku");
        });
    });

    describe("/product/variants (PUT)", () => {
        it("given list of updated products should update existing products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant;`);

            const productList = await databaseConnection.query(`SELECT *
                                                                FROM product;`);

            const listOfProductVariants = [
                {
                    id: result.rows[0].id,
                    product: {
                        id: productList.rows[0].id,
                    },
                    sku: "update sku",
                    url: "test.com",
                },
                {
                    id: result.rows[1].id,
                    product: {
                        id: productList.rows[1].id,
                    },
                    sku: "update sku2",
                    url: "test2.com",
                },
                {
                    id: result.rows[2].id,
                    product: {
                        id: productList.rows[2].id,
                    },
                    sku: "update sku3",
                    url: "test3.com",
                },
                {
                    id: result.rows[3].id,
                    product: {
                        id: productList.rows[3].id,
                    },
                    sku: "update sku4",
                    url: "test4.com",
                },
                {
                    id: result.rows[4].id,
                    product: {
                        id: productList.rows[4].id,
                    },
                    sku: "update sku5",
                    url: "test5.com",
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/product/variants",
                payload: listOfProductVariants,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'update sku'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'update sku2'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'update sku3'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'update sku4'`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'update sku5'`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/variant/1 (DELETE)", () => {
        it("given deleted product should remove product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductVariant.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_variant
                                                         WHERE sku = 'sku';`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/product/variant/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_variant
                                                     WHERE sku = 'sku';`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing product should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/product/variant/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
