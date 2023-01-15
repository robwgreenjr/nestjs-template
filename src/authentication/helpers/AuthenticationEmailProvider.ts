import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { IAuthenticationEmailProvider } from "./IAuthenticationEmailProvider";
import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { ConfigService } from "@nestjs/config";
import { AWS_SES } from "../../aws/services/SESSender";
import { TIME_SPECIALIST } from "../../global/utilities/TimeSpecialist";
import { ISESSender } from "../../aws/services/ISESSender";
import { ITimeSpecialist } from "../../global/utilities/ITimeSpecialist";

export const AUTHENTICATION_EMAIL_PROVIDER = "AUTHENTICATION_EMAIL_PROVIDER";

@Injectable()
export class AuthenticationEmailProvider
    implements IAuthenticationEmailProvider
{
    constructor(
        @Inject(AWS_SES)
        private readonly sesSender: ISESSender,
        @Inject(TIME_SPECIALIST)
        private readonly timeSpecialist: ITimeSpecialist,
        private readonly configService: ConfigService,
    ) {}

    async sendCreatePasswordEmail(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): Promise<void> {
        const url = this.configService.get<string>("FRONTEND_URL");

        if (typeof url === "undefined") {
            throw new InternalServerErrorException("Frontend url isn't set.");
        }

        const createPasswordExpiration = this.configService.get<string>(
            "CREATE_PASSWORD_EXPIRATION",
        );
        if (!createPasswordExpiration) {
            throw new InternalServerErrorException(
                "Create password expiration isn't set.",
            );
        }

        const createPasswordLink = `${url}/create-password/${resetPasswordTokenModel.token}`;

        const title = `<h2>Welcome ${resetPasswordTokenModel.user?.firstName}!</h2>`;
        const subject = "** Create New Password **";

        const htmlBody = `<html><head></head><body>${title}<p>Click the link to create your first password: <a href="${createPasswordLink}">Create Password</a></p><p>Your time window to create your password is ${this.timeSpecialist.integerToHoursAndMinutes(
            parseInt(createPasswordExpiration),
        )}.</p></body></html>`;
        const textBody = `Click the link to create your password: ${createPasswordLink}. Your create password token will expire in ${this.timeSpecialist.integerToHoursAndMinutes(
            parseInt(createPasswordExpiration),
        )}.`;

        await this.sesSender.sendEmail(
            [resetPasswordTokenModel.user?.email ?? ""],
            subject,
            htmlBody,
            textBody,
        );
    }

    async sendForgotPasswordEmail(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): Promise<void> {
        const url = this.configService.get<string>("FRONTEND_URL");

        if (typeof url === "undefined") {
            throw new InternalServerErrorException("Frontend url isn't set.");
        }

        const resetPasswordExpiration = this.configService.get<string>(
            "RESET_PASSWORD_EXPIRATION",
        );
        if (!resetPasswordExpiration) {
            throw new InternalServerErrorException(
                "Reset password expiration isn't set.",
            );
        }

        const createPasswordLink = `${url}/create-password/${resetPasswordTokenModel.token}`;

        const title = `<h2>Forgot your password ${resetPasswordTokenModel.user?.firstName}?</h2>`;
        const subject = "** Reset Forgotten Password **";

        const htmlBody = `<html><head></head><body>${title}<p>Click the link to reset your password: <a href="${createPasswordLink}">Reset Password</a></p><p>Your time window to reset your password is ${this.timeSpecialist.integerToHoursAndMinutes(
            parseInt(resetPasswordExpiration),
        )}.</p></body></html>`;
        const textBody = `Click the link to reset your password: ${createPasswordLink}. Your reset password token will expire in ${this.timeSpecialist.integerToHoursAndMinutes(
            parseInt(resetPasswordExpiration),
        )}.`;

        await this.sesSender.sendEmail(
            [resetPasswordTokenModel.user?.email ?? ""],
            subject,
            htmlBody,
            textBody,
        );
    }
}
