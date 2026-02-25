import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestionService } from '../ingestion/ingestion.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly ingestionService: IngestionService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyReIngest() {
    this.logger.log('Starting weekly re-ingestion for all pipelines');

    for (const pipeline of ['budget', 'corruption']) {
      try {
        const result = await this.ingestionService.runPipeline(
          pipeline,
          'cron',
        );
        this.logger.log(`${pipeline}: ${result.message}`);
      } catch (err) {
        this.logger.error(
          `${pipeline} weekly re-ingest failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  // TODO: Google Drive sync placeholder
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async syncGoogleDrive() {
  //   this.logger.log('Google Drive sync — not yet implemented');
  // }
}
