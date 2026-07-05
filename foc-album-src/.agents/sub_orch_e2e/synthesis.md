# E2E Test Setup Synthesis

Based on the reports from E2E Explorer 1 (`66634757-586e-4e43-a02e-b6fa46ddce68`) and E2E Explorer 2 (`fbbb02f8-452e-4608-8c7a-8d1ac6f56ffe`), here is the consolidated implementation plan.

## Consensus Findings

1. **Package Manager**: Use `pnpm` (since `pnpm-lock.yaml` is present in the root).
2. **Vite Configuration**: Vite serves the application under the `/foc-album/` subpath. Thus, the `playwright.config.js` `baseURL` and `webServer.url` must be `http://localhost:5173/foc-album/`.
3. **Mocks Strategy**:
   - Intercept Supabase REST requests (`**/rest/v1/**`) and RPCs.
   - Intercept Decks of Keyforge requests to `corsproxy.io` to ensure hermetic and offline tests.
   - Mock player login, active rounds, match list, collections, and pending packs.
4. **Deferred Persistence Verification (Tier 4)**: Ensure `foc2026_open_pending_pack` RPC is only called when clicking "Ver Álbum" at the end of the reveal animation, and not during the ripping/flipping stages.
5. **Test Layout**:
   - `tests/e2e/helpers/api-mocks.js`
   - `tests/e2e/smoke.spec.js` (Tier 1)
   - `tests/e2e/navigation.spec.js` (Tier 2)
   - `tests/e2e/report.spec.js` (Tier 3)
   - `tests/e2e/packs.spec.js` (Tier 4)
6. **Documentation**:
   - `TEST_INFRA.md` at project root.
   - `TEST_READY.md` at project root.

## Worker Action Plan

1. Install Playwright and browser dependencies using `pnpm`.
2. Configure `playwright.config.js` at root.
3. Update `package.json` scripts section to add `"test:e2e"`, `"test:e2e:ui"`, `"test:e2e:debug"`.
4. Implement the test files under `tests/e2e/` (helpers, smoke, navigation, report, packs).
5. Create `TEST_INFRA.md` and `TEST_READY.md` in the project root.
6. Verify the setup using `pnpm exec playwright test --list` to check that the tests are successfully discovered and the config is valid.
