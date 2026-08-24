import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService, slugifyName, Prisma } from "@ournigeria/database";
import { randomBytes, randomUUID } from "crypto";
import {
  getRecordSchema,
  isStructuredTargetField,
  parseStructuredTargetField,
  validateRecordData,
} from "@ournigeria/official-records";
import { ImageStorageService } from "../images/image-storage.service";
import { OfficialsService } from "../officials/officials.service";
import { ProposalNotifierService } from "./proposal-notifier.service";
import { OfficialRecordService } from "./official-record.service";
import { getCreatableEntity } from "../enrichment/creatable.registry";
import { validateSourceUrl, validateImageUrl, validateFacebookUrl } from "../lib/url-validation";
import { buildIdentifyDisplayValue, composeGeo } from "./proposal-display";

const VALID_TARGET_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "education",
  "biography",
  "gender",
  "dateOfBirth",
  // Position-level fields (require positionId + sourceUrl)
  "partyAcronym",
  "wardCode",
  "lgaCode",
] as const;

const RELATIONAL_FIELDS = new Set(["partyAcronym", "wardCode", "lgaCode"]);

/** YYYY-MM-DD. Used to validate a user-supplied succession/defection effective date. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a stored effective date ("YYYY-MM-DD") into a Date, or null if absent/invalid.
 * Callers fall back to `new Date()` (today) when this returns null.
 */
function parseEffectiveDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !ISO_DATE_RE.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MAX_PROPOSALS_PER_DAY = 50;
const MAX_ANON_PROPOSALS_PER_HOUR = 30;
const MAX_VOTES_PER_DAY = 20;
const MAX_RECORDS_PER_BATCH = 15;

/**
 * Structured (add:/edit:) rows are limited per-BATCH via checkStructuredRateLimit,
 * not per-row — exclude them from the scalar row counters or a single batch
 * would consume the whole scalar budget.
 */
const NOT_STRUCTURED = {
  NOT: [{ targetField: { startsWith: "add:" } }, { targetField: { startsWith: "edit:" } }],
};

const UUID_RE_STR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mask a proposer phone for admin display: +2348012345678 -> +234•••5678 */
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 8) return phone;
  return `${phone.slice(0, 4)}•••${phone.slice(-4)}`;
}

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private imageStorage: ImageStorageService,
    private officialsService: OfficialsService,
    private notifier: ProposalNotifierService,
    private officialRecords: OfficialRecordService = new OfficialRecordService(),
  ) {}

  async create(data: {
    officialId: string;
    positionId?: string;
    proposerPhone: string | null;
    proposerIp?: string | null;
    trust: "verified" | "anonymous";
    targetField: string;
    proposedValue: any;
    sourceUrl?: string;
    // Only meaningful for targetField "name": is this a correction (same person,
    // wrong name) or a succession (previous term ended, a new person holds the seat)?
    nameChangeKind?: "correction" | "succession";
    // Only meaningful for targetField "partyAcronym": a correction (wrong party
    // recorded) or a defection (the official actually changed party on a date)?
    partyChangeKind?: "correction" | "defection";
    // The real date a succession/defection took effect (YYYY-MM-DD). Falls back to
    // "today" at approval time when omitted.
    effectiveDate?: string;
  }) {
    if (!VALID_TARGET_FIELDS.includes(data.targetField as any)) {
      throw new BadRequestException(`Invalid target field: ${data.targetField}`);
    }

    if (RELATIONAL_FIELDS.has(data.targetField)) {
      if (!data.positionId) {
        throw new BadRequestException("positionId is required for relational field changes");
      }
      if (!data.sourceUrl) {
        throw new BadRequestException("sourceUrl is required for relational field changes");
      }
    }

    // Validate sourceUrl if provided
    if (data.sourceUrl) {
      const result = validateSourceUrl(data.sourceUrl);
      if (!result.valid) throw new BadRequestException(`sourceUrl: ${result.reason}`);
      data.sourceUrl = result.url;
    }

    // If targetField is imageUrl, validate the proposed value as an image URL
    if (data.targetField === "imageUrl" && typeof data.proposedValue === "string") {
      const result = validateImageUrl(data.proposedValue);
      if (!result.valid) throw new BadRequestException(`imageUrl: ${result.reason}`);
      data.proposedValue = result.url;
    }

    // If targetField is facebookUrl, validate the proposed value
    if (data.targetField === "facebookUrl" && typeof data.proposedValue === "string") {
      const result = validateFacebookUrl(data.proposedValue);
      if (!result.valid) throw new BadRequestException(`facebookUrl: ${result.reason}`);
      data.proposedValue = result.url;
    }

    // Verify official exists
    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id: data.officialId },
    });
    if (!official) {
      throw new NotFoundException("Official not found");
    }

    // Rate limit: verified submits by phone (30/day), anonymous by IP (5/hour).
    if (data.trust === "anonymous") {
      await this.checkAnonymousIpRateLimit(data.proposerIp);
    } else {
      await this.checkProposalRateLimit(data.proposerPhone!);
    }

    // Persist the intent (+ effective date) alongside the value so approval knows
    // whether to apply in place (correction) or record a dated, history-preserving
    // event: a succession (new official) for a name, a defection (new party
    // affiliation) for a party. Anything not explicitly the event kind = correction.
    const pv: Record<string, unknown> = { value: data.proposedValue };
    if (data.targetField === "name") {
      pv.nameChangeKind = data.nameChangeKind === "succession" ? "succession" : "correction";
    } else if (data.targetField === "partyAcronym") {
      pv.partyChangeKind = data.partyChangeKind === "defection" ? "defection" : "correction";
    }
    if (data.effectiveDate && ISO_DATE_RE.test(data.effectiveDate)) {
      pv.effectiveDate = data.effectiveDate;
    }
    const proposedValue = pv as Prisma.InputJsonObject;

    const proposal = await this.prisma.dataProposal.create({
      data: {
        officialId: data.officialId,
        positionId: data.positionId ?? null,
        proposerPhone: data.proposerPhone,
        proposerIp: data.proposerIp ?? null,
        trust: data.trust,
        targetField: data.targetField,
        proposedValue,
        sourceUrl: data.sourceUrl ?? null,
        status: "submitted",
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        eventType: "proposal_submitted",
        targetType: "official",
        targetId: data.officialId,
        metadata: {
          proposalId: proposal.id,
          targetField: data.targetField,
          officialName: official.name,
        },
      },
    });

    // Send Telegram notification (fire-and-forget)
    this.notifier
      .notifyNewProposal({
        proposalId: proposal.id,
        officialName: official.name,
        targetField: data.targetField,
        proposedValue: String(data.proposedValue),
        voteScore: 0,
      })
      .catch(() => {}); // Don't fail proposal creation if notification fails

    return { id: proposal.id, status: "submitted", trust: data.trust };
  }

  async identify(data: {
    proposerPhone: string | null;
    proposerIp?: string | null;
    trust: "verified" | "anonymous";
    name: string;
    role: string;
    imageUrl?: string;
    partyAcronym?: string;
    email?: string;
    phoneNumber?: string;
    officeAddress?: string;
    twitterHandle?: string;
    facebookUrl?: string;
    gender?: string;
    education?: string;
    biography?: string;
    dateOfBirth?: string;
    sourceUrl?: string;
    // Geographic scope — exactly one set based on role
    stateCode?: string;
    lgaCode?: string;
    wardCode?: string;
    constituencyCode?: string;
  }) {
    const validRoles = ["councilor", "lga_chairman", "mha", "rep", "representative", "senator", "governor"];
    if (!validRoles.includes(data.role)) {
      throw new BadRequestException(`Invalid role: ${data.role}`);
    }
    if (!data.name?.trim()) {
      throw new BadRequestException("Name is required");
    }

    // Validate URLs
    if (data.sourceUrl) {
      const r = validateSourceUrl(data.sourceUrl);
      if (!r.valid) throw new BadRequestException(`sourceUrl: ${r.reason}`);
      data.sourceUrl = r.url;
    }
    if (data.imageUrl) {
      const r = validateImageUrl(data.imageUrl);
      if (!r.valid) throw new BadRequestException(`imageUrl: ${r.reason}`);
      data.imageUrl = r.url;
    }
    if (data.facebookUrl) {
      const r = validateFacebookUrl(data.facebookUrl);
      if (!r.valid) throw new BadRequestException(`facebookUrl: ${r.reason}`);
      data.facebookUrl = r.url;
    }

    // Rate limit: verified submits by phone (30/day), anonymous by IP (5/hour).
    if (data.trust === "anonymous") {
      await this.checkAnonymousIpRateLimit(data.proposerIp);
    } else {
      await this.checkProposalRateLimit(data.proposerPhone!);
    }

    // Determine the correct geographic scope for the position
    const positionScope: Record<string, string> = {};
    const role = data.role === "rep" ? "representative" : data.role;
    const imageInfo = this.normalizeIdentifyImage(data.imageUrl);
    const officialProfile = this.normalizeIdentifyProfile(data);

    if (role === "councilor") {
      if (!data.wardCode) throw new BadRequestException("wardCode is required for councilor");
      positionScope.wardCode = data.wardCode;
    } else if (role === "lga_chairman") {
      if (!data.lgaCode) throw new BadRequestException("lgaCode is required for LGA chairman");
      positionScope.lgaCode = data.lgaCode;
    } else if (role === "mha") {
      if (!data.constituencyCode) throw new BadRequestException("constituencyCode is required for state house member");
      positionScope.constituencyCode = data.constituencyCode;
    } else if (role === "representative") {
      if (!data.constituencyCode) throw new BadRequestException("constituencyCode is required for federal representative");
      positionScope.constituencyCode = data.constituencyCode;
    } else if (role === "senator") {
      if (!data.constituencyCode) throw new BadRequestException("constituencyCode is required for senator");
      positionScope.constituencyCode = data.constituencyCode;
    } else if (role === "governor") {
      if (!data.stateCode) throw new BadRequestException("stateCode is required for governor");
      positionScope.stateCode = data.stateCode;
    }

    const geoName = await this.resolveGeoName({
      wardCode: data.wardCode, lgaCode: data.lgaCode,
      constituencyCode: data.constituencyCode, stateCode: data.stateCode,
    });
    const identifyProposalValue = this.buildIdentifyProposalValue({
      name: data.name.trim(),
      role,
      partyAcronym: data.partyAcronym || null,
      imageUrl: imageInfo.proposalImageUrl,
      ...officialProfile,
      sourceUrl: data.sourceUrl || null,
      positionScope,
      geoName,
    });

    const seat = this.seatKey(role, {
      wardCode: data.wardCode, lgaCode: data.lgaCode,
      constituencyCode: data.constituencyCode, stateCode: data.stateCode,
    });
    const proposedSlug = slugifyName(data.name.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      // Serialize concurrent submissions for the SAME seat so two first-submits
      // can't both create a canonical official (advisory lock auto-releases at tx end).
      const seatLockKey = `${role}:${seat.column}:${seat.value}`;
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext($1)::bigint)", seatLockKey);

      const canonical = await this.findCanonicalPosition(tx, role, seat.column, seat.value);

      // Branch 1: empty seat → create canonical official + position + proposal.
      if (!canonical) {
        // A confirmed (approved) official may already hold this seat. Do NOT mint
        // a duplicate — route the submission to a name-change correction instead.
        const resolved = await tx.officialPosition.findFirst({
          where: { role, [seat.column]: seat.value, reviewStatus: "reviewed" },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true, officialId: true },
        });
        if (resolved) {
          const changeProposal = await tx.dataProposal.create({
            data: {
              officialId: resolved.officialId,
              positionId: resolved.id,
              proposerPhone: data.proposerPhone,
              proposerIp: data.proposerIp ?? null,
              trust: data.trust,
              targetField: "name",
              proposedValue: { value: data.name.trim() }, // change shape (no type:"identify")
              sourceUrl: data.sourceUrl || null,
              status: "submitted",
            },
          });
          return {
            officialId: resolved.officialId,
            positionId: resolved.id,
            proposalId: changeProposal.id,
            outcome: "change_proposed" as const,
          };
        }

        const slug = await this.generateUniqueOfficialSlug(tx, data.name.trim(), positionScope.stateCode || data.stateCode);
        const official = await tx.nigerianOfficial.create({
          // completenessScore stays NULL ("not yet computed") — a stored 0 is an
        // impossible value the profile endpoint would display verbatim.
        data: { name: data.name.trim(), slug, imageUrl: imageInfo.officialImageUrl, ...officialProfile },
        });
        const position = await tx.officialPosition.create({
          data: {
            officialId: official.id, role, partyAcronym: data.partyAcronym || null,
            startDate: new Date("2023-05-29"), sourceType: "manual", sourceUrl: data.sourceUrl || null,
            confidence: "low", reviewStatus: "unreviewed", ...positionScope,
          },
        });
        const proposal = await tx.dataProposal.create({
          data: {
            officialId: official.id, positionId: position.id, proposerPhone: data.proposerPhone,
            proposerIp: data.proposerIp ?? null, trust: data.trust, targetField: "name",
            proposedValue: identifyProposalValue, sourceUrl: data.sourceUrl || null, status: "submitted",
          },
        });
        return { officialId: official.id, positionId: position.id, proposalId: proposal.id, outcome: "created" as const };
      }

      // Canonical exists → never create a new official/position.
      const candidates = await this.findSeatCandidates(tx, canonical.id);
      const match = candidates.find(
        (c: any) => slugifyName(String((c.proposedValue as any)?.name ?? "")) === proposedSlug,
      );

      // Branch 2: matching name → corroborate.
      if (match) {
        const conf = await this.corroborate(tx, match.id, data.proposerPhone, data.proposerIp ?? null);
        return {
          officialId: canonical.officialId, positionId: canonical.id, proposalId: match.id,
          outcome: "corroborated" as const, upvoteCount: conf.upvoteCount, voteScore: conf.voteScore, alreadyConfirmed: conf.alreadyConfirmed,
        };
      }

      // Branch 3: new name → competing candidate on the SAME position/official.
      const competing = await tx.dataProposal.create({
        data: {
          officialId: canonical.officialId, positionId: canonical.id, proposerPhone: data.proposerPhone,
          proposerIp: data.proposerIp ?? null, trust: data.trust, targetField: "name",
          proposedValue: identifyProposalValue, sourceUrl: data.sourceUrl || null, status: "submitted",
        },
      });
      return { officialId: canonical.officialId, positionId: canonical.id, proposalId: competing.id, outcome: "competing" as const };
    });

    // A submission-time create mints an official with a NULL score; compute the
    // real value now (post-commit) so the profile never shows an impossible 0
    // while the proposal awaits review. Non-fatal, same as the approve path.
    if (result.outcome === "created") {
      await this.officialsService.recomputeCompleteness(result.officialId).catch(() => {});
    }

    const eventType =
      result.outcome === "created" ? "official_identified"
      : result.outcome === "corroborated" ? "official_corroborated"
      : result.outcome === "change_proposed" ? "official_change_proposed"
      : "official_candidate_added";
    await this.prisma.activityLog.create({
      data: {
        eventType, targetType: "official", targetId: result.officialId,
        metadata: {
          proposalId: result.proposalId, positionId: result.positionId, outcome: result.outcome,
          name: data.name.trim(), role, partyAcronym: data.partyAcronym || null, ...officialProfile, ...positionScope,
        },
      },
    });

    if (result.outcome !== "corroborated") {
      this.notifier
        .notifyNewProposal({
          proposalId: result.proposalId, officialName: data.name.trim(),
          targetField: result.outcome === "competing" ? "identify_candidate" : "identify",
          proposedValue: identifyProposalValue.displayValue, voteScore: 0,
        })
        .catch(() => {});
    }

    return {
      id: result.proposalId, officialId: result.officialId, positionId: result.positionId,
      status: "submitted", trust: data.trust, outcome: result.outcome,
      ...(result.outcome === "corroborated"
        ? { upvoteCount: result.upvoteCount, voteScore: result.voteScore, alreadyConfirmed: result.alreadyConfirmed }
        : {}),
    };
  }

  /** Seat scope column + value for a (role, scope) pair. Design-locked mapping. */
  private seatKey(
    role: string,
    scope: { wardCode?: string; lgaCode?: string; constituencyCode?: string; stateCode?: string },
  ): { column: "wardCode" | "lgaCode" | "constituencyCode" | "stateCode"; value: string } {
    if (role === "councilor") return { column: "wardCode", value: scope.wardCode! };
    if (role === "lga_chairman") return { column: "lgaCode", value: scope.lgaCode! };
    if (role === "mha" || role === "representative" || role === "senator")
      return { column: "constituencyCode", value: scope.constituencyCode! };
    if (role === "governor") return { column: "stateCode", value: scope.stateCode! };
    throw new BadRequestException(`Unsupported role for seat key: ${role}`);
  }

  /** Canonical position for a seat = earliest-created unresolved OfficialPosition at (role, scope). */
  private async findCanonicalPosition(
    tx: any, role: string, column: string, value: string,
  ): Promise<{ id: string; officialId: string } | null> {
    return tx.officialPosition.findFirst({
      where: { role, [column]: value, reviewStatus: "unreviewed" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, officialId: true },
    });
  }

  /** Existing identify name-candidates on a canonical position, best score first. */
  private async findSeatCandidates(tx: any, positionId: string) {
    return tx.dataProposal.findMany({
      where: { positionId, targetField: "name", status: { in: ["submitted", "under_review", "needs_evidence"] } },
      orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
      select: { id: true, proposerPhone: true, proposerIp: true, proposedValue: true },
    });
  }

  /** Record a corroboration (confirm) on an existing candidate. Verified→phone, anon→IP. Idempotent per voter. */
  private async corroborate(
    tx: any, proposalId: string, voterPhone: string | null, voterIp: string | null,
  ): Promise<{ upvoteCount: number; voteScore: number; alreadyConfirmed: boolean }> {
    // Neither a phone nor an IP → no stable voter key; skip the vote rather than
    // issue an invalid null-keyed findUnique that would crash.
    if (!voterPhone && !voterIp) {
      const p = await tx.dataProposal.findUnique({ where: { id: proposalId }, select: { upvoteCount: true, voteScore: true } });
      return { upvoteCount: p!.upvoteCount, voteScore: p!.voteScore, alreadyConfirmed: true };
    }
    const where = voterPhone
      ? { proposalId_voterPhone: { proposalId, voterPhone } }
      : { proposalId_voterIp: { proposalId, voterIp: voterIp! } };
    // Pre-read decides whether this is a fresh confirm (increment) or a repeat (no-op).
    const existing = await tx.proposalVote.findUnique({ where });
    // Idempotent upsert: a concurrent duplicate insert becomes a no-op update instead
    // of throwing P2002, so no unique violation ever aborts the enclosing transaction.
    await tx.proposalVote.upsert({
      where,
      create: { proposalId, voterPhone, voterIp, direction: 1 },
      update: {},
    });
    if (existing) {
      const p = await tx.dataProposal.findUnique({ where: { id: proposalId }, select: { upvoteCount: true, voteScore: true } });
      return { upvoteCount: p!.upvoteCount, voteScore: p!.voteScore, alreadyConfirmed: true };
    }
    const updated = await tx.dataProposal.update({
      where: { id: proposalId },
      data: { voteScore: { increment: 1 }, upvoteCount: { increment: 1 } },
      select: { upvoteCount: true, voteScore: true },
    });
    return { upvoteCount: updated.upvoteCount, voteScore: updated.voteScore, alreadyConfirmed: false };
  }

  private normalizeIdentifyImage(imageUrl?: string) {
    const trimmed = imageUrl?.trim();
    if (!trimmed) {
      return { officialImageUrl: null as string | null, proposalImageUrl: null as string | null };
    }

    // The official table only accepts URLs up to 500 chars.
    // Keep uploaded data URLs in proposal metadata for moderation instead of failing the transaction.
    if (trimmed.startsWith("data:")) {
      return { officialImageUrl: null as string | null, proposalImageUrl: trimmed };
    }

    if (trimmed.length > 500) {
      throw new BadRequestException("imageUrl is too long");
    }

    return { officialImageUrl: trimmed, proposalImageUrl: trimmed };
  }

  /**
   * Generate a unique, SEO-friendly slug for a new official. Prefetches existing
   * slugs sharing the same base and disambiguates with the state code, then a
   * numeric suffix. The DB unique index on `slug` is the final backstop.
   */
  private async generateUniqueOfficialSlug(
    tx: { nigerianOfficial: { findMany: (args: any) => Promise<{ slug: string | null }[]> } },
    name: string,
    stateCode?: string,
    excludeOfficialId?: string,
  ): Promise<string> {
    let base = slugifyName(name);
    if (!base) base = `official-${randomBytes(4).toString("hex")}`;

    const rows = await tx.nigerianOfficial.findMany({
      // Exclude the official being renamed so its current slug doesn't count as
      // "used" against itself (otherwise a light edit would needlessly get a -2).
      where: {
        OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }],
        ...(excludeOfficialId ? { id: { not: excludeOfficialId } } : {}),
      },
      select: { slug: true },
    });
    const used = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s));

    if (!used.has(base)) return base;

    const stateSuffix = stateCode ? slugifyName(stateCode) : "";
    if (stateSuffix && !used.has(`${base}-${stateSuffix}`)) return `${base}-${stateSuffix}`;

    let n = 2;
    while (used.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  /**
   * Regenerate an official's canonical slug from a corrected name and preserve the
   * old slug as a redirectable alias so /officials/<old-slug> keeps working. Must
   * run inside the caller's transaction so name + slug + alias commit atomically.
   * No-op when the new name maps to the same slug. Returns the new slug, or null
   * when unchanged.
   */
  private async reslugOfficial(
    tx: any,
    officialId: string,
    oldSlug: string | null,
    newName: string,
    stateCode?: string,
  ): Promise<string | null> {
    const newSlug = await this.generateUniqueOfficialSlug(tx, newName, stateCode, officialId);
    if (oldSlug && newSlug === oldSlug) return null;

    // The new canonical slug must never also live in the alias table (a slug is
    // either a live official or an alias, never both) — drop any stale alias.
    await tx.officialSlugAlias.deleteMany({ where: { slug: newSlug } });
    await tx.nigerianOfficial.update({ where: { id: officialId }, data: { slug: newSlug } });

    // Record the previous slug so old links redirect. Idempotent + re-points an
    // existing alias if this official is renamed more than once.
    if (oldSlug && oldSlug !== newSlug) {
      await tx.officialSlugAlias.upsert({
        where: { slug: oldSlug },
        update: { officialId },
        create: { slug: oldSlug, officialId },
      });
    }
    return newSlug;
  }

  /** Primary position state code for an official (slug collision suffix). */
  private async officialStateCode(tx: any, officialId: string): Promise<string | undefined> {
    const pos = await tx.officialPosition.findFirst({
      where: { officialId, stateCode: { not: null } },
      select: { stateCode: true },
    });
    return pos?.stateCode ?? undefined;
  }

  /**
   * Apply a name change that represents a *succession* — the incumbent's tenure
   * ended and someone new now holds the seat. We must NOT rename the existing
   * official (that would reattribute their whole record). Instead we:
   *   1. mark the incumbent's seat position `ended` (term_end),
   *   2. mint a NEW official (fresh slug) copying the seat's scope,
   * leaving the old official + slug + history intact so old URLs keep resolving.
   */
  private async applySuccession(
    proposal: { id: string; officialId: string; positionId: string | null; sourceUrl: string | null },
    newName: string,
    adminId: string,
    // When the new official's term actually began (e.g. the election year). The old
    // holder's tenure ends on this same date. Falls back to today when unknown.
    effectiveDate: Date | null,
  ): Promise<string> {
    const effective = effectiveDate ?? new Date();
    return this.prisma.$transaction(async (tx) => {
      // The incumbent seat: the proposal's position if set, else the official's
      // current active position. This is the seat the newcomer inherits.
      const incumbent = proposal.positionId
        ? await tx.officialPosition.findUnique({ where: { id: proposal.positionId } })
        : await tx.officialPosition.findFirst({
            where: { officialId: proposal.officialId, status: "active" },
            orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
          });
      if (!incumbent) {
        throw new BadRequestException("Cannot process succession: no active position for this official");
      }

      // 1. End the incumbent's tenure ON the successor's start date — drops them out
      //    of every "current" view but keeps the row as history tied to the person.
      await tx.officialPosition.update({
        where: { id: incumbent.id },
        data: { status: "ended", endDate: effective, endReason: "term_end" },
      });

      // 2. New person, new official row + a fresh active position on the same seat,
      //    starting on the real tenure date (not "today").
      const oldOfficial = await tx.nigerianOfficial.findUnique({
        where: { id: proposal.officialId },
        select: { officialType: true },
      });
      const slug = await this.generateUniqueOfficialSlug(tx, newName, incumbent.stateCode ?? undefined);
      const newOfficial = await tx.nigerianOfficial.create({
        data: { name: newName, slug, officialType: oldOfficial?.officialType ?? null },
      });
      const newPosition = await tx.officialPosition.create({
        data: {
          officialId: newOfficial.id,
          role: incumbent.role,
          appointmentType: incumbent.appointmentType,
          stateCode: incumbent.stateCode,
          constituencyCode: incumbent.constituencyCode,
          lgaCode: incumbent.lgaCode,
          wardCode: incumbent.wardCode,
          partyAcronym: null,
          startDate: effective,
          sourceType: "manual",
          sourceUrl: proposal.sourceUrl ?? null,
          confidence: "low",
          reviewStatus: "unreviewed",
        },
      });

      await tx.activityLog.create({
        data: {
          eventType: "proposal_succession",
          targetType: "official",
          targetId: newOfficial.id,
          metadata: {
            proposalId: proposal.id,
            predecessorOfficialId: proposal.officialId,
            endedPositionId: incumbent.id,
            newPositionId: newPosition.id,
            newName,
            effectiveDate: effective.toISOString().slice(0, 10),
          },
        },
      });

      return newOfficial.id;
    });
  }

  /**
   * Apply a party change that is a real *defection* (not a data correction). We keep
   * the affiliation timeline instead of silently overwriting the seat's party:
   *   1. close any open affiliation (endDate = effective date),
   *   2. backfill a closed affiliation for the party the seat currently shows, if it
   *      differs and no affiliation row exists (so the "left" party is visible),
   *   3. add a new open affiliation for the new party (startDate = effective date),
   *   4. update the position's current party so "current" views stay correct.
   */
  private async applyPartyChange(
    proposal: { id: string; officialId: string; positionId: string | null; sourceUrl: string | null },
    newParty: string,
    adminId: string,
    effectiveDate: Date | null,
  ): Promise<void> {
    const effective = effectiveDate ?? new Date();
    await this.prisma.$transaction(async (tx) => {
      const position = proposal.positionId
        ? await tx.officialPosition.findUnique({
            where: { id: proposal.positionId },
            select: { id: true, partyAcronym: true },
          })
        : null;
      const oldParty = position?.partyAcronym ?? null;

      // No-op guard: same party → nothing to record.
      if (oldParty && oldParty === newParty) {
        await tx.officialPosition.update({ where: { id: position!.id }, data: { partyAcronym: newParty } });
        return;
      }

      // 1. Close any still-open affiliation as of the defection date.
      await tx.officialPartyAffiliation.updateMany({
        where: { officialId: proposal.officialId, endDate: null },
        data: { endDate: effective },
      });

      // 2. If the seat showed a prior party and there's no affiliation row for it,
      //    backfill a closed one so the timeline shows what they left.
      if (oldParty && oldParty !== newParty) {
        const existingOld = await tx.officialPartyAffiliation.findFirst({
          where: { officialId: proposal.officialId, partyAcronym: oldParty },
          select: { id: true },
        });
        if (!existingOld) {
          await tx.officialPartyAffiliation.create({
            data: {
              officialId: proposal.officialId,
              partyAcronym: oldParty,
              startDate: null,
              endDate: effective,
              reason: "Party held before recorded defection",
              sourceType: "manual",
              reviewStatus: "reviewed",
              reviewedBy: adminId,
            },
          });
        }
      }

      // 3. New open affiliation for the party they defected to.
      await tx.officialPartyAffiliation.create({
        data: {
          officialId: proposal.officialId,
          partyAcronym: newParty,
          startDate: effective,
          endDate: null,
          reason: "Party change (citizen proposal)",
          sourceType: "manual",
          reviewStatus: "reviewed",
          reviewedBy: adminId,
        },
      });

      // 4. Keep the seat's current party correct for "current" views.
      if (position) {
        await tx.officialPosition.update({ where: { id: position.id }, data: { partyAcronym: newParty } });
      }

      await tx.activityLog.create({
        data: {
          eventType: "proposal_party_defection",
          targetType: "official",
          targetId: proposal.officialId,
          metadata: {
            proposalId: proposal.id,
            fromParty: oldParty,
            toParty: newParty,
            effectiveDate: effective.toISOString().slice(0, 10),
          },
        },
      });
    });
  }

  /** Resolve a human place string ("Pategi, Kwara") from scope codes. */
  private async resolveGeoName(scope: {
    wardCode?: string; lgaCode?: string; constituencyCode?: string; stateCode?: string;
  }): Promise<string> {
    const level = scope.constituencyCode ? "constituency" : scope.wardCode ? "ward" : "lga";
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT c.name AS constituency_name, w.name AS ward_name,
              COALESCE(l.name, wl.name) AS lga_name, s.name AS state_name
       FROM (SELECT 1) _
       LEFT JOIN nigerian_lgas l ON l.code = $1
       LEFT JOIN nigerian_constituencies c ON c.code = $2
       LEFT JOIN nigerian_wards w ON w.code = $3
       LEFT JOIN nigerian_lgas wl ON wl.code = w.lga_code
       LEFT JOIN nigerian_states s ON s.code = COALESCE($4, l.state_code, c.state_code, wl.state_code)`,
      scope.lgaCode ?? null, scope.constituencyCode ?? null, scope.wardCode ?? null, scope.stateCode ?? null,
    );
    const r = rows[0] ?? {};
    return composeGeo({
      level, constituencyName: r.constituency_name ?? undefined, wardName: r.ward_name ?? undefined,
      lgaName: r.lga_name ?? undefined, stateName: r.state_name ?? undefined,
    });
  }

  private buildIdentifyProposalValue(data: {
    name: string;
    role: string;
    partyAcronym: string | null;
    imageUrl: string | null;
    email: string | null;
    phoneNumber: string | null;
    officeAddress: string | null;
    twitterHandle: string | null;
    facebookUrl: string | null;
    gender: string | null;
    education: string | null;
    biography: string | null;
    dateOfBirth: Date | null;
    sourceUrl: string | null;
    positionScope: Record<string, string>;
    geoName: string;
  }) {
    return {
      value: data.name,
      type: "identify",
      displayValue: buildIdentifyDisplayValue({
        name: data.name, party: data.partyAcronym, role: data.role, geoName: data.geoName,
      }),
      name: data.name,
      role: data.role,
      partyAcronym: data.partyAcronym,
      imageUrl: data.imageUrl,
      email: data.email,
      phoneNumber: data.phoneNumber,
      officeAddress: data.officeAddress,
      twitterHandle: data.twitterHandle,
      facebookUrl: data.facebookUrl,
      gender: data.gender,
      education: data.education,
      biography: data.biography,
      dateOfBirth: data.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      sourceUrl: data.sourceUrl,
      ...data.positionScope,
    };
  }

  private normalizeIdentifyProfile(data: {
    email?: string;
    phoneNumber?: string;
    officeAddress?: string;
    twitterHandle?: string;
    facebookUrl?: string;
    gender?: string;
    education?: string;
    biography?: string;
    dateOfBirth?: string;
  }) {
    const dateOfBirth = data.dateOfBirth?.trim()
      ? new Date(data.dateOfBirth)
      : null;

    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException("dateOfBirth is invalid");
    }

    return {
      email: data.email?.trim() || null,
      phoneNumber: data.phoneNumber?.trim() || null,
      officeAddress: data.officeAddress?.trim() || null,
      twitterHandle: data.twitterHandle?.trim() || null,
      facebookUrl: data.facebookUrl?.trim() || null,
      gender: data.gender?.trim() || null,
      education: data.education?.trim() || null,
      biography: data.biography?.trim() || null,
      dateOfBirth,
    };
  }

  async vote(proposalId: string, voterPhone: string, direction: number) {
    if (direction !== 1 && direction !== -1) {
      throw new BadRequestException("direction must be 1 (up) or -1 (down)");
    }

    const proposal = await this.prisma.dataProposal.findUnique({
      where: { id: proposalId },
      include: { official: { select: { id: true, name: true } } },
    });
    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }
    if (proposal.status === "approved" || proposal.status === "rejected") {
      throw new BadRequestException("Cannot vote on a resolved proposal");
    }

    // Prevent voting on own proposal
    if (proposal.proposerPhone === voterPhone) {
      throw new BadRequestException("Cannot vote on your own proposal");
    }

    // Rate limit check
    await this.checkVoteRateLimit(voterPhone);

    // Upsert vote (allows changing direction)
    const existingVote = await this.prisma.proposalVote.findUnique({
      where: { proposalId_voterPhone: { proposalId, voterPhone } },
    });

    if (existingVote) {
      if (existingVote.direction === direction) {
        throw new BadRequestException("Already voted in this direction");
      }
      await this.prisma.proposalVote.update({
        where: { id: existingVote.id },
        data: { direction },
      });
      // Swap: decrement old counter, increment new counter
      const oldCounter = existingVote.direction === 1 ? "upvoteCount" : "downvoteCount";
      const newCounter = direction === 1 ? "upvoteCount" : "downvoteCount";
      await this.prisma.dataProposal.update({
        where: { id: proposalId },
        data: {
          voteScore: { increment: direction * 2 },
          [oldCounter]: { decrement: 1 },
          [newCounter]: { increment: 1 },
        },
      });
    } else {
      await this.prisma.proposalVote.create({
        data: { proposalId, voterPhone, direction },
      });
      const counter = direction === 1 ? "upvoteCount" : "downvoteCount";
      await this.prisma.dataProposal.update({
        where: { id: proposalId },
        data: {
          voteScore: { increment: direction },
          [counter]: { increment: 1 },
        },
      });
    }

    const updated = await this.prisma.dataProposal.findUnique({
      where: { id: proposalId },
      select: { voteScore: true, upvoteCount: true, downvoteCount: true },
    });

    // Log vote activity
    try {
      await this.prisma.activityLog.create({
        data: {
          eventType: direction === 1 ? "proposal_upvoted" : "proposal_downvoted",
          targetType: "official",
          targetId: proposal.officialId,
          metadata: {
            proposalId,
            targetField: proposal.targetField,
            officialName: proposal.official.name,
          },
        },
      });
    } catch (err) {
      console.error("Failed to log vote activity:", err);
    }

    return {
      voteScore: updated?.voteScore ?? 0,
      upvoteCount: updated?.upvoteCount ?? 0,
      downvoteCount: updated?.downvoteCount ?? 0,
    };
  }

  async listByOfficial(officialId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [proposals, total] = await Promise.all([
      this.prisma.dataProposal.findMany({
        where: { officialId, status: { in: ["submitted", "under_review"] } },
        orderBy: { voteScore: "desc" },
        skip,
        take: limit,
        include: { _count: { select: { votes: true } } },
      }),
      this.prisma.dataProposal.count({
        where: { officialId, status: { in: ["submitted", "under_review"] } },
      }),
    ]);

    return {
      data: proposals.map((p) => ({
        id: p.id,
        targetField: p.targetField,
        proposedValue: p.proposedValue,
        sourceUrl: p.sourceUrl,
        status: p.status,
        voteScore: p.voteScore,
        upvoteCount: p.upvoteCount,
        downvoteCount: p.downvoteCount,
        voteCount: p._count.votes,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const proposal = await this.prisma.dataProposal.findUnique({
      where: { id },
      include: {
        official: { select: { id: true, name: true } },
        position: {
          select: { id: true, role: true, stateCode: true, lgaCode: true, wardCode: true },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    return {
      id: proposal.id,
      officialId: proposal.officialId,
      officialName: proposal.official.name,
      positionId: proposal.positionId,
      position: proposal.position,
      targetField: proposal.targetField,
      proposedValue: proposal.proposedValue,
      sourceUrl: proposal.sourceUrl,
      status: proposal.status,
      voteScore: proposal.voteScore,
      upvoteCount: proposal.upvoteCount,
      downvoteCount: proposal.downvoteCount,
      voteCount: proposal._count.votes,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
    };
  }

  /**
   * Public seat read for the verification UI. Returns the canonical official (if
   * any) for a (role, scope) seat and its identify name-candidates ranked by
   * voteScore, each with its confirm count.
   */
  async getSeatCandidates(params: {
    role: string;
    wardCode?: string;
    lgaCode?: string;
    constituencyCode?: string;
    stateCode?: string;
  }) {
    const role = params.role === "rep" ? "representative" : params.role;
    const validRoles = ["councilor", "lga_chairman", "mha", "representative", "senator", "governor"];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${params.role}`);
    }
    const seat = this.seatKey(role, params);
    if (!seat.value) {
      throw new BadRequestException(`Missing scope code for role ${role}`);
    }

    const canonical = await this.prisma.officialPosition.findFirst({
      where: { role, [seat.column]: seat.value, reviewStatus: "unreviewed" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        officialId: true,
        partyAcronym: true,
        official: { select: { id: true, name: true, slug: true, imageUrl: true } },
      },
    });

    if (!canonical) {
      return { seat: { role, column: seat.column, code: seat.value }, hasCanonical: false, candidates: [] };
    }

    const candidates = await this.prisma.dataProposal.findMany({
      where: {
        positionId: canonical.id,
        targetField: "name",
        status: { in: ["submitted", "under_review", "needs_evidence"] },
      },
      // Rank by votes; newest breaks ties (recent -> oldest).
      orderBy: [{ voteScore: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, proposedValue: true, sourceUrl: true, voteScore: true,
        upvoteCount: true, createdAt: true, _count: { select: { votes: true } },
      },
    });

    return {
      seat: { role, column: seat.column, code: seat.value },
      hasCanonical: true,
      official: {
        id: canonical.official.id, name: canonical.official.name,
        slug: canonical.official.slug, imageUrl: canonical.official.imageUrl,
      },
      positionId: canonical.id,
      candidates: candidates.map((c) => ({
        id: c.id,
        name: String((c.proposedValue as any)?.name ?? (c.proposedValue as any)?.value ?? ""),
        partyAcronym: (c.proposedValue as any)?.partyAcronym ?? null,
        sourceUrl: c.sourceUrl,
        voteScore: c.voteScore,
        confirmCount: c.upvoteCount,
        voteCount: c._count.votes,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  // Admin methods
  /** Overview stats for the admin home: total proposals + the submitted review queue. */
  async stats() {
    const [total, pending] = await Promise.all([
      this.prisma.dataProposal.count(),
      this.prisma.dataProposal.count({ where: { status: "submitted" } }),
    ]);
    return { total, pending };
  }

  async listPending(params: { status?: string; page?: number; limit?: number }) {
    const { status = "submitted", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      this.prisma.dataProposal.findMany({
        where: { status },
        // LIFO admin queue: newest submissions first (recent -> oldest).
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        include: {
          official: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              email: true,
              phoneNumber: true,
              officeAddress: true,
              twitterHandle: true,
              facebookUrl: true,
              dateOfBirth: true,
              gender: true,
              education: true,
              biography: true,
            },
          },
          position: {
            select: { partyAcronym: true, wardCode: true, lgaCode: true },
          },
          _count: { select: { votes: true } },
        },
      }),
      this.prisma.dataProposal.count({ where: { status } }),
    ]);

    return {
      data: proposals.map((p) => {
        // Surface the live value this proposal would overwrite, so admins can
        // review a correction without guessing. Relational fields live on the
        // position; everything else on the official.
        const source: Record<string, unknown> =
          RELATIONAL_FIELDS.has(p.targetField) && p.position
            ? (p.position as Record<string, unknown>)
            : (p.official as Record<string, unknown>);
        const currentRaw = source[p.targetField];
        const currentValue =
          currentRaw instanceof Date ? currentRaw.toISOString() : (currentRaw ?? null);

        return {
          id: p.id,
          officialId: p.officialId,
          officialName: p.official.name,
          targetField: p.targetField,
          currentValue,
          proposedValue: p.proposedValue,
          sourceUrl: p.sourceUrl,
          proposerPhone: maskPhone(p.proposerPhone),
          trust: p.trust,
          status: p.status,
          voteScore: p.voteScore,
          upvoteCount: p.upvoteCount,
          downvoteCount: p.downvoteCount,
          voteCount: p._count.votes,
          createdAt: p.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
    };
  }

  /**
   * Admin grouped queue for identify candidates. Groups pending identify name
   * proposals by positionId (= seat), each group ranked by voteScore with the
   * seat's canonical official + scope labels. The flat listPending stays for
   * field-change proposals.
   */
  async listPendingIdentifyGrouped(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const pending = await this.prisma.dataProposal.findMany({
      where: {
        targetField: "name",
        status: { in: ["submitted", "under_review", "needs_evidence"] },
        positionId: { not: null },
        proposedValue: { path: ["type"], equals: "identify" },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true, positionId: true, officialId: true, proposedValue: true, sourceUrl: true,
        trust: true, proposerPhone: true, status: true, voteScore: true, upvoteCount: true,
        downvoteCount: true, createdAt: true,
        position: { select: { id: true, role: true, stateCode: true, lgaCode: true, wardCode: true, constituencyCode: true } },
        official: { select: { id: true, name: true } },
        _count: { select: { votes: true } },
      },
    });

    const groups = new Map<string, any>();
    for (const p of pending) {
      const key = p.positionId!;
      if (!groups.has(key)) {
        groups.set(key, {
          positionId: key,
          officialId: p.officialId,
          seat: {
            role: p.position?.role ?? null,
            stateCode: p.position?.stateCode ?? null,
            lgaCode: p.position?.lgaCode ?? null,
            wardCode: p.position?.wardCode ?? null,
            constituencyCode: p.position?.constituencyCode ?? null,
          },
          candidates: [] as any[],
        });
      }
      groups.get(key).candidates.push({
        id: p.id,
        name: String((p.proposedValue as any)?.name ?? (p.proposedValue as any)?.value ?? ""),
        partyAcronym: (p.proposedValue as any)?.partyAcronym ?? null,
        proposedValue: p.proposedValue,
        sourceUrl: p.sourceUrl,
        trust: p.trust,
        proposerPhone: maskPhone(p.proposerPhone),
        status: p.status,
        voteScore: p.voteScore,
        confirmCount: p.upvoteCount,
        disputeCount: p.downvoteCount,
        voteCount: p._count.votes,
        createdAt: p.createdAt.toISOString(),
      });
    }

    const all = Array.from(groups.values()).map((g) => {
      g.candidates.sort((a: any, b: any) => b.voteScore - a.voteScore || b.createdAt.localeCompare(a.createdAt));
      g.topVoteScore = g.candidates[0]?.voteScore ?? 0;
      return g;
    });
    all.sort((a, b) => b.topVoteScore - a.topVoteScore);

    const total = all.length;
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total, page, limit };
  }

  async approve(
    proposalId: string,
    adminId: string,
    // Admin can override the submitter's stated intent + effective date at review
    // time — the authoritative gate for correction vs succession (name) and
    // correction vs defection (party).
    overrides?: {
      nameChangeKind?: "correction" | "succession";
      partyChangeKind?: "correction" | "defection";
      effectiveDate?: string;
    },
  ) {
    const proposal = await this.prisma.dataProposal.findUnique({
      where: { id: proposalId },
      include: { official: true },
    });

    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }
    if (!proposal.official) {
      throw new BadRequestException("Official no longer exists");
    }
    if (proposal.status === "approved" || proposal.status === "rejected") {
      throw new BadRequestException("Proposal already resolved");
    }

    // Structured citizen contributions (add:/edit:, Plan 55) apply through the
    // creatable-registry path — never the scalar column update below.
    if (isStructuredTargetField(proposal.targetField)) {
      return this.approveStructured(proposal as any, adminId);
    }

    let value = (proposal.proposedValue as any)?.value;

    // If approving a photo (data URL or remote URL), normalize it into our own
    // storage (resized webp on S3/CDN) rather than persisting a foreign URL.
    if (
      proposal.targetField === "imageUrl" &&
      typeof value === "string" &&
      (value.startsWith("data:") || /^https?:\/\//i.test(value)) &&
      !this.imageStorage.isStoredUrl(value)
    ) {
      value = (await this.imageStorage.storeOfficialImage(value, proposal.officialId)).url;
    }

    // A name proposal is either an "identify" (fills an empty seat — handled below
    // as a no-op here since the official was created with the right name) or a
    // change to an already-named official. A change carries an explicit intent:
    //   correction → same person, wrong/misspelled name
    //   succession → the previous holder's tenure ended and a NEW person holds it
    const pvRaw = proposal.proposedValue as any;
    const isIdentifyName = proposal.targetField === "name" && pvRaw?.type === "identify";
    const isNameChange = proposal.targetField === "name" && !isIdentifyName;
    const storedNameChangeKind: "correction" | "succession" =
      pvRaw?.nameChangeKind === "succession" ? "succession" : "correction";
    const nameChangeKind = overrides?.nameChangeKind ?? storedNameChangeKind;

    const storedPartyChangeKind: "correction" | "defection" =
      pvRaw?.partyChangeKind === "defection" ? "defection" : "correction";
    const partyChangeKind = overrides?.partyChangeKind ?? storedPartyChangeKind;

    // Effective date for a dated event (succession/defection): admin override wins,
    // else the submitter's date, else null → the apply methods use today.
    const effectiveDate =
      parseEffectiveDate(overrides?.effectiveDate) ?? parseEffectiveDate(pvRaw?.effectiveDate);

    // A succession mints a brand-new official whose completeness must also be
    // computed — recomputing only proposal.officialId covers the predecessor.
    let successorOfficialId: string | null = null;

    // Apply the change based on target field
    if (proposal.targetField === "partyAcronym" && proposal.positionId && partyChangeKind === "defection") {
      // Real party change: record it as a dated affiliation event (keep history),
      // don't silently overwrite the party the seat was previously held under.
      await this.applyPartyChange(proposal, String(value), adminId, effectiveDate);
    } else if (RELATIONAL_FIELDS.has(proposal.targetField) && proposal.positionId) {
      // Position-level update (party correction, ward/lga fix)
      await this.prisma.officialPosition.update({
        where: { id: proposal.positionId },
        data: { [proposal.targetField]: value },
      });
    } else if (isNameChange && nameChangeKind === "succession") {
      // Tenure ended: end the incumbent's seat and mint a NEW official + position.
      // The existing official (and its slug + history) is left untouched.
      successorOfficialId = await this.applySuccession(proposal, String(value), adminId, effectiveDate);
    } else if (isNameChange) {
      // Wrong name: rename in place, regenerate the slug from the new name, and
      // preserve the old slug as a redirectable alias — all in one transaction.
      await this.prisma.$transaction(async (tx) => {
        await tx.nigerianOfficial.update({
          where: { id: proposal.officialId },
          data: { name: value },
        });
        const stateCode = await this.officialStateCode(tx, proposal.officialId);
        await this.reslugOfficial(tx, proposal.officialId, proposal.official!.slug, String(value), stateCode);
      });
    } else {
      // Official-level update
      await this.prisma.nigerianOfficial.update({
        where: { id: proposal.officialId },
        data: { [proposal.targetField]: value },
      });
    }

    // For identify proposals, also apply the data-URL image if the official has none
    const proposedValue = proposal.proposedValue as any;
    if (
      proposedValue?.type === "identify" &&
      !proposal.official.imageUrl &&
      typeof proposedValue?.imageUrl === "string" &&
      (proposedValue.imageUrl.startsWith("data:") || /^https?:\/\//i.test(proposedValue.imageUrl)) &&
      !this.imageStorage.isStoredUrl(proposedValue.imageUrl)
    ) {
      const storedUrl = (await this.imageStorage.storeOfficialImage(proposedValue.imageUrl, proposal.officialId)).url;
      await this.prisma.nigerianOfficial.update({
        where: { id: proposal.officialId },
        data: { imageUrl: storedUrl },
      });
    }

    // Mark proposal as approved
    await this.prisma.dataProposal.update({
      where: { id: proposalId },
      data: { status: "approved", reviewedAt: new Date(), reviewedBy: adminId },
    });

    // Seat supersession: approving an identify name-candidate resolves the seat.
    // Reject sibling candidates on the same position so one answer wins.
    const approvedValue = proposal.proposedValue as any;
    if (
      proposal.targetField === "name" &&
      approvedValue?.type === "identify" &&
      proposal.positionId
    ) {
      await this.prisma.dataProposal.updateMany({
        where: {
          positionId: proposal.positionId,
          targetField: "name",
          id: { not: proposalId },
          status: { in: ["submitted", "under_review", "needs_evidence"] },
        },
        data: { status: "rejected", reviewedAt: new Date(), reviewedBy: adminId },
      });
      // Mark the position reviewed so it leaves the canonical/pending pool.
      await this.prisma.officialPosition.update({
        where: { id: proposal.positionId },
        data: { reviewStatus: "reviewed", reviewedBy: adminId, lastVerifiedAt: new Date() },
      });
    }

    // Recompute completeness — the predecessor always, and on succession the
    // newly minted official too (created with a NULL score; without this it
    // would sit un-scored and /api/officials would fall back to the legacy
    // formula for it).
    await this.officialsService.recomputeCompleteness(proposal.officialId);
    if (successorOfficialId) {
      await this.officialsService.recomputeCompleteness(successorOfficialId);
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        eventType: "proposal_approved",
        targetType: "official",
        targetId: proposal.officialId,
        metadata: {
          proposalId,
          targetField: proposal.targetField,
          officialName: proposal.official.name,
        },
      },
    });

    return { status: "approved" };
  }

  /**
   * Approve a structured citizen contribution (Plan 55). One transaction; the
   * data_proposals status write runs FIRST under the default role because
   * enrichment_apply has no grants on data_proposals — only then does the tx
   * drop to the least-privileged role for the live fact write.
   */
  private async approveStructured(
    proposal: {
      id: string;
      officialId: string;
      targetField: string;
      sourceUrl: string | null;
      createdAt: Date;
      proposedValue: any;
      official: { name: string };
    },
    adminId: string,
  ) {
    const parsed = parseStructuredTargetField(proposal.targetField);
    const pv = proposal.proposedValue;
    if (!parsed || pv?.type !== "record") {
      throw new BadRequestException("malformed structured proposal");
    }
    const schema = getRecordSchema(parsed.recordType)!;

    await this.prisma.$transaction(async (tx) => {
      // 1) default role: proposal bookkeeping
      await tx.dataProposal.update({
        where: { id: proposal.id },
        data: { status: "approved", reviewedAt: new Date(), reviewedBy: adminId },
      });
      // 2) least-privileged role for the live write (resets at COMMIT)
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");

      let factId: string;
      let evidenceField: string | null = null;
      if (parsed.op === "add") {
        const created = await this.officialRecords.applyAdd(tx as any, {
          recordType: parsed.recordType,
          officialId: proposal.officialId,
          data: pv.data,
          adminId,
        });
        factId = created.factId;
      } else {
        await this.officialRecords.applyEdit(tx as any, {
          recordType: parsed.recordType,
          officialId: proposal.officialId,
          targetPk: pv.targetPk,
          field: pv.field,
          value: pv.value,
          adminId,
        });
        factId = pv.targetPk;
        evidenceField = pv.field;
      }

      if (proposal.sourceUrl) {
        const entity = getCreatableEntity(schema.table)!;
        await this.officialRecords.insertCitizenEvidence(tx as any, {
          entryType: entity.evidenceEntryType,
          entryId: factId,
          field: evidenceField,
          url: proposal.sourceUrl,
          retrievedAt: proposal.createdAt,
        });
      }

      await tx.activityLog.create({
        data: {
          eventType: "proposal_approved",
          targetType: "official",
          targetId: proposal.officialId,
          metadata: {
            proposalId: proposal.id,
            targetField: proposal.targetField,
            recordType: parsed.recordType,
            factId,
            officialName: proposal.official.name,
          },
        },
      });
    });

    // Post-commit, default role — same pattern as the enrichment service.
    await this.officialsService.recomputeCompleteness(proposal.officialId).catch(() => {});
    return { status: "approved" };
  }

  async reject(proposalId: string, adminId: string) {
    const proposal = await this.prisma.dataProposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    await this.prisma.dataProposal.update({
      where: { id: proposalId },
      data: { status: "rejected", reviewedAt: new Date(), reviewedBy: adminId },
    });

    // If this was the last pending identify candidate on a never-approved seat,
    // remove the provisional official/position it created so the seat returns to
    // the unidentified pool and no rejected name lingers publicly.
    const pv = proposal.proposedValue as any;
    if (proposal.targetField === "name" && pv?.type === "identify" && proposal.positionId) {
      const remaining = await this.prisma.dataProposal.count({
        where: {
          positionId: proposal.positionId,
          targetField: "name",
          status: { in: ["submitted", "under_review", "needs_evidence"] },
        },
      });
      if (remaining === 0) {
        const position = await this.prisma.officialPosition.findUnique({
          where: { id: proposal.positionId },
          select: { id: true, officialId: true, reviewStatus: true },
        });
        if (position && position.reviewStatus === "unreviewed") {
          const otherPositions = await this.prisma.officialPosition.count({
            where: { officialId: position.officialId, id: { not: position.id } },
          });
          await this.prisma.$transaction(async (tx) => {
            if (otherPositions === 0) {
              // Provisional official with only this rejected seat → remove entirely.
              await tx.dataProposal.deleteMany({ where: { officialId: position.officialId } });
              await tx.officialPosition.delete({ where: { id: position.id } });
              await tx.nigerianOfficial.delete({ where: { id: position.officialId } });
            } else {
              // Official holds other seats → free only this seat.
              await tx.dataProposal.deleteMany({ where: { positionId: position.id } });
              await tx.officialPosition.delete({ where: { id: position.id } });
            }
          });
        }
      }
    }

    return { status: "rejected" };
  }

  /**
   * Citizen structured contribution — batch ADD (Plan 55). One batch = one
   * rate-limit unit; the whole batch inserts atomically or not at all.
   */
  async createRecordBatch(args: {
    officialId: string;
    records: { recordType: string; data: unknown; sourceUrl?: string }[];
    proposerPhone: string | null;
    proposerIp: string | null;
    trust: "verified" | "anonymous";
  }) {
    if (!Array.isArray(args.records) || args.records.length === 0) {
      throw new BadRequestException("records must be a non-empty array");
    }
    if (args.records.length > MAX_RECORDS_PER_BATCH) {
      throw new BadRequestException("at most 15 records per submission");
    }
    const prepared = args.records.map((r) => {
      const schema = getRecordSchema(r.recordType);
      if (!schema) throw new BadRequestException(`unknown recordType: ${r.recordType}`);
      const v = validateRecordData(schema, r.data);
      if (!v.ok) throw new BadRequestException(`invalid ${r.recordType}: ${JSON.stringify(v.errors)}`);
      let sourceUrl: string | undefined;
      if (r.sourceUrl) {
        const res = validateSourceUrl(r.sourceUrl);
        if (!res.valid) throw new BadRequestException(`sourceUrl: ${res.reason}`);
        sourceUrl = res.url;
      }
      if (schema.sensitive && !sourceUrl) {
        throw new BadRequestException(`${schema.label} requires a source URL`);
      }
      return { schema, data: v.data, sourceUrl };
    });

    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id: args.officialId },
    });
    if (!official) throw new NotFoundException("Official not found");

    await this.checkStructuredRateLimit(args.trust, args.proposerPhone, args.proposerIp);

    const batchId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await tx.dataProposal.createMany({
        data: prepared.map((p) => ({
          officialId: args.officialId,
          proposerPhone: args.proposerPhone,
          proposerIp: args.proposerIp,
          trust: args.trust,
          targetField: `add:${p.schema.recordType}`,
          proposedValue: {
            type: "record",
            op: "add",
            recordType: p.schema.recordType,
            batchId,
            data: p.data as any,
          },
          sourceUrl: p.sourceUrl ?? null,
          status: "submitted",
        })),
      });
    });

    this.notifier
      .notifyNewProposal({
        proposalId: batchId,
        officialName: official.name,
        targetField: `structured batch (${prepared.length} record${prepared.length > 1 ? "s" : ""})`,
        proposedValue: prepared.map((p) => p.schema.label).join(", "),
        voteScore: 0,
      })
      .catch(() => {});

    return { batchId, count: prepared.length, trust: args.trust };
  }

  /** Citizen structured contribution — correct one field on an existing record (Plan 55). */
  async createRecordEdit(args: {
    officialId: string;
    recordType: string;
    targetPk: string;
    field: string;
    value: unknown;
    sourceUrl?: string;
    proposerPhone: string | null;
    proposerIp: string | null;
    trust: "verified" | "anonymous";
  }) {
    const schema = getRecordSchema(args.recordType);
    if (!schema) throw new BadRequestException(`unknown recordType: ${args.recordType}`);
    const fieldDef = schema.fields.find((f) => f.key === args.field);
    if (!fieldDef?.editable) {
      throw new BadRequestException(`${args.recordType}.${args.field} is not correctable`);
    }
    const v = validateRecordData(schema, { [args.field]: args.value });
    if (v.errors[args.field]) throw new BadRequestException(v.errors[args.field]);
    let sourceUrl: string | undefined;
    if (args.sourceUrl) {
      const res = validateSourceUrl(args.sourceUrl);
      if (!res.valid) throw new BadRequestException(`sourceUrl: ${res.reason}`);
      sourceUrl = res.url;
    }
    if (schema.sensitive && !sourceUrl) {
      throw new BadRequestException(`${schema.label} requires a source URL`);
    }
    if (!UUID_RE_STR.test(args.targetPk)) throw new BadRequestException("invalid record id");

    const official = await this.prisma.nigerianOfficial.findUnique({
      where: { id: args.officialId },
    });
    if (!official) throw new NotFoundException("Official not found");

    // Ownership check + currentValue snapshot in one read. Table/column come
    // from the static registry (never user input), so interpolation is safe.
    const rows = await this.prisma.$queryRawUnsafe<{ current: unknown }[]>(
      `SELECT "${fieldDef.column}" AS current FROM "${schema.table}" WHERE id = $1::uuid AND official_id = $2::uuid`,
      args.targetPk,
      args.officialId,
    );
    if (rows.length === 0) throw new BadRequestException("record not found on this official");

    await this.checkStructuredRateLimit(args.trust, args.proposerPhone, args.proposerIp);

    const batchId = randomUUID();
    const proposal = await this.prisma.dataProposal.create({
      data: {
        officialId: args.officialId,
        proposerPhone: args.proposerPhone,
        proposerIp: args.proposerIp,
        trust: args.trust,
        targetField: `edit:${args.recordType}`,
        proposedValue: {
          type: "record",
          op: "edit",
          recordType: args.recordType,
          batchId,
          targetPk: args.targetPk,
          field: args.field,
          value: (v.data[args.field] ?? null) as any,
          currentValue: (rows[0].current ?? null) as any,
        },
        sourceUrl: sourceUrl ?? null,
        status: "submitted",
      },
    });

    this.notifier
      .notifyNewProposal({
        proposalId: proposal.id,
        officialName: official.name,
        targetField: `edit:${args.recordType}`,
        proposedValue: `${fieldDef.label}: ${String(rows[0].current ?? "—")} → ${String(v.data[args.field])}`,
        voteScore: 0,
      })
      .catch(() => {});

    return { id: proposal.id, status: proposal.status, trust: args.trust };
  }

  async claim(proposalId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    const phone = user?.phoneNumber || `user:${userId}`;

    const proposal = await this.prisma.dataProposal.findUnique({
      where: { id: proposalId },
      select: { id: true, trust: true, proposerPhone: true },
    });
    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }
    // Only an unclaimed anonymous proposal can be claimed — prevents hijacking
    // someone else's verified submission.
    if (proposal.trust !== "anonymous" || proposal.proposerPhone) {
      throw new BadRequestException("Proposal cannot be claimed");
    }

    await this.prisma.dataProposal.update({
      where: { id: proposalId },
      data: { proposerPhone: phone, trust: "verified" },
    });

    return { status: "claimed" };
  }

  async bulkAction(proposalIds: string[], action: "approve" | "reject", adminId: string) {
    // Relational field proposals cannot be bulk-approved
    if (action === "approve") {
      const proposals = await this.prisma.dataProposal.findMany({
        where: { id: { in: proposalIds } },
        select: { id: true, targetField: true },
      });
      const blocked = proposals.filter(
        (p) => RELATIONAL_FIELDS.has(p.targetField) || isStructuredTargetField(p.targetField),
      );
      if (blocked.length > 0) {
        throw new BadRequestException(
          `Relational and structured proposals must be reviewed individually: ${blocked.map((p) => p.id).join(", ")}`,
        );
      }
    }

    const results = [];
    for (const id of proposalIds) {
      try {
        const result = action === "approve" ? await this.approve(id, adminId) : await this.reject(id, adminId);
        results.push({ id, ...result });
      } catch (err: any) {
        results.push({ id, status: "error", error: err.message });
      }
    }

    return { results };
  }

  private async checkProposalRateLimit(phone: string) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.dataProposal.count({
      where: { proposerPhone: phone, createdAt: { gte: dayAgo }, ...NOT_STRUCTURED },
    });
    if (count >= MAX_PROPOSALS_PER_DAY) {
      throw new ForbiddenException("Daily proposal limit reached (50 per day). Try again tomorrow.");
    }
  }

  private async checkAnonymousIpRateLimit(ip?: string | null) {
    // No resolvable IP → fail closed so anonymous floods can't bypass the limit.
    if (!ip) {
      throw new ForbiddenException("Could not verify request origin. Try again later.");
    }
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.dataProposal.count({
      where: { proposerIp: ip, createdAt: { gte: hourAgo }, ...NOT_STRUCTURED },
    });
    if (count >= MAX_ANON_PROPOSALS_PER_HOUR) {
      throw new ForbiddenException("Too many submissions from this network. Try again in an hour.");
    }
  }

  /**
   * Structured contributions: one BATCH (shared batchId) = one limiter unit,
   * so a multi-row education history doesn't burn the whole anon budget.
   * Same windows/ceilings as the scalar limits (anon 30/hour, verified 50/day).
   */
  private async checkStructuredRateLimit(
    trust: "verified" | "anonymous",
    phone: string | null,
    ip: string | null,
  ) {
    if (trust === "anonymous" && !ip) {
      throw new ForbiddenException("Could not verify request origin. Try again later.");
    }
    const windowStart =
      trust === "anonymous"
        ? new Date(Date.now() - 60 * 60 * 1000)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const max = trust === "anonymous" ? MAX_ANON_PROPOSALS_PER_HOUR : MAX_PROPOSALS_PER_DAY;
    const rows = await this.prisma.dataProposal.findMany({
      where: {
        ...(trust === "anonymous" ? { proposerIp: ip } : { proposerPhone: phone }),
        createdAt: { gte: windowStart },
        OR: [{ targetField: { startsWith: "add:" } }, { targetField: { startsWith: "edit:" } }],
      },
      select: { proposedValue: true },
    });
    const batches = new Set(
      rows.map((r) => (r.proposedValue as any)?.batchId).filter(Boolean),
    );
    if (batches.size >= max) {
      throw new ForbiddenException(
        trust === "anonymous"
          ? "Too many submissions from this network. Try again in an hour."
          : "Daily proposal limit reached (30 per day). Try again tomorrow.",
      );
    }
  }

  private async checkVoteRateLimit(phone: string) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.proposalVote.count({
      where: { voterPhone: phone, createdAt: { gte: dayAgo } },
    });
    if (count >= MAX_VOTES_PER_DAY) {
      throw new ForbiddenException("Daily vote limit reached (20 per day). Try again tomorrow.");
    }
  }
}
