import { JwtModel } from "../models/JwtModel";
import { JwtDto } from "../dtos/JwtDto";

export class JwtMapper {
    static toDto(jwtModel: JwtModel): JwtDto {
        return {
            token: jwtModel.token,
        };
    }

    static dtoToModel(jwtDto: JwtDto): JwtModel {
        return {
            token: jwtDto.token,
        };
    }
}
