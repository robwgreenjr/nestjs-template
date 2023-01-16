import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authentication_reset_password_token" })
export class ResetPasswordToken {
    @PrimaryKey()
    token?: string;

    @Property({ nullable: true })
    createdOn?: Date;

    @ManyToOne({
        joinColumn: "user_id",
        entity: () => User,
    })
    user?: User;
}
