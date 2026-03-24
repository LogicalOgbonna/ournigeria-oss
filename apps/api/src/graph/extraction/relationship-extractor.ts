import { Injectable, Logger } from "@nestjs/common";
import { generateText } from "ai";
import { Neo4jService } from "../neo4j.service";
import { EntityResolver } from "./entity-resolver";
import type { ChunkMetadata } from "./chunk-reader";
import { getChatModelSmall } from "../../mastra/rag/config";
import { corruptionExtractionPrompt } from "./prompts/corruption";
import { budgetExtractionPrompt } from "./prompts/budget";
import { govspendExtractionPrompt } from "./prompts/govspend";
import { faacExtractionPrompt } from "./prompts/faac";

interface CorruptionExtraction {
  contractors: Array<{ name: string; role?: string; connection?: string }>;
  co_accused: Array<{ name: string; position?: string; relationship?: string }>;
  aliases: string[];
  mdas: Array<{ name: string; relationship?: string }>;
}

interface BudgetExtraction {
  headed_relationships: Array<{ official_name: string; position?: string; mda_name: string }>;
  contractors: Array<{ name: string; project?: string }>;
  projects: Array<{ name: string; mda?: string; amount?: string }>;
}

interface GovspendExtraction {
  beneficiaries: Array<{ name: string; type?: string; amount?: string }>;
  contractors: Array<{ name: string; role?: string }>;
  officials: Array<{ name: string; connection?: string }>;
}

interface FaacExtraction {
  allocation_types: Array<{ type: string; amount?: string }>;
  zone_relationships: Array<{ zone: string; relationship?: string }>;
  patterns: Array<{ description: string }>;
}

export interface ExtractionResult {
  chunkId: string;
  domain: string;
  success: boolean;
  tokensUsed: number;
  error?: string;
}

function createSemaphore(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  return {
    async acquire(): Promise<void> {
      if (active < max) {
        active++;
        return;
      }
      return new Promise<void>((resolve) => {
        queue.push(() => {
          active++;
          resolve();
        });
      });
    },
    release(): void {
      active--;
      const next = queue.shift();
      if (next) next();
    },
  };
}

@Injectable()
export class RelationshipExtractor {
  private readonly logger = new Logger(RelationshipExtractor.name);

  constructor(
    private neo4j: Neo4jService,
    private entityResolver: EntityResolver,
  ) {}

  async extractBatch(
    chunks: ChunkMetadata[],
    domain: string,
    concurrency = 10,
  ): Promise<{ results: ExtractionResult[]; totalTokens: number }> {
    const sem = createSemaphore(concurrency);
    let totalTokens = 0;

    const results = await Promise.allSettled(
      chunks.map(async (chunk) => {
        await sem.acquire();
        try {
          return await this.extractSingle(chunk, domain);
        } finally {
          sem.release();
        }
      }),
    );

    const extractionResults: ExtractionResult[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        extractionResults.push(r.value);
        totalTokens += r.value.tokensUsed;
      } else {
        extractionResults.push({
          chunkId: chunks[i].id,
          domain,
          success: false,
          tokensUsed: 0,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        });
      }
    }

    // Write successful extractions to graph
    const successful = extractionResults.filter((r) => r.success);
    if (successful.length > 0) {
      this.logger.log(
        `Batch: ${successful.length}/${chunks.length} successful extractions for ${domain}`,
      );
    }

    return { results: extractionResults, totalTokens };
  }

  private async extractSingle(
    chunk: ChunkMetadata,
    domain: string,
  ): Promise<ExtractionResult> {
    if (!chunk.text) {
      return {
        chunkId: chunk.id,
        domain,
        success: true,
        tokensUsed: 0,
      };
    }

    try {
      const result = await this.callLLM(chunk, domain);
      await this.writeToGraph(chunk, domain, result);
      return {
        chunkId: chunk.id,
        domain,
        success: true,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Extraction failed for chunk ${chunk.id}: ${msg}`);
      return {
        chunkId: chunk.id,
        domain,
        success: false,
        tokensUsed: 0,
        error: msg,
      };
    }
  }

  private async callLLM(
    chunk: ChunkMetadata,
    domain: string,
  ): Promise<{ data: unknown; tokensUsed: number }> {
    const model = getChatModelSmall();

    const prompts: Record<string, (text: string, meta: Record<string, unknown>) => string> = {
      corruption: corruptionExtractionPrompt,
      budget: budgetExtractionPrompt,
      govspend: govspendExtractionPrompt,
      faac: faacExtractionPrompt,
    };

    const promptFn = prompts[domain];
    if (!promptFn) throw new Error(`Unknown domain: ${domain}`);

    const { text, usage } = await generateText({
      model,
      prompt: promptFn(chunk.text!, chunk.metadata),
    });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { data: {}, tokensUsed: usage?.totalTokens ?? 0 };
    }

    const data = JSON.parse(jsonMatch[0]);
    return { data, tokensUsed: usage?.totalTokens ?? 0 };
  }

  private async writeToGraph(
    chunk: ChunkMetadata,
    domain: string,
    result: { data: unknown },
  ): Promise<void> {
    switch (domain) {
      case "corruption":
        await this.writeCorruptionRelationships(
          chunk,
          result.data as CorruptionExtraction,
        );
        break;
      case "budget":
        await this.writeBudgetRelationships(
          chunk,
          result.data as BudgetExtraction,
        );
        break;
      case "govspend":
        await this.writeGovspendRelationships(
          chunk,
          result.data as GovspendExtraction,
        );
        break;
      case "faac":
        // FAAC extraction mainly for categorization — minimal graph writes
        break;
    }
  }

  private async writeCorruptionRelationships(
    chunk: ChunkMetadata,
    data: CorruptionExtraction,
  ): Promise<void> {
    const official = chunk.metadata.official as string | undefined;
    if (!official) return;

    const normalizedOfficial = this.entityResolver.normalizeName(official);

    // Write contractor connections
    if (data.contractors.length > 0) {
      const batch = data.contractors
        .filter((c) => c.name.trim())
        .map((c) => ({
          official: normalizedOfficial,
          contractor: this.entityResolver.normalizeName(c.name),
          connection: c.connection ?? "connected",
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MATCH (o:Official {canonical_name: row.official})
           MERGE (c:Contractor {canonical_name: row.contractor})
             ON CREATE SET c.name = row.contractor, c.source_domain = 'corruption', c.created_at = datetime()
           MERGE (o)-[:CONNECTED_TO {source_chunk_id: row.source_chunk_id, connection: row.connection}]->(c)`,
          { batch },
        );
      }
    }

    // Write co-accused relationships
    if (data.co_accused.length > 0) {
      const batch = data.co_accused
        .filter((c) => c.name.trim())
        .map((c) => ({
          primary: normalizedOfficial,
          co_accused: this.entityResolver.normalizeName(c.name),
          position: c.position ?? null,
          relationship: c.relationship ?? "co-accused",
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MATCH (o1:Official {canonical_name: row.primary})
           MERGE (o2:Official {canonical_name: row.co_accused})
             ON CREATE SET o2.name = row.co_accused, o2.position = row.position,
                           o2.source_domain = 'corruption', o2.created_at = datetime()
           MERGE (o1)-[:CO_ACCUSED {source_chunk_id: row.source_chunk_id}]->(o2)`,
          { batch },
        );
      }
    }

    // Write aliases
    if (data.aliases.length > 0) {
      const validAliases = data.aliases.filter(
        (a) => a.trim() && a.trim().toLowerCase() !== official.toLowerCase(),
      );
      if (validAliases.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $aliases AS alias
           MATCH (o:Official {canonical_name: $official})
           MERGE (a:Alias {name: alias})
           MERGE (o)-[:ALSO_KNOWN_AS]->(a)`,
          { official: normalizedOfficial, aliases: validAliases },
        );
      }
    }

    // Write MDA relationships
    if (data.mdas.length > 0) {
      const batch = data.mdas
        .filter((m) => m.name.trim())
        .map((m) => ({
          official: normalizedOfficial,
          mda: this.entityResolver.normalizeName(m.name),
          relationship: m.relationship ?? "connected",
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MATCH (o:Official {canonical_name: row.official})
           MERGE (m:MDA {canonical_name: row.mda})
             ON CREATE SET m.name = row.mda, m.source_domain = 'corruption', m.created_at = datetime()
           MERGE (o)-[:HEADED {source_chunk_id: row.source_chunk_id}]->(m)`,
          { batch },
        );
      }
    }
  }

  private async writeBudgetRelationships(
    chunk: ChunkMetadata,
    data: BudgetExtraction,
  ): Promise<void> {
    // Write headed relationships
    if (data.headed_relationships.length > 0) {
      const batch = data.headed_relationships
        .filter((h) => h.official_name.trim() && h.mda_name.trim())
        .map((h) => ({
          official: this.entityResolver.normalizeName(h.official_name),
          position: h.position ?? null,
          mda: this.entityResolver.normalizeName(h.mda_name),
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MERGE (o:Official {canonical_name: row.official})
             ON CREATE SET o.name = row.official, o.position = row.position,
                           o.source_domain = 'budget', o.created_at = datetime()
           MERGE (m:MDA {canonical_name: row.mda})
             ON CREATE SET m.name = row.mda, m.source_domain = 'budget', m.created_at = datetime()
           MERGE (o)-[:HEADED {source_chunk_id: row.source_chunk_id}]->(m)`,
          { batch },
        );
      }
    }

    // Write contractor relationships
    if (data.contractors.length > 0) {
      const batch = data.contractors
        .filter((c) => c.name.trim())
        .map((c) => ({
          contractor: this.entityResolver.normalizeName(c.name),
          project: c.project ?? null,
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MERGE (c:Contractor {canonical_name: row.contractor})
             ON CREATE SET c.name = row.contractor, c.source_domain = 'budget', c.created_at = datetime()`,
          { batch },
        );
      }
    }
  }

  private async writeGovspendRelationships(
    chunk: ChunkMetadata,
    data: GovspendExtraction,
  ): Promise<void> {
    const orgName = chunk.metadata.organization_name as string | undefined;
    if (!orgName) return;

    const normalizedOrg = this.entityResolver.normalizeName(orgName);

    // Write contractor connections
    if (data.contractors.length > 0) {
      const batch = data.contractors
        .filter((c) => c.name.trim())
        .map((c) => ({
          mda: normalizedOrg,
          contractor: this.entityResolver.normalizeName(c.name),
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MATCH (m:MDA {canonical_name: row.mda})
           MERGE (c:Contractor {canonical_name: row.contractor})
             ON CREATE SET c.name = row.contractor, c.source_domain = 'govspend', c.created_at = datetime()
           MERGE (m)-[:PAID_TO {source_chunk_id: row.source_chunk_id}]->(c)`,
          { batch },
        );
      }
    }

    // Write official connections
    if (data.officials.length > 0) {
      const batch = data.officials
        .filter((o) => o.name.trim())
        .map((o) => ({
          mda: normalizedOrg,
          official: this.entityResolver.normalizeName(o.name),
          connection: o.connection ?? "connected",
          source_chunk_id: chunk.id,
        }));

      if (batch.length > 0) {
        await this.neo4j.executeWrite(
          `UNWIND $batch AS row
           MATCH (m:MDA {canonical_name: row.mda})
           MERGE (o:Official {canonical_name: row.official})
             ON CREATE SET o.name = row.official, o.source_domain = 'govspend', o.created_at = datetime()
           MERGE (o)-[:HEADED {source_chunk_id: row.source_chunk_id}]->(m)`,
          { batch },
        );
      }
    }
  }
}
