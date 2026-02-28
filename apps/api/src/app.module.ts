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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
