import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { globalModules } from "./AppImports";
import { CreateAdminAccount } from "./authentication/commands/CreateAdminAccount";
import { CreatePassword } from "./authentication/commands/CreatePassword";
import { AuthenticationVerifier } from "./authentication/middleware/AuthenticationVerifier";

import {
    EnvironmentSetter,
    EnvironmentSetter as BackupEnvironmentSetter,
} from "./EnvironmentSetter";

@Module({
    imports: [
        ...globalModules({
            host: process.env.DATABASE_HOST as string,
            port: parseInt(process.env.DATABASE_PORT as string),
            user: process.env.DATABASE_USER as string,
            password: process.env.DATABASE_PASSWORD as string,
            name: process.env.DATABASE_NAME as string,
        }),
    ],
    controllers: [],
    providers: [CreatePassword, CreateAdminAccount],
    exports: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(EnvironmentSetter)
            .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
        // Not sure why but for some reason having 1 environment setter
        // will stop working after second request
        consumer
            .apply(BackupEnvironmentSetter)
            .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
        consumer
            .apply(AuthenticationVerifier)
            .forRoutes({ path: "(.*)", method: RequestMethod.ALL });
    }
}
