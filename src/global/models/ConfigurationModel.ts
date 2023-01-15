import { AutoMap } from "@automapper/classes";

export class ConfigurationModel {
    @AutoMap()
    key?: number;

    @AutoMap()
    value?: string;

    @AutoMap()
    hashed?: boolean;
}
