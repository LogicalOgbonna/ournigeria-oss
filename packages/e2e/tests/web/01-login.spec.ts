import { test, expect } from '@playwright/test';
import { askUser } from '../../helpers/prompt';
import { loginViaOTP } from '../../helpers/auth';

const TEST_PHONE = process.env.TEST_PHONE_NUMBER || '8012345678';

test.describe('Login Page @web', () => {
  // ─── Automated tests ───────────────────────────────────────────────

  test.describe('Branding & Layout', () => {
    test('login page loads with correct branding', async ({ page }) => {
      await page.goto('/login');

      // Page should contain the project branding
      await expect(
        page.getByText(/ournigeria/i).first(),
      ).toBeVisible();
    });
  });

  test.describe('WhatsApp Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      // Switch to WhatsApp tab
      await page.getByRole('tab', { name: /whatsapp/i }).click();
    });

    test('shows phone input with +234 prefix', async ({ page }) => {
      const phoneInput = page.locator('#phone');
      await expect(phoneInput).toBeVisible();

      // The +234 prefix should be displayed somewhere near the input
      await expect(page.getByText('+234')).toBeVisible();
    });

    test('"Send verification code" button disabled when input empty', async ({
      page,
    }) => {
      const phoneInput = page.locator('#phone');
      await phoneInput.clear();

      const sendButton = page.getByRole('button', {
        name: /send verification code/i,
      });
      await expect(sendButton).toBeDisabled();
    });

    test('"Send verification code" button enabled when phone entered', async ({
      page,
    }) => {
      const phoneInput = page.locator('#phone');
      await phoneInput.fill('8012345678');

      const sendButton = page.getByRole('button', {
        name: /send verification code/i,
      });
      await expect(sendButton).toBeEnabled();
    });

    test('invalid phone number shows validation error', async ({ page }) => {
      const phoneInput = page.locator('#phone');
      // Enter a clearly invalid short number
      await phoneInput.fill('123');

      const sendButton = page.getByRole('button', {
        name: /send verification code/i,
      });
      await sendButton.click();

      // Expect some form of validation error to appear
      await expect(
        page.getByText(/invalid|valid phone|too short|enter a valid/i).first(),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Auth Redirect', () => {
    test('unauthenticated user redirected to /login from /', async ({
      browser,
    }) => {
      // Use a fresh context with no stored auth state
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.waitForURL(/\/login/, { timeout: 10_000 });
      expect(page.url()).toContain('/login');

      await context.close();
    });
  });

  test.describe('Telegram Tab', () => {
    test('shows Telegram login option', async ({ page }) => {
      await page.goto('/login');

      const telegramTab = page.getByRole('tab', { name: /telegram/i });
      await expect(telegramTab).toBeVisible();
      await telegramTab.click();

      // Telegram tab should contain an iframe or Telegram-related content
      await expect(
        page
          .locator('iframe')
          .or(page.getByText(/telegram/i).nth(1)),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  // ─── Human-in-the-loop tests ───────────────────────────────────────

  test.describe('OTP Flow @human', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /whatsapp/i }).click();
    });

    test('submitting valid phone sends OTP and transitions to OTP step', async ({
      page,
    }) => {
      test.skip(!!process.env.CI, 'Requires human OTP intervention');

      const phoneInput = page.locator('#phone');
      const localNumber = TEST_PHONE.replace(/^\+?234/, '');
      await phoneInput.fill(localNumber);

      await page
        .getByRole('button', { name: /send verification code/i })
        .click();

      // Should transition to the OTP step with 6 digit inputs
      await expect(
        page.locator('input[aria-label="Digit 1"]'),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator('input[aria-label="Digit 6"]'),
      ).toBeVisible();
    });

    test('"Change number" link returns to phone step', async ({ page }) => {
      test.skip(!!process.env.CI, 'Requires human OTP intervention');

      const phoneInput = page.locator('#phone');
      const localNumber = TEST_PHONE.replace(/^\+?234/, '');
      await phoneInput.fill(localNumber);

      await page
        .getByRole('button', { name: /send verification code/i })
        .click();

      // Wait for OTP step
      await page
        .locator('input[aria-label="Digit 1"]')
        .waitFor({ timeout: 10_000 });

      // Click "Change number" link
      await page.getByText(/change number/i).click();

      // Phone input should be visible again
      await expect(page.locator('#phone')).toBeVisible();
    });

    test('entering correct OTP completes login and redirects to /', async ({
      page,
    }) => {
      test.skip(!!process.env.CI, 'Requires human OTP intervention');

      await loginViaOTP(page, `+234${TEST_PHONE.replace(/^\+?234/, '')}`);

      // loginViaOTP already waits for redirect to /
      expect(page.url()).not.toContain('/login');
    });

    test('resend cooldown timer shows', async ({ page }) => {
      test.skip(!!process.env.CI, 'Requires human OTP intervention');

      const phoneInput = page.locator('#phone');
      const localNumber = TEST_PHONE.replace(/^\+?234/, '');
      await phoneInput.fill(localNumber);

      await page
        .getByRole('button', { name: /send verification code/i })
        .click();

      // Wait for OTP step
      await page
        .locator('input[aria-label="Digit 1"]')
        .waitFor({ timeout: 10_000 });

      // Resend cooldown timer should be visible (shows seconds countdown)
      await expect(
        page.getByText(/resend|(\d+\s*s)/i).first(),
      ).toBeVisible({ timeout: 5_000 });
    });

    test('entering wrong OTP shows error message', async ({ page }) => {
      test.skip(!!process.env.CI, 'Requires human OTP intervention');

      const phoneInput = page.locator('#phone');
      const localNumber = TEST_PHONE.replace(/^\+?234/, '');
      await phoneInput.fill(localNumber);

      await page
        .getByRole('button', { name: /send verification code/i })
        .click();

      // Wait for OTP step
      await page
        .locator('input[aria-label="Digit 1"]')
        .waitFor({ timeout: 10_000 });

      // Enter an obviously wrong OTP
      for (let i = 1; i <= 6; i++) {
        await page.locator(`input[aria-label="Digit ${i}"]`).fill('0');
      }

      // Wait for an error message to appear
      await expect(
        page
          .getByText(/invalid|incorrect|wrong|expired|try again/i)
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
