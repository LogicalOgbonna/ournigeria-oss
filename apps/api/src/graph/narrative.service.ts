import { Injectable, Logger } from "@nestjs/common";
import { generateText } from "ai";
import { Neo4jService } from "./neo4j.service";
import { getChatModelSmall } from "../mastra/rag/config";

export interface NarrativeResult {
  narrative: string;
  entities: Array<{ name: string; type: string }>;
  pathLength: number;
  domains: string[];
}

@Injectable()
export class NarrativeService {
  private readonly logger = new Logger(NarrativeService.name);

  constructor(private neo4j: Neo4jService) {}

  async generateNarrative(
    entityName: string,
    entityType: string,
  ): Promise<NarrativeResult | null> {
    if (!this.neo4j.enabled) return null;

    // Validate entity type
    const validTypes = [
      "Official",
      "State",
      "MDA",
      "Contractor",
      "CorruptionCase",
    ];
    if (!validTypes.includes(entityType)) return null;

    try {
      // Find multi-domain paths (3+ hops, 2+ domains)
      const pathResult = await this.neo4j.executeRead(
        `MATCH path = (start:${entityType} {canonical_name: $name})-[*3..5]-(end)
         WHERE NOT end:Alias AND NOT end:Community
         WITH path, [n IN nodes(path) | n.source_domain] AS domains
         WITH path, [d IN domains WHERE d IS NOT NULL | d] AS validDomains
         WHERE size(apoc.coll.toSet(validDomains)) >= 2
         RETURN path,
                [n IN nodes(path) | {
                  name: coalesce(n.canonical_name, n.name, 'unknown'),
                  type: labels(n)[0],
                  source_domain: n.source_domain,
                  amount: n.amount,
                  state: n.state,
                  position: n.position
                }] AS pathNodes,
                [r IN relationships(path) | {type: type(r), amount: r.amount}] AS pathRels,
                [d IN [n IN nodes(path) | n.source_domain] WHERE d IS NOT NULL | d] AS domains
         LIMIT 1`,
        { name: entityName },
      );

      if (pathResult.records.length === 0) {
        // Try simpler pattern without apoc
        return this.generateSimpleNarrative(entityName, entityType);
      }

      const record = pathResult.records[0];
      const pathNodes = record.get("pathNodes") as Array<{
        name: string;
        type: string;
        source_domain: string;
        amount?: unknown;
        state?: string;
        position?: string;
      }>;
      const pathRels = record.get("pathRels") as Array<{
        type: string;
        amount?: unknown;
      }>;
      const domains = [
        ...new Set(
          (record.get("domains") as string[]).filter(Boolean),
        ),
      ];

      if (pathNodes.length < 3 || domains.length < 2) {
        return null;
      }

      const entities = pathNodes.map((n) => ({
        name: n.name,
        type: n.type,
      }));

      const narrative = await this.callLLM(pathNodes, pathRels);

      return {
        narrative,
        entities,
        pathLength: pathNodes.length,
        domains,
      };
    } catch (error) {
      this.logger.warn(
        `Narrative generation failed for ${entityName}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async generateSimpleNarrative(
    entityName: string,
    entityType: string,
  ): Promise<NarrativeResult | null> {
    try {
      // Simpler query that doesn't require apoc
      const result = await this.neo4j.executeRead(
        `MATCH (start:${entityType} {canonical_name: $name})-[r1]-(mid)-[r2]-(end)
         WHERE NOT mid:Alias AND NOT mid:Community AND NOT end:Alias AND NOT end:Community
           AND start.source_domain <> end.source_domain
         WITH start, mid, end, r1, r2,
              start.source_domain AS d1, end.source_domain AS d2
         WHERE d1 IS NOT NULL AND d2 IS NOT NULL
         RETURN
           [{name: coalesce(start.canonical_name, start.name), type: labels(start)[0], source_domain: start.source_domain, amount: start.amount, state: start.state, position: start.position},
            {name: coalesce(mid.canonical_name, mid.name), type: labels(mid)[0], source_domain: mid.source_domain, amount: mid.amount, state: mid.state, position: mid.position},
            {name: coalesce(end.canonical_name, end.name), type: labels(end)[0], source_domain: end.source_domain, amount: end.amount, state: end.state, position: end.position}] AS pathNodes,
           [{type: type(r1), amount: r1.amount}, {type: type(r2), amount: r2.amount}] AS pathRels,
           [d1, d2] AS domains
         LIMIT 1`,
        { name: entityName },
      );

      if (result.records.length === 0) return null;

      const record = result.records[0];
      const pathNodes = record.get("pathNodes") as Array<{
        name: string;
        type: string;
        source_domain: string;
        amount?: unknown;
        state?: string;
        position?: string;
      }>;
      const pathRels = record.get("pathRels") as Array<{
        type: string;
        amount?: unknown;
      }>;
      const domains = [
        ...new Set(
          (record.get("domains") as string[]).filter(Boolean),
        ),
      ];

      const entities = pathNodes.map((n) => ({
        name: n.name,
        type: n.type,
      }));

      const narrative = await this.callLLM(pathNodes, pathRels);

      return {
        narrative,
        entities,
        pathLength: pathNodes.length,
        domains,
      };
    } catch (error) {
      this.logger.debug(
        `Simple narrative failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async callLLM(
    pathNodes: Array<{
      name: string;
      type: string;
      source_domain: string;
      amount?: unknown;
      state?: string;
      position?: string;
    }>,
    pathRels: Array<{ type: string; amount?: unknown }>,
  ): Promise<string> {
    const model = getChatModelSmall();

    const pathDescription = pathNodes
      .map((n, i) => {
        const parts = [`${n.name} (${n.type})`];
        if (n.position) parts.push(`Position: ${n.position}`);
        if (n.state) parts.push(`State: ${n.state}`);
        if (n.amount) parts.push(`Amount: ₦${Number(typeof n.amount === "object" && n.amount !== null && "toNumber" in (n.amount as any) ? (n.amount as any).toNumber() : n.amount).toLocaleString()}`);
        if (n.source_domain) parts.push(`Domain: ${n.source_domain}`);
        const line = parts.join(", ");

        if (i < pathRels.length) {
          const rel = pathRels[i];
          const relAmount = rel.amount
            ? ` [₦${Number(typeof rel.amount === "object" && rel.amount !== null && "toNumber" in (rel.amount as any) ? (rel.amount as any).toNumber() : rel.amount).toLocaleString()}]`
            : "";
          return `${line}\n  --[${rel.type}${relAmount}]-->`;
        }
        return line;
      })
      .join("\n");

    const { text } = await generateText({
      model,
      prompt: `<SYSTEM>You are a financial investigator analyzing Nigerian government data.
Given this chain of connections from the knowledge graph, write a 2-3 sentence narrative
explaining how the entities are connected and what the relationship reveals.
Be factual, cite specific amounts when available. Use plain language.</SYSTEM>

<CONNECTION_CHAIN>
${pathDescription}
</CONNECTION_CHAIN>

Write a concise 2-3 sentence "follow the money" narrative:`,
    });

    return text.trim();
  }
}
