import { Injectable } from '@nestjs/common';
import { PipelineBase } from './pipeline.base';
import { StateBudgetPipeline } from './state-budget.pipeline';
import { CorruptionPipeline } from './corruption.pipeline';
import { FederalBudgetPipeline } from './federal-budget.pipeline';

@Injectable()
export class PipelineRegistry {
  private map = new Map<string, PipelineBase>();

  constructor(
    stateBudget: StateBudgetPipeline,
    corruption: CorruptionPipeline,
    federalBudget: FederalBudgetPipeline,
  ) {
    for (const pipeline of [stateBudget, corruption, federalBudget]) {
      this.map.set(pipeline.pipelineType, pipeline);
    }
  }

  get(pipelineType: string): PipelineBase | undefined {
    return this.map.get(pipelineType);
  }

  getAll(): PipelineBase[] {
    return Array.from(this.map.values());
  }

  listTypes(): string[] {
    return Array.from(this.map.keys());
  }
}
