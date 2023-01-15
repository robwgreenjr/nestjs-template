import { AutoMap } from "@automapper/classes";
import { UserModel } from "../../users/models/UserModel";

export class ResetPasswordTokenModel {
    @AutoMap()
    user?: UserModel;

    @AutoMap()
    token?: string;

    @AutoMap()
    createdOn?: Date;

    @AutoMap()
    password?: string;

    @AutoMap()
    passwordConfirmation?: string;

    constructor(user?: UserModel) {
        this.user = user;
    }
}
