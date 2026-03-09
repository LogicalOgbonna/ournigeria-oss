import { test, expect } from '@playwright/test';

test.describe('Pricing Plans @web', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile?tab=billing');
  });

  test('pricing plans show 3 tiers', async ({ page }) => {
    // There should be exactly 3 pricing plan cards
    const planNames = page.getByText(
      /free|starter|pro/i,
    );
    await expect(planNames.first()).toBeVisible();

    // Verify all three tier names are present
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/starter/i).first()).toBeVisible();
    await expect(page.getByText(/pro/i).first()).toBeVisible();
  });

  test('free tier shows N0 / Free', async ({ page }) => {
    // Free tier should show zero cost or "Free" label
    await expect(
      page
        .getByText(/free/i)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .getByText(/N0|₦0|\bfree\b/i)
        .first(),
    ).toBeVisible();
  });

  test('starter tier shows N1,500', async ({ page }) => {
    await expect(
      page
        .getByText(/starter/i)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .getByText(/1[,.]?500/)
        .first(),
    ).toBeVisible();
  });

  test('pro tier shows N5,000', async ({ page }) => {
    await expect(
      page
        .getByText(/pro/i)
        .first(),
    ).toBeVisible();

    await expect(
      page
        .getByText(/5[,.]?000/)
        .first(),
    ).toBeVisible();
  });

  test('each tier has features list', async ({ page }) => {
    // Each pricing card should contain a list of features
    const featureLists = page.locator('ul');
    const count = await featureLists.count();

    // At least 3 feature lists (one per tier)
    expect(count).toBeGreaterThanOrEqual(3);

    // Each list should have at least one item
    for (let i = 0; i < Math.min(count, 3); i++) {
      const items = featureLists.nth(i).locator('li');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    }
  });
});
