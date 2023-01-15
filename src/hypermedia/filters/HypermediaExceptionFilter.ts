import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

@Catch(HttpException)
export class HypermediaExceptionFilter implements ExceptionFilter {
    async catch(exception: HttpException, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse<FastifyReply>();
        const request = context.getRequest<GlobalRequest>();

        response.status(exception.getStatus()).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
            links: {
                self: {
                    href:
                        (request.raw as unknown as GlobalRequest).backendUrl +
                        request.url,
                    rel: request.raw.url?.split("?")[0].replace("/", ""),
                    type: request.method,
                },
            },
            errors: [
                {
                    error: exception.name,
                    message: exception.message,
                },
            ],
            data: [],
        });
    }
}
