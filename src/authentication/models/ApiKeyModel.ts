import { v4 as uuidv4 } from "uuid";
import { RoleModel } from "../../authorization/models/RoleModel";

export class ApiKeyModel {
    id?: number;
    role?: RoleModel;

    private key?: string;

    generateKey(): void {
        const keySections = uuidv4().split("-");
        keySections[2] = `${keySections[2]}-${this.id}`;

        this.key = keySections.join("-");
    }

    getKey(): string {
        return this.key ?? "";
    }

    setKey(key: string) {
        this.key = key;
    }
}
