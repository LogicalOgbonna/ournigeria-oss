import { Injectable, Logger } from "@nestjs/common";
import { Neo4jService } from "../neo4j.service";

export interface ResolvedEntity {
  nodeId: string;
  canonicalName: string;
  isNew: boolean;
  needsReview: boolean;
  matchType: "exact" | "alias" | "fuzzy" | "new";
}

const HONORIFICS = [
  "gov.",
  "governor",
  "sen.",
  "senator",
  "hon.",
  "honourable",
  "honorable",
  "dr.",
  "doctor",
  "chief",
  "alhaji",
  "hajia",
  "prof.",
  "professor",
  "engr.",
  "engineer",
  "barr.",
  "barrister",
  "arc.",
  "architect",
  "gen.",
  "general",
  "lt.",
  "col.",
  "maj.",
  "brig.",
  "comrade",
  "mr.",
  "mrs.",
  "ms.",
  "prince",
  "princess",
  "oba",
  "obi",
  "igwe",
  "emir",
  "rt.",
  "rev.",
  "reverend",
  "pastor",
  "elder",
  "deacon",
  "deaconess",
  "dame",
  "sir",
  "lady",
  "otunba",
];

@Injectable()
export class EntityResolver {
  private readonly logger = new Logger(EntityResolver.name);

  constructor(private neo4j: Neo4jService) {}

  normalizeName(name: string): string {
    let normalized = name.trim();

    // Handle "Last, First" format
    if (normalized.includes(",") && !normalized.includes("(")) {
      const parts = normalized.split(",").map((s) => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        normalized = `${parts[1]} ${parts[0]}`;
      }
    }

    // Strip honorifics
    const lower = normalized.toLowerCase();
    for (const h of HONORIFICS) {
      if (lower.startsWith(h + " ") || lower.startsWith(h)) {
        const matchLen = lower.startsWith(h + " ") ? h.length + 1 : h.length;
        normalized = normalized.slice(matchLen).trim();
      }
    }

    // Title case
    normalized = normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return normalized;
  }

  async resolveEntity(
    name: string,
    label: string,
    mode: "pass1" | "pass2" = "pass1",
  ): Promise<ResolvedEntity> {
    const normalized = this.normalizeName(name);

    // Step 1: Exact match on canonical_name
    const exact = await this.exactMatch(normalized, label);
    if (exact) {
      return {
        nodeId: exact,
        canonicalName: normalized,
        isNew: false,
        needsReview: false,
        matchType: "exact",
      };
    }

    // Step 2: Alias match
    const alias = await this.aliasMatch(normalized);
    if (alias) {
      return {
        nodeId: alias,
        canonicalName: normalized,
        isNew: false,
        needsReview: false,
        matchType: "alias",
      };
    }

    // Step 3: Fuzzy match via fulltext index
    const fuzzy = await this.fuzzyMatch(normalized);
    if (fuzzy) {
      if (fuzzy.score > 0.9) {
        // Auto-merge: add alias to existing node
        await this.addAlias(fuzzy.nodeId, normalized);
        return {
          nodeId: fuzzy.nodeId,
          canonicalName: fuzzy.canonicalName,
          isNew: false,
          needsReview: false,
          matchType: "fuzzy",
        };
      }

      if (mode === "pass2") {
        // In Pass 2, flag for potential review but create new node
        return {
          nodeId: "",
          canonicalName: normalized,
          isNew: true,
          needsReview: true,
          matchType: "new",
        };
      }
    }

    // Create new node
    return {
      nodeId: "",
      canonicalName: normalized,
      isNew: true,
      needsReview: mode === "pass1" && fuzzy !== null && fuzzy.score >= 0.5,
      matchType: "new",
    };
  }

  private async exactMatch(
    name: string,
    label: string,
  ): Promise<string | null> {
    try {
      const result = await this.neo4j.executeRead(
        `MATCH (n:${label} {canonical_name: $name}) RETURN elementId(n) AS id LIMIT 1`,
        { name },
      );
      if (result.records.length > 0) {
        return result.records[0].get("id") as string;
      }
    } catch (error) {
      this.logger.debug(`Exact match failed for ${name}: ${error}`);
    }
    return null;
  }

  private async aliasMatch(name: string): Promise<string | null> {
    try {
      const result = await this.neo4j.executeRead(
        `MATCH (a:Alias {name: $name})<-[:ALSO_KNOWN_AS]-(n) RETURN elementId(n) AS id LIMIT 1`,
        { name },
      );
      if (result.records.length > 0) {
        return result.records[0].get("id") as string;
      }
    } catch (error) {
      this.logger.debug(`Alias match failed for ${name}: ${error}`);
    }
    return null;
  }

  private async fuzzyMatch(
    name: string,
  ): Promise<{ nodeId: string; canonicalName: string; score: number } | null> {
    try {
      // Append ~ for fuzzy matching in Lucene
      const result = await this.neo4j.executeRead(
        `CALL db.index.fulltext.queryNodes('entity_names', $query)
         YIELD node, score
         WHERE score > 0.3
         RETURN elementId(node) AS id, node.canonical_name AS canonicalName, score
         ORDER BY score DESC LIMIT 1`,
        { query: `${name}~` },
      );
      if (result.records.length > 0) {
        return {
          nodeId: result.records[0].get("id") as string,
          canonicalName: result.records[0].get("canonicalName") as string,
          score: result.records[0].get("score") as number,
        };
      }
    } catch (error) {
      this.logger.debug(`Fuzzy match failed for ${name}: ${error}`);
    }
    return null;
  }

  private async addAlias(nodeId: string, aliasName: string): Promise<void> {
    try {
      await this.neo4j.executeWrite(
        `MATCH (n) WHERE elementId(n) = $nodeId
         MERGE (a:Alias {name: $alias})
         MERGE (n)-[:ALSO_KNOWN_AS]->(a)`,
        { nodeId, alias: aliasName },
      );
    } catch (error) {
      this.logger.warn(`Failed to add alias ${aliasName}: ${error}`);
    }
  }
}
