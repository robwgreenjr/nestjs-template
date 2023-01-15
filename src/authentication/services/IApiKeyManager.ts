import { IQueryManager } from "../../hypermedia/services/IQueryManager";
import { ApiKeyModel } from "../models/ApiKeyModel";

export interface IApiKeyManager extends IQueryManager<ApiKeyModel> {}
