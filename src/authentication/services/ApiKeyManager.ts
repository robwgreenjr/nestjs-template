import {
    Inject,
    Injectable,
    NotFoundException,
    NotImplementedException,
} from "@nestjs/common";
import { Mapper } from "@automapper/core";
import { InjectMapper } from "@automapper/nestjs";
import { IApiKeyManager } from "./IApiKeyManager";
import { API_KEY_REPOSITORY } from "../repositories/ApiKeyRepository";
import { IApiKeyRepository } from "../repositories/IApiKeyRepository";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { ApiKeyModel } from "../models/ApiKeyModel";
import { ApiKey } from "../entities/ApiKey";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../hypermedia/models/QueryResponse";

export const API_KEY_MANAGER = "API_KEY_MANAGER";

@Injectable()
export class ApiKeyManager implements IApiKeyManager {
    constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(apiKeyModel: ApiKeyModel): Promise<ApiKeyModel> {
        let apiKey: ApiKey = this.mapper.map(apiKeyModel, ApiKeyModel, ApiKey);

        apiKey = await this.apiKeyRepository.create(apiKey);

        apiKeyModel = this.mapper.map(apiKey, ApiKey, ApiKeyModel);
        apiKeyModel.generateKey();

        apiKey.key = await this.bCryptEncoder.encode(apiKeyModel.getKey());
        await this.apiKeyRepository.update(apiKey);

        return apiKeyModel;
    }

    createAll(modelList: ApiKeyModel[]): Promise<ApiKeyModel[]> {
        throw new NotImplementedException("Here be dragons!");
    }

    async delete(id: number): Promise<void> {
        const apiKey: ApiKey | null = await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new NotFoundException(
                `Api key with id (${id}) wasn't found.`,
            );
        }

        await this.apiKeyRepository.delete(apiKey);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const apiKey: ApiKey | null = await this.apiKeyRepository.find(
            queryModel,
        );

        if (!apiKey) {
            throw new NotFoundException("Api key not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [this.mapper.map(apiKey, ApiKey, ApiKeyModel)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const apiKey: ApiKey[] = await this.apiKeyRepository.findAll(
            queryModel,
        );

        const queryResponse = new QueryResponse();
        queryResponse.data = [
            ...this.mapper.mapArray(apiKey, ApiKey, ApiKeyModel),
        ];
        queryResponse.setCount(await this.apiKeyRepository.count(queryModel));
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setLimit(queryModel.limit ?? 200);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findById(id: number): Promise<ApiKeyModel> {
        const apiKey: ApiKey | null = await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new NotFoundException(
                `Api key with id (${id}) wasn't found.`,
            );
        }

        return this.mapper.map(apiKey, ApiKey, ApiKeyModel);
    }

    async update(id: number, apiKeyModel: ApiKeyModel): Promise<ApiKeyModel> {
        let apiKey: ApiKey = this.mapper.map(apiKeyModel, ApiKeyModel, ApiKey);
        apiKey.id = id;

        apiKey = await this.apiKeyRepository.update(apiKey);

        apiKeyModel = this.mapper.map(apiKey, ApiKey, ApiKeyModel);

        return apiKeyModel;
    }

    updateAll(modelList: ApiKeyModel[]): Promise<ApiKeyModel[]> {
        throw new NotImplementedException("Here be dragons!");
    }
}
