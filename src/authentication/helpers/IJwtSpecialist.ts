import { UserModel } from "../../users/models/UserModel";

export interface IJwtSpecialist {
    generate(userModel: UserModel, scopeList: string): Promise<string>;

    validate(token: string): Promise<any>;
}
