import { Module } from "@nestjs/common";
import { OfficialsController } from "./officials.controller";
import { OfficialsService } from "./officials.service";
import { EvidenceModule } from "../evidence/evidence.module";

@Module({
  imports: [EvidenceModule],
  controllers: [OfficialsController],
  providers: [OfficialsService],
  exports: [OfficialsService],
})
export class OfficialsModule {}
