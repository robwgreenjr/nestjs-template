import { Inject, Injectable } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { IUserPasswordManager } from "./IUserPasswordManager";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { USER_PASSWORD_REPOSITORY } from "../repositories/UserPasswordRepository";
import { IUserPasswordRepository } from "../repositories/IUserPasswordRepository";
import { UserPassword } from "../entities/UserPassword";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";

export const USER_PASSWORD_MANAGER = "USER_PASSWORD_MANAGER";

@Injectable()
export class UserPasswordManager implements IUserPasswordManager {
    constructor(
        @Inject(USER_PASSWORD_REPOSITORY)
        private readonly userPasswordRepository: IUserPasswordRepository,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(
        userPasswordModel: UserPasswordModel,
    ): Promise<UserPasswordModel> {
        let userPassword = this.mapper.map(
            userPasswordModel,
            UserPasswordModel,
            UserPassword,
        );

        if (userPassword.password) {
            userPassword.password = await this.bCryptEncoder.encode(
                userPassword.password,
            );
        }

        userPassword = await this.userPasswordRepository.create(userPassword);

        return this.mapper.map(userPassword, UserPassword, UserPasswordModel);
    }

    async delete(id: number): Promise<void> {
        await this.userPasswordRepository.delete(id);
    }

    async findByUserEmail(email: string): Promise<UserPasswordModel> {
        const userPassword = await this.userPasswordRepository.findByUserEmail(
            email,
        );

        return this.mapper.map(userPassword, UserPassword, UserPasswordModel);
    }

    async update(
        userPasswordModel: UserPasswordModel,
    ): Promise<UserPasswordModel> {
        let userPassword = this.mapper.map(
            userPasswordModel,
            UserPasswordModel,
            UserPassword,
        );

        if (userPassword.password) {
            userPassword.password = await this.bCryptEncoder.encode(
                userPassword.password,
            );
        }

        userPassword = await this.userPasswordRepository.update(userPassword);

        return this.mapper.map(userPassword, UserPassword, UserPasswordModel);
    }
}
