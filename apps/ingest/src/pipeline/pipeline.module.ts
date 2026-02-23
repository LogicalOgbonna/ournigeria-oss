import { Module } from '@nestjs/common';
import { ExtractorsModule } from '../extractors/extractors.module';
import { StateBudgetPipeline } from './state-budget.pipeline';
import { CorruptionPipeline } from './corruption.pipeline';
import { FederalBudgetPipeline } from './federal-budget.pipeline';
import { PipelineRegistry } from './pipeline.registry';

@Module({
  imports: [ExtractorsModule],
  providers: [
    StateBudgetPipeline,
    CorruptionPipeline,
    FederalBudgetPipeline,
    PipelineRegistry,
  ],
  exports: [PipelineRegistry],
})
export class PipelineModule {}
