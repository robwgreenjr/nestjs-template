import { QBFilterQuery } from "@mikro-orm/core";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryOptions } from "../types/QueryOptions";

export interface IQueryBuilder {
    find<T extends {}>(options: QueryOptions<T>): Promise<T | null>;

    findAll<T extends {}>(options: QueryOptions<T>): Promise<T[]>;

    conditionBuilder(queryModel: QueryModel): QBFilterQuery;
}
