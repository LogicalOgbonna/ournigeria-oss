import { Injectable } from "@nestjs/common";
import { PipelineBase } from "./pipeline.base";
import { BudgetPipeline } from "./budget.pipeline";
import { CorruptionPipeline } from "./corruption.pipeline";
import { GovspendPipeline } from "./govspend.pipeline";
import { FaacPipeline } from "./faac.pipeline";

@Injectable()
export class PipelineRegistry {
  private readonly map = new Map<string, PipelineBase>();

  constructor(
    budget: BudgetPipeline,
    corruption: CorruptionPipeline,
    govspend: GovspendPipeline,
    faac: FaacPipeline,
  ) {
    for (const pipeline of [budget, corruption, govspend, faac]) {
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
