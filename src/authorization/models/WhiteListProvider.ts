export class WhiteListProvider {
    private whiteList: string[] = [
        "authentication/jwt",
        "authentication/password",
    ];

    public getWhiteList() {
        return this.whiteList;
    }
}
