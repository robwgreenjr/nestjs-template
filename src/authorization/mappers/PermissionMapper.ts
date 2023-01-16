import { PermissionModel } from "../models/PermissionModel";
import { PermissionDto } from "../dtos/PermissionDto";
import { Permission } from "../entities/Permission";

export class PermissionMapper {
    static toDto(permissionModel: PermissionModel): PermissionDto {
        return {
            id: permissionModel.id,
            name: permissionModel.name,
            type: permissionModel.type,
            description: permissionModel.description,
        };
    }

    static dtoToModel(permissionDto: PermissionDto): PermissionModel {
        return {
            id: permissionDto.id,
            name: permissionDto.name,
            type: permissionDto.type,
            description: permissionDto.description,
        };
    }

    static toEntity(permissionModel: PermissionModel): Permission {
        const permission = new Permission();
        permission.id = permissionModel.id;
        permission.name = permissionModel.name;
        permission.type = permissionModel.type;
        permission.description = permissionModel.description;

        return permission;
    }

    static entityToModel(permission: Permission): PermissionModel {
        return {
            id: permission.id,
            name: permission.name,
            type: permission.type,
            description: permission.description,
        };
    }
}
