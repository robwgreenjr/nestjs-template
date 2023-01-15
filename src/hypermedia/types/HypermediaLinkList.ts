import { HypermediaLink } from "./HypermediaLink";
import { HypermediaDataLink } from "./HypermediaDataLink";

export type HypermediaLinkList = {
    self: HypermediaLink;
    next?: HypermediaLink;
    data?: HypermediaDataLink[];
}