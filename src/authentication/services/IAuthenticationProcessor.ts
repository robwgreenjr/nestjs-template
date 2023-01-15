import { AuthenticationRequestState } from "../types/AuthenticationRequestState";

export interface IAuthenticationProcessor {
    validate(
        authorizationHeader: string,
        sessionData?: AuthenticationRequestState | null,
    ): Promise<AuthenticationRequestState | null>;
}
