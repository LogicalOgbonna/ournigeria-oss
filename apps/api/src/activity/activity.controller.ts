import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public";
import { ActivityService } from "./activity.service";

@Controller("activity")
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Public()
  @Get()
  async recent(
    @Query("limit") limit: string | undefined,
    @Query("page") page: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.getRecent(
        limit ? Math.min(parseInt(limit, 10), 50) : 10,
        page ? parseInt(page, 10) : 1,
      );
      return res.json(result);
    } catch (err) {
      console.error("activity error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
