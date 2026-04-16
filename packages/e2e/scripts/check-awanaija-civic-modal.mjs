import { chromium } from "@playwright/test";

const baseUrl = process.env.AWANAIJA_URL || "http://127.0.0.1:3003";

async function openCivicModal(page) {
  await page.addInitScript(() => {
    localStorage.setItem("ournigeria_welcomed", "1");
    localStorage.removeItem("ournigeria_civic_modal_dismissed");
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const leaderboardTab = page.getByRole("button", { name: /leaderboard/i });
  if (await leaderboardTab.isVisible().catch(() => false)) {
    return;
  }

  await page.getByRole("button", { name: /who governs you/i }).click();
  await leaderboardTab.waitFor({ state: "visible" });
}

async function checkTab(page, name) {
  await page.getByRole("button", { name }).click();
  await page.waitForTimeout(1200);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];

  page.on("console", (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (error) => {
    logs.push({ type: "pageerror", text: error.message });
  });

  try {
    await openCivicModal(page);
    await checkTab(page, /leaderboard/i);
    await checkTab(page, /activity/i);
  } finally {
    await browser.close();
  }

  const boundaryErrors = logs.filter(
    (entry) =>
      entry.type === "pageerror" ||
      /async Client Component/i.test(entry.text),
  );

  if (boundaryErrors.length > 0) {
    console.error(JSON.stringify(boundaryErrors, null, 2));
    process.exit(1);
  }

  console.log(`Awanaija civic modal check passed at ${baseUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
