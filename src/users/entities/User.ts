import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "user_simple" })
export class User {
    @PrimaryKey()
    id?: number;

    @Property()
    firstName?: string;

    @Property({ nullable: true })
    lastName?: string | null;

    @Property()
    email?: string;

    @Property({ nullable: true })
    phone?: string | null;

    @Property({ nullable: true })
    createdOn?: Date;

    @Property({
        onUpdate: () => new Date(),
        onCreate: () => null,
        nullable: true,
    })
    updatedOn?: Date = new Date();
}
