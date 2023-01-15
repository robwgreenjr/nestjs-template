import { AutoMap } from "@automapper/classes";

export class SimpleUserLoginDto {
    @AutoMap()
    email?: string;

    @AutoMap()
    password?: string;
}