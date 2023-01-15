import { AutoMap } from "@automapper/classes";

export class JwtDto {
    @AutoMap()
    token?: string;
}