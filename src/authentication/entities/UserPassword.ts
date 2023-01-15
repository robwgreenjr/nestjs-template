import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authentication_user_password" })
export class UserPassword {
    @PrimaryKey()
    @AutoMap()
    id?: number;

    @Property()
    @AutoMap()
    password?: string;

    @Property({ nullable: true })
    @AutoMap()
    passwordPrevious?: string;

    @Property({ nullable: true })
    @AutoMap()
    createdOn?: Date;

    @Property({ nullable: true })
    @AutoMap()
    updatedOn?: Date;

    @ManyToOne({
        joinColumn: "user_id",
        entity: () => User,
    })
    @AutoMap()
    user?: User;
}
