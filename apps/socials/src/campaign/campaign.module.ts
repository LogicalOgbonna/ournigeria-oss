import { Module } from "@nestjs/common";
import { PlatformModule } from "../platforms/platform.module.js";
import { CampaignTemplateProvider } from "./campaign-template.provider.js";
import { CampaignController } from "./campaign.controller.js";

@Module({
  imports: [PlatformModule],
  providers: [CampaignTemplateProvider],
  controllers: [CampaignController],
  exports: [CampaignTemplateProvider],
})
export class CampaignModule {}
