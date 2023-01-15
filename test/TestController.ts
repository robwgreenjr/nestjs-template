import { Controller, Get, Req } from "@nestjs/common";
import { HypermediaController } from "../src/hypermedia/controllers/HypermediaController";
import { GlobalRequest } from "../src/global/interfaces/GlobalRequest";

@Controller()
export class TestController extends HypermediaController {
    constructor() {
        super();
    }

    @Get("test")
    async test(@Req() request: GlobalRequest) {
        return [];
    }
}
