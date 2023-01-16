import { UserPasswordModel } from "../models/UserPasswordModel";
import { UserPassword } from "../entities/UserPassword";
import { UserMapper } from "../../users/mappers/UserMapper";

export class UserPasswordMapper {
    static toEntity(userPasswordModel: UserPasswordModel): UserPassword {
        const userPassword = new UserPassword();
        userPassword.id = userPasswordModel.id;
        userPassword.password = userPasswordModel.password;
        userPassword.previousPassword = userPasswordModel.passwordPrevious;
        userPassword.user = userPasswordModel.user
            ? UserMapper.toEntity(userPasswordModel.user)
            : undefined;
        userPassword.createdOn = userPasswordModel.createdOn;

        return userPassword;
    }

    static entityToModel(userPassword: UserPassword): UserPasswordModel {
        const userPasswordModel = new UserPasswordModel();
        userPasswordModel.id = userPassword.id;
        userPasswordModel.password = userPassword.password;
        userPasswordModel.passwordPrevious = userPassword.previousPassword;
        userPasswordModel.user = userPassword.user
            ? UserMapper.entityToModel(userPassword.user)
            : undefined;
        userPasswordModel.createdOn = userPassword.createdOn;

        return userPasswordModel;
    }
}
