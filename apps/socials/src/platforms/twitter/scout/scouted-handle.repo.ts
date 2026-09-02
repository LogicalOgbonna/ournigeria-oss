import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import type { Prisma, SocialsScoutedHandle } from "@prisma/client";

export interface StoreHandleInput {
  restId: string;
  handle: string;
  name: string;
  bio: string;
  followers: number;
  profileImageUrl: string | null;
  stateCode: string;
  lgaCode: string | null;
  wardCode: string | null;
  confidence: number;
  evidence: string;
  sourceTweetId: string | null;
  sourceTweetText: string | null;
  /** created_at of the tweet we discovered them through — their recency proxy. */
  lastActiveAt: Date;
  /** Initial curation status for NEW rows (schema default: pending —
   * deny-by-default). The scout passes "pending" explicitly; createManual
   * passes "active" (the operator IS the vouch). */
  status?: "pending" | "active";
}

export interface PickForLocationOpts {
  stateCode: string;
  lgaCode?: string | null;
  wardCode?: string | null;
  limit: number;
  cooldownDays: number;
  /** Skip accounts whose last activity is older than this many days (unset =
   * no recency gate). Manually-added accounts are exempt (operator vouch). */
  activeWithinDays?: number;
}

@Injectable()
export class ScoutedHandleRepo {
  constructor(private readonly prisma: PrismaService) {}

  /** restIds (of the given set) that already have a row. */
  async knownRestIds(restIds: string[]): Promise<Set<string>> {
    if (restIds.length === 0) return new Set();
    const rows = await this.prisma.socialsScoutedHandle.findMany({
      where: { restId: { in: restIds } },
      select: { restId: true },
    });
    return new Set(rows.map((r) => r.restId));
  }

  /** New sighting of a known account: refresh the mutable snapshot only —
   * geo attribution and curation status are NOT touched. */
  async refreshSighting(
    restId: string,
    data: {
      handle: string;
      name: string;
      bio: string;
      followers: number;
      lastActiveAt?: Date;
    },
  ): Promise<void> {
    await this.prisma.socialsScoutedHandle.updateMany({
      where: { restId },
      data: { ...data, lastSeenAt: new Date() },
    });
  }

  async store(input: StoreHandleInput): Promise<SocialsScoutedHandle> {
    const { restId, status, ...rest } = input;
    // An operator may have added this @handle manually before the scout ever
    // sighted it — that row sits under a `manual:` placeholder restId the
    // organic dedupe can't see. Upgrade it in place (real restId + fresh
    // profile snapshot) instead of creating a duplicate person: one row per
    // human keeps the tag cooldown honest. Operator-entered fields win over
    // the model: geo attribution, confidence, evidence, and curation status
    // are preserved (an opted_out row must never resurrect as active).
    const existing = await this.findByHandle(input.handle);
    if (existing && existing.restId.startsWith("manual:")) {
      return this.prisma.socialsScoutedHandle.update({
        where: { id: existing.id },
        data: {
          restId,
          handle: rest.handle,
          name: rest.name,
          bio: rest.bio,
          followers: rest.followers,
          profileImageUrl: rest.profileImageUrl,
          sourceTweetId: rest.sourceTweetId,
          sourceTweetText: rest.sourceTweetText,
          lastActiveAt: rest.lastActiveAt,
          lastSeenAt: new Date(),
        },
      });
    }
    return this.prisma.socialsScoutedHandle.upsert({
      where: { restId },
      // Re-sights refresh the snapshot but never touch curation status.
      create: { restId, ...rest, ...(status ? { status } : {}) },
      update: { ...rest, lastSeenAt: new Date() },
    });
  }

  /**
   * Handles to tag for a location — most granular match first (ward → LGA →
   * state), active only, past the per-handle tagging cooldown. Within a tier
   * we oversample the top candidates and SHUFFLE: a deterministic
   * best-confidence-first pick would hammer the same few people on a 14-day
   * carousel, which is exactly the bulk-mention pattern X's platform
   * enforcement flags. Never throws on empty tiers; may return < limit.
   */
  async pickForLocation(
    opts: PickForLocationOpts,
  ): Promise<SocialsScoutedHandle[]> {
    const cutoff = new Date(
      Date.now() - opts.cooldownDays * 24 * 60 * 60 * 1000,
    );
    const base: Prisma.SocialsScoutedHandleWhereInput = {
      status: "active",
      OR: [{ lastTaggedAt: null }, { lastTaggedAt: { lt: cutoff } }],
    };
    // Only tag accounts still active within the window. Manual rows (operator
    // vouch) are exempt — they never re-sight, so lastActiveAt would go stale.
    if (opts.activeWithinDays) {
      const activeCutoff = new Date(
        Date.now() - opts.activeWithinDays * 24 * 60 * 60 * 1000,
      );
      base.AND = [
        {
          OR: [
            { lastActiveAt: { gte: activeCutoff } },
            { restId: { startsWith: "manual:" } },
          ],
        },
      ];
    }
    const orderBy: Prisma.SocialsScoutedHandleOrderByWithRelationInput[] = [
      { confidence: "desc" },
      { followers: "desc" },
    ];

    const tiers: Prisma.SocialsScoutedHandleWhereInput[] = [];
    if (opts.wardCode) tiers.push({ ...base, wardCode: opts.wardCode });
    if (opts.lgaCode) tiers.push({ ...base, lgaCode: opts.lgaCode });
    tiers.push({ ...base, stateCode: opts.stateCode });

    const picked: SocialsScoutedHandle[] = [];
    const seen = new Set<string>();
    for (const where of tiers) {
      if (picked.length >= opts.limit) break;
      const rows = await this.prisma.socialsScoutedHandle.findMany({
        where,
        orderBy,
        take: Math.max(opts.limit * 5, 10),
      });
      // Fisher-Yates over the oversampled pool.
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }
      for (const r of rows) {
        if (picked.length >= opts.limit) break;
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        picked.push(r);
      }
    }
    return picked;
  }

  /** Distinct handles tagged in the trailing 24h — feeds the global daily
   * mention cap (bulk unsolicited mentions are an account-level suspension
   * risk, so the ceiling is platform safety, not a tuning knob).
   * `excludeIds`: a draft being published excludes its OWN handles, whose
   * cooldowns were stamped at draft time — counting them would make a day of
   * drafting consume the publish budget and silently strip every approval. */
  async taggedInLastDay(excludeIds: string[] = []): Promise<number> {
    return this.prisma.socialsScoutedHandle.count({
      where: {
        lastTaggedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
    });
  }

  async findByIds(ids: string[]): Promise<SocialsScoutedHandle[]> {
    if (ids.length === 0) return [];
    return this.prisma.socialsScoutedHandle.findMany({
      where: { id: { in: ids } },
    });
  }

  async markTagged(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.socialsScoutedHandle.updateMany({
      where: { id: { in: ids } },
      data: { timesTagged: { increment: 1 }, lastTaggedAt: new Date() },
    });
  }

  /** Case-insensitive LGA-name → code within a state; null when unresolvable. */
  async resolveLgaCode(
    stateCode: string,
    lgaName: string | null,
  ): Promise<string | null> {
    if (!lgaName?.trim()) return null;
    const row = await this.prisma.nigerianLga.findFirst({
      where: {
        stateCode,
        name: { equals: lgaName.trim(), mode: "insensitive" },
      },
      select: { code: true },
    });
    return row?.code ?? null;
  }

  /** Case-insensitive ward-name → code within an LGA (ward needs a resolved
   * LGA — a bare ward name is ambiguous across the state). */
  async resolveWardCode(
    lgaCode: string | null,
    wardName: string | null,
  ): Promise<string | null> {
    if (!lgaCode || !wardName?.trim()) return null;
    const row = await this.prisma.nigerianWard.findFirst({
      where: {
        lgaCode,
        name: { equals: wardName.trim(), mode: "insensitive" },
      },
      select: { code: true },
    });
    return row?.code ?? null;
  }

  async list(filter: {
    stateCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: SocialsScoutedHandle[]; total: number }> {
    const where = {
      ...(filter.stateCode ? { stateCode: filter.stateCode } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.socialsScoutedHandle.findMany({
        where,
        orderBy: [{ confidence: "desc" }, { followers: "desc" }],
        take: Math.min(filter.limit ?? 100, 500),
        skip: Math.max(filter.offset ?? 0, 0),
      }),
      this.prisma.socialsScoutedHandle.count({ where }),
    ]);
    return { rows, total };
  }

  async updateStatus(
    id: string,
    status: "active" | "rejected" | "opted_out",
  ): Promise<SocialsScoutedHandle> {
    return this.prisma.socialsScoutedHandle.update({
      where: { id },
      data: { status },
    });
  }

  async findByHandle(handle: string): Promise<SocialsScoutedHandle | null> {
    return this.prisma.socialsScoutedHandle.findFirst({
      where: { handle: { equals: handle, mode: "insensitive" } },
    });
  }

  /**
   * Operator-added handle (dashboard). No X lookup happens here, so the rest_id
   * is a deterministic `manual:` placeholder — if the scout later sights the
   * same @handle organically it creates a second row under the real rest_id;
   * callers dedupe by handle (findByHandle) before creating.
   */
  async createManual(input: {
    handle: string;
    stateCode: string;
    lgaCode?: string | null;
    wardCode?: string | null;
    name?: string;
    bio?: string;
  }): Promise<SocialsScoutedHandle> {
    return this.prisma.socialsScoutedHandle.create({
      data: {
        restId: `manual:${input.handle.toLowerCase()}`,
        handle: input.handle,
        name: input.name ?? input.handle,
        bio: input.bio ?? "",
        followers: 0,
        profileImageUrl: null,
        stateCode: input.stateCode,
        lgaCode: input.lgaCode ?? null,
        wardCode: input.wardCode ?? null,
        confidence: 1,
        evidence: "Manually added by operator",
        sourceTweetId: null,
        sourceTweetText: null,
        // Operator vouches for a manual add: explicitly active (the schema
        // default is deny-by-default "pending") and treated as active-now for
        // the recency gate (manual rows never re-sight).
        status: "active",
        lastActiveAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.socialsScoutedHandle.delete({ where: { id } });
  }

  async countsByState(): Promise<
    Array<{ stateCode: string; count: number }>
  > {
    const grouped = await this.prisma.socialsScoutedHandle.groupBy({
      by: ["stateCode"],
      where: { status: "active" },
      _count: { _all: true },
    });
    return grouped
      .map((g) => ({ stateCode: g.stateCode, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  }
}
