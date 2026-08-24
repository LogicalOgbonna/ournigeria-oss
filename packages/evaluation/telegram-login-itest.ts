#!/usr/bin/env npx tsx
/**
 * Telegram deep-link login — live integration test.
 * Drives start → synthetic webhook /start → poll against a running API.
 *
 * Run: infisical run --env dev -- npx tsx packages/evaluation/telegram-login-itest.ts \
 *        --api-url http://localhost:3001
 *
 * Requires TELEGRAM_WEBHOOK_SECRET in the env (injected by infisical) so the
 * synthetic webhook update is accepted exactly as Telegram would deliver it.
 */
const args = process.argv.slice(2);
const apiUrl = args[args.indexOf("--api-url") + 1] || "https://spending-api.arinze.online";
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const TG_ID = Number(`9${Date.now().toString().slice(-8)}`); // unique synthetic telegram id

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("❌ FAIL:", msg);
    process.exit(1);
  }
}

async function main() {
  // 1. start
  const startRes = await fetch(`${apiUrl}/api/auth/telegram/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "login" }),
  });
  assert(startRes.ok, `start returned ${startRes.status}`);
  const { startParam, pollKey } = await startRes.json();
  assert(startParam && pollKey && startParam !== pollKey, "start must return distinct startParam + pollKey");
  console.log("✓ start issued tokens");

  // 2. poll before auth → pending
  const pendingRes = await fetch(`${apiUrl}/api/auth/telegram/poll?pollKey=${encodeURIComponent(pollKey)}`);
  const pending = await pendingRes.json();
  assert(pending.status === "pending", `expected pending, got ${pending.status}`);
  console.log("✓ poll pending before auth");

  // 3. synthetic webhook /start <startParam> (as Telegram would deliver it)
  const update = {
    update_id: TG_ID,
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: TG_ID, type: "private" },
      from: { id: TG_ID, is_bot: false, first_name: "ITest" },
      text: `/start ${startParam}`,
      entities: [{ offset: 0, length: 6, type: "bot_command" }],
    },
  };
  const hookRes = await fetch(`${apiUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": webhookSecret },
    body: JSON.stringify(update),
  });
  assert(hookRes.ok, `webhook returned ${hookRes.status}`);
  console.log("✓ webhook accepted /start");

  // 4. poll → authenticated (allow brief propagation)
  let authed: any = null;
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${apiUrl}/api/auth/telegram/poll?pollKey=${encodeURIComponent(pollKey)}`);
    const j = await r.json();
    if (j.status === "authenticated") {
      authed = j;
      assert(/nb_uid=/.test(r.headers.get("set-cookie") || ""), "poll must set nb_uid cookie");
      break;
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  assert(authed?.success && authed.userId, "poll never returned authenticated");
  console.log("✓ poll authenticated, userId:", authed.userId);

  // 5. second poll → single-use consumed (expired)
  const reuseRes = await fetch(`${apiUrl}/api/auth/telegram/poll?pollKey=${encodeURIComponent(pollKey)}`);
  const reuse = await reuseRes.json();
  assert(reuse.status === "expired", `expected single-use expired, got ${reuse.status}`);
  console.log("✓ second poll rejected (single-use)");

  // 6. webhook replay of same startParam → still 200, not re-authenticated
  const replayRes = await fetch(`${apiUrl}/api/telegram/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": webhookSecret },
    body: JSON.stringify(update),
  });
  assert(replayRes.ok, "replay webhook should still 200 (handled gracefully)");
  console.log("✓ replay handled");

  console.log("\n✅ ALL PASS");
}

main().catch((e) => {
  console.error("❌ ERROR", e);
  process.exit(1);
});
