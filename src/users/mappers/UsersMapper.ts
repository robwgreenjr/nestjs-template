import { Injectable } from "@nestjs/common";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import {
    condition,
    createMap,
    forMember,
    ignore,
    Mapper,
} from "@automapper/core";
import { UserModel } from "../models/UserModel";
import { UserDto } from "../dtos/UserDto";
import { User } from "../entities/User";

@Injectable()
export class UserMapper extends AutomapperProfile {
    constructor(@InjectMapper() mapper: Mapper) {
        super(mapper);
    }

    override get profile() {
        return (mapper: Mapper) => {
            createMap(mapper, UserModel, UserDto);
            createMap(mapper, UserDto, UserModel);

            createMap(
                mapper,
                UserModel,
                User,
                forMember(
                    (destination) => destination.createdOn,
                    condition((source) => source.createdOn !== null),
                ),
                forMember((destination) => destination.updatedOn, ignore()),
                forMember(
                    (destination) => destination.lastName,
                    condition(
                        (source) =>
                            typeof source.lastName === "string" &&
                            source.lastName.length > 0,
                    ),
                ),
                forMember(
                    (destination) => destination.phone,
                    condition(
                        (source) =>
                            typeof source.phone === "string" &&
                            source.phone.length > 0,
                    ),
                ),
            );
            createMap(mapper, User, UserModel);
        };
    }
}
