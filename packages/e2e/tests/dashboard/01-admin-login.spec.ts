import { test, expect } from '@playwright/test';

test.describe('Admin Login Page @dashboard', () => {
  test('admin login page loads with form', async ({ page }) => {
    await page.goto('/login');

    // Email and password inputs should be visible
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check placeholders
    await expect(emailInput).toHaveAttribute('placeholder', 'admin@ournigeria.ng');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Enter password');
  });

  test('email and password fields accept input', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await emailInput.fill('testadmin@example.com');
    await expect(emailInput).toHaveValue('testadmin@example.com');

    await passwordInput.fill('SomePassword123');
    await expect(passwordInput).toHaveValue('SomePassword123');
  });

  test('sign in button is present', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText(/sign in/i);
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill('fake@test.com');
    await passwordInput.fill('wrongpass');
    await submitButton.click();

    // Wait for loading state to appear and resolve
    await expect(
      page.getByText(/signing in/i),
    ).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Loading state may be too fast to catch; that's okay
    });

    // Error message should appear with destructive styling
    const errorMessage = page.locator('.text-destructive');
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated access to /dashboard redirects to /login', async ({
    browser,
  }) => {
    // Use a fresh context with no stored auth state
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    await context.close();
  });
});
