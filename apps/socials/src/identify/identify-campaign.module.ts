import { Module } from "@nestjs/common";
import { IdentifyCampaignService } from "./identify-campaign.service.js";
import { PlatformModule } from "../platforms/platform.module.js";
import { IntelligenceModule } from "../intelligence/intelligence.module.js";
import { CampaignModule } from "../campaign/campaign.module.js";

@Module({
  imports: [PlatformModule, IntelligenceModule, CampaignModule],
  providers: [IdentifyCampaignService],
})
export class IdentifyCampaignModule {}
