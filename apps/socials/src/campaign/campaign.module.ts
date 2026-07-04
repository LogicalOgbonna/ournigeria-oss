import { Module } from "@nestjs/common";
import { CampaignTemplateProvider } from "./campaign-template.provider.js";
import { CampaignController } from "./campaign.controller.js";

@Module({
  providers: [CampaignTemplateProvider],
  controllers: [CampaignController],
  exports: [CampaignTemplateProvider],
})
export class CampaignModule {}
