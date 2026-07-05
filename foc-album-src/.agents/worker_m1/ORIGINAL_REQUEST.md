# Task Request: Milestone 1 (R1 & R4 Implementation)

Implement the following requirements in the codebase:
1. **Centralize Validations**:
   - Create `src/utils/validation.js` with:
     - `HOUSE_NAME_TO_CODE` mapping house names to their 3-letter codes (e.g. `brobnar` -> `BRB`, `dis` -> `DIS`, `logos` -> `LGS`, `mars` -> `MRS`, `sanctum` -> `SCT`, `redemption` -> `RDP`, `shadows` -> `SHW`, `untamed` -> `UNT`, `saurian` -> `SAU`, `star alliance` -> `STA`, `unfathomable` -> `UNF`, `ekwidon` -> `EKW`, `geistoid` -> `GST`, `skyborn` -> `SKB`).
     - `validateScore(myKeys, oppKeys, isAdmin)` enforcing the rules:
       - Inputs must be numbers between 0 and 3.
       - No ties allowed.
       - Winner must have exactly 3 keys (if not 0x0 WO).
       - Loser must have 0-2 keys.
       - WO (0x0) is only valid if `isAdmin === true`.
   - Create `src/utils/sas.js` with:
     - `parseDokResponse(data)` parsing Decks of KeyForge API response.
     - `getSasBadgeData(sas)` calculating the difference relative to baseline 86 (i.e. `sas - 86`), returning `diff`, `diffStr`, and `colorClass`:
       - `sas-green` for `sas >= 82`.
       - `sas-yellow` for `77 <= sas <= 81`.
       - `sas-red` for `sas <= 76`.

2. **Unit Tests (R4)**:
   - Create `tests/run-tests.js` as a zero-dependency script testing validation and SAS badge logic (mirroring the assertions in `explorer_m1_1/analysis.md`).
   - Add `"test": "node tests/run-tests.js"` to `"scripts"` in `package.json`.
   - Run the tests to ensure they pass.

3. **Report View & Controller (R1)**:
   - Update `src/pages/report.js` to:
     - Import validations.
     - Make the pre-match section collapsible using HTML `<details>` and `<summary>` tags with chevron indicators.
     - Render the single-step report form in `renderSingleReportForm(state)` containing:
       - **Deck Link Input**: Text input to search deck by Decks of KeyForge link, using the CORS proxy `https://corsproxy.io/?https://www.decksofkeyforge.com/api/decks/${uuid}`. Extract UUID using Regex: `/decks\/([0-9a-fA-F-]{36})/`. Include a "Colar" (paste) button using the Clipboard API if available, and a "Buscar" button.
       - **Deck Details Card**: Once loaded, show the deck name, set/expansion, SAS rating, and the calculated SAS badge (with color class and difference). Include a "Remover Deck" button.
       - **Score Inputs**: Stepper buttons (+/-) to select "Suas Chaves" (my keys) and "Chaves do Oponente" (opponent keys). Display validation errors inline.
       - **Picks Selection**: Show the list of eligible stickers from the player's deck houses that the opponent owns and the player does not. If none, fallback to consolation picks (any sticker of the selected houses the player does not own). Highlight selected picks.
       - **Success Modal**: Show a success modal when the report is submitted successfully.
   - Update `src/main.js` to integrate all the controller actions, including clipboard paste, fetch deck, toggle picks, remove deck, and single report submission.
   - Update `src/supabase.js`'s `dbSubmitSingleReport` function to:
     - Expect and pass all 9 parameters to the `foc2026_submit_single_report` RPC.
     - Serialize `houses` and `picks` arrays to comma-separated strings (using `.join(',')`) before sending to Supabase RPC.

## Integrity Warnings
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Run builds (`pnpm build`) and tests (`pnpm test`) to verify correctness.
- Report all file modifications, commands run, and results in your handoff report.

## 2026-07-03T18:02:37Z
Implement Milestone 1 (R1 and R4) according to the instructions in ORIGINAL_REQUEST.md in your directory /Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/worker_m1. Run 'pnpm test' and 'pnpm build' to verify.
