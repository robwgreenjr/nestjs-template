import { Injectable } from "@nestjs/common";
import { IHttpHeaderParser } from "./IHttpHeaderParser";

export const HTTP_HEADER_PARSER = "HTTP_HEADER_PARSER";

@Injectable()
export class HttpHeaderParser implements IHttpHeaderParser {
    getBearerToken(authorizationHeader: string): string {
        if (!authorizationHeader) return "";

        const verifyForm = authorizationHeader.split("Bearer ");
        if (verifyForm.length !== 2) return "";

        return verifyForm[1];
    }
}
