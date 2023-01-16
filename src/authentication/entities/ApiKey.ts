import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Role } from "../../authorization/entities/Role";

@Entity({ tableName: "authentication_api_key" })
export class ApiKey {
    @PrimaryKey()
    id?: number;

    @Property({ nullable: true })
    key?: string;

    @ManyToOne({
        joinColumn: "role_id",
        entity: () => Role,
    })
    role?: Role;
}
