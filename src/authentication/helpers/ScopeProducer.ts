import { Inject, Injectable } from "@nestjs/common";
import { ROLE_MANAGER } from "../../authorization/services/RoleManager";
import { USER_PASSWORD_MANAGER } from "../services/UserPasswordManager";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { JWT_SPECIALIST } from "./JwtSpecialist";
import { IRoleManager } from "../../authorization/services/IRoleManager";
import { IUserPasswordManager } from "../services/IUserPasswordManager";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { IJwtSpecialist } from "./IJwtSpecialist";
import { ScopeProducerOptions } from "../types/ScopeProducerOptions";
import { RoleModel } from "../../authorization/models/RoleModel";
import { IScopeProducer } from "./IScopeProducer";

export const SCOPE_PRODUCER = "SCOPE_PRODUCER";

@Injectable()
export class ScopeProducer implements IScopeProducer {
    constructor(
        @Inject(ROLE_MANAGER)
        private readonly roleManager: IRoleManager,
        @Inject(USER_PASSWORD_MANAGER)
        private readonly userPasswordManager: IUserPasswordManager,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
        @Inject(JWT_SPECIALIST)
        private readonly jwtSpecialist: IJwtSpecialist,
    ) {}

    async buildScopeList(options: ScopeProducerOptions): Promise<string> {
        const roleModels: RoleModel[] = [];

        if (typeof options.userId !== "undefined") {
            roleModels.push(
                ...(await this.roleManager.findAllByUserId(options.userId)),
            );
        }

        if (typeof options.roleId !== "undefined") {
            roleModels.push(await this.roleManager.findById(options.roleId));
        }

        let scopeList = "";
        for (const roleModel of roleModels) {
            if (typeof roleModel.permissions === "undefined") continue;

            for (const permissionModel of roleModel.permissions) {
                if (!scopeList) {
                    scopeList += `${permissionModel.name}.${permissionModel.type}`;

                    continue;
                }

                scopeList += `,${permissionModel.name}.${permissionModel.type}`;
            }
        }

        return scopeList;
    }
}
