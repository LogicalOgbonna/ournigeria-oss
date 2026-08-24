import { Module } from "@nestjs/common";
import { BotSessionRepo } from "./bot-session.repo.js";
import { ClassifierService } from "./classifier.service.js";
import { DiscoveredTweetRepo } from "./discovered-tweet.repo.js";
import { RoamStateRepo } from "./roam-state.repo.js";
import { RoamerService } from "./roamer.service.js";
import { SessionHealthService } from "./session-health.service.js";
import { SessionRunRepo } from "./session-run.repo.js";
import { TopicRepo } from "./topic.repo.js";
import { TwitterConversationService } from "./twitter-conversation.service.js";
import { TwitterGraphqlClient } from "./twitter-graphql.client.js";
import { TwitterSearchService } from "./twitter-search.service.js";
import { XTransactionService } from "./x-transaction.service.js";

@Module({
  providers: [
    BotSessionRepo,
    TopicRepo,
    DiscoveredTweetRepo,
    SessionRunRepo,
    RoamStateRepo,
    ClassifierService,
    XTransactionService,
    TwitterGraphqlClient,
    TwitterSearchService,
    TwitterConversationService,
    RoamerService,
    SessionHealthService,
  ],
  exports: [
    BotSessionRepo,
    TopicRepo,
    DiscoveredTweetRepo,
    RoamStateRepo,
    TwitterGraphqlClient,
    TwitterSearchService,
    TwitterConversationService,
    ClassifierService,
    RoamerService,
  ],
})
export class RoamerModule {}
