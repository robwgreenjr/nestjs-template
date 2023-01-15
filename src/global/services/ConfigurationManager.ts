import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { IConfigurationManager } from "./IConfigurationManager";
import { CONFIGURATION_REPOSITORY } from "../repositories/ConfigurationRepository";
import { IConfigurationRepository } from "../repositories/IConfigurationRepository";
import { ConfigurationModel } from "../models/ConfigurationModel";
import { Configuration } from "../entities/Configuration";

export const CONFIGURATION_MANAGER = "CONFIGURATION_MANAGER";

@Injectable()
export class ConfigurationManager implements IConfigurationManager {
    constructor(
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(CONFIGURATION_REPOSITORY)
        private readonly configurationRepository: IConfigurationRepository,
    ) {}

    async findByKey(key: string): Promise<ConfigurationModel | null> {
        const configuration: Configuration | null =
            await this.configurationRepository.findByKey(key);

        if (!configuration) {
            throw new NotFoundException(
                `Authentication configuration with key (${key}) wasn't found.`,
            );
        }

        return this.mapper.map(
            configuration,
            Configuration,
            ConfigurationModel,
        );
    }

    async update(
        configurationModel: ConfigurationModel,
    ): Promise<ConfigurationModel> {
        let configuration: Configuration = this.mapper.map(
            configurationModel,
            ConfigurationModel,
            Configuration,
        );

        configuration = await this.configurationRepository.update(
            configuration,
        );

        configurationModel = this.mapper.map(
            configuration,
            Configuration,
            ConfigurationModel,
        );

        return configurationModel;
    }
}
