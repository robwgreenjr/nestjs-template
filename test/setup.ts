import { StartedTestContainer } from "testcontainers/dist/test-container";
import { GenericContainer } from "testcontainers";
import { TestDatabase } from "./enums/TestDatabase";

module.exports = async function (globalConfig: any, projectConfig: any) {
    const container: StartedTestContainer = await new GenericContainer(
        TestDatabase.TYPE,
    )
        .withExposedPorts(TestDatabase.PORT)
        .withEnvironment({
            POSTGRES_USER: TestDatabase.USER as string,
            POSTGRES_PASSWORD: TestDatabase.PASSWORD as string,
            POSTGRES_DB: TestDatabase.NAME as string,
        })
        .start();

    process.env.TEST_CONTAINER_HOST = container.getHost();
    process.env.TEST_CONTAINER_PORT = container
        .getMappedPort(TestDatabase.PORT)
        .toString();

    // @ts-ignore
    globalThis.container = container;

    process.env.BACKEND_URL = "http://localhost:8080";
};
