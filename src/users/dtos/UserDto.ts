import {AutoMap} from "@automapper/classes";

export class UserDto {
    @AutoMap()
    id?: number;

    @AutoMap()
    firstName?: string;

    @AutoMap()
    lastName?: string;

    @AutoMap()
    email?: string;

    @AutoMap()
    phone?: string;

    @AutoMap()
    createdOn?: string;

    @AutoMap()
    updatedOn?: string;
}
