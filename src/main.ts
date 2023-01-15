import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import "module-alias/register";
import { AppModule } from "./AppModule";
import { AuthorizationGuard } from "./authorization/guards/AuthorizationGuard";
import { HypermediaExceptionFilter } from "./hypermedia/filters/HypermediaExceptionFilter";

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );

    app.useGlobalGuards(new AuthorizationGuard());
    app.useGlobalFilters(new HypermediaExceptionFilter());

    const configService = new ConfigService();

    await app.listen(configService.get("SERVER_PORT") ?? "");
}

bootstrap();
