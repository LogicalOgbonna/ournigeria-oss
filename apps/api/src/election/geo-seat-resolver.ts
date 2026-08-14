import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { Office } from "./office-map";

export interface SeatScope {
  office: Office;
  column: "stateCode" | "constituencyCode" | "lgaCode" | "wardCode" | null; // null = national
  code: string | null;
  label: string;
}

@Injectable()
export class GeoSeatResolver {
  constructor(private prisma: PrismaService) {}

  async resolveOne(
    office: Office, stateCode: string, stateName: string,
    lgaCode?: string, wardCode?: string,
  ): Promise<SeatScope | null> {
    switch (office) {
      case "president":
        return { office, column: null, code: null, label: "President" };
      case "governor":
        return { office, column: "stateCode", code: stateCode, label: `Governor of ${stateName}` };
      case "lga_chairman":
        return lgaCode ? { office, column: "lgaCode", code: lgaCode, label: "LGA Chairman" } : null;
      case "councillor":
        return wardCode ? { office, column: "wardCode", code: wardCode, label: "Ward Councillor" } : null;
      case "senate": {
        if (!lgaCode) return null;
        const m = await this.prisma.senatorialDistrictLga.findFirst({
          where: { lgaCode }, orderBy: { senatorialDistrictCode: "asc" },
          include: { senatorialDistrict: true },
        });
        return m ? { office, column: "constituencyCode", code: m.senatorialDistrictCode, label: m.senatorialDistrict?.name ?? m.senatorialDistrictCode } : null;
      }
      case "hor": {
        if (!lgaCode) return null; // every LGA → exactly one federal constituency
        const m = await this.prisma.constituencyWard.findFirst({
          where: { constituency: { type: "federal" }, ward: { lgaCode } },
          orderBy: { constituencyCode: "asc" }, include: { constituency: true },
        });
        return m ? { office, column: "constituencyCode", code: m.constituencyCode, label: m.constituency?.name ?? m.constituencyCode } : null;
      }
      case "state_assembly": {
        if (!wardCode) return null; // some LGAs split across state constituencies
        const m = await this.prisma.constituencyWard.findFirst({
          where: { wardCode, constituency: { type: "state" } },
          orderBy: { constituencyCode: "asc" }, include: { constituency: true },
        });
        return m ? { office, column: "constituencyCode", code: m.constituencyCode, label: m.constituency?.name ?? m.constituencyCode } : null;
      }
      default:
        return null;
    }
  }
}
