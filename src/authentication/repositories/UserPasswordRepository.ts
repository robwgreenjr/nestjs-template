import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { IUserPasswordRepository } from "./IUserPasswordRepository";
import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { UserPassword } from "../entities/UserPassword";
import { User } from "../../users/entities/User";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";

export const USER_PASSWORD_REPOSITORY = "USER_PASSWORD_REPOSITORY";

@Injectable()
export class UserPasswordRepository implements IUserPasswordRepository {
    constructor(
        @InjectRepository(UserPassword)
        private readonly userPasswordRepository: EntityRepository<UserPassword>,
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
    ) {}

    async create(userPassword: UserPassword): Promise<UserPassword> {
        try {
            if (
                typeof userPassword.user !== "undefined" &&
                typeof userPassword.user.id !== "undefined"
            ) {
                userPassword.user = await this.userRepository.findOneOrFail({
                    id: userPassword.user.id,
                });
            }

            userPassword = this.userPasswordRepository.create(userPassword);

            await this.userPasswordRepository.persistAndFlush(userPassword);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return userPassword;
    }

    async delete(id: number): Promise<void> {
        try {
            const userPassword = await this.userPasswordRepository.find({ id });

            await this.userPasswordRepository.removeAndFlush(userPassword);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async findByUserEmail(email: string): Promise<ResetPasswordToken | null> {
        let result = null;

        try {
            result = await this.userPasswordRepository.find(
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

    async update(userPassword: UserPassword): Promise<UserPassword> {
        const entity = await this.userPasswordRepository.findOne(userPassword);

        if (!entity) {
            throw new NotFoundException("User password wasn't found.");
        }

        try {
            if (
                typeof userPassword.user !== "undefined" &&
                typeof userPassword.user.id !== "undefined"
            ) {
                userPassword.user = await this.userRepository.findOneOrFail({
                    id: userPassword.user.id,
                });
            }

            wrap(entity).assign(userPassword);
            await this.userPasswordRepository.upsert(entity);

            await this.userPasswordRepository.flush();
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return userPassword;
    }
}
