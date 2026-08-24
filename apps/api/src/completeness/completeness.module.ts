import { Module } from "@nestjs/common";
import { CompletenessController } from "./completeness.controller";
import { CompletenessService } from "./completeness.service";

@Module({
  controllers: [CompletenessController],
  providers: [CompletenessService],
  exports: [CompletenessService],
})
export class CompletenessModule {}
