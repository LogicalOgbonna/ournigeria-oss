import { Module } from "@nestjs/common";
import { IdentifyCampaignService } from "./identify-campaign.service.js";
import { PlatformModule } from "../platforms/platform.module.js";
import { IntelligenceModule } from "../intelligence/intelligence.module.js";

@Module({
  imports: [PlatformModule, IntelligenceModule],
  providers: [IdentifyCampaignService],
})
export class IdentifyCampaignModule {}
