import { ColumnFilter } from "./ColumnFilter";
import { ColumnFilterList } from "./ColumnFilterList";
import { QueryConjunctive } from "../enums/QueryConjunctive";
import { QueryFilter } from "../enums/QueryFilter";

export class QueryModel {
    filterList?: ColumnFilterList[];
    sortList?: Record<string, string[]>[];
    offset?: number;
    limit?: number;

    /**
     *
     * @param id
     */
    setPrimaryId(id: number): void {
        if (typeof this.filterList === "undefined" || !this.filterList) {
            this.filterList = [];
        }
        const columnFilterList = new ColumnFilterList();
        columnFilterList.filters = [];
        columnFilterList.conjunctive = QueryConjunctive.AND;

        const columnFilter = new ColumnFilter();
        columnFilter.conjunctive = QueryConjunctive.AND;
        columnFilter.filter = QueryFilter.EQ;
        columnFilter.property = "id";
        columnFilter.value = id;

        columnFilterList.filters.push(columnFilter);

        this.filterList.push(columnFilterList);
    }
}
