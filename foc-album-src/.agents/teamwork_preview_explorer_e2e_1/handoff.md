# E2E Test Suite Design and Setup Plan

This report details the read-only exploration and setup plan for E2E testing using **Playwright** on the FOC 2026 Album application.

---

## 1. Observations

- **Observation 1: Package Manager Selection**
  The root directory contains `pnpm-lock.yaml` (size: 31,970 bytes) and `package.json`, which specifies standard dependencies like `@supabase/supabase-js` and `jquery`. This dictates that `pnpm` must be used for dependency installation.
  
- **Observation 2: Vite Configuration Base Path**
  In `vite.config.js`, the base path is defined at lines 3–8:
  ```javascript
  export default defineConfig({
    base: '/foc-album/',
    build: {
      outDir: '../foc-album',
      emptyOutDir: true,
    },
  });
  ```
  This requires the E2E dev server target configuration to use the `/foc-album/` subpath (e.g. `http://localhost:5173/foc-album/`).

- **Observation 3: Database RPC and Table Definitions**
  In `supabase/001_schema_rls.sql`, the pending packs table is defined at lines 427–435:
  ```sql
  create table if not exists public.foc2026_pending_packs (
    id uuid default gen_random_uuid() primary key,
    player_username text not null references public.foc2026_players(username) on delete cascade,
    round_number int not null,
    opponent_name text not null,
    sticker_ids text[] not null,
    opened boolean not null default false,
    created_at timestamptz not null default now()
  );
  ```
  The single-step reporting RPC is defined at lines 463–473:
  ```sql
  create or replace function public.foc2026_submit_single_report(
    p_match_id text,
    p_houses text,
    p_my_keys int,
    p_opp_keys int,
    p_picks text,
    p_deck_name text,
    p_deck_sas int,
    p_deck_set text,
    p_deck_url text
  )
  ```
  This indicates that Supabase calls translate to standard HTTP REST requests to `**/rest/v1/foc2026_pending_packs**` and `**/rest/v1/rpc/foc2026_submit_single_report**`.

- **Observation 4: Missing Reporting Form UI**
  In `src/pages/report.js`, the function `renderSingleReportForm` is currently empty (lines 199–201):
  ```javascript
  function renderSingleReportForm(state) {
    return '';
  }
  ```
  The single-step reporting interface needs to be fully designed and implemented under this function hook.

---

## 2. Logic Chain

- **Tooling Selection**: Since `pnpm-lock.yaml` is present, the installation command for Playwright must be `pnpm add -D @playwright/test` to preserve the project's dependency lockfile integrity.
- **Base URL Targeting**: Since Vite serves the app with a base subpath of `/foc-album/` (Observation 2), the Playwright config `baseURL` must match `http://localhost:5173/foc-album/` exactly.
- **Network Interception Layer**: The app uses the client-side library `@supabase/supabase-js`. When making requests, it translates queries into POST/GET requests directed at the Supabase project domain (`vzuzwvhktwzitqhthsor.supabase.co`). Intercepting requests containing `**/rest/v1/**` allows mocking database interactions without hitting live servers.
- **DoK CORS Interception**: The DoK API fetches details via `corsproxy.io`. Playwright must mock requests directed to `**/corsproxy.io/**` and return simulated deck data to isolate tests from third-party network outages.
- **Deferred Persistence Flow**: The packet reveal flow requires that the collections table is *only* modified (via `/rpc/foc2026_open_pending_pack`) when the user clicks "Ver Álbum" at the end of the reveal animation. The E2E tests must verify this timing sequence by validating that no RPC request is fired during packet tearing/flipping and is only triggered upon clicking "Ver Álbum".

---

## 3. Caveats

- **Port Portability**: The dev server is configured to run on port `5173` in standard configurations. If port `5173` is occupied locally, Vite dynamically switches ports. The E2E runner setup assumes static port `5173` but advises configuring `reuseExistingServer: !process.env.CI` to connect if already running.
- **DoK API Errors**: The E2E suite should verify both successful deck lookups and error states (e.g. invalid URLs, network failure) to ensure error banners are correctly shown to users.

---

## 4. Conclusion

We must implement a structured Playwright testing framework as detailed below.

### A. Dependency Installation

To set up the E2E environment, execute the following commands in the workspace root:

```bash
# Install Playwright test package
pnpm add -D @playwright/test

# Install Playwright browser dependencies
pnpm exec playwright install --with-deps
```

Add these scripts to `package.json`:
```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

---

### B. Playwright Configuration (`playwright.config.js`)

Create `playwright.config.js` in the project root:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Turn off parallel runs if sharing standard test accounts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/foc-album/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173/foc-album/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

### C. Network Interception Mocks

Create a helper file at `tests/e2e/helpers/api-mocks.js` to manage network routes:

```javascript
/**
 * Setup mocks for Supabase REST/RPC and Decks of Keyforge API.
 */
export async function setupTestMocks(page, options = {}) {
  const {
    username = 'teste_1',
    isAdmin = false,
    roundNumber = 1,
    matches = [],
    collections = [],
    pendingPacks = [],
    challenges = []
  } = options;

  // 1. Mock Supabase Player Profile
  await page.route('**/rest/v1/foc2026_players*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        username,
        name: `Jogador ${username}`,
        is_admin: isAdmin,
        pack_opened: true,
        serie: 'A'
      }])
    });
  });

  // 2. Mock Active Round
  await page.route('**/rest/v1/foc2026_rounds*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        number: roundNumber,
        name: `Rodada ${roundNumber}`,
        starts_at: new Date().toISOString(),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        sas_limit: 80,
        active: true
      }])
    });
  });

  // 3. Mock Matches List
  await page.route('**/rest/v1/foc2026_matches*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(matches)
    });
  });

  // 4. Mock Player Collections
  await page.route('**/rest/v1/foc2026_collections*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(collections)
    });
  });

  // 5. Mock Pending Packs
  await page.route('**/rest/v1/foc2026_pending_packs*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pendingPacks)
      });
    } else if (method === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...payload, id: 'mock-pack-id-uuid' })
      });
    }
  });

  // 6. Mock RPC Calls
  await page.route('**/rest/v1/rpc/**', async (route) => {
    const url = route.request().url();
    if (url.includes('foc2026_open_pack') || 
        url.includes('foc2026_submit_single_report') ||
        url.includes('foc2026_open_pending_pack')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      });
    } else {
      await route.fallback();
    }
  });

  // 7. Mock DoK CORS API Proxy
  await page.route(url => url.href.includes('corsproxy.io'), async (route) => {
    const urlString = decodeURIComponent(route.request().url());
    const uuidMatch = urlString.match(/decks\/([0-9a-fA-F-]{36})/);
    
    if (uuidMatch) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deck: {
            name: "O Espetacular Cavaleiro do FOC",
            sasRating: 83,
            expansion: "COTA",
            houses: [
              { name: "Brobnar" },
              { name: "Dis" },
              { name: "Logos" }
            ]
          }
        })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: "Invalid deck UUID in query path" })
      });
    }
  });
}
```

---

### D. Detailed Test Cases (Tiers 1–4)

#### Tier 1: Smoke checks (`tests/e2e/smoke.spec.js`)
Tests app availability, authentication landing view, basic page loading, and admin console permissions access.

```javascript
import { test, expect } from '@playwright/test';
import { setupTestMocks } from './helpers/api-mocks';

test.describe('Tier 1: Smoke Checks', () => {
  test('unauthenticated user sees login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#usernameInput')).toBeVisible();
    await expect(page.locator('#loginSubmitBtn')).toBeVisible();
  });

  test('player login retrieves state and reveals shell UI', async ({ page }) => {
    await setupTestMocks(page, { username: 'teste_1' });
    await page.goto('/');
    await page.fill('#usernameInput', 'teste_1');
    await page.click('#loginSubmitBtn');
    
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.bottom-nav')).toBeVisible();
  });

  test('admin icon displays for admin player', async ({ page }) => {
    await setupTestMocks(page, { username: 'admin_user', isAdmin: true });
    await page.goto('/');
    await page.fill('#usernameInput', 'admin_user');
    await page.click('#loginSubmitBtn');

    await expect(page.locator('[data-route="admin"]')).toBeVisible();
  });
});
```

#### Tier 2: Navigation (`tests/e2e/navigation.spec.js`)
Validates client-side routing transitions.

```javascript
import { test, expect } from '@playwright/test';
import { setupTestMocks } from './helpers/api-mocks';

test.describe('Tier 2: Navigation Routing', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestMocks(page, { username: 'teste_1' });
    await page.goto('/');
    await page.fill('#usernameInput', 'teste_1');
    await page.click('#loginSubmitBtn');
  });

  test('clicking bottom nav tabs switches routes correctly', async ({ page }) => {
    // Navigate to Album page
    await page.click('.bottom-nav button[data-route="album"]');
    await expect(page).toHaveURL(/#album/);
    await expect(page.locator('.album-view')).toBeVisible();

    // Navigate to Tabela page
    await page.click('.bottom-nav button[data-route="table"]');
    await expect(page).toHaveURL(/#table/);
    await expect(page.locator('.table-view')).toBeVisible();

    // Navigate to Reporte page
    await page.click('.bottom-nav button[data-route="report"]');
    await expect(page).toHaveURL(/#report/);
    await expect(page.locator('.report-view')).toBeVisible();
  });
});
```

#### Tier 3: Match Reporting & DoK Integration (`tests/e2e/report.spec.js`)
Validates search card previews, SAS difference color coding, local error banners, and final report submission.

```javascript
import { test, expect } from '@playwright/test';
import { setupTestMocks } from './helpers/api-mocks';

test.describe('Tier 3: Match Reporting and Validation', () => {
  test.beforeEach(async ({ page }) => {
    const mockMatch = {
      id: 'r1m1',
      round_number: 1,
      player_a_username: 'teste_1',
      player_b_username: 'opponent_user',
      playerA: 'Jogador Teste 1',
      playerB: 'Jogador Adversário',
      completed: false,
      player_a_reported: false,
      player_b_reported: false
    };

    await setupTestMocks(page, {
      username: 'teste_1',
      matches: [mockMatch]
    });
    
    await page.goto('/');
    await page.fill('#usernameInput', 'teste_1');
    await page.click('#loginSubmitBtn');
    await page.click('.bottom-nav button[data-route="report"]');
  });

  test('searching valid DoK link renders deck metadata and calculated SAS badge', async ({ page }) => {
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/e3b6a22f-d890-4828-98e3-982823617300');
    await page.click('[data-action="fetchDeck"]');

    // Asserts
    await expect(page.locator('.deck-card')).toContainText('O Espetacular Cavaleiro do FOC');
    await expect(page.locator('.deck-card')).toContainText('Set: COTA');
    await expect(page.locator('.status-pill.sas-green')).toContainText('SAS 83 (-3)');
    await expect(page.locator('.house-chip >> text=BRB')).toBeVisible();
    await expect(page.locator('.house-chip >> text=DIS')).toBeVisible();
    await expect(page.locator('.house-chip >> text=LGS')).toBeVisible();
  });

  test('local validation catches invalid score ties', async ({ page }) => {
    // Fill Deck details first
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/e3b6a22f-d890-4828-98e3-982823617300');
    await page.click('[data-action="fetchDeck"]');

    // Simulate score tie: 3x3
    // Assuming adjust keys triggers are configured
    await page.click('[data-action="adjustKeys"][data-side="a"][data-amount="1"]'); // +1
    await page.click('[data-action="adjustKeys"][data-side="a"][data-amount="1"]'); // +2
    await page.click('[data-action="adjustKeys"][data-side="a"][data-amount="1"]'); // +3
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]');
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]');
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]'); // both at 3

    await expect(page.locator('.alert-box.is-error')).toContainText('Não são permitidos empates.');
    await expect(page.locator('[data-action="submitSingleReport"]')).toBeDisabled();
  });

  test('consolation behavior shown if score is 0x3', async ({ page }) => {
    // Set deck
    await page.fill('#deck-link-input', 'https://www.decksofkeyforge.com/decks/e3b6a22f-d890-4828-98e3-982823617300');
    await page.click('[data-action="fetchDeck"]');

    // Player keys = 0, opponent = 3
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]');
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]');
    await page.click('[data-action="adjustKeys"][data-side="b"][data-amount="1"]');

    await expect(page.locator('.alert-box.is-success')).toContainText('Consolação: Você fez 0 chaves e não pode solicitar figurinhas');
    await expect(page.locator('[data-action="submitSingleReport"]')).toBeEnabled();
  });
});
```

#### Tier 4: Pack Opening & Persistence (`tests/e2e/packs.spec.js`)
Validates matching user rounds, packet opening reveal flow, and deferred DB persistence verification.

```javascript
import { test, expect } from '@playwright/test';
import { setupTestMocks } from './helpers/api-mocks';

test.describe('Tier 4: Post-Match Pack Opening & Reveal Flow', () => {
  test('loading pending pack and verifying deferred database persistence', async ({ page }) => {
    const mockPendingPack = {
      id: 'a67b9389-1234-5678-abcd-ef0123456789',
      player_username: 'teste_1',
      round_number: 2,
      opponent_name: 'Jogador Adversário',
      sticker_ids: ['FOC_2', 'DIS_1', 'LGS_1'],
      opened: false
    };

    let rpcCalled = false;
    await setupTestMocks(page, {
      username: 'teste_1',
      pendingPacks: [mockPendingPack]
    });

    // Intercept RPC call to audit the moment of persistence
    await page.route('**/rest/v1/rpc/foc2026_open_pending_pack', async (route) => {
      rpcCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      });
    });

    await page.goto('/');
    await page.fill('#usernameInput', 'teste_1');
    await page.click('#loginSubmitBtn');

    // 1. Pack exists and is unopened
    await expect(page.locator('.pack-card')).toBeVisible();
    await page.click('.pack-card button'); // click Abrir

    // 2. Overlay stage shown, click wrapper to rip open
    await expect(page.locator('#revealOverlay')).toBeVisible();
    await page.click('#packWrapper');

    // 3. Flip cards one by one (indexes 0, 1, 2)
    await page.click('.flip-card[data-index="0"]');
    await page.click('.flip-card[data-index="1"]');
    await page.click('.flip-card[data-index="2"]');

    // Ensure the database has NOT been updated during card flipping
    expect(rpcCalled).toBe(false);

    // 4. Click "Ver Álbum" at the end of the reveal animation to persist
    await page.click('[data-action="goAlbum"]');

    // Assert that database integration was called
    expect(rpcCalled).toBe(true);
    await expect(page).toHaveURL(/#album/);
  });
});
```

---

### E. File Formats Specification

#### `TEST_INFRA.md` Format Template
The `TEST_INFRA.md` file should be created in the root directory and structured as follows:
```markdown
# Test Infrastructure Specification

This document details the configuration and architecture of the test suite.

## 1. Setup Instructions
- Prerequisite package manager: `pnpm`
- Installation command:
  ```bash
  pnpm add -D @playwright/test
  pnpm exec playwright install --with-deps
  ```

## 2. Directory Layout
```
tests/
├── unit/                 # Local JavaScript logic tests
│   └── validation.test.js
└── e2e/                  # Playwright E2E browser tests
    ├── helpers/
    │   └── api-mocks.js  # Supabase and CORS proxy network interceptors
    ├── smoke.spec.js     # Tier 1
    ├── navigation.spec.js# Tier 2
    ├── report.spec.js    # Tier 3
    └── packs.spec.js     # Tier 4
```

## 3. Command References
- Run all tests: `pnpm test` (unit) and `pnpm test:e2e` (E2E)
- Run with UI inspector: `pnpm test:e2e:ui`
- Debug mode: `pnpm test:e2e:debug`

## 4. API Mocking Strategy
Supabase REST endpoints (`/rest/v1/*`) and RPCs (`/rest/v1/rpc/*`) are intercepted by Playwright dynamically. Decks of Keyforge requests are also routed through the public CORS proxy mock. This ensures tests require no live backend.
```

#### `TEST_READY.md` Format Template
The `TEST_READY.md` file acts as the readiness report checklist for milestones completion:
```markdown
# Test Readiness & Quality Report

## 1. Test Verification Status
- [ ] Tier 1: Smoke checks - **Status: [PENDING/PASS]**
- [ ] Tier 2: Navigation - **Status: [PENDING/PASS]**
- [ ] Tier 3: DoK API search previews & score validations - **Status: [PENDING/PASS]**
- [ ] Tier 4: Pack opening animation & deferred persistence - **Status: [PENDING/PASS]**

## 2. Acceptance Criteria Checklist
- [ ] Clipboard URL parsing pulls UUID.
- [ ] Color badges dynamically apply correct styling classes.
- [ ] Key limits of 3 prevent illegal report scores.
- [ ] "Liberar Figurinhas" verifies matched values.
- [ ] Pending packs load and save exclusively on click.

## 3. Verification Instructions
1. Run local dev server: `pnpm dev`.
2. Execute E2E command: `pnpm test:e2e`.
3. Check generated HTML report in `./playwright-report/index.html`.
```

---

## 5. Verification Method

To verify the setup independently:
1. Ensure `pnpm-lock.yaml` is intact.
2. Verify package installation: `pnpm install` completes successfully.
3. Build check: `pnpm build` finishes without error, outputting bundles into the `../foc-album` directory.
