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

describe("ProductPromotionController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "product_promotion_controller";

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

    describe("/product/promotions (GET)", () => {
        it("when requested should return list of 5 entities", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/product/promotions",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data.length).toBe(5);
                });
        });
    });

    describe("/product/promotion/{id} (GET)", () => {
        it("given product id should return product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_promotion
                                                           where percentage = 10;`);

            return app
                .inject({
                    method: "GET",
                    url: `/product/promotion/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].percentage).toBe(10);
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/product/promotion/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/product/promotion (POST)", () => {
        it("given new product should create product", async () => {
            await app.inject({
                method: "POST",
                url: "/product/promotion",
                payload: {
                    percentage: 10,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM product_promotion
                                                           WHERE percentage = 10`);

            expect(result.rows[0].percentage).toBe(10);
        });

        it("given new product without percentage should return 400", async () => {
            return app
                .inject({
                    method: "POST",
                    url: "/product/promotion",
                    payload: {
                        percentage: null,
                        active: true,
                        startOn: "2023-01-04 14:02:04.612 -0500",
                        endOn: "2023-01-04 14:02:04.612 -0500",
                    },
                })
                .then((result) => {
                    expect(result.statusCode).toBe(400);
                });
        });
    });

    describe("/product/promotions (POST)", () => {
        it("given list of new products should create all products", async () => {
            const listOfProducts = [
                {
                    percentage: 10,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    percentage: 20,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    percentage: 30,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    percentage: 40,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    percentage: 50,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
            ];

            await app.inject({
                method: "POST",
                url: "/product/promotions",
                payload: listOfProducts,
            });

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_promotion
                                                         WHERE percentage = 10`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 20`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 30`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 40`);

            expect(result.rows.length).toBe(1);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 50`);

            expect(result.rows.length).toBe(1);
        });
    });

    describe("/product/promotion/1 (PUT)", () => {
        it("given updated values should update product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_promotion
                                                         where percentage = 10;`);

            await app.inject({
                method: "PUT",
                url: `/product/promotion/${result.rows[0].id}`,
                payload: {
                    percentage: 15,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 15`);

            expect(result.rows[0].percentage).toBe(15);
        });

        it("given update should create updateOn value", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_promotion
                                                         where percentage = 10;`);

            await app.inject({
                method: "PUT",
                url: `/product/promotion/${result.rows[0].id}`,
                payload: {
                    percentage: 15,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 15`);

            expect(result.rows[0].updated_on).not.toBeNull();
        });
    });

    describe("/product/promotions (PUT)", () => {
        it("given list of updated products should update existing products", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_promotion;`);

            const listOfProducts = [
                {
                    id: result.rows[0].id,
                    percentage: 15,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    id: result.rows[1].id,
                    percentage: 25,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    id: result.rows[2].id,
                    percentage: 35,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    id: result.rows[3].id,
                    percentage: 45,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
                {
                    id: result.rows[4].id,
                    percentage: 55,
                    active: true,
                    startOn: "2023-01-04 14:02:04.612 -0500",
                    endOn: "2023-01-04 14:02:04.612 -0500",
                },
            ];

            await app.inject({
                method: "PUT",
                url: "/product/promotions",
                payload: listOfProducts,
            });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 15`);

            expect(result.rows[0].percentage).toBe(15);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 25`);

            expect(result.rows[0].percentage).toBe(25);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 35`);

            expect(result.rows[0].percentage).toBe(35);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 45`);

            expect(result.rows[0].percentage).toBe(45);

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 55`);

            expect(result.rows[0].percentage).toBe(55);
        });
    });

    describe("/product/promotion/1 (DELETE)", () => {
        it("given deleted product should remove product", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createProductPromotion.sql"),
            );

            let result = await databaseConnection.query(`SELECT *
                                                         FROM product_promotion
                                                         where percentage = 10;`);

            await app
                .inject({
                    method: "DELETE",
                    url: `/product/promotion/${result.rows[0].id}`,
                })
                .then((result) => {
                    expect(result.statusCode).toBe(200);
                });

            result = await databaseConnection.query(`SELECT *
                                                     FROM product_promotion
                                                     WHERE percentage = 10;`);

            expect(result.rows.length).toBe(0);
        });

        it("given deleted non existing product should return 404", async () => {
            return await app
                .inject({
                    method: "DELETE",
                    url: "/product/promotion/1",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });
});
