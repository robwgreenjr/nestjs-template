import { QueryConjunctive } from "../enums/QueryConjunctive";
import { QueryFilter } from "../enums/QueryFilter";

export class ColumnFilter {
    conjunctive?: QueryConjunctive;
    filter?: QueryFilter;
    property?: string;
    value?: any;
}
