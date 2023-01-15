import { Factory, Faker } from "@mikro-orm/seeder";
import { EntityData } from "@mikro-orm/core";
import { User } from "../../../src/users/entities/User";

export class UserFactory extends Factory<User> {
    model = User;

    protected definition(faker: Faker): EntityData<User> {
        return {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
        };
    }
}
