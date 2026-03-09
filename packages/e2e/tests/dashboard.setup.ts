import { test as setup } from '@playwright/test';
import { adminLoginViaCookie } from '../helpers/auth';

const DASHBOARD_URL =
  process.env.DASHBOARD_URL || 'https://spending-dashboard.arinze.online';
const AUTH_FILE = '.auth/admin-user.json';

setup('authenticate admin user', async ({ browser, request }) => {
  const context = await browser.newContext();
  await adminLoginViaCookie(context, request, DASHBOARD_URL);

  // Verify the session is valid
  const page = await context.newPage();
  await page.goto(DASHBOARD_URL + '/dashboard');
  await page.waitForURL('**/dashboard**', { timeout: 10_000 });

  // Save auth state
  await context.storageState({ path: AUTH_FILE });
  await context.close();
});
