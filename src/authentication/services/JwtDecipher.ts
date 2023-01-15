import { Inject, Injectable } from "@nestjs/common";
import { IAuthenticationProcessor } from "./IAuthenticationProcessor";
import { AuthenticationRequestState } from "../types/AuthenticationRequestState";
import { IHttpHeaderParser } from "../utilities/IHttpHeaderParser";
import { IJwtSpecialist } from "../helpers/IJwtSpecialist";
import { JWT_SPECIALIST } from "../helpers/JwtSpecialist";
import { HTTP_HEADER_PARSER } from "../utilities/HttpHeaderParser";

export const JWT_DECIPHER = "JWT_DECIPHER";

@Injectable()
export class JwtDecipher implements IAuthenticationProcessor {
    constructor(
        @Inject(HTTP_HEADER_PARSER)
        private readonly httpHeaderParser: IHttpHeaderParser,
        @Inject(JWT_SPECIALIST)
        private readonly jwtSpecialist: IJwtSpecialist,
    ) {}

    async validate(
        authorizationHeader: string,
        sessionData: AuthenticationRequestState | null = {},
    ): Promise<AuthenticationRequestState | null> {
        if (sessionData === null) sessionData = {};

        const bearerToken =
            this.httpHeaderParser.getBearerToken(authorizationHeader);
        if (!bearerToken) return sessionData;

        try {
            const userDetails: Partial<any> = await this.jwtSpecialist.validate(
                bearerToken,
            );

            sessionData["userId"] = userDetails.id;
            sessionData["scopeList"] = userDetails.scopeList;
        } catch (exception) {
            // If this fails we do nothing because a user may
            // be using another method of authentication
        }

        if (typeof sessionData.scopeList === "undefined") {
            sessionData.scopeList = "";
        }

        if (typeof sessionData.userId === "undefined") {
            sessionData.userId = -1;
        }

        return sessionData;
    }
}
