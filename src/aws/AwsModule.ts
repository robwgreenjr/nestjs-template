import { Module } from "@nestjs/common";
import { AWS_SES, SESSender } from "./services/SESSender";

const sesSender = {
    provide: AWS_SES,
    useClass: SESSender
};

@Module({
    imports: [],
    controllers: [],
    providers: [sesSender],
    exports: [sesSender]
})
export class AwsModule {
}
