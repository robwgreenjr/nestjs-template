import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";

export interface IAuthenticationEmailProvider {
    sendForgotPasswordEmail(resetPasswordTokenModel: ResetPasswordTokenModel): Promise<void>;

    sendCreatePasswordEmail(resetPasswordTokenModel: ResetPasswordTokenModel): Promise<void>;
}