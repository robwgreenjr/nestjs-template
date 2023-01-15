import { IRolesRepository } from "./IRolesRepository";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { Role } from "../entities/Role";
import { Permission } from "../entities/Permission";
import { User } from "../../users/entities/User";
import { QueryModel } from "../../global/models/QueryModel";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { QUERY_BUILDER } from "../../database/services/QueryBuilder";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";
import { IQueryBuilder } from "../../database/services/IQueryBuilder";

export const ROLE_REPOSITORY = "ROLE_REPOSITORY";

@Injectable()
export class RolesRepository implements IRolesRepository {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: EntityRepository<Role>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
        @Inject(QUERY_BUILDER)
        private readonly queryBuilder: IQueryBuilder,
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        @InjectRepository(Permission)
        private readonly permissionRepository: EntityRepository<Permission>,
    ) {}

    async count(queryModel: QueryModel): Promise<number> {
        const where = this.queryBuilder.conditionBuilder(queryModel);

        return this.roleRepository.count(where);
    }

    async create(role: Role): Promise<Role> {
        try {
            role = this.roleRepository.create(role);

            // Temporary hack to prevent duplicate inserts into relationships
            // Remove collections and then update after initial creation
            const userList = [];
            if (typeof role.users !== "undefined") {
                for (const user of role.users) {
                    const entity = await this.userRepository.findOne({
                        id: user.id,
                    });

                    if (!entity) {
                        throw new NotFoundException("User not found.");
                    }

                    userList.push(entity);
                }
            }
            // @ts-ignore
            role.users = [];

            const permissionList = [];
            if (typeof role.permissions !== "undefined") {
                for (const permission of role.permissions) {
                    const entity = await this.permissionRepository.findOne({
                        id: permission.id,
                    });

                    if (!entity) {
                        throw new NotFoundException("Permission not found.");
                    }

                    permissionList.push(entity);
                }
            }
            // @ts-ignore
            role.permissions = [];

            await this.roleRepository.persistAndFlush(role);

            role.permissions.set(permissionList);
            role.users.set(userList);

            await this.roleRepository.persistAndFlush(role);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return role;
    }

    async createAll(roleList: Role[]): Promise<Role[]> {
        try {
            for (const role of roleList) {
                // Temporary hack to prevent duplicate inserts into relationships
                // Remove collections and then update after initial creation
                const userList = [];
                if (typeof role.users !== "undefined") {
                    for (const user of role.users) {
                        const entity = await this.userRepository.findOne({
                            id: user.id,
                        });

                        if (!entity) {
                            throw new NotFoundException("User not found.");
                        }

                        userList.push(entity);
                    }
                }
                // @ts-ignore
                role.users = [];

                const permissionList = [];
                if (typeof role.permissions !== "undefined") {
                    for (const permission of role.permissions) {
                        const entity = await this.permissionRepository.findOne({
                            id: permission.id,
                        });

                        if (!entity) {
                            throw new NotFoundException(
                                "Permission not found.",
                            );
                        }

                        permissionList.push(entity);
                    }
                }
                // @ts-ignore
                role.permissions = [];

                await this.roleRepository.persistAndFlush(role);

                role.permissions.set(permissionList);
                role.users.set(userList);

                await this.roleRepository.persistAndFlush(role);
            }

            await this.roleRepository.flush();
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return roleList;
    }

    async delete(role: Role): Promise<void> {
        try {
            await this.roleRepository.removeAndFlush(role);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async find(queryModel: QueryModel): Promise<Role | null> {
        let entity: Role | null = null;

        try {
            entity = await this.queryBuilder.find<Role>({
                queryModel,
                entityRepository: this.roleRepository,
                populate: ["users", "permissions"],
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findAll(queryModel: QueryModel): Promise<Role[]> {
        let entityList: Role[] = [];

        try {
            entityList = await this.queryBuilder.findAll<Role>({
                queryModel,
                entityRepository: this.roleRepository,
                populate: ["users", "permissions"],
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findAllByIdIn(ids: number[]): Promise<Role[]> {
        let entityList: Role[] = [];

        try {
            entityList = await this.roleRepository.find(
                {
                    id: { $in: ids },
                },
                {
                    populate: ["users", "permissions"],
                },
            );
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findAllByUserId(id: number): Promise<Role[]> {
        let entityList: Role[] = [];

        try {
            entityList = await this.roleRepository.find(
                {
                    users: { id },
                },
                {
                    populate: ["users", "permissions"],
                },
            );
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findById(id: number): Promise<Role | null> {
        let entity: Role | null = null;

        try {
            entity = await this.roleRepository.findOne(id, {
                populate: ["users", "permissions"],
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findByName(name: string): Promise<Role | null> {
        let entity: Role | null = null;

        try {
            entity = await this.roleRepository.findOne(
                { name },
                {
                    populate: ["users", "permissions"],
                },
            );
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async update(role: Role): Promise<Role> {
        const entity = await this.roleRepository.findOne({ id: role.id });

        if (!entity) {
            throw new NotFoundException("Role wasn't found.");
        }

        try {
            const userList = [];
            if (typeof role.users !== "undefined") {
                for (const user of role.users) {
                    const entity = await this.userRepository.findOne({
                        id: user.id,
                    });

                    if (!entity) {
                        throw new NotFoundException("User not found.");
                    }

                    userList.push(entity);
                }
            }
            // @ts-ignore
            role.users = [];

            const permissionList = [];
            if (typeof role.permissions !== "undefined") {
                for (const permission of role.permissions) {
                    const entity = await this.permissionRepository.findOne({
                        id: permission.id,
                    });

                    if (!entity) {
                        throw new NotFoundException("Permission not found.");
                    }

                    permissionList.push(entity);
                }
            }
            // @ts-ignore
            role.permissions = [];

            wrap(entity).assign(role);

            await this.roleRepository.persistAndFlush(entity);

            entity.permissions.set(permissionList);
            entity.users.set(userList);

            await this.roleRepository.persistAndFlush(entity);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return role;
    }

    async updateAll(roleList: Role[]): Promise<Role[]> {
        try {
            for (const role of roleList) {
                const entity = await this.roleRepository.findOne({
                    id: role.id,
                });

                if (!entity) {
                    throw new NotFoundException("Role wasn't found.");
                }

                const userList = [];
                if (typeof role.users !== "undefined") {
                    for (const user of role.users) {
                        const entity = await this.userRepository.findOne({
                            id: user.id,
                        });

                        if (!entity) {
                            throw new NotFoundException("User not found.");
                        }

                        userList.push(entity);
                    }
                }
                // @ts-ignore
                role.users = [];

                const permissionList = [];
                if (typeof role.permissions !== "undefined") {
                    for (const permission of role.permissions) {
                        const entity = await this.permissionRepository.findOne({
                            id: permission.id,
                        });

                        if (!entity) {
                            throw new NotFoundException(
                                "Permission not found.",
                            );
                        }

                        permissionList.push(entity);
                    }
                }
                // @ts-ignore
                role.permissions = [];

                wrap(entity).assign(role);

                await this.roleRepository.persistAndFlush(entity);

                entity.permissions.set(permissionList);
                entity.users.set(userList);

                await this.roleRepository.persistAndFlush(entity);
            }
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return roleList;
    }
}
