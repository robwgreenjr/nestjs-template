import { CommandFactory } from "nest-commander";
import { AppModule } from "./AppModule";

async function bootstrap() {
    await CommandFactory.run(AppModule);
}

bootstrap();
