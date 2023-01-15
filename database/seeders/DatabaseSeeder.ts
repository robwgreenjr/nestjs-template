import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import {UserFactory} from "./factories/UserFactory";

export class DatabaseSeeder extends Seeder {
    async run(entityManager: EntityManager): Promise<void> {
        await new UserFactory(entityManager).create(1000);
    }
}
