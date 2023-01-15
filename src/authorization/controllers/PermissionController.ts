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
import { IPermissionManager } from "../services/IPermissionManager";
import { PermissionModel } from "../models/PermissionModel";
import { PermissionDto } from "../dtos/PermissionDto";
import { PERMISSION_MANAGER } from "../services/PermissionManager";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { PARAMETER_PROCESSOR } from "../../global/utilities/ParameterProcessor";
import { IParameterProcessor } from "../../global/utilities/IParameterProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

@Controller("authorization")
export class PermissionController extends HypermediaController {
    constructor(
        @Inject(PERMISSION_MANAGER)
        private readonly permissionManager: IPermissionManager,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(PARAMETER_PROCESSOR)
        private readonly parameterProcessor: IParameterProcessor,
    ) {
        super();
    }

    @Post("permission")
    async create(
        @Req() request: GlobalRequest,
        @Body() permissionDto: PermissionDto,
    ) {
        const permissionModel = this.mapper.map(
            permissionDto,
            PermissionDto,
            PermissionModel,
        );

        return await this.permissionManager.create(permissionModel);
    }

    @Post("permissions")
    async createAll(
        @Req() request: GlobalRequest,
        @Body() permissionDtoList: PermissionDto[],
    ) {
        const permissionModelList = this.mapper.mapArray(
            permissionDtoList,
            PermissionDto,
            PermissionModel,
        );

        return await this.permissionManager.createAll(permissionModelList);
    }

    @Get("permission/:id")
    async find(@Req() request: GlobalRequest, @Param("id") id: number) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );
        queryModel.setPrimaryId(id);

        const result = await this.permissionManager.find(queryModel);
        result.data = this.mapper.mapArray(
            result.data,
            PermissionModel,
            PermissionDto,
        );

        return result;
    }

    @Get("permissions")
    async findAll(@Req() request: GlobalRequest) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );

        const result = await this.permissionManager.findAll(queryModel);
        result.data = this.mapper.mapArray(
            result.data,
            PermissionModel,
            PermissionDto,
        );

        return result;
    }

    @Delete("permission/:id")
    async remove(@Req() request: GlobalRequest, @Param("id") id: number) {
        await this.permissionManager.delete(+id);
    }

    @Put("permissions")
    async updateAll(
        @Req() request: GlobalRequest,
        @Body() permissionDtoList: PermissionDto[],
    ) {
        const permissionModelList = this.mapper.mapArray(
            permissionDtoList,
            PermissionDto,
            PermissionModel,
        );

        return await this.permissionManager.updateAll(permissionModelList);
    }

    @Put("permission/:id")
    async update(
        @Req() request: GlobalRequest,
        @Param("id") id: number,
        @Body() permissionDto: PermissionDto,
    ) {
        const permissionModel = this.mapper.map(
            permissionDto,
            PermissionDto,
            PermissionModel,
        );

        return await this.permissionManager.update(+id, permissionModel);
    }
}
