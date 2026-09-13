import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ElectionController } from "./election.controller";
import { ElectionService } from "./election.service";
import { GeoSeatResolver } from "./geo-seat-resolver";
import { AdminElectionsController } from "./admin-elections.controller";
import { AdminElectionsService } from "./admin-elections.service";

@Module({
  imports: [AuditModule],
  controllers: [ElectionController, AdminElectionsController],
  providers: [ElectionService, GeoSeatResolver, AdminElectionsService],
  exports: [ElectionService, GeoSeatResolver, AdminElectionsService],
})
export class ElectionModule {}
