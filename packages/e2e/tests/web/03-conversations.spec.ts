import { test, expect } from '@playwright/test';

test.describe('Conversation Management @web', () => {
  // ─── Sidebar Toggle ────────────────────────────────────────────────

  test.describe('Sidebar Toggle', () => {
    test('sidebar toggle button opens and closes sidebar', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.locator('[data-tour="menu-button"]');
      const sidebar = page.locator('aside');

      // Sidebar should be off-screen initially (translated away)
      await expect(sidebar).toHaveClass(/translate-x-full/);

      // Open sidebar
      await menuButton.click();
      await expect(sidebar).not.toHaveClass(/translate-x-full/);
      await expect(sidebar).toHaveClass(/translate-x-0/);

      // The "History" heading should be visible
      await expect(
        page.getByRole('heading', { name: /history/i }),
      ).toBeVisible();

      // Close sidebar by clicking the X button inside it
      await sidebar.getByRole('button', { name: /close/i }).or(
        sidebar.locator('button').filter({ has: page.locator('.lucide-x') }),
      ).first().click();

      await expect(sidebar).toHaveClass(/translate-x-full/);
    });
  });

  // ─── Tests that require a conversation ─────────────────────────────

  test.describe('With Conversation', () => {
    // These tests send a real message and wait for the AI response,
    // which can take a while.
    test.slow();

    /**
     * Helper: send a message and wait for the assistant response to finish.
     * Returns the textarea locator for convenience.
     */
    async function sendMessageAndWait(page: import('@playwright/test').Page, message: string) {
      const textarea = page.locator('textarea');
      await textarea.fill(message);

      const sendButton = page.locator('button').filter({ has: page.locator('.lucide-arrow-up') });
      await sendButton.click();

      // Wait for loading to finish — the send button shows a spinner (Loader2)
      // while loading, then switches back to ArrowUp when done.
      // We wait for the streaming to complete by waiting for the assistant
      // message bubble to appear (role="assistant" content).
      await expect(
        page.locator('.lucide-loader-2'),
      ).toBeHidden({ timeout: 120_000 });

      // Give the conversation list a moment to refresh
      await page.waitForTimeout(1_000);
    }

    test('after sending a message, conversation appears in sidebar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const testMessage = 'What is the budget for Lagos State education in 2024?';
      await sendMessageAndWait(page, testMessage);

      // URL should have changed to /{conversationId}
      await expect(page).not.toHaveURL('/');

      // Open the sidebar
      await page.locator('[data-tour="menu-button"]').click();
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/translate-x-0/);

      // At least one conversation should be listed in the sidebar
      const conversationItems = sidebar.locator('[role="button"]');
      await expect(conversationItems.first()).toBeVisible({ timeout: 10_000 });

      // The active conversation should have a visible title
      const firstConvTitle = conversationItems.first().locator('p').first();
      await expect(firstConvTitle).not.toBeEmpty();
    });

    test('clicking a conversation in sidebar loads it', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Send a message to create a conversation
      await sendMessageAndWait(page, 'How much did Nigeria allocate to health in 2023?');

      // Record the conversation URL
      const firstConversationUrl = page.url();

      // Start a new chat via the header button
      const newChatHeaderButton = page.locator('[data-tour="new-chat-button"]');
      await newChatHeaderButton.click();

      // Should be back at root
      await expect(page).toHaveURL('/');

      // Send another message to create a second conversation
      await sendMessageAndWait(page, 'What are the top corruption cases in Nigeria?');

      const secondConversationUrl = page.url();
      expect(secondConversationUrl).not.toBe(firstConversationUrl);

      // Open sidebar and click the first (older) conversation
      await page.locator('[data-tour="menu-button"]').click();
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/translate-x-0/);

      const conversationItems = sidebar.locator('[role="button"]');
      // The list shows newest first, so the older conversation is second
      const olderConversation = conversationItems.nth(1);
      await expect(olderConversation).toBeVisible({ timeout: 10_000 });
      await olderConversation.click();

      // The sidebar should close after selection
      await expect(sidebar).toHaveClass(/translate-x-full/);

      // The URL should now reflect the first conversation
      await expect(page).toHaveURL(new RegExp(firstConversationUrl.replace(/.*\//, '/')));

      // Messages from the first conversation should be visible
      await expect(
        page.getByText(/health/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    test('"New chat" button clears current conversation and shows WelcomeHero', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Send a message to start a conversation
      await sendMessageAndWait(page, 'What is FAAC allocation for Kano State?');

      // Verify we have messages visible
      await expect(page.getByText(/FAAC|Kano/i).first()).toBeVisible();

      // The "New chat" button in the sidebar
      await page.locator('[data-tour="menu-button"]').click();
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/translate-x-0/);

      const newChatButton = sidebar.getByRole('button', { name: /new chat/i });
      await expect(newChatButton).toBeVisible();
      await newChatButton.click();

      // Sidebar should close
      await expect(sidebar).toHaveClass(/translate-x-full/);

      // URL should be back to root
      await expect(page).toHaveURL('/');

      // WelcomeHero should be visible — it contains "OurNigeria" heading
      await expect(
        page.locator('h1').filter({ hasText: /OurNigeria/i }).or(
          page.getByText(/try asking/i),
        ).first(),
      ).toBeVisible({ timeout: 10_000 });

      // The previous messages should no longer be visible
      await expect(
        page.locator('textarea'),
      ).toBeVisible();
    });

    test('delete conversation removes it from sidebar', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Send a message to create a conversation
      await sendMessageAndWait(page, 'What is the education budget for Ogun State?');

      // Open sidebar
      await page.locator('[data-tour="menu-button"]').click();
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/translate-x-0/);

      // Get the conversation list before deletion
      const conversationItems = sidebar.locator('[role="button"]');
      await expect(conversationItems.first()).toBeVisible({ timeout: 10_000 });
      const countBefore = await conversationItems.count();

      // Get the title of the first conversation for identification
      const firstTitle = await conversationItems.first().locator('p').first().textContent();

      // Find and click the delete button (Trash2 icon) on the first conversation
      const deleteButton = conversationItems.first().locator('button[title="Delete conversation"]');
      await deleteButton.click({ force: true });

      // The button title should change to "Click again to delete"
      const confirmButton = conversationItems.first().locator('button[title="Click again to delete"]');
      await expect(confirmButton).toBeVisible({ timeout: 3_000 });

      // Confirm deletion by clicking again
      await confirmButton.click();

      // Wait for the conversation to be removed
      await page.waitForTimeout(1_000);

      // If we had only one conversation, the empty state should show
      if (countBefore === 1) {
        await expect(
          sidebar.getByText(/no conversations yet/i),
        ).toBeVisible({ timeout: 10_000 });
      } else {
        // The deleted conversation title should no longer be in the list
        const remaining = sidebar.locator('[role="button"]');
        const newCount = await remaining.count();
        expect(newCount).toBeLessThan(countBefore);

        // Verify the deleted conversation's title is gone
        if (firstTitle) {
          await expect(
            sidebar.getByText(firstTitle, { exact: true }),
          ).toBeHidden({ timeout: 5_000 });
        }
      }
    });

    test('conversation title reflects message content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const testMessage = 'How much did Rivers State spend on infrastructure in 2024?';
      await sendMessageAndWait(page, testMessage);

      // Open sidebar
      await page.locator('[data-tour="menu-button"]').click();
      const sidebar = page.locator('aside');
      await expect(sidebar).toHaveClass(/translate-x-0/);

      // Get the most recent conversation's title (first in list)
      const conversationItems = sidebar.locator('[role="button"]');
      await expect(conversationItems.first()).toBeVisible({ timeout: 10_000 });

      const titleElement = conversationItems.first().locator('p').first();
      const title = await titleElement.textContent();

      // The title should be non-empty and relate to the message content.
      // Typically the API generates a title from the first message — it should
      // contain at least one keyword from the query.
      expect(title).toBeTruthy();
      expect(title!.length).toBeGreaterThan(0);

      // The title is generated by the AI, so we check it contains at least one
      // relevant keyword from the message (case-insensitive).
      const keywords = ['rivers', 'infrastructure', 'spend', 'state', '2024', 'budget'];
      const titleLower = title!.toLowerCase();
      const hasRelevantKeyword = keywords.some((kw) => titleLower.includes(kw));
      expect(
        hasRelevantKeyword,
        `Expected title "${title}" to contain at least one of: ${keywords.join(', ')}`,
      ).toBe(true);
    });
  });
});
