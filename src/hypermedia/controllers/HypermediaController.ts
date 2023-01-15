import { UseInterceptors } from "@nestjs/common";
import { HypermediaInterceptor } from "../interceptors/HypermediaInterceptor";

@UseInterceptors(HypermediaInterceptor)
export class HypermediaController {}
