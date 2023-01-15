import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { IApiKeySpecialist } from "./IApiKeySpecialist";
import { API_KEY_MANAGER } from "../services/ApiKeyManager";
import { IApiKeyManager } from "../services/IApiKeyManager";
import { SCOPE_PRODUCER } from "./ScopeProducer";
import { IScopeProducer } from "./IScopeProducer";
import { BCRYPT_ENCODER } from "../../global/services/BCryptEncoder";
import { IStringEncoder } from "../../global/services/IStringEncoder";

export const API_KEY_SPECIALIST = "API_KEY_SPECIALIST";

@Injectable()
export class ApiKeySpecialist implements IApiKeySpecialist {
    constructor(
        @Inject(API_KEY_MANAGER)
        private readonly apiKeyManager: IApiKeyManager,
        @Inject(SCOPE_PRODUCER)
        private readonly scopeProducer: IScopeProducer,
        @Inject(BCRYPT_ENCODER)
        private readonly bCryptEncoder: IStringEncoder,
    ) {}

    async validate(apiKey: string): Promise<string> {
        apiKey = apiKey.replace("Bearer ", "");

        const findApiKeyId = apiKey.split("-");
        if (findApiKeyId.length <= 3) return "";

        const id = findApiKeyId[3];
        const entity = await this.apiKeyManager.findById(parseInt(id));

        let isVerified = false;
        try {
            isVerified = await this.bCryptEncoder.verify(
                apiKey,
                entity.getKey(),
            );
        } catch (exception) {
            throw new InternalServerErrorException(
                "Error occurred while verifying password.",
            );
        }

        if (!isVerified) {
            return "";
        }

        return await this.scopeProducer.buildScopeList({
            roleId: entity.role?.id,
        });
    }
}
