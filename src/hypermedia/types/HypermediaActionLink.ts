import { HypermediaLink } from "./HypermediaLink";

export type HypermediaActionLink = HypermediaLink & {
    relation: string;
};