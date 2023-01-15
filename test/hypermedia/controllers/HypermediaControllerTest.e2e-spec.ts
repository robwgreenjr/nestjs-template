import { Test, TestingModule } from "@nestjs/testing";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
    HttpStatus,
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AuthorizationGuard } from "../../../src/authorization/guards/AuthorizationGuard";
import { HypermediaExceptionFilter } from "../../../src/hypermedia/filters/HypermediaExceptionFilter";
import { mikroOrmConfig } from "../../helpers/DatabaseConfigurations";
import { TestDatabase } from "../../enums/TestDatabase";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { UsersModule } from "../../../src/users/UsersModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../../../src/authentication/AuthenticationModule";
import { EnvironmentSetter } from "../../../src/global/middleware/EnvironmentSetter";
import { AuthenticationVerifier } from "../../../src/authentication/middleware/AuthenticationVerifier";
import { TestController } from "../../TestController";

describe("HypermediaController (e2e)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    const databaseName = "hypermedia_controller";

    const configService = {
        get(key: string) {
            if (key === "BACKEND_URL") {
                return process.env.BACKEND_URL;
            }
            return "";
        },
    };

    beforeAll(async () => {
        @Module({
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
                UsersModule,
                HypermediaModule,
                AuthorizationModule,
                AuthenticationModule,
            ],
            providers: [],
            controllers: [TestController],
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
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        app.useGlobalGuards(new AuthorizationGuard());
        app.useGlobalFilters(new HypermediaExceptionFilter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("/test (GET)", () => {
        it("route should exist and return 200", async () => {
            jest.spyOn(configService, "get").mockImplementation((key) => {
                if (key === "BACKEND_URL") {
                    return process.env.BACKEND_URL;
                } else if (key === "ENV") {
                    return "test";
                }

                return "";
            });

            return app
                .inject({
                    method: "GET",
                    url: "/test",
                })
                .then((result) => {
                    expect(result.statusCode).toBe(HttpStatus.OK);
                });
        });

        it("when exception thrown should provide valid links.self.href", async () => {
            jest.spyOn(configService, "get").mockImplementation((key) => {
                if (key === "BACKEND_URL") {
                    return process.env.BACKEND_URL;
                } else if (key === "ENV") {
                    return "prod";
                }

                return "";
            });

            return app
                .inject({
                    method: "GET",
                    url: "/test",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.self.href).toBe(
                        process.env.BACKEND_URL + "/test",
                    );
                });
        });

        it("when exception thrown should provide valid links.self.rel", async () => {
            jest.spyOn(configService, "get").mockImplementation((key) => {
                if (key === "BACKEND_URL") {
                    return process.env.BACKEND_URL;
                } else if (key === "ENV") {
                    return "prod";
                }

                return "";
            });

            return app
                .inject({
                    method: "GET",
                    url: "/test",
                })
                .then((result) => {
                    expect(JSON.parse(result.body).links.self.rel).toBe("test");
                });
        });
    });
});
