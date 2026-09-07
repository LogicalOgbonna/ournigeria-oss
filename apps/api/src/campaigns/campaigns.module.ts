import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ElectionModule } from "../election/election.module";
import { CampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";
import { AdminCampaignsService } from "./admin-campaigns.service";

@Module({
  imports: [AuditModule, ElectionModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, AdminCampaignsService],
  exports: [CampaignsService, AdminCampaignsService],
})
export class CampaignsModule {}
