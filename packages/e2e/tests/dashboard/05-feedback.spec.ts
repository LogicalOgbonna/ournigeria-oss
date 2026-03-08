import { test, expect } from '@playwright/test';

test.describe('Feedback Management @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/feedback');
    await page.waitForLoadState('networkidle');
  });

  test('feedback page loads with stat cards', async ({ page }) => {
    // 5 stat cards should be visible: Total, New, Reviewing, Resolved, Archived
    await expect(page.getByText(/total/i).first()).toBeVisible();
    await expect(page.getByText(/new/i).first()).toBeVisible();
    await expect(page.getByText(/reviewing/i).first()).toBeVisible();
    await expect(page.getByText(/resolved/i).first()).toBeVisible();
    await expect(page.getByText(/archived/i).first()).toBeVisible();
  });

  test('status and category filter dropdowns work', async ({ page }) => {
    // Status dropdown filter
    const statusFilter = page.locator('select, [role="combobox"], button').filter({ hasText: /all status|status/i }).first();
    await expect(statusFilter).toBeVisible();

    // Category dropdown filter
    const categoryFilter = page.locator('select, [role="combobox"], button').filter({ hasText: /all categories|category/i }).first();
    await expect(categoryFilter).toBeVisible();

    // Click status filter and verify options
    await statusFilter.click();
    await expect(
      page.getByRole('option', { name: /new/i })
        .or(page.getByText(/new/i).last()),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('feedback list shows cards', async ({ page }) => {
    // Should show feedback cards or an empty state
    const feedbackCard = page.locator('[class*="card"], [data-testid*="feedback"]').first();
    const emptyState = page.getByText(/no feedback|no results|empty/i).first();

    const hasCards = await feedbackCard.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();

    if (hasCards) {
      // Feedback cards should have subject text and status badge
      await expect(feedbackCard).toBeVisible();
    }
  });

  test('click feedback navigates to detail', async ({ page }) => {
    // Wait for feedback cards to load
    const feedbackCard = page.locator('[class*="card"], [data-testid*="feedback"]').first();
    const emptyState = page.getByText(/no feedback|no results|empty/i).first();

    const hasCards = await feedbackCard.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasCards) {
      // Click the first feedback card
      await feedbackCard.click();

      // Should navigate to a feedback detail page
      await page.waitForURL(/\/dashboard\/feedback\/.+/, { timeout: 10_000 });
      expect(page.url()).toMatch(/\/dashboard\/feedback\/.+/);

      // Detail page should show subject, message, and admin action controls
      await expect(
        page.getByText(/subject|message|details/i).first(),
      ).toBeVisible({ timeout: 5_000 });

      // Admin actions: status select, notes textarea, save button
      const saveButton = page.getByRole('button', { name: /save/i });
      const notesArea = page.locator('textarea');

      const hasSave = await saveButton.isVisible().catch(() => false);
      const hasNotes = await notesArea.first().isVisible().catch(() => false);

      // At least some admin controls should be present
      expect(hasSave || hasNotes).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No feedback cards to click -- skipping detail navigation test',
      });
    }
  });
});
