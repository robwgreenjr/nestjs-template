import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, Mapper } from "@automapper/core";
import { ConfigurationModel } from "../models/ConfigurationModel";
import { Configuration } from "../entities/Configuration";
import { ConfigurationDto } from "../dtos/ConfigurationDto";

@Injectable()
export class ConfigurationMapper extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(mapper, ConfigurationModel, Configuration);
            createMap(mapper, Configuration, ConfigurationModel);

            createMap(mapper, ConfigurationModel, ConfigurationDto);
            createMap(mapper, ConfigurationDto, ConfigurationModel);
        };
    }
}
