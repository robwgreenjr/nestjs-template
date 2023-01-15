import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { createMap, forMember, mapFrom, Mapper } from "@automapper/core";
import { JwtModel } from "../models/JwtModel";
import { JwtDto } from "../dtos/JwtDto";
import { ResetPasswordTokenModel } from "../models/ResetPasswordTokenModel";
import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { ResetPasswordTokenDto } from "../dtos/ResetPasswordTokenDto";
import { UserPassword } from "../entities/UserPassword";
import { UserPasswordModel } from "../models/UserPasswordModel";
import { ForgotPasswordDto } from "../dtos/ForgotPasswordDto";
import { ChangePasswordDto } from "../dtos/ChangePasswordDto";
import { ApiKeyModel } from "../models/ApiKeyModel";
import { ApiKey } from "../entities/ApiKey";
import { ApiKeyDto } from "../dtos/ApiKeyDto";

@Injectable()
export class AuthenticationMapper extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(mapper, JwtDto, JwtModel);
            createMap(mapper, JwtModel, JwtDto);

            createMap(mapper, ResetPasswordTokenModel, ResetPasswordToken);
            createMap(mapper, ResetPasswordToken, ResetPasswordTokenModel);

            createMap(mapper, ResetPasswordTokenModel, ResetPasswordTokenDto);
            createMap(mapper, ResetPasswordTokenDto, ResetPasswordTokenModel);

            createMap(mapper, UserPasswordModel, UserPassword);
            createMap(mapper, UserPassword, UserPasswordModel);

            createMap(mapper, ApiKeyModel, ApiKey);
            createMap(mapper, ApiKey, ApiKeyModel);

            createMap(mapper, ApiKeyModel, ApiKeyDto);
            createMap(mapper, ApiKeyDto, ApiKeyModel);

            createMap(mapper, UserPasswordModel, ForgotPasswordDto);
            createMap(
                mapper,
                ForgotPasswordDto,
                UserPasswordModel,
                forMember(
                    (destination) => destination.emailConfirmation,
                    mapFrom((source) => source.email),
                ),
            );

            createMap(mapper, UserPasswordModel, ResetPasswordTokenDto);
            createMap(
                mapper,
                ResetPasswordTokenDto,
                UserPasswordModel,
                forMember(
                    (destination) => destination.passwordConfirmation,
                    mapFrom((source) => source.passwordConfirmation),
                ),
            );

            createMap(
                mapper,
                ChangePasswordDto,
                UserPasswordModel,
                forMember(
                    (destination) => destination.passwordConfirmation,
                    mapFrom((source) => source.passwordConfirmation),
                ),
                forMember(
                    (destination) => destination.passwordCurrent,
                    mapFrom((source) => source.passwordCurrent),
                ),
            );
            createMap(
                mapper,
                UserPasswordModel,
                ChangePasswordDto,
                forMember(
                    (destination) => destination.passwordConfirmation,
                    mapFrom((source) => source.passwordConfirmation),
                ),
                forMember(
                    (destination) => destination.passwordCurrent,
                    mapFrom((source) => source.passwordCurrent),
                ),
            );
        };
    }
}
