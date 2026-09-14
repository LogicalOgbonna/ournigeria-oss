import { Global, Module } from "@nestjs/common";
import { RevalidationService } from "./revalidation.service";

/** Global: any admin service that mutates public content can inject the pinger. */
@Global()
@Module({ providers: [RevalidationService], exports: [RevalidationService] })
export class RevalidationModule {}
