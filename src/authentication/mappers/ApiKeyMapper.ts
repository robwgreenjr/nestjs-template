import { ApiKeyModel } from "../models/ApiKeyModel";
import { ApiKeyDto } from "../dtos/ApiKeyDto";
import { RoleMapper } from "../../authorization/mappers/RoleMapper";
import { ApiKey } from "../entities/ApiKey";

export class ApiKeyMapper {
    static toDto(apiKeyModel: ApiKeyModel): ApiKeyDto {
        return {
            id: apiKeyModel.id,
            key: apiKeyModel.getKey(),
            role: apiKeyModel.role
                ? RoleMapper.toDto(apiKeyModel.role)
                : undefined,
        };
    }

    static dtoToModel(apiKeyDto: ApiKeyDto): ApiKeyModel {
        const apiKeyModel = new ApiKeyModel();
        apiKeyModel.id = apiKeyDto.id;
        apiKeyModel.setKey(apiKeyDto.key ?? "");
        apiKeyModel.role = apiKeyDto.role
            ? RoleMapper.dtoToModel(apiKeyDto.role)
            : undefined;

        return apiKeyModel;
    }

    static toEntity(apiKeyModel: ApiKeyModel): ApiKey {
        const apiKey = new ApiKey();
        apiKey.id = apiKeyModel.id;
        apiKey.key = apiKeyModel.getKey();
        apiKey.role = apiKeyModel.role
            ? RoleMapper.toEntity(apiKeyModel.role)
            : undefined;

        return apiKey;
    }

    static entityToModel(apiKey: ApiKey): ApiKeyModel {
        const apiKeyModel = new ApiKeyModel();
        apiKeyModel.id = apiKey.id;
        apiKeyModel.setKey(apiKey.key ?? "");
        apiKeyModel.role = apiKey.role
            ? RoleMapper.entityToModel(apiKey.role)
            : undefined;

        return apiKeyModel;
    }
}
