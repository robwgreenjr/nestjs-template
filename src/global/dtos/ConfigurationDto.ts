import { AutoMap } from "@automapper/classes";

export class ConfigurationDto {
    @AutoMap()
    key?: number;

    @AutoMap()
    value?: string;

    @AutoMap()
    hashed?: boolean;
}
