import { Body, Controller, Inject, Post, Put, Req } from "@nestjs/common";
import { PASSWORD_MANAGEMENT } from "../services/PasswordManagement";
import { IPasswordManagement } from "../services/IPasswordManagement";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { ResetPasswordTokenDto } from "../dtos/ResetPasswordTokenDto";
import { ChangePasswordDto } from "../dtos/ChangePasswordDto";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { ForgotPasswordMapper } from "../mappers/ForgotPasswordMapper";
import { ResetPasswordTokenMapper } from "../mappers/ResetPasswordTokenMapper";
import { ChangePasswordMapper } from "../mappers/ChangePasswordMapper";

@Controller("authentication/password")
export class PasswordManagementController extends HypermediaController {
    constructor(
        @Inject(PASSWORD_MANAGEMENT)
        private readonly passwordManagement: IPasswordManagement,
    ) {
        super();
    }

    @Post("forgot")
    async forgot(
        @Req() request: GlobalRequest,
        @Body() forgotPasswordDto: ForgotPasswordDto,
    ) {
        const userPasswordModel =
            ForgotPasswordMapper.dtoToModel(forgotPasswordDto);

        await this.passwordManagement.forgot(userPasswordModel);
    }

    @Post("reset")
    async reset(
        @Req() request: GlobalRequest,
        @Body() resetPasswordTokenDto: ResetPasswordTokenDto,
    ) {
        const userPasswordModel =
            ResetPasswordTokenMapper.dtoToUserPasswordModel(
                resetPasswordTokenDto,
            );

        await this.passwordManagement.reset(userPasswordModel);
    }

    @Put()
    async change(
        @Req() request: GlobalRequest,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        const userPasswordModel =
            ChangePasswordMapper.dtoToModel(changePasswordDto);

        await this.passwordManagement.change(userPasswordModel);
    }
}
