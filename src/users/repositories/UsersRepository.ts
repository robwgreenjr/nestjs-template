import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { IUsersRepository } from "./IUsersRepository";
import { User } from "../entities/User";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";
import { QUERY_BUILDER } from "../../database/services/QueryBuilder";
import { IQueryBuilder } from "../../database/services/IQueryBuilder";
import { QueryModel } from "../../global/models/QueryModel";

export const USER_REPOSITORY = "USER_REPOSITORY";

@Injectable()
export class UsersRepository implements IUsersRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
        @Inject(QUERY_BUILDER)
        private readonly queryBuilder: IQueryBuilder,
    ) {}

    async count(queryModel: QueryModel): Promise<number> {
        const where = this.queryBuilder.conditionBuilder(queryModel);

        return await this.userRepository.count(where);
    }

    async create(user: User): Promise<User> {
        try {
            user = this.userRepository.create(user);

            await this.userRepository.persistAndFlush(user);

            const newData = await this.userRepository.findOne({ id: user.id });
            if (newData) {
                user = newData;
            }
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return user;
    }

    async createAll(userList: User[]): Promise<User[]> {
        try {
            for (let user of userList) {
                user = this.userRepository.create(user);

                this.userRepository.persist(user);
            }

            await this.userRepository.flush();
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return userList;
    }

    async delete(user: User): Promise<void> {
        try {
            await this.userRepository.removeAndFlush(user);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async find(queryModel: QueryModel): Promise<User | null> {
        let entity: User | null = null;

        try {
            entity = await this.queryBuilder.find<User>({
                queryModel,
                entityRepository: this.userRepository,
            });
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findAll(queryModel: QueryModel): Promise<User[]> {
        let entityList: User[] = [];

        try {
            entityList = await this.queryBuilder.findAll<User>({
                queryModel,
                entityRepository: this.userRepository,
            });
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findByEmail(email: string): Promise<User | null> {
        let entity: User | null = null;

        try {
            const result = await this.userRepository.find({ email });

            if (result) {
                entity = result[0];
            }
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findById(id: number): Promise<User | null> {
        let entity: User | null = null;

        try {
            entity = await this.userRepository.findOne(id);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async update(user: User): Promise<User> {
        const entity = await this.userRepository.findOne({ id: user.id });

        if (!entity) {
            throw new NotFoundException("User wasn't found.");
        }

        try {
            wrap(entity).assign(user);

            await this.userRepository.persistAndFlush(entity);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return user;
    }

    async updateAll(userList: User[]): Promise<User[]> {
        for (const user of userList) {
            const entity = await this.userRepository.findOne({ id: user.id });

            if (!entity) {
                throw new NotFoundException("User wasn't found.");
            }

            wrap(entity).assign(user);

            this.userRepository.persist(entity);
        }

        try {
            await this.userRepository.flush();
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return userList;
    }
}
