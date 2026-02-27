import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@ournigeria/database';
import { VectorModule } from './vector/vector.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { S3Module } from './s3/s3.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot({
      connectionTimeoutMillis: 5_000,
    }),
    S3Module,
    VectorModule,
    IngestionModule,
    SchedulingModule,
  ],
})
export class AppModule {}
