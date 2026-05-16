import { Module } from "@nestjs/common";
import { PlatformModule } from "../platforms/platform.module.js";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

@Module({
  imports: [PlatformModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
