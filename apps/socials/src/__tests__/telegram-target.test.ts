import { describe, it, expect } from "vitest";
import { resolveSocialsTelegramTarget } from "../notifications/telegram.service.js";

const cfg = (m: Record<string, string | undefined>) => (k: string) => m[k];

describe("resolveSocialsTelegramTarget", () => {
  it("routes to the dedicated socials bot + socials group when BOTH are set", () => {
    const t = resolveSocialsTelegramTarget(
      cfg({
        SOCIALS_BOT_TOKEN: "SBOT",
        SOCIALS_POST_CHAT_ID: "-5572406677",
        TELEGRAM_BOT_TOKEN: "LOGINBOT",
        SOCIALS_OPS_CHAT_ID: "-4845416071",
      }),
    );
    expect(t).toEqual({ token: "SBOT", chatId: "-5572406677" });
  });

  it("falls back to the legacy bot + ops chat when the socials group is unset (e.g. prod)", () => {
    const t = resolveSocialsTelegramTarget(
      cfg({
        SOCIALS_BOT_TOKEN: "SBOT",
        SOCIALS_POST_CHAT_ID: undefined,
        TELEGRAM_BOT_TOKEN: "LOGINBOT",
        SOCIALS_OPS_CHAT_ID: "-4845416071",
      }),
    );
    expect(t).toEqual({ token: "LOGINBOT", chatId: "-4845416071" });
  });

  it("never pairs the new bot with the legacy chat (both new vars required to switch)", () => {
    const t = resolveSocialsTelegramTarget(
      cfg({
        SOCIALS_BOT_TOKEN: undefined,
        SOCIALS_POST_CHAT_ID: "-5572406677",
        TELEGRAM_BOT_TOKEN: "LOGINBOT",
        SOCIALS_OPS_CHAT_ID: "-4845416071",
      }),
    );
    expect(t).toEqual({ token: "LOGINBOT", chatId: "-4845416071" });
  });
});
