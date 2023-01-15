import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { JwtModule } from "@nestjs/jwt";
import { AwsModule } from "../aws/AwsModule";
import { AuthenticationMapper } from "./mappers/AuthenticationMapper";
import {
    HTTP_HEADER_PARSER,
    HttpHeaderParser,
} from "./utilities/HttpHeaderParser";
import { JWT_SPECIALIST, JwtSpecialist } from "./helpers/JwtSpecialist";
import {
    AUTHENTICATION_EMAIL_PROVIDER,
    AuthenticationEmailProvider,
} from "./helpers/AuthenticationEmailProvider";
import {
    RESET_PASSWORD_TOKEN_REPOSITORY,
    ResetPasswordTokenRepository,
} from "./repositories/ResetPasswordTokenRepository";
import {
    USER_PASSWORD_REPOSITORY,
    UserPasswordRepository,
} from "./repositories/UserPasswordRepository";
import {
    API_KEY_REPOSITORY,
    ApiKeyRepository,
} from "./repositories/ApiKeyRepository";
import {
    USER_PASSWORD_MANAGER,
    UserPasswordManager,
} from "./services/UserPasswordManager";
import { API_KEY_MANAGER, ApiKeyManager } from "./services/ApiKeyManager";
import { JWT_DECIPHER, JwtDecipher } from "./services/JwtDecipher";
import {
    PASSWORD_MANAGEMENT,
    PasswordManagement,
} from "./services/PasswordManagement";
import { SIMPLE_USER_LOGIN, SimpleUserLogin } from "./services/SimpleUserLogin";
import {
    RESET_PASSWORD_TOKEN_MANAGER,
    ResetPasswordTokenManager,
} from "./services/ResetPasswordTokenManager";
import { UsersModule } from "../users/UsersModule";
import { User } from "../users/entities/User";
import { Configuration } from "../global/entities/Configuration";
import { AuthorizationModule } from "../authorization/AuthorizationModule";
import { Role } from "../authorization/entities/Role";
import { ApiKeyController } from "./controllers/ApiKeyController";
import { JwtController } from "./controllers/JwtController";
import { PasswordManagementController } from "./controllers/PasswordManagementController";
import { CreatePassword } from "./commands/CreatePassword";
import { CreateAdminAccount } from "./commands/CreateAdminAccount";
import {
    API_KEY_SPECIALIST,
    ApiKeySpecialist,
} from "./helpers/ApiKeySpecialist";
import { SCOPE_PRODUCER, ScopeProducer } from "./helpers/ScopeProducer";
import { ResetPasswordToken } from "./entities/ResetPasswordToken";
import { UserPassword } from "./entities/UserPassword";
import { ApiKey } from "./entities/ApiKey";

const httpHeaderParser = {
    provide: HTTP_HEADER_PARSER,
    useClass: HttpHeaderParser,
};

const jwtSpecialist = {
    provide: JWT_SPECIALIST,
    useClass: JwtSpecialist,
};

const apiKeySpecialist = {
    provide: API_KEY_SPECIALIST,
    useClass: ApiKeySpecialist,
};

const scopeProducer = {
    provide: SCOPE_PRODUCER,
    useClass: ScopeProducer,
};

const authenticationEmailProvider = {
    provide: AUTHENTICATION_EMAIL_PROVIDER,
    useClass: AuthenticationEmailProvider,
};

const resetPasswordTokenRepository = {
    provide: RESET_PASSWORD_TOKEN_REPOSITORY,
    useClass: ResetPasswordTokenRepository,
};

const userPasswordRepository = {
    provide: USER_PASSWORD_REPOSITORY,
    useClass: UserPasswordRepository,
};

const apiKeyRepository = {
    provide: API_KEY_REPOSITORY,
    useClass: ApiKeyRepository,
};

const apiKeyManager = {
    provide: API_KEY_MANAGER,
    useClass: ApiKeyManager,
};

const resetPasswordTokenManager = {
    provide: RESET_PASSWORD_TOKEN_MANAGER,
    useClass: ResetPasswordTokenManager,
};

const userPasswordManager = {
    provide: USER_PASSWORD_MANAGER,
    useClass: UserPasswordManager,
};

const jwtDecipher = {
    provide: JWT_DECIPHER,
    useClass: JwtDecipher,
};

const passwordManagement = {
    provide: PASSWORD_MANAGEMENT,
    useClass: PasswordManagement,
};

const simpleUserLogin = {
    provide: SIMPLE_USER_LOGIN,
    useClass: SimpleUserLogin,
};

@Module({
    imports: [
        JwtModule,
        MikroOrmModule.forFeature([
            ResetPasswordToken,
            UserPassword,
            User,
            Configuration,
            ApiKey,
            Role,
        ]),
        AwsModule,
        UsersModule,
        AuthorizationModule,
    ],
    controllers: [
        JwtController,
        PasswordManagementController,
        ApiKeyController,
    ],
    providers: [
        jwtSpecialist,
        jwtDecipher,
        simpleUserLogin,
        passwordManagement,
        httpHeaderParser,
        authenticationEmailProvider,
        resetPasswordTokenRepository,
        userPasswordRepository,
        userPasswordManager,
        resetPasswordTokenManager,
        apiKeyRepository,
        apiKeyManager,
        apiKeySpecialist,
        scopeProducer,
        AuthenticationMapper,
        CreatePassword,
        CreateAdminAccount,
    ],
    exports: [
        jwtSpecialist,
        httpHeaderParser,
        userPasswordRepository,
        userPasswordManager,
        scopeProducer,
        jwtDecipher,
        apiKeySpecialist,
        resetPasswordTokenManager,
        resetPasswordTokenRepository,
    ],
})
export class AuthenticationModule {}
