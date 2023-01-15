import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
    HYPERMEDIA_PROCESSOR,
    HypermediaProcessor,
} from "./helpers/HypermediaProcessor";

const hypermediaProcessor = {
    provide: HYPERMEDIA_PROCESSOR,
    useClass: HypermediaProcessor,
};

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    controllers: [],
    providers: [hypermediaProcessor],
    exports: [hypermediaProcessor],
})
export class HypermediaModule {}
