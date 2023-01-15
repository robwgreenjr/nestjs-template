import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    Put,
    Req,
} from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { HTTP_HEADER_PARSER } from "../utilities/HttpHeaderParser";
import { PARAMETER_PROCESSOR } from "../../global/utilities/ParameterProcessor";
import { API_KEY_MANAGER } from "../services/ApiKeyManager";
import { IApiKeyManager } from "../services/IApiKeyManager";
import { IHttpHeaderParser } from "../utilities/IHttpHeaderParser";
import { IParameterProcessor } from "../../global/utilities/IParameterProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { ApiKeyDto } from "../dtos/ApiKeyDto";
import { ApiKeyModel } from "../models/ApiKeyModel";

@Controller("authentication")
export class ApiKeyController extends HypermediaController {
    constructor(
        @Inject(API_KEY_MANAGER)
        private readonly apiKeyManager: IApiKeyManager,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(HTTP_HEADER_PARSER)
        private readonly httpHeaderParser: IHttpHeaderParser,
        @Inject(PARAMETER_PROCESSOR)
        private readonly parameterProcessor: IParameterProcessor,
    ) {
        super();
    }

    @Post("api-key")
    async create(@Req() request: GlobalRequest, @Body() apiKeyDto: ApiKeyDto) {
        const apiKeyModel = this.mapper.map(apiKeyDto, ApiKeyDto, ApiKeyModel);

        return await this.apiKeyManager.create(apiKeyModel);
    }

    @Get("api-keys")
    async findAll(@Req() request: GlobalRequest) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );

        const result = await this.apiKeyManager.findAll(queryModel);
        result.data = this.mapper.mapArray(result.data, ApiKeyModel, ApiKeyDto);

        return result;
    }

    @Get("api-key/:id")
    async findById(@Req() request: GlobalRequest, @Param("id") id: number) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );
        queryModel.setPrimaryId(id);

        const result = await this.apiKeyManager.find(queryModel);
        result.data = this.mapper.mapArray(result.data, ApiKeyModel, ApiKeyDto);

        return result;
    }

    @Delete("api-key/:id")
    async remove(@Req() request: GlobalRequest, @Param("id") id: number) {
        await this.apiKeyManager.delete(+id);
    }

    @Put("api-key/:id")
    async update(
        @Req() request: GlobalRequest,
        @Param("id") id: number,
        @Body() apiKeyDto: ApiKeyDto,
    ) {
        const apiKeyModel = this.mapper.map(apiKeyDto, ApiKeyDto, ApiKeyModel);

        return await this.apiKeyManager.update(+id, apiKeyModel);
    }
}
