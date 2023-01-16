import { ConfigurationModel } from "../models/ConfigurationModel";
import { ConfigurationDto } from "../dtos/ConfigurationDto";
import { Configuration } from "../entities/Configuration";

export class ConfigurationMapper {
    static toDto(configurationModel: ConfigurationModel): ConfigurationDto {
        return {
            key: configurationModel.key,
            value: configurationModel.value,
            hashed: configurationModel.hashed,
        };
    }

    static dtoToModel(configurationDto: ConfigurationDto): ConfigurationModel {
        return {
            key: configurationDto.key,
            value: configurationDto.value,
            hashed: configurationDto.hashed,
        };
    }

    static toEntity(configurationModel: ConfigurationModel): Configuration {
        return {
            key: configurationModel.key ?? "",
            value: configurationModel.value,
            hashed: configurationModel.hashed,
        };
    }

    static entityToModel(configuration: Configuration): ConfigurationModel {
        return {
            key: configuration.key,
            value: configuration.value,
            hashed: configuration.hashed,
        };
    }
}
