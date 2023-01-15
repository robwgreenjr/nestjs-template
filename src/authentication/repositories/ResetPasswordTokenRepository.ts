import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { IResetPasswordTokenRepository } from "./IResetPasswordTokenRepository";
import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { User } from "../../users/entities/User";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";

export const RESET_PASSWORD_TOKEN_REPOSITORY =
    "RESET_PASSWORD_TOKEN_REPOSITORY";

@Injectable()
export class ResetPasswordTokenRepository
    implements IResetPasswordTokenRepository
{
    constructor(
        @InjectRepository(ResetPasswordToken)
        private readonly resetPasswordTokenRepository: EntityRepository<ResetPasswordToken>,
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
    ) {}

    async create(
        resetPasswordToken: ResetPasswordToken,
    ): Promise<ResetPasswordToken> {
        try {
            resetPasswordToken =
                this.resetPasswordTokenRepository.create(resetPasswordToken);

            if (
                typeof resetPasswordToken.user !== "undefined" &&
                typeof resetPasswordToken.user.id !== "undefined"
            ) {
                resetPasswordToken.user =
                    await this.userRepository.findOneOrFail({
                        id: resetPasswordToken.user.id,
                    });
            }

            await this.resetPasswordTokenRepository.persistAndFlush(
                resetPasswordToken,
            );
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return resetPasswordToken;
    }

    async delete(token: string): Promise<void> {
        try {
            const resetPasswordToken = this.resetPasswordTokenRepository.find({
                token,
            });

            await this.resetPasswordTokenRepository.removeAndFlush(
                resetPasswordToken,
            );
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async findByToken(token: string): Promise<ResetPasswordToken | null> {
        let result = null;

        try {
            result = await this.resetPasswordTokenRepository.find(
                { token },
                {
                    populate: ["user"],
                },
            );
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return result && result.length === 1 ? result[0] : null;
    }

    async findByUserEmail(email: string): Promise<ResetPasswordToken | null> {
        let result = null;

        try {
            result = await this.resetPasswordTokenRepository.find(
                { user: { email } },
                {
                    populate: ["user"],
                },
            );
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return result && result.length === 1 ? result[0] : null;
    }
}
