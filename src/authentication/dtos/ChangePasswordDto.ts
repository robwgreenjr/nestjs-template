import { AutoMap } from "@automapper/classes";

export class ChangePasswordDto {
    @AutoMap()
    emailConfirmation?: string;

    @AutoMap()
    password?: string;

    @AutoMap()
    passwordConfirmation?: string;

    @AutoMap()
    passwordCurrent?: string;
}