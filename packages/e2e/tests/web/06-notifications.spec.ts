import { test, expect } from '@playwright/test';

test.describe('Notification System @web', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure the page is fully loaded and authenticated
    await page.waitForLoadState('networkidle');
  });

  test.describe('Notification Bell', () => {
    test('notification bell icon is visible in header', async ({ page }) => {
      const bell = page.locator('[data-tour="notification-center"]');
      await expect(bell).toBeVisible();
    });

    test('clicking bell opens notification dropdown', async ({ page }) => {
      const bell = page.locator('[data-tour="notification-center"]');
      await bell.click();

      // The dropdown/popover should appear after clicking
      const dropdown = page.locator('[role="dialog"], [role="menu"], [data-radix-popper-content-wrapper], [data-state="open"]').first();
      await expect(dropdown).toBeVisible({ timeout: 5_000 });
    });

    test('notification dropdown contains content (list or empty state)', async ({
      page,
    }) => {
      const bell = page.locator('[data-tour="notification-center"]');
      await bell.click();

      // Should show either notification items or an empty state message
      const hasNotifications = page.locator('[data-radix-popper-content-wrapper], [data-state="open"]').first();
      await expect(hasNotifications).toBeVisible({ timeout: 5_000 });

      const notificationItems = page.getByRole('listitem').or(
        page.getByText(/no notification|you're all caught up|nothing here|empty/i).first(),
      );
      await expect(notificationItems.first()).toBeVisible({ timeout: 5_000 });
    });

    test('"Mark all read" button is present when notifications exist', async ({
      page,
    }) => {
      const bell = page.locator('[data-tour="notification-center"]');
      await bell.click();

      // Wait for dropdown to open
      await page.locator('[data-radix-popper-content-wrapper], [data-state="open"]').first().waitFor({ timeout: 5_000 });

      // If there are notifications, a "Mark all read" button should be present.
      // If the dropdown shows an empty state instead, skip gracefully.
      const markAllRead = page.getByRole('button', { name: /mark all read|mark all as read/i });
      const emptyState = page.getByText(/no notification|you're all caught up|nothing here|empty/i).first();

      const hasMarkAllRead = await markAllRead.isVisible().catch(() => false);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      // At least one of these should be true: either we have the button or an empty state
      expect(hasMarkAllRead || hasEmptyState).toBeTruthy();

      if (hasMarkAllRead) {
        await expect(markAllRead).toBeEnabled();
      }
    });

    test('dropdown can be closed by clicking outside', async ({ page }) => {
      const bell = page.locator('[data-tour="notification-center"]');
      await bell.click();

      // Wait for dropdown to appear
      const dropdown = page.locator('[data-radix-popper-content-wrapper], [data-state="open"]').first();
      await expect(dropdown).toBeVisible({ timeout: 5_000 });

      // Click outside the dropdown (e.g., on the main page body area)
      await page.locator('body').click({ position: { x: 10, y: 10 } });

      // Dropdown should no longer be visible
      await expect(dropdown).toBeHidden({ timeout: 5_000 });
    });
  });

  test.describe('System Banners', () => {
    test('system banners display at top of page when active', async ({
      page,
    }) => {
      // System banners are conditionally rendered; they may or may not be present.
      // Check if any banner element exists at the top of the page.
      const banner = page.locator('[role="alert"], [role="banner"], [data-testid="system-banner"]').first();

      const bannerVisible = await banner.isVisible().catch(() => false);

      if (bannerVisible) {
        // Verify the banner is near the top of the page
        const boundingBox = await banner.boundingBox();
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          // Banner should be within the top portion of the viewport
          expect(boundingBox.y).toBeLessThan(200);
        }

        // If the banner is dismissible, it should have a close button
        const dismissButton = banner.locator('button').filter({ hasText: /close|dismiss|×/i }).or(
          banner.locator('[aria-label="Close"], [aria-label="Dismiss"]'),
        );
        const isDismissible = await dismissButton.first().isVisible().catch(() => false);

        if (isDismissible) {
          await dismissButton.first().click();
          await expect(banner).toBeHidden({ timeout: 5_000 });
        }
      } else {
        // No active system banner — this is acceptable; the test still passes
        test.info().annotations.push({
          type: 'info',
          description: 'No active system banner found — skipping banner assertions',
        });
      }
    });
  });
});
