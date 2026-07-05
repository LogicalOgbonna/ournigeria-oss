import { Module } from "@nestjs/common";
import { RoamerModule } from "../roamer/roamer.module.js";
import { InboxStateRepo } from "./inbox-state.repo.js";
import { InboxService } from "./inbox.service.js";

@Module({
  imports: [RoamerModule],
  providers: [InboxStateRepo, InboxService],
  exports: [InboxService],
})
export class InboxModule {}
