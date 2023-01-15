import { ColumnFilter } from "./ColumnFilter";
import { QueryConjunctive } from "../enums/QueryConjunctive";

export class ColumnFilterList {
    conjunctive!: QueryConjunctive;
    filters!: ColumnFilter[];
}
