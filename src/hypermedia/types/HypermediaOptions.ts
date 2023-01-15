import "module-alias/register";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import {QueryResponse} from "../../global/models/QueryResponse";

export type HypermediaOptions = {
    request: GlobalRequest;
    queryResponse?: QueryResponse;
    data?: any;
};
