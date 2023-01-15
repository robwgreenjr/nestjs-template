import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { HYPERMEDIA_PROCESSOR } from "../helpers/HypermediaProcessor";
import { IHypermediaProcessor } from "../helpers/IHypermediaProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { QueryResponse } from "../models/QueryResponse";

@Injectable()
export class HypermediaInterceptor implements NestInterceptor {
    constructor(
        @Inject(HYPERMEDIA_PROCESSOR)
        private readonly hypermediaProcessor: IHypermediaProcessor,
    ) {}

    private static camelCaseToNormal(string: string): string {
        return string
            .trim()
            .replace(/\w\S*/g, function (str) {
                return str.charAt(0).toUpperCase() + str.substr(1);
            })
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
            .replace(" ", "_")
            .toLowerCase();
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request: GlobalRequest = context.switchToHttp().getRequest();

        const relationship = HypermediaInterceptor.camelCaseToNormal(
            context.getClass().name.split("Controller")[0],
        );

        request.hypermediaState = {
            relationship,
            links: [],
        };

        return next.handle().pipe(
            map((response) => {
                if (response instanceof QueryResponse) {
                    return this.hypermediaProcessor.build({
                        request,
                        queryResponse: response,
                        relationship: request.hypermediaState.relationship,
                    });
                }

                if (typeof response !== "undefined") {
                    return this.hypermediaProcessor.build({
                        request,
                        relationship: request.hypermediaState.relationship,
                        data: response,
                    });
                }

                return this.hypermediaProcessor.build({
                    request,
                    relationship: request.hypermediaState.relationship,
                });
            }),
        );
    }
}
