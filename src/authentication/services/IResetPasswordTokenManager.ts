import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";

export interface IResetPasswordTokenManager {
    findByUserEmail(email: string): Promise<ResetPasswordTokenModel>;

    findByToken(token: string): Promise<ResetPasswordTokenModel>;

    create(resetPasswordTokenModel: ResetPasswordTokenModel): Promise<ResetPasswordTokenModel>;

    delete(token: string): Promise<void>;
}