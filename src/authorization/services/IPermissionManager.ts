import { PermissionModel } from "../models/PermissionModel";
import { IQueryManager } from "../../hypermedia/services/IQueryManager";

export interface IPermissionManager extends IQueryManager<PermissionModel> {}
