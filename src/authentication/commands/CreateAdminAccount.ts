import { Command, CommandRunner, Option } from "nest-commander";
import { Inject } from "@nestjs/common";
import { ROLE_MANAGER } from "../../authorization/services/RoleManager";
import { SIMPLE_USER } from "../../users/services/SimpleUser";
import { IRoleManager } from "../../authorization/services/IRoleManager";
import { IUserManager } from "../../users/services/IUserManager";

@Command({
    name: "create-admin",
    description: "Create an admin account.",
})
export class CreateAdminAccount extends CommandRunner {
    constructor(
        @Inject(ROLE_MANAGER)
        private readonly roleManager: IRoleManager,
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

        const user = await this.userManager.findByEmail(options.email);
        if (!user) return;

        const adminRole = await this.roleManager.findByName("ADMIN");
        if (!adminRole) return;

        adminRole.users?.push(user);
        await this.roleManager.update(adminRole.id ?? -1, adminRole);
    }

    @Option({
        flags: "-e, --email <email>",
        name: "email",
        description: "The users email address.",
    })
    parseEmail(email: string) {
        return email;
    }
}
