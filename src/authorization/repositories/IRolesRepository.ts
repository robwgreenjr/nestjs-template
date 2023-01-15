import { Role } from "../entities/Role";
import { IQueryRepository } from "../../database/repositories/IQueryRepository";

export interface IRolesRepository extends IQueryRepository<Role> {
    findAllByIdIn(ids: number[]): Promise<Role[]>;

    findAllByUserId(id: number): Promise<Role[]>;

    findByName(name: string): Promise<Role | null>;
}
