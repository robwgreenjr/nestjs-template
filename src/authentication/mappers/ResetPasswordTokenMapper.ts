import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { ResetPasswordTokenDto } from "../dtos/ResetPasswordTokenDto";
import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { UserModel } from "../../users/models/UserModel";
import { UserMapper } from "../../users/mappers/UserMapper";
import { UserPasswordModel } from "../models/UserPasswordModel";

export class ResetPasswordTokenMapper {
    static toDto(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): ResetPasswordTokenDto {
        return {
            token: resetPasswordTokenModel.token,
            password: resetPasswordTokenModel.password,
            passwordConfirmation: resetPasswordTokenModel.passwordConfirmation,
        };
    }

    static dtoToModel(
        resetPasswordTokenDto: ResetPasswordTokenDto,
    ): ResetPasswordTokenModel {
        return {
            token: resetPasswordTokenDto.token,
            password: resetPasswordTokenDto.password,
            passwordConfirmation: resetPasswordTokenDto.passwordConfirmation,
            user: new UserModel(),
        };
    }

    static toEntity(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): ResetPasswordToken {
        const resetPasswordToken = new ResetPasswordToken();
        resetPasswordToken.token = resetPasswordTokenModel.token;
        resetPasswordToken.user = resetPasswordTokenModel.user
            ? UserMapper.toEntity(resetPasswordTokenModel.user)
            : undefined;
        resetPasswordToken.createdOn = resetPasswordTokenModel.createdOn;

        return resetPasswordToken;
    }

    static entityToModel(
        resetPasswordToken: ResetPasswordToken,
    ): ResetPasswordTokenModel {
        return {
            token: resetPasswordToken.token,
            user: resetPasswordToken.user
                ? UserMapper.entityToModel(resetPasswordToken.user)
                : undefined,
            createdOn: resetPasswordToken.createdOn,
        };
    }

    static dtoToUserPasswordModel(
        resetPasswordTokenDto: ResetPasswordTokenDto,
    ): UserPasswordModel {
        const userPasswordModel = new UserPasswordModel();
        userPasswordModel.token = resetPasswordTokenDto.token;
        userPasswordModel.password = resetPasswordTokenDto.password;
        userPasswordModel.passwordConfirmation =
            resetPasswordTokenDto.passwordConfirmation;

        return userPasswordModel;
    }
}
