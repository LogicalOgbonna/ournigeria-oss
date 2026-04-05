import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public";
import { CompletenessService } from "./completeness.service";

@Controller("completeness")
export class CompletenessController {
  constructor(private service: CompletenessService) {}

  @Public()
  @Get()
  async stateRankings(@Res() res: Response) {
    try {
      const rankings = await this.service.getStateRankings();
      return res.json(rankings);
    } catch (err) {
      console.error("completeness state error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("lga")
  async lgaRankings(@Query("state") stateCode: string | undefined, @Res() res: Response) {
    try {
      if (!stateCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "state parameter is required" });
      }
      const rankings = await this.service.getLgaRankings(stateCode);
      return res.json(rankings);
    } catch (err) {
      console.error("completeness lga error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
