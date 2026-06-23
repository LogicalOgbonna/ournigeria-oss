import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { EvidenceEntryType, isEvidenceEntryType } from "./evidence.constants";

/** API-facing shape of one evidence source attached to a fact. */
export interface EvidenceView {
  id: string;
  url: string;
  archiveUrl: string | null;
  publisher: string;
  snippet: string;
  format: string;
  locator: string | null;
  sourceTier: string;
  confidence: string;
  retrievedAt: string;
  /** True once our own S3 snapshot of the source exists. */
  hasSnapshot: boolean;
  /** False when the original URL is known to be taken down — UI offers the archived copy. */
  originalAccessible: boolean;
}

export interface CreateEvidenceInput {
  entryType: EvidenceEntryType;
  entryId: string;
  field?: string | null;
  url: string;
  archiveUrl?: string | null;
  publisher: string;
  snippet: string;
  format: string;
  locator?: string | null;
  sourceTier: string;
  confidence?: string;
  retrievedAt: Date;
}

/**
 * Owns the polymorphic `evidence` table (Plan 45). The table has NO DB-level
 * FK to its parents, so this service is the integrity boundary:
 *  - every fact-delete path MUST call deleteFor()
 *  - reads are batched (one IN query per profile/case, never per-entry)
 *
 * Map keys: entry ids are uuids (globally unique across tables), so a bare
 * entryId is enough. Official-level fields share the official's id, so those
 * rows key as `${entryId}#${field}`.
 */
@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  static key(entryId: string, field?: string | null): string {
    return field ? `${entryId}#${field}` : entryId;
  }

  /** One query for any number of entries; group in memory. */
  async loadForEntries(entryIds: string[]): Promise<Map<string, EvidenceView[]>> {
    const map = new Map<string, EvidenceView[]>();
    const ids = [...new Set(entryIds)].filter(Boolean);
    if (ids.length === 0) return map;

    const rows = await this.prisma.evidence.findMany({
      where: { entryId: { in: ids } },
      orderBy: [{ sourceTier: "asc" }, { retrievedAt: "desc" }],
    });

    for (const row of rows) {
      const key = EvidenceService.key(row.entryId, row.field);
      const list = map.get(key) ?? [];
      list.push(this.toView(row));
      map.set(key, list);
    }
    return map;
  }

  /** Stitch evidence onto a list of mapped entries by id. */
  attach<T extends { id: string }>(
    entries: T[],
    evidence: Map<string, EvidenceView[]>,
  ): (T & { evidence: EvidenceView[] })[] {
    return entries.map((e) => ({ ...e, evidence: evidence.get(e.id) ?? [] }));
  }

  async create(input: CreateEvidenceInput) {
    if (!isEvidenceEntryType(input.entryType)) {
      throw new BadRequestException(`unknown evidence entryType: ${input.entryType}`);
    }
    if (input.entryType === "official_field" && !input.field) {
      throw new BadRequestException("official_field evidence requires a field");
    }
    return this.prisma.evidence.create({
      data: {
        entryType: input.entryType,
        entryId: input.entryId,
        field: input.field ?? null,
        url: input.url,
        archiveUrl: input.archiveUrl ?? null,
        publisher: input.publisher,
        snippet: input.snippet,
        format: input.format,
        locator: input.locator ?? null,
        sourceTier: input.sourceTier,
        confidence: input.confidence ?? "medium",
        retrievedAt: input.retrievedAt,
      },
    });
  }

  /** Service-layer cascade — call whenever a fact row is deleted. */
  async deleteFor(entryType: EvidenceEntryType, entryId: string): Promise<number> {
    const res = await this.prisma.evidence.deleteMany({ where: { entryType, entryId } });
    return res.count;
  }

  private toView(row: {
    id: string;
    url: string;
    archiveUrl: string | null;
    publisher: string;
    snippet: string;
    format: string;
    locator: string | null;
    sourceTier: string;
    confidence: string;
    retrievedAt: Date;
    snapshotStatus: string;
    originalAccessible: boolean;
  }): EvidenceView {
    return {
      id: row.id,
      url: row.url,
      archiveUrl: row.archiveUrl,
      publisher: row.publisher,
      snippet: row.snippet,
      format: row.format,
      locator: row.locator,
      sourceTier: row.sourceTier,
      confidence: row.confidence,
      retrievedAt: row.retrievedAt.toISOString(),
      hasSnapshot: row.snapshotStatus === "captured",
      originalAccessible: row.originalAccessible,
    };
  }
}
