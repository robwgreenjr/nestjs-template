import {
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt/dist/jwt.service";
import { CONFIGURATION_MANAGER } from "../../global/services/ConfigurationManager";
import { IConfigurationManager } from "../../global/services/IConfigurationManager";
import { UserModel } from "../../users/models/UserModel";
import { ConfigurationVariables } from "../../global/enums/ConfigurationVariables";
import { IJwtSpecialist } from "./IJwtSpecialist";

export const JWT_SPECIALIST = "JWT_SPECIALIST";

@Injectable()
export class JwtSpecialist implements IJwtSpecialist {
    constructor(
        private readonly nestJwtService: NestJwtService,
        @Inject(CONFIGURATION_MANAGER)
        private readonly configurationManager: IConfigurationManager,
    ) {}

    async generate(userModel: UserModel, scopeList: string): Promise<string> {
        const jwtSecret = await this.configurationManager.findByKey(
            ConfigurationVariables.JWT_SECRET,
        );
        if (!jwtSecret) {
            throw new InternalServerErrorException("JWT secret isn't set.");
        }

        const jwtExpiration = await this.configurationManager.findByKey(
            ConfigurationVariables.JWT_EXPIRATION,
        );

        if (!jwtExpiration) {
            throw new InternalServerErrorException("JWT expiration isn't set.");
        }

        try {
            return this.nestJwtService.sign(
                {
                    ...userModel,
                    scopeList,
                },
                {
                    secret: jwtSecret.value,
                    expiresIn: jwtExpiration.value,
                },
            );
        } catch (exception) {
            throw new InternalServerErrorException("Error creating jwt token.");
        }
    }

    async validate(token: string): Promise<any> {
        const jwtSecret = await this.configurationManager.findByKey(
            ConfigurationVariables.JWT_SECRET,
        );
        if (!jwtSecret) {
            throw new InternalServerErrorException("JWT secret isn't set.");
        }

        try {
            return await this.nestJwtService.verify(token ?? "", {
                secret: jwtSecret.value,
            });
        } catch (exception) {
            throw new UnauthorizedException("Your token isn't valid.");
        }
    }
}
