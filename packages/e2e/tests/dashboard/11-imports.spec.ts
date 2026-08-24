import { test, expect } from '@playwright/test';

test.describe('Data imports @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/imports');
    await page.waitForLoadState('networkidle');
  });

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Data imports' })).toBeVisible();
  });

  test('lists the three curated dataset importers', async ({ page }) => {
    await expect(page.getByText('Party profiles')).toBeVisible();
    await expect(page.getByText('Party officers')).toBeVisible();
    await expect(page.getByText('Party candidates (primary winners)')).toBeVisible();
  });
});
