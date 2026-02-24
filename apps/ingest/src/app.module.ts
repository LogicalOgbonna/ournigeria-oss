import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { VectorModule } from './vector/vector.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    VectorModule,
    IngestionModule,
    SchedulingModule,
  ],
})
export class AppModule {}
