import { Body, Controller, Inject, Post, Put, Req } from "@nestjs/common";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { PASSWORD_MANAGEMENT } from "../services/PasswordManagement";
import { IPasswordManagement } from "../services/IPasswordManagement";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { ResetPasswordTokenDto } from "../dtos/ResetPasswordTokenDto";
import { ChangePasswordDto } from "../dtos/ChangePasswordDto";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

@Controller("authentication/password")
export class PasswordManagementController extends HypermediaController {
    constructor(
        @Inject(PASSWORD_MANAGEMENT)
        private readonly passwordManagement: IPasswordManagement,
        @InjectMapper()
        private readonly mapper: Mapper,
    ) {
        super();
    }

    @Post("forgot")
    async forgot(
        @Req() request: GlobalRequest,
        @Body() forgotPasswordDto: ForgotPasswordDto,
    ) {
        const userPasswordModel = await this.mapper.map(
            forgotPasswordDto,
            ForgotPasswordDto,
            UserPasswordModel,
        );

        await this.passwordManagement.forgot(userPasswordModel);
    }

    @Post("reset")
    async reset(
        @Req() request: GlobalRequest,
        @Body() resetPasswordTokenDto: ResetPasswordTokenDto,
    ) {
        const userPasswordModel = await this.mapper.map(
            resetPasswordTokenDto,
            ResetPasswordTokenDto,
            UserPasswordModel,
        );

        await this.passwordManagement.reset(userPasswordModel);
    }

    @Put()
    async change(
        @Req() request: GlobalRequest,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        const userPasswordModel = await this.mapper.map(
            changePasswordDto,
            ChangePasswordDto,
            UserPasswordModel,
        );

        await this.passwordManagement.change(userPasswordModel);
    }
}
