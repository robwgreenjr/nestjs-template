import { PermissionDto } from "./PermissionDto";
import { UserDto } from "../../users/dtos/UserDto";

export class RoleDto {
    id?: number;
    name?: string;
    description?: string;
    permissions?: PermissionDto[];
    users?: UserDto[];
}
