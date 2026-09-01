/**
 * Diff fields encrypted per-subject before hashing (crypto-erasure, spec §9).
 * Keyed by audit targetType. Anything listed here is stored as
 * {__enc: true, subjectType, subjectId, iv, tag, ct} inside diff.before/after.
 *
 * Field names MUST match the Prisma model field names used in diffs.
 */
export const SENSITIVE_DIFF_FIELDS: Record<string, readonly string[]> = {
  user: [
    "phoneNumber",
    "email",
    "name",
    "telegramUsername",
    "telegramChatId",
    "preferences",
  ],
  conversation: ["title", "summary"],
  message: ["content"],
  donation: ["donorName", "donorEmail", "donorPhone", "message"],
  feedback: ["email", "message"],
  user_memory: ["content"],
};

export function sensitiveFieldsFor(targetType: string): readonly string[] {
  return SENSITIVE_DIFF_FIELDS[targetType] ?? [];
}
