import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService, UUID_RE } from "@ournigeria/database";
import { decryptPermissionFor, type Permission } from "@ournigeria/access";
import { AuditCryptoService } from "./audit-crypto.service";

export interface AuditListFilters {
  /** Exact chain position — used by the dashboard's deep-linked event modal. */
  seq?: number;
  actorId?: string;
  actorType?: string;
  /** Prefix match, e.g. "official." matches official.updated etc. */
  action?: string;
  targetType?: string;
  targetId?: string;
  pathway?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditEventView {
  seq: number;
  id: string;
  occurredAt: string;
  epoch: number;
  actorType: string;
  actorId: string | null;
  /** Resolved display name for staff actors (email fallback; null if unresolvable). */
  actorLabel: string | null;
  /** Staff actor's email — shown in the detail modal, not the list. */
  actorEmail: string | null;
  ip: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /**
   * Resolved display name for the target. Citizen `user` targets resolve
   * ONLY for readers holding users.read (same PII gate as diff decryption).
   */
  targetLabel: string | null;
  /** Admin targets' email — modal only. Never populated for citizen users. */
  targetEmail: string | null;
  diff: unknown;
  metadata: unknown;
  hash: string;
}

@Injectable()
export class AuditQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: AuditCryptoService,
  ) {}

  private buildWhere(filters: AuditListFilters): Prisma.AuditEventWhereInput {
    const where: Prisma.AuditEventWhereInput = {};
    if (filters.seq !== undefined) where.seq = BigInt(filters.seq);
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.actorType) where.actorType = filters.actorType;
    if (filters.action) where.action = { startsWith: filters.action };
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.pathway) {
      where.metadata = { path: ["pathway"], equals: filters.pathway };
    }
    if (filters.from || filters.to) {
      where.occurredAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    return where;
  }

  async list(
    filters: AuditListFilters,
    opts: { readerPermissions?: ReadonlySet<Permission> } = {},
  ): Promise<{ data: AuditEventView[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
    const where = this.buildWhere(filters);

    const [rows, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { seq: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    const labels = await this.resolveLabels(rows, opts.readerPermissions);

    const data: AuditEventView[] = [];
    for (const row of rows) {
      // Decryption is gated on the underlying resource permission (spec §4:
      // audit.read alone — e.g. the auditor role — must never expose citizen
      // PII). Unpermitted readers get {__redacted: true} markers, not
      // ciphertext.
      const needed = row.targetType
        ? decryptPermissionFor(row.targetType)
        : null;
      const mayDecrypt =
        needed === null || (opts.readerPermissions?.has(needed) ?? false);
      data.push({
        seq: Number(row.seq),
        id: row.id,
        occurredAt: row.occurredAt.toISOString(),
        epoch: row.epoch,
        actorType: row.actorType,
        actorId: row.actorId,
        actorLabel:
          row.actorType === "staff" && row.actorId
            ? (labels.admins.get(row.actorId)?.name ?? null)
            : null,
        actorEmail:
          row.actorType === "staff" && row.actorId
            ? (labels.admins.get(row.actorId)?.email ?? null)
            : null,
        ip: row.ip,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        targetLabel:
          row.targetType && row.targetId
            ? (labels.targets.get(`${row.targetType}:${row.targetId}`)?.name ??
              null)
            : null,
        targetEmail:
          row.targetType && row.targetId
            ? (labels.targets.get(`${row.targetType}:${row.targetId}`)?.email ??
              null)
            : null,
        diff: mayDecrypt
          ? await this.crypto.decryptDiff(row.diff)
          : this.crypto.redactEncrypted(row.diff),
        metadata: row.metadata,
        hash: row.hash,
      });
    }
    return { data, total, page, limit };
  }

  /**
   * Batch-resolve display labels for a page of events. Staff actors and
   * admin/official targets are not citizen PII — resolvable by any audit
   * reader. Citizen `user` targets resolve only with users.read (spec §4 —
   * otherwise a name next to a user target would leak the PII that diff
   * redaction just withheld). Deleted rows simply stay unresolved.
   */
  private async resolveLabels(
    rows: Array<{
      actorType: string;
      actorId: string | null;
      targetType: string | null;
      targetId: string | null;
    }>,
    readerPermissions?: ReadonlySet<Permission>,
  ): Promise<{
    admins: Map<string, { name: string; email: string }>;
    targets: Map<string, { name: string; email: string | null }>;
  }> {
    const adminIds = new Set<string>();
    const officialIds = new Set<string>();
    const userIds = new Set<string>();
    const mayResolveUsers = readerPermissions?.has("users.read") ?? false;

    for (const row of rows) {
      if (row.actorType === "staff" && row.actorId && UUID_RE.test(row.actorId)) {
        adminIds.add(row.actorId);
      }
      if (!row.targetType || !row.targetId || !UUID_RE.test(row.targetId)) continue;
      if (row.targetType === "admin") adminIds.add(row.targetId);
      else if (row.targetType === "official") officialIds.add(row.targetId);
      else if (row.targetType === "user" && mayResolveUsers) userIds.add(row.targetId);
    }

    const [admins, officials, users] = await Promise.all([
      adminIds.size
        ? this.prisma.adminUser.findMany({
            where: { id: { in: [...adminIds] } },
            select: { id: true, name: true, email: true },
          })
        : [],
      officialIds.size
        ? this.prisma.nigerianOfficial.findMany({
            where: { id: { in: [...officialIds] } },
            select: { id: true, name: true },
          })
        : [],
      userIds.size
        ? this.prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: { id: true, name: true, phoneNumber: true },
          })
        : [],
    ]);

    const adminLabels = new Map(
      admins.map((a) => [a.id, { name: a.name || a.email, email: a.email }]),
    );
    const targets = new Map<string, { name: string; email: string | null }>();
    for (const [id, label] of adminLabels) targets.set(`admin:${id}`, label);
    for (const o of officials)
      targets.set(`official:${o.id}`, { name: o.name, email: null });
    for (const u of users) {
      const name = u.name ?? u.phoneNumber;
      // Citizen emails are never shipped in labels — even with users.read the
      // list/modal identity line doesn't need them (diffs carry what's permitted).
      if (name) targets.set(`user:${u.id}`, { name, email: null });
    }
    return { admins: adminLabels, targets };
  }

  async status(): Promise<{
    headSeq: number | null;
    headHash: string | null;
    epoch: number | null;
    eventCount: number;
    lastAnchor: {
      anchoredAt: string;
      headSeq: number;
      headHash: string;
      destination: string;
      status: string;
    } | null;
  }> {
    const [head, lastAnchor] = await Promise.all([
      this.prisma.auditEvent.findFirst({
        orderBy: { seq: "desc" },
        select: { seq: true, hash: true, epoch: true },
      }),
      this.prisma.auditAnchor.findFirst({
        where: { status: "sent" },
        orderBy: { anchoredAt: "desc" },
      }),
    ]);
    // seq is a dense 1..N counter by construction (appender derives head+1
    // under the advisory lock) — head.seq IS the count; no table scan needed.
    const eventCount = head ? Number(head.seq) : 0;
    return {
      headSeq: head ? Number(head.seq) : null,
      headHash: head?.hash ?? null,
      epoch: head?.epoch ?? null,
      eventCount,
      lastAnchor: lastAnchor
        ? {
            anchoredAt: lastAnchor.anchoredAt.toISOString(),
            headSeq: Number(lastAnchor.headSeq),
            headHash: lastAnchor.headHash,
            destination: lastAnchor.destination,
            status: lastAnchor.status,
          }
        : null,
    };
  }

  /** CSV export of the current filter (max 10k rows). Caller audits the export. */
  async exportCsv(filters: AuditListFilters): Promise<{ csv: string; rows: number }> {
    const where = this.buildWhere(filters);
    // Select only the emitted columns — `diff` is the largest column
    // (base64-inflated ciphertext) and the CSV never ships it.
    const rows = await this.prisma.auditEvent.findMany({
      where,
      orderBy: { seq: "asc" },
      take: 10_000,
      select: {
        seq: true,
        occurredAt: true,
        epoch: true,
        actorType: true,
        actorId: true,
        ip: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        hash: true,
      },
    });
    const esc = (v: unknown): string => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header =
      "seq,occurred_at,epoch,actor_type,actor_id,ip,action,target_type,target_id,metadata,hash";
    const lines = rows.map((r) =>
      [
        Number(r.seq),
        r.occurredAt.toISOString(),
        r.epoch,
        r.actorType,
        r.actorId,
        r.ip,
        r.action,
        r.targetType,
        r.targetId,
        JSON.stringify(r.metadata),
        r.hash,
      ]
        .map(esc)
        .join(","),
    );
    return { csv: [header, ...lines].join("\n"), rows: rows.length };
  }
}
