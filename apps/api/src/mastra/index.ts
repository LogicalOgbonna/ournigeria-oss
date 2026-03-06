import { Mastra } from "@mastra/core";
import { budgetAnalyst } from "./agents/budget-analyst";
import { impactAnalyst } from "./agents/impact-analyst";
import { corruptionAnalyst } from "./agents/corruption-analyst";
import { govspendAnalyst } from "./agents/govspend-analyst";
import { faacAnalyst } from "./agents/faac-analyst";
import { routerAgent } from "./agents/router-agent";
import { createObservability } from "../lib/langfuse";

const agents = {
  budgetAnalyst,
  impactAnalyst,
  corruptionAnalyst,
  govspendAnalyst,
  faacAnalyst,
  routerAgent,
} as const;

export type AgentName = keyof typeof agents;

export const AgentNames: Record<AgentName, AgentName> = {
  budgetAnalyst: "budgetAnalyst",
  impactAnalyst: "impactAnalyst",
  corruptionAnalyst: "corruptionAnalyst",
  govspendAnalyst: "govspendAnalyst",
  faacAnalyst: "faacAnalyst",
  routerAgent: "routerAgent",
} as const;

export const mastra = new Mastra({
  agents,
  observability: createObservability(),
});
