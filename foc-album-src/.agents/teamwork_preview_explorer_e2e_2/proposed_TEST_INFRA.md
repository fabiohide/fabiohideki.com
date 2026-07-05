# TEST_INFRA.md — Testing Infrastructure Setup

This document describes the E2E testing infrastructure setup using Playwright, including dependencies, server configuration, network mocking strategies, and commands to run tests.

---

## 1. Installation and Dependencies

The project uses `pnpm` as its package manager. To set up Playwright and its browser binaries, run the following commands:

```bash
# 1. Install Playwright test runner as a development dependency
pnpm add -D @playwright/test

# 2. Install Playwright browser binaries (Chromium, Firefox, WebKit) and OS-level dependencies
pnpm exec playwright install --with-deps
```

---

## 2. Playwright Configuration (`playwright.config.js`)

Create a `playwright.config.js` in the project root directory. Since the Vite server runs with a base path of `/foc-album/` (defined in `vite.config.js`), the Playwright `baseURL` must point to `http://localhost:5173/foc-album/`.

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/foc-album/',
    trace: 'on-first-retry',
    viewport: { width: 375, height: 667 }, // Default to mobile viewport for testing app shell
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173/foc-album/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## 3. Network Mocking Strategy (Supabase and CORS Proxy)

To run E2E tests in a hermetic environment without a live database or internet connection, Playwright's network routing API (`page.route`) is used to mock API endpoints.

### 3.1. Supabase REST and RPC Mocking Helper
Define a helper `tests/e2e/helpers/supabase-mock.js` to intercept Supabase client calls:

```javascript
/**
 * Sets up Playwright page route interceptions for Supabase API endpoints.
 */
export async function mockSupabaseState(page, customState = {}) {
  const defaultState = {
    username: 'fabio_hideki',
    name: 'Fábio Hideki',
    isAdmin: true,
    packOpened: true,
    activeRound: { number: 1, name: 'Rodada 1', active: true, sasLimit: 80, deadline: new Date(Date.now() + 86400000).toISOString() },
    collections: [
      { player_username: 'fabio_hideki', sticker_id: 'BRB 0', quantity: 1 },
      { player_username: 'fabio_hideki', sticker_id: 'DIS 0', quantity: 1 }
    ],
    challenges: [
      { id: 'c1', title: 'Deck SAS abaixo do limite', desc: 'Vencer com deck cujo SAS seja 5 ou mais abaixo do limite da rodada', completed: false, pending_validation: false, player_username: 'fabio_hideki' }
    ],
    matches: [
      { id: 'r1m1', round_number: 1, player_a_username: 'fabio_hideki', player_b_username: 'flavio_ciampone', player_a_reported: false, player_b_reported: false }
    ],
    pendingPacks: []
  };

  const state = { ...defaultState, ...customState };

  // Intercept foc2026_players GET
  await page.route(/\/rest\/v1\/foc2026_players\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        username: state.username,
        name: state.name,
        is_admin: state.isAdmin,
        pack_opened: state.packOpened
      }])
    });
  });

  // Intercept foc2026_rounds GET
  await page.route(/\/rest\/v1\/foc2026_rounds\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([state.activeRound])
    });
  });

  // Intercept foc2026_collections GET
  await page.route(/\/rest\/v1\/foc2026_collections\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.collections)
    });
  });

  // Intercept foc2026_challenges GET
  await page.route(/\/rest\/v1\/foc2026_challenges\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.challenges)
    });
  });

  // Intercept foc2026_matches GET
  await page.route(/\/rest\/v1\/foc2026_matches\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.matches)
    });
  });

  // Intercept foc2026_pending_packs GET
  await page.route(/\/rest\/v1\/foc2026_pending_packs\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.pendingPacks)
    });
  });

  // Default fallback for other GET requests
  await page.route(/\/rest\/v1\/.*/, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      await route.continue();
    }
  });
}
```

### 3.2. Decks of Keyforge (DoK) CORS Proxy Mocking
To mock the asynchronous retrieval of deck specifications via `corsproxy.io`:

```javascript
/**
 * Sets up route interception for the Decks of KeyForge CORS Proxy.
 */
export async function mockDecksOfKeyforge(page) {
  await page.route('https://corsproxy.io/?*', async (route) => {
    const urlString = route.request().url();
    const queryParamIndex = urlString.indexOf('?');
    const targetUrl = queryParamIndex !== -1 ? decodeURIComponent(urlString.substring(queryParamIndex + 1)) : '';
    
    let name = 'Deck do Campeão FOC';
    let sas = 80;
    let expansion = 'Mass Mutation';
    let houses = ['Brobnar', 'Dis', 'Logos'];

    if (targetUrl.includes('high-sas')) {
      sas = 85;
      name = 'Deck Apelão do FOC';
    } else if (targetUrl.includes('low-sas')) {
      sas = 72;
      name = 'Deck Fraco de Treino';
    } else if (targetUrl.includes('mid-sas')) {
      sas = 79;
      name = 'Deck Equilibrado';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name,
        sas,
        expansion,
        houses: houses.map(h => ({ name: h }))
      })
    });
  });
}
```

---

## 4. How to Run E2E Tests

Add the following scripts to `package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

Execute them using `pnpm`:

```bash
# Run tests in headless mode
pnpm run test:e2e

# Run tests in UI interactive mode
pnpm run test:e2e:ui

# Debug tests step-by-step
pnpm run test:e2e:debug
```
