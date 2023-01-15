import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { AutoMap } from "@automapper/classes";

@Entity({ tableName: "authorization_permission" })
export class Permission {
	@PrimaryKey()
	@AutoMap()
	id?: number;

	@Property()
	@AutoMap()
	name?: string;

	@Property()
	@AutoMap()
	type?: string;

	@Property({ nullable: true })
	@AutoMap()
	description?: string;
}
