import { ResetPasswordToken } from "../entities/ResetPasswordToken";

export interface IResetPasswordTokenRepository {
    create(resetPasswordToken: ResetPasswordToken): Promise<ResetPasswordToken>;

    delete(token: string): Promise<void>;

    findByToken(token: string): Promise<ResetPasswordToken | null>;

    findByUserEmail(email: string): Promise<ResetPasswordToken | null>;
}