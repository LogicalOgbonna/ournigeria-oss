import { Module } from "@nestjs/common";
import { ExtractorsModule } from "../extractors/extractors.module";
import { BudgetPipeline } from "./budget.pipeline";
import { CorruptionPipeline } from "./corruption.pipeline";
import { GovspendPipeline } from "./govspend.pipeline";
import { PipelineRegistry } from "./pipeline.registry";

@Module({
  imports: [ExtractorsModule],
  providers: [
    BudgetPipeline,
    CorruptionPipeline,
    GovspendPipeline,
    PipelineRegistry,
  ],
  exports: [PipelineRegistry],
})
export class PipelineModule {}
