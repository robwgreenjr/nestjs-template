import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";

@Entity({tableName: "user_simple"})
export class User {
    @PrimaryKey()
    @AutoMap()
    id?: number;

    @Property()
    @AutoMap()
    firstName?: string;

    @Property({nullable: true})
    @AutoMap()
    lastName?: string;

    @Property()
    @AutoMap()
    email?: string;

    @Property({nullable: true})
    @AutoMap()
    phone?: string;

    @Property({nullable: true})
    @AutoMap()
    createdOn?: Date;

    @Property({onUpdate: () => new Date(), onCreate: () => null, nullable: true})
    @AutoMap()
    updatedOn?: Date = new Date();
}
