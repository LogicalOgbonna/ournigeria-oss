import { Module } from "@nestjs/common";
import { AdminEnrichmentController } from "./admin-enrichment.controller";
import { EnrichmentApplyService } from "./enrichment-apply.service";
import { ChangeProposalService } from "./change-proposal.service";
import { ImagesModule } from "../images/images.module";

@Module({
  imports: [ImagesModule],
  controllers: [AdminEnrichmentController],
  providers: [EnrichmentApplyService, ChangeProposalService],
  exports: [EnrichmentApplyService, ChangeProposalService],
})
export class EnrichmentModule {}
