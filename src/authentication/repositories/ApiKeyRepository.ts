import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
    NotImplementedException,
} from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { IApiKeyRepository } from "./IApiKeyRepository";
import { ApiKey } from "../entities/ApiKey";
import { Role } from "../../authorization/entities/Role";
import { QueryModel } from "../../global/models/QueryModel";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { QUERY_BUILDER } from "../../database/services/QueryBuilder";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";
import { IQueryBuilder } from "../../database/services/IQueryBuilder";

export const API_KEY_REPOSITORY = "API_KEY_REPOSITORY";

@Injectable()
export class ApiKeyRepository implements IApiKeyRepository {
    constructor(
        @InjectRepository(ApiKey)
        private readonly apiKeyRepository: EntityRepository<ApiKey>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
        @Inject(QUERY_BUILDER)
        private readonly queryBuilder: IQueryBuilder,
        @InjectRepository(Role)
        private readonly roleRepository: EntityRepository<Role>,
    ) {}

    async count(queryModel: QueryModel): Promise<number> {
        const where = this.queryBuilder.conditionBuilder(queryModel);

        return await this.apiKeyRepository.count(where);
    }

    async create(entity: ApiKey): Promise<ApiKey> {
        entity = this.apiKeyRepository.create(entity);

        if (!entity.role) {
            throw new BadRequestException("Role must be provided.");
        }

        let role = null;
        try {
            role = await this.roleRepository.findOne({
                id: entity.role?.id ?? -1,
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        if (!role) {
            throw new NotFoundException("Role not found.");
        }
        entity.role = role;

        try {
            await this.apiKeyRepository.persistAndFlush(entity);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    createAll(entityList: ApiKey[]): Promise<ApiKey[]> {
        throw new NotImplementedException("Here be dragons!");
    }

    async delete(entity: ApiKey): Promise<void> {
        try {
            await this.apiKeyRepository.removeAndFlush(entity);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }
    }

    async find(queryModel: QueryModel): Promise<ApiKey | null> {
        let entity: ApiKey | null = null;

        try {
            entity = await this.queryBuilder.find<ApiKey>({
                queryModel,
                entityRepository: this.apiKeyRepository,
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async findAll(queryModel: QueryModel): Promise<ApiKey[]> {
        let entityList: ApiKey[] = [];

        try {
            entityList = await this.queryBuilder.findAll<ApiKey>({
                queryModel,
                entityRepository: this.apiKeyRepository,
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entityList;
    }

    async findById(id: number): Promise<ApiKey | null> {
        let entity: ApiKey | null = null;

        try {
            entity = await this.apiKeyRepository.findOne(id);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async update(apiKey: ApiKey): Promise<ApiKey> {
        const entity = await this.apiKeyRepository.findOne({ id: apiKey.id });

        if (!entity) {
            throw new NotFoundException("Api Key wasn't found.");
        }

        // Do not allow any updates to API key itself
        apiKey.key = entity.key;

        if (!apiKey.role) {
            throw new BadRequestException("Role must be provided.");
        }

        let role = null;
        try {
            role = await this.roleRepository.findOne({
                id: apiKey.role?.id ?? -1,
            });
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        if (!role) {
            throw new NotFoundException("Role not found.");
        }
        apiKey.role = role;

        try {
            wrap(entity).assign(apiKey);

            await this.apiKeyRepository.persistAndFlush(entity);
        } catch (exception: any) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return apiKey;
    }

    updateAll(entityList: ApiKey[]): Promise<ApiKey[]> {
        throw new NotImplementedException("Here be dragons!");
    }
}
