import { Body, Controller, Get, Inject, Param, Put } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { CONFIGURATION_MANAGER } from "../services/ConfigurationManager";
import { IConfigurationManager } from "../services/IConfigurationManager";
import { ConfigurationDto } from "../dtos/ConfigurationDto";
import { ConfigurationModel } from "../models/ConfigurationModel";

@Controller("configuration")
export class ConfigurationController extends HypermediaController {
    constructor(
        @Inject(CONFIGURATION_MANAGER)
        private readonly configurationManager: IConfigurationManager,
        @InjectMapper()
        private readonly mapper: Mapper,
    ) {
        super();
    }

    @Get(":key")
    async find(@Param("key") key: string) {
        return await this.configurationManager.findByKey(key);
    }

    @Put()
    async update(@Body() configurationDto: ConfigurationDto) {
        let configurationModel = this.mapper.map(
            configurationDto,
            ConfigurationDto,
            ConfigurationModel,
        );

        configurationModel = await this.configurationManager.update(
            configurationModel,
        );

        return this.mapper.map(
            configurationModel,
            ConfigurationModel,
            ConfigurationDto,
        );
    }
}
