import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.WEB_URL || 'https://spending.arinze.online';
const DASHBOARD_URL =
  process.env.DASHBOARD_URL || 'https://spending-dashboard.arinze.online';
const AWANAIJA_URL =
  process.env.AWANAIJA_URL || 'https://ounigeria.arinze.online';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // --- Setup ---
    {
      name: 'web-auth-setup',
      testMatch: /web\.setup\.ts/,
    },
    {
      name: 'dashboard-auth-setup',
      testMatch: /dashboard\.setup\.ts/,
    },

    // --- Web App Tests ---
    {
      name: 'web-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_URL,
        storageState: '.auth/web-user.json',
      },
      testMatch: /tests\/web\/.+\.spec\.ts/,
      dependencies: ['web-auth-setup'],
    },
    {
      name: 'web-mobile',
      use: {
        ...devices['Pixel 5'],
        baseURL: WEB_URL,
        storageState: '.auth/web-user.json',
      },
      testMatch: /tests\/web\/.+\.spec\.ts/,
      // Only run login tests on mobile to keep suite fast
      testIgnore: /0[2-9]|10/,
      dependencies: ['web-auth-setup'],
    },

    // --- Awanaija (landing app) Tests ---
    {
      name: 'awanaija-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: AWANAIJA_URL,
        // Runs logged-OUT: no auth storageState. The anonymous proposal flow
        // must succeed without a session, so we explicitly clear any state.
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /tests\/awanaija\/.+\.spec\.ts/,
    },

    // --- Dashboard Tests ---
    {
      name: 'dashboard-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: DASHBOARD_URL,
        storageState: '.auth/admin-user.json',
      },
      testMatch: /tests\/dashboard\/.+\.spec\.ts/,
      dependencies: ['dashboard-auth-setup'],
    },
  ],

  timeout: 30_000,
  expect: { timeout: 10_000 },
});
