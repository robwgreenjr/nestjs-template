import { Global, Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import {
    PARAMETER_PROCESSOR,
    ParameterProcessor,
} from "./utilities/ParameterProcessor";
import { TIME_SPECIALIST, TimeSpecialist } from "./utilities/TimeSpecialist";
import { BCRYPT_ENCODER, BCryptEncoder } from "./services/BCryptEncoder";
import {
    CONFIGURATION_REPOSITORY,
    ConfigurationRepository,
} from "./repositories/ConfigurationRepository";
import {
    CONFIGURATION_MANAGER,
    ConfigurationManager,
} from "./services/ConfigurationManager";
import { Configuration } from "./entities/Configuration";
import { ConfigurationController } from "./controllers/ConfigurationController";
import { ConfigurationMapper } from "./mappers/ConfigurationMapper";

const parameterProcessor = {
    provide: PARAMETER_PROCESSOR,
    useClass: ParameterProcessor,
};

const timeSpecialist = {
    provide: TIME_SPECIALIST,
    useClass: TimeSpecialist,
};

const bCryptEncoder = {
    provide: BCRYPT_ENCODER,
    useClass: BCryptEncoder,
};

const configurationRepository = {
    provide: CONFIGURATION_REPOSITORY,
    useClass: ConfigurationRepository,
};

const configurationManager = {
    provide: CONFIGURATION_MANAGER,
    useClass: ConfigurationManager,
};

@Global()
@Module({
    imports: [MikroOrmModule.forFeature([Configuration])],
    controllers: [ConfigurationController],
    providers: [
        configurationRepository,
        configurationManager,
        parameterProcessor,
        timeSpecialist,
        bCryptEncoder,
        ConfigurationMapper,
    ],
    exports: [
        parameterProcessor,
        timeSpecialist,
        bCryptEncoder,
        configurationRepository,
        configurationManager,
    ],
})
export class GlobalModule {}
