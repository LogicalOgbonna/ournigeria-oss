import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiProperty, ApiBody } from "@nestjs/swagger";
import { AdminGuard } from "../admin/admin.guard";
import { Public } from "../auth/decorators/public";
import { PrismaService } from "@ournigeria/database";
import { Neo4jService } from "./neo4j.service";
import { BackfillService } from "./extraction/backfill.service";
import { CommunityService } from "./community.service";
import { GraphExploreService } from "./graph-explore.service";

class StartBackfillDto {
  @ApiProperty({ enum: [1, 2], description: "Pass 1 = metadata, Pass 2 = LLM extraction" })
  pass!: 1 | 2;

  @ApiProperty({ enum: ["budget", "corruption", "govspend", "faac"], required: false, description: "Domain to backfill (omit for all)" })
  domain?: string;
}

class SummarizeCommunitiesDto {
  @ApiProperty({ required: false, default: 100, description: "Max communities to summarize" })
  limit?: number;
}

@Public()
@ApiTags("Graph")
@UseGuards(AdminGuard)
@Controller("admin/graph")
export class GraphController {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly prisma: PrismaService,
    private readonly backfillService: BackfillService,
    private readonly communityService: CommunityService,
    private readonly graphExplore: GraphExploreService,
  ) {}

  @Post("backfill")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Start graph extraction backfill" })
  @ApiBody({ type: StartBackfillDto })
  async startBackfill(
    @Body() body: StartBackfillDto,
  ) {
    return this.backfillService.startBackfill(body.pass, body.domain);
  }

  @Get("backfill/status")
  @ApiOperation({ summary: "Get backfill status for all domains" })
  async getBackfillStatus() {
    return this.backfillService.getStatus();
  }

  @Post("backfill/pause")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pause all running backfill jobs" })
  async pauseBackfill() {
    await this.backfillService.pauseBackfill();
    return { message: "Backfill paused" };
  }

  @Post("backfill/:jobId/pause")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pause a single backfill job" })
  async pauseJob(@Param("jobId") jobId: string) {
    await this.backfillService.pauseBackfill(jobId);
    return { message: `Job ${jobId} paused` };
  }

  @Post("backfill/resume")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Resume paused backfill jobs" })
  @ApiBody({ type: StartBackfillDto })
  async resumeBackfill(@Body() body: StartBackfillDto) {
    return this.backfillService.startBackfill(body.pass, body.domain);
  }

  @Post("communities/detect")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Run community detection (Leiden algorithm via GDS)" })
  async detectCommunities() {
    const communities = await this.communityService.detectCommunities();
    return {
      message: `Detected ${communities.length} communities`,
      communities: communities.slice(0, 20),
      total: communities.length,
    };
  }

  @Post("communities/summarize")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Generate LLM summaries for communities" })
  @ApiBody({ type: SummarizeCommunitiesDto })
  async summarizeCommunities(@Body() body: SummarizeCommunitiesDto) {
    const results = await this.communityService.generateSummaries(
      body.limit ?? 100,
    );
    return {
      message: `Generated ${results.length} community summaries`,
      summaries: results.slice(0, 20),
      total: results.length,
    };
  }

  @Delete("reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete all graph data (Neo4j + extraction jobs)" })
  async resetGraph() {
    if (!this.neo4j.enabled) {
      return { message: "Neo4j is not connected", nodesDeleted: 0, jobsDeleted: 0 };
    }

    // Pause any running backfill jobs first
    await this.backfillService.pauseBackfill();

    // Clear all Neo4j nodes and relationships
    const result = await this.neo4j.executeWrite(
      "MATCH (n) DETACH DELETE n RETURN count(n) AS deleted",
    );
    const nodesDeleted = result.records[0]?.get("deleted");
    const count = typeof nodesDeleted === "object" && nodesDeleted.toNumber
      ? nodesDeleted.toNumber()
      : Number(nodesDeleted ?? 0);

    // Delete all extraction job records from Postgres
    const { count: jobsDeleted } = await this.prisma.graphExtractionJob.deleteMany();

    // Invalidate explore cache so stale data isn't served
    await this.graphExplore.clearCache();

    return {
      message: "Graph data reset successfully",
      nodesDeleted: count,
      jobsDeleted,
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Graph health metrics" })
  async getHealth() {
    if (!this.neo4j.enabled) {
      return { status: "disabled", nodes: {}, edges: {}, issues: [] };
    }

    const issues: string[] = [];

    // Node counts by type
    const nodeResult = await this.neo4j.executeRead(
      `CALL {
        MATCH (n:Official) RETURN 'Official' AS label, count(n) AS count
        UNION ALL
        MATCH (n:State) RETURN 'State' AS label, count(n) AS count
        UNION ALL
        MATCH (n:MDA) RETURN 'MDA' AS label, count(n) AS count
        UNION ALL
        MATCH (n:Contractor) RETURN 'Contractor' AS label, count(n) AS count
        UNION ALL
        MATCH (n:BudgetItem) RETURN 'BudgetItem' AS label, count(n) AS count
        UNION ALL
        MATCH (n:Payment) RETURN 'Payment' AS label, count(n) AS count
        UNION ALL
        MATCH (n:FAACAllocation) RETURN 'FAACAllocation' AS label, count(n) AS count
        UNION ALL
        MATCH (n:CorruptionCase) RETURN 'CorruptionCase' AS label, count(n) AS count
        UNION ALL
        MATCH (n:Alias) RETURN 'Alias' AS label, count(n) AS count
      }
      RETURN label, count`,
    );
    const nodes: Record<string, number> = {};
    for (const record of nodeResult.records) {
      const label = record.get("label") as string;
      const count = record.get("count");
      nodes[label] = typeof count === "object" && count.toNumber
        ? count.toNumber()
        : Number(count);
    }

    // Edge counts by type
    const edgeResult = await this.neo4j.executeRead(
      `CALL {
        MATCH ()-[r:GOVERNED]->() RETURN 'GOVERNED' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:CHARGED_IN]->() RETURN 'CHARGED_IN' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:ALLOCATED]->() RETURN 'ALLOCATED' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:RECEIVED_PAYMENT]->() RETURN 'RECEIVED_PAYMENT' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:RECEIVED_FAAC]->() RETURN 'RECEIVED_FAAC' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:CONNECTED_TO]->() RETURN 'CONNECTED_TO' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:HEADED]->() RETURN 'HEADED' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:CO_ACCUSED]->() RETURN 'CO_ACCUSED' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:PAID_TO]->() RETURN 'PAID_TO' AS type, count(r) AS count
        UNION ALL
        MATCH ()-[r:ALSO_KNOWN_AS]->() RETURN 'ALSO_KNOWN_AS' AS type, count(r) AS count
      }
      RETURN type, count`,
    );
    const edges: Record<string, number> = {};
    for (const record of edgeResult.records) {
      const type = record.get("type") as string;
      const count = record.get("count");
      edges[type] = typeof count === "object" && count.toNumber
        ? count.toNumber()
        : Number(count);
    }

    // Orphan node count
    const orphanResult = await this.neo4j.executeRead(
      `MATCH (n) WHERE NOT (n)--() AND NOT n:Alias RETURN count(n) AS count`,
    );
    const orphanCount = orphanResult.records[0]?.get("count");
    const orphans = typeof orphanCount === "object" && orphanCount.toNumber
      ? orphanCount.toNumber()
      : Number(orphanCount ?? 0);
    if (orphans > 0) {
      issues.push(`${orphans} orphan nodes with no relationships`);
    }

    // Flagged entities
    const flaggedResult = await this.neo4j.executeRead(
      `MATCH (n) WHERE n.needs_review = true RETURN count(n) AS count`,
    );
    const flaggedCount = flaggedResult.records[0]?.get("count");
    const flagged = typeof flaggedCount === "object" && flaggedCount.toNumber
      ? flaggedCount.toNumber()
      : Number(flaggedCount ?? 0);
    if (flagged > 0) {
      issues.push(`${flagged} entities flagged for review (run Pass 2)`);
    }

    return {
      status: "ok",
      nodes,
      edges,
      orphans,
      flaggedEntities: flagged,
      totalNodes: Object.values(nodes).reduce((a, b) => a + b, 0),
      totalEdges: Object.values(edges).reduce((a, b) => a + b, 0),
      issues,
    };
  }
}
