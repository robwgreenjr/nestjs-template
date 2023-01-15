import { QueryModel } from "../models/QueryModel";

export interface IParameterProcessor {
    buildQueryModel(queryParams: any): QueryModel;
}
