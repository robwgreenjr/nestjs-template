import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "configuration" })
export class Configuration {
    @PrimaryKey()
    key!: string;

    @Property({ nullable: true })
    value?: string;

    @Property({ default: false, nullable: true })
    hashed?: boolean;
}
