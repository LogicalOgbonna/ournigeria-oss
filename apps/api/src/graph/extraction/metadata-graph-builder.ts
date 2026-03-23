import { Injectable, Logger } from "@nestjs/common";
import { Neo4jService } from "../neo4j.service";
import type { ChunkMetadata } from "./chunk-reader";
import { EntityResolver } from "./entity-resolver";

export interface BuildResult {
  nodesCreated: number;
  relationshipsCreated: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class MetadataGraphBuilder {
  private readonly logger = new Logger(MetadataGraphBuilder.name);

  constructor(
    private neo4j: Neo4jService,
    private entityResolver: EntityResolver,
  ) {}

  async buildFromMetadata(
    domain: string,
    chunks: ChunkMetadata[],
  ): Promise<BuildResult> {
    switch (domain) {
      case "budget":
        return this.buildBudget(chunks);
      case "corruption":
        return this.buildCorruption(chunks);
      case "govspend":
        return this.buildGovspend(chunks);
      case "faac":
        return this.buildFaac(chunks);
      default:
        throw new Error(`Unknown domain: ${domain}`);
    }
  }

  private async buildBudget(chunks: ChunkMetadata[]): Promise<BuildResult> {
    const batch: Record<string, unknown>[] = [];
    let skipped = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const m = chunk.metadata;
      const state = m.state as string | undefined;
      if (!state) {
        skipped++;
        continue;
      }

      batch.push({
        chunk_id: chunk.id,
        state: this.entityResolver.normalizeName(state),
        year: m.year ?? null,
        sector: m.sector ?? null,
        budget_category: m.budget_category ?? null,
      });
    }

    if (batch.length === 0) {
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }

    try {
      const result = await this.neo4j.executeWrite(
        `UNWIND $batch AS row
         MERGE (s:State {name: row.state})
         MERGE (b:BudgetItem {source_chunk_id: row.chunk_id})
           ON CREATE SET b.name = coalesce(row.sector, 'Budget') + ' — ' + row.state + coalesce(' (' + row.year + ')', ''),
                         b.state = row.state, b.year = row.year,
                         b.sector = row.sector, b.category = row.budget_category,
                         b.source_domain = 'budget', b.created_at = datetime()
         MERGE (s)-[:ALLOCATED]->(b)`,
        { batch },
      );
      const counters = result.summary.counters.updates();
      return {
        nodesCreated: counters.nodesCreated,
        relationshipsCreated: counters.relationshipsCreated,
        skipped,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      this.logger.error(`Budget batch write failed: ${msg}`);
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }
  }

  private async buildCorruption(chunks: ChunkMetadata[]): Promise<BuildResult> {
    const batch: Record<string, unknown>[] = [];
    let skipped = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const m = chunk.metadata;
      const official = m.official as string | undefined;
      const state = m.state as string | undefined;

      if (!official) {
        skipped++;
        continue;
      }

      const normalizedOfficial = this.entityResolver.normalizeName(official);
      const normalizedState = state
        ? this.entityResolver.normalizeName(state)
        : null;

      const normalizedAgency = ((m.agency as string) ?? "EFCC")
        .toLowerCase()
        .trim();

      batch.push({
        chunk_id: chunk.id,
        case_key: normalizedOfficial.toLowerCase() + "_" + normalizedAgency,
        official: normalizedOfficial,
        position: m.position ?? null,
        state: normalizedState,
        party: m.party ?? null,
        agency: m.agency ?? null,
        status: m.status ?? null,
        amount_alleged_ngn: m.amount_alleged_ngn ?? null,
      });
    }

    if (batch.length === 0) {
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }

    try {
      const result = await this.neo4j.executeWrite(
        `UNWIND $batch AS row
         MERGE (o:Official {canonical_name: row.official})
           ON CREATE SET o.name = row.official, o.position = row.position,
                         o.party = row.party, o.state = row.state,
                         o.source_domain = 'corruption', o.created_at = datetime()
           ON MATCH SET o.updated_at = datetime()
         MERGE (c:CorruptionCase {case_key: row.case_key})
           ON CREATE SET c.name = row.official + ' — ' + coalesce(row.agency, 'EFCC') + ' (' + coalesce(row.status, 'pending') + ')',
                         c.official = row.official, c.status = row.status,
                         c.amount_alleged = row.amount_alleged_ngn, c.agency = row.agency,
                         c.source_domain = 'corruption', c.created_at = datetime(),
                         c.chunk_count = 1
           ON MATCH SET c.status = coalesce(row.status, c.status),
                        c.amount_alleged = coalesce(row.amount_alleged_ngn, c.amount_alleged),
                        c.name = row.official + ' — ' + coalesce(row.agency, 'EFCC') + ' (' + coalesce(coalesce(row.status, c.status), 'pending') + ')',
                        c.chunk_count = coalesce(c.chunk_count, 1) + 1,
                        c.updated_at = datetime()
         MERGE (o)-[:CHARGED_IN]->(c)
         WITH o, row
         WHERE row.state IS NOT NULL
         MERGE (s:State {name: row.state})
         FOREACH (_ IN CASE WHEN row.position IS NOT NULL AND toLower(row.position) CONTAINS 'governor' THEN [1] ELSE [] END |
           MERGE (o)-[:GOVERNED]->(s)
         )`,
        { batch },
      );
      const counters = result.summary.counters.updates();
      return {
        nodesCreated: counters.nodesCreated,
        relationshipsCreated: counters.relationshipsCreated,
        skipped,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      this.logger.error(`Corruption batch write failed: ${msg}`);
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }
  }

  private async buildGovspend(chunks: ChunkMetadata[]): Promise<BuildResult> {
    const batch: Record<string, unknown>[] = [];
    let skipped = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const m = chunk.metadata;
      const beneficiary = (m.beneficiary_name as string | undefined)?.trim();
      if (!beneficiary) {
        skipped++;
        continue;
      }

      const orgName = (m.organization_name as string | undefined)?.trim() || null;

      batch.push({
        chunk_id: chunk.id,
        beneficiary: this.entityResolver.normalizeName(beneficiary),
        organization_name: orgName
          ? this.entityResolver.normalizeName(orgName)
          : null,
        year: m.year ?? null,
        month: m.month ?? null,
        amount: m.amount ?? null,
      });
    }

    if (batch.length === 0) {
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }

    try {
      const result = await this.neo4j.executeWrite(
        `UNWIND $batch AS row
         MERGE (c:Contractor {canonical_name: row.beneficiary})
           ON CREATE SET c.name = row.beneficiary,
                         c.source_domain = 'govspend', c.created_at = datetime()
           ON MATCH SET c.updated_at = datetime()
         MERGE (p:Payment {source_chunk_id: row.chunk_id})
           ON CREATE SET p.name = row.beneficiary + coalesce(' (' + row.year + ')', ''),
                         p.amount = row.amount, p.year = row.year,
                         p.month = row.month, p.beneficiary = row.beneficiary,
                         p.source_domain = 'govspend', p.created_at = datetime()
         MERGE (c)<-[:PAID_TO]-(p)
         WITH p, row
         WHERE row.organization_name IS NOT NULL
         MERGE (m:MDA {canonical_name: row.organization_name})
           ON CREATE SET m.name = row.organization_name, m.type = 'federal',
                         m.source_domain = 'govspend', m.created_at = datetime()
         MERGE (m)-[:RECEIVED_PAYMENT]->(p)`,
        { batch },
      );
      const counters = result.summary.counters.updates();
      return {
        nodesCreated: counters.nodesCreated,
        relationshipsCreated: counters.relationshipsCreated,
        skipped,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      this.logger.error(`GovSpend batch write failed: ${msg}`);
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }
  }

  private async buildFaac(chunks: ChunkMetadata[]): Promise<BuildResult> {
    const batch: Record<string, unknown>[] = [];
    let skipped = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const m = chunk.metadata;
      const state = m.state as string | undefined;
      if (!state) {
        skipped++;
        continue;
      }

      batch.push({
        chunk_id: chunk.id,
        state: this.entityResolver.normalizeName(state),
        year: m.year ?? null,
        month: m.month ?? null,
        total_allocation: m.total_allocation ?? null,
        lga: m.lga ?? null,
        geopolitical_zone: m.geopolitical_zone ?? null,
      });
    }

    if (batch.length === 0) {
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }

    try {
      const result = await this.neo4j.executeWrite(
        `UNWIND $batch AS row
         MERGE (s:State {name: row.state})
           ON CREATE SET s.geopolitical_zone = row.geopolitical_zone
         MERGE (f:FAACAllocation {source_chunk_id: row.chunk_id})
           ON CREATE SET f.name = row.state + ' FAAC' + coalesce(' ' + row.month, '') + coalesce(' ' + row.year, ''),
                         f.state = row.state, f.year = row.year, f.month = row.month,
                         f.amount = row.total_allocation, f.lga = row.lga,
                         f.geopolitical_zone = row.geopolitical_zone,
                         f.source_domain = 'faac', f.created_at = datetime()
         MERGE (s)-[:RECEIVED_FAAC]->(f)`,
        { batch },
      );
      const counters = result.summary.counters.updates();
      return {
        nodesCreated: counters.nodesCreated,
        relationshipsCreated: counters.relationshipsCreated,
        skipped,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      this.logger.error(`FAAC batch write failed: ${msg}`);
      return { nodesCreated: 0, relationshipsCreated: 0, skipped, errors };
    }
  }
}
