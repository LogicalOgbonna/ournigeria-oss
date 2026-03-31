import { Injectable, Logger } from "@nestjs/common";
import { generateText } from "ai";
import neo4j from "neo4j-driver";
import { Neo4jService } from "./neo4j.service";
import { getChatModelSmall } from "../mastra/rag/config";

export interface CommunityResult {
  communityId: number;
  memberCount: number;
  level: number;
}

export interface CommunitySummaryResult {
  communityId: number;
  summary: string;
  memberCount: number;
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private neo4j: Neo4jService) {}

  async detectCommunities(): Promise<CommunityResult[]> {
    if (!this.neo4j.enabled) {
      throw new Error("Neo4j is not connected");
    }

    this.logger.log("Starting community detection...");

    // Check if GDS is available
    const gdsAvailable = await this.isGdsAvailable();
    if (!gdsAvailable) {
      throw new Error(
        "Neo4j GDS plugin not available. Install the Graph Data Science plugin.",
      );
    }

    // Drop existing projection if it exists
    try {
      await this.neo4j.executeWrite(
        `CALL gds.graph.drop('ournigeria', false)`,
      );
    } catch {
      // Projection didn't exist, that's fine
    }

    // Remove old community nodes
    await this.neo4j.executeWrite(
      `MATCH (c:Community) DETACH DELETE c`,
    );

    // Project the graph — include entity nodes and their relationships
    const nodeLabels = [
      "Official",
      "State",
      "MDA",
      "Contractor",
      "CorruptionCase",
    ];
    const relTypes = [
      "GOVERNED",
      "CHARGED_IN",
      "CONNECTED_TO",
      "HEADED",
      "CO_ACCUSED",
      "PAID_TO",
      "ALLOCATED",
      "RECEIVED_PAYMENT",
      "RECEIVED_FAAC",
    ];

    try {
      await this.neo4j.executeWrite(
        `CALL gds.graph.project(
          'ournigeria',
          $nodeLabels,
          { ${relTypes.map((r) => `${r}: {orientation: 'UNDIRECTED'}`).join(", ")} }
        )`,
        { nodeLabels },
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`GDS projection failed: ${msg}`);
      throw new Error(`GDS graph projection failed: ${msg}`);
    }

    // Run Leiden community detection
    try {
      await this.neo4j.executeWrite(
        `CALL gds.leiden.write('ournigeria', {
          writeProperty: 'communityId',
          maxLevels: 10,
          gamma: 1.0,
          theta: 0.01
        })`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Leiden algorithm failed: ${msg}`);
      // Clean up projection
      await this.dropProjection();
      throw new Error(`Leiden community detection failed: ${msg}`);
    }

    // Create Community nodes with member counts
    const communityResult = await this.neo4j.executeWrite(
      `MATCH (n)
       WHERE n.communityId IS NOT NULL
       WITH n.communityId AS cid, collect(n) AS members
       CREATE (c:Community {
         communityId: cid,
         member_count: size(members),
         level: 0,
         created_at: datetime(),
         needs_regeneration: true
       })
       WITH c, members
       UNWIND members AS member
       CREATE (c)-[:CONTAINS]->(member)
       RETURN c.communityId AS communityId, c.member_count AS memberCount
       ORDER BY c.member_count DESC`,
    );

    // Drop GDS projection
    await this.dropProjection();

    const communities: CommunityResult[] = communityResult.records.map(
      (record) => {
        const memberCount = record.get("memberCount");
        const communityId = record.get("communityId");
        return {
          communityId:
            typeof communityId === "object" && communityId?.toNumber
              ? communityId.toNumber()
              : Number(communityId),
          memberCount:
            typeof memberCount === "object" && memberCount?.toNumber
              ? memberCount.toNumber()
              : Number(memberCount),
          level: 0,
        };
      },
    );

    this.logger.log(
      `Community detection complete: ${communities.length} communities found`,
    );

    return communities;
  }

  async generateSummaries(
    limit = 100,
  ): Promise<CommunitySummaryResult[]> {
    if (!this.neo4j.enabled) {
      throw new Error("Neo4j is not connected");
    }

    // Get communities that need summaries
    const communities = await this.neo4j.executeRead(
      `MATCH (c:Community)
       WHERE c.needs_regeneration = true OR c.summary IS NULL
       WITH c ORDER BY c.member_count DESC LIMIT $limit
       MATCH (c)-[:CONTAINS]->(member)
       WITH c, collect({
         name: coalesce(member.canonical_name, member.name, 'unknown'),
         type: labels(member)[0],
         state: member.state,
         position: member.position,
         source_domain: member.source_domain
       }) AS members
       RETURN c.communityId AS communityId, c.member_count AS memberCount, members`,
      { limit: neo4j.int(limit) },
    );

    if (communities.records.length === 0) {
      this.logger.log("No communities need summary generation");
      return [];
    }

    const results: CommunitySummaryResult[] = [];

    for (const record of communities.records) {
      const communityId = record.get("communityId");
      const cid =
        typeof communityId === "object" && communityId?.toNumber
          ? communityId.toNumber()
          : Number(communityId);
      const memberCount = record.get("memberCount");
      const mCount =
        typeof memberCount === "object" && memberCount?.toNumber
          ? memberCount.toNumber()
          : Number(memberCount);
      const members = record.get("members") as Array<{
        name: string;
        type: string;
        state?: string;
        position?: string;
        source_domain?: string;
      }>;

      try {
        const summary = await this.generateCommunitySummary(members);

        // Store summary on Community node
        await this.neo4j.executeWrite(
          `MATCH (c:Community {communityId: $cid})
           SET c.summary = $summary, c.needs_regeneration = false, c.summarized_at = datetime()`,
          { cid, summary },
        );

        results.push({ communityId: cid, summary, memberCount: mCount });
      } catch (error) {
        this.logger.warn(
          `Summary generation failed for community ${cid}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      `Generated ${results.length} community summaries`,
    );

    return results;
  }

  async markForRegeneration(nodeIds: string[]): Promise<void> {
    if (!this.neo4j.enabled || nodeIds.length === 0) return;

    try {
      await this.neo4j.executeWrite(
        `UNWIND $nodeIds AS nodeId
         MATCH (n) WHERE elementId(n) = nodeId
         MATCH (c:Community)-[:CONTAINS]->(n)
         SET c.needs_regeneration = true`,
        { nodeIds },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to mark communities for regeneration: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async generateCommunitySummary(
    members: Array<{
      name: string;
      type: string;
      state?: string;
      position?: string;
      source_domain?: string;
    }>,
  ): Promise<string> {
    const model = getChatModelSmall();

    // Build member description
    const memberDescriptions = members
      .slice(0, 20) // Limit for token budget
      .map((m) => {
        const parts = [`${m.name} (${m.type})`];
        if (m.state) parts.push(`State: ${m.state}`);
        if (m.position) parts.push(`Position: ${m.position}`);
        if (m.source_domain) parts.push(`Domain: ${m.source_domain}`);
        return parts.join(", ");
      })
      .join("\n");

    const { text } = await generateText({
      model,
      prompt: `<SYSTEM>You are summarizing a cluster of connected entities from a Nigerian government knowledge graph.
Write a 2-3 sentence summary that explains what connects these entities and why they form a group.
Focus on the practical significance for understanding Nigerian governance, spending, or corruption.
Be specific about states, officials, and domains involved.</SYSTEM>

<CLUSTER_MEMBERS>
${memberDescriptions}
</CLUSTER_MEMBERS>

Total members: ${members.length}

Write a concise 2-3 sentence summary of this entity cluster:`,
    });

    return text.trim();
  }

  private async isGdsAvailable(): Promise<boolean> {
    try {
      await this.neo4j.executeRead(
        `RETURN gds.version() AS version`,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async dropProjection(): Promise<void> {
    try {
      await this.neo4j.executeWrite(
        `CALL gds.graph.drop('ournigeria', false)`,
      );
    } catch {
      // Ignore — projection may not exist
    }
  }
}
