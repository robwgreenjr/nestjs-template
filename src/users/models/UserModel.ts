import { AutoMap } from "@automapper/classes";

export class UserModel {
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
    createdOn?: Date;

    @AutoMap()
    updatedOn?: Date;
}
