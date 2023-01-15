import { JwtModel } from "../models/JwtModel";
import { UserPasswordModel } from "../models/UserPasswordModel";

export interface IUserLoginHandler {
    jwtProvider(identifier: string, password: string): Promise<JwtModel>;

    login(identifier: string, password: string): Promise<UserPasswordModel>;
}