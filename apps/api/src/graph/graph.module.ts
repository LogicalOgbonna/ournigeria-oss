import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Neo4jService } from "./neo4j.service";
import { GraphSchemaService } from "./schema/init-schema";
import { ChunkReader } from "./extraction/chunk-reader";
import { EntityResolver } from "./extraction/entity-resolver";
import { MetadataGraphBuilder } from "./extraction/metadata-graph-builder";
import { RelationshipExtractor } from "./extraction/relationship-extractor";
import { BackfillService } from "./extraction/backfill.service";
import { DisambiguationService } from "./disambiguation.service";
import { SuggestionsService } from "./suggestions.service";
import { CommunityService } from "./community.service";
import { GraphExploreService } from "./graph-explore.service";
import { NarrativeService } from "./narrative.service";
import { GraphController } from "./graph.controller";
import { GraphExploreController } from "./graph-explore.controller";

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [GraphController, GraphExploreController],
  providers: [
    Neo4jService,
    GraphSchemaService,
    ChunkReader,
    EntityResolver,
    MetadataGraphBuilder,
    RelationshipExtractor,
    BackfillService,
    DisambiguationService,
    SuggestionsService,
    CommunityService,
    GraphExploreService,
    NarrativeService,
  ],
  exports: [
    Neo4jService,
    EntityResolver,
    DisambiguationService,
    SuggestionsService,
    NarrativeService,
  ],
})
export class GraphModule {}
