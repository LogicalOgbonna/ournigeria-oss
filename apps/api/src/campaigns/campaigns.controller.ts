import { Controller, Get, HttpStatus, Param, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public";
import {
  CAMPAIGN_ELECTION_TYPES,
  CampaignElectionType,
  CampaignsService,
} from "./campaigns.service";

@Controller("campaigns")
export class CampaignsController {
  constructor(private service: CampaignsService) {}

  /**
   * GET /api/campaigns?year=2027&type=presidential&party=APC&state=lagos
   * Every public ticket matching the filters, newest cycle first.
   */
  @Public()
  @Get()
  async list(
    @Query("year") rawYear: string | undefined,
    @Query("type") rawType: string | undefined,
    @Query("party") party: string | undefined,
    @Query("state") state: string | undefined,
    @Query("constituency") constituency: string | undefined,
    @Query("lga") lga: string | undefined,
    @Res() res: Response,
  ) {
    let year: number | undefined;
    if (rawYear !== undefined) {
      if (!/^\d{4}$/.test(rawYear)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "year must be a four-digit year" });
      }
      year = Number(rawYear);
    }

    let electionType: CampaignElectionType | undefined;
    if (rawType !== undefined) {
      const wanted = rawType.trim().toLowerCase();
      if (!(CAMPAIGN_ELECTION_TYPES as readonly string[]).includes(wanted)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: `type must be one of ${CAMPAIGN_ELECTION_TYPES.join(", ")}` });
      }
      electionType = wanted as CampaignElectionType;
    }

    try {
      const campaigns = await this.service.list({ year, electionType, party, state, constituency, lga });
      return res.json(campaigns);
    } catch (err) {
      console.error("campaigns list error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  /** GET /api/campaigns/:slug — the full ticket, or 404 if hidden/unknown. */
  @Public()
  @Get(":slug")
  async getBySlug(@Param("slug") slug: string, @Res() res: Response) {
    try {
      const campaign = await this.service.getBySlug(slug);
      return res.json(campaign);
    } catch (err: any) {
      if (err?.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Campaign not found" });
      }
      console.error("campaigns get error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }
}
