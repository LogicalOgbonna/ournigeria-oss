import { Module } from "@nestjs/common";
import { ElectionController } from "./election.controller";
import { ElectionService } from "./election.service";
import { GeoSeatResolver } from "./geo-seat-resolver";

@Module({
  controllers: [ElectionController],
  providers: [ElectionService, GeoSeatResolver],
  exports: [ElectionService, GeoSeatResolver],
})
export class ElectionModule {}
