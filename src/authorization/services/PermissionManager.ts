import { IPermissionManager } from "./IPermissionManager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PERMISSION_REPOSITORY } from "../repositories/PermissionsRepository";
import { IPermissionsRepository } from "../repositories/IPermissionsRepository";
import { PermissionModel } from "../models/PermissionModel";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../global/models/QueryResponse";
import { PermissionMapper } from "../mappers/PermissionMapper";

export const PERMISSION_MANAGER = "PERMISSION_MANAGER";

@Injectable()
export class PermissionManager implements IPermissionManager {
    constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: IPermissionsRepository,
    ) {}

    async create(permissionModel: PermissionModel): Promise<PermissionModel> {
        let permission = PermissionMapper.toEntity(permissionModel);

        permission = await this.permissionRepository.create(permission);

        return PermissionMapper.entityToModel(permission);
    }

    async createAll(
        permissionModelList: PermissionModel[],
    ): Promise<PermissionModel[]> {
        let permissionList = permissionModelList.map((permissionModel) => {
            return PermissionMapper.toEntity(permissionModel);
        });

        permissionList = await this.permissionRepository.createAll(
            permissionList,
        );

        return permissionList.map((permission) => {
            return PermissionMapper.entityToModel(permission);
        });
    }

    async delete(id: number): Promise<void> {
        const permission = await this.permissionRepository.findById(id);

        if (!permission) {
            throw new NotFoundException(
                `Permission with id (${id}) wasn't found.`,
            );
        }

        await this.permissionRepository.delete(permission);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const permission = await this.permissionRepository.find(queryModel);

        if (!permission) {
            throw new NotFoundException("Permission not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [PermissionMapper.entityToModel(permission)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const permissionList = await this.permissionRepository.findAll(
            queryModel,
        );

        const queryResponse = new QueryResponse();
        queryResponse.data = permissionList.map((permission) => {
            return PermissionMapper.entityToModel(permission);
        });

        queryResponse.setCount(
            await this.permissionRepository.count(queryModel),
        );
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findById(id: number): Promise<PermissionModel> {
        const permission = await this.permissionRepository.findById(id);

        if (!permission) {
            throw new NotFoundException(
                `Permission with id (${id}) wasn't found.`,
            );
        }

        return PermissionMapper.entityToModel(permission);
    }

    async update(
        id: number,
        permissionModel: PermissionModel,
    ): Promise<PermissionModel> {
        let permission = PermissionMapper.toEntity(permissionModel);
        permission.id = id;

        permission = await this.permissionRepository.update(permission);

        return PermissionMapper.entityToModel(permission);
    }

    async updateAll(
        permissionModelList: PermissionModel[],
    ): Promise<PermissionModel[]> {
        let permissionList = permissionModelList.map((permissionModel) => {
            return PermissionMapper.toEntity(permissionModel);
        });

        permissionList = await this.permissionRepository.updateAll(
            permissionList,
        );

        return permissionList.map((permission) => {
            return PermissionMapper.entityToModel(permission);
        });
    }
}
