import { IHypermediaProcessor } from "./IHypermediaProcessor";
import { Injectable } from "@nestjs/common";
import { HypermediaResponse } from "../models/HypermediaResponse";
import { HypermediaLink } from "../types/HypermediaLink";
import { HypermediaOptions } from "../types/HypermediaOptions";
import { GlobalRequest } from "../../global/interfaces/GlobalRequest";

export const HYPERMEDIA_PROCESSOR = "HYPERMEDIA_PROCESSOR";

@Injectable()
export class HypermediaProcessor implements IHypermediaProcessor {
    private static buildNextHref(
        response: HypermediaResponse,
        url: string,
    ): HypermediaLink | null {
        const nextOffset = response.getPageCount() + response.getOffset();
        if (nextOffset >= response.getCount()) {
            return null;
        }

        const removeOffset: any = url.split(/[?&]offset=/g);

        let leftoverParameters: any = "";
        if (removeOffset.length === 2) {
            leftoverParameters = removeOffset[1].split("&");

            if (leftoverParameters.length > 1) {
                leftoverParameters.shift();
            }

            leftoverParameters = leftoverParameters.join("&");
        }
        leftoverParameters = leftoverParameters.includes("&")
            ? leftoverParameters
            : "";

        let finalUrl = removeOffset[0] + leftoverParameters;

        finalUrl.includes("?") ? (finalUrl += "&") : (finalUrl += "?");
        finalUrl += "offset=" + nextOffset;

        return {
            href: finalUrl,
            method: response.links.self.method,
        };
    }

    build(options: HypermediaOptions): HypermediaResponse {
        const response = new HypermediaResponse(options.queryResponse);
        response.links.self.href = `${
            (options.request.raw as unknown as GlobalRequest).backendUrl
        }${options.request.url.split("?")[0]}`;
        response.links.self.method = options.request.method;

        // Create next link when dealing with find all queries
        if (
            options.queryResponse &&
            options.queryResponse.getOffset() !== null
        ) {
            const nextLink = HypermediaProcessor.buildNextHref(
                response,
                `${
                    (options.request.raw as unknown as GlobalRequest).backendUrl
                }${options.request.url}`,
            );
            if (nextLink) {
                response.links.next = nextLink;
            }
        }

        if (options.data) {
            if (options.data.isArray) {
                response.data = options.data;

                return response;
            }

            response.data = [options.data];
        }

        response.meta.limit = response.meta.pageCount;

        return response;
    }
}
