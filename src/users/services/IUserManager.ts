import "module-alias/register";
import { IQueryManager } from "../../hypermedia/services/IQueryManager";
import { UserModel } from "../models/UserModel";

export interface IUserManager extends IQueryManager<UserModel> {
    findByEmail(email: string): Promise<UserModel>;
}
