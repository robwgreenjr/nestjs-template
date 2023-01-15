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
import {QueryResponse} from "../../global/models/QueryResponse";

@Injectable()
export class HypermediaInterceptor implements NestInterceptor {
    constructor(
        @Inject(HYPERMEDIA_PROCESSOR)
        private readonly hypermediaProcessor: IHypermediaProcessor,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request: GlobalRequest = context.switchToHttp().getRequest();

        request.hypermediaState = {
            links: [],
        };

        return next.handle().pipe(
            map((response) => {
                if (response instanceof QueryResponse) {
                    return this.hypermediaProcessor.build({
                        request,
                        queryResponse: response,
                    });
                }

                if (typeof response !== "undefined") {
                    return this.hypermediaProcessor.build({
                        request,
                        data: response,
                    });
                }

                return this.hypermediaProcessor.build({
                    request,
                });
            }),
        );
    }
}
