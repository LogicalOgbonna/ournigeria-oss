import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, type PrismaService } from "@ournigeria/database";
import type { AuditActor } from "../audit/audit.service";
import type { ImageStorageService } from "../images/image-storage.service";

/**
 * The three things the ticket service and the council service both do, kept in
 * one place so they cannot drift apart: load the parent ticket, stamp the
 * re-review flag, and turn a caller-supplied person into stored columns.
 */

/** Load the parent ticket or 404. Both services key every child write off this. */
export async function mustCampaign(prisma: PrismaService, id: string) {
  const row = await prisma.campaign.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Campaign not found");
  return row;
}

/**
 * The columns that put a ticket back in the review queue. Written by any
 * domain change on a ticket that is not a draft.
 */
export function reviewFlagData(actor: AuditActor) {
  return { reviewStatus: "unreviewed", reviewRequestedAt: new Date(), reviewRequestedBy: actor.actorId ?? null };
}

export interface PersonInput {
  officialId?: string | null;
  name?: string | null;
  imageUrl?: string | null;
}

/**
 * A linked official owns their name — a `name` supplied alongside an
 * `officialId` is deliberately IGNORED here, the official's own name wins
 * (callers that want to reject it instead must check before calling).
 *
 * Any caller-supplied `imageUrl` must already live in our own storage
 * (CDN or S3 bucket, per ImageStorageService.isStoredUrl). Photos are uploaded
 * and re-served by us, never hotlinked from a foreign host — the check runs
 * before the officialId branch so it cannot be skipped by also passing one.
 */
export async function resolvePerson(prisma: PrismaService, images: ImageStorageService, p: PersonInput) {
  if (p.imageUrl && !images.isStoredUrl(p.imageUrl)) {
    throw new BadRequestException("imageUrl must be a stored image URL; upload the photo instead");
  }
  if (p.officialId) {
    const o = await prisma.nigerianOfficial.findUnique({
      where: { id: p.officialId },
      select: { id: true, name: true, imageUrl: true, deletedAt: true },
    });
    if (!o || o.deletedAt) throw new BadRequestException(`officialId: ${p.officialId} does not exist`);
    return { officialId: o.id, name: o.name, imageUrl: p.imageUrl ?? o.imageUrl ?? null };
  }
  return { officialId: null, name: (p.name ?? "").trim(), imageUrl: p.imageUrl ?? null };
}

/** The statuses the public can see — also hard-coded in the partial index uq_campaigns_race_party_faction. */
export const PUBLIC_STATUSES = ["active", "concluded"] as const;

/**
 * Run one write and turn a unique-index violation (P2002) into a 409 with a
 * domain message. The partial indexes are the backstop for every check the
 * services do outside their transaction (race key on approve, active council
 * seat per official); this keeps a lost race from surfacing as a raw 500.
 */
export async function uniqueWrite<T>(write: () => Promise<T>, message: string): Promise<T> {
  try {
    return await write();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictException(message);
    }
    throw err;
  }
}
