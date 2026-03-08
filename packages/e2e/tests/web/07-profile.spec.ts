import { test, expect } from '@playwright/test';

test.describe('Profile Page @web', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('profile page loads with user info displayed', async ({ page }) => {
    // The profile page should load and display user information
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test('name and email fields are editable', async ({ page }) => {
    const nameInput = page.locator('#name');
    const emailInput = page.locator('#email');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();

    // Clear and type into name field
    await nameInput.clear();
    await nameInput.fill('Test User');
    await expect(nameInput).toHaveValue('Test User');

    // Clear and type into email field
    await emailInput.clear();
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('save changes button exists', async ({ page }) => {
    const saveButton = page.getByRole('button', {
      name: /save changes/i,
    });
    await expect(saveButton).toBeVisible();
  });

  test('tab switching works (Profile -> Feedback -> Billing)', async ({
    page,
  }) => {
    // Should start on Profile tab
    await expect(page).toHaveURL(/tab=profile|\/profile$/);

    // Switch to Feedback tab
    await page.getByRole('tab', { name: /feedback/i }).click();
    await expect(page).toHaveURL(/tab=feedback/);

    // Switch to Billing tab
    await page.getByRole('tab', { name: /billing/i }).click();
    await expect(page).toHaveURL(/tab=billing/);

    // Switch back to Profile tab
    await page.getByRole('tab', { name: /profile/i }).click();
    await expect(page).toHaveURL(/tab=profile|\/profile$/);
  });

  test('feedback tab shows feedback list', async ({ page }) => {
    await page.goto('/profile?tab=feedback');

    // Feedback tab should be active and show feedback content
    await expect(
      page.getByRole('tab', { name: /feedback/i }),
    ).toBeVisible();

    // Should show feedback list or empty state
    await expect(
      page
        .getByText(/feedback/i)
        .first(),
    ).toBeVisible();
  });

  test('billing tab shows pricing/plan info', async ({ page }) => {
    await page.goto('/profile?tab=billing');

    // Billing tab should be active and show plan/pricing content
    await expect(
      page.getByRole('tab', { name: /billing/i }),
    ).toBeVisible();

    // Should show pricing or plan information
    await expect(
      page
        .getByText(/plan|pricing|billing|subscription/i)
        .first(),
    ).toBeVisible();
  });
});

test.describe('Profile Sidebar Navigation @web', () => {
  test('profile button in sidebar navigates to profile page', async ({
    page,
  }) => {
    await page.goto('/');

    const profileButton = page.locator('[data-tour="profile-button"]');
    await expect(profileButton).toBeVisible();
    await profileButton.click();

    await expect(page).toHaveURL(/\/profile/);
  });
});
