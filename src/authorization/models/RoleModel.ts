import { AutoMap } from "@automapper/classes";
import { PermissionModel } from "./PermissionModel";
import { UserModel } from "../../users/models/UserModel";

export class RoleModel {
    @AutoMap()
    id?: number;

    @AutoMap()
    name?: string;

    @AutoMap()
    description?: string;

    @AutoMap(() => [PermissionModel])
    permissions?: PermissionModel[];

    @AutoMap(() => [UserModel])
    users?: UserModel[];
}
