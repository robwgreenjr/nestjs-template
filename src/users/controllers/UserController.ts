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
import { SIMPLE_USER } from "../services/SimpleUser";
import { IUserManager } from "../services/IUserManager";
import { PARAMETER_PROCESSOR } from "../../global/utilities/ParameterProcessor";
import { IParameterProcessor } from "../../global/utilities/IParameterProcessor";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { UserDto } from "../dtos/UserDto";
import { UserModel } from "../models/UserModel";

@Controller()
export class UserController extends HypermediaController {
    constructor(
        @Inject(SIMPLE_USER)
        private readonly userManager: IUserManager,
        @InjectMapper()
        private readonly mapper: Mapper,
        @Inject(PARAMETER_PROCESSOR)
        private readonly parameterProcessor: IParameterProcessor,
    ) {
        super();
    }

    @Post("user")
    async create(@Req() request: GlobalRequest, @Body() userDto: UserDto) {
        const userModel = this.mapper.map(userDto, UserDto, UserModel);

        return await this.userManager.create(userModel);
    }

    @Post("users")
    async createAll(
        @Req() request: GlobalRequest,
        @Body() userDtoList: UserDto[],
    ) {
        const userModelList = this.mapper.mapArray(
            userDtoList,
            UserDto,
            UserModel,
        );

        return await this.userManager.createAll(userModelList);
    }

    @Get("user/:id")
    async find(@Req() request: GlobalRequest, @Param("id") id: number) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );
        queryModel.setPrimaryId(id);

        const result = await this.userManager.find(queryModel);
        result.data = this.mapper.mapArray(result.data, UserModel, UserDto);

        return result;
    }

    @Get("users")
    async findAll(@Req() request: GlobalRequest) {
        const queryModel = this.parameterProcessor.buildQueryModel(
            request.query,
        );

        const result = await this.userManager.findAll(queryModel);
        result.data = this.mapper.mapArray(result.data, UserModel, UserDto);

        return result;
    }

    @Delete("user/:id")
    async remove(@Req() request: GlobalRequest, @Param("id") id: number) {
        await this.userManager.delete(+id);
    }

    @Put("user/:id")
    async update(
        @Req() request: GlobalRequest,
        @Param("id") id: number,
        @Body() userDto: UserDto,
    ) {
        const userModel = this.mapper.map(userDto, UserDto, UserModel);

        return await this.userManager.update(+id, userModel);
    }

    @Put("users")
    async updateAll(
        @Req() request: GlobalRequest,
        @Body() userDtoList: UserDto[],
    ) {
        const userModelList = this.mapper.mapArray(
            userDtoList,
            UserDto,
            UserModel,
        );

        return await this.userManager.updateAll(userModelList);
    }
}
