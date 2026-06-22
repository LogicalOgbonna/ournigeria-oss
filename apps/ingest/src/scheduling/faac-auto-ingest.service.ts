import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService, seedFaacFromFile, faacLoadGuards, MONTHS } from "@ournigeria/database";
import { fetchCatalogResources, type CatalogResource } from "../pipeline/faac/nbs-catalog-scraper";
import { downloadResource } from "../pipeline/faac/downloader";
import { reindexFaac } from "../pipeline/faac/reindex";
import { IngestNotifier } from "../lib/ingest-notifier";

export interface MissingMonth { year: number; month: number; }

/** Pure: catalog resources minus what the DB already has (keys "YYYY-M"). */
export function computeMissingMonths(
  catalog: CatalogResource[],
  existing: Set<string>,
): MissingMonth[] {
  const want = new Map<string, MissingMonth>();
  for (const r of catalog)
    for (const m of r.months) {
      const key = `${r.year}-${m}`;
      if (!existing.has(key)) want.set(key, { year: r.year, month: m });
    }
  return [...want.values()].sort((a, b) => a.year - b.year || a.month - b.month);
}

@Injectable()
export class FaacAutoIngestService {
  private readonly logger = new Logger(FaacAutoIngestService.name);
  private readonly notifier: IngestNotifier;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.notifier = new IngestNotifier(
      config.get<string>("TELEGRAM_BOT_TOKEN"),
      config.get<string>("FAAC_ALERT_CHAT_ID"),
    );
  }

  async poll(): Promise<void> {
    if (this.config.get<string>("FAAC_AUTOINGEST_DISABLED") === "1") {
      this.logger.log("FAAC auto-ingest disabled via env; skipping.");
      return;
    }
    const catalog = await fetchCatalogResources();
    const rows = await this.prisma.faacDisbursement.findMany({
      select: { disbursementYear: true, disbursementMonth: true },
    });
    const existing = new Set(rows.map((r) => `${r.disbursementYear}-${r.disbursementMonth}`));
    const missing = computeMissingMonths(catalog, existing);
    if (missing.length === 0) { this.logger.log("FAAC: up to date."); return; }
    this.logger.log(`FAAC: ${missing.length} new month(s): ${missing.map((m) => `${m.year}-${m.month}`).join(", ")}`);
    for (const mm of missing) await this.ingestMonth(mm, catalog);
  }

  private async ingestMonth(mm: MissingMonth, catalog: CatalogResource[]): Promise<void> {
    const monthName = MONTHS[mm.month - 1];
    const resource = catalog.find((r) => r.year === mm.year && r.months.includes(mm.month));
    if (!resource) return;
    const run = await this.prisma.importRun.create({
      data: { dataset: "faac", adminId: null, status: "running" },
    });
    try {
      const files = await downloadResource(resource);
      let applied = false;
      for (const f of files) {
        // Identify which file in a multi-month zip is THIS month (dry-run reads
        // the sheet title without committing).
        const probe = await seedFaacFromFile(
          this.prisma as unknown as Parameters<typeof seedFaacFromFile>[0],
          f.path, String(mm.year), monthName, { dryRun: true },
        );
        if (probe.titleYear !== mm.year || probe.titleMonth !== mm.month) continue;
        // Guards run INSIDE the seed transaction; a failure throws
        // FaacGuardFailure and rolls back so a bad parse never commits.
        const committed = await seedFaacFromFile(
          this.prisma as unknown as Parameters<typeof seedFaacFromFile>[0],
          f.path, String(mm.year), monthName, { dryRun: false, guard: faacLoadGuards },
        );
        await reindexFaac({
          databaseUrl: this.config.getOrThrow<string>("DATABASE_URL"),
          indexName: this.config.getOrThrow<string>("VECTOR_INDEX_FAAC"),
          dimension: Number(this.config.getOrThrow<string>("EMBEDDING_DIMENSION")),
          embeddingBaseUrl: this.config.getOrThrow<string>("EMBEDDING_BASE_URL"),
          embeddingApiKey: this.config.getOrThrow<string>("EMBEDDING_API_KEY"),
          embeddingModel: this.config.getOrThrow<string>("EMBEDDING_MODEL"),
          onlyYear: mm.year,
        });
        await this.prisma.importRun.update({
          where: { id: run.id },
          data: {
            status: "done", createdCount: 1, finishedAt: new Date(),
            notes: `${monthName} ${mm.year}: ₦${committed.grandTotal}, ${committed.stateCount} states, ${committed.lgaCount} LGAs`,
          },
        });
        await this.notifier.send(`✅ FAAC ${monthName} ${mm.year} loaded: ₦${committed.grandTotal} · ${committed.stateCount} states · ${committed.lgaCount} LGAs`);
        applied = true;
        break;
      }
      if (!applied) throw new Error(`no xlsx in ${resource.filename} matched ${monthName} ${mm.year}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.prisma.importRun.update({
        where: { id: run.id },
        data: { status: "failed", errorCount: 1, finishedAt: new Date(), notes: msg.slice(0, 2000) },
      });
      await this.notifier.send(`❌ FAAC ${monthName} ${mm.year} failed: ${msg}`);
      this.logger.error(`FAAC ${monthName} ${mm.year}: ${msg}`);
    }
  }
}
