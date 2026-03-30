import { Module } from "@nestjs/common";
import { AgentService } from "./agent.service.js";
import { TopicMatcher } from "./topic-matcher.js";
import { ContentSelector } from "./content-selector.js";
import { SafetyFilter } from "./safety-filter.js";

@Module({
  providers: [AgentService, TopicMatcher, ContentSelector, SafetyFilter],
  exports: [AgentService, TopicMatcher, ContentSelector, SafetyFilter],
})
export class IntelligenceModule {}
