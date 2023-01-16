import { BadRequestException } from "@nestjs/common";
import { UserModel } from "../../users/models/UserModel";

export class UserPasswordModel {
    id?: number;
    user?: UserModel;
    token?: string;
    createdOn?: Date;
    password?: string;
    passwordConfirmation?: string;
    passwordPrevious?: string;
    passwordCurrent?: string;
    emailConfirmation?: string;

    confirmMatchingPasswords() {
        if (this.password !== this.passwordConfirmation) {
            throw new BadRequestException("Your passwords don't match.");
        }
    }

    validatePassword() {
        this.confirmMatchingPasswords();
    }
}
