import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IConfigurationManager } from "./IConfigurationManager";
import { CONFIGURATION_REPOSITORY } from "../repositories/ConfigurationRepository";
import { IConfigurationRepository } from "../repositories/IConfigurationRepository";
import { ConfigurationModel } from "../models/ConfigurationModel";
import { ConfigurationMapper } from "../mappers/ConfigurationMapper";

export const CONFIGURATION_MANAGER = "CONFIGURATION_MANAGER";

@Injectable()
export class ConfigurationManager implements IConfigurationManager {
    constructor(
        @Inject(CONFIGURATION_REPOSITORY)
        private readonly configurationRepository: IConfigurationRepository,
    ) {}

    async findByKey(key: string): Promise<ConfigurationModel | null> {
        const configuration = await this.configurationRepository.findByKey(key);

        if (!configuration) {
            throw new NotFoundException(
                `Configuration with key (${key}) wasn't found.`,
            );
        }

        return ConfigurationMapper.entityToModel(configuration);
    }

    async update(
        configurationModel: ConfigurationModel,
    ): Promise<ConfigurationModel> {
        let configuration = ConfigurationMapper.toEntity(configurationModel);

        configuration = await this.configurationRepository.update(
            configuration,
        );

        configurationModel = ConfigurationMapper.entityToModel(configuration);

        return configurationModel;
    }
}
