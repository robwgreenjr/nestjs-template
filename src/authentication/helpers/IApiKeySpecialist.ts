export interface IApiKeySpecialist {
    validate(apiKey: string): Promise<string>;
}
