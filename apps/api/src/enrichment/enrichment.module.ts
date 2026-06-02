import { Module } from "@nestjs/common";
import { AdminEnrichmentController } from "./admin-enrichment.controller";
import { EnrichmentApplyService } from "./enrichment-apply.service";
import { ChangeProposalService } from "./change-proposal.service";

@Module({
  controllers: [AdminEnrichmentController],
  providers: [EnrichmentApplyService, ChangeProposalService],
  exports: [EnrichmentApplyService, ChangeProposalService],
})
export class EnrichmentModule {}
