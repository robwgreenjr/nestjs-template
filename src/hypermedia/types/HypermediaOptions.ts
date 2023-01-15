import "module-alias/register";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { QueryResponse } from "../models/QueryResponse";

export type HypermediaOptions = {
    request: GlobalRequest;
    relationship: string;
    queryResponse?: QueryResponse;
    data?: any;
};
