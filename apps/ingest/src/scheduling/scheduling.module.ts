import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [IngestionModule],
  providers: [SchedulingService],
})
export class SchedulingModule {}
