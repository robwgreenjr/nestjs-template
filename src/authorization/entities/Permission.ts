import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "authorization_permission" })
export class Permission {
    @PrimaryKey()
    id?: number;

    @Property()
    name?: string;

    @Property()
    type?: string;

    @Property({ nullable: true })
    description?: string;
}
