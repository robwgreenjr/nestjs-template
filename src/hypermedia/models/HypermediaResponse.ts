import { QueryResponse } from "./QueryResponse";
import { HypermediaLinkList } from "../types/HypermediaLinkList";
import { ErrorResponse } from "../types/ErrorResponse";

export class HypermediaResponse extends QueryResponse {
    links: HypermediaLinkList;
    errors: ErrorResponse[];

    constructor(queryResponse?: QueryResponse) {
        super();
        this.links = {
            self: {
                href: "",
                rel: "",
                type: "",
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
