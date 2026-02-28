import type { PrismaClient } from "@ournigeria/database";

/** Keys we track in user memory. */
const MEMORY_KEYS = {
  interestedStates: "interested_states",
  interestedTopics: "interested_topics",
  preferredLanguage: "preferred_language",
} as const;

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Extract durable facts from a conversation and persist them
 * as user memory entries. Merges with existing values.
 */
export async function extractAndSaveMemory(
  prisma: PrismaClient,
  userId: string,
  opts: {
    mentionedStates: string[];
    mentionedYears: number[];
    language: string;
    messageCount: number;
  },
): Promise<void> {
  // Only extract memory if the conversation had meaningful depth
  if (opts.messageCount < 4) return;

  const upserts: Array<{ key: string; value: string }> = [];

  // Track states the user is interested in (merge with existing)
  if (opts.mentionedStates.length > 0) {
    const existing = await prisma.userMemory.findUnique({
      where: {
        userId_key: { userId, key: MEMORY_KEYS.interestedStates },
      },
    });

    const prev = existing ? safeParseArray(existing.value) : [];
    const merged = Array.from(
      new Set([...prev, ...opts.mentionedStates]),
    ).slice(0, 20);

    upserts.push({
      key: MEMORY_KEYS.interestedStates,
      value: JSON.stringify(merged),
    });
  }

  // Track language preference
  if (opts.language && opts.language !== "en") {
    upserts.push({
      key: MEMORY_KEYS.preferredLanguage,
      value: opts.language,
    });
  }

  // Batch upserts
  for (const { key, value } of upserts) {
    await prisma.userMemory.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, value },
      update: { value },
    });
  }
}

/**
 * Load user memory and format it as a compact profile string
 * for injection into agent system prompts.
 */
export async function loadUserProfile(
  prisma: PrismaClient,
  userId: string,
): Promise<string | null> {
  const memories = await prisma.userMemory.findMany({
    where: { userId },
  });

  if (memories.length === 0) return null;

  const parts: string[] = [];

  for (const mem of memories) {
    switch (mem.key) {
      case MEMORY_KEYS.interestedStates: {
        const states = safeParseArray(mem.value);
        if (states.length > 0) {
          parts.push(`States of interest: ${states.join(", ")}`);
        }
        break;
      }
      case MEMORY_KEYS.interestedTopics: {
        const topics = safeParseArray(mem.value);
        if (topics.length > 0) {
          parts.push(`Topics of interest: ${topics.join(", ")}`);
        }
        break;
      }
      case MEMORY_KEYS.preferredLanguage:
        // Language is controlled per-request via the UI dropdown;
        // injecting a stored preference here overrides the user's
        // current selection, so we intentionally skip it.
        break;
    }
  }

  return parts.length > 0
    ? `User profile (from past conversations):\n${parts.join("\n")}`
    : null;
}
