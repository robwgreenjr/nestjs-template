import { ResetPasswordToken } from "../entities/ResetPasswordToken";
import { UserPassword } from "../entities/UserPassword";

export interface IUserPasswordRepository {
    create(userPassword: UserPassword): Promise<UserPassword>;

    delete(id: number): Promise<void>;

    findByUserEmail(email: string): Promise<ResetPasswordToken | null>;

    update(userPassword: UserPassword): Promise<UserPassword>;
}