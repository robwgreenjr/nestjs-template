import {
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { IUserLoginHandler } from "./IUserLoginHandler";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { JwtModel } from "../models/JwtModel";
import { USER_PASSWORD_MANAGER } from "./UserPasswordManager";
import { IUserPasswordManager } from "./IUserPasswordManager";
import { JWT_SPECIALIST } from "../helpers/JwtSpecialist";
import { IJwtSpecialist } from "../helpers/IJwtSpecialist";
import { ROLE_MANAGER } from "../../authorization/services/RoleManager";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IRoleManager } from "../../authorization/services/IRoleManager";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { SCOPE_PRODUCER } from "../helpers/ScopeProducer";
import { IScopeProducer } from "../helpers/IScopeProducer";

export const SIMPLE_USER_LOGIN = "SIMPLE_USER_LOGIN";

@Injectable()
export class SimpleUserLogin implements IUserLoginHandler {
    constructor(
        @Inject(ROLE_MANAGER)
        private readonly roleManager: IRoleManager,
        @Inject(USER_PASSWORD_MANAGER)
        private readonly userPasswordManager: IUserPasswordManager,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
        @Inject(JWT_SPECIALIST)
        private readonly jwtSpecialist: IJwtSpecialist,
        @Inject(SCOPE_PRODUCER)
        private readonly scopeProducer: IScopeProducer,
    ) {}

    async jwtProvider(identifier: string, password: string): Promise<JwtModel> {
        const userPassword = await this.login(identifier, password);

        if (typeof userPassword.user === "undefined") {
            return new JwtModel("");
        }

        let scopeList = "";
        if (userPassword.user.id) {
            scopeList = await this.scopeProducer.buildScopeList({
                userId: userPassword.user.id,
            });
        }

        const token = await this.jwtSpecialist.generate(
            userPassword.user,
            scopeList,
        );

        return new JwtModel(token);
    }

    async login(
        identifier: string,
        password: string,
    ): Promise<UserPasswordModel> {
        let userPassword: UserPasswordModel;
        try {
            userPassword = await this.userPasswordManager.findByUserEmail(
                identifier,
            );
        } catch (exception) {
            throw new UnauthorizedException(
                "Your password hasn't been set yet.",
            );
        }

        if (!userPassword || !userPassword.password) {
            throw new UnauthorizedException(
                "Your password hasn't been set yet.",
            );
        }

        let isVerified = false;
        try {
            isVerified = await this.bCryptEncoder.verify(
                password,
                userPassword.password,
            );
        } catch (exception) {
            throw new InternalServerErrorException(
                "Error occurred while verifying password.",
            );
        }

        if (!isVerified) {
            throw new UnauthorizedException("Your password isn't correct.");
        }

        return userPassword;
    }
}
