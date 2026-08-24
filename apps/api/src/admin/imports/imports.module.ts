import { Module } from "@nestjs/common";
import { EnrichmentModule } from "../../enrichment/enrichment.module";
import { ImportsController } from "./imports.controller";
import { BulkImportService } from "./bulk-import.service";

/**
 * Admin curated-import surface. EnrichmentModule exports EnrichmentApplyService
 * (the single audited write path), so we import it rather than re-declaring its
 * provider graph. PrismaService comes from the global DatabaseModule.
 */
@Module({
  imports: [EnrichmentModule],
  controllers: [ImportsController],
  providers: [BulkImportService],
})
export class ImportsModule {}
