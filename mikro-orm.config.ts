import "dotenv/config";
import { entities } from "./src/AppImports";

export default {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dbName: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    discovery: {
        warnWhenNoEntities: false,
    },
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
    entities,
};
