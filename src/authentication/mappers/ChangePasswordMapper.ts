import { UserPasswordModel } from "../models/UserPasswordModel";
import { ChangePasswordDto } from "../dtos/ChangePasswordDto";
import { UserModel } from "../../users/models/UserModel";

export class ChangePasswordMapper {
    static toDto(userPasswordModel: UserPasswordModel): ChangePasswordDto {
        return {
            emailConfirmation: userPasswordModel.emailConfirmation,
            password: userPasswordModel.password,
            passwordConfirmation: userPasswordModel.passwordConfirmation,
            passwordCurrent: userPasswordModel.passwordCurrent,
        };
    }

    static dtoToModel(changePasswordDto: ChangePasswordDto): UserPasswordModel {
        const userPasswordModel = new UserPasswordModel();
        userPasswordModel.emailConfirmation =
            changePasswordDto.emailConfirmation;
        userPasswordModel.password = changePasswordDto.password;
        userPasswordModel.passwordConfirmation =
            changePasswordDto.passwordConfirmation;
        userPasswordModel.passwordCurrent = changePasswordDto.passwordCurrent;
        userPasswordModel.user = new UserModel();

        return userPasswordModel;
    }
}
