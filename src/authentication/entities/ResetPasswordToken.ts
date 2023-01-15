import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authentication_reset_password_token" })
export class ResetPasswordToken {
    @PrimaryKey()
    @AutoMap()
    token?: string;

    @Property({ nullable: true })
    @AutoMap()
    createdOn?: Date;

    @ManyToOne({
        joinColumn: "user_id",
        entity: () => User,
    })
    @AutoMap()
    user?: User;
}
