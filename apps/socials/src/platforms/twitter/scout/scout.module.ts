import { Module } from "@nestjs/common";
import { RoamerModule } from "../roamer/roamer.module.js";
import { GeoClassifierService } from "./geo-classifier.service.js";
import { ScoutService } from "./scout.service.js";
import { ScoutedHandleRepo } from "./scouted-handle.repo.js";

@Module({
  imports: [RoamerModule],
  providers: [GeoClassifierService, ScoutedHandleRepo, ScoutService],
  exports: [ScoutService, ScoutedHandleRepo],
})
export class ScoutModule {}
