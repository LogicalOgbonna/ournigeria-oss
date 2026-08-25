import { type Page, type BrowserContext, type APIRequestContext } from '@playwright/test';
import { askUser } from './prompt';

const API_URL = process.env.API_URL || 'https://spending-api.arinze.online';

/**
 * Full OTP login flow with human-in-the-loop terminal prompt.
 * For use in @human tagged tests only.
 */
export async function loginViaOTP(page: Page, phoneNumber: string) {
  await page.goto('/login');

  // Click WhatsApp tab
  const whatsappTab = page.getByRole('tab', { name: /whatsapp/i });
  await whatsappTab.click();

  // Fill phone number (strip +234 prefix, input has it built in)
  const phoneInput = page.locator('#phone');
  const localNumber = phoneNumber.replace(/^\+?234/, '');
  await phoneInput.fill(localNumber);

  // Click send verification code
  await page.getByRole('button', { name: /send verification code/i }).click();

  // Wait for OTP step (6 input boxes)
  await page.locator('input[aria-label="Digit 1"]').waitFor({ timeout: 10_000 });

  // Prompt human for OTP
  const otp = await askUser(`\nEnter the 6-digit OTP sent to ${phoneNumber}: `);

  // Fill OTP digits
  for (let i = 0; i < 6; i++) {
    await page.locator(`input[aria-label="Digit ${i + 1}"]`).fill(otp[i]);
  }

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15_000 });
}

/**
 * Inject a session cookie for automated/CI tests (no OTP needed).
 *
 * Prefers minting a fresh opaque session token (nbs_…) via the dev-only
 * /auth/dev-login endpoint — raw-UUID TEST_SESSION_COOKIE values stop
 * authenticating once LEGACY_UID_SESSIONS=false closes the migration window.
 * Falls back to TEST_SESSION_COOKIE when dev-login is unreachable (e.g. a
 * production-mode API where the endpoint isn't registered).
 */
export async function loginViaCookie(
  context: BrowserContext,
  webUrl: string,
) {
  let cookie: string | undefined;

  try {
    const res = await fetch(`${API_URL}/api/auth/dev-login`, { method: 'POST' });
    if (res.ok) {
      const setCookie = res.headers.get('set-cookie') || '';
      const match = setCookie.match(/nb_uid=([^;]+)/);
      if (match) cookie = decodeURIComponent(match[1]);
    }
  } catch {
    // dev-login unavailable — fall through to the env var
  }

  if (!cookie) cookie = process.env.TEST_SESSION_COOKIE;
  if (!cookie) {
    throw new Error(
      'Could not obtain a session: dev-login failed and TEST_SESSION_COOKIE is unset',
    );
  }

  // Expose the minted token to helpers/api.ts (same process) so API-direct
  // requests use the same session.
  process.env.TEST_SESSION_COOKIE = cookie;

  const url = new URL(webUrl);
  await context.addCookies([
    {
      name: 'nb_uid',
      value: cookie,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    },
  ]);
}

/**
 * Login to admin dashboard via API, inject cookie.
 */
export async function adminLoginViaCookie(
  context: BrowserContext,
  request: APIRequestContext,
  dashboardUrl: string,
) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
  }

  const response = await request.post(`${API_URL}/api/admin/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  }

  // Extract cookie from response headers
  const setCookieHeaders = response.headers()['set-cookie'] || '';
  const match = setCookieHeaders.match(/on_admin_session=([^;]+)/);
  if (!match) {
    throw new Error('Admin login did not return on_admin_session cookie');
  }

  const url = new URL(dashboardUrl);
  await context.addCookies([
    {
      name: 'on_admin_session',
      value: match[1],
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Fill admin login form in the browser.
 */
export async function adminLoginViaForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 10_000 });
}
