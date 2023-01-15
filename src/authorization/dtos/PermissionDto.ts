import { AutoMap } from "@automapper/classes";

export class PermissionDto {
	@AutoMap()
	id?: number;

	@AutoMap()
	name?: string;

	@AutoMap()
	type?: string;

	@AutoMap()
	description?: string;
}
