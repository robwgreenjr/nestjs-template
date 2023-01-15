import { Global, Module } from "@nestjs/common";
import { HealthCheckController } from "./controllers/HealthCheckController";

@Global()
@Module({
    imports: [],
    controllers: [HealthCheckController],
    providers: [],
    exports: [],
})
export class HealthCheckModule {}
