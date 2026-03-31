import { Injectable, Logger } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";

export interface Suggestion {
  text: string;
  query: string;
  domain: string;
  icon: string;
}

const DOMAIN_ICONS: Record<string, string> = {
  corruption: "shield-alert",
  budget: "banknote",
  govspend: "receipt",
  faac: "landmark",
};

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(private neo4j: Neo4jService) {}

  async getRelated(
    entities: string[],
    currentDomain: string,
  ): Promise<Suggestion[]> {
    if (!this.neo4j.enabled || entities.length === 0) return [];

    const suggestions: Suggestion[] = [];

    try {
      for (const entity of entities.slice(0, 3)) {
        // Find the entity in the graph
        const nodeResult = await this.neo4j.executeRead(
          `CALL db.index.fulltext.queryNodes('entity_names', $query)
           YIELD node, score
           WHERE score > 0.8
           RETURN elementId(node) AS id, labels(node) AS labels, node.canonical_name AS name
           ORDER BY score DESC LIMIT 1`,
          { query: entity },
        );

        if (nodeResult.records.length === 0) continue;

        const nodeId = nodeResult.records[0].get("id") as string;
        const entityName = nodeResult.records[0].get("name") as string;

        // Find cross-domain connections
        const crossDomain = await this.neo4j.executeRead(
          `MATCH (start) WHERE elementId(start) = $nodeId
           MATCH (start)-[r]-(connected)
           WHERE connected.source_domain IS NOT NULL AND connected.source_domain <> $currentDomain
           WITH connected.source_domain AS domain, collect(DISTINCT connected) AS nodes, count(*) AS cnt
           RETURN domain, cnt, [n IN nodes[0..3] | coalesce(n.canonical_name, n.name, 'unknown')] AS examples
           ORDER BY cnt DESC
           LIMIT 3`,
          { nodeId, currentDomain },
        );

        for (const record of crossDomain.records) {
          const domain = record.get("domain") as string;
          const cnt = record.get("cnt");
          const count =
            typeof cnt === "object" && cnt?.toNumber
              ? cnt.toNumber()
              : Number(cnt ?? 0);
          const examples = record.get("examples") as string[];

          if (count === 0) continue;

          const suggestion = this.formatSuggestion(
            entityName,
            domain,
            count,
            examples,
          );
          if (suggestion) {
            suggestions.push(suggestion);
          }
        }

        // Also check for co-accused or contractor connections
        if (currentDomain !== "corruption") {
          const corruptionLinks = await this.neo4j.executeRead(
            `MATCH (start) WHERE elementId(start) = $nodeId
             MATCH (start)-[:CHARGED_IN|CO_ACCUSED|CONNECTED_TO*1..2]-(c:CorruptionCase)
             RETURN count(DISTINCT c) AS caseCount`,
            { nodeId },
          );

          const caseCount = corruptionLinks.records[0]?.get("caseCount");
          const cases =
            typeof caseCount === "object" && caseCount?.toNumber
              ? caseCount.toNumber()
              : Number(caseCount ?? 0);

          if (cases > 0) {
            suggestions.push({
              text: `${cases} corruption case${cases > 1 ? "s" : ""} linked to ${entityName}`,
              query: `What corruption cases involve ${entityName}?`,
              domain: "corruption",
              icon: DOMAIN_ICONS.corruption,
            });
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Suggestions query failed: ${error instanceof Error ? error.message : error}`,
      );
      return [];
    }

    // Deduplicate by domain and limit to 3
    const seen = new Set<string>();
    return suggestions
      .filter((s) => {
        const key = `${s.domain}:${s.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }

  private formatSuggestion(
    entityName: string,
    domain: string,
    count: number,
    examples: string[],
  ): Suggestion | null {
    const icon = DOMAIN_ICONS[domain] ?? "search";

    switch (domain) {
      case "corruption":
        return {
          text: `${count} corruption case${count > 1 ? "s" : ""} in ${entityName}`,
          query: `What corruption cases are there in ${entityName}?`,
          domain,
          icon,
        };
      case "budget":
        return {
          text: `${count} budget allocation${count > 1 ? "s" : ""} for ${entityName}`,
          query: `What is the budget for ${entityName}?`,
          domain,
          icon,
        };
      case "govspend":
        return {
          text: `${count} payment record${count > 1 ? "s" : ""} linked to ${entityName}`,
          query: `What government payments involve ${entityName}?`,
          domain,
          icon,
        };
      case "faac":
        return {
          text: `${count} FAAC allocation${count > 1 ? "s" : ""} for ${entityName}`,
          query: `What FAAC allocations does ${entityName} receive?`,
          domain,
          icon,
        };
      default:
        return null;
    }
  }
}
