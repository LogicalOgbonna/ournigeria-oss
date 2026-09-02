import type { Permission } from "./permissions";

/**
 * Diff fields encrypted per-subject before hashing (crypto-erasure, spec §9).
 * Keyed by audit targetType. Anything listed here is stored as
 * {__enc: true, subjectType, subjectId, iv, tag, ct} inside diff.before/after.
 *
 * Field names MUST match the Prisma model field names used in diffs —
 * apps/api/src/audit/__tests__/sensitive-fields-model.test.ts compile-checks
 * them against the generated Prisma types (a rename there fails the build).
 */
export const SENSITIVE_DIFF_FIELDS: Record<string, readonly string[]> = {
  user: ["phoneNumber", "email", "name", "telegramId", "preferences"],
  conversation: ["title", "summary"],
  message: ["content", "richContent"],
  donation: ["email", "donorName"],
  feedback: ["subject", "message", "adminNotes"],
  user_memory: ["key", "value"],
};

export function sensitiveFieldsFor(targetType: string): readonly string[] {
  return SENSITIVE_DIFF_FIELDS[targetType] ?? [];
}

/**
 * Permission required to see a targetType's DECRYPTED sensitive fields in
 * audit reads (spec §4: auditor holds audit.read but must never see citizen
 * PII — decryption is gated on the underlying resource permission; callers
 * without it get {__redacted: true} markers instead).
 */
export const DIFF_DECRYPT_PERMISSION: Record<string, Permission> = {
  user: "users.read",
  user_memory: "users.read",
  conversation: "conversations.read",
  message: "conversations.read",
  donation: "donations.read",
  feedback: "feedback.read",
};

export function decryptPermissionFor(targetType: string): Permission | null {
  return DIFF_DECRYPT_PERMISSION[targetType] ?? null;
}
