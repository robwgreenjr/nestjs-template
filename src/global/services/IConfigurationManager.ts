import { ConfigurationModel } from "../models/ConfigurationModel";

export interface IConfigurationManager {
    update(configurationModel: ConfigurationModel): Promise<ConfigurationModel>;

    findByKey(key: string): Promise<ConfigurationModel | null>;
}
