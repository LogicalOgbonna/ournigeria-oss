import { test, expect } from '@playwright/test';

test.describe('System Health @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/system');
    await page.waitForLoadState('networkidle');
  });

  test('system health page loads', async ({ page }) => {
    // Page should load with system health heading or content
    await expect(
      page.getByText(/system|health|monitoring/i).first(),
    ).toBeVisible();
  });

  test('metric cards render', async ({ page }) => {
    // 4 metric cards: Requests/min, Avg Latency, Error Rate, P99 Latency
    await expect(
      page.getByText(/requests\/min|requests per minute|req\/min/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/avg latency|average latency/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/error rate/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/p99 latency|p99/i).first(),
    ).toBeVisible();
  });

  test('service status grid shows services', async ({ page }) => {
    // Service status grid (3 cols) with service cards
    // Each service shows: status icon, name, latency, uptime, status badge
    const serviceCards = page.locator('[class*="card"]');
    const cardCount = await serviceCards.count();

    // Should have at least one service card beyond metric cards
    expect(cardCount).toBeGreaterThan(0);

    // Service cards should show latency and uptime info
    await expect(
      page.getByText(/latency|ms/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/uptime/i).first(),
    ).toBeVisible();

    // Status badges (healthy, degraded, down, etc.)
    const statusBadge = page.getByText(/healthy|degraded|down|operational/i).first();
    await expect(statusBadge).toBeVisible();

    // Charts: Latency chart (line) and Error rate chart (bar)
    const charts = page.locator('.recharts-wrapper, svg.recharts-surface, [class*="chart"]');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });

  test('refresh button is present', async ({ page }) => {
    // Refresh button with RefreshCw icon
    const refreshButton = page.getByRole('button', { name: /refresh/i })
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-refresh-cw, [data-testid="refresh"]') }));
    await expect(refreshButton.first()).toBeVisible();
  });
});
