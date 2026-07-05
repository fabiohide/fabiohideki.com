# E2E Test Suite Setup & Plan Handoff Report

This report outlines the analysis and E2E test plan for the FOC Album application. Since this is a read-only investigation, the proposed files (`playwright.config.js`, `TEST_INFRA.md`, `TEST_READY.md`, and `e2e_tests.spec.js`) have been written to the agent's folder `/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/teamwork_preview_explorer_e2e_3/` for copying by the implementer.

---

## 1. Observation

I directly observed the following characteristics and configuration items in the project workspace:

* **Package Manager and Scripts (`package.json`)**:
  - The project utilizes `pnpm` as its package manager, as shown by `pnpm-lock.yaml` in the root.
  - The dev script in `package.json` (lines 6-10) is defined as:
    ```json
    "scripts": {
      "dev": "vite --host 0.0.0.0",
      "build": "vite build && cp ../foc-album/index.html ../foc-album/404.html",
      "preview": "vite preview --host 0.0.0.0"
    }
    ```
  - The project does not currently have any testing dependencies configured.

* **Supabase Configuration & Client (`src/supabase.js`)**:
  - The client is initialized globally (lines 9-16) depending on env availability:
    ```javascript
    export let supabase = url && anonKey ? createClient(url, anonKey, { ... }) : null;
    export const hasSupabaseConfig = Boolean(supabase);
    ```
  - If config is present, `fetchFullState(username)` issues parallel requests to load players, rounds, matches, collections, and pending packs.

* **Routing and Initial Views (`src/main.js`)**:
  - The login panel is bypassed unless `hasSupabaseConfig` is active (lines 880-884):
    ```javascript
    if (hasSupabaseConfig && !localStorage.getItem('foc_username')) {
      app.innerHTML = renderLoginView();
      initLoginEvents();
      return;
    }
    ```
  - Actions like route switching (`setRoute`), reporting matches, and opening packs update local state and execute Supabase queries if config exists.

* **Match Reporting UI (`src/pages/report.js`)**:
  - Currently, `renderSingleReportForm` is stubbed out as an empty string (lines 199-201):
    ```javascript
    function renderSingleReportForm(state) {
      return '';
    }
    ```
  - Pre-match accordion elements use `<details>` and `<summary>` wrappers (lines 135-151).

* **Supabase RPC Signatures (`supabase/002_single_report.sql`)**:
  - The function `foc2026_submit_single_report` accepts 5 arguments:
    ```sql
    create or replace function public.foc2026_submit_single_report(
      p_match_id text,
      p_houses text[],
      p_my_keys int,
      p_opp_keys int,
      p_picks text[]
    )
    ```

---

## 2. Logic Chain

1. **Test Runner Dependency**: Since the repository uses `pnpm` and contains no test scripts, Playwright must be installed as a devDependency via `pnpm add -D @playwright/test`.
2. **Server Integration**: The Playwright configuration must start Vite dynamically using the `webServer` block pointing to `pnpm dev` and listening on port `5173`.
3. **Opaque-Box Interception**: Since the app connects to the Supabase URL (`https://vzuzwvhktwzitqhthsor.supabase.co`) via standard PostgREST requests, the E2E suite can mock all backend interactions in a database-independent manner by intercepting `**/rest/v1/**` endpoints.
4. **Proxy Mocking**: The Decks of Keyforge integration targets the proxy URL `https://corsproxy.io/?*`. Intercepting this pattern using regex route matching allows simulated responses (name, SAS score, expansion, houses) to populate form previews.
5. **Tiered Coverage**:
   - **Tier 1 (Smoke)** handles application loads, login presentation, and privileges-based dashboard views.
   - **Tier 2 (Navigation)** handles bottom menu route changes and history hash synchronization.
   - **Tier 3 (Forms & Validations)** tests link entry, DoK mock parsing, SAS badge logic (color codes based on thresholds against standard reference 86), local validation limits (keys 0-3, no ties, winner gets 3 keys), consolation messages (3x0 score), and picks.
   - **Tier 4 (Deferred persistence)** tests pending pack loading, animation header formatting, and verifying that the database write RPC is strictly deferred until "Ver Álbum" is clicked.

---

## 3. Caveats

* **CSS / DOM Selectors**: Since elements for M2 (report form, deck search) are not yet implemented in `report.js`, the selectors used in E2E tests (`#dokUrlInput`, `#btnSubmitSingleReport`, etc.) are proposed specifications. The implementer must match these selectors when building the HTML in M2.
* **Environment Variables**: Tests assume Vite runs on port `5173`. If port conflicts happen, port settings in both the webServer config and test files must be adapted.

---

## 4. Conclusion

A complete, robust E2E test infrastructure setup has been designed.
I have created the following proposed integration files inside my agent directory (`/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/teamwork_preview_explorer_e2e_3/`):
1. **`proposed_playwright.config.js`**: Setup to auto-start Vite dev server on port 5173.
2. **`proposed_e2e_tests.spec.js`**: Standard Playwright tests covering Tiers 1-4.
3. **`proposed_TEST_INFRA.md`**: Configuration guide and CLI commands.
4. **`proposed_TEST_READY.md`**: Checklist, scope definition, and invalidation rules.

---

## 5. Verification Method

The implementation can be verified using the following steps once the proposed files are moved to their target directories:

1. **Install Playwright**:
   ```bash
   pnpm add -D @playwright/test
   pnpm exec playwright install --with-deps chromium
   ```
2. **Run E2E Suite**:
   ```bash
   pnpm exec playwright test
   ```
3. **Audit**:
   - Ensure the dev server fires up on port `5173`.
   - Confirm that all 4 tiers of tests execute successfully.
   - Verify that no actual write calls hit the remote database during tests by checking the interception logs.
