import { Module } from "@nestjs/common";
import { CronService } from "./cron.service.js";
import { PlatformModule } from "../platforms/platform.module.js";
import { IntelligenceModule } from "../intelligence/intelligence.module.js";
import { ContentModule } from "../content/content.module.js";
import { DraftDigestNotifierService } from "./draft-digest-notifier.service.js";

@Module({
  imports: [PlatformModule, IntelligenceModule, ContentModule],
  providers: [CronService, DraftDigestNotifierService],
})
export class SchedulerModule {}
