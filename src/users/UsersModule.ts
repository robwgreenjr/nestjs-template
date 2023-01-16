import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { SIMPLE_USER, SimpleUser } from "./services/SimpleUser";
import {
    USER_REPOSITORY,
    UsersRepository,
} from "./repositories/UsersRepository";
import { User } from "./entities/User";
import { UserController } from "./controllers/UserController";

const userManager = {
    provide: SIMPLE_USER,
    useClass: SimpleUser,
};

const userRepository = {
    provide: USER_REPOSITORY,
    useClass: UsersRepository,
};

@Module({
    imports: [MikroOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [userManager, userRepository],
    exports: [userManager, userRepository],
})
export class UsersModule {}
