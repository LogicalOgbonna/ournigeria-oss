import { Module } from "@nestjs/common";
import { ReplyQueueService } from "./reply-queue.service.js";
import { ReplyQueueController } from "./reply-queue.controller.js";
import { PlatformModule } from "../platforms/platform.module.js";

@Module({
  imports: [PlatformModule],
  providers: [ReplyQueueService],
  controllers: [ReplyQueueController],
  exports: [ReplyQueueService],
})
export class ReplyQueueModule {}
