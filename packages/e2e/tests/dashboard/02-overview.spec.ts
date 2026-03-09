import { test, expect } from '@playwright/test';

test.describe('Dashboard Overview @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('dashboard page loads', async ({ page }) => {
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('stats cards render with numbers', async ({ page }) => {
    // There should be 4 stat cards: Users, Conversations, Messages, Documents
    const statsCards = page.locator('[class*="card"]').filter({
      has: page.locator('text=/\\d+/'),
    });

    // Wait for data to load
    await expect(statsCards.first()).toBeVisible({ timeout: 10_000 });

    // Verify each expected stat label is present
    await expect(page.getByText(/users/i).first()).toBeVisible();
    await expect(page.getByText(/conversations/i).first()).toBeVisible();
    await expect(page.getByText(/messages/i).first()).toBeVisible();
    await expect(page.getByText(/documents/i).first()).toBeVisible();

    // Each card should contain a bold number
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);
  });

  test('user growth chart section is visible', async ({ page }) => {
    // Look for the user growth/registrations chart heading
    const chartSection = page.getByText(/user registrations|user growth/i).first();
    await expect(chartSection).toBeVisible({ timeout: 10_000 });

    // Recharts renders an SVG inside a responsive container
    const rechartsContainer = page.locator('.recharts-responsive-container').first();
    await expect(rechartsContainer).toBeVisible({ timeout: 10_000 });
  });

  test('query categories chart section is visible', async ({ page }) => {
    const chartSection = page.getByText(/query categories/i).first();
    await expect(chartSection).toBeVisible({ timeout: 10_000 });
  });

  test('recent ingestion runs section renders', async ({ page }) => {
    // Look for the ingestion runs section heading
    const runsSection = page.getByText(/recent ingestion/i).first();
    await expect(runsSection).toBeVisible({ timeout: 10_000 });

    // Runs are displayed as card items (not a table)
    // Each run shows pipeline name, file/chunk counts, status badge, and date
    const runItems = page.locator('.rounded-lg.border').filter({
      has: page.locator('.capitalize'),
    });

    const runCount = await runItems.count();
    if (runCount > 0) {
      await expect(runItems.first()).toBeVisible();
      // Each run item should show a status badge
      const statusBadge = runItems.first().locator('[data-slot="badge"]');
      await expect(statusBadge).toBeVisible();
    } else {
      // Empty state is acceptable
      await expect(page.getByText(/no runs/i)).toBeVisible();
    }
  });
});
