import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class ChangeProposalService {
  constructor(private readonly prisma: PrismaService) {}

  async listByStatus(status: string) {
    const proposals = await this.prisma.changeProposal.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { sources: true },
    });
    return this.withOfficial(proposals);
  }

  getWithSources(id: string) {
    return this.prisma.changeProposal.findUnique({
      where: { id },
      include: { sources: true },
    });
  }

  /**
   * Resolve which official each proposal touches, so the dashboard can show whose data is
   * changing and link to their public page. `nigerian_officials` proposals key off targetPk
   * directly; `official_positions` proposals resolve through the position's official; a
   * `create` carries the new official's name in its payload (no id/public page yet).
   */
  private async withOfficial<T extends { changeKind: string; targetTable: string; targetPk: string | null; proposedValue: unknown }>(
    proposals: T[],
  ) {
    const officialIds = new Set<string>();
    const positionIds = new Set<string>();
    for (const p of proposals) {
      if (p.changeKind === "create" || !p.targetPk) continue;
      if (p.targetTable === "nigerian_officials") officialIds.add(p.targetPk);
      else if (p.targetTable === "official_positions") positionIds.add(p.targetPk);
    }

    const [officials, positions] = await Promise.all([
      officialIds.size
        ? this.prisma.nigerianOfficial.findMany({
            where: { id: { in: [...officialIds] } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      positionIds.size
        ? this.prisma.officialPosition.findMany({
            where: { id: { in: [...positionIds] } },
            select: { id: true, official: { select: { id: true, name: true } } },
          })
        : Promise.resolve([] as { id: string; official: { id: string; name: string } }[]),
    ]);

    const officialById = new Map(officials.map((o) => [o.id, o]));
    const positionById = new Map(positions.map((p) => [p.id, p]));

    return proposals.map((p) => {
      let officialId: string | null = null;
      let officialName: string | null = null;
      if (p.changeKind === "create") {
        const v = p.proposedValue as { official?: { name?: string } } | null;
        officialName = v?.official?.name ?? null;
      } else if (p.targetPk && p.targetTable === "nigerian_officials") {
        const o = officialById.get(p.targetPk);
        if (o) { officialId = o.id; officialName = o.name; }
      } else if (p.targetPk && p.targetTable === "official_positions") {
        const pos = positionById.get(p.targetPk);
        if (pos?.official) { officialId = pos.official.id; officialName = pos.official.name; }
      }
      return { ...p, officialId, officialName };
    });
  }
}
