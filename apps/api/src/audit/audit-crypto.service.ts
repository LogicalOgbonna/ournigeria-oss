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

  /** Get (or create) the subject's data key. Null = key was shredded. */
  private async dataKeyFor(
    tx: TxLike,
    subjectType: string,
    subjectId: string,
  ): Promise<Buffer | null> {
    const existing = await tx.auditErasureKey.findUnique({
      where: { subjectType_subjectId: { subjectType, subjectId } },
    });
    if (existing) {
      if (existing.shreddedAt || !existing.keyCiphertext) return null;
      const [iv, tag, ct] = existing.keyCiphertext.split(".");
      return this.gcmDecrypt(this.masterKey, { iv, tag, ct });
    }
    const dataKey = randomBytes(32);
    const wrapped = this.gcmEncrypt(this.masterKey, dataKey);
    await tx.auditErasureKey.create({
      data: {
        subjectType,
        subjectId,
        keyCiphertext: `${wrapped.iv}.${wrapped.tag}.${wrapped.ct}`,
      },
    });
    return dataKey;
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
    const dataKey = await this.dataKeyFor(tx, targetType, subjectId);
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
        const key = await this.dataKeyFor(
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

  /** "Forget" a subject: shred the key; ciphertext in the chain becomes noise. */
  async shredSubject(subjectType: string, subjectId: string): Promise<boolean> {
    const res = await this.prisma.auditErasureKey.updateMany({
      where: { subjectType, subjectId, shreddedAt: null },
      data: { shreddedAt: new Date(), keyCiphertext: null },
    });
    return res.count > 0;
  }
}
