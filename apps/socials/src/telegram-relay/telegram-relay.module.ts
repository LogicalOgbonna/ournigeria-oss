import { Module } from "@nestjs/common";
import { ReplyQueueModule } from "../reply-queue/reply-queue.module.js";
import { RoamerModule } from "../platforms/twitter/roamer/roamer.module.js";
import { TelegramBotClient } from "./telegram-bot.client.js";
import { TelegramPostRelayService } from "./telegram-post-relay.service.js";
import { TelegramPostCallbackService } from "./telegram-post-callback.service.js";
import { TweetIdReconciler } from "./tweet-id-reconciler.service.js";
import { UserTweetsReader } from "./user-tweets.reader.js";

// Telegram manual-posting relay. NOT yet wired into app.module.ts — that
// happens in Task 9. Delivery half: TelegramPostRelayService cards drafts.
// Ingestion half: TelegramPostCallbackService runs the singleton getUpdates
// leader loop and routes button taps back to the reply queue + reconciler.
// RoamerModule supplies BotSessionRepo + TwitterGraphqlClient (for the
// UserTweetsReader the reconciler reads with); ReplyQueueModule supplies
// ReplyQueueService.
@Module({
  imports: [ReplyQueueModule, RoamerModule],
  providers: [
    TelegramBotClient,
    TelegramPostRelayService,
    TelegramPostCallbackService,
    TweetIdReconciler,
    UserTweetsReader,
  ],
  exports: [TelegramBotClient, TelegramPostRelayService, TelegramPostCallbackService],
})
export class TelegramRelayModule {}
