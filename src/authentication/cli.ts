import { CommandFactory } from "nest-commander";
import { AuthenticationModule } from "./AuthenticationModule";

async function bootstrap() {
    await CommandFactory.run(AuthenticationModule);
}

bootstrap();
