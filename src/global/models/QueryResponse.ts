import { MetaQuery } from "../types/MetaQuery";

export class QueryResponse {
    data!: any[];
    meta!: MetaQuery;

    constructor() {
        this.setMeta();
    }

    setCount(count: number) {
        this.meta.count = count;
    }

    setPageCount(count: number) {
        this.meta.pageCount = count;
    }

    setOffset(count: number) {
        this.meta.offset = count;
    }

    setLimit(limit: number) {
        this.meta.limit = limit ?? 200;
    }

    getOffset(): number {
        return this.meta.offset ?? 0;
    }

    getLimit(): number {
        return this.meta.limit ?? 0;
    }

    getPageCount(): number {
        return this.meta.pageCount ?? 0;
    }

    getCount(): number {
        return this.meta.count ?? 0;
    }

    private setMeta() {
        if (typeof this.meta === "undefined") {
            this.meta = {
                count: null,
                pageCount: null,
                offset: null,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
