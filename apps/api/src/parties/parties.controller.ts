import { Controller, Get, Param, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public";
import { PartiesService } from "./parties.service";

@Controller("parties")
export class PartiesController {
  constructor(private service: PartiesService) {}

  @Public()
  @Get()
  async list(@Query("activeOnly") activeOnly: string | undefined, @Res() res: Response) {
    try {
      const parties = await this.service.list({ activeOnly: activeOnly === "true" });
      return res.json(parties);
    } catch (err) {
      console.error("parties list error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":acronym")
  async getByAcronym(@Param("acronym") acronym: string, @Res() res: Response) {
    try {
      const party = await this.service.getByAcronym(acronym);
      return res.json(party);
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Party not found" });
      }
      console.error("parties get error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":acronym/officeholders")
  async getOfficeholders(
    @Param("acronym") acronym: string,
    @Query("role") role: string | undefined,
    @Query("page") page: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.listOfficeholders(acronym, role, page);
      return res.json(result);
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Party not found" });
      }
      console.error("parties officeholders error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":acronym/chapters")
  async getChapters(@Param("acronym") acronym: string, @Res() res: Response) {
    try {
      const chapters = await this.service.getChapters(acronym);
      return res.json(chapters);
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Party not found" });
      }
      console.error("parties chapters error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
