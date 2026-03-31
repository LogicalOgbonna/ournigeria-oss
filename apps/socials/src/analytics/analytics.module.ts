import { Module } from "@nestjs/common";
import { EngagementService } from "./engagement.service.js";
import { AnalyticsController } from "./analytics.controller.js";
import { PlatformModule } from "../platforms/platform.module.js";

@Module({
  imports: [PlatformModule],
  providers: [EngagementService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
