import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TestController } from "./TestController";
import { DatabaseModule } from "../src/database/DatabaseModule";
import { GlobalModule } from "../src/global/GlobalModule";
import { HypermediaModule } from "../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../src/authorization/AuthorizationModule";
import { AuthenticationModule } from "../src/authentication/AuthenticationModule";
import { EnvironmentSetter } from "../src/global/middleware/EnvironmentSetter";
import { AuthenticationVerifier } from "../src/authentication/middleware/AuthenticationVerifier";
import { entities, mikroOrmConfig } from "./helpers/DatabaseConfigurations";
import { TestDatabase } from "./enums/TestDatabase";

@Module({
    imports: [
        ...mikroOrmConfig({
            host: process.env.TEST_CONTAINER_HOST ?? "",
            port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
            user: TestDatabase.USER as string,
            password: TestDatabase.PASSWORD as string,
            name: "test_module",
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
        AuthorizationModule,
        AuthenticationModule,
    ],
    controllers: [TestController],
    providers: [],
})
export class TestModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(EnvironmentSetter)
            .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
        consumer
            .apply(AuthenticationVerifier)
            .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
    }
}
