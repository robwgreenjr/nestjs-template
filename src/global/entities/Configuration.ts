import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";

@Entity({ tableName: "configuration" })
export class Configuration {
    @PrimaryKey()
    @AutoMap()
    key!: string;

    @Property({ nullable: true })
    @AutoMap()
    value?: string;

    @Property({ default: false, nullable: true })
    @AutoMap()
    hashed?: boolean;
}
