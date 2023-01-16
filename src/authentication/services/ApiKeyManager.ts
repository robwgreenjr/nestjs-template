import {
    Inject,
    Injectable,
    NotFoundException,
    NotImplementedException,
} from "@nestjs/common";
import { IApiKeyManager } from "./IApiKeyManager";
import { API_KEY_REPOSITORY } from "../repositories/ApiKeyRepository";
import { IApiKeyRepository } from "../repositories/IApiKeyRepository";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";
import { ApiKeyModel } from "../models/ApiKeyModel";
import { QueryModel } from "../../global/models/QueryModel";
import { QueryResponse } from "../../global/models/QueryResponse";
import { ApiKeyMapper } from "../mappers/ApiKeyMapper";

export const API_KEY_MANAGER = "API_KEY_MANAGER";

@Injectable()
export class ApiKeyManager implements IApiKeyManager {
    constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async create(apiKeyModel: ApiKeyModel): Promise<ApiKeyModel> {
        let apiKey = ApiKeyMapper.toEntity(apiKeyModel);

        apiKey = await this.apiKeyRepository.create(apiKey);

        apiKeyModel = ApiKeyMapper.entityToModel(apiKey);
        apiKeyModel.generateKey();

        apiKey.key = await this.bCryptEncoder.encode(apiKeyModel.getKey());
        await this.apiKeyRepository.update(apiKey);

        return apiKeyModel;
    }

    createAll(modelList: ApiKeyModel[]): Promise<ApiKeyModel[]> {
        throw new NotImplementedException("Here be dragons!");
    }

    async delete(id: number): Promise<void> {
        const apiKey = await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new NotFoundException(
                `Api key with id (${id}) wasn't found.`,
            );
        }

        await this.apiKeyRepository.delete(apiKey);
    }

    async find(queryModel: QueryModel): Promise<QueryResponse> {
        const apiKey = await this.apiKeyRepository.find(queryModel);

        if (!apiKey) {
            throw new NotFoundException("Api key not found.");
        }

        const queryResponse = new QueryResponse();
        queryResponse.data = [ApiKeyMapper.entityToModel(apiKey)];
        queryResponse.setCount(1);
        queryResponse.setPageCount(1);

        return queryResponse;
    }

    async findAll(queryModel: QueryModel): Promise<QueryResponse> {
        const apiKeyList = await this.apiKeyRepository.findAll(queryModel);

        const queryResponse = new QueryResponse();
        queryResponse.data = apiKeyList.map((apiKey) => {
            return ApiKeyMapper.entityToModel(apiKey);
        });
        queryResponse.setCount(await this.apiKeyRepository.count(queryModel));
        queryResponse.setOffset(queryModel.offset ?? 0);
        queryResponse.setLimit(queryModel.limit ?? 200);
        queryResponse.setPageCount(queryResponse.data.length);

        return queryResponse;
    }

    async findById(id: number): Promise<ApiKeyModel> {
        const apiKey = await this.apiKeyRepository.findById(id);

        if (!apiKey) {
            throw new NotFoundException(
                `Api key with id (${id}) wasn't found.`,
            );
        }

        return ApiKeyMapper.entityToModel(apiKey);
    }

    async update(id: number, apiKeyModel: ApiKeyModel): Promise<ApiKeyModel> {
        let apiKey = ApiKeyMapper.toEntity(apiKeyModel);
        apiKey.id = id;

        apiKey = await this.apiKeyRepository.update(apiKey);

        apiKeyModel = ApiKeyMapper.entityToModel(apiKey);

        return apiKeyModel;
    }

    updateAll(modelList: ApiKeyModel[]): Promise<ApiKeyModel[]> {
        throw new NotImplementedException("Here be dragons!");
    }
}
