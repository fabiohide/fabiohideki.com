import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/api-mocks.js';

test.describe('Tier 4: Pack Opening & Deferred Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user and setup pending pack
    await setupMocks(page, {
      username: 'fabio_hideki',
      name: 'Fábio Hideki',
      isAdmin: false,
      packOpened: true,
      pendingPacks: [
        {
          id: 'pending-pack-uuid-123',
          player_username: 'fabio_hideki',
          round_number: 2,
          opponent_name: 'Flávio',
          sticker_ids: ['DIS 0', 'BRB 0'],
          opened: false
        }
      ]
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('foc_username', 'fabio_hideki');
    });
  });

  test('4.1: Custom Post-Match Header & 4.2/4.3: Deferred database persistence verification', async ({ page }) => {
    // Track if RPC is called
    let openPendingPackCalled = false;
    let openPendingPackPayload = null;

    page.on('request', (request) => {
      if (request.url().includes('foc2026_open_pending_pack') && request.method() === 'POST') {
        openPendingPackCalled = true;
        try {
          openPendingPackPayload = request.postDataJSON();
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // 1. Go to Packs page
    await page.goto('/foc-album/#packs');

    // Assert pending pack is visible by checking button with correct data-value
    const openPackBtn = page.locator('button[data-action="openPack"][data-value="pending-pack-uuid-123"]');
    await expect(openPackBtn).toBeVisible();

    // 2. Open the pack
    await openPackBtn.click();

    // Verify reveal overlay is loaded
    const revealOverlay = page.locator('#revealOverlay');
    await expect(revealOverlay).toBeVisible();

    // 3. Rip the pack
    const packWrapper = page.locator('#packWrapper');
    await expect(packWrapper).toBeVisible();
    await packWrapper.click();

    // Wait for the rip animation to finish and Phase 2 header to load
    await expect(revealOverlay).toHaveClass(/state-revealing/, { timeout: 5000 });
    const revealHeader = page.locator('.reveal-header h2');
    await expect(revealHeader).toBeVisible();

    // Assert custom header content
    await expect(revealHeader).toHaveText('Rodada 2 - Fábio Hideki vs Flávio');

    // 4. Flip the cards one by one
    const flipCards = page.locator('.reveal-cards-grid .flip-card');
    await expect(flipCards).toHaveCount(2);

    // Verify no RPC call has happened yet
    expect(openPendingPackCalled).toBe(false);

    // Click first card to flip it
    await flipCards.nth(0).click();
    await expect(flipCards.nth(0)).toHaveClass(/is-flipped/);

    // Click second card to flip it
    await flipCards.nth(1).click();
    await expect(flipCards.nth(1)).toHaveClass(/is-flipped/);

    // Verify still no RPC call has happened
    expect(openPendingPackCalled).toBe(false);

    // 5. Click "Ver álbum" and check database persistence trigger
    const verAlbumBtn = page.locator('.reveal-actions button[data-action="goAlbum"]');
    await expect(verAlbumBtn).toBeVisible();

    // Set up request promise to catch the call
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('foc2026_open_pending_pack') && request.method() === 'POST'
    );

    await verAlbumBtn.click();

    // Wait for the network request to be fired
    const request = await requestPromise;
    expect(request).not.toBeNull();
    expect(openPendingPackCalled).toBe(true);
    expect(openPendingPackPayload).toEqual({ p_pack_id: 'pending-pack-uuid-123' });

    // Verify redirection to Album page
    await expect(page).toHaveURL(/.*#album/);
  });
});
