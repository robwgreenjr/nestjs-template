import { UserModel } from "../../users/models/UserModel";

export class ResetPasswordTokenModel {
    user?: UserModel;
    token?: string;
    createdOn?: Date;
    password?: string;
    passwordConfirmation?: string;

    constructor(user?: UserModel) {
        this.user = user;
    }
}
