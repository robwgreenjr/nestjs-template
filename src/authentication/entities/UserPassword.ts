import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authentication_user_password" })
export class UserPassword {
    @PrimaryKey()
    id?: number;

    @Property()
    password?: string;

    @Property({ nullable: true })
    previousPassword?: string;

    @Property({ nullable: true })
    createdOn?: Date;

    @Property({ nullable: true })
    updatedOn?: Date;

    @ManyToOne({
        joinColumn: "user_id",
        entity: () => User,
    })
    user?: User;
}
