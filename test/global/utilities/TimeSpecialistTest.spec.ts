import { Test, TestingModule } from "@nestjs/testing";
import { TimeSpecialist } from "../../../src/global/utilities/TimeSpecialist";

describe("TimeSpecialist", () => {
    let timeSpecialist: TimeSpecialist;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TimeSpecialist],
        }).compile();

        timeSpecialist = module.get<TimeSpecialist>(TimeSpecialist);
    });

    it("should be defined", function () {
        expect(timeSpecialist).toBeDefined();
    });

    describe("integerToHoursAndMinutes", () => {
        it("given 180 should return 3 hours", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(180);

            expect(actual).toEqual("3 hours");
        });

        it("given 156 should return 2 hours and 36 minutes", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(156);

            expect(actual).toEqual("2 hours and 36 minutes");
        });

        it("given 180 should return 1 hour", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(60);

            expect(actual).toEqual("1 hour");
        });

        it("given 180 should return 1 hour and 8 minutes", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(68);

            expect(actual).toEqual("1 hour and 8 minutes");
        });

        it("given 180 should return 1 hour and 1 minute", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(61);

            expect(actual).toEqual("1 hour and 1 minute");
        });

        it("given 180 should return 30 minutes", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(30);

            expect(actual).toEqual("30 minutes");
        });

        it("given 180 should return 1 minute", function () {
            const actual = timeSpecialist.integerToHoursAndMinutes(1);

            expect(actual).toEqual("1 minute");
        });
    });
});
