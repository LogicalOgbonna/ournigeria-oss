import { Module } from "@nestjs/common";
import { OfficialsModule } from "../officials/officials.module";
import { EvidenceModule } from "../evidence/evidence.module";
import { OkfExportService } from "./okf-export.service";
import { OkfPublishService } from "./okf-publish.service";

@Module({
  imports: [OfficialsModule, EvidenceModule],
  providers: [OkfExportService, OkfPublishService],
  exports: [OkfExportService, OkfPublishService],
})
export class OkfModule {}
