import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { IResetPasswordTokenManager } from "./IResetPasswordTokenManager";
import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { RESET_PASSWORD_TOKEN_REPOSITORY } from "../repositories/ResetPasswordTokenRepository";
import { IResetPasswordTokenRepository } from "../repositories/IResetPasswordTokenRepository";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { ResetPasswordTokenMapper } from "../mappers/ResetPasswordTokenMapper";

export const RESET_PASSWORD_TOKEN_MANAGER = "RESET_PASSWORD_TOKEN_MANAGER";

@Injectable()
export class ResetPasswordTokenManager implements IResetPasswordTokenManager {
    constructor(
        @Inject(RESET_PASSWORD_TOKEN_REPOSITORY)
        private readonly resetPasswordTokenRepository: IResetPasswordTokenRepository,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): Promise<ResetPasswordTokenModel> {
        let resetPasswordToken = ResetPasswordTokenMapper.toEntity(
            resetPasswordTokenModel,
        );

        let token = await this.bCryptEncoder.encode(uuidv4());
        // Prevent forward slash from messing up url from token
        token = token.replace("/", "");
        resetPasswordToken.token = token;

        resetPasswordToken = await this.resetPasswordTokenRepository.create(
            resetPasswordToken,
        );

        return ResetPasswordTokenMapper.entityToModel(resetPasswordToken);
    }

    async delete(token: string): Promise<void> {
        await this.resetPasswordTokenRepository.delete(token);
    }

    async findByToken(token: string): Promise<ResetPasswordTokenModel> {
        const resetPasswordToken =
            await this.resetPasswordTokenRepository.findByToken(token);

        if (!resetPasswordToken) {
            throw new NotFoundException("Reset password wasn't found.");
        }

        return ResetPasswordTokenMapper.entityToModel(resetPasswordToken);
    }

    async findByUserEmail(email: string): Promise<ResetPasswordTokenModel> {
        const resetPasswordToken =
            await this.resetPasswordTokenRepository.findByUserEmail(email);

        if (!resetPasswordToken) {
            throw new NotFoundException("Reset password wasn't found.");
        }

        return ResetPasswordTokenMapper.entityToModel(resetPasswordToken);
    }
}
