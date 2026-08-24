import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { validateEnv } from "./config/env.validation.js";
import { SocialsSettingsModule } from "./config/socials-settings.service.js";
import { DatabaseModule } from "@ournigeria/database";
import { PlatformModule } from "./platforms/platform.module.js";
import { IntelligenceModule } from "./intelligence/intelligence.module.js";
import { ContentModule } from "./content/content.module.js";
import { SchedulerModule } from "./scheduler/scheduler.module.js";
import { IdentifyCampaignModule } from "./identify/identify-campaign.module.js";
import { ProposalVerifyModule } from "./verify/proposal-verify.module.js";
import { ReplyQueueModule } from "./reply-queue/reply-queue.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { HealthModule } from "./health/health.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { TelegramRelayModule } from "./telegram-relay/telegram-relay.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule.forRoot({
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: false,
    }),
    ScheduleModule.forRoot(),
    SocialsSettingsModule,
    NotificationsModule,
    PlatformModule,
    IntelligenceModule,
    ContentModule,
    SchedulerModule,
    IdentifyCampaignModule,
    ProposalVerifyModule,
    ReplyQueueModule,
    AnalyticsModule,
    HealthModule,
    TelegramRelayModule,
  ],
})
export class AppModule {}
