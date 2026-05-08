import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { RoamerService } from "../roamer/roamer.service.js";

@ApiTags("Roamer / Loop")
@Controller("v1/roam")
@UseGuards(AdminAuthGuard)
export class RoamController {
  constructor(private readonly roamer: RoamerService) {}

  @Get("status")
  @ApiOperation({ summary: "Roamer status, sessions counts, topic counts" })
  status() {
    return this.roamer.status();
  }

  @Post("start")
  @ApiOperation({ summary: "Start the roamer loop on this node" })
  start() {
    return this.roamer.start();
  }

  @Post("stop")
  @ApiOperation({ summary: "Stop the roamer loop on this node" })
  async stop() {
    await this.roamer.stop();
    return { ok: true };
  }
}
