import { Mastra } from "@mastra/core";
import { budgetAnalyst } from "./agents/budget-analyst";
import { impactAnalyst } from "./agents/impact-analyst";

export const mastra = new Mastra({
  agents: { budgetAnalyst, impactAnalyst },
});
