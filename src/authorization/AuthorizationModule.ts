import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import {
    ROLE_REPOSITORY,
    RolesRepository,
} from "./repositories/RolesRepository";
import { ROLE_MANAGER, RoleManager } from "./services/RoleManager";
import {
    PERMISSION_REPOSITORY,
    PermissionsRepository,
} from "./repositories/PermissionsRepository";
import {
    PERMISSION_MANAGER,
    PermissionManager,
} from "./services/PermissionManager";
import { User } from "../users/entities/User";
import { Permission } from "./entities/Permission";
import { Role } from "./entities/Role";
import { UsersModule } from "../users/UsersModule";
import { PermissionController } from "./controllers/PermissionController";
import { RoleController } from "./controllers/RoleController";

const roleRepository = {
    provide: ROLE_REPOSITORY,
    useClass: RolesRepository,
};

const roleManager = {
    provide: ROLE_MANAGER,
    useClass: RoleManager,
};

const permissionRepository = {
    provide: PERMISSION_REPOSITORY,
    useClass: PermissionsRepository,
};

const permissionManager = {
    provide: PERMISSION_MANAGER,
    useClass: PermissionManager,
};

@Module({
    imports: [MikroOrmModule.forFeature([User, Permission, Role]), UsersModule],
    controllers: [PermissionController, RoleController],
    providers: [
        permissionRepository,
        permissionManager,
        roleRepository,
        roleManager,
    ],
    exports: [
        permissionRepository,
        permissionManager,
        roleRepository,
        roleManager,
    ],
})
export class AuthorizationModule {}
