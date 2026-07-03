import { Module } from "@nestjs/common";
import { CampaignTemplateProvider } from "./campaign-template.provider.js";

@Module({
  providers: [CampaignTemplateProvider],
  exports: [CampaignTemplateProvider],
})
export class CampaignModule {}
