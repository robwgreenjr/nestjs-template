import { AutoMap } from "@automapper/classes";

export class ForgotPasswordDto {
    @AutoMap()
    email?: string;
}