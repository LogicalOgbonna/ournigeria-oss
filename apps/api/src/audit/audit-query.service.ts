import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { AuditCryptoService } from "./audit-crypto.service";

export interface AuditListFilters {
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
  ip: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
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
    opts: { decrypt?: boolean } = {},
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

    const data: AuditEventView[] = [];
    for (const row of rows) {
      data.push({
        seq: Number(row.seq),
        id: row.id,
        occurredAt: row.occurredAt.toISOString(),
        epoch: row.epoch,
        actorType: row.actorType,
        actorId: row.actorId,
        ip: row.ip,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        diff:
          opts.decrypt === false
            ? row.diff
            : await this.crypto.decryptDiff(row.diff),
        metadata: row.metadata,
        hash: row.hash,
      });
    }
    return { data, total, page, limit };
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
    const [head, eventCount, lastAnchor] = await Promise.all([
      this.prisma.auditEvent.findFirst({
        orderBy: { seq: "desc" },
        select: { seq: true, hash: true, epoch: true },
      }),
      this.prisma.auditEvent.count(),
      this.prisma.auditAnchor.findFirst({
        where: { status: "sent" },
        orderBy: { anchoredAt: "desc" },
      }),
    ]);
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
    const rows = await this.prisma.auditEvent.findMany({
      where,
      orderBy: { seq: "asc" },
      take: 10_000,
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
