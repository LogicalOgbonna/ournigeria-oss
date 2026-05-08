import { Module } from "@nestjs/common";
import { AgentService } from "./agent.service.js";
import { SafetyFilter } from "./safety-filter.js";
import { DrafterService } from "./drafter.service.js";
import { PlatformModule } from "../platforms/platform.module.js";
import { ReplyQueueModule } from "../reply-queue/reply-queue.module.js";

@Module({
  imports: [PlatformModule, ReplyQueueModule],
  providers: [AgentService, SafetyFilter, DrafterService],
  exports: [AgentService, SafetyFilter],
})
export class IntelligenceModule {}
