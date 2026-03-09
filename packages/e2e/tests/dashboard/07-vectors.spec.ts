import { test, expect } from '@playwright/test';

test.describe('Vector Index Management @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/vectors?index=budget');
    await page.waitForLoadState('networkidle');
  });

  test('vectors page loads with index tabs', async ({ page }) => {
    // Tab navigation for vector indexes
    const budgetTab = page.getByRole('tab', { name: /budget/i })
      .or(page.locator('[role="tablist"]').getByText(/budget/i));
    await expect(budgetTab).toBeVisible();

    const corruptionTab = page.getByRole('tab', { name: /corruption/i })
      .or(page.locator('[role="tablist"]').getByText(/corruption/i));
    await expect(corruptionTab).toBeVisible();

    const govspendTab = page.getByRole('tab', { name: /govspend/i })
      .or(page.locator('[role="tablist"]').getByText(/govspend/i));
    await expect(govspendTab).toBeVisible();
  });

  test('stats cards render', async ({ page }) => {
    // 5 stat cards: Total Chunks, Documents, Total Size, Model, Dimensions
    await expect(
      page.getByText(/total chunks/i).or(page.getByText(/chunks/i).first()),
    ).toBeVisible();
    await expect(
      page.getByText(/documents/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/total size|size/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/model/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/dimensions/i).first(),
    ).toBeVisible();

    // Index details card with Table, Vector Type, Index Method, Table/Index Size
    await expect(
      page.getByText(/vector type|index method/i).first(),
    ).toBeVisible();
  });

  test('bar chart is visible', async ({ page }) => {
    // Top 10 horizontal bar chart
    const chart = page.locator('.recharts-wrapper, svg.recharts-surface, [class*="chart"]').first();
    await expect(chart).toBeVisible({ timeout: 10_000 });
  });

  test('distribution table renders', async ({ page }) => {
    // Distribution table with columns: GroupLabel, Coverage, Chunks, Documents
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Check for coverage progress bars or column headers
    const coverageElement = page.getByText(/coverage/i)
      .or(page.locator('[role="progressbar"]').first());
    await expect(coverageElement).toBeVisible();

    // Table should have rows
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('switching tabs updates content', async ({ page }) => {
    // Start on budget tab -- note the current content
    const budgetHeading = page.getByText(/budget/i).first();
    await expect(budgetHeading).toBeVisible();

    // Switch to corruption tab
    const corruptionTab = page.getByRole('tab', { name: /corruption/i })
      .or(page.locator('[role="tablist"]').getByText(/corruption/i));
    await corruptionTab.click();

    // URL should update to reflect the new index
    await page.waitForURL(/index=corruption/, { timeout: 10_000 });
    expect(page.url()).toContain('index=corruption');

    // Content should update -- stats cards should still be visible
    await expect(
      page.getByText(/total chunks|chunks/i).first(),
    ).toBeVisible();
  });
});
