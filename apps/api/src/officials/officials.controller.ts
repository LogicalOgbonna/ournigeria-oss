import { Controller, Get, Param, Query, Req, Res, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../auth/decorators/public";
import { OfficialsService } from "./officials.service";

@Controller("officials")
export class OfficialsController {
  constructor(private service: OfficialsService) {}

  @Public()
  @Get()
  async list(
    @Query("state") stateCode: string | undefined,
    @Query("lga") lgaCode: string | undefined,
    @Query("role") role: string | undefined,
    @Query("party") party: string | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.list({
        stateCode,
        lgaCode,
        role,
        party,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
      });
      return res.json(result);
    } catch (err) {
      console.error("officials list error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get("by-location")
  async byLocation(
    @Query("state") stateCode: string | undefined,
    @Query("lga") lgaCode: string | undefined,
    @Query("ward") wardCode: string | undefined,
    @Res() res: Response,
  ) {
    try {
      if (!stateCode) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "state parameter is required" });
      }
      const chain = await this.service.getByLocation(stateCode, lgaCode, wardCode);
      return res.json({ chain });
    } catch (err) {
      console.error("officials by-location error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":id")
  async getById(@Param("id") id: string, @Res() res: Response) {
    try {
      const official = await this.service.getById(id);
      return res.json(official);
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Official not found" });
      }
      console.error("officials get error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
