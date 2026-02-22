import { z } from "zod";

/**
 * Normalize a Nigerian phone number to E.164 format (+234XXXXXXXXXX).
 * Handles local format (0XXXXXXXXXX) and already-prefixed numbers.
 */
function normalizeNigerianPhone(raw: string): string {
  // Strip spaces, dashes, parens, dots
  let cleaned = raw.replace(/[\s\-().]/g, "");

  // Convert local Nigerian format 0XX → +234XX
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "+234" + cleaned.slice(1);
  }

  // Ensure leading +
  if (!cleaned.startsWith("+") && cleaned.startsWith("234")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

/**
 * Zod schema for phone number validation.
 * Normalizes input then validates E.164 format (+ followed by 7-15 digits).
 */
export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform(normalizeNigerianPhone)
  .refine((val) => /^\+\d{7,15}$/.test(val), {
    message: "Invalid phone number. Use format: +234XXXXXXXXXX",
  });
