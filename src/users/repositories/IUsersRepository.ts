import { IQueryRepository } from "../../database/repositories/IQueryRepository";
import { User } from "../entities/User";

export interface IUsersRepository extends IQueryRepository<User> {
    findByEmail(email: string): Promise<User | null>;
}
