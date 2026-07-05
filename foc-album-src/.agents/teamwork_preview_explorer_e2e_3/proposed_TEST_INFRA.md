# Test Infrastructure: Playwright E2E Setup

This document outlines the testing infrastructure, installation instructions, file layouts, mocking strategies, and CLI commands for the opaque-box E2E test suite using **Playwright**.

---

## 1. Installation & Dependency Setup

Since the project uses `pnpm` as its package manager (evidenced by `pnpm-lock.yaml` and `pnpm-workspace.yaml`), all test dependencies must be installed via `pnpm`.

### Commands to Run:
```bash
# 1. Install Playwright test runner as a devDependency
pnpm add -D @playwright/test

# 2. Install Playwright browser binaries and system dependencies (e.g. Chromium)
pnpm exec playwright install --with-deps chromium
```

---

## 2. Directory Layout & Configuration

The E2E test infrastructure should be structured as follows:

```
foc-album-src/
├── playwright.config.js       # Main Playwright config file
├── package.json               # Configured npm scripts for tests
└── tests/
    └── e2e/
        └── album-flow.spec.js # E2E tests for Tiers 1-4
```

### Script configuration in `package.json`
Add the following scripts to the `"scripts"` section of `package.json`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report"
```

---

## 3. Playwright Configuration (`playwright.config.js`)

The configuration starts the Vite development server dynamically for the tests and routes requests to the local instance (`http://localhost:5173`).

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
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
```

---

## 4. Opaque-Box Network Mocking Strategy

The E2E test suite bypasses the real backend by intercepting outgoing network requests. Playwright handles this via `page.route()`.

### A. Supabase REST & Table Mocking
All REST endpoints under `https://vzuzwvhktwzitqhthsor.supabase.co/rest/v1/` are mocked. Responses correspond to specific SQL schemas defined in the `supabase/` folder:
- **`GET **/foc2026_players*`**: Returns player roles, series, admin status.
- **`GET **/foc2026_rounds*`**: Returns round dates, deadliness, SAS limits.
- **`GET **/foc2026_collections*`**: Returns the stickers list.
- **`GET **/foc2026_matches*`**: Returns round matchmaking cards.
- **`GET / POST **/foc2026_pending_packs*`**: Mock retrieves or records matching pack stickers.

### B. Supabase RPC Calls
Calls to `.rpc('rpc_name')` target `https://vzuzwvhktwzitqhthsor.supabase.co/rest/v1/rpc/*` using `POST`. The tests intercept these calls to verify database updates (e.g. opening packs) and return a status code `200` with an empty JSON object.

### C. CORS Proxy to Decks of Keyforge
Requests to `https://corsproxy.io/?*` containing Decks of Keyforge URL links are intercepted to mock API returns (Deck Name, SAS score, set/expansion, and house list), preventing external network dependency and failures.

---

## 5. Execution Commands

- **Run all E2E tests in headless mode:**
  ```bash
  pnpm test:e2e
  ```

- **Run in interactive UI Mode (best for local debugging):**
  ```bash
  pnpm test:e2e:ui
  ```

- **View HTML test results report:**
  ```bash
  pnpm test:e2e:report
  ```
