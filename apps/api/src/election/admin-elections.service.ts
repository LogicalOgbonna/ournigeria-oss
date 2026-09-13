import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { notifySettingsChanged, setSetting } from "../config/settings-store";
import {
  dateEncodingError,
  type CreateInput,
  type ListQuery,
  type PatchInput,
} from "./admin-elections.schemas";

/*
 * Election event state machine (plan 68 §6 + D5). Only the four review verbs
 * move `published`/`status`; PATCH never accepts either.
 *
 *   draft(published=false) --publish(review)--> published --unpublish(review)--> draft
 *          |                                        |
 *          +---------- conclude/cancel (review) ----+--> concluded | cancelled
 *   (deletable while never-published)                    (drop off the gate automatically)
 */

/** The ONE settings key the kill switch writes (D10.8) — awanaija's gate reads it. */
export const GATE_SETTING_KEY = "elections.gate_enabled";

const EDITABLE = [
  "label",
  "electionDate",
  "datePrecision",
  "stateCode",
  "constituencyCode",
  "lgaCode",
  "wardCode",
  "confidence",
  "sourceUrl",
] as const;

/** Constituency type an office's events must scope to; absent = no constituency scope. */
const CONSTITUENCY_TYPE: Partial<Record<string, string>> = {
  senatorial: "senatorial",
  house_of_reps: "federal",
  state_assembly: "state",
};

interface Scope {
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  wardCode: string | null;
}

function pick(row: Record<string, unknown>, fields: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f] = row[f] ?? null;
  return out;
}

/** @db.Date columns come back as UTC-midnight Dates; the encoding rule works on YYYY-MM-DD. */
function toDateStr(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** P2002 = a lost race against uq_elections_event / the slug unique — a 409, not a 500. */
async function uniqueWrite<T>(write: () => Promise<T>, message: string): Promise<T> {
  try {
    return await write();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictException(message);
    }
    throw err;
  }
}

const EVENT_KEY_TAKEN = "An election event already exists for this office, year, round and scope";

@Injectable()
export class AdminElectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- reads ----------

  async list(q: ListQuery) {
    const where: Prisma.ElectionWhereInput = {
      ...(q.year !== undefined ? { year: q.year } : {}),
      ...(q.office ? { office: q.office } : {}),
      ...(q.round ? { round: q.round } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.published !== undefined ? { published: q.published === "true" } : {}),
      ...(q.state ? { stateCode: q.state.toLowerCase() } : {}),
      ...(q.q
        ? { OR: [{ slug: { contains: q.q.toLowerCase() } }, { label: { contains: q.q, mode: "insensitive" } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.election.findMany({
        where,
        include: {
          state: { select: { code: true, name: true } },
          excludedStates: { select: { stateCode: true } },
          _count: { select: { campaigns: true, officialElections: true } },
        },
        orderBy: [{ year: "desc" }, { office: "asc" }, { stateCode: "asc" }, { round: "asc" }, { slug: "asc" }],
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.election.count({ where }),
    ]);
    return { total, rows };
  }

  async get(id: string) {
    const row = await this.prisma.election.findUnique({
      where: { id },
      include: {
        state: { select: { code: true, name: true } },
        constituency: { select: { code: true, name: true, type: true } },
        lga: { select: { code: true, name: true } },
        ward: { select: { code: true, name: true } },
        excludedStates: { include: { state: { select: { code: true, name: true } } } },
        _count: { select: { campaigns: true, officialElections: true } },
      },
    });
    if (!row) throw new NotFoundException("Election not found");
    const audit = await this.prisma.auditEvent.findMany({
      where: { targetType: "election", targetId: id },
      orderBy: { occurredAt: "desc" },
      take: 20,
      select: { seq: true, occurredAt: true, actorId: true, action: true, targetType: true, targetId: true, metadata: true },
    });
    return { ...row, audit: audit.map((e) => ({ ...e, seq: Number(e.seq) })) };
  }

  // ---------- create / edit / delete ----------

  async create(actor: AuditActor, input: CreateInput) {
    const scope = await this.resolveScope(input.office, input);
    const excluded = await this.resolveExcludedStates(input.excludedStates, scope);

    // A supplied slug is a promise the caller made about the URL, so a clash
    // is an error; only the slug we derive ourselves may quietly take a -2 suffix.
    let slug: string;
    if (input.slug) {
      slug = input.slug;
      if ((await this.uniqueSlug(slug)) !== slug) throw new ConflictException(`slug ${slug} is taken`);
    } else {
      slug = await this.uniqueSlug(this.deriveSlug(input, scope));
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await uniqueWrite(
        () =>
          tx.election.create({
            data: {
              slug,
              office: input.office,
              year: input.year,
              round: input.round,
              electionDate: input.electionDate ? new Date(input.electionDate) : null,
              datePrecision: input.datePrecision,
              label: input.label ?? null,
              ...scope,
              confidence: input.confidence ?? "medium",
              sourceType: "manual",
              sourceUrl: input.sourceUrl ?? null,
              excludedStates: { create: excluded.map((stateCode) => ({ stateCode })) },
            },
            include: { excludedStates: { select: { stateCode: true } } },
          }),
        EVENT_KEY_TAKEN,
      );
      await this.audit.log(tx, actor, {
        action: "election.created",
        targetType: "election",
        targetId: row.id,
        diff: {
          before: null,
          after: { ...pick(row as never, [...EDITABLE, "slug", "office", "year", "round"]), excludedStates: excluded },
        },
        metadata: { pathway: "direct" },
      });
      return row;
    });
  }

  async patch(actor: AuditActor, id: string, input: PatchInput) {
    const existing = await this.mustElection(id);
    const { reason, excludedStates, ...fields } = input;

    const changes: Record<string, unknown> = {};
    for (const f of EDITABLE) if (fields[f as keyof typeof fields] !== undefined) changes[f] = fields[f as keyof typeof fields];
    if (Object.keys(changes).length === 0 && excludedStates === undefined) {
      throw new BadRequestException("No editable fields in request");
    }
    if (existing.published && !reason?.trim()) {
      throw new BadRequestException("A reason is required to edit a published election");
    }

    // Date encoding validated on the MERGED row — a patch may move one half of the pair.
    const precision = (changes.datePrecision as string | undefined) ?? existing.datePrecision;
    const dateValue = "electionDate" in changes ? (changes.electionDate as string | null) : toDateStr(existing.electionDate);
    const encodingErr = dateEncodingError(precision, dateValue);
    if (encodingErr) throw new BadRequestException(`electionDate: ${encodingErr}`);
    if ("electionDate" in changes) changes.electionDate = changes.electionDate ? new Date(changes.electionDate as string) : null;

    // Scope re-validated as a whole whenever any scope column moves.
    const scopeTouched = (["stateCode", "constituencyCode", "lgaCode", "wardCode"] as const).some((f) => f in changes);
    let scope: Scope | null = null;
    if (scopeTouched) {
      scope = await this.resolveScope(existing.office, {
        stateCode: "stateCode" in changes ? (changes.stateCode as string | null) : existing.stateCode,
        constituencyCode: "constituencyCode" in changes ? (changes.constituencyCode as string | null) : existing.constituencyCode,
        lgaCode: "lgaCode" in changes ? (changes.lgaCode as string | null) : existing.lgaCode,
        wardCode: "wardCode" in changes ? (changes.wardCode as string | null) : existing.wardCode,
      });
      Object.assign(changes, scope);
    }

    const mergedExcluded =
      excludedStates !== undefined
        ? await this.resolveExcludedStates(excludedStates, scope ?? existing)
        : (await this.prisma.electionExcludedState.findMany({ where: { electionId: id }, select: { stateCode: true } })).map((r) => r.stateCode);
    if (scopeTouched && (scope?.stateCode ?? null) !== null && mergedExcluded.length > 0) {
      throw new BadRequestException("excludedStates: only a nationwide event can exclude states");
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await uniqueWrite(
        () =>
          tx.election.update({
            where: { id },
            data: {
              ...(changes as Prisma.ElectionUncheckedUpdateInput),
              ...(existing.published ? { reviewStatus: "unreviewed" } : {}),
            },
          }),
        EVENT_KEY_TAKEN,
      );
      if (excludedStates !== undefined) {
        // Replace-set semantics: the payload's list IS the carve-out list.
        await tx.electionExcludedState.deleteMany({ where: { electionId: id } });
        if (mergedExcluded.length > 0) {
          await tx.electionExcludedState.createMany({ data: mergedExcluded.map((stateCode) => ({ electionId: id, stateCode })) });
        }
      }
      const changedFields = [...Object.keys(changes), ...(excludedStates !== undefined ? ["excludedStates"] : [])];
      await this.audit.log(tx, actor, {
        action: "election.updated",
        targetType: "election",
        targetId: id,
        diff: { before: pick(existing as never, Object.keys(changes)), after: pick(row as never, Object.keys(changes)) },
        metadata: { pathway: "direct", reason: reason?.trim() ?? null, fields: changedFields },
      });
      return row;
    });
  }

  async remove(actor: AuditActor, id: string) {
    const existing = await this.mustElection(id);
    if (existing.published || existing.reviewedBy) {
      throw new ConflictException("Only an election that was never published can be deleted; unpublish or cancel instead");
    }
    await this.prisma.$transaction(async (tx) => {
      try {
        await tx.election.delete({ where: { id } });
      } catch (err) {
        // campaigns/official_elections FKs are ON DELETE RESTRICT by design.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
          throw new ConflictException("Campaigns or results are attached to this election; detach them first");
        }
        throw err;
      }
      await this.audit.log(tx, actor, {
        action: "election.deleted",
        targetType: "election",
        targetId: id,
        diff: { before: pick(existing as never, [...EDITABLE, "slug", "office", "year", "round"]), after: null },
      });
    });
    return { deleted: true };
  }

  // ---------- verbs (campaigns.review at the controller) ----------

  async publish(actor: AuditActor, actorAdminId: string, id: string, reason: string) {
    const row = await this.mustElection(id);
    if (row.published) throw new ConflictException("publish: election is already published");
    this.assertFrom(row.status, ["scheduled", "postponed"], "publish");
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.election.update({
        where: { id },
        data: { published: true, reviewStatus: "reviewed", reviewedBy: actorAdminId },
      });
      await this.audit.log(tx, actor, {
        action: "election.published",
        targetType: "election",
        targetId: id,
        diff: { before: { published: false, reviewStatus: row.reviewStatus }, after: { published: true, reviewStatus: "reviewed" } },
        metadata: { reason },
      });
      return updated;
    });
  }

  async unpublish(actor: AuditActor, id: string, reason: string) {
    const row = await this.mustElection(id);
    if (!row.published) throw new ConflictException("unpublish: election is not published");
    return this.transition(actor, id, "election.unpublished", { published: false }, { reason });
  }

  async conclude(actor: AuditActor, id: string, reason: string) {
    const row = await this.mustElection(id);
    this.assertFrom(row.status, ["scheduled", "postponed"], "conclude");
    return this.transition(actor, id, "election.concluded", { status: "concluded" }, { reason });
  }

  async cancel(actor: AuditActor, id: string, reason: string) {
    const row = await this.mustElection(id);
    this.assertFrom(row.status, ["scheduled", "postponed"], "cancel");
    return this.transition(actor, id, "election.cancelled", { status: "cancelled" }, { reason });
  }

  // ---------- kill switch (D10.8) ----------

  /** Writes ONLY the elections.gate_enabled settings key — no reviewer-sized hole in settings.write. */
  async setGate(actor: AuditActor, enabled: boolean) {
    const before = await this.prisma.systemSetting.findUnique({ where: { key: GATE_SETTING_KEY }, select: { value: true } });
    await this.prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: GATE_SETTING_KEY },
        update: { value: String(enabled), updatedBy: actor.actorId ?? null },
        create: {
          key: GATE_SETTING_KEY,
          value: String(enabled),
          category: "elections",
          valueType: "boolean",
          description: "Master kill switch for the public election gate (plan 68 D10.8)",
          updatedBy: actor.actorId ?? null,
        },
      });
      await this.audit.log(tx, actor, {
        action: "election.gate_toggled",
        targetType: "system_setting",
        targetId: GATE_SETTING_KEY,
        diff: { before: { enabled: before ? before.value !== "false" : true }, after: { enabled } },
        metadata: { enabled },
      });
    });
    // The gate service reads through the in-memory settings store.
    setSetting(GATE_SETTING_KEY, String(enabled));
    notifySettingsChanged();
    return { enabled };
  }

  // ---------- helpers ----------

  private async mustElection(id: string) {
    const row = await this.prisma.election.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Election not found");
    return row;
  }

  private assertFrom(status: string, allowed: readonly string[], verb: string) {
    if (!allowed.includes(status)) throw new ConflictException(`${verb} is only allowed from ${allowed.join(", ")} (election is ${status})`);
  }

  private async transition(actor: AuditActor, id: string, action: string, data: Prisma.ElectionUncheckedUpdateInput, metadata: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.election.findUniqueOrThrow({ where: { id }, select: { status: true, published: true } });
      const row = await tx.election.update({ where: { id }, data });
      await this.audit.log(tx, actor, {
        action,
        targetType: "election",
        targetId: id,
        diff: { before, after: { status: row.status, published: row.published } },
        metadata,
      });
      return row;
    });
  }

  /**
   * Validate the scope arc against the geo tables and fill parents from
   * narrower codes (ward ⇒ lga ⇒ state, constituency ⇒ state), same
   * convention as campaigns. All-null = nationwide; any office may be
   * nationwide or scoped (a nationwide senate event has no scope at all).
   */
  private async resolveScope(
    office: string,
    input: { stateCode?: string | null; constituencyCode?: string | null; lgaCode?: string | null; wardCode?: string | null },
  ): Promise<Scope> {
    const scope: Scope = {
      stateCode: input.stateCode?.toLowerCase() ?? null,
      constituencyCode: input.constituencyCode?.toLowerCase() ?? null,
      lgaCode: input.lgaCode?.toLowerCase() ?? null,
      wardCode: input.wardCode?.toLowerCase() ?? null,
    };
    const explicitState = scope.stateCode;
    let stateDerived = false;

    if (scope.wardCode) {
      const w = await this.prisma.nigerianWard.findUnique({
        where: { code: scope.wardCode },
        select: { lgaCode: true, lga: { select: { stateCode: true } } },
      });
      if (!w) throw new BadRequestException(`wardCode: unknown ward ${scope.wardCode}`);
      if (scope.lgaCode && scope.lgaCode !== w.lgaCode) throw new BadRequestException(`lgaCode: ward ${scope.wardCode} is in ${w.lgaCode}, not ${scope.lgaCode}`);
      scope.lgaCode = w.lgaCode;
    }
    if (scope.lgaCode) {
      const l = await this.prisma.nigerianLga.findUnique({ where: { code: scope.lgaCode }, select: { stateCode: true } });
      if (!l) throw new BadRequestException(`lgaCode: unknown LGA ${scope.lgaCode}`);
      if (explicitState && explicitState !== l.stateCode) throw new BadRequestException(`stateCode: LGA ${scope.lgaCode} is in ${l.stateCode}, not ${explicitState}`);
      scope.stateCode = l.stateCode;
      stateDerived = true;
    }
    if (scope.constituencyCode) {
      const wanted = CONSTITUENCY_TYPE[office];
      if (!wanted) throw new BadRequestException(`constituencyCode: ${office} events do not take a constituency`);
      const c = await this.prisma.nigerianConstituency.findUnique({ where: { code: scope.constituencyCode }, select: { type: true, stateCode: true } });
      if (!c) throw new BadRequestException(`constituencyCode: unknown constituency ${scope.constituencyCode}`);
      if (c.type !== wanted) throw new BadRequestException(`constituencyCode: ${scope.constituencyCode} is a ${c.type} constituency, ${office} needs ${wanted}`);
      if (explicitState && explicitState !== c.stateCode) throw new BadRequestException(`stateCode: constituency ${scope.constituencyCode} is in ${c.stateCode}, not ${explicitState}`);
      scope.stateCode = c.stateCode;
      stateDerived = true;
    }
    if (scope.stateCode && !stateDerived) {
      const s = await this.prisma.nigerianState.findUnique({ where: { code: scope.stateCode }, select: { code: true } });
      if (!s) throw new BadRequestException(`stateCode: unknown state ${scope.stateCode}`);
    }
    return scope;
  }

  /** Carve-outs only make sense on a nationwide event (plan 68 §1). */
  private async resolveExcludedStates(codes: readonly string[], scope: { stateCode: string | null }): Promise<string[]> {
    const lowered = codes.map((c) => c.toLowerCase());
    if (lowered.length === 0) return [];
    if (scope.stateCode) throw new BadRequestException("excludedStates: only a nationwide event can exclude states");
    const found = await this.prisma.nigerianState.findMany({ where: { code: { in: lowered } }, select: { code: true } });
    const known = new Set(found.map((s) => s.code));
    const unknown = lowered.filter((c) => !known.has(c));
    if (unknown.length) throw new BadRequestException(`excludedStates: unknown state ${unknown.join(", ")}`);
    return lowered;
  }

  /** "2027-presidential", "2026-osun-gubernatorial", "2026-osun-gubernatorial-rerun". */
  private deriveSlug(input: { year: number; office: string; round: string }, scope: Scope) {
    const narrowest = scope.wardCode ?? scope.constituencyCode ?? scope.lgaCode ?? scope.stateCode;
    const parts = [String(input.year), narrowest, input.office, input.round === "general" ? null : input.round];
    return parts.filter(Boolean).join("-");
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    for (let i = 2; await this.prisma.election.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
