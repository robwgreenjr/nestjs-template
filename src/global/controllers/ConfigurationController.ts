import { Body, Controller, Get, Inject, Param, Put } from "@nestjs/common";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { CONFIGURATION_MANAGER } from "../services/ConfigurationManager";
import { IConfigurationManager } from "../services/IConfigurationManager";
import { ConfigurationDto } from "../dtos/ConfigurationDto";
import { ConfigurationMapper } from "../mappers/ConfigurationMapper";

@Controller("configuration")
export class ConfigurationController extends HypermediaController {
    constructor(
        @Inject(CONFIGURATION_MANAGER)
        private readonly configurationManager: IConfigurationManager,
    ) {
        super();
    }

    @Get(":key")
    async find(@Param("key") key: string) {
        return await this.configurationManager.findByKey(key);
    }

    @Put()
    async update(@Body() configurationDto: ConfigurationDto) {
        let configurationModel =
            ConfigurationMapper.dtoToModel(configurationDto);

        configurationModel = await this.configurationManager.update(
            configurationModel,
        );

        return ConfigurationMapper.toDto(configurationModel);
    }
}
