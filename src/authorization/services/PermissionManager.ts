import { IPermissionManager } from "./IPermissionManager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { PERMISSION_REPOSITORY } from "../repositories/PermissionsRepository";
import { IPermissionsRepository } from "../repositories/IPermissionsRepository";
import { PermissionModel } from "../models/PermissionModel";
import { Permission } from "../entities/Permission";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../global/models/QueryResponse";

export const PERMISSION_MANAGER = "PERMISSION_MANAGER";

@Injectable()
export class PermissionManager implements IPermissionManager {
    constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: IPermissionsRepository,
        @InjectMapper()
        private readonly mapper: Mapper,
    ) {}

    async create(permissionModel: PermissionModel): Promise<PermissionModel> {
        let permission: Permission = this.mapper.map(
            permissionModel,
            PermissionModel,
            Permission,
        );

        permission = await this.permissionRepository.create(permission);

        return this.mapper.map(permission, Permission, PermissionModel);
    }

    async createAll(
        permissionModelList: PermissionModel[],
    ): Promise<PermissionModel[]> {
        const permissionList = this.mapper.mapArray(
            permissionModelList,
            PermissionModel,
            Permission,
        );

        const permission: Permission[] =
            await this.permissionRepository.createAll(permissionList);

        return this.mapper.mapArray(permission, Permission, PermissionModel);
    }

    async delete(id: number): Promise<void> {
        const permission: Permission | null =
            await this.permissionRepository.findById(id);

        if (!permission) {
            throw new NotFoundException(
                `Permission with id (${id}) wasn't found.`,
            );
        }

        await this.permissionRepository.delete(permission);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const permission: Permission | null =
            await this.permissionRepository.find(queryModel);

        if (!permission) {
            throw new NotFoundException("Permission not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [
            this.mapper.map(permission, Permission, PermissionModel),
        ];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const permission: Permission[] =
            await this.permissionRepository.findAll(queryModel);

        const queryResponse = new QueryResponse();
        queryResponse.data = [
            ...this.mapper.mapArray(permission, Permission, PermissionModel),
        ];
        queryResponse.setCount(
            await this.permissionRepository.count(queryModel),
        );
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findById(id: number): Promise<PermissionModel> {
        const permission: Permission | null =
            await this.permissionRepository.findById(id);

        if (!permission) {
            throw new NotFoundException(
                `Permission with id (${id}) wasn't found.`,
            );
        }

        return this.mapper.map(permission, Permission, PermissionModel);
    }

    async update(
        id: number,
        permissionModel: PermissionModel,
    ): Promise<PermissionModel> {
        let permission: Permission = this.mapper.map(
            permissionModel,
            PermissionModel,
            Permission,
        );
        permission.id = id;

        permission = await this.permissionRepository.update(permission);

        return this.mapper.map(permission, Permission, PermissionModel);
    }

    async updateAll(
        permissionModelList: PermissionModel[],
    ): Promise<PermissionModel[]> {
        const permissionList = this.mapper.mapArray(
            permissionModelList,
            PermissionModel,
            Permission,
        );

        const permission: Permission[] =
            await this.permissionRepository.updateAll(permissionList);

        return this.mapper.mapArray(permission, Permission, PermissionModel);
    }
}
