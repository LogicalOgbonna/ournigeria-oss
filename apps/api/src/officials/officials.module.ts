import { Module } from "@nestjs/common";
import { OfficialsController } from "./officials.controller";
import { OfficialsService } from "./officials.service";
import { AdminOfficialsController } from "./admin-officials.controller";
import { AdminOfficialsService } from "./admin-officials.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { CompletenessModule } from "../completeness/completeness.module";

@Module({
  imports: [EvidenceModule, CompletenessModule],
  controllers: [OfficialsController, AdminOfficialsController],
  providers: [OfficialsService, AdminOfficialsService],
  exports: [OfficialsService],
})
export class OfficialsModule {}
