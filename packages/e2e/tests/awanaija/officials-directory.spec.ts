import { test, expect } from '@playwright/test';

// Officials directory (photo-led grid card redesign). Runs logged-OUT — this is
// a public SEO page. Asserts the grid renders real cards and that a card
// navigates to the official's profile.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Officials directory @awanaija', () => {
  test('directory renders grid cards that navigate to a profile', async ({ page }) => {
    await page.goto('/officials');

    const cards = page.getByTestId('official-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    expect(await cards.count()).toBeGreaterThan(0);

    // First card carries a non-empty name line.
    const name = cards.first().locator('p').first();
    await expect(name).not.toBeEmpty();

    // At least one card on the page shows a party row (flag disc + acronym) —
    // catches total party-flag disappearance (e.g. a permanently failing
    // /parties fetch would be invisible otherwise). Officials without an active
    // position legitimately have no party row, hence "at least one".
    const partyRows = page.getByTestId('official-card').locator('span[aria-hidden]');
    expect(await partyRows.count()).toBeGreaterThan(0);

    // Clicking a card lands on that official's profile.
    await cards.first().click();
    await page.waitForURL(/\/officials\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('role filter narrows the grid', async ({ page }) => {
    await page.goto('/officials?role=governor');
    const cards = page.getByTestId('official-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    // Governor filter should show governor cards.
    await expect(cards.first()).toContainText(/governor/i);
  });
});
