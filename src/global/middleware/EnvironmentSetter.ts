import { Injectable, NestMiddleware, Req } from "@nestjs/common";
import { ServerResponse } from "http";
import { ConfigService } from "@nestjs/config";
import { GlobalRequest } from "../interfaces/GlobalRequest";

@Injectable()
export class EnvironmentSetter implements NestMiddleware {
    constructor(private readonly configService: ConfigService) {}

    async use(
        @Req() request: GlobalRequest,
        response: ServerResponse,
        next: () => void,
    ) {
        try {
            request.backendUrl =
                (await this.configService.get<string>("BACKEND_URL")) ?? "";

            request.environment =
                (await this.configService.get<string>("ENV")) ?? "";

            next();
        } catch (exception) {
            // ..
        }
    }
}
