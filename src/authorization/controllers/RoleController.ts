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
import { RoleModel } from "../models/RoleModel";
import { RoleDto } from "../dtos/RoleDto";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { ROLE_MANAGER } from "../services/RoleManager";
import { IRoleManager } from "../services/IRoleManager";
import { PARAMETER_PROCESSOR } from "../../global/utilities/ParameterProcessor";
import { IParameterProcessor } from "../../global/utilities/IParameterProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

@Controller("authorization")
export class RoleController extends HypermediaController {
    constructor(
        @Inject(ROLE_MANAGER)
        private readonly roleManager: IRoleManager,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(PARAMETER_PROCESSOR)
        private readonly parameterProcessor: IParameterProcessor,
    ) {
        super();
    }

    @Post("role")
    async create(@Req() request: GlobalRequest, @Body() roleDto: RoleDto) {
        const roleModel = this.mapper.map(roleDto, RoleDto, RoleModel);

        return await this.roleManager.create(roleModel);
    }

    @Post("roles")
    async createAll(
        @Req() request: GlobalRequest,
        @Body() roleDtoList: RoleDto[],
    ) {
        const roleModelList = this.mapper.mapArray(
            roleDtoList,
            RoleDto,
            RoleModel,
        );

        return await this.roleManager.createAll(roleModelList);
    }

    @Get("role/:id")
    async find(@Req() request: GlobalRequest, @Param("id") id: number) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );
        queryModel.setPrimaryId(id);

        const result = await this.roleManager.find(queryModel);
        result.data = this.mapper.mapArray(result.data, RoleModel, RoleDto);

        return result;
    }

    @Get("roles")
    async findAll(@Req() request: GlobalRequest) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );

        const result = await this.roleManager.findAll(queryModel);
        result.data = this.mapper.mapArray(result.data, RoleModel, RoleDto);

        return result;
    }

    @Delete("role/:id")
    async remove(@Req() request: GlobalRequest, @Param("id") id: number) {
        await this.roleManager.delete(+id);
    }

    @Put("roles")
    async updateAll(
        @Req() request: GlobalRequest,
        @Body() roleDtoList: RoleDto[],
    ) {
        const roleModelList = this.mapper.mapArray(
            roleDtoList,
            RoleDto,
            RoleModel,
        );

        return await this.roleManager.updateAll(roleModelList);
    }

    @Put("role/:id")
    async update(
        @Req() request: GlobalRequest,
        @Param("id") id: number,
        @Body() roleDto: RoleDto,
    ) {
        const roleModel = this.mapper.map(roleDto, RoleDto, RoleModel);

        return await this.roleManager.update(+id, roleModel);
    }
}
