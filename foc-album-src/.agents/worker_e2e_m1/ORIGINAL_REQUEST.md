## 2026-07-03T21:56:51Z
You are the E2E Testing Worker. Your working directory is /Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/worker_e2e_m1.
Your task is to set up the E2E testing suite (Milestone 1) for the FOC 2026 Album.

Read the scope details in /Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/sub_orch_e2e/SCOPE.md and the strategy in /Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/explorer_m1_3/analysis.md.

Specifically:
1. Install Playwright as a devDependency in package.json and run the necessary playwright install commands.
2. Write a Playwright configuration file (playwright.config.js) in the project root.
3. Write E2E test cases under tests/e2e/ covering:
   - Tier 1: Smoke / Initialization checks (verifies the app renders at localhost).
   - Tier 2: Navigation checks (routes change correctly).
   - Tier 3: Score & house input validations, and CORS proxy DoK fetch behavior (mocking network responses).
   - Tier 4: Pack opening animation, card flipping, and deferred Supabase save (verify RPC is only triggered after clicking 'Ver Álbum').
4. Document the test infrastructure in TEST_INFRA.md and publish TEST_READY.md in the project root when complete.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all commands run and the final test outputs in your handoff report (handoff.md) under your working directory, and send me a completion message when done.
