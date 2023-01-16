import { UserDto } from "../dtos/UserDto";
import { UserModel } from "../models/UserModel";
import { User } from "../entities/User";

export class UserMapper {
    static toDto(userModel: UserModel): UserDto {
        return {
            id: userModel.id,
            firstName: userModel.firstName,
            lastName: userModel.lastName,
            email: userModel.email,
            phone: userModel.phone,
            createdOn: userModel.createdOn?.toISOString(),
            updatedOn: userModel.updatedOn?.toISOString(),
        };
    }

    static dtoToModel(userDto: UserDto): UserModel {
        return {
            id: userDto.id,
            firstName: userDto.firstName,
            lastName: userDto.lastName,
            email: userDto.email,
            phone: userDto.phone,
            createdOn: userDto.createdOn
                ? new Date(userDto.createdOn)
                : undefined,
            updatedOn: userDto.updatedOn
                ? new Date(userDto.updatedOn)
                : undefined,
        };
    }

    static toEntity(userModel: UserModel): User {
        const user = new User();
        user.id = userModel.id;
        user.firstName = userModel.firstName;
        user.lastName = userModel.lastName ? userModel.lastName : null;
        user.email = userModel.email;
        user.phone = userModel.phone ? userModel.phone : null;
        user.createdOn = userModel.createdOn;
        user.updatedOn = userModel.updatedOn;

        return user;
    }

    static entityToModel(user: User): UserModel {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName ?? undefined,
            email: user.email,
            phone: user.phone ?? undefined,
            createdOn: user.createdOn,
            updatedOn: user.updatedOn,
        };
    }
}
