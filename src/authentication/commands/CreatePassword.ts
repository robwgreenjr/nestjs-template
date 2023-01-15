import { Command, CommandRunner, Option } from "nest-commander";
import { Inject } from "@nestjs/common";
import { USER_PASSWORD_MANAGER } from "../services/UserPasswordManager";
import { IUserPasswordManager } from "../services/IUserPasswordManager";
import { SIMPLE_USER } from "../../users/services/SimpleUser";
import { IUserManager } from "../../users/services/IUserManager";
import { UserPasswordModel } from "../models/UserPasswordModel";

@Command({
    name: "create-password",
    description: "Create a password with provided user account.",
})
export class CreatePassword extends CommandRunner {
    constructor(
        @Inject(USER_PASSWORD_MANAGER)
        private readonly userPasswordManager: IUserPasswordManager,
        @Inject(SIMPLE_USER)
        private readonly userManager: IUserManager,
    ) {
        super();
    }

    async run(
        inputs: string[],
        options: Record<string, string>,
    ): Promise<void> {
        if (typeof options.email === "undefined") return;
        if (typeof options.password === "undefined") return;
        const userPassword = new UserPasswordModel();
        userPassword.password = options.password;

        const user = await this.userManager.findByEmail(options.email);
        if (!user) return;
        userPassword.user = user;

        // When using create password cli remove any existing passwords
        const existingPassword = await this.userPasswordManager.findByUserEmail(
            user.email ?? "",
        );
        if (existingPassword && typeof existingPassword.id !== "undefined") {
            await this.userPasswordManager.delete(existingPassword.id);
        }

        await this.userPasswordManager.create(userPassword);
    }

    @Option({
        flags: "-e, --email <email>",
        name: "email",
        description: "The users email address.",
    })
    parseEmail(email: string) {
        return email;
    }

    /**
     *
     * @param password
     */
    @Option({
        flags: "-p, --password <password>",
        name: "password",
        description: "The new user password.",
    })
    parsePassword(password: string) {
        return password;
    }
}
