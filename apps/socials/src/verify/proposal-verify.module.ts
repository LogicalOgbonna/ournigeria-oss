import { Module } from "@nestjs/common";
import { ProposalVerifyService } from "./proposal-verify.service.js";
import { PlatformModule } from "../platforms/platform.module.js";
import { IntelligenceModule } from "../intelligence/intelligence.module.js";

@Module({
  imports: [PlatformModule, IntelligenceModule],
  providers: [ProposalVerifyService],
})
export class ProposalVerifyModule {}
