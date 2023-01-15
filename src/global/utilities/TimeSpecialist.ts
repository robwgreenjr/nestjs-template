import { Injectable } from "@nestjs/common";
import { ITimeSpecialist } from "./ITimeSpecialist";

export const TIME_SPECIALIST = "TIME_SPECIALIST";

@Injectable()
export class TimeSpecialist implements ITimeSpecialist {
    integerToHoursAndMinutes(time: number): string {
        let result = "";

        const hours = Math.floor(time / 60);
        const minutes = time % 60;

        if (hours === 1) {
            result += "1 hour";
        } else if (hours !== 0) {
            result += hours + " hours";
        }

        if (hours !== 0 && minutes !== 0) {
            result += " and ";
        }

        if (minutes === 1) {
            result += "1 minute";
        } else if (minutes !== 0) {
            result += minutes + " minutes";
        }

        return result;
    }
}