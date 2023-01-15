import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { PermissionModel } from "../models/PermissionModel";
import { PermissionDto } from "../dtos/PermissionDto";
import { Permission } from "../entities/Permission";
import { RoleModel } from "../models/RoleModel";
import { Role } from "../entities/Role";
import { RoleDto } from "../dtos/RoleDto";
import { UserModel } from "../../users/models/UserModel";
import { UserDto } from "../../users/dtos/UserDto";
import { User } from "../../users/entities/User";

@Injectable()
export class AuthorizationMapper extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(mapper, PermissionModel, PermissionDto);
            createMap(mapper, PermissionDto, PermissionModel);

            createMap(mapper, PermissionModel, Permission);
            createMap(mapper, Permission, PermissionModel);

            createMap(
                mapper,
                RoleModel,
                RoleDto,
                forMember(
                    (destination) => destination.permissions,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.permissions ?? [],
                            PermissionModel,
                            PermissionDto,
                        );
                    }),
                ),
                forMember(
                    (destination) => destination.users,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.users ?? [],
                            UserModel,
                            UserDto,
                        );
                    }),
                ),
            );
            createMap(
                mapper,
                RoleDto,
                RoleModel,
                forMember(
                    (destination) => destination.permissions,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.permissions ?? [],
                            PermissionDto,
                            PermissionModel,
                        );
                    }),
                ),
                forMember(
                    (destination) => destination.users,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.users ?? [],
                            UserDto,
                            UserModel,
                        );
                    }),
                ),
            );

            createMap(
                mapper,
                RoleModel,
                Role,
                forMember(
                    // @ts-ignore
                    (destination) => destination.permissions,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.permissions ?? [],
                            PermissionModel,
                            Permission,
                        );
                    }),
                ),
                forMember(
                    // @ts-ignore
                    (destination) => destination.users,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            source.users ?? [],
                            UserModel,
                            User,
                        );
                    }),
                ),
            );
            createMap(
                mapper,
                Role,
                RoleModel,
                forMember(
                    (destination) => destination.permissions,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            // @ts-ignore
                            source.permissions ?? [],
                            Permission,
                            PermissionModel,
                        );
                    }),
                ),
                forMember(
                    (destination) => destination.users,
                    mapFrom((source) => {
                        return this.mapper.mapArray(
                            // @ts-ignore
                            source.users ?? [],
                            User,
                            UserModel,
                        );
                    }),
                ),
            );
        };
    }
}
