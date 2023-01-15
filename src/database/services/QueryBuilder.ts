import { FindOptions, QBFilterQuery, QBQueryOrderMap } from "@mikro-orm/core";
import { IQueryBuilder } from "./IQueryBuilder";
import { InternalServerErrorException } from "@nestjs/common";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryConjunctive } from "../../global/enums/QueryConjunctive";
import { QueryFilter } from "../../global/enums/QueryFilter";
import { QueryOptions } from "../types/QueryOptions";

export const QUERY_BUILDER = "QUERY_BUILDER";

export class QueryBuilder implements IQueryBuilder {
    private static sortBuilder(queryModel: QueryModel): QBQueryOrderMap<any> {
        if (typeof queryModel.sortList === "undefined" || !queryModel.sortList)
            return {};

        const sortList = queryModel.sortList;

        const sorted: any = {};

        for (const sort of sortList) {
            Object.keys(sort).map((s) => {
                sort[s].map((field) => {
                    sorted[field] = s.toUpperCase();
                });
            });
        }

        return sorted;
    }

    public conditionBuilder(queryModel: QueryModel): QBFilterQuery {
        if (
            typeof queryModel.filterList === "undefined" ||
            !queryModel.filterList
        )
            return {};

        const filterList = queryModel.filterList;
        const conditionList: any = {
            $and: [],
            $or: [],
        };

        for (let i = 0; i < filterList.length; i++) {
            if (!i) continue;

            if (filterList[i].conjunctive === QueryConjunctive.OR) {
                filterList[i - 1].conjunctive = QueryConjunctive.OR;
            }
        }

        for (const columnFilter of filterList) {
            const conditions: any = {};

            for (const filter of columnFilter.filters) {
                if (
                    typeof conditions[`$${filter.conjunctive}`] === "undefined"
                ) {
                    conditions[`$${filter.conjunctive}`] = [];
                }

                if (filter.filter === QueryFilter.LIKE.toLowerCase()) {
                    filter.value = `%${filter.value}%`;
                }

                conditions[`$${filter.conjunctive}`].unshift({
                    // @ts-ignore
                    [filter.property]: {
                        [`$${filter.filter}`]: [filter.value],
                    },
                });
            }

            if (columnFilter.conjunctive === QueryConjunctive.AND) {
                conditionList.$and.push(conditions);
            } else {
                conditionList.$or.push(conditions);
            }
        }

        return conditionList;
    }

    async find<T extends {}>(options: QueryOptions<T>): Promise<T | null> {
        const conditions = this.conditionBuilder(options.queryModel);
        if (Object.keys(conditions).length === 0) return null;

        let result = null;
        try {
            result = await options.entityRepository.find(conditions, {
                // @ts-ignore
                populate: options.populate ?? [],
                cache: 50,
            });
        } catch (exception: any) {
            throw new InternalServerErrorException(exception.message);
        }

        return result && result.length === 1 ? result[0] : null;
    }

    async findAll<T extends {}>(options: QueryOptions<T>) {
        const conditions = this.conditionBuilder(options.queryModel);
        const sorted = QueryBuilder.sortBuilder(options.queryModel);

        const queryOptions: FindOptions<T, string> = {
            offset: options.queryModel.offset ?? 0,
            limit: options.queryModel.limit ?? 200,
            // @ts-ignore
            populate: options.populate ?? [],
            cache: 50,
        };

        if (sorted) {
            // @ts-ignore
            queryOptions.orderBy = sorted;
        }

        return await options.entityRepository.find(conditions, queryOptions);
    }
}
