import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./config/env.validation";
import { DatabaseModule } from "@ournigeria/database";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard } from "./auth/auth.guard";
import { ConversationsModule } from "./conversations/conversations.module";
import { ChatModule } from "./chat/chat.module";
import { ChartModule } from "./chart/chart.module";
import { TelegramModule } from "./telegram/telegram.module";
import { SourcesModule } from "./sources/sources.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { HealthModule } from "./health/health.module";
import { DonationModule } from "./donation/donation.module";
import { DevAuthModule } from "./auth/dev-auth.module";
import { OfficialsModule } from "./officials/officials.module";
import { PartiesModule } from "./parties/parties.module";
import { ProposalsModule } from "./proposals/proposals.module";
import { GeoModule } from "./geo/geo.module";
import { CompletenessModule } from "./completeness/completeness.module";
import { ActivityModule } from "./activity/activity.module";
import { ContactModule } from "./contact/contact.module";
import { EnrichmentModule } from "./enrichment/enrichment.module";

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
    ChartModule,
    AuthModule,
    ConversationsModule,
    ChatModule,
    TelegramModule,
    SourcesModule,
    NotificationsModule,
    AdminModule,
    FeedbackModule,
    DonationModule,
    HealthModule,
    OfficialsModule,
    PartiesModule,
    ProposalsModule,
    GeoModule,
    CompletenessModule,
    ActivityModule,
    ContactModule,
    EnrichmentModule,
    ...(process.env.NODE_ENV !== "production" ? [DevAuthModule] : []),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
