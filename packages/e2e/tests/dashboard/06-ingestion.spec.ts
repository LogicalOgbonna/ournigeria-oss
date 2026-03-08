import { test, expect } from '@playwright/test';

test.describe('Ingestion Pipeline @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/ingestion');
    await page.waitForLoadState('networkidle');
  });

  test('ingestion page loads with pipeline cards', async ({ page }) => {
    // Pipeline status cards in a 2-col grid (budget, govspend, corruption)
    await expect(
      page.getByText(/budget/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/govspend/i).or(page.getByText(/gov\s?spend/i)).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/corruption/i).first(),
    ).toBeVisible();

    // Each card should show a status badge (Running, Paused, or Idle)
    const statusBadge = page.getByText(/running|paused|idle/i).first();
    await expect(statusBadge).toBeVisible();

    // Cards should show stats: Processed, Errors, Chunks
    await expect(
      page.getByText(/processed/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/errors/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/chunks/i).first(),
    ).toBeVisible();
  });

  test('recent runs table renders', async ({ page }) => {
    // Recent Runs table should be visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Table headers: Pipeline, Trigger, Files, Chunks, Duration, Started, Status, View
    const headerRow = table.locator('thead tr').first();
    await expect(headerRow.getByText(/pipeline/i)).toBeVisible();
    await expect(headerRow.getByText(/status/i)).toBeVisible();

    // Table should have at least a header row
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    // Either rows of data or an empty state within the table
    if (rowCount === 0) {
      const emptyState = page.getByText(/no runs|no data|empty/i).first();
      await expect(emptyState).toBeVisible();
    } else {
      await expect(rows.first()).toBeVisible();
    }
  });

  test('New Run button navigates to new run form', async ({ page }) => {
    const newRunButton = page.getByRole('link', { name: /new run/i })
      .or(page.getByRole('button', { name: /new run/i }));
    await expect(newRunButton).toBeVisible();

    await newRunButton.click();
    await page.waitForURL(/\/dashboard\/ingestion\/new/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard/ingestion/new');
  });

  test('new run form has pipeline select and submit', async ({ page }) => {
    await page.goto('/dashboard/ingestion/new');
    await page.waitForLoadState('networkidle');

    // Pipeline select dropdown
    const pipelineSelect = page.locator('select, [role="combobox"]').first();
    await expect(pipelineSelect).toBeVisible();

    // Start Run submit button
    const submitButton = page.getByRole('button', { name: /start run/i });
    await expect(submitButton).toBeVisible();
  });
});
