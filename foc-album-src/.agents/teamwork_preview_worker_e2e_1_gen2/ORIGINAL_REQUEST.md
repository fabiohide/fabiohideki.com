## 2026-07-03T21:56:41Z

You are E2E Worker 2 (replacement for Worker 1). Your task is to set up Playwright E2E testing infrastructure and write the test cases for Tiers 1-4.
Specifically, perform the following:
1. Install Playwright and browser dependencies:
   - Use `pnpm add -D @playwright/test` and `pnpm exec playwright install --with-deps` (since pnpm-lock.yaml is present).
2. Configure `playwright.config.js` in the project root:
   - It should use baseURL and webServer url pointing to `http://localhost:5173/foc-album/` (since Vite has base path `/foc-album/`).
   - WebServer command should be `pnpm dev`.
3. Add the following scripts to `package.json`:
   - "test:e2e": "playwright test"
   - "test:e2e:ui": "playwright test --ui"
   - "test:e2e:debug": "playwright test --debug"
4. Create the test suite under `tests/e2e/`:
   - `tests/e2e/helpers/api-mocks.js` - implementing the Mocking helpers for Supabase API endpoints (`**/rest/v1/**` and REST RPC calls) and Decks of Keyforge (`https://corsproxy.io/?*`).
   - `tests/e2e/smoke.spec.js` - Tier 1: Smoke checks (unauthenticated user sees login form, login, admin icon check).
   - `tests/e2e/navigation.spec.js` - Tier 2: Route navigation checks (clicking bottom nav tabs switches routes correctly).
   - `tests/e2e/report.spec.js` - Tier 3: Match reporting & DoK integration validations (search Valid DoK link renders deck metadata and calculated SAS badge, local validations like invalid score ties, consolation behaviour when score is 0x3).
   - `tests/e2e/packs.spec.js` - Tier 4: E2E match reporting & pack opening reveal flow with deferred database persistence verification (auditing that `/rpc/foc2026_open_pending_pack` is NOT called during ripping/flipping, but IS called upon clicking 'Ver Álbum' which redirects to `#album`).
5. Publish `TEST_INFRA.md` and `TEST_READY.md` in the project root using the templates proposed by the Explorers.
6. Verify the setup:
   - Run `pnpm exec playwright test --list` and document the output.
   - Run `pnpm build` to verify the build process is not broken.
7. Write a handoff report at `/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/teamwork_preview_worker_e2e_1_gen2/handoff.md`.
8. When complete, send a message to the parent (conversation ID `208aa8c5-f345-4fb4-a1e9-9b7c91cff11a`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
