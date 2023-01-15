import { RoleModel } from "../models/RoleModel";
import { IQueryManager } from "../../hypermedia/services/IQueryManager";

export interface IRoleManager extends IQueryManager<RoleModel> {
    findAllByUserId(userId: number): Promise<RoleModel[]>;

    findByName(name: string): Promise<RoleModel>;
}
