import { test, expect } from '@playwright/test';

test.describe('Users Page @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/users');
  });

  test('users page loads with table', async ({ page }) => {
    // The users table should be visible on the page
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // At least one row of data should be present
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('search input is present and functional', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by name, phone, email...');
    await expect(searchInput).toBeVisible();

    // The search input should have left padding for the icon
    await expect(searchInput).toHaveClass(/pl-9/);

    // Type a search query and verify the input accepts it
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');

    // Wait briefly for search results to update
    await page.waitForTimeout(1_000);

    // The table should still be visible (with filtered or no results)
    await expect(page.locator('table')).toBeVisible();
  });

  test('user table has expected columns', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Check for expected column headers
    const headers = table.locator('thead th');
    await expect(headers.filter({ hasText: /user/i })).toBeVisible();
    await expect(headers.filter({ hasText: /phone/i })).toBeVisible();
    await expect(headers.filter({ hasText: /status/i })).toBeVisible();
    await expect(headers.filter({ hasText: /last seen/i })).toBeVisible();
    await expect(headers.filter({ hasText: /conversations/i })).toBeVisible();
  });

  test('pagination controls are present', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Page indicator text should be visible (e.g., "Page 1 of 5")
    await expect(
      page.getByText(/page \d+ of \d+/i),
    ).toBeVisible();

    // Previous and Next buttons should be present (icon-only buttons with chevrons)
    const paginationButtons = page.locator('button[variant="outline"], button').filter({
      has: page.locator('svg.lucide-chevron-left, svg.lucide-chevron-right'),
    });
    const paginationCount = await paginationButtons.count();
    expect(paginationCount).toBeGreaterThanOrEqual(2);
  });

  test('click user row navigates to detail page', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Find the View button (eye icon) in the first row's Actions column
    const firstRowViewButton = table
      .locator('tbody tr')
      .first()
      .getByRole('link', { name: /view/i })
      .or(
        table
          .locator('tbody tr')
          .first()
          .locator('a[href*="/dashboard/users/"]'),
      );

    await firstRowViewButton.first().click();

    // Should navigate to the user detail page
    await page.waitForURL(/\/dashboard\/users\/[\w-]+/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/dashboard\/users\/[\w-]+/);
  });

  test('user detail page shows stats and tabs', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10_000 });

    // Navigate to the first user's detail page
    const firstRowViewLink = table
      .locator('tbody tr')
      .first()
      .locator('a[href*="/dashboard/users/"]');

    await firstRowViewLink.first().click();
    await page.waitForURL(/\/dashboard\/users\/[\w-]+/, { timeout: 10_000 });

    // Back button (icon-only link with ArrowLeft) should be present
    await expect(
      page.locator('a[href*="/dashboard/users"]').filter({
        has: page.locator('svg'),
      }).first(),
    ).toBeVisible();

    // Stats cards should be displayed in a grid
    const statsGrid = page.locator('[class*="grid-cols"]');
    await expect(statsGrid.first()).toBeVisible();

    // Contact info badges should be present
    const badges = page.locator('[class*="badge"], [data-slot="badge"]');
    await expect(badges.first()).toBeVisible();

    // Tabs should be visible with expected tab names
    const conversationsTab = page.getByRole('tab', { name: /conversations/i });
    const memoriesTab = page.getByRole('tab', { name: /memories/i });
    const analyticsTab = page.getByRole('tab', { name: /analytics/i });

    await expect(conversationsTab).toBeVisible();
    await expect(memoriesTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();
  });

  test.describe('Status & Actions', () => {
    test('status badge displays Active or Banned', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 10_000 });

      // At least one status badge should be visible in the table
      const statusBadge = table
        .locator('tbody')
        .getByText(/active|banned/i)
        .first();
      await expect(statusBadge).toBeVisible();
    });

    test('ban button is present in actions column', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 10_000 });

      // The ban button should have destructive styling
      const banButton = table
        .locator('tbody tr')
        .first()
        .getByRole('button', { name: /ban/i });

      // Ban or Unban button should be present
      const actionButton = banButton.or(
        table
          .locator('tbody tr')
          .first()
          .getByRole('button', { name: /unban/i }),
      );
      await expect(actionButton.first()).toBeVisible();
    });
  });
});
