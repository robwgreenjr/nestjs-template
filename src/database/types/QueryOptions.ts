import { SqlEntityRepository } from "@mikro-orm/postgresql";
import { QueryModel } from "../../global/models/QueryModel";

export type QueryOptions<T extends {}> = {
    entityRepository: SqlEntityRepository<T>;
    queryModel: QueryModel;
    populate?: string[];
    cache?: boolean | number | [string, number];
};
