import { MikroORM } from "@mikro-orm/core";
import "dotenv/config";
import { Pool } from "pg";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { DatabaseOptions } from "../../src/database/types/DatabaseOptions";
import { TestDatabase } from "../enums/TestDatabase";
import { entities } from "../../src/AppImports";

export const mikroOrmConfig = (databaseOptions: DatabaseOptions) => {
    return [
        MikroOrmModule.forRoot({
            type: "postgresql",
            host: databaseOptions.host,
            port: databaseOptions.port,
            dbName: databaseOptions.name,
            user: databaseOptions.user,
            password: databaseOptions.password,
            migrations: {
                tableName: "migrations",
                path: "./libs/database/migrations",
                pathTs: "./libs/database/migrations",
            },
            seeder: {
                path: "./libs/database/seeders",
                pathTs: "./libs/database/seeders",
                defaultSeeder: "DatabaseSeeder",
                glob: "!(*.d).{js,ts}",
                emit: "ts",
            },
            entities,
            allowGlobalContext: true,
        }),
    ];
};

export const buildDatabase = async (databaseOptions: DatabaseOptions) => {
    await createDatabase(databaseOptions);
    await migrateDatabase(databaseOptions);
};

export const createDatabase = async (databaseOptions: DatabaseOptions) => {
    if (databaseOptions.name === process.env.DATABASE_NAME) {
        throw Error("Can't create the main database again.");
    }

    const connection = new Pool({
        host: databaseOptions.host,
        port: databaseOptions.port,
        user: databaseOptions.user,
        password: databaseOptions.password,
        database: (TestDatabase.NAME as string) ?? "",
    });

    try {
        await connection.query(`CREATE DATABASE ${databaseOptions.name};`);
    } catch (exception) {
        //
    }

    await connection.end();
};

export const migrateDatabase = async (databaseOptions: DatabaseOptions) => {
    if (databaseOptions.name === process.env.DATABASE_NAME) {
        throw Error("Can't create the main database again.");
    }

    const orm = await ormSetup(databaseOptions);

    try {
        const migrator = orm.getMigrator();
        await migrator.up();
    } catch (exception) {
        //
    }

    await orm.close(true);
};

export const ormSetup = async (databaseOptions: DatabaseOptions) => {
    return await MikroORM.init({
        entities: [],
        dbName: databaseOptions.name,
        type: "postgresql",
        password: databaseOptions.password,
        host: databaseOptions.host,
        user: databaseOptions.user,
        port: databaseOptions.port,
        migrations: {
            tableName: "migrations",
            path: "./database/migrations",
            pathTs: "./database/migrations",
        },
        seeder: {
            path: "./database/seeders",
            pathTs: "./database/seeders",
            defaultSeeder: "DatabaseSeeder",
            glob: "!(*.d).{js,ts}",
            emit: "ts",
        },
        discovery: {
            warnWhenNoEntities: false,
        },
    });
};
