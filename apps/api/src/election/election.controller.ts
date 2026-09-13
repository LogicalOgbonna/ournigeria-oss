import { Controller, Get, Header, Query, BadRequestException } from "@nestjs/common";
import { Public } from "../auth/decorators/public";
import { ElectionService } from "./election.service";
import { Office, OFFICES } from "./office-map";

@Controller("election")
export class ElectionController {
  constructor(private readonly service: ElectionService) {}

  @Public()
  @Get("gate")
  @Header("Cache-Control", "public, s-maxage=60") // no stale-while-revalidate (E1.6) — rollback latency stays bounded
  async gate() {
    return this.service.gate();
  }

  @Public()
  @Get("ballot")
  async ballot(
    @Query("state") state?: string,
    @Query("offices") offices?: string,   // "governor:2026,president:2027"
    @Query("lga") lga?: string,
    @Query("ward") ward?: string,
  ) {
    if (!state) throw new BadRequestException("state is required");
    const valid = new Set<string>(OFFICES);
    const parsed = (offices ?? "").split(",").map((s) => s.trim()).filter(Boolean).map((tok) => {
      const [office, yearStr] = tok.split(":");
      return { office: office as Office, year: Number(yearStr) };
    }).filter((p) => valid.has(p.office) && Number.isInteger(p.year));
    if (parsed.length === 0) throw new BadRequestException("offices required as comma-separated office:year pairs");
    const seen = new Set<Office>();
    const deduped = parsed.filter((p) => (seen.has(p.office) ? false : (seen.add(p.office), true)));
    return this.service.getBallot({ state, lga, ward, offices: deduped });
  }
}
