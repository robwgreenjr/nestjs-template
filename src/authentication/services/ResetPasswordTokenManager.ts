import { Inject, Injectable } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { v4 as uuidv4 } from "uuid";
import { IResetPasswordTokenManager } from "./IResetPasswordTokenManager";
import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { RESET_PASSWORD_TOKEN_REPOSITORY } from "../repositories/ResetPasswordTokenRepository";
import { IResetPasswordTokenRepository } from "../repositories/IResetPasswordTokenRepository";
import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";

export const RESET_PASSWORD_TOKEN_MANAGER = "RESET_PASSWORD_TOKEN_MANAGER";

@Injectable()
export class ResetPasswordTokenManager implements IResetPasswordTokenManager {
    constructor(
        @Inject(RESET_PASSWORD_TOKEN_REPOSITORY)
        private readonly resetPasswordTokenRepository: IResetPasswordTokenRepository,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(
        resetPasswordTokenModel: ResetPasswordTokenModel,
    ): Promise<ResetPasswordTokenModel> {
        let resetPasswordToken = this.mapper.map(
            resetPasswordTokenModel,
            ResetPasswordTokenModel,
            ResetPasswordToken,
        );

        let token = await this.bCryptEncoder.encode(uuidv4());
        // Prevent forward slash from messing up url from token
        token = token.replace("/", "");
        resetPasswordToken.token = token;

        resetPasswordToken = await this.resetPasswordTokenRepository.create(
            resetPasswordToken,
        );

        return this.mapper.map(
            resetPasswordToken,
            ResetPasswordToken,
            ResetPasswordTokenModel,
        );
    }

    async delete(token: string): Promise<void> {
        await this.resetPasswordTokenRepository.delete(token);
    }

    async findByToken(token: string): Promise<ResetPasswordTokenModel> {
        const resetPasswordToken =
            await this.resetPasswordTokenRepository.findByToken(token);

        return this.mapper.map(
            resetPasswordToken,
            ResetPasswordToken,
            ResetPasswordTokenModel,
        );
    }

    async findByUserEmail(email: string): Promise<ResetPasswordTokenModel> {
        const resetPasswordToken =
            await this.resetPasswordTokenRepository.findByUserEmail(email);

        return this.mapper.map(
            resetPasswordToken,
            ResetPasswordToken,
            ResetPasswordTokenModel,
        );
    }
}
