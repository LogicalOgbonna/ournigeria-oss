import { Module } from "@nestjs/common";
import { CorruptionCasesController } from "./corruption-cases.controller";
import { CorruptionCasesService } from "./corruption-cases.service";
import { EvidenceModule } from "../evidence/evidence.module";

@Module({
  imports: [EvidenceModule],
  controllers: [CorruptionCasesController],
  providers: [CorruptionCasesService],
  exports: [CorruptionCasesService],
})
export class CorruptionCasesModule {}
