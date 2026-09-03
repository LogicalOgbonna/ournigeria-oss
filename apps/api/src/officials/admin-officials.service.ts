import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { Prisma, PrismaService, slugifyName } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { CompletenessService } from "../completeness/completeness.service";

/** Scalar profile fields editable from the dashboard (spec 62 §12). */
export const EDITABLE_FIELDS = [
  "name",
  "officialType",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "dateOfBirth",
  "gender",
  "education",
  "biography",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export type OfficialScalarInput = Partial<Record<EditableField, string | null>>;

function pickFields(
  source: Record<string, unknown>,
  fields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f] = source[f] ?? null;
  return out;
}

/**
 * Direct officials CRUD from the admin dashboard (plan 62 §12). Single-party
 * writes — faster than the proposal pipeline but weaker provenance, so every
 * change carries metadata.pathway = "direct", a required reason on
 * update/delete, and a same-transaction chain event. Delete is SOFT and
 * super-admin-only; hard delete does not exist as an API.
 */
@Injectable()
export class AdminOfficialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly completeness: CompletenessService,
  ) {}

  async create(actor: AuditActor, input: OfficialScalarInput & { name: string }) {
    const data: Record<string, unknown> = {};
    for (const f of EDITABLE_FIELDS) {
      if (input[f] !== undefined) data[f] = input[f];
    }
    if (typeof data.dateOfBirth === "string") {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    const created = await this.prisma.$transaction(async (tx) => {
      const slug = await this.generateUniqueSlug(tx, input.name);
      const official = await tx.nigerianOfficial.create({
        data: { ...(data as Prisma.NigerianOfficialUncheckedCreateInput), slug },
      });
      await this.audit.log(tx, actor, {
        action: "official.created",
        targetType: "official",
        targetId: official.id,
        diff: { before: null, after: pickFields(official as never, [...EDITABLE_FIELDS, "slug"]) },
        metadata: { pathway: "direct" },
      });
      return official;
    });
    await this.completeness.recompute(created.id).catch(() => {});
    return created;
  }

  async update(
    actor: AuditActor,
    id: string,
    input: OfficialScalarInput,
    reason: string,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException("A reason is required for direct edits");
    }
    const existing = await this.prisma.nigerianOfficial.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Official not found");
    }

    const changes: Record<string, unknown> = {};
    for (const f of EDITABLE_FIELDS) {
      if (input[f] === undefined) continue;
      const next = f === "dateOfBirth" && input[f] ? new Date(input[f] as string) : input[f];
      changes[f] = next;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException("No editable fields in request");
    }

    const changedFields = Object.keys(changes);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.nigerianOfficial.update({
        where: { id },
        data: changes as Prisma.NigerianOfficialUncheckedUpdateInput,
      });
      // Name edits regenerate the slug + keep the old one as a redirect,
      // exactly like the proposal pathway.
      if (typeof changes.name === "string" && changes.name !== existing.name) {
        await this.reslug(tx, id, existing.slug, changes.name);
      }
      await this.audit.log(tx, actor, {
        action: "official.updated",
        targetType: "official",
        targetId: id,
        diff: {
          before: pickFields(existing as never, changedFields),
          after: pickFields(row as never, changedFields),
        },
        metadata: { pathway: "direct", reason: reason.trim(), fields: changedFields },
      });
      return row;
    });
    await this.completeness.recompute(id).catch(() => {});
    return updated;
  }

  async updateSlug(actor: AuditActor, id: string, slug: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException("A reason is required for slug changes");
    }
    const normalized = slugifyName(slug ?? "");
    if (!normalized || normalized !== slug) {
      throw new BadRequestException(
        `Invalid slug — lowercase letters, digits and hyphens only (did you mean "${normalized}"?)`,
      );
    }
    const existing = await this.prisma.nigerianOfficial.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Official not found");
    }
    if (existing.slug === normalized) {
      throw new BadRequestException("Slug is unchanged");
    }

    return this.prisma.$transaction(async (tx) => {
      const clash = await tx.nigerianOfficial.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException("Slug already belongs to another official");
      }
      const alias = await tx.officialSlugAlias.findUnique({
        where: { slug: normalized },
        select: { officialId: true },
      });
      if (alias && alias.officialId !== id) {
        // Never hijack another official's redirect (spec §12).
        throw new ConflictException("Slug is a redirect for another official");
      }
      if (alias) {
        await tx.officialSlugAlias.delete({ where: { slug: normalized } });
      }
      const row = await tx.nigerianOfficial.update({
        where: { id },
        data: { slug: normalized },
      });
      // Old public URLs must 30x forever — slugs live in tweets and indexes.
      if (existing.slug) {
        await tx.officialSlugAlias.upsert({
          where: { slug: existing.slug },
          update: { officialId: id },
          create: { slug: existing.slug, officialId: id },
        });
      }
      await this.audit.log(tx, actor, {
        action: "official.slug.updated",
        targetType: "official",
        targetId: id,
        diff: {
          before: { slug: existing.slug },
          after: { slug: normalized },
        },
        metadata: { pathway: "direct", reason: reason.trim() },
      });
      return row;
    });
  }

  async softDelete(actor: AuditActor, id: string, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException("A reason is required for deletions");
    }
    const existing = await this.prisma.nigerianOfficial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Official not found");
    if (existing.deletedAt) {
      throw new ConflictException("Official is already deleted");
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.nigerianOfficial.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actor.actorId ?? null,
          deletionReason: reason.trim(),
        },
      });
      await this.audit.log(tx, actor, {
        action: "official.deleted",
        targetType: "official",
        targetId: id,
        // Full snapshot: the audit trail must be able to show what vanished.
        diff: { before: existing as unknown as Record<string, unknown>, after: null },
        metadata: { pathway: "direct", reason: reason.trim() },
      });
      return row;
    });
  }

  async restore(actor: AuditActor, id: string) {
    const existing = await this.prisma.nigerianOfficial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Official not found");
    if (!existing.deletedAt) {
      throw new ConflictException("Official is not deleted");
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.nigerianOfficial.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, deletionReason: null },
      });
      await this.audit.log(tx, actor, {
        action: "official.restored",
        targetType: "official",
        targetId: id,
        metadata: { pathway: "direct", previousReason: existing.deletionReason },
      });
      return row;
    });
  }

  /** Same disambiguation scheme as the proposal pathway (base → -state → -N). */
  private async generateUniqueSlug(
    tx: Prisma.TransactionClient,
    name: string,
  ): Promise<string> {
    let base = slugifyName(name);
    if (!base) base = `official-${randomBytes(4).toString("hex")}`;
    const used = await this.usedSlugs(tx, base, null);
    if (!used.has(base)) return base;
    let n = 2;
    while (used.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  /**
   * Slugs unavailable for `base`: other officials' live slugs AND other
   * officials' redirect aliases — an alias is a promise that old public links
   * keep resolving to ITS official; taking it over silently points someone
   * else's shared links at the wrong person (spec §12). Own aliases are
   * reclaimable (cycling back to an old name).
   */
  private async usedSlugs(
    tx: Prisma.TransactionClient,
    base: string,
    selfId: string | null,
  ): Promise<Set<string>> {
    const slugFilter = { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] };
    const [officials, aliases] = await Promise.all([
      tx.nigerianOfficial.findMany({
        where: { ...slugFilter, ...(selfId ? { id: { not: selfId } } : {}) },
        select: { slug: true },
      }),
      tx.officialSlugAlias.findMany({
        where: { ...slugFilter, ...(selfId ? { officialId: { not: selfId } } : {}) },
        select: { slug: true },
      }),
    ]);
    return new Set([
      ...officials.map((r) => r.slug).filter((s): s is string => !!s),
      ...aliases.map((r) => r.slug),
    ]);
  }

  private async reslug(
    tx: Prisma.TransactionClient,
    officialId: string,
    oldSlug: string | null,
    newName: string,
  ): Promise<void> {
    const base = slugifyName(newName);
    if (!base) return;
    if (oldSlug === base) return;
    const used = await this.usedSlugs(tx, base, officialId);
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    if (slug === oldSlug) return;
    // Reclaim only OWN alias rows for the chosen slug — another official's
    // alias is never deleted (it made `used` unavailable above anyway).
    await tx.officialSlugAlias.deleteMany({ where: { slug, officialId } });
    await tx.nigerianOfficial.update({ where: { id: officialId }, data: { slug } });
    if (oldSlug) {
      await tx.officialSlugAlias.upsert({
        where: { slug: oldSlug },
        update: { officialId },
        create: { slug: oldSlug, officialId },
      });
    }
  }
}
