import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { validateEnv } from "./config/env.validation.js";
import { DatabaseModule } from "@ournigeria/database";
import { PlatformModule } from "./platforms/platform.module.js";
import { IntelligenceModule } from "./intelligence/intelligence.module.js";
import { ContentModule } from "./content/content.module.js";
import { SchedulerModule } from "./scheduler/scheduler.module.js";
import { ReplyQueueModule } from "./reply-queue/reply-queue.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { HealthModule } from "./health/health.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";

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
    NotificationsModule,
    PlatformModule,
    IntelligenceModule,
    ContentModule,
    SchedulerModule,
    ReplyQueueModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
