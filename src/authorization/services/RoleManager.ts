import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IRoleManager } from "./IRoleManager";
import { RoleModel } from "../models/RoleModel";
import { ROLE_REPOSITORY } from "../repositories/RolesRepository";
import { IRolesRepository } from "../repositories/IRolesRepository";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../global/models/QueryResponse";
import { RoleMapper } from "../mappers/RoleMapper";

export const ROLE_MANAGER = "ROLE_MANAGER";

@Injectable()
export class RoleManager implements IRoleManager {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRolesRepository,
    ) {}

    async create(roleModel: RoleModel): Promise<RoleModel> {
        let role = RoleMapper.toEntity(roleModel);

        role = await this.roleRepository.create(role);

        return RoleMapper.entityToModel(role);
    }

    async createAll(roleModelList: RoleModel[]): Promise<RoleModel[]> {
        let roleList = roleModelList.map((roleModel) => {
            return RoleMapper.toEntity(roleModel);
        });

        roleList = await this.roleRepository.createAll(roleList);

        return roleList.map((role) => {
            return RoleMapper.entityToModel(role);
        });
    }

    async delete(id: number): Promise<void> {
        const role = await this.roleRepository.findById(id);

        if (!role) {
            throw new NotFoundException(`Role with id (${id}) wasn't found.`);
        }

        await this.roleRepository.delete(role);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const role = await this.roleRepository.find(queryModel);

        if (!role) {
            throw new NotFoundException("Role not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [RoleMapper.entityToModel(role)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const roleList = await this.roleRepository.findAll(queryModel);

        const queryResponse = new QueryResponse();
        queryResponse.data = roleList.map((role) => {
            return RoleMapper.entityToModel(role);
        });

        queryResponse.setCount(await this.roleRepository.count(queryModel));
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findAllByUserId(userId: number): Promise<RoleModel[]> {
        const roleList = await this.roleRepository.findAllByUserId(userId);

        return roleList.map((role) => {
            return RoleMapper.entityToModel(role);
        });
    }

    async findById(id: number): Promise<RoleModel> {
        const role = await this.roleRepository.findById(id);

        if (!role) {
            throw new NotFoundException(`Role with id (${id}) wasn't found.`);
        }

        return RoleMapper.entityToModel(role);
    }

    async findByName(name: string): Promise<RoleModel> {
        const role = await this.roleRepository.findByName(name);

        if (!role) {
            throw new NotFoundException(
                `Role with name (${name}) wasn't found.`,
            );
        }

        return RoleMapper.entityToModel(role);
    }

    async update(id: number, roleModel: RoleModel): Promise<RoleModel> {
        let role = RoleMapper.toEntity(roleModel);
        role.id = id;

        role = await this.roleRepository.update(role);

        return RoleMapper.entityToModel(role);
    }

    async updateAll(roleModelList: RoleModel[]): Promise<RoleModel[]> {
        let roleList = roleModelList.map((roleModel) => {
            return RoleMapper.toEntity(roleModel);
        });

        roleList = await this.roleRepository.updateAll(roleList);

        return roleList.map((role) => {
            return RoleMapper.entityToModel(role);
        });
    }
}
