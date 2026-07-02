import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService, slugifyName } from "@ournigeria/database";
import { randomBytes } from "crypto";
import { ImageStorageService } from "../images/image-storage.service";
import { OfficialsService } from "../officials/officials.service";
import { ProposalNotifierService } from "./proposal-notifier.service";
import { validateSourceUrl, validateImageUrl, validateFacebookUrl } from "../lib/url-validation";

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

const MAX_PROPOSALS_PER_DAY = 30;
const MAX_ANON_PROPOSALS_PER_HOUR = 5;
const MAX_VOTES_PER_DAY = 20;

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

    const proposal = await this.prisma.dataProposal.create({
      data: {
        officialId: data.officialId,
        positionId: data.positionId ?? null,
        proposerPhone: data.proposerPhone,
        proposerIp: data.proposerIp ?? null,
        trust: data.trust,
        targetField: data.targetField,
        proposedValue: { value: data.proposedValue },
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

    const identifyProposalValue = this.buildIdentifyProposalValue({
      name: data.name.trim(),
      role,
      partyAcronym: data.partyAcronym || null,
      imageUrl: imageInfo.proposalImageUrl,
      ...officialProfile,
      sourceUrl: data.sourceUrl || null,
      positionScope,
    });

    const seat = this.seatKey(role, {
      wardCode: data.wardCode, lgaCode: data.lgaCode,
      constituencyCode: data.constituencyCode, stateCode: data.stateCode,
    });
    const proposedSlug = slugifyName(data.name.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      const canonical = await this.findCanonicalPosition(tx, role, seat.column, seat.value);

      // Branch 1: empty seat → create canonical official + position + proposal.
      if (!canonical) {
        const slug = await this.generateUniqueOfficialSlug(tx, data.name.trim(), positionScope.stateCode || data.stateCode);
        const official = await tx.nigerianOfficial.create({
          data: { name: data.name.trim(), slug, imageUrl: imageInfo.officialImageUrl, ...officialProfile, completenessScore: 0 },
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

    const eventType =
      result.outcome === "created" ? "official_identified"
      : result.outcome === "corroborated" ? "official_corroborated"
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
    const existing = await tx.proposalVote.findUnique({ where });
    if (existing) {
      const p = await tx.dataProposal.findUnique({ where: { id: proposalId }, select: { upvoteCount: true, voteScore: true } });
      return { upvoteCount: p!.upvoteCount, voteScore: p!.voteScore, alreadyConfirmed: true };
    }
    await tx.proposalVote.create({ data: { proposalId, voterPhone, voterIp, direction: 1 } });
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
  ): Promise<string> {
    let base = slugifyName(name);
    if (!base) base = `official-${randomBytes(4).toString("hex")}`;

    const rows = await tx.nigerianOfficial.findMany({
      where: { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
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
  }) {
    const scopeValue =
      data.positionScope.wardCode ??
      data.positionScope.lgaCode ??
      data.positionScope.constituencyCode ??
      data.positionScope.stateCode ??
      null;

    const displayParts = [
      data.name,
      data.partyAcronym ? `(${data.partyAcronym})` : null,
      `for ${data.role.replace(/_/g, " ")}`,
      scopeValue ? `in ${scopeValue}` : null,
    ].filter(Boolean);

    return {
      value: data.name,
      type: "identify",
      displayValue: displayParts.join(" "),
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
      orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
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
  async listPending(params: { status?: string; page?: number; limit?: number }) {
    const { status = "submitted", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [proposals, total] = await Promise.all([
      this.prisma.dataProposal.findMany({
        where: { status },
        orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
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
      orderBy: [{ createdAt: "asc" }],
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
      g.candidates.sort((a: any, b: any) => b.voteScore - a.voteScore || a.createdAt.localeCompare(b.createdAt));
      g.topVoteScore = g.candidates[0]?.voteScore ?? 0;
      return g;
    });
    all.sort((a, b) => b.topVoteScore - a.topVoteScore);

    const total = all.length;
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total, page, limit };
  }

  async approve(proposalId: string, adminId: string) {
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

    // Apply the change based on target field
    if (RELATIONAL_FIELDS.has(proposal.targetField) && proposal.positionId) {
      // Position-level update
      await this.prisma.officialPosition.update({
        where: { id: proposal.positionId },
        data: { [proposal.targetField]: value },
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

    // Recompute completeness
    await this.officialsService.recomputeCompleteness(proposal.officialId);

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

    return { status: "rejected" };
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
      const relational = proposals.filter((p) => RELATIONAL_FIELDS.has(p.targetField));
      if (relational.length > 0) {
        throw new BadRequestException(
          `Cannot bulk-approve relational field proposals: ${relational.map((p) => p.id).join(", ")}`,
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
      where: { proposerPhone: phone, createdAt: { gte: dayAgo } },
    });
    if (count >= MAX_PROPOSALS_PER_DAY) {
      throw new ForbiddenException("Daily proposal limit reached (5 per day). Try again tomorrow.");
    }
  }

  private async checkAnonymousIpRateLimit(ip?: string | null) {
    // No resolvable IP → fail closed so anonymous floods can't bypass the limit.
    if (!ip) {
      throw new ForbiddenException("Could not verify request origin. Try again later.");
    }
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.dataProposal.count({
      where: { proposerIp: ip, createdAt: { gte: hourAgo } },
    });
    if (count >= MAX_ANON_PROPOSALS_PER_HOUR) {
      throw new ForbiddenException("Too many submissions from this network. Try again in an hour.");
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
