import { Controller, Get } from "@nestjs/common";
import { HypermediaController } from "../../hypermedia/controllers/HypermediaController";
import { ConfigService } from "@nestjs/config";

@Controller("health-check")
export class HealthCheckController extends HypermediaController {
    constructor(private readonly configService: ConfigService) {
        super();
    }

    @Get()
    async healthCheck() {
        return { env: this.configService.get<string>("ENV") };
    }
}
