import { ApiKey } from "../entities/ApiKey";
import { IQueryRepository } from "../../database/repositories/IQueryRepository";

export interface IApiKeyRepository extends IQueryRepository<ApiKey> {}
