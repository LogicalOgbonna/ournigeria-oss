import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ElectionModule } from "../election/election.module";
import { ImagesModule } from "../images/images.module";
import { CampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";
import { AdminCampaignsService } from "./admin-campaigns.service";
import { AdminCampaignsController } from "./admin-campaigns.controller";
import { AdminCampaignCouncilService } from "./admin-campaign-council.service";

@Module({
  imports: [AuditModule, ElectionModule, ImagesModule],
  controllers: [CampaignsController, AdminCampaignsController],
  providers: [CampaignsService, AdminCampaignsService, AdminCampaignCouncilService],
  exports: [CampaignsService, AdminCampaignsService, AdminCampaignCouncilService],
})
export class CampaignsModule {}
