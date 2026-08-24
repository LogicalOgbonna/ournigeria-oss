import { Module } from "@nestjs/common";
import { OfficialsController } from "./officials.controller";
import { OfficialsService } from "./officials.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { CompletenessModule } from "../completeness/completeness.module";

@Module({
  imports: [EvidenceModule, CompletenessModule],
  controllers: [OfficialsController],
  providers: [OfficialsService],
  exports: [OfficialsService],
})
export class OfficialsModule {}
