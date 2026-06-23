import { test, expect } from '@playwright/test';

/**
 * Telegram deep-link login replaces the ISP-blockable widget.
 * The login page must render the deep-link entry point and make ZERO
 * requests to telegram.org / oauth.telegram.org. See .agent/plans/46*.
 */
test.describe('Telegram deep-link login @web', () => {
  test('login page never requests blockable telegram.org assets', async ({ page }) => {
    const telegramHits: string[] = [];
    page.on('request', (req) => {
      try {
        if (/(^|\.)telegram\.org$/.test(new URL(req.url()).hostname)) {
          telegramHits.push(req.url());
        }
      } catch {}
    });

    await page.goto('/login');
    await expect(page.getByText(/ournigeria/i).first()).toBeVisible();

    // Reach the Telegram tab if the page is tabbed.
    const telegramTab = page.getByRole('tab', { name: /telegram/i });
    if (await telegramTab.isVisible().catch(() => false)) {
      await telegramTab.click();
    }
    await expect(
      page.getByRole('button', { name: /continue with telegram|open telegram/i }),
    ).toBeVisible();

    expect(
      telegramHits,
      `unexpected telegram.org requests: ${telegramHits.join(', ')}`,
    ).toHaveLength(0);
  });

  test('starting Telegram login shows the QR/waiting state, not a widget iframe', async ({
    page,
  }) => {
    await page.goto('/login');
    const telegramTab = page.getByRole('tab', { name: /telegram/i });
    if (await telegramTab.isVisible().catch(() => false)) await telegramTab.click();

    await page.getByRole('button', { name: /continue with telegram/i }).click();

    // Desktop Chrome project → QR + "Waiting for confirmation".
    await expect(page.getByText(/waiting for confirmation/i)).toBeVisible({ timeout: 15_000 });
    // No Telegram widget iframe is ever created.
    expect(await page.locator('iframe[src*="oauth.telegram.org"]').count()).toBe(0);
  });
});
