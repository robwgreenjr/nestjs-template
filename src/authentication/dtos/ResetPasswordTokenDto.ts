import { AutoMap } from "@automapper/classes";

export class ResetPasswordTokenDto {
    @AutoMap()
    token?: string;

    @AutoMap()
    password?: string;

    @AutoMap()
    passwordConfirmation?: string;
}