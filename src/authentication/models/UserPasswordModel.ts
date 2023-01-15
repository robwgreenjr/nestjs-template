import { AutoMap } from "@automapper/classes";
import { BadRequestException } from "@nestjs/common";
import { UserModel } from "../../users/models/UserModel";

export class UserPasswordModel {
    @AutoMap()
    id?: number;

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

    @AutoMap()
    passwordPrevious?: string;

    @AutoMap()
    passwordCurrent?: string;

    @AutoMap()
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
