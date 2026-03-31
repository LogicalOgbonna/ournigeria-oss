import { Injectable, Logger } from "@nestjs/common";
import { Neo4jService } from "./neo4j.service";

export interface DisambiguationCandidate {
  name: string;
  type: string;
  state: string | null;
  position: string | null;
  connectionCount: number;
  score: number;
}

export interface DisambiguationResult {
  query: string;
  candidates: DisambiguationCandidate[];
}

const MIN_CANDIDATES = 2;
const MIN_SCORE = 0.7;

@Injectable()
export class DisambiguationService {
  private readonly logger = new Logger(DisambiguationService.name);

  constructor(private neo4j: Neo4jService) {}

  async findCandidates(
    name: string,
    context?: string,
  ): Promise<DisambiguationResult | null> {
    if (!this.neo4j.enabled) return null;

    try {
      // Fuzzy fulltext search for matching entities
      const result = await this.neo4j.executeRead(
        `CALL db.index.fulltext.queryNodes('entity_names', $query)
         YIELD node, score
         WHERE score > $minScore
         WITH node, score
         ORDER BY score DESC
         LIMIT 10
         OPTIONAL MATCH (node)-[r]-()
         WITH node, score, count(r) AS connections
         RETURN
           node.canonical_name AS name,
           labels(node) AS labels,
           node.state AS state,
           node.position AS position,
           connections,
           score
         ORDER BY score DESC`,
        { query: name, minScore: MIN_SCORE },
      );

      if (result.records.length < MIN_CANDIDATES) {
        return null;
      }

      const candidates: DisambiguationCandidate[] = result.records.map(
        (record) => {
          const labels = record.get("labels") as string[];
          const entityType =
            labels.find((l: string) =>
              ["Official", "State", "MDA", "Contractor"].includes(l),
            ) ?? labels[0];

          const connections = record.get("connections");

          return {
            name: record.get("name") as string,
            type: entityType,
            state: record.get("state") as string | null,
            position: record.get("position") as string | null,
            connectionCount:
              typeof connections === "object" && connections?.toNumber
                ? connections.toNumber()
                : Number(connections ?? 0),
            score: record.get("score") as number,
          };
        },
      );

      // Deduplicate by canonical name
      const seen = new Set<string>();
      const unique = candidates.filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      });

      if (unique.length < MIN_CANDIDATES) {
        return null;
      }

      // If context provided, filter to relevant candidates
      if (context) {
        const lowerCtx = context.toLowerCase();
        const contextual = unique.filter(
          (c) =>
            (c.state && lowerCtx.includes(c.state.toLowerCase())) ||
            (c.position && lowerCtx.includes(c.position.toLowerCase())),
        );
        // Only use context filtering if it doesn't eliminate all candidates
        if (contextual.length >= 1 && contextual.length < unique.length) {
          // Context resolves ambiguity — no disambiguation needed
          return null;
        }
      }

      return {
        query: name,
        candidates: unique.slice(0, 5),
      };
    } catch (error) {
      this.logger.warn(
        `Disambiguation failed for "${name}": ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
