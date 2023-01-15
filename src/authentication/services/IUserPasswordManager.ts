import { UserPasswordModel } from "../models/UserPasswordModel";

export interface IUserPasswordManager {
    create(userPasswordModel: UserPasswordModel): Promise<UserPasswordModel>;

    findByUserEmail(email: string): Promise<UserPasswordModel>;

    update(userPasswordModel: UserPasswordModel): Promise<UserPasswordModel>;

    delete(id: number): Promise<void>;
}