# Handoff Report: R2 & R4 Strategy and Plan

## 1. Observation
- **Admin Tab Mapping**: In `src/pages/admin.js:8-16`, the current implementation routes rendering based on `state.adminTab` into different tabs:
  ```javascript
  if (currentTab === 'validation') {
    tabContent = renderValidationTab(state);
  }
  ```
- **Validation Tab Limitation**: Currently, `renderValidationTab(state)` in `src/pages/admin.js:36-96` only renders "Validação de Desafios" and a W.O. button for a specific hardcoded match:
  ```javascript
  const isExpired = state.activeRound.deadline && new Date(state.activeRound.deadline) < new Date();
  const isMatchFrozen = isExpired && !state.report.completed;
  ...
  <button class="button button-primary" data-action="confirmWO" data-value="r1m1" ...>
  ```
- **Score Divergence Mapping**: In `src/pages/admin.js:297-298`, the logic to evaluate score conflict exists under `renderRoundsTab` but is not displayed to the admin on the validation screen:
  ```javascript
  const conflict = m.player_a_reported && m.player_b_reported && 
                   (m.player_a_keys !== m.player_b_opp_keys || m.player_b_keys !== m.player_a_opp_keys);
  ```
- **Supabase RPC Mapping**: In `supabase/001_schema_rls.sql:426-435`, the table `foc2026_pending_packs` is defined to support pack releases:
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
- **Deferred Opening**: The client-side database interaction is mapping immediately on opening in `src/main.js:94-102`. A deferred database call is required for pending packs on the `"goAlbum"` event.
- **Testing Absence**: No unit tests exist under `tests/` directory and no testing tool is configured in `package.json`.

---

## 2. Logic Chain
- **Requirement R2 (Admin Panel Match Management)**: To enable the administrator to view individual reports, see score conflict alerts, and release card packs:
  1. We must read the matches of the active round from the state mapped during `fetchFullState`.
  2. We must modify `renderValidationTab` in `src/pages/admin.js` to render these matches, displaying the keys, decks, and picks reported by Player A and Player B.
  3. If both players have reported but their keys do not match, we trigger a red alert container.
  4. If their keys match, we enable the "Liberar Figurinhas" button.
  5. To perform the release safely and prevent double-releases, we will introduce a `packs_released` column on `foc2026_matches` and an atomic transaction via a Supabase RPC `foc2026_release_match_packs`.
  6. We will make the "Confirmar W.O." button available for all matches so the admin can resolve unplayed matches.
- **Requirement R3 (Pack Reveal & Persistence)**:
  1. During state synchronization, all unresolved rows in `foc2026_pending_packs` are loaded as virtual player packs.
  2. We will change the card reveal header to show `"Rodada X - [Player] vs [Opponent]"` instead of the generic header.
  3. We will defer the call to `dbOpenPendingPack` until the player clicks "Ver Álbum" at the end of the reveal animation.
- **Requirement R4 (Automated Verification)**:
  1. Standardizing score inputs requires rules (keys between 0-3, no ties, winner gets exactly 3 keys, perdedor gets 0-2, WO 0x0 is admin-only).
  2. centralizing these validations in `src/utils/validation.js` allows them to be cleanly imported by the front-end forms and unit tests.
  3. We will configure Vitest in `package.json` to run these checks in a unit test file.

---

## 3. Caveats
- **Supposed Schema Status**: We assume that the database has already run the R1 single-step report migrations (`002_single_report.sql`), meaning the fields like `player_a_opp_keys` are present.
- **Supabase Connectivity**: In the offline/mock environment, the logic will fallback safely to state simulation (saving pending packs to `state.pendingPacks` array in memory).

---

## 4. Conclusion
The current implementation layout allows a clean implementation of R2, R3, and R4 by:
1. Introducing `packs_released` tracking in `foc2026_matches`.
2. Redesigning `renderValidationTab` to hold confrontation validations, divergence alerts, package releases, and W.O. declarations.
3. Centralizing score, house, and SAS calculations in `src/utils/validation.js` and configuring **Vitest** for unit testing.

---

## 5. Verification Method
- **Static Check**: Inspect the `analysis.md` file located at `/Users/fabio/Documents/antigravity/fabito/foc-album-src/.agents/explorer_m1_2/analysis.md`.
- **Database Test**: Verify that the database schema changes and the new `foc2026_release_match_packs` RPC can compile.
- **Unit Test Command**: Run `pnpm test` (or `npm test`) once Vitest is installed to run tests inside `tests/validation.test.js`.
