import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";
import { Role } from "../../authorization/entities/Role";

@Entity({ tableName: "authentication_api_key" })
export class ApiKey {
    @PrimaryKey()
    @AutoMap()
    id?: number;

    @Property({ nullable: true })
    @AutoMap()
    key?: string;

    @ManyToOne({
        joinColumn: "role_id",
        entity: () => Role,
    })
    @AutoMap()
    role?: Role;
}
