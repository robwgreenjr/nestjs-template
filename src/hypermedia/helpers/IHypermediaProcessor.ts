import { HypermediaOptions } from "../types/HypermediaOptions";
import { HypermediaResponse } from "../models/HypermediaResponse";

export interface IHypermediaProcessor {
    build(options: HypermediaOptions): HypermediaResponse;
}
