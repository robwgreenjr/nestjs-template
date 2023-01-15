import { HypermediaLink } from "./HypermediaLink";
import {HypermediaActionLink} from "./HypermediaActionLink";

export type HypermediaLinkList = {
    self: HypermediaLink;
    next?: HypermediaLink;
    actions?: HypermediaActionLink[];
}