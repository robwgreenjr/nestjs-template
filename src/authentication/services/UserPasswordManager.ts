import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IUserPasswordManager } from "./IUserPasswordManager";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { USER_PASSWORD_REPOSITORY } from "../repositories/UserPasswordRepository";
import { IUserPasswordRepository } from "../repositories/IUserPasswordRepository";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { UserPasswordMapper } from "../mappers/UserPasswordMapper";

export const USER_PASSWORD_MANAGER = "USER_PASSWORD_MANAGER";

@Injectable()
export class UserPasswordManager implements IUserPasswordManager {
    constructor(
        @Inject(USER_PASSWORD_REPOSITORY)
        private readonly userPasswordRepository: IUserPasswordRepository,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(
        userPasswordModel: UserPasswordModel,
    ): Promise<UserPasswordModel> {
        let userPassword = UserPasswordMapper.toEntity(userPasswordModel);

        if (userPassword.password) {
            userPassword.password = await this.bCryptEncoder.encode(
                userPassword.password,
            );
        }

        userPassword = await this.userPasswordRepository.create(userPassword);

        return UserPasswordMapper.entityToModel(userPassword);
    }

    async delete(id: number): Promise<void> {
        await this.userPasswordRepository.delete(id);
    }

    async findByUserEmail(email: string): Promise<UserPasswordModel> {
        const userPassword = await this.userPasswordRepository.findByUserEmail(
            email,
        );

        if (!userPassword) {
            throw new NotFoundException("User password wasn't found.");
        }

        return UserPasswordMapper.entityToModel(userPassword);
    }

    async update(
        userPasswordModel: UserPasswordModel,
    ): Promise<UserPasswordModel> {
        let userPassword = UserPasswordMapper.toEntity(userPasswordModel);

        if (userPassword.password) {
            userPassword.password = await this.bCryptEncoder.encode(
                userPassword.password,
            );
        }

        userPassword = await this.userPasswordRepository.update(userPassword);

        return UserPasswordMapper.entityToModel(userPassword);
    }
}
