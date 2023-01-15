import { Inject, Injectable, NestMiddleware, Req } from "@nestjs/common";
import { ServerResponse } from "http";
import { JWT_DECIPHER } from "../services/JwtDecipher";
import { IAuthenticationProcessor } from "../services/IAuthenticationProcessor";
import { API_KEY_SPECIALIST } from "../helpers/ApiKeySpecialist";
import { IApiKeySpecialist } from "../helpers/IApiKeySpecialist";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

@Injectable()
export class AuthenticationVerifier implements NestMiddleware {
    constructor(
        @Inject(JWT_DECIPHER)
        private readonly jwtDecipher: IAuthenticationProcessor,
        @Inject(API_KEY_SPECIALIST)
        private readonly apiKeySpecialist: IApiKeySpecialist,
    ) {}

    async use(
        @Req() request: GlobalRequest,
        response: ServerResponse,
        next: () => void,
    ) {
        try {
            const apiKeyScopes = await this.apiKeySpecialist.validate(
                request.headers.authorization ?? "",
            );

            if (apiKeyScopes) {
                request.scopeList = apiKeyScopes;

                next();
            }
        } catch (exception) {
            // ..
        }

        try {
            const jwtRequestState = await this.jwtDecipher.validate(
                request.headers.authorization ?? "",
            );

            request.userId = jwtRequestState?.userId;
            request.scopeList = jwtRequestState?.scopeList ?? "";

            next();
        } catch (exception: any) {
            // ..
        }
    }
}
