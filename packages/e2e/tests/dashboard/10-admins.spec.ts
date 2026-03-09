import { test, expect } from '@playwright/test';

test.describe('Admin Management @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admins');
    await page.waitForLoadState('networkidle');
  });

  test('admins page loads with admin list', async ({ page }) => {
    // Page should load with admins heading or content
    await expect(
      page.getByText(/admin/i).first(),
    ).toBeVisible();

    // Should show admin cards or a list
    const adminCard = page.locator('[class*="card"]').first();
    const emptyState = page.getByText(/no admins|empty/i).first();

    const hasCards = await adminCard.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();

    if (hasCards) {
      // Admin cards should show name and email information
      await expect(adminCard).toBeVisible();
    }
  });

  test('Add Admin button opens dialog', async ({ page }) => {
    // Add Admin button with UserPlus icon
    const addButton = page.getByRole('button', { name: /add admin/i })
      .or(page.getByRole('button').filter({ hasText: /add admin/i }));
    await expect(addButton).toBeVisible();

    await addButton.click();

    // Dialog should open
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
  });

  test('dialog has name, email, password fields', async ({ page }) => {
    // Open the Add Admin dialog
    const addButton = page.getByRole('button', { name: /add admin/i })
      .or(page.getByRole('button').filter({ hasText: /add admin/i }));
    await addButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Name input
    const nameInput = dialog.locator('input[name*="name"], input#name, input[placeholder*="ame"]').first();
    await expect(nameInput).toBeVisible();

    // Email input (type="email")
    const emailInput = dialog.locator('input[type="email"], input[name*="email"], input#email').first();
    await expect(emailInput).toBeVisible();

    // Password input (type="password")
    const passwordInput = dialog.locator('input[type="password"], input[name*="password"], input#password').first();
    await expect(passwordInput).toBeVisible();

    // Cancel and Create buttons
    const cancelButton = dialog.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();

    const createButton = dialog.getByRole('button', { name: /create/i });
    await expect(createButton).toBeVisible();
  });

  test('admin cards display admin info', async ({ page }) => {
    // Admin cards should show: ShieldCheck icon, name, email badge, created date, last login, delete button
    const adminCards = page.locator('[class*="card"]');
    const cardCount = await adminCards.count();

    if (cardCount > 0) {
      const firstCard = adminCards.first();

      // Card should contain an email (look for @ symbol or email-like text)
      await expect(
        firstCard.getByText(/@/).or(firstCard.locator('[class*="badge"]')).first(),
      ).toBeVisible();

      // Card should show created date or last login info
      await expect(
        firstCard.getByText(/created|joined|last login|ago/i).first(),
      ).toBeVisible();

      // Delete button should be present
      const deleteButton = firstCard.getByRole('button', { name: /delete|remove/i })
        .or(firstCard.locator('button').filter({ has: firstCard.locator('svg') }).last());
      const hasDelete = await deleteButton.isVisible().catch(() => false);
      expect(hasDelete).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'No admin cards found -- skipping card detail assertions',
      });
    }
  });
});
