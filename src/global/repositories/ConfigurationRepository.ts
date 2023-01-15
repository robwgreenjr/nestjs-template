import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/postgresql";
import { wrap } from "@mikro-orm/core";
import { IConfigurationRepository } from "./IConfigurationRepository";
import { Configuration } from "../entities/Configuration";
import { DATABASE_EXCEPTION_HANDLER } from "../../database/utilities/DatabaseExceptionHandler";
import { IDatabaseExceptionHandler } from "../../database/utilities/IDatabaseExceptionHandler";

export const CONFIGURATION_REPOSITORY = "CONFIGURATION_REPOSITORY";

@Injectable()
export class ConfigurationRepository implements IConfigurationRepository {
    constructor(
        @InjectRepository(Configuration)
        private readonly configurationRepository: EntityRepository<Configuration>,
        @Inject(DATABASE_EXCEPTION_HANDLER)
        private readonly exceptionHandler: IDatabaseExceptionHandler,
    ) {}

    async findByKey(key: string): Promise<Configuration | null> {
        let entity: Configuration | null = null;

        try {
            const result = await this.configurationRepository.find({ key });

            if (result) {
                entity = result[0];
            }
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return entity;
    }

    async update(configuration: Configuration): Promise<Configuration> {
        const entity = await this.configurationRepository.findOne({
            key: configuration.key,
        });

        if (!entity) {
            throw new NotFoundException("Configuration wasn't found.");
        }

        try {
            wrap(entity).assign(configuration);

            await this.configurationRepository.persistAndFlush(entity);
        } catch (exception) {
            this.exceptionHandler.exceptionHandler(exception);
        }

        return configuration;
    }
}
