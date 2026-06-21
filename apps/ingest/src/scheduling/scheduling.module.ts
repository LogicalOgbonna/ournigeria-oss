import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { SchedulingService } from './scheduling.service';
import { FaacAutoIngestService } from './faac-auto-ingest.service';

@Module({
  imports: [IngestionModule],
  providers: [SchedulingService, FaacAutoIngestService],
})
export class SchedulingModule {}
