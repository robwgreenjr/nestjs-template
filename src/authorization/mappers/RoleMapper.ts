import { RoleDto } from "../dtos/RoleDto";
import { RoleModel } from "../models/RoleModel";
import { PermissionMapper } from "./PermissionMapper";
import { UserMapper } from "../../users/mappers/UserMapper";
import { Role } from "../entities/Role";

export class RoleMapper {
    static toDto(roleModel: RoleModel): RoleDto {
        return {
            id: roleModel.id,
            name: roleModel.name,
            description: roleModel.description,
            permissions: roleModel.permissions?.map((permissionModel) =>
                PermissionMapper.toDto(permissionModel),
            ),
            users: roleModel.users?.map((userModel) =>
                UserMapper.toDto(userModel),
            ),
        };
    }

    static dtoToModel(roleDto: RoleDto): RoleModel {
        return {
            id: roleDto.id,
            name: roleDto.name,
            description: roleDto.description,
            permissions: roleDto.permissions?.map((permissionDto) =>
                PermissionMapper.dtoToModel(permissionDto),
            ),
            users: roleDto.users?.map((userDto) =>
                UserMapper.dtoToModel(userDto),
            ),
        };
    }

    static toEntity(roleModel: RoleModel): Role {
        const role = new Role();
        role.id = roleModel.id;
        role.name = roleModel.name;
        role.description = roleModel.description;

        for (const permissionModel of roleModel.permissions ?? []) {
            role.permissions.add(PermissionMapper.toEntity(permissionModel));
        }

        for (const userModel of roleModel.users ?? []) {
            role.users.add(UserMapper.toEntity(userModel));
        }

        return role;
    }

    static entityToModel(role: Role): RoleModel {
        try {
            return {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions
                    .toArray()
                    .map((permissionModel) =>
                        PermissionMapper.toDto(permissionModel),
                    ),
                users: role.users
                    .toArray()
                    .map((user) => UserMapper.entityToModel(user)),
            };
        } catch (exception) {
            // do nothing
        }

        return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: [],
            users: [],
        };
    }
}
