import { QueryModel } from "../../global/models/QueryModel";

export interface IQueryRepository<T> {
    count(queryModel: QueryModel): Promise<number>;

    create(entity: T): Promise<T>;

    createAll(entityList: T[]): Promise<T[]>;

    delete(entity: T): Promise<void>;

    find(queryModel: QueryModel): Promise<T | null>;

    findAll(queryModel: QueryModel): Promise<T[]>;

    findById(id: number): Promise<T | null>;

    update(entity: T): Promise<T>;

    updateAll(entityList: T[]): Promise<T[]>;
}
