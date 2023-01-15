import { HypermediaActionLink } from "./HypermediaActionLink";

export type HypermediaRequestState = {
    relationship: string;
    links: HypermediaActionLink[];
}