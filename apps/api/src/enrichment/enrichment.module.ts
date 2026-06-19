import { Module } from "@nestjs/common";
import { AdminEnrichmentController } from "./admin-enrichment.controller";
import { EnrichmentApplyService } from "./enrichment-apply.service";
import { ChangeProposalService } from "./change-proposal.service";
import { ImagesModule } from "../images/images.module";
import { CompletenessModule } from "../completeness/completeness.module";

@Module({
  imports: [ImagesModule, CompletenessModule],
  controllers: [AdminEnrichmentController],
  providers: [EnrichmentApplyService, ChangeProposalService],
  exports: [EnrichmentApplyService, ChangeProposalService],
})
export class EnrichmentModule {}
