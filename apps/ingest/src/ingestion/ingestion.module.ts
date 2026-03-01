import { Module } from "@nestjs/common";
import { PipelineModule } from "../pipeline/pipeline.module";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { LogEmitterService } from "./log-emitter.service";

@Module({
  imports: [PipelineModule],
  controllers: [IngestionController],
  providers: [IngestionService, LogEmitterService],
  exports: [IngestionService, LogEmitterService],
})
export class IngestionModule {}
