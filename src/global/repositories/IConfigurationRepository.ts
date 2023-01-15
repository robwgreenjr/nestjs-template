import { Configuration } from "../entities/Configuration";

export interface IConfigurationRepository {
    update(configuration: Configuration): Promise<Configuration>;

    findByKey(key: string): Promise<Configuration | null>;
}
