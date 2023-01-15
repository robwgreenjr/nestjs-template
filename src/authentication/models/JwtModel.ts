import { AutoMap } from "@automapper/classes";

export class JwtModel {
    @AutoMap()
    token?: string;

    constructor(token?: string) {
        this.token = token;
    }
}