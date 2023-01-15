import { QueryModel } from "../../global/models/QueryModel";
import "module-alias/register";
import {QueryResponse} from "../../global/models/QueryResponse";

export interface IQueryManager<T> {
    create(model: T): Promise<T>;

    createAll(modelList: T[]): Promise<T[]>;

    delete(id: number): Promise<void>;

    find(queryModel: QueryModel): Promise<QueryResponse>;

    findAll(queryModel: QueryModel): Promise<QueryResponse>;

    findById(id: number): Promise<T>;

    update(id: number, model: T): Promise<T>;

    updateAll(modelList: T[]): Promise<T[]>;
}
