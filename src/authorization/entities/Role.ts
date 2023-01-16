import {
    Collection,
    Entity,
    ManyToMany,
    PrimaryKey,
    Property,
} from "@mikro-orm/core";
import { Permission } from "./Permission";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authorization_role" })
export class Role {
    @PrimaryKey()
    id?: number;

    @Property()
    name?: string;

    @Property({ nullable: true })
    description?: string;

    @ManyToMany({
        entity: () => Permission,
        pivotTable: "authorization_role_permission",
    })
    permissions = new Collection<Permission>(this);

    @ManyToMany({
        entity: () => User,
        pivotTable: "authorization_role_user",
    })
    users = new Collection<User>(this);
}
