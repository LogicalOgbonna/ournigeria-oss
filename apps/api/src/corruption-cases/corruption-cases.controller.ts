import { Controller, Get, Param, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public";
import { CorruptionCasesService } from "./corruption-cases.service";

@Controller("cases")
export class CorruptionCasesController {
  constructor(private service: CorruptionCasesService) {}

  @Public()
  @Get()
  async list(
    @Query("status") status: string | undefined,
    @Query("type") caseType: string | undefined,
    @Query("state") stateCode: string | undefined,
    @Query("subject") subject: string | undefined,
    @Query("search") search: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.list({
        status,
        caseType,
        stateCode,
        subject,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
      });
      return res.json(result);
    } catch (err) {
      console.error("cases list error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":slug")
  async getBySlug(@Param("slug") slug: string, @Res() res: Response) {
    try {
      const kase = await this.service.getBySlug(slug);
      return res.json(kase);
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Case not found" });
      }
      console.error("cases get error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
