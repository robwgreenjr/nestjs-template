import {
    Collection,
    Entity,
    ManyToMany,
    PrimaryKey,
    Property,
} from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";
import { Permission } from "./Permission";
import { User } from "../../users/entities/User";

@Entity({ tableName: "authorization_role" })
export class Role {
    @PrimaryKey()
    @AutoMap()
    id?: number;

    @Property()
    @AutoMap()
    name?: string;

    @Property({ nullable: true })
    @AutoMap()
    description?: string;

    @ManyToMany({
        entity: () => Permission,
        pivotTable: "authorization_role_permission",
    })
    @AutoMap(() => [Permission])
    permissions = new Collection<Permission>(this);

    @ManyToMany({
        entity: () => User,
        pivotTable: "authorization_role_user",
    })
    @AutoMap(() => [User])
    users = new Collection<User>(this);
}
