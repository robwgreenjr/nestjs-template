import { UserPasswordModel } from "../models/UserPasswordModel";

export interface IPasswordManagement {
    change(userPasswordModel: UserPasswordModel): Promise<void>;

    forgot(userPasswordModel: UserPasswordModel): Promise<void>;

    reset(userPasswordModel: UserPasswordModel): Promise<void>;
}