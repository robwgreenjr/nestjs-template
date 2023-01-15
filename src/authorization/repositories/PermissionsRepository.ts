import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { IPermissionsRepository } from "./IPermissionsRepository";
import { Permission } from "../entities/Permission";
import { QueryModel } from "../../global/models/QueryModel";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";
import { QUERY_BUILDER } from "../../database/services/QueryBuilder";
import { IQueryBuilder } from "../../database/services/IQueryBuilder";

export const PERMISSION_REPOSITORY = "PERMISSION_REPOSITORY";

@Injectable()
export class PermissionsRepository implements IPermissionsRepository {
    constructor(
        @InjectRepository(Permission)
        private readonly permissionRepository: EntityRepository<Permission>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
        @Inject(QUERY_BUILDER)
        private readonly queryBuilder: IQueryBuilder,
    ) {}

    async count(queryModel: QueryModel): Promise<number> {
        const where = this.queryBuilder.conditionBuilder(queryModel);

        return await this.permissionRepository.count(where);
    }

    async create(permission: Permission): Promise<Permission> {
        try {
            permission = this.permissionRepository.create(permission);

            await this.permissionRepository.persistAndFlush(permission);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return permission;
    }

    async createAll(permissionList: Permission[]): Promise<Permission[]> {
        try {
            for (let permission of permissionList) {
                permission = this.permissionRepository.create(permission);

                this.permissionRepository.persist(permission);
            }

            await this.permissionRepository.flush();
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return permissionList;
    }

    async delete(permission: Permission): Promise<void> {
        try {
            await this.permissionRepository.removeAndFlush(permission);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async find(queryModel: QueryModel): Promise<Permission | null> {
        let entity: Permission | null = null;

        try {
            entity = await this.queryBuilder.find<Permission>({
                queryModel,
                entityRepository: this.permissionRepository,
            });
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findAll(queryModel: QueryModel): Promise<Permission[]> {
        let entityList: Permission[] = [];

        try {
            entityList = await this.queryBuilder.findAll<Permission>({
                queryModel,
                entityRepository: this.permissionRepository,
            });
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findById(id: number): Promise<Permission | null> {
        let entity: Permission | null = null;

        try {
            entity = await this.permissionRepository.findOne(id);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async update(permission: Permission): Promise<Permission> {
        const entity = await this.findById(permission.id ?? -1);

        if (!entity) {
            throw new NotFoundException("Permission wasn't found.");
        }

        try {
            wrap(entity).assign(permission);

            await this.permissionRepository.persistAndFlush(entity);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return permission;
    }

    async updateAll(permissionList: Permission[]): Promise<Permission[]> {
        for (const permission of permissionList) {
            const entity = await this.permissionRepository.findOne({
                id: permission.id,
            });

            if (!entity) {
                throw new NotFoundException("User wasn't found.");
            }

            wrap(entity).assign(permission);

            this.permissionRepository.persist(entity);
        }

        try {
            await this.permissionRepository.flush();
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return permissionList;
    }
}
