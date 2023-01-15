import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { IStringEncoder } from "./IStringEncoder";
import { compare, hash } from "bcrypt";
import { CONFIGURATION_MANAGER } from "./ConfigurationManager";
import { IConfigurationManager } from "./IConfigurationManager";
import { ConfigurationVariables } from "../enums/ConfigurationVariables";

export const BCRYPT_ENCODER = "BCRYPT_ENCODER";

@Injectable()
export class BCryptEncoder implements IStringEncoder {
    constructor(
        @Inject(CONFIGURATION_MANAGER)
        private readonly configurationManager: IConfigurationManager,
    ) {}

    async encode(string: string): Promise<string> {
        const saltRounds = await this.configurationManager.findByKey(
            ConfigurationVariables.SALT_ROUNDS,
        );

        try {
            return await hash(string, parseInt(saltRounds?.value ?? "10"));
        } catch (exception: any) {
            throw new InternalServerErrorException(
                "Server Error, please contact support.",
            );
        }
    }

    async verify(string: string, encodedString: string): Promise<boolean> {
        try {
            return await compare(string, encodedString);
        } catch (exception: any) {
            throw new InternalServerErrorException(
                "Server Error, please contact support.",
            );
        }
    }
}
