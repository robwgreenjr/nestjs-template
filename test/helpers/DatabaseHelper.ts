import { Pool } from "pg";
import * as fs from "fs";

export const runSqlScript = async (connection: Pool, path: string): Promise<void> => {
    const query = fs.readFileSync(path, "utf8");
    
    await connection.query(query);
};
