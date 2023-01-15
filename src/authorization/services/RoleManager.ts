import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { IRoleManager } from "./IRoleManager";
import { RoleModel } from "../models/RoleModel";
import { ROLE_REPOSITORY } from "../repositories/RolesRepository";
import { IRolesRepository } from "../repositories/IRolesRepository";
import { Role } from "../entities/Role";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../hypermedia/models/QueryResponse";

export const ROLE_MANAGER = "ROLE_MANAGER";

@Injectable()
export class RoleManager implements IRoleManager {
    constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRolesRepository,
        @InjectMapper()
        private readonly mapper: Mapper,
    ) {}

    async create(roleModel: RoleModel): Promise<RoleModel> {
        let role: Role = this.mapper.map(roleModel, RoleModel, Role);

        role = await this.roleRepository.create(role);

        return this.mapper.map(role, Role, RoleModel);
    }

    async createAll(roleModelList: RoleModel[]): Promise<RoleModel[]> {
        const roleList = this.mapper.mapArray(roleModelList, RoleModel, Role);

        const role: Role[] = await this.roleRepository.createAll(roleList);

        return this.mapper.mapArray(role, Role, RoleModel);
    }

    async delete(id: number): Promise<void> {
        const role: Role | null = await this.roleRepository.findById(id);

        if (!role) {
            throw new NotFoundException(`Role with id (${id}) wasn't found.`);
        }

        await this.roleRepository.delete(role);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const role: Role | null = await this.roleRepository.find(queryModel);

        if (!role) {
            throw new NotFoundException("Role not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [this.mapper.map(role, Role, RoleModel)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const role: Role[] = await this.roleRepository.findAll(queryModel);

        const queryResponse = new QueryResponse();
        queryResponse.data = [...this.mapper.mapArray(role, Role, RoleModel)];
        queryResponse.setCount(await this.roleRepository.count(queryModel));
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findAllByUserId(userId: number): Promise<RoleModel[]> {
        const role = await this.roleRepository.findAllByUserId(userId);

        return this.mapper.mapArray(role, Role, RoleModel);
    }

    async findById(id: number): Promise<RoleModel> {
        const role = await this.roleRepository.findById(id);

        if (!role) {
            throw new NotFoundException(`Role with id (${id}) wasn't found.`);
        }

        return this.mapper.map(role, Role, RoleModel);
    }

    async findByName(name: string): Promise<RoleModel> {
        const role = await this.roleRepository.findByName(name);

        if (!role) {
            throw new NotFoundException(
                `Role with name (${name}) wasn't found.`,
            );
        }

        return this.mapper.map(role, Role, RoleModel);
    }

    async update(id: number, roleModel: RoleModel): Promise<RoleModel> {
        let role = this.mapper.map(roleModel, RoleModel, Role);
        role.id = id;

        role = await this.roleRepository.update(role);

        return this.mapper.map(role, Role, RoleModel);
    }

    async updateAll(roleModelList: RoleModel[]): Promise<RoleModel[]> {
        const roleList = this.mapper.mapArray(roleModelList, RoleModel, Role);

        const role = await this.roleRepository.updateAll(roleList);

        return this.mapper.mapArray(role, Role, RoleModel);
    }
}
