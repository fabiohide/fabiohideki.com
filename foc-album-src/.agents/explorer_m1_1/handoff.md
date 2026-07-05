# Handoff Report: Explorer 1 (Match Reporting UI & Unit Tests Strategy)

This handoff outlines the codebase observations, reasoning, caveats, conclusions, and verification steps to guide the implementation of R1 (Match Reporting & DoK integration) and R4 (Unit Tests).

---

## 1. Observations

- **Observation 1**: The page view file `src/pages/report.js` has an empty shell function at lines 199-201:
  ```javascript
  function renderSingleReportForm(state) {
    return '';
  }
  ```
- **Observation 2**: The Database RPC function `foc2026_submit_single_report` in `supabase/001_schema_rls.sql` (lines 463-473) is defined with 9 arguments, expecting `p_houses` and `p_picks` as text (comma-separated strings):
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
- **Observation 3**: In `src/main.js` (lines 280-292), the database call to `dbSubmitSingleReport` only passes 5 parameters:
  ```javascript
  if (hasSupabaseConfig) {
    await dbSubmitSingleReport(
      matchId,
      state.selectedHouseCodes,
      state.report.playerAKeys,
      state.report.playerBKeys,
      pickedIds
    );
  ```
- **Observation 4**: In `package.json`, there are no devDependencies or scripts configured for a testing framework:
  ```json
    "devDependencies": {
      "gh-pages": "^6.3.0",
      "vite": "^5.4.11"
    }
  ```

---

## 2. Logic Chain

- **Parameter Mismatch**: Because the database function `foc2026_submit_single_report` expects 9 parameters (including deck name, SAS, set, and URL), calling it with only 5 arguments in `src/main.js` (Observation 3) will throw a PostgreSQL argument count mismatch error.
- **Type Serialization**: Because `p_houses` and `p_picks` are typed as `text` (comma-separated strings) in SQL (Observation 2), passing JavaScript Arrays directly via `supabase.rpc` will throw a PostgreSQL data type cast error. We must serialize these arrays in `src/supabase.js` before executing the RPC.
- **Collapsible Section**: Natively collapsible layout can be achieved via HTML `<details>` and `<summary>` in the pre-match section, ensuring full-width (`grid-column: 1 / -1`) and zero-dependency DOM event listeners.
- **Test Architecture**: Because no test framework is installed (Observation 4), introducing a custom, zero-dependency Node.js test script `tests/run-tests.js` is the most reliable way to enforce unit validation criteria without bloating dependencies or causing compilation pipeline issues.

---

## 3. Caveats

- **CORS Availability**: We assume `https://corsproxy.io/?` is accessible and will successfully bypass CORS restrictions for Decks of KeyForge.
- **Set SVGs**: We assume the SVG files for sets (e.g., `cota.svg`, `aoa.svg`) will be manually created/placed by the implementer in `public/assets/sets/` to avoid rendering broken images.

---

## 4. Conclusion

We must implement:
1. **Utility Helpers**: Extract validations (score and SAS differences) into `src/utils/validation.js` and `src/utils/sas.js` to allow reusability in tests and UI views.
2. **UI Implementation**: Redesign `src/pages/report.js` and update `src/main.js` controller to capture clipboard text, fetch DoK, render deck card/badge/houses, validate keys, render consolation/eligible picker list, and show success modal.
3. **Database Integration**: Serialize arrays into comma-separated text lists in `src/supabase.js` and pass all 9 parameters.
4. **Testing Suite**: Establish `tests/run-tests.js` zero-dependency runner.

---

## 5. Verification Method

- **Unit Tests Verification**:
  1. Add the test runner script in `package.json` under `"test": "node tests/run-tests.js"`.
  2. Run the tests using the command: `pnpm test` or `node tests/run-tests.js`.
  3. Verify that all SAS badge calculations and score rules pass with `[PASS]`.
- **Build Verification**:
  1. Build the production app using: `pnpm build`.
  2. Ensure the compilation completes without error.
