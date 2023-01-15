import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { ScheduleModule } from "@nestjs/schedule";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Configuration as ConfigurationCore } from "@mikro-orm/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { User } from "./users/entities/User";
import { Permission } from "./authorization/entities/Permission";
import { Role } from "./authorization/entities/Role";
import { ResetPasswordToken } from "./authentication/entities/ResetPasswordToken";
import { UserPassword } from "./authentication/entities/UserPassword";
import { Configuration } from "./global/entities/Configuration";
import { ApiKey } from "./authentication/entities/ApiKey";
import { DatabaseOptions } from "./database/types/DatabaseOptions";
import { GlobalModule } from "./global/GlobalModule";
import { DatabaseModule } from "./database/DatabaseModule";
import { HypermediaModule } from "./hypermedia/HypermediaModule";
import { UsersModule } from "./users/UsersModule";
import { AuthorizationModule } from "./authorization/AuthorizationModule";
import { AuthenticationModule } from "./authentication/AuthenticationModule";
import { HealthCheckModule } from "./health-check/HealthCheckModule";

export const entities = [
    User,
    Permission,
    Role,
    ResetPasswordToken,
    UserPassword,
    Configuration,
    ApiKey,
];

export const globalModules = (databaseOptions: DatabaseOptions) => {
    return [
        AutomapperModule.forRoot({
            strategyInitializer: mikro(),
            namingConventions: new CamelCaseNamingConvention(),
        }),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        MikroOrmModule.forRoot({
            type:
                (process.env
                    .DATABASE_TYPE as keyof typeof ConfigurationCore.PLATFORMS) ??
                "postgresql",
            host: databaseOptions.host,
            port: databaseOptions.port,
            dbName: databaseOptions.name,
            user: databaseOptions.user,
            password: databaseOptions.password,
            entities,
            allowGlobalContext: true,
        }),
        GlobalModule,
        DatabaseModule,
        HypermediaModule,
        UsersModule,
        AuthorizationModule,
        AuthenticationModule,
        HealthCheckModule,
    ];
};
