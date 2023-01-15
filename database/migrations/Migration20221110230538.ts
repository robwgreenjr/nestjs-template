import { Migration } from "@mikro-orm/migrations";

export class Migration20221110230538 extends Migration {
    async up(): Promise<void> {
        this.addSql(`
            CREATE TABLE authentication_api_key
            (
                id      INTEGER GENERATED ALWAYS AS IDENTITY,
                key     VARCHAR(255) NULL,
                role_id INT4         NOT NULL REFERENCES authorization_role (id) ON DELETE CASCADE,
                PRIMARY KEY (id),
                UNIQUE (key)
            );
        `);
    }

    async down(): Promise<void> {
        this.addSql(`
            DROP TABLE authentication_api_key;
        `);
    }
}
