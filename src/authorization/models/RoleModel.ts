import { PermissionModel } from "./PermissionModel";
import { UserModel } from "../../users/models/UserModel";

export class RoleModel {
    id?: number;
    name?: string;
    description?: string;
    permissions?: PermissionModel[];
    users?: UserModel[];
}
