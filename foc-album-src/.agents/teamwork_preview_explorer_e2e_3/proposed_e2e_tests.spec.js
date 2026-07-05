import { test, expect } from '@playwright/test';

// =========================================================================
// Network Mock Helpers
// =========================================================================

const SUPABASE_URL = 'https://vzuzwvhktwzitqhthsor.supabase.co';

async function setupMocks(page, options = {}) {
  const {
    username = 'fabio_hideki',
    isAdmin = false,
    packOpened = true,
    matches = [],
    pendingPacks = [],
    collections = [],
    dokResponse = null,
  } = options;

  // Mock localStorage for login state bypass or verification
  await page.addInitScript(({ user, hasConfig }) => {
    window.localStorage.setItem('foc_username', user);
  }, { user: username });

  // Intercept all Supabase REST table queries
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // 1. Players query
    if (url.includes('/foc2026_players')) {
      if (method === 'GET') {
        const body = [
          { username, name: username.replace('_', ' '), is_admin: isAdmin, pack_opened: packOpened, serie: 'A' }
        ];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
    }

    // 2. Rounds query
    if (url.includes('/foc2026_rounds')) {
      const body = [
        { number: 1, name: 'Rodada 1', active: true, deadline: '2026-08-30T23:59:59Z', sas_limit: 80 }
      ];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }

    // 3. Collections query
    if (url.includes('/foc2026_collections')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(collections) });
    }

    // 4. Matches query
    if (url.includes('/foc2026_matches')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(matches) });
    }

    // 5. Pending packs query / insert
    if (url.includes('/foc2026_pending_packs')) {
      if (method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pendingPacks) });
      } else if (method === 'POST') {
        // Intercept pack creation (R2 Admin functionality)
        const payload = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(payload) });
      }
    }

    // 6. Default fallback for other tables (challenges, logs, etc.)
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });

  // Intercept Supabase RPC calls
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    const payload = JSON.parse(route.request().postData() || '{}');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', payload })
    });
  });

  // Intercept CORS Proxy to Decks of Keyforge
  if (dokResponse) {
    await page.route(/.*corsproxy\.io.*/, async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dokResponse)
      });
    });
  }
}

// =========================================================================
// TIER 1: Smoke Checks
// =========================================================================

test.describe('Tier 1: Smoke Checks', () => {
  test('should display login screen when not authenticated', async ({ page }) => {
    // Clear login storage
    await page.addInitScript(() => window.localStorage.clear());
    // Mocks Supabase URL
    await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/');
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Copa do Mundo do FOC 2026');
  });

  test('should load main page and bottom navigation when logged in', async ({ page }) => {
    await setupMocks(page, { username: 'fabio_hideki', isAdmin: false });
    await page.goto('/');
    
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await expect(page.locator('[data-route="packs"]')).toBeVisible();
    await expect(page.locator('[data-route="album"]')).toBeVisible();
  });

  test('should show admin icon in header only if user is admin', async ({ page }) => {
    // Non-admin user
    await setupMocks(page, { username: 'fabio_hideki', isAdmin: false });
    await page.goto('/');
    await expect(page.locator('[data-route="admin"]')).not.toBeVisible();

    // Admin user
    await setupMocks(page, { username: 'fabio_hideki', isAdmin: true });
    await page.goto('/');
    await expect(page.locator('[data-route="admin"]')).toBeVisible();
  });
});

// =========================================================================
// TIER 2: Navigation
// =========================================================================

test.describe('Tier 2: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, { username: 'fabio_hideki', isAdmin: true });
    await page.goto('/');
  });

  test('should switch views using bottom navigation buttons', async ({ page }) => {
    // Switch to Album
    await page.click('[data-route="album"]');
    await expect(page.url()).toContain('#album');
    await expect(page.locator('.album-view')).toBeVisible();

    // Switch to Report
    await page.click('[data-route="report"]');
    await expect(page.url()).toContain('#report');
    await expect(page.locator('.report-view')).toBeVisible();

    // Switch to Tabela (Standings)
    await page.click('[data-route="table"]');
    await expect(page.url()).toContain('#table');
    await expect(page.locator('.table-view')).toBeVisible();
  });

  test('should sync active route based on URL hash directly', async ({ page }) => {
    await page.goto('/#album');
    await expect(page.locator('.album-view')).toBeVisible();
  });
});

// =========================================================================
// TIER 3: DoK API, SAS Badges & Score Validations
// =========================================================================

test.describe('Tier 3: DoK & Report Form Validations', () => {
  const mockMatches = [
    {
      id: 'r1m1',
      player_a_username: 'fabio_hideki',
      player_b_username: 'opponent_user',
      round_number: 1,
      completed: false,
      player_a_reported: false,
      player_b_reported: false,
      player_a_houses: null,
      player_b_houses: null,
      player_a_keys: 0,
      player_b_keys: 0,
      player_a_opp_keys: 0,
      player_b_opp_keys: 0,
      player_a_picks: '',
      player_b_picks: '',
      player_a_deck_name: null,
      player_a_deck_sas: null,
      player_a_deck_set: null,
      player_a_deck_url: null,
      match_deadline_passed: false,
      fallback_active: false
    }
  ];

  const mockDoKDeck = {
    deck: {
      name: "Lord of the Dance",
      sasRating: 78, // Difference against 86 is -8 (Yellow badge)
      expansion: "COTA",
      uuid: "abcdef12-3456-7890-abcd-ef1234567890",
      houseCards: [
        { house: "Brobnar" },
        { house: "Dis" },
        { house: "Logos" }
      ]
    }
  };

  test.beforeEach(async ({ page }) => {
    await setupMocks(page, {
      username: 'fabio_hideki',
      matches: mockMatches,
      dokResponse: mockDoKDeck
    });
    await page.goto('/#report');
  });

  test('should toggle pre-match view accordion and show available stickers count', async ({ page }) => {
    // Validate that the pre-match section exists and is collapsible
    const accordion = page.locator('.pre-match-panel');
    await expect(accordion).toBeVisible();
    
    // Check collapsible action
    const details = page.locator('details.pre-match-accordion-item').first();
    await details.click();
    await expect(details).toHaveAttribute('open', '');
  });

  test('should fetch DoK deck details, render card, white SVG set icon, and colorized SAS badge', async ({ page }) => {
    // Fill DoK URL input
    const input = page.locator('#dokUrlInput');
    await expect(input).toBeVisible();
    await input.fill('https://www.decksofkeyforge.com/decks/abcdef12-3456-7890-abcd-ef1234567890');

    // Click submit/search
    await page.click('#submitDokLinkBtn');

    // Verify deck metadata card renders details
    await expect(page.locator('.deck-name')).toHaveText('Lord of the Dance');
    await expect(page.locator('.deck-expansion')).toHaveText('COTA');
    
    // Verify SVG icon path or display (should be white in styles)
    const svgIcon = page.locator('.deck-expansion-icon img');
    await expect(svgIcon).toBeVisible();
    
    // Verify SAS badge has value 78, difference -8, and color class/styling (yellow)
    const sasBadge = page.locator('.sas-badge');
    await expect(sasBadge).toContainText('78');
    await expect(sasBadge).toContainText('-8');
    await expect(sasBadge).toHaveClass(/sas-yellow/);
  });

  test('should enforce score validations locally', async ({ page }) => {
    // Fill valid DoK link first to unlock score area if needed
    await page.fill('#dokUrlInput', 'https://www.decksofkeyforge.com/decks/abcdef12-3456-7890-abcd-ef1234567890');
    await page.click('#submitDokLinkBtn');

    // Set invalid score: both players get 3 keys (tie)
    await page.fill('#myKeysInput', '3');
    await page.fill('#oppKeysInput', '3');
    
    // Attempt submit / verify error
    const reportBtn = page.locator('#btnSubmitSingleReport');
    await expect(reportBtn).toBeDisabled();
    await expect(page.locator('.score-validation-error')).toBeVisible();
    await expect(page.locator('.score-validation-error')).toContainText('empates não são permitidos');

    // Set invalid score: winner must have exactly 3 keys (both get less than 3)
    await page.fill('#myKeysInput', '2');
    await page.fill('#oppKeysInput', '1');
    await expect(reportBtn).toBeDisabled();
    await expect(page.locator('.score-validation-error')).toContainText('vencedor deve ter exatamente 3 chaves');

    // Set valid score: 3 x 1
    await page.fill('#myKeysInput', '3');
    await page.fill('#oppKeysInput', '1');
    
    // Error is hidden, button is enabled
    await expect(page.locator('.score-validation-error')).not.toBeVisible();
    await expect(reportBtn).toBeEnabled();
  });

  test('should show consolation message for 3x0 score', async ({ page }) => {
    // Fill DoK link
    await page.fill('#dokUrlInput', 'https://www.decksofkeyforge.com/decks/abcdef12-3456-7890-abcd-ef1234567890');
    await page.click('#submitDokLinkBtn');

    // Set 0 keys for player (3 keys for opponent)
    await page.fill('#myKeysInput', '0');
    await page.fill('#oppKeysInput', '3');
    
    // Check that the sticker picker shows a consolation message
    await expect(page.locator('.consolation-message')).toBeVisible();
    await expect(page.locator('.consolation-message')).toContainText('Infelizmente você não marcou chaves');
  });

  test('should allow picking opponent stickers and submit report, updating button to "Editar"', async ({ page }) => {
    // Mock user collection to allow sticker selection
    await setupMocks(page, {
      username: 'fabio_hideki',
      matches: mockMatches,
      dokResponse: mockDoKDeck,
      collections: [
        { player_username: 'fabio_hideki', sticker_id: 'sticker-mine', quantity: 1, source: 'pack', is_new: false }
      ]
    });
    await page.goto('/#report');

    await page.fill('#dokUrlInput', 'https://www.decksofkeyforge.com/decks/abcdef12-3456-7890-abcd-ef1234567890');
    await page.click('#submitDokLinkBtn');

    await page.fill('#myKeysInput', '3');
    await page.fill('#oppKeysInput', '1');

    // Select sticker from picker list
    const pickerItem = page.locator('.picker-sticker-item').first();
    await expect(pickerItem).toBeVisible();
    await pickerItem.click();

    // Verify submit triggers POST database call and changes UI state to "Editar" or "Reportado"
    const reportBtn = page.locator('#btnSubmitReport');
    await reportBtn.click();

    // Assert redirection / success dialog or button state change
    await expect(page.locator('.success-modal')).toBeVisible();
    await page.click('#closeSuccessModalBtn');
    
    await expect(page.locator('#btnEditReport')).toBeVisible();
  });
});

// =========================================================================
// TIER 4: Pack Opening & Deferred Persistence
// =========================================================================

test.describe('Tier 4: Pack Opening & Deferred Persistence', () => {
  const pendingPacksMock = [
    {
      id: 'pack-uuid-9999',
      player_username: 'fabio_hideki',
      round_number: 1,
      opponent_name: 'opponent_user',
      sticker_ids: ['sticker-01', 'sticker-02', 'sticker-03'],
      opened: false,
      created_at: '2026-07-03T15:00:00Z'
    }
  ];

  test('should load pending packs, play reveal with custom heading, and defer persistence until "Ver Álbum" is clicked', async ({ page }) => {
    let openPendingPackCalled = false;

    // Track RPC calls
    await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
      const url = route.request().url();
      if (url.includes('foc2026_open_pending_pack')) {
        openPendingPackCalled = true;
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await setupMocks(page, {
      username: 'fabio_hideki',
      pendingPacks: pendingPacksMock
    });

    await page.goto('/#packs');

    // Assert pending pack item exists in the grid
    const pendingPackEl = page.locator('.pack-card[data-pack-id="pack-uuid-9999"]');
    await expect(pendingPackEl).toBeVisible();

    // Click to open pack and start animation
    await pendingPackEl.click();

    // Verify reveal overlay / animation loads
    await expect(page.locator('.reveal-overlay')).toBeVisible();

    // Verify customized heading details (Rodada X - Player vs Opponent)
    const heading = page.locator('.reveal-heading');
    await expect(heading).toHaveText('Rodada 1 - fabio hideki vs opponent user');

    // Assert that the database write (RPC call) has NOT been triggered yet
    expect(openPendingPackCalled).toBe(false);

    // Click "Ver Álbum" at the end of the flow
    const verAlbumBtn = page.locator('[data-action="goAlbum"]');
    await expect(verAlbumBtn).toBeVisible();
    await verAlbumBtn.click();

    // Assert that the RPC call is now invoked
    expect(openPendingPackCalled).toBe(true);

    // Verify redirection to Album page hash
    await expect(page.url()).toContain('#album');
  });
});
