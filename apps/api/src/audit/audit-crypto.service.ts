import { Injectable } from "@nestjs/common";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { Prisma, PrismaService } from "@ournigeria/database";
import { canonicalJson, sensitiveFieldsFor } from "@ournigeria/access";

/**
 * Crypto-erasure (spec §9): sensitive diff fields are AES-256-GCM encrypted
 * with a per-subject data key (itself wrapped by AUDIT_ERASURE_MASTER_KEY)
 * BEFORE the event is hashed into the chain. Shredding the data key
 * ("forget me") leaves the chain verifiable while the plaintext is gone.
 */

export interface EncryptedField {
  __enc: true;
  subjectType: string;
  subjectId: string;
  iv: string;
  tag: string;
  ct: string;
}

export const ERASED_MARKER = { __erased: true } as const;
/** Shown to audit readers who lack the targetType's decrypt permission. */
export const REDACTED_MARKER = { __redacted: true } as const;

function isEncryptedField(v: unknown): v is EncryptedField {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as { __enc?: unknown }).__enc === true
  );
}

type TxLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditCryptoService {
  private readonly masterKey: Buffer;

  constructor(private readonly prisma: PrismaService) {
    const raw = process.env.AUDIT_ERASURE_MASTER_KEY;
    if (raw) {
      const key = Buffer.from(raw, "base64");
      if (key.length !== 32) {
        throw new Error(
          "AUDIT_ERASURE_MASTER_KEY must be 32 bytes base64 (openssl rand -base64 32)",
        );
      }
      this.masterKey = key;
    } else if (process.env.NODE_ENV === "production") {
      // Spec §9: crypto-erasure is non-deferrable — silently logging raw PII
      // into an immutable chain must be impossible in production.
      throw new Error(
        "AUDIT_ERASURE_MASTER_KEY is required in production (spec 62 §9)",
      );
    } else {
      console.warn(
        "AUDIT_ERASURE_MASTER_KEY not set — using an EPHEMERAL key; " +
          "encrypted audit diffs will be unreadable after restart (dev/test only)",
      );
      this.masterKey = randomBytes(32);
    }
  }

  private gcmEncrypt(key: Buffer, plaintext: Buffer): { iv: string; tag: string; ct: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ct: ct.toString("base64"),
    };
  }

  private gcmDecrypt(key: Buffer, enc: { iv: string; tag: string; ct: string }): Buffer {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(enc.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(enc.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(enc.ct, "base64")),
      decipher.final(),
    ]);
  }

  private unwrapKeyRow(
    row: { keyCiphertext: string | null; shreddedAt: Date | null } | null,
  ): Buffer | null {
    if (!row || row.shreddedAt || !row.keyCiphertext) return null;
    const [iv, tag, ct] = row.keyCiphertext.split(".");
    return this.gcmDecrypt(this.masterKey, { iv, tag, ct });
  }

  /**
   * Read-only key lookup — NEVER writes. Null = missing or shredded. Used by
   * the decrypt/display path: a GET must not mint erasure-key rows (a minted
   * key can't decrypt anything, and a live-looking row for a subject that was
   * never keyed corrupts erasure audits).
   */
  private async getDataKey(
    db: TxLike,
    subjectType: string,
    subjectId: string,
  ): Promise<Buffer | null> {
    return this.unwrapKeyRow(
      await db.auditErasureKey.findUnique({
        where: { subjectType_subjectId: { subjectType, subjectId } },
      }),
    );
  }

  /**
   * Encrypt-path key lookup — creates the subject's key on first use.
   * INSERT ... ON CONFLICT DO NOTHING instead of create+catch(P2002): a unique
   * violation aborts the surrounding Postgres transaction (25P02), so a
   * catch-and-retry inside the same tx can never recover — the conflict must
   * be avoided, not handled.
   */
  private async getOrCreateDataKey(
    tx: TxLike,
    subjectType: string,
    subjectId: string,
  ): Promise<Buffer | null> {
    const existing = await tx.auditErasureKey.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
    });
    if (existing) return this.unwrapKeyRow(existing);

    const dataKey = randomBytes(32);
    const wrapped = this.gcmEncrypt(this.masterKey, dataKey);
    await tx.$executeRawUnsafe(
      `INSERT INTO audit_erasure_keys (subject_type, subject_id, key_ciphertext)
       VALUES ($1, $2, $3)
       ON CONFLICT (subject_type, subject_id) DO NOTHING`,
      subjectType,
      subjectId,
      `${wrapped.iv}.${wrapped.tag}.${wrapped.ct}`,
    );
    // Ours, or the concurrent winner's — either way the stored row is truth.
    return this.getDataKey(tx, subjectType, subjectId);
  }

  /**
   * Replace sensitive fields of diff.before/diff.after with encrypted blobs.
   * Non-sensitive targetTypes pass through untouched. A shredded subject's new
   * events store the ERASED marker (nothing new to leak).
   */
  async encryptDiffFields(
    tx: TxLike,
    targetType: string,
    subjectId: string,
    diff: unknown,
  ): Promise<unknown> {
    const fields = sensitiveFieldsFor(targetType);
    if (fields.length === 0 || diff === null || typeof diff !== "object") {
      return diff;
    }
    const dataKey = await this.getOrCreateDataKey(tx, targetType, subjectId);
    const out: Record<string, unknown> = { ...(diff as Record<string, unknown>) };
    for (const side of ["before", "after"] as const) {
      const sideVal = out[side];
      if (sideVal === null || typeof sideVal !== "object") continue;
      const copy: Record<string, unknown> = { ...(sideVal as Record<string, unknown>) };
      for (const field of fields) {
        if (!(field in copy) || copy[field] === undefined) continue;
        if (dataKey === null) {
          copy[field] = { ...ERASED_MARKER };
          continue;
        }
        const enc = this.gcmEncrypt(
          dataKey,
          Buffer.from(canonicalJson(copy[field]), "utf8"),
        );
        const blob: EncryptedField = {
          __enc: true,
          subjectType: targetType,
          subjectId,
          ...enc,
        };
        copy[field] = blob;
      }
      out[side] = copy;
    }
    return out;
  }

  /** Decrypt for display. Shredded/unreadable fields become {__erased: true}. */
  async decryptDiff(diff: unknown): Promise<unknown> {
    if (diff === null || typeof diff !== "object") return diff;
    if (isEncryptedField(diff)) {
      try {
        const key = await this.getDataKey(
          this.prisma,
          diff.subjectType,
          diff.subjectId,
        );
        if (!key) return { ...ERASED_MARKER };
        return JSON.parse(this.gcmDecrypt(key, diff).toString("utf8"));
      } catch {
        return { ...ERASED_MARKER };
      }
    }
    if (Array.isArray(diff)) {
      return Promise.all(diff.map((v) => this.decryptDiff(v)));
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(diff as Record<string, unknown>)) {
      out[k] = await this.decryptDiff(v);
    }
    return out;
  }

  /**
   * Replace encrypted blobs with {__redacted: true} for readers who lack the
   * targetType's decrypt permission (spec §4: auditor never sees citizen PII)
   * — the ciphertext itself is not shipped either.
   */
  redactEncrypted(diff: unknown): unknown {
    if (diff === null || typeof diff !== "object") return diff;
    if (isEncryptedField(diff)) return { ...REDACTED_MARKER };
    if (Array.isArray(diff)) return diff.map((v) => this.redactEncrypted(v));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(diff as Record<string, unknown>)) {
      out[k] = this.redactEncrypted(v);
    }
    return out;
  }

  /** "Forget" a subject: shred the key; ciphertext in the chain becomes noise. */
  async shredSubject(subjectType: string, subjectId: string): Promise<boolean> {
    const res = await this.prisma.auditErasureKey.updateMany({
      where: { subjectType, subjectId, shreddedAt: null },
      data: { shreddedAt: new Date(), keyCiphertext: null },
    });
    return res.count > 0;
  }

  /**
   * Bulk "forget" across many subjects (a user's conversations, messages,
   * feedback, memories, donations each encrypt under their OWN subject key —
   * spec §9's erasure guarantee has to cover all of them, not just the user
   * key). Returns how many live keys were shredded.
   */
  async shredSubjects(
    subjects: ReadonlyArray<{ subjectType: string; subjectId: string }>,
  ): Promise<number> {
    const byType = new Map<string, string[]>();
    for (const s of subjects) {
      const ids = byType.get(s.subjectType);
      if (ids) ids.push(s.subjectId);
      else byType.set(s.subjectType, [s.subjectId]);
    }
    let total = 0;
    for (const [subjectType, ids] of byType) {
      const res = await this.prisma.auditErasureKey.updateMany({
        where: { subjectType, subjectId: { in: ids }, shreddedAt: null },
        data: { shreddedAt: new Date(), keyCiphertext: null },
      });
      total += res.count;
    }
    return total;
  }
}
