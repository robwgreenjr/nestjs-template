import { RoleDto } from "../../authorization/dtos/RoleDto";

export class ApiKeyDto {
    id?: number;
    key?: string;
    role?: RoleDto;
}
