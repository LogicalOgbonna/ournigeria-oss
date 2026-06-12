import { Module } from "@nestjs/common";
import { EvidenceService } from "./evidence.service";
import { EvidenceSnapshotService } from "./evidence-snapshot.service";

@Module({
  providers: [EvidenceService, EvidenceSnapshotService],
  exports: [EvidenceService, EvidenceSnapshotService],
})
export class EvidenceModule {}
