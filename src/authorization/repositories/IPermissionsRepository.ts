import { Permission } from "../entities/Permission";
import { IQueryRepository } from "../../database/repositories/IQueryRepository";

export interface IPermissionsRepository extends IQueryRepository<Permission> {}
