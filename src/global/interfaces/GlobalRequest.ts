import { FastifyRequest } from "fastify";
import { HypermediaRequest } from "../../hypermedia/interfaces/HypermediaRequest";
import { AuthenticationRequest } from "../../authentication/interfaces/AuthenticationRequest";
import { AuthorizationRequest } from "../../authorization/interfaces/AuthorizationRequest";

export interface GlobalRequest
    extends FastifyRequest,
        HypermediaRequest,
        AuthenticationRequest,
        AuthorizationRequest {
    backendUrl: string;
    environment: string;
}
