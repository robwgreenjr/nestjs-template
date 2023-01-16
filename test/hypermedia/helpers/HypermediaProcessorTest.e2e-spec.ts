import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { EntityManager } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";
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
import { UsersModule } from "../../../src/users/UsersModule";
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { AuthenticationVerifier } from "../../../src/authentication/middleware/AuthenticationVerifier";
import { EnvironmentSetter } from "../../../src/global/middleware/EnvironmentSetter";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { UserFactory } from "../../../database/seeders/factories/UserFactory";

describe("HypermediaProcessor (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let entityManager: EntityManager;
    let databaseConnection: Pool;
    const databaseName = "hypermedia_processor";

    const emitProvider = {
        emit: () => {},
        on: () => {},
        removeAllListeners: () => {},
    };

    const configService = {
        get(key: string) {
            if (key === "BACKEND_URL") {
                return process.env.BACKEND_URL;
            }

            return "";
        },
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

        @Module({
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
                UsersModule,
                HypermediaModule,
                AuthorizationModule,
                AuthenticationModule,
            ],
            providers: [],
        })
        class TestModule implements NestModule {
            configure(consumer: MiddlewareConsumer) {
                consumer
                    .apply(EnvironmentSetter)
                    .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
                consumer
                    .apply(AuthenticationVerifier)
                    .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
            }
        }

        module = await Test.createTestingModule({
            imports: [TestModule],
        })
            .overrideProvider(ConfigService)
            .useValue(configService)
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        entityManager = module.get<EntityManager>(EntityManager).fork();
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

    describe("build", () => {
        it("given 10 entities, 5 limit, and /users?limit=1&offset=0 should return /users?limit=1&offset=1", async () => {
            await new UserFactory(entityManager).create(10);

            return app
                .inject({
                    method: "GET",
                    url: "/users?limit=1&offset=0",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.next.href).toBe(
                        process.env.BACKEND_URL + "/users?limit=1&offset=1",
                    );
                });
        });

        it("given 20 entities, 6 limit, and /users?limit=6&offset=0 should return /users?limit=6&offset=6", async () => {
            await new UserFactory(entityManager).create(20);

            return app
                .inject({
                    method: "GET",
                    url: "/users?limit=6&offset=0",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.next.href).toBe(
                        process.env.BACKEND_URL + "/users?limit=6&offset=6",
                    );
                });
        });

        it("given 10 entities, 7 limit, and /users?limit=7&offset=4 should not return next link", async () => {
            await new UserFactory(entityManager).create(10);

            return app
                .inject({
                    method: "GET",
                    url: "/users?limit=7&offset=4",
                })
                .then((result) => {
                    expect(
                        JSON.parse(result.body).links.next,
                    ).not.toBeDefined();
                });
        });

        it("given 1000 entities and with 200 default limit and /users?offset=0 should return /users?offset=200", async () => {
            try {
                await new UserFactory(entityManager).create(1000);
            } catch (exception) {
                await new UserFactory(entityManager).create(1000);
            }

            return app
                .inject({
                    method: "GET",
                    url: "/users?offset=0",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.next.href).toBe(
                        process.env.BACKEND_URL + "/users?offset=200",
                    );
                });
        });

        it("given 1000 entities and with 200 default limit and /users?offset=200 should return /users?offset=401", async () => {
            try {
                await new UserFactory(entityManager).create(1000);
            } catch (exception) {
                await new UserFactory(entityManager).create(1000);
            }

            return app
                .inject({
                    method: "GET",
                    url: "/users?offset=200",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.next.href).toBe(
                        process.env.BACKEND_URL + "/users?offset=400",
                    );
                });
        });

        it("given 1000 entities should give access to a total of 1000 entities", async () => {
            try {
                await new UserFactory(entityManager).create(1000);
            } catch (exception) {
                await new UserFactory(entityManager).create(1000);
            }

            let result: any = await app.inject({
                method: "GET",
                url: "/users",
            });
            result = JSON.parse(result.body);

            let count = result.data.length;
            while (typeof result.links.next !== "undefined") {
                const response = await app.inject({
                    method: "GET",
                    url: result.links.next.href,
                });

                result = JSON.parse(response.body);
                count += result.data.length;
            }

            expect(count).toBe(1000);
        });
    });
});
