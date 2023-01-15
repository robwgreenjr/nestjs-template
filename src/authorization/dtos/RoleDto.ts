import { AutoMap } from "@automapper/classes";
import { PermissionDto } from "./PermissionDto";
import { UserDto } from "../../users/dtos/UserDto";

export class RoleDto {
    @AutoMap()
    id?: number;

    @AutoMap()
    name?: string;

    @AutoMap()
    description?: string;

    @AutoMap(() => [PermissionDto])
    permissions?: PermissionDto[];

    @AutoMap(() => [UserDto])
    users?: UserDto[];
}
