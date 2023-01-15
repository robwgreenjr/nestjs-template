import { Migration } from "@mikro-orm/migrations";

export class Migration20220626082725 extends Migration {
    async up(): Promise<void> {
        this.addSql(`
            CREATE TABLE user_simple
            (
                id         INTEGER GENERATED ALWAYS AS IDENTITY,
                first_name VARCHAR(255) NOT NULL,
                last_name  VARCHAR(255) NULL,
                email      VARCHAR(255) NOT NULL,
                phone      VARCHAR(25)  NULL,
                created_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_on TIMESTAMP WITH TIME ZONE,
                PRIMARY KEY (email),
                UNIQUE (phone),
                UNIQUE (id)
            );

            CREATE TABLE authorization_role
            (
                id          INTEGER GENERATED ALWAYS AS IDENTITY,
                name        VARCHAR(100) NOT NULL,
                description TEXT         NULL,
                PRIMARY KEY (name),
                UNIQUE (id)
            );

            CREATE TABLE authorization_permission
            (
                id          INTEGER GENERATED ALWAYS AS IDENTITY,
                name        VARCHAR(100) NOT NULL,
                type        VARCHAR(100) NOT NULL,
                description TEXT         NULL,
                PRIMARY KEY (name, type),
                UNIQUE (id)
            );

            CREATE TABLE authorization_role_permission
            (
                role_id       INT4 NOT NULL REFERENCES authorization_role (id) ON DELETE CASCADE,
                permission_id INT4 NOT NULL REFERENCES authorization_permission (id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );

            CREATE TABLE authorization_role_user
            (
                role_id     INT4 NOT NULL REFERENCES authorization_role (id) ON DELETE CASCADE,
                user_id     INT4 NOT NULL REFERENCES user_simple (id) ON DELETE CASCADE,
                description TEXT NULL,
                PRIMARY KEY (role_id, user_id)
            );

            CREATE TABLE authentication_user_password
            (
                id                INTEGER GENERATED ALWAYS AS IDENTITY,
                user_id           INT4                     NOT NULL REFERENCES user_simple (id) ON DELETE CASCADE,
                password          VARCHAR(60)              NULL,
                previous_password VARCHAR(60)              NULL,
                created_on        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_on        TIMESTAMP WITH TIME ZONE,
                PRIMARY KEY (id),
                UNIQUE (user_id)
            );

            CREATE TABLE authentication_reset_password_token
            (
                user_id    INT4                     NOT NULL REFERENCES user_simple (id) ON DELETE CASCADE,
                token      VARCHAR(60)              NOT NULL,
                created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (token),
                UNIQUE (user_id)
            );

            CREATE TABLE configuration
            (
                key    VARCHAR(255) NOT NULL,
                value  VARCHAR(255) NULL,
                hashed BOOLEAN DEFAULT FALSE,
                PRIMARY KEY (key)
            );

            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'authorization', 'page',
                    'All page access to edit authorization data.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'users', 'page', 'Allow page access to edit user data.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'authorization', 'read',
                    'Allow access to all authorization read endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'authorization', 'write',
                    'Allow access to all authorization write endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'authentication', 'read',
                    'Allow access to all authentication read endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'authentication', 'write',
                    'Allow access to all authentication write endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'user', 'read', 'Allow access to all user read endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'users', 'read', 'Allow access to all user read endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'users', 'write', 'Allow access to all user write endpoints.');
            INSERT INTO authorization_permission
            VALUES (DEFAULT, 'user', 'write', 'Allow access to all user write endpoints.');

            INSERT INTO authorization_role
            VALUES (DEFAULT, 'ADMIN', 'Has full access.');

            INSERT INTO authorization_role_permission(permission_id, role_id)
            SELECT id                                                       as permission_id,
                   (SELECT id FROM authorization_role WHERE name = 'ADMIN') as role_id
            FROM authorization_permission
            ON CONFLICT DO NOTHING;

            INSERT INTO configuration (key, value)
            VALUES ('RESET_PASSWORD_EXPIRATION', '24h');
            INSERT INTO configuration (key, value)
            VALUES ('CREATE_PASSWORD_EXPIRATION', '24h');

            INSERT INTO configuration (key, value)
            VALUES ('JWT_EXPIRATION', '24h');
            INSERT INTO configuration (key, value)
            VALUES ('JWT_SECRET', 'change me in production');
            INSERT INTO configuration (key, value)
            VALUES ('SALT_ROUNDS', '12');
        `);
    }

    async down(): Promise<void> {
        this.addSql(`
            DROP TABLE authentication_user_password;
            DROP TABLE authentication_reset_password_token;
            DROP TABLE authorization_role_user;
            DROP TABLE authorization_role_permission;
            DROP TABLE authorization_permission;
            DROP TABLE authorization_role;
            DROP TABLE user_simple;
            DROP TABLE configuration;
        `);
    }
}
