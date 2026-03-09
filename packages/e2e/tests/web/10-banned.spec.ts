import { test, expect } from '@playwright/test';

test.describe('Banned Page @web', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/banned');
  });

  test('banned page shows ban message text', async ({ page }) => {
    // Page should display an account suspension or ban message
    await expect(
      page
        .getByText(/banned|suspended|blocked|deactivated|account.*restrict/i)
        .first(),
    ).toBeVisible();
  });

  test('support contact info/link is present', async ({ page }) => {
    // Should contain a support email link (mailto)
    const mailtoLink = page.locator('a[href^="mailto:"]');
    await expect(mailtoLink.first()).toBeVisible();

    // The link should contain a valid email address
    const href = await mailtoLink.first().getAttribute('href');
    expect(href).toMatch(/^mailto:.+@.+/);
  });
});
