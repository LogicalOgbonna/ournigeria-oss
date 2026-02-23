import { createHash, createHmac, timingSafeEqual } from "crypto";

export interface TelegramUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
}

interface VerifyResult {
  valid: true;
  telegramUser: TelegramUser;
}

interface VerifyError {
  valid: false;
  error: string;
}

const MAX_AUTH_AGE_SECONDS = 300; // 5 minutes

export function verifyTelegramAuth(
  params: Record<string, string>,
): VerifyResult | VerifyError {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { valid: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  const hash = params.hash;
  if (!hash) {
    return { valid: false, error: "Missing hash parameter" };
  }

  if (!params.id || !params.auth_date) {
    return { valid: false, error: "Missing required parameters" };
  }

  // Validate telegram_id is a numeric string (Telegram IDs are up to 19 digits)
  if (!/^\d{1,19}$/.test(params.id)) {
    return { valid: false, error: "Invalid Telegram ID format" };
  }

  // Build data-check-string: alphabetically sorted key=value pairs (excluding hash)
  const dataCheckString = Object.keys(params)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("\n");

  // secret = SHA256(bot_token)
  const secret = createHash("sha256").update(botToken).digest();

  // computed = HMAC-SHA256(data_check_string, secret)
  const computed = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  // Timing-safe comparison
  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");

  if (
    hashBuffer.length !== computedBuffer.length ||
    !timingSafeEqual(hashBuffer, computedBuffer)
  ) {
    return { valid: false, error: "Invalid hash" };
  }

  // Check auth_date freshness (prevent replay attacks)
  const authDate = parseInt(params.auth_date, 10);
  if (isNaN(authDate)) {
    return { valid: false, error: "Invalid auth_date" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now) {
    return { valid: false, error: "Invalid auth_date" };
  }
  if (now - authDate > MAX_AUTH_AGE_SECONDS) {
    return { valid: false, error: "Auth data has expired" };
  }

  return {
    valid: true,
    telegramUser: {
      id: params.id,
      first_name: params.first_name,
      last_name: params.last_name,
      username: params.username,
      photo_url: params.photo_url,
      auth_date: params.auth_date,
    },
  };
}
