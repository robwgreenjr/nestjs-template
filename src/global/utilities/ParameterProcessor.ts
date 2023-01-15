import { IParameterProcessor } from "./IParameterProcessor";
import { QueryModel } from "../models/QueryModel";
import { QuerySort } from "../enums/QuerySort";
import { ColumnFilter } from "../models/ColumnFilter";
import { QueryConjunctive } from "../enums/QueryConjunctive";
import { QueryFilter } from "../enums/QueryFilter";
import { ColumnFilterList } from "../models/ColumnFilterList";

export const PARAMETER_PROCESSOR = "PARAMETER_PROCESSOR";

export class ParameterProcessor implements IParameterProcessor {
    private static buildSort(
        queryModel: QueryModel,
        queryParams: any,
    ): QueryModel {
        if (typeof queryParams["sort_by"] === "undefined") return queryModel;
        const sortValue = queryParams["sort_by"];

        const multipleSorts = sortValue.split(new RegExp("\\),"));
        if (multipleSorts.length == 2) {
            multipleSorts[0] += ")";
        }

        const sortedList: Record<string, string[]>[] = [];

        for (const sorted of multipleSorts) {
            let sortMethod = sorted.substring(0, sorted.indexOf("("));
            sortMethod = sortMethod.toLowerCase();

            if (sortMethod !== QuerySort.ASC && sortMethod !== QuerySort.DESC)
                continue;

            const sortedFields = sorted
                .substring(sorted.indexOf("(") + 1, sorted.indexOf(")"))
                .split(",");

            sortedList.push({
                [sortMethod]: sortedFields,
            });
        }

        queryModel.sortList = sortedList;

        return queryModel;
    }

    private static buildPagination(
        queryModel: QueryModel,
        queryParams: any,
    ): QueryModel {
        if (typeof queryParams["limit"] !== "undefined") {
            queryModel.limit = parseInt(queryParams["limit"]);
        }

        if (typeof queryParams["offset"] !== "undefined") {
            queryModel.offset = parseInt(queryParams["offset"]);
        }

        return queryModel;
    }

    private static extractFilter(
        columnFilterList: ColumnFilter[],
        key: string,
    ): ColumnFilter[] {
        const columnFilter: ColumnFilter = new ColumnFilter();
        columnFilter.conjunctive = QueryConjunctive.AND;

        const checkKeyForConjunction = key.split("[or]");
        if (checkKeyForConjunction.length === 2) {
            key = checkKeyForConjunction[1];
            columnFilter.conjunctive = QueryConjunctive.OR;
        }

        const gtIdentifier = `[${QueryFilter.GT.toLowerCase()}]`;
        const gteIdentifier = `[${QueryFilter.GTE.toLowerCase()}]`;
        const ltIdentifier = `[${QueryFilter.LT.toLowerCase()}]`;
        const lteIdentifier = `[${QueryFilter.LTE.toLowerCase()}]`;
        const neIdentifier = `[${QueryFilter.NE.toLowerCase()}]`;
        const likeIdentifier = `[${QueryFilter.LIKE.toLowerCase()}]`;

        if (key.includes(gteIdentifier)) {
            columnFilter.filter = QueryFilter.GTE;
            columnFilter.property = key.split(gteIdentifier)[0];
        } else if (key.includes(gtIdentifier)) {
            columnFilter.filter = QueryFilter.GT;
            columnFilter.property = key.split(gtIdentifier)[0];
        } else if (key.includes(ltIdentifier)) {
            columnFilter.filter = QueryFilter.LT;
            columnFilter.property = key.split(ltIdentifier)[0];
        } else if (key.includes(lteIdentifier)) {
            columnFilter.filter = QueryFilter.LTE;
            columnFilter.property = key.split(lteIdentifier)[0];
        } else if (key.includes(neIdentifier)) {
            columnFilter.filter = QueryFilter.NE;
            columnFilter.property = key.split(neIdentifier)[0];
        } else if (key.includes(likeIdentifier)) {
            columnFilter.filter = QueryFilter.LIKE;
            columnFilter.property = key.split(likeIdentifier)[0];
        } else {
            columnFilter.filter = QueryFilter.EQ;
            columnFilter.property = key;
        }

        columnFilterList.push(columnFilter);

        return columnFilterList;
    }

    private static extractValue(
        columnFilterList: ColumnFilter[],
        value: string,
    ): ColumnFilter[] {
        if (typeof columnFilterList[0] === "undefined") return columnFilterList;

        const columnFilter = columnFilterList[0];
        if (!columnFilter) return columnFilterList;

        /**
         * Setup common variables
         */
        const andOrRegex = new RegExp("\\[and]|\\[or]");
        const andIdentifier = `[${QueryConjunctive.AND.toLowerCase()}]`;
        const orIdentifier = `[${QueryConjunctive.OR.toLowerCase()}]`;

        /**
         * Figure out if value needs to be parsed for multiple filters
         */
        let mainValue: any = "";
        let mainValueLength = 0;
        if (!value.includes(orIdentifier) && !value.includes(andIdentifier)) {
            mainValue = ParameterProcessor.parseValueType(value);
            mainValueLength = value.length;
        } else if (value.split(andOrRegex).length > 1) {
            mainValue = ParameterProcessor.parseValueType(
                value.split(andOrRegex)[0],
            );
            mainValueLength = value.split(andOrRegex)[0].length;
        }
        columnFilter.value = mainValue;

        /**
         * Separate any extra filters added onto value
         */
        const remainingValues = value.substring(mainValueLength);
        if (!remainingValues) return columnFilterList;

        const finalValues = remainingValues.split(andOrRegex);
        let finalConjunctions: Record<string, number>[] = [];

        let andPlacements = value.indexOf(andIdentifier);
        let orPlacements = value.indexOf(orIdentifier);

        while (orPlacements !== -1) {
            const orPlacement: Record<QueryConjunctive.OR, number> = {
                [QueryConjunctive.OR]: orPlacements,
            };

            finalConjunctions.push(orPlacement);

            orPlacements = value.indexOf(orIdentifier, orPlacements + 1);
        }

        while (andPlacements !== -1) {
            const andPlacement: Record<QueryConjunctive.AND, number> = {
                [QueryConjunctive.AND]: andPlacements,
            };

            finalConjunctions.push(andPlacement);

            andPlacements = value.indexOf(andIdentifier, andPlacements + 1);
        }

        finalConjunctions = finalConjunctions.sort((a, b) => {
            let first = -1;
            let second = -1;

            if (typeof a[QueryConjunctive.OR] !== "undefined") {
                first = a[QueryConjunctive.OR];
            } else if (typeof a[QueryConjunctive.AND] !== "undefined") {
                first = a[QueryConjunctive.AND];
            }

            if (typeof b[QueryConjunctive.OR] !== "undefined") {
                second = b[QueryConjunctive.OR];
            } else if (typeof b[QueryConjunctive.AND] !== "undefined") {
                second = b[QueryConjunctive.AND];
            }

            return first - second;
        });

        let index = 0;
        for (const finalValue of finalValues) {
            if (!finalValue) continue;
            const keyValue: string[] = finalValue.split("=");
            if (keyValue.length !== 2) continue;

            columnFilterList = ParameterProcessor.extractFilter(
                columnFilterList,
                keyValue[0],
            );

            columnFilterList[columnFilterList.length - 1].value =
                ParameterProcessor.parseValueType(keyValue[1]);

            let conjunction: QueryConjunctive | null = null;
            if (
                typeof finalConjunctions[index][QueryConjunctive.OR] !==
                "undefined"
            ) {
                conjunction = QueryConjunctive.OR;
            } else if (
                typeof finalConjunctions[index][QueryConjunctive.AND] !==
                "undefined"
            ) {
                conjunction = QueryConjunctive.AND;
            }

            if (!conjunction) {
                conjunction = QueryConjunctive.AND;
            }

            columnFilterList[columnFilterList.length - 1].conjunctive =
                conjunction;
            index++;
        }

        return columnFilterList;
    }

    private static parseValueType(value: any): any {
        if (new RegExp("^[0-9]*$").test(value)) {
            return parseInt(value);
        } else if (!isNaN(Date.parse(value))) {
            const date = new Date(value);

            return date.toISOString();
        }

        return value;
    }

    buildQueryModel(queryParams: any): QueryModel {
        let queryModel = new QueryModel();

        queryModel = this.buildFilter(queryModel, queryParams);
        queryModel = ParameterProcessor.buildSort(queryModel, queryParams);
        queryModel = ParameterProcessor.buildPagination(
            queryModel,
            queryParams,
        );

        return queryModel;
    }

    private buildFilter(
        queryModel: QueryModel,
        queryParams: object,
    ): QueryModel {
        const filterList: ColumnFilterList[] = [];

        Object.keys(queryParams).map((key) => {
            if (key === "sort_by" || key === "limit" || key === "offset")
                return;

            const columnFilterList = new ColumnFilterList();
            columnFilterList.conjunctive = QueryConjunctive.AND;
            columnFilterList.filters = [];

            if (key.substring(0, 4) === "[or]") {
                columnFilterList.conjunctive = QueryConjunctive.OR;
                // @ts-ignore
                queryParams[key.substring(4, key.length)] = queryParams[key];
                // @ts-ignore
                delete queryParams[key];
                key = key.substring(4, key.length);
            }
            columnFilterList.filters = ParameterProcessor.extractFilter(
                columnFilterList.filters,
                key,
            );

            // @ts-ignore
            if (queryParams[key]) {
                columnFilterList.filters = ParameterProcessor.extractValue(
                    columnFilterList.filters,
                    // @ts-ignore
                    queryParams[key],
                );
            }

            for (let i = 0; i < columnFilterList.filters.length; i++) {
                if (!i) continue;

                if (
                    columnFilterList.filters[i].conjunctive ===
                    QueryConjunctive.OR
                ) {
                    columnFilterList.filters[i - 1].conjunctive =
                        QueryConjunctive.OR;
                }
            }

            filterList.push(columnFilterList);
        });

        queryModel.filterList = filterList;

        return queryModel;
    }
}
