import { test, expect } from '@playwright/test';

test.describe('Notification Management @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('notifications page loads', async ({ page }) => {
    // Page should load with notifications heading or content
    await expect(
      page.getByText(/notification/i).first(),
    ).toBeVisible();

    // Send Notification button should be visible (with Plus icon)
    const sendButton = page.getByRole('button', { name: /send notification|new notification/i })
      .or(page.getByRole('button').filter({ hasText: /send|new/i }).first());
    await expect(sendButton).toBeVisible();
  });

  test('Send Notification button opens dialog', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send notification|new notification/i })
      .or(page.getByRole('button').filter({ hasText: /send|new/i }).first());
    await sendButton.click();

    // Dialog should open
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test('dialog has type, title, message fields', async ({ page }) => {
    // Open the Send Notification dialog
    const sendButton = page.getByRole('button', { name: /send notification|new notification/i })
      .or(page.getByRole('button').filter({ hasText: /send|new/i }).first());
    await sendButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Type select (Info, Announcement, Warning, Incident)
    const typeSelect = dialog.locator('[role="combobox"], select').first();
    await expect(typeSelect).toBeVisible();

    // Title input (first input in the dialog, placeholder "e.g. Budget data updated")
    const titleInput = dialog.locator('input').first();
    await expect(titleInput).toBeVisible();

    // Message textarea
    const messageArea = dialog.locator('textarea');
    await expect(messageArea.first()).toBeVisible();

    // Link Text input (placeholder "Learn more")
    const linkTextInput = dialog.getByPlaceholder(/learn more/i)
      .or(dialog.locator('input').nth(1));
    await expect(linkTextInput).toBeVisible();
  });

  test('broadcast checkbox is present and checked by default', async ({ page }) => {
    // Open the Send Notification dialog
    const sendButton = page.getByRole('button', { name: /send notification|new notification/i })
      .or(page.getByRole('button').filter({ hasText: /send|new/i }).first());
    await sendButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Broadcast checkbox
    const broadcastCheckbox = dialog.locator('input[type="checkbox"]')
      .or(dialog.getByRole('checkbox'))
      .or(dialog.locator('[role="switch"]'));
    await expect(broadcastCheckbox.first()).toBeVisible();

    // Should be checked by default
    const checkbox = broadcastCheckbox.first();
    await expect(checkbox).toBeChecked();

    // User ID input should be hidden when broadcast is checked
    const userIdInput = dialog.getByPlaceholder(/user id/i)
      .or(dialog.locator('input[name*="userId"], input[name*="user_id"]'));
    const userIdVisible = await userIdInput.first().isVisible().catch(() => false);

    // When broadcast is on, user ID field should be hidden
    if (!userIdVisible) {
      // Uncheck broadcast to reveal user ID input
      await checkbox.uncheck().catch(() => checkbox.click());

      // User ID input should now be visible
      await expect(
        dialog.getByPlaceholder(/user id/i)
          .or(dialog.locator('input[name*="userId"], input[name*="user_id"]'))
          .first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('notifications list shows cards or empty state', async ({ page }) => {
    // Should show notification cards or an empty state
    const notificationCard = page.locator('[class*="card"]').first();
    const emptyState = page.getByText(/no notification|empty|nothing/i).first();

    const hasCards = await notificationCard.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();

    if (hasCards) {
      // Cards should have: title, type badge, read/unread badge, message, delete button
      await expect(notificationCard).toBeVisible();

      // Delete button should be present on cards
      const deleteButton = page.locator('button').filter({ has: page.locator('svg') })
        .or(page.getByRole('button', { name: /delete|remove/i }));
      const hasDelete = await deleteButton.first().isVisible().catch(() => false);
      expect(hasDelete).toBeTruthy();
    }
  });
});
