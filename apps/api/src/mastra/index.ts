import { Mastra } from '@mastra/core';
import { budgetAnalyst } from './agents/budget-analyst';
import { impactAnalyst } from './agents/impact-analyst';
import { corruptionAnalyst } from './agents/corruption-analyst';
import { corruptionImpactAnalyst } from './agents/corruption-impact-analyst';

export const mastra = new Mastra({
  agents: {
    budgetAnalyst,
    impactAnalyst,
    corruptionAnalyst,
    corruptionImpactAnalyst,
  },
});
