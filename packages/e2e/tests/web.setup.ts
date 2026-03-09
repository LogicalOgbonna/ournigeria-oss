import { test as setup } from '@playwright/test';
import { loginViaCookie } from '../helpers/auth';

const WEB_URL = process.env.WEB_URL || 'https://spending.arinze.online';
const AUTH_FILE = '.auth/web-user.json';

setup('authenticate web user', async ({ browser }) => {
  const context = await browser.newContext();
  await loginViaCookie(context, WEB_URL);

  // Verify the session is valid by loading the home page
  const page = await context.newPage();
  await page.goto(WEB_URL);
  await page.waitForURL(WEB_URL + '/**', { timeout: 10_000 });

  // Save auth state
  await context.storageState({ path: AUTH_FILE });
  await context.close();
});
