import { Test, TestingModule } from "@nestjs/testing";
import { Pool, PoolConfig } from "pg";
import * as path from "path";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AutomapperModule } from "@automapper/nestjs";
import { mikro } from "@automapper/mikro";
import { CamelCaseNamingConvention } from "@automapper/core";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { TestDatabase } from "../../enums/TestDatabase";
import {
    buildDatabase,
    mikroOrmConfig,
} from "../../helpers/DatabaseConfigurations";
import { runSqlScript } from "../../helpers/DatabaseHelper";
import { RolesRepository } from "../../../src/authorization/repositories/RolesRepository";
import { User } from "../../../src/users/entities/User";
import { Permission } from "../../../src/authorization/entities/Permission";
import { Role } from "../../../src/authorization/entities/Role";
import { DatabaseModule } from "../../../src/database/DatabaseModule";
import { GlobalModule } from "../../../src/global/GlobalModule";
import { HypermediaModule } from "../../../src/hypermedia/HypermediaModule";
import { AuthorizationModule } from "../../../src/authorization/AuthorizationModule";

describe("RolesRepository (int)", () => {
    let app: NestFastifyApplication;
    let module: TestingModule;
    let databaseConnection: Pool;
    const databaseName = "roles_repository";

    let rolesRepository: RolesRepository;
    const emitProvider = {
        emit: () => {},
        on: () => {},
        removeAllListeners: () => {},
    };

    beforeAll(async () => {
        await buildDatabase({
            host: process.env.TEST_CONTAINER_HOST ?? "",
            port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
            user: TestDatabase.USER as string,
            password: TestDatabase.PASSWORD as string,
            name: databaseName,
        });

        const e2eDatabaseConfiguration: PoolConfig = {
            host: process.env.TEST_CONTAINER_HOST,
            port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
            user: TestDatabase.USER as string,
            password: TestDatabase.PASSWORD as string,
            database: databaseName,
        };

        databaseConnection = new Pool(e2eDatabaseConfiguration);

        module = await Test.createTestingModule({
            imports: [
                ...mikroOrmConfig({
                    host: process.env.TEST_CONTAINER_HOST ?? "",
                    port: parseInt(process.env.TEST_CONTAINER_PORT ?? ""),
                    user: TestDatabase.USER as string,
                    password: TestDatabase.PASSWORD as string,
                    name: databaseName,
                }),
                AutomapperModule.forRoot({
                    strategyInitializer: mikro(),
                    namingConventions: new CamelCaseNamingConvention(),
                }),
                EventEmitterModule.forRoot(),
                MikroOrmModule.forFeature([User, Permission, Role]),
                DatabaseModule,
                GlobalModule,
                HypermediaModule,
                AuthorizationModule,
            ],
            providers: [RolesRepository],
        })
            .overrideProvider(EventEmitter2)
            .useValue(emitProvider)
            .compile();

        app = module.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        rolesRepository = module.get<RolesRepository>(RolesRepository);
    });

    beforeEach(async () => {
        await runSqlScript(
            databaseConnection,
            path.join(__dirname, "../../", "sql/truncateDatabase.sql"),
        );
    });

    afterAll(async () => {
        await databaseConnection.end();
        await app.close();
    });

    describe("RolesRepository", () => {
        it("should be defined", async () => {
            expect(rolesRepository).toBeDefined();
        });
    });

    describe("findAllByIdIn", () => {
        it("given list of role ids should return correct list", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM authorization_role;`);

            const given = [result.rows[2].id, result.rows[4].id];

            const actual = await rolesRepository.findAllByIdIn(given);

            expect(actual.length).toBe(2);
            expect(actual[0].name).toEqual(result.rows[2].name);
            expect(actual[1].name).toEqual(result.rows[4].name);
        });
    });

    describe("findAllByUserId", () => {
        it("given given user id should return correct roles", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            const result = await databaseConnection.query(`SELECT *
                                                           FROM user_simple
                                                           WHERE first_name = 'first_name3'`);

            const expected = await databaseConnection.query(`SELECT *
                                                             FROM authorization_role
                                                             WHERE name = 'cname3'`);

            const expected2 = await databaseConnection.query(`SELECT *
                                                              FROM authorization_role
                                                              WHERE name = 'bname2'`);

            const actual = await rolesRepository.findAllByUserId(
                result.rows[0].id,
            );

            expect(actual.length).toBe(2);
            expect(actual[1].name).toEqual(expected.rows[0].name);
            expect(actual[0].name).toEqual(expected2.rows[0].name);
        });
    });

    describe("findByName", () => {
        it("given given user name should return role", async () => {
            await runSqlScript(
                databaseConnection,
                path.join(__dirname, "..", "sql/createRole.sql"),
            );

            const actual = await rolesRepository.findByName("aname");

            expect(actual?.name).toBeDefined();
            expect(actual?.name).toBe("aname");
        });
    });
});
