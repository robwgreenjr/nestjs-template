import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Req,
} from "@nestjs/common";
import { SIMPLE_USER_LOGIN } from "../services/SimpleUserLogin";
import { IUserLoginHandler } from "../services/IUserLoginHandler";
import { JWT_SPECIALIST } from "../helpers/JwtSpecialist";
import { IJwtSpecialist } from "../helpers/IJwtSpecialist";
import { SimpleUserLoginDto } from "../dtos/SimpleUserLoginDto";
import { HTTP_HEADER_PARSER } from "../utilities/HttpHeaderParser";
import { IHttpHeaderParser } from "../utilities/IHttpHeaderParser";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";
import { JwtMapper } from "../mappers/JwtMapper";

@Controller("authentication/jwt")
export class JwtController extends HypermediaController {
    constructor(
        @Inject(SIMPLE_USER_LOGIN)
        private readonly userLogin: IUserLoginHandler,
        @Inject(JWT_SPECIALIST)
        private readonly jwtSpecialist: IJwtSpecialist,
        @Inject(HTTP_HEADER_PARSER)
        private readonly httpHeaderParser: IHttpHeaderParser,
    ) {
        super();
    }

    @Post()
    @HttpCode(HttpStatus.OK)
    async generate(
        @Req() request: GlobalRequest,
        @Body() simpleUserLoginDto: SimpleUserLoginDto,
    ) {
        const jwtModel = await this.userLogin.jwtProvider(
            simpleUserLoginDto.email ?? "",
            simpleUserLoginDto.password ?? "",
        );

        return JwtMapper.toDto(jwtModel);
    }

    @Get()
    async validate(
        @Req() request: GlobalRequest,
        @Headers("authorization") bearerToken: string,
    ) {
        bearerToken = this.httpHeaderParser.getBearerToken(bearerToken);

        if (!bearerToken) {
            throw new BadRequestException("Invalid token provided.");
        }

        return await this.jwtSpecialist.validate(bearerToken);
    }
}
