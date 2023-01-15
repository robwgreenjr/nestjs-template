import { ScopeProducerOptions } from "../types/ScopeProducerOptions";

export interface IScopeProducer {
    buildScopeList(options: ScopeProducerOptions): Promise<string>;
}
