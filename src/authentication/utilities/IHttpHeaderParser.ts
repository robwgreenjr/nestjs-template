export interface IHttpHeaderParser {
    getBearerToken(authorizationHeader: string): string;
}