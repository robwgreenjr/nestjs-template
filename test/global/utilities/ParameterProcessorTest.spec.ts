import "module-alias/register";
import { Test, TestingModule } from "@nestjs/testing";
import { ParameterProcessor } from "../../../src/global/utilities/ParameterProcessor";
import { QueryModel } from "../../../src/global/models/QueryModel";
import { QueryConjunctive } from "../../../src/global/enums/QueryConjunctive";
import { QueryFilter } from "../../../src/global/enums/QueryFilter";

describe("ParameterProcessor", () => {
    let parameterProcessor: ParameterProcessor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ParameterProcessor],
        }).compile();

        parameterProcessor = module.get<ParameterProcessor>(ParameterProcessor);
    });

    it("should be defined", function () {
        expect(parameterProcessor).toBeDefined();
    });

    describe("sort_by query", () => {
        it("given asc sort should return query model with asc", function () {
            const queryParameters = {
                sort_by: "asc(name)",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.sortList).toBeDefined();
            // @ts-ignore
            expect(actual.sortList.length).toEqual(1);
            // @ts-ignore
            expect(actual.sortList[0][QuerySort.ASC]).toEqual(["name"]);
        });

        it("given multiple asc sort should return query model with multiple asc", function () {
            const queryParameters = {
                sort_by: "asc(name,age,birthday)",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.sortList).toBeDefined();
            // @ts-ignore
            expect(actual.sortList.length).toEqual(1);
            // @ts-ignore
            expect(actual.sortList[0][QuerySort.ASC]).toEqual([
                "name",
                "age",
                "birthday",
            ]);
        });

        it("given multiple desc sort should return query model with multiple desc", function () {
            const queryParameters = {
                sort_by: "desc(name,age,birthday)",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.sortList).toBeDefined();
            // @ts-ignore
            expect(actual.sortList.length).toEqual(1);
            // @ts-ignore
            expect(actual.sortList[0][QuerySort.DESC]).toEqual([
                "name",
                "age",
                "birthday",
            ]);
        });

        it("given asc and desc sort should return query model with asc and desc", function () {
            const queryParameters = {
                sort_by: "asc(name),desc(age)",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.sortList).toBeDefined();
            // @ts-ignore
            expect(actual.sortList.length).toEqual(2);
            // @ts-ignore
            expect(actual.sortList[0][QuerySort.ASC]).toEqual(["name"]);

            // @ts-ignore
            expect(actual.sortList[1][QuerySort.DESC]).toEqual(["age"]);
        });
    });

    describe("offset query", () => {
        it("given offset should return with offset", function () {
            const queryParameters = {
                offset: "25",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.offset).toEqual(25);
        });
    });

    describe("limit query", () => {
        it("given limit should return with limit", function () {
            const queryParameters = {
                limit: "100",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.limit).toEqual(100);
        });
    });

    describe("filter query", () => {
        it("given one filter should return correct filter", function () {
            const queryParameters = {
                email: "testing@gmail.com",
            };

            const actual: QueryModel =
                parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );
        });

        it("given special character (-) filter should return correct filter", function () {
            const queryParameters = {
                phone: "555-555-5555",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("phone");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "555-555-5555",
            );
        });

        it("given two filter should return correct filter", function () {
            const queryParameters = {
                email: "testing@gmail.com",
                firstName: "Tester",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();

            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );

            // @ts-ignore
            expect(actual.filterList[1].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].property).toEqual(
                "firstName",
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].value).toEqual("Tester");
        });

        it("given two filters with [or] should return correct filter", function () {
            const queryParameters = {
                email: "testing@gmail.com[or]email=another@gmail.com",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();

            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[1].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[1].value).toEqual(
                "another@gmail.com",
            );
        });

        it("given less than filter should return correct filter", function () {
            const queryParameters = {
                "email[lte]": "testing@gmail.com",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );
        });

        it("given greater than filter should return correct filter", function () {
            const queryParameters = {
                "email[gte]": "testing@gmail.com",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );
        });

        it("given three filters should return correct filter", function () {
            const queryParameters = {
                "email[gte]": "testing@gmail.com[or]age[lte]=25",
                firstName: "Tester",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[1].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].property).toEqual("age");
            // @ts-ignore
            expect(actual.filterList[0].filters[1].value).toEqual(25);

            // @ts-ignore
            expect(actual.filterList[1].filters[0].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].property).toEqual(
                "firstName",
            );
            // @ts-ignore
            expect(actual.filterList[1].filters[0].value).toEqual("Tester");
        });

        it("given six filters should return correct filter", function () {
            const queryParameters = {
                "email[gte]":
                    "testing@gmail.com[or]age[lte]=25[and]firstName[gte]=tester[and]lastName=blue[or]birthday[lte]=04-21-2010[and]createdOn=01-04-2022",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[1].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].property).toEqual("age");
            // @ts-ignore
            expect(actual.filterList[0].filters[1].value).toEqual(25);

            // @ts-ignore
            expect(actual.filterList[0].filters[2].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].property).toEqual(
                "firstName",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].value).toEqual("tester");

            // @ts-ignore
            expect(actual.filterList[0].filters[3].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].property).toEqual(
                "lastName",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].value).toEqual("blue");

            // @ts-ignore
            expect(actual.filterList[0].filters[4].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].property).toEqual(
                "birthday",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].value).toEqual(
                "2010-04-21T04:00:00.000Z",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[5].conjunctive).toEqual(
                QueryConjunctive.AND,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].property).toEqual(
                "createdOn",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].value).toEqual(
                "2022-01-04T05:00:00.000Z",
            );
        });

        it("given all six or filters should return correct filter", function () {
            const queryParameters = {
                "[or]email[gte]":
                    "testing@gmail.com[or]age[lte]=25[or]firstName[gte]=tester[or]lastName=blue[or]birthday[lte]=04-21-2010[or]createdOn=01-04-2022",
            };

            const actual = parameterProcessor.buildQueryModel(queryParameters);

            expect(actual).not.toBeNull();
            expect(actual).toBeDefined();
            expect(actual.filterList).toBeDefined();
            // @ts-ignore
            expect(actual.filterList[0].filters[0].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[0].property).toEqual("email");
            // @ts-ignore
            expect(actual.filterList[0].filters[0].value).toEqual(
                "testing@gmail.com",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[1].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[1].property).toEqual("age");
            // @ts-ignore
            expect(actual.filterList[0].filters[1].value).toEqual(25);

            // @ts-ignore
            expect(actual.filterList[0].filters[2].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].filter).toEqual(
                QueryFilter.GTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].property).toEqual(
                "firstName",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[2].value).toEqual("tester");

            // @ts-ignore
            expect(actual.filterList[0].filters[3].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].property).toEqual(
                "lastName",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[3].value).toEqual("blue");

            // @ts-ignore
            expect(actual.filterList[0].filters[4].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].filter).toEqual(
                QueryFilter.LTE,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].property).toEqual(
                "birthday",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[4].value).toEqual(
                "2010-04-21T04:00:00.000Z",
            );

            // @ts-ignore
            expect(actual.filterList[0].filters[5].conjunctive).toEqual(
                QueryConjunctive.OR,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].filter).toEqual(
                QueryFilter.EQ,
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].property).toEqual(
                "createdOn",
            );
            // @ts-ignore
            expect(actual.filterList[0].filters[5].value).toEqual(
                "2022-01-04T05:00:00.000Z",
            );
        });
    });
});
