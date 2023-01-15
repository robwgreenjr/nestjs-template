import { IPasswordManagement } from "./IPasswordManagement";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { USER_PASSWORD_MANAGER } from "./UserPasswordManager";
import { IUserPasswordManager } from "./IUserPasswordManager";
import { RESET_PASSWORD_TOKEN_MANAGER } from "./ResetPasswordTokenManager";
import { IResetPasswordTokenManager } from "./IResetPasswordTokenManager";
import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { SIMPLE_USER } from "../../users/services/SimpleUser";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { IUserManager } from "../../users/services/IUserManager";

export const PASSWORD_MANAGEMENT = "PASSWORD_MANAGEMENT";

@Injectable()
export class PasswordManagement implements IPasswordManagement {
    constructor(
        @Inject(USER_PASSWORD_MANAGER)
        private readonly userPasswordManager: IUserPasswordManager,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
        @Inject(SIMPLE_USER)
        private readonly userManager: IUserManager,
        @Inject(RESET_PASSWORD_TOKEN_MANAGER)
        private readonly resetPasswordTokenManager: IResetPasswordTokenManager,
    ) {}

    private static setNewUserPassword(
        userPasswordModel: UserPasswordModel,
        foundUserPasswordModel: UserPasswordModel,
    ): UserPasswordModel {
        userPasswordModel.id = foundUserPasswordModel.id;
        userPasswordModel.user = foundUserPasswordModel.user;
        userPasswordModel.passwordCurrent = foundUserPasswordModel.password;
        userPasswordModel.passwordPrevious = foundUserPasswordModel.password;
        userPasswordModel.createdOn = foundUserPasswordModel.createdOn;

        return userPasswordModel;
    }

    async change(userPasswordModel: UserPasswordModel): Promise<void> {
        userPasswordModel.validatePassword();

        if (!userPasswordModel.emailConfirmation) {
            throw new BadRequestException(
                "Email confirmation password is required.",
            );
        }

        const foundUserPasswordModel =
            await this.userPasswordManager.findByUserEmail(
                userPasswordModel.emailConfirmation,
            );

        if (
            !userPasswordModel.passwordCurrent ||
            !foundUserPasswordModel.password
        ) {
            throw new BadRequestException("Must provide the current password.");
        }

        const isValid = await this.bCryptEncoder.verify(
            userPasswordModel.passwordCurrent,
            foundUserPasswordModel.password,
        );
        if (!isValid) {
            throw new BadRequestException("Your password isn't correct.");
        }

        userPasswordModel = PasswordManagement.setNewUserPassword(
            userPasswordModel,
            foundUserPasswordModel,
        );

        await this.userPasswordManager.update(userPasswordModel);
    }

    async forgot(userPasswordModel: UserPasswordModel): Promise<void> {
        if (!userPasswordModel.emailConfirmation) {
            throw new BadRequestException(
                "Email confirmation password is required.",
            );
        }

        const userModel = await this.userManager.findByEmail(
            userPasswordModel.emailConfirmation,
        );

        await this.resetPasswordTokenManager.create(
            new ResetPasswordTokenModel(userModel),
        );
    }

    async reset(userPasswordModel: UserPasswordModel): Promise<void> {
        userPasswordModel.validatePassword();

        if (!userPasswordModel.token) {
            throw new BadRequestException("Reset password token is required.");
        }

        const resetPasswordTokenModel =
            await this.resetPasswordTokenManager.findByToken(
                userPasswordModel.token,
            );

        if (!resetPasswordTokenModel.user) {
            throw new BadRequestException(
                "Reset password token does not have a user associated with it.",
            );
        }

        let foundUserPasswordModel = null;
        if (resetPasswordTokenModel.user.email) {
            foundUserPasswordModel =
                await this.userPasswordManager.findByUserEmail(
                    resetPasswordTokenModel.user.email,
                );
        }

        if (foundUserPasswordModel) {
            userPasswordModel = PasswordManagement.setNewUserPassword(
                userPasswordModel,
                foundUserPasswordModel,
            );

            await this.userPasswordManager.update(userPasswordModel);
            return;
        }

        userPasswordModel.user = resetPasswordTokenModel.user;

        await this.userPasswordManager.create(userPasswordModel);
    }
}
