import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { HealthService } from "./health.service.js";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private service: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Liveness/readiness health check" })
  async check(@Res() res: Response) {
    const health = await this.service.check();
    const status =
      health.status === "down"
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;
    return res.status(status).json(health);
  }
}
