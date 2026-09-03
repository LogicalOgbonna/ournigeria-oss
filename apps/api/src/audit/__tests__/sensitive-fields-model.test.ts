import { describe, expect, it } from "vitest";
import type {
  Conversation,
  Donation,
  Feedback,
  Message,
  User,
  UserMemory,
} from "@prisma/client";
import {
  DIFF_DECRYPT_PERMISSION,
  SENSITIVE_DIFF_FIELDS,
} from "@ournigeria/access";

/**
 * Compile-time tie between the crypto-erasure field map and the Prisma models:
 * a listed field that doesn't exist on the model fails `satisfies` at build
 * time (this is how the telegramUsername/telegramChatId-vs-telegramId bug
 * slipped through — the map named fields the User model never had, so the
 * real `telegramId` entered the immutable chain unencrypted).
 */
type FieldsOf<T> = readonly (keyof T & string)[];

const USER_FIELDS = [
  "phoneNumber",
  "email",
  "name",
  "telegramId",
  "preferences",
] as const satisfies FieldsOf<User>;
const CONVERSATION_FIELDS = ["title", "summary"] as const satisfies FieldsOf<Conversation>;
const MESSAGE_FIELDS = ["content", "richContent"] as const satisfies FieldsOf<Message>;
const DONATION_FIELDS = ["email", "donorName"] as const satisfies FieldsOf<Donation>;
const FEEDBACK_FIELDS = ["subject", "message", "adminNotes"] as const satisfies FieldsOf<Feedback>;
const USER_MEMORY_FIELDS = ["key", "value"] as const satisfies FieldsOf<UserMemory>;

describe("SENSITIVE_DIFF_FIELDS matches Prisma models", () => {
  it("runtime map equals the compile-checked field lists", () => {
    expect(SENSITIVE_DIFF_FIELDS.user).toEqual(USER_FIELDS);
    expect(SENSITIVE_DIFF_FIELDS.conversation).toEqual(CONVERSATION_FIELDS);
    expect(SENSITIVE_DIFF_FIELDS.message).toEqual(MESSAGE_FIELDS);
    expect(SENSITIVE_DIFF_FIELDS.donation).toEqual(DONATION_FIELDS);
    expect(SENSITIVE_DIFF_FIELDS.feedback).toEqual(FEEDBACK_FIELDS);
    expect(SENSITIVE_DIFF_FIELDS.user_memory).toEqual(USER_MEMORY_FIELDS);
  });

  it("every sensitive targetType has a decrypt permission", () => {
    for (const targetType of Object.keys(SENSITIVE_DIFF_FIELDS)) {
      expect(
        DIFF_DECRYPT_PERMISSION[targetType],
        `missing decrypt permission for ${targetType}`,
      ).toBeTruthy();
    }
  });
});
