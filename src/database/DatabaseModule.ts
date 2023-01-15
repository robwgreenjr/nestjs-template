import { Global, Module } from "@nestjs/common";
import {
    DATABASE_EXCEPTION_HANDLER,
    DatabaseExceptionHandler
} from "./utilities/DatabaseExceptionHandler";
import { QUERY_BUILDER, QueryBuilder } from "./services/QueryBuilder";

const exceptionHandler = {
    provide: DATABASE_EXCEPTION_HANDLER,
    useClass: DatabaseExceptionHandler,
};

const queryBuilder = {
    provide: QUERY_BUILDER,
    useClass: QueryBuilder,
};


@Global()
@Module({
    providers: [queryBuilder, exceptionHandler],
    exports: [queryBuilder, exceptionHandler]
})
export class DatabaseModule {
}