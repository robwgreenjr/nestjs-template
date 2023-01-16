import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";

describe("ConfigurationController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "configuration_controller";

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

    describe("/configuration/{key} (GET)", () => {
        it("given configuration key should return configuration", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createConfiguration.sql"),
            );

            return app
                .inject({
                    method: "GET",
                    url: "/configuration/JWT_SECRET",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).data[0].value).toBe(
                        "for testing",
                    );
                });
        });

        it("when requesting none existing entity should return 404 status code", async () => {
            return app
                .inject({
                    method: "GET",
                    url: "/configuration/JWT_SECRET",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(404);
                });
        });
    });

    describe("/configuration/{key} (PUT)", () => {
        it("given updated values should update configuration", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createConfiguration.sql"),
            );

            await app.inject({
                method: "PUT",
                url: "/configuration",
                payload: {
                    key: "JWT_SECRET",
                    value: "updated value",
                },
            });

            const result = await databaseConnection.query(`SELECT *
                                                           FROM configuration
                                                           WHERE key = 'JWT_SECRET'`);

            expect(result.rows[0].value).toBe("updated value");
        });
    });
});
