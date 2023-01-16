import { UserPasswordModel } from "../models/UserPasswordModel";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { UserModel } from "../../users/models/UserModel";

export class ForgotPasswordMapper {
    static toDto(userPasswordModel: UserPasswordModel): ForgotPasswordDto {
        return {
            email: userPasswordModel.user?.email,
        };
    }

    static dtoToModel(forgotPasswordDto: ForgotPasswordDto): UserPasswordModel {
        const userPasswordModel = new UserPasswordModel();
        userPasswordModel.user = new UserModel();
        userPasswordModel.emailConfirmation = forgotPasswordDto.email;

        return userPasswordModel;
    }
}
