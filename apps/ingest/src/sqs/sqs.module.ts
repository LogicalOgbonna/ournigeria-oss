import { Module } from "@nestjs/common";
import { PipelineModule } from "../pipeline/pipeline.module";
import { SqsConsumerService } from "./sqs-consumer.service";

@Module({
  imports: [PipelineModule],
  providers: [SqsConsumerService],
})
export class SqsModule {}
