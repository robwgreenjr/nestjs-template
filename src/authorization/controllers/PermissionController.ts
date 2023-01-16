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
import { IPermissionManager } from "../services/IPermissionManager";
import { PermissionDto } from "../dtos/PermissionDto";
import { PERMISSION_MANAGER } from "../services/PermissionManager";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { PARAMETER_PROCESSOR } from "../../global/utilities/ParameterProcessor";
import { IParameterProcessor } from "../../global/utilities/IParameterProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { PermissionMapper } from "../mappers/PermissionMapper";

@Controller("authorization")
export class PermissionController extends HypermediaController {
    constructor(
        @Inject(PERMISSION_MANAGER)
        private readonly permissionManager: IPermissionManager,
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
        const permissionModel = PermissionMapper.dtoToModel(permissionDto);

        return await this.permissionManager.create(permissionModel);
    }

    @Post("permissions")
    async createAll(
        @Req() request: GlobalRequest,
        @Body() permissionDtoList: PermissionDto[],
    ) {
        const permissionModelList = permissionDtoList.map((permissionDto) => {
            return PermissionMapper.dtoToModel(permissionDto);
        });

        return await this.permissionManager.createAll(permissionModelList);
    }

    @Get("permission/:id")
    async find(@Req() request: GlobalRequest, @Param("id") id: number) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );
        queryModel.setPrimaryId(id);

        const result = await this.permissionManager.find(queryModel);
        result.data = result.data.map((permissionModel) => {
            return PermissionMapper.toDto(permissionModel);
        });

        return result;
    }

    @Get("permissions")
    async findAll(@Req() request: GlobalRequest) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );

        const result = await this.permissionManager.findAll(queryModel);
        result.data = result.data.map((permissionModel) => {
            return PermissionMapper.toDto(permissionModel);
        });

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
        const permissionModelList = permissionDtoList.map((permissionDto) => {
            return PermissionMapper.dtoToModel(permissionDto);
        });

        return await this.permissionManager.updateAll(permissionModelList);
    }

    @Put("permission/:id")
    async update(
        @Req() request: GlobalRequest,
        @Param("id") id: number,
        @Body() permissionDto: PermissionDto,
    ) {
        const permissionModel = PermissionMapper.dtoToModel(permissionDto);

        return await this.permissionManager.update(+id, permissionModel);
    }
}
