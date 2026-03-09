import { test, expect } from '@playwright/test';

test.describe('Conversations Page @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/conversations');
  });

  test('conversations page loads with table', async ({ page }) => {
    // The conversations table should be visible on the page
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // At least one row of data should be present
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('search is functional', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search conversations...');
    await expect(searchInput).toBeVisible();

    // Type a search query and verify the input accepts it
    await searchInput.fill('budget');
    await expect(searchInput).toHaveValue('budget');

    // Wait briefly for search results to update
    await page.waitForTimeout(1_000);

    // The table should still be visible (with filtered or no results)
    await expect(page.locator('table')).toBeVisible();
  });

  test('table has expected columns', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Check for expected column headers
    const headers = table.locator('thead th');
    await expect(headers.filter({ hasText: /title/i })).toBeVisible();
    await expect(headers.filter({ hasText: /user/i })).toBeVisible();
    await expect(headers.filter({ hasText: /messages/i })).toBeVisible();
    await expect(headers.filter({ hasText: /started/i })).toBeVisible();
    await expect(headers.filter({ hasText: /last activity/i })).toBeVisible();
  });

  test('click conversation navigates to detail', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Find the View button or link in the first row
    const firstRowViewLink = table
      .locator('tbody tr')
      .first()
      .getByRole('link', { name: /view/i })
      .or(
        table
          .locator('tbody tr')
          .first()
          .locator('a[href*="/dashboard/conversations/"]'),
      );

    await firstRowViewLink.first().click();

    // Should navigate to the conversation detail page
    await page.waitForURL(/\/dashboard\/conversations\/[\w-]+/, {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/dashboard\/conversations\/[\w-]+/);
  });

  test('detail page shows message thread', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Navigate to the first conversation's detail page
    const firstRowViewLink = table
      .locator('tbody tr')
      .first()
      .locator('a[href*="/dashboard/conversations/"]');

    await firstRowViewLink.first().click();
    await page.waitForURL(/\/dashboard\/conversations\/[\w-]+/, {
      timeout: 10_000,
    });

    // Back link (icon-only with ArrowLeft) should be present
    await expect(
      page.locator('a[href*="/dashboard/conversations"]').filter({
        has: page.locator('svg'),
      }).first(),
    ).toBeVisible();

    // Conversation title should be visible
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // User link should be present on the detail page
    await expect(
      page.locator('a[href*="/dashboard/users/"]').first(),
    ).toBeVisible();

    // Message thread area (ScrollArea) should be visible with messages
    const messageThread = page.locator(
      '[data-radix-scroll-area-viewport], [class*="scroll-area"], [class*="ScrollArea"]',
    );
    await expect(messageThread.first()).toBeVisible();

    // Flag/Unflag button should be present for messages
    const flagButton = page
      .getByRole('button', { name: /flag|unflag/i });
    await expect(flagButton.first()).toBeVisible();
  });

  test('export button has CSV and JSON options', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Navigate to the first conversation's detail page
    const firstRowViewLink = table
      .locator('tbody tr')
      .first()
      .locator('a[href*="/dashboard/conversations/"]');

    await firstRowViewLink.first().click();
    await page.waitForURL(/\/dashboard\/conversations\/[\w-]+/, {
      timeout: 10_000,
    });

    // Find and click the export dropdown trigger
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // The dropdown should show CSV and JSON options
    await expect(
      page.getByRole('menuitem', { name: /csv/i }).or(page.getByText(/csv/i)),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole('menuitem', { name: /json/i }).or(page.getByText(/json/i)),
    ).toBeVisible();
  });

  test.describe('Flagged Conversations', () => {
    test('flagged conversations show flag icon', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 10_000 });

      // Check if any flagged conversations exist (flag icon with red color)
      const flagIcons = table.locator(
        'tbody svg[class*="text-red"], tbody [class*="text-red"] svg, tbody [class*="destructive"] svg',
      );

      // This is a soft check -- flagged conversations may or may not exist
      const flagCount = await flagIcons.count();
      if (flagCount > 0) {
        await expect(flagIcons.first()).toBeVisible();
      }
    });
  });

  test.describe('Sources Section', () => {
    test('detail page shows sources with score badges', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 10_000 });

      // Navigate to the first conversation's detail page
      const firstRowViewLink = table
        .locator('tbody tr')
        .first()
        .locator('a[href*="/dashboard/conversations/"]');

      await firstRowViewLink.first().click();
      await page.waitForURL(/\/dashboard\/conversations\/[\w-]+/, {
        timeout: 10_000,
      });

      // Look for a sources section showing cited documents
      const sourcesSection = page
        .getByText(/sources/i)
        .or(page.getByText(/references/i))
        .or(page.getByText(/cited/i));

      // Sources may not always be present depending on conversation content
      const sourcesVisible = await sourcesSection.first().isVisible().catch(() => false);
      if (sourcesVisible) {
        // Score badges should appear alongside source documents
        const scoreBadges = page.locator(
          '[class*="badge"], [data-slot="badge"]',
        );
        await expect(scoreBadges.first()).toBeVisible();
      }
    });
  });
});
