import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRateLimitService } from "./chat-rate-limit.service";

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRateLimitService],
})
export class ChatModule {}
