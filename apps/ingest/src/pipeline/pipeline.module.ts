import { Module } from "@nestjs/common";
import { ExtractorsModule } from "../extractors/extractors.module";
import { BudgetPipeline } from "./budget.pipeline";
import { CorruptionPipeline } from "./corruption.pipeline";
import { GovspendPipeline } from "./govspend.pipeline";
import { FaacPipeline } from "./faac.pipeline";
import { PipelineRegistry } from "./pipeline.registry";
import { BudgetSummarizerService } from "./budget-summarizer.service";
import { CorruptionProfileService } from "./corruption-profile.service";

@Module({
  imports: [ExtractorsModule],
  providers: [
    BudgetSummarizerService,
    CorruptionProfileService,
    BudgetPipeline,
    CorruptionPipeline,
    GovspendPipeline,
    FaacPipeline,
    PipelineRegistry,
  ],
  exports: [PipelineRegistry],
})
export class PipelineModule {}
