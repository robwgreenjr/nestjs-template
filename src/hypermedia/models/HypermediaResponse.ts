import { HypermediaLinkList } from "../types/HypermediaLinkList";
import {QueryResponse} from "../../global/models/QueryResponse";
import {ErrorResponse} from "../../global/types/ErrorResponse";

export class HypermediaResponse extends QueryResponse {
    links: HypermediaLinkList;
    errors: ErrorResponse[];

    constructor(queryResponse?: QueryResponse) {
        super();
        this.links = {
            self: {
                href: "",
                method: "",
            },
        };
        this.errors = [];

        if (queryResponse) {
            this.data = queryResponse.data;
            this.meta = queryResponse.meta;
            return;
        }

        this.data = [];
        this.meta = {
            timestamp: new Date().toISOString(),
        };
    }
}
