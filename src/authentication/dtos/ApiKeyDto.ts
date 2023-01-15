import { AutoMap } from "@automapper/classes";
import { RoleDto } from "../../authorization/dtos/RoleDto";

export class ApiKeyDto {
    @AutoMap()
    id?: number;

    @AutoMap()
    key?: string;

    @AutoMap()
    role?: RoleDto;
}
