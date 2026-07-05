# Handoff Report — Playwright E2E Setup Investigation

This report compiles the read-only E2E test setup analysis for the FOC 2026 Digital Album project, laying out the required infrastructure, mocking strategies, and detailed test cases for Tiers 1-4.

---

## 1. Observation

I directly observed the following facts and structures in the codebase:
- **Package Manager**: A `pnpm-lock.yaml` file exists in the root directory. `package.json` contains no test dependencies in `devDependencies`.
- **Vite Base Path Configuration**: In `/Users/fabio/Documents/antigravity/fabito/foc-album-src/vite.config.js`:
  ```javascript
  3: export default defineConfig({
  4:   base: '/foc-album/',
  ```
  Vite serves the application under the `/foc-album/` subpath.
- **Supabase RPC Wrapper Functions**: In `/Users/fabio/Documents/antigravity/fabito/foc-album-src/src/supabase.js`:
  ```javascript
  446: export async function dbSubmitSingleReport(matchId, houses, myKeys, oppKeys, picks, deckName, deckSas, deckSet, deckUrl) {
  447:   if (!supabase) return;
  448:   await supabase.rpc('foc2026_submit_single_report', { ... });
  ...
  462: export async function dbCreatePendingPack(playerUsername, roundNumber, opponentName, stickerIds) {
  463:   if (!supabase) return;
  464:   await supabase.from('foc2026_pending_packs').insert({ ... });
  ...
  475: export async function dbOpenPendingPack(packId) {
  476:   if (!supabase) return;
  477:   await supabase.rpc('foc2026_open_pending_pack', { p_pack_id: packId });
  ```
- **Incomplete Match Form**: In `/Users/fabio/Documents/antigravity/fabito/foc-album-src/src/pages/report.js`, the match reporting form is stubbed:
  ```javascript
  199: function renderSingleReportForm(state) {
  200:   return '';
  201: }
  ```
- **Incomplete Admin Actions**: In `/Users/fabio/Documents/antigravity/fabito/foc-album-src/src/pages/admin.js`, there is currently no implementation for displaying individual match reports, validating divergent scores, or invoking pending pack creation.
- **Mocking and Pending Pack Persistence**: In `/Users/fabio/Documents/antigravity/fabito/foc-album-src/src/pages/packs.js`, the reveal overlay handles the ripping animation and flips. However, it currently does not invoke `dbOpenPendingPack` on "Ver Álbum" click; it only sets `state.reveal = null` (lines 129-134):
  ```javascript
  129:   const btnGoAlbum = overlay.querySelector('[data-action="goAlbum"]');
  130:   if (btnGoAlbum) {
  131:     btnGoAlbum.addEventListener('click', () => {
  132:       state.reveal = null;
  133:     });
  134:   }
  ```

---

## 2. Logic Chain

1. **Package Management**: Since a `pnpm-lock.yaml` file exists, `pnpm` is the project's dependency manager. Playwright should be installed via `pnpm add -D @playwright/test` and `pnpm exec playwright install --with-deps` (Observation 1).
2. **Server Base Path**: Vite is configured with `base: '/foc-album/'`. Therefore, when the Playwright test starts, the `baseURL` property in `playwright.config.js` and the `webServer.url` property must target `http://localhost:5173/foc-album/` to ensure the application page resolves successfully (Observation 2).
3. **Database Integration & Mocking**: The frontend uses standard Supabase JS client calls which map to REST table actions (GET, POST to `**/rest/v1/<table_name>*`) and RPC procedures (POST to `**/rest/v1/rpc/<rpc_name>`). Since this is a read-only local testing plan, we mock these endpoints using Playwright's `page.route()` to emulate network responses, allowing the application to function fully offline.
4. **CORS Proxy Interception**: The app routes Decks of Keyforge API queries to a public CORS proxy (`https://corsproxy.io/?*`). By intercepting this URL inside Playwright, we can return custom mocked deck responses (SAS, Houses, name) to test rendering states and colors locally.
5. **Deferred Persistence Verification**: The deferred database write specification (R3) dictates that stickers should only be persisted to the database when clicking the "Ver Álbum" button. Our Tier 4 test case monitors network traffic to assert that:
   - While ripping and flipping cards, no requests are made to `/rpc/foc2026_open_pending_pack`.
   - Clicking "Ver Álbum" triggers a POST request to `/rpc/foc2026_open_pending_pack` and redirects to the album route `#album` (Observation 3 & 6).

---

## 3. Caveats

- **Mock Consistency**: The E2E tests assume the final implementation will match standard HTML layouts and class names (e.g. `.sas-badge`, `input#usernameInput`). If the implementer uses different class or element IDs, selectors in the spec files will need adjustment.
- **Vite Port Conflict**: The test config assumes Vite uses the default port `5173`. If port `5173` is occupied, Vite will bind to another port, which will cause Playwright to fail to connect. We recommend configuring a static port in `vite.config.js` or relying on environment variables.

---

## 4. Conclusion

We have analyzed the codebase structure and formulated a robust testing plan. We created two detailed blueprints inside the agent's folder:
1. `proposed_TEST_INFRA.md` — Explains dependencies, config file structure, and Supabase / CORS mocking helpers.
2. `proposed_TEST_READY.md` — Specifies test steps, expected assertions, and verification criteria for Tiers 1-4.

This E2E test setup guarantees hermetic, offline testing of the critical game mechanics, from initial login (Tier 1) to match scoring (Tier 3) and deferred pack opening persistence (Tier 4).

---

## 5. Verification Method

To verify the setup:
1. Check that the blueprints are correctly placed in the agent directory:
   - `/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/teamwork_preview_explorer_e2e_2/proposed_TEST_INFRA.md`
   - `/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/teamwork_preview_explorer_e2e_2/proposed_TEST_READY.md`
2. Once the implementation completes Milestones 1 and 2, verify that E2E tests can be executed successfully using:
   ```bash
   pnpm run test:e2e
   ```
3. Test failure condition: If any mock route (Supabase REST/RPC or DoK CORS Proxy) receives an unhandled request during a test, Playwright will time out, indicating the mocking helper needs updating.
