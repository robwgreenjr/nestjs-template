import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { WhiteListProvider } from "../models/WhiteListProvider";

@Injectable()
export class AuthorizationGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (
            request.raw.environment === "test" ||
            request.raw.environment === "local" ||
            request.raw.url === "/health-check"
        )
            return true;

        const uri = request.url.split("?")[0];

        const scope = this.buildScope(uri, request.method);
        if (!scope) return false;

        for (const white of new WhiteListProvider().getWhiteList()) {
            if (scope.split(".")[0] === white) return true;
        }

        let userId = null;
        if (typeof request.raw.userId !== "undefined") {
            userId = request.raw.userId;
        }

        if (uri === "/user/" + userId) return true;

        if (typeof request.raw.scopeList === "string") {
            if (request.raw.scopeList.includes(scope)) {
                return true;
            }
        }

        throw new ForbiddenException(
            `Your not authorized to use (${scope}) requested resources.`,
        );
    }

    private buildScope(uri: string, method: string): string {
        const splitUri = uri.split("/");
        if (splitUri.length === 1) return "";
        if (splitUri.length === 2 && !splitUri[0] && !splitUri[1]) return "";

        let scope = splitUri[1];
        if (method.toUpperCase() === "GET") {
            scope += ".read";
        } else {
            scope += ".write";
        }

        return scope;
    }
}
