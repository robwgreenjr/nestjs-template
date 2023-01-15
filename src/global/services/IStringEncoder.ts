export interface IStringEncoder {
    encode(string: string): Promise<string>;

    verify(string: string, encodedString: string): Promise<boolean>;
}