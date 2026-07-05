# Codebase Analysis and Design Strategy: R2 & R4

## 1. Executive Summary
This report analyzes the codebase of the **FOC 2026 Album** and formulates a complete design strategy for implementing **R2 (Admin Panel & Packaging)** and **R4 (Score & House/SAS Validations)**. 

Currently, match reporting has been designed around a single-step reporting flow (R1) where players submit their deck link, the deck's houses, their final key score, and the sticker IDs they wish to pick. However, these stickers are not immediately credited to the players' collections; instead, they are held in a matching state. 

We propose a robust admin verification architecture where:
1. **Divergences are visually highlighted** if players report differing scores.
2. **Packs are released only after verification**, creating pending packs in `foc2026_pending_packs`.
3. **Packs are opened dynamically** on the frontend and saved to `foc2026_collections` only upon clicking "Ver Álbum" (R3).
4. **Validations are centralized** in `src/utils/validation.js` for dual use in client-side page views and lightweight unit testing using **Vitest**.

---

## 2. Codebase Structure and Flow

The project is structured as follows:
- **`src/main.js`**: Core state coordinator and route controller. Contains event listeners and delegates actions to Supabase utility functions.
- **`src/supabase.js`**: Contains client configurations and asynchronous data wrappers (`fetchFullState`, `dbOpenPack`, etc.).
- **`src/pages/admin.js`**: Renders the admin panel with tabs for "Validações", "Rodadas", "Coleções", and "Histórico Geral".
- **`src/pages/packs.js`**: Handles pack listings and plays the opening/reveal animation for sticker packs.
- **`src/data/stickers.js`**: Holds metadata for houses and stickers.

### Data Flow for Post-Match Sticker Release:
```
[Player A & B Submit Reports] 
       │ 
       ▼
[Match Row Updated in foc2026_matches] (Stores player_a_picks, player_b_picks, scores, deck info)
       │
       ▼
[Admin Views Reports in Admin Panel (Validações)] ───► Mismatch? [Show Visual Warning]
       │
       ├─► (Coinciding Scores) ──► Click "Liberar Figurinhas" ──► Call RPC
       │                                                              │
       │                                                              ▼
       │                                             [foc2026_release_match_packs]
       │                                                              │
       │                                           Creates Row in foc2026_pending_packs
       │                                                              │
       ▼                                                              ▼
[Click "Confirmar W.O. (0x0)"] ──► Force Close Match ◄────────────────┘
```

---

## 3. R2 Strategy: Admin Panel, Divergences, and Pending Pack Release

To fulfill **R2**, we must expand the `Validações` tab in `src/pages/admin.js` and implement the transactional package release flow.

### A. Database Schema Modifications
To prevent duplicate package generation and keep track of match states, we propose adding a `packs_released` column to the `foc2026_matches` table:
```sql
ALTER TABLE public.foc2026_matches 
ADD COLUMN IF NOT EXISTS packs_released BOOLEAN NOT NULL DEFAULT false;
```

### B. Atomic Package Release RPC
We will implement an RPC to handle the package release as a database transaction. This ensures that marking the match as completed/released and creating the pending packs happens atomically:
```sql
CREATE OR REPLACE FUNCTION public.foc2026_release_match_packs(
  p_match_id text,
  p_player_a text,
  p_player_b text,
  p_round_number int,
  p_player_a_name text,
  p_player_b_name text,
  p_player_a_picks text[],
  p_player_b_picks text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verify the match is not already resolved
  IF EXISTS (
    SELECT 1 FROM public.foc2026_matches 
    WHERE id = p_match_id AND packs_released = true
  ) THEN
    RAISE EXCEPTION 'Figurinhas já foram liberadas para este confronto.';
  END IF;

  -- 2. Mark the match as completed and released
  UPDATE public.foc2026_matches
  SET packs_released = true,
      completed = true,
      confirmed_at = COALESCE(confirmed_at, now())
  WHERE id = p_match_id;

  -- 3. Create pending pack for Player A if they selected picks
  IF array_length(p_player_a_picks, 1) > 0 THEN
    INSERT INTO public.foc2026_pending_packs(player_username, round_number, opponent_name, sticker_ids, opened)
    VALUES (p_player_a, p_round_number, p_player_b_name, p_player_a_picks, false);
  END IF;

  -- 4. Create pending pack for Player B if they selected picks
  IF array_length(p_player_b_picks, 1) > 0 THEN
    INSERT INTO public.foc2026_pending_packs(player_username, round_number, opponent_name, sticker_ids, opened)
    VALUES (p_player_b, p_round_number, p_player_a_name, p_player_b_picks, false);
  END IF;

  -- 5. Log actions to administrative log
  INSERT INTO public.foc2026_admin_logs(message)
  VALUES ('Admin liberou pacotinhos para ' || p_player_a_name || ' e ' || p_player_b_name || ' (Partida: ' || p_match_id || ')');
END;
$$;
```

### C. Updating `src/supabase.js`
We will expose the RPC and map the new `packs_released` column.
1. **`fetchFullState` Mapping** (inside the `matchesRes` parsing loop):
   ```javascript
   packs_released: m.packs_released
   ```
2. **New DB Client Wrapper**:
   ```javascript
   export async function dbReleaseMatchPacks(matchId, playerA, playerB, roundNumber, aName, bName, aPicks, bPicks) {
     if (!supabase) return;
     await supabase.rpc('foc2026_release_match_packs', {
       p_match_id: matchId,
       p_player_a: playerA,
       p_player_b: playerB,
       p_round_number: roundNumber,
       p_player_a_name: aName,
       p_player_b_name: bName,
       p_player_a_picks: aPicks,
       p_player_b_picks: bPicks
     });
   }
   ```

### D. UI Changes in `src/pages/admin.js`
We will modify the "Validações" tab to display confrontation states for the active round. It will show the reported score of both players side-by-side, highlight conflicts in red, and show action buttons.

```javascript
// Replacement function for renderValidationTab inside src/pages/admin.js
function renderValidationTab(state) {
  const challenges = state.challenges || [];
  const pendingChallenges = (state.pendingChallenges && state.pendingChallenges.length > 0)
    ? state.pendingChallenges
    : challenges.filter(c => c.pendingValidation && !c.completed);

  // Filter matches of the active round
  const activeRoundMatches = (state.matches || []).filter(m => m.round_number === state.activeRound.number);

  // Render Challenges Section
  let challengesHtml = `
    <div class="panel admin-panel" style="margin-bottom: 24px;">
      <span class="panel-label">Validação de Desafios</span>
      ${pendingChallenges.length === 0 
        ? `<p class="empty-text" style="padding: 16px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum desafio aguardando validação.</p>`
        : `<div class="admin-challenges-list" style="display: flex; flex-direction: column; gap: 12px;">
            ${pendingChallenges.map(c => `
              <div class="admin-challenge-card" style="padding: 12px; background: var(--color-iron); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; gap: 12px; border-left: 3px solid var(--color-gold);">
                <div>
                  <h5 style="margin: 0; color: var(--color-paper);">${c.title}</h5>
                  <p style="margin: 2px 0; font-size: 0.8rem; color: var(--color-gold);">Jogador: <strong>${c.playerName}</strong></p>
                  <p style="margin: 0; font-size: 0.78rem; color: var(--color-ash);">${c.desc}</p>
                  <span style="font-size: 0.72rem; display: inline-block; margin-top: 4px; color: var(--color-paper);">Figurinha: <strong>${c.pickedId}</strong></span>
                </div>
                <button class="button button-primary" data-action="approveChallenge" data-value="${c.id}" data-player="${c.playerUsername}" style="height: 32px; min-height: auto;">Aprovar</button>
              </div>
            `).join('')}
          </div>`
      }
    </div>
  `;

  // Render Matches Section
  let matchesHtml = `
    <div class="panel admin-panel">
      <span class="panel-label">Validação de Partidas (Rodada ${state.activeRound.number})</span>
      ${activeRoundMatches.length === 0
        ? `<p class="empty-text" style="padding: 16px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhuma partida registrada nesta rodada.</p>`
        : `<div class="admin-matches-validation-list" style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
            ${activeRoundMatches.map(m => {
              const hasConflict = m.player_a_reported && m.player_b_reported && 
                (m.player_a_keys !== m.player_b_opp_keys || m.player_a_opp_keys !== m.player_b_keys);
              
              const canRelease = m.player_a_reported && m.player_b_reported && !hasConflict && !m.packs_released;
              const isResolved = m.packs_released;

              let cardBorderColor = 'rgba(255,255,255,0.06)';
              if (hasConflict) cardBorderColor = '#ff4d4d';
              else if (isResolved) cardBorderColor = '#00cc66';

              return `
                <div class="admin-match-val-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); border: 1.5px solid ${cardBorderColor}; display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                    <strong style="color: var(--color-paper);">${m.playerA} vs ${m.playerB}</strong>
                    <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 700; text-transform: uppercase; background: ${hasConflict ? 'rgba(255,77,77,0.15)' : isResolved ? 'rgba(0,204,102,0.15)' : 'rgba(255,255,255,0.05)'}; color: ${hasConflict ? '#ff4d4d' : isResolved ? '#00cc66' : 'var(--color-ash)'};">
                      ${hasConflict ? 'Conflito' : isResolved ? 'Figurinhas Liberadas' : 'Pendente'}
                    </span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.82rem;">
                    <!-- Report Player A -->
                    <div style="border-right: 1px solid rgba(255,255,255,0.05); padding-right: 10px;">
                      <span style="color: var(--color-gold); font-weight: 600;">Reporte de ${m.playerA}:</span>
                      ${m.player_a_reported ? `
                        <div style="margin-top: 4px; color: var(--color-paper);">
                          Placar: <strong>${m.player_a_keys}</strong> (suas) x <strong>${m.player_a_opp_keys}</strong> (oponente)<br/>
                          Deck: ${m.player_a_deck_name || 'N/A'} (SAS: ${m.player_a_deck_sas || 'N/A'})<br/>
                          Picks: <code style="color: var(--color-gold);">${m.player_a_picks || 'Nenhum'}</code>
                        </div>
                      ` : '<div style="color: var(--color-ash); font-style: italic; margin-top: 4px;">Não reportou ainda</div>'}
                    </div>

                    <!-- Report Player B -->
                    <div>
                      <span style="color: var(--color-gold); font-weight: 600;">Reporte de ${m.playerB}:</span>
                      ${m.player_b_reported ? `
                        <div style="margin-top: 4px; color: var(--color-paper);">
                          Placar: <strong>${m.player_b_keys}</strong> (suas) x <strong>${m.player_b_opp_keys}</strong> (oponente)<br/>
                          Deck: ${m.player_b_deck_name || 'N/A'} (SAS: ${m.player_b_deck_sas || 'N/A'})<br/>
                          Picks: <code style="color: var(--color-gold);">${m.player_b_picks || 'Nenhum'}</code>
                        </div>
                      ` : '<div style="color: var(--color-ash); font-style: italic; margin-top: 4px;">Não reportou ainda</div>'}
                    </div>
                  </div>

                  <!-- Divergence Alert -->
                  ${hasConflict ? `
                    <div style="padding: 10px; background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.2); border-radius: var(--radius-sm); color: #ff6666; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                      <span>⚠️ OS PLACARES DIGITADOS SÃO DIVERGENTES! Resolva com os jogadores antes de liberar.</span>
                    </div>
                  ` : ''}

                  <!-- Actions Footer -->
                  <div style="display: flex; gap: 10px; margin-top: 6px; justify-content: flex-end;">
                    ${!isResolved ? `
                      <button class="button button-secondary" data-action="confirmWO" data-value="${m.id}" style="height: 32px; min-height: auto; font-size: 0.75rem; padding: 0 10px;">
                        Confirmar W.O. (0x0)
                      </button>
                      <button class="button button-primary" data-action="releasePacks" data-match="${m.id}" style="height: 32px; min-height: auto; font-size: 0.75rem; padding: 0 14px;" ${!canRelease ? 'disabled' : ''}>
                        Liberar Figurinhas
                      </button>
                    ` : `
                      <span style="font-size: 0.78rem; color: var(--color-ash); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        ✓ Pacotes enviados para coleção dos jogadores
                      </span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
      }
    </div>
  `;

  return challengesHtml + matchesHtml;
}
```

---

## 4. R4 Strategy: Score & House Validations and Unit Testing

To ensure full compliance and reliability under **R4**, validations are centralized in a clean JavaScript module suitable for both dynamic UI checking and headless automated test suites.

### A. Centralizing Rules in `src/utils/validation.js`
Create a new file `src/utils/validation.js`:
```javascript
/**
 * Validates the score entered by a player or administrator.
 * Rules:
 * 1. Score inputs must be numbers between 0 and 3.
 * 2. Placar de W.O. (0x0) is only valid if isAdmin is true.
 * 3. Ties (empates) are strictly prohibited.
 * 4. There must be a clear winner with exactly 3 keys forged.
 * 5. The loser must have forged between 0 and 2 keys.
 */
export function validateScore(myKeys, oppKeys, isAdmin = false) {
  const kMin = 0;
  const kMax = 3;

  if (myKeys < kMin || myKeys > kMax || oppKeys < kMin || oppKeys > kMax) {
    return { valid: false, message: 'As chaves devem estar entre 0 e 3.' };
  }

  // W.O. Validation
  if (myKeys === 0 && oppKeys === 0) {
    if (isAdmin) {
      return { valid: true };
    } else {
      return { valid: false, message: 'Placar de W.O. (0x0) é exclusivo do painel do administrador.' };
    }
  }

  // Tie Validation
  if (myKeys === oppKeys) {
    return { valid: false, message: 'Não são permitidos empates.' };
  }

  // Winner Validation (Exactly 3 keys)
  if (myKeys !== 3 && oppKeys !== 3) {
    return { valid: false, message: 'A partida deve ter um vencedor com exatamente 3 chaves.' };
  }

  // Loser Validation (0-2 keys)
  const loserKeys = myKeys === 3 ? oppKeys : myKeys;
  if (loserKeys < 0 || loserKeys > 2) {
    return { valid: false, message: 'O perdedor deve ter entre 0 e 2 chaves.' };
  }

  return { valid: true };
}

/**
 * Validates selected houses for KeyForge deck metadata.
 * Rule: exactly 3 unique houses are required.
 */
export function validateHouses(houses) {
  if (!Array.isArray(houses)) return { valid: false, message: 'Casas devem ser passadas como lista.' };
  const uniqueHouses = new Set(houses);
  if (uniqueHouses.size !== 3 || houses.length !== 3) {
    return { valid: false, message: 'O deck deve ter exatamente 3 casas distintas.' };
  }
  return { valid: true };
}

/**
 * Computes SAS rating badge configurations relative to a reference max SAS of 86.
 * Colors:
 * - SAS 82-86: Green (verde)
 * - SAS 77-81: Yellow (amarelo)
 * - SAS <= 76: Red (vermelho)
 */
export function calculateSasDetails(sas) {
  const reference = 86;
  const numSas = Number(sas) || 0;
  const diff = numSas - reference;
  
  let color = 'red';
  if (numSas >= 82) {
    color = 'green';
  } else if (numSas >= 77) {
    color = 'yellow';
  }

  return {
    sas: numSas,
    diff,
    color
  };
}
```

### B. Integrating Validations in the Match Report UI
In the R1 match reporting view (`src/pages/report.js`), we import these validations. Upon clicking "Reportar" or changing key values, we run `validateScore(myKeys, oppKeys)` and display an error box if `valid === false`, disabling the report submission.

---

### C. Test Infrastructure Configuration
We propose using **Vitest** for unit tests because it integrates seamlessly with Vite and requires zero configuration.

1. **`package.json` updates**:
   ```json
   "scripts": {
     ...
     "test": "vitest run"
   },
   "devDependencies": {
     ...
     "vitest": "^1.6.0"
   }
   ```

2. **Writing Unit Tests (`tests/validation.test.js`)**:
   Create a test script at `/Users/fabio/Documents/antigravity/fabito/foc-album-src/tests/validation.test.js`:
   ```javascript
   import { describe, it, expect } from 'vitest';
   import { validateScore, validateHouses, calculateSasDetails } from '../src/utils/validation.js';

   describe('Score Validations', () => {
     it('should reject scores outside the range [0-3]', () => {
       expect(validateScore(-1, 3).valid).toBe(false);
       expect(validateScore(4, 3).valid).toBe(false);
     });

     it('should reject ties (empates)', () => {
       expect(validateScore(3, 3).valid).toBe(false);
       expect(validateScore(2, 2).valid).toBe(false);
     });

     it('should reject scores lacking a winner with 3 keys', () => {
       expect(validateScore(2, 1).valid).toBe(false);
     });

     it('should accept standard win/loss scores', () => {
       expect(validateScore(3, 0).valid).toBe(true);
       expect(validateScore(3, 1).valid).toBe(true);
       expect(validateScore(3, 2).valid).toBe(true);
       expect(validateScore(1, 3).valid).toBe(true);
     });

     it('should restrict W.O. (0x0) scores based on admin status', () => {
       expect(validateScore(0, 0, false).valid).toBe(false); // Player cannot report 0x0
       expect(validateScore(0, 0, true).valid).toBe(true);   // Admin can report 0x0
     });
   });

   describe('House Validations', () => {
     it('should reject arrays containing less or more than 3 houses', () => {
       expect(validateHouses(['DIS', 'BRB']).valid).toBe(false);
       expect(validateHouses(['DIS', 'BRB', 'SCT', 'UNT']).valid).toBe(false);
     });

     it('should reject non-unique entries', () => {
       expect(validateHouses(['DIS', 'DIS', 'BRB']).valid).toBe(false);
     });

     it('should accept exactly 3 unique houses', () => {
       expect(validateHouses(['DIS', 'BRB', 'SCT']).valid).toBe(true);
     });
   });

   describe('SAS calculations', () => {
     it('should compute correct differences and green badges for high SAS values', () => {
       const res = calculateSasDetails(84);
       expect(res.diff).toBe(-2);
       expect(res.color).toBe('green');
     });

     it('should compute yellow badges for medium SAS values', () => {
       const res = calculateSasDetails(79);
       expect(res.diff).toBe(-7);
       expect(res.color).toBe('yellow');
     });

     it('should compute red badges for low SAS values', () => {
       const res = calculateSasDetails(72);
       expect(res.diff).toBe(-14);
       expect(res.color).toBe('red');
     });
   });
   ```

---

## 5. R3 Strategy: Receiving and Opening Pending Packs

### A. Displaying Packs (Inside `fetchFullState`)
Ensure that pending packs are queried from Supabase and populated directly into `state.packs` list in `src/supabase.js`:
```javascript
  if (pendingPacksData) {
    pendingPacksData.forEach(p => {
      packs.push({
        id: p.id,
        type: 'player',
        title: `Pacotinho Rodada ${p.round_number}`,
        subtitle: `Vs. ${p.opponent_name}`,
        image: '/assets/pack/player_pack.webp',
        opened: p.opened,
        stickerIds: p.sticker_ids,
        isPendingPack: true,
        opponentName: p.opponent_name,
        roundNumber: p.round_number
      });
    });
  }
```

### B. Custom Reveal Header Text
Modify the title in the reveal UI in `src/pages/packs.js` to match the exact requirement:
```javascript
const titleText = reveal.pack.isPendingPack 
  ? `Rodada ${reveal.pack.roundNumber} - ${state.user.name} vs ${reveal.pack.opponentName}`
  : `${reveal.newIds.length} novas figurinhas!`;
```

### C. Deferred DB Saving until "Ver Álbum" Click
In `src/main.js`, clicking the open button calls `openPack(value)`. For pending packs:
1. It transitions state to show the reveal screen without modifying the DB or `state.collection`.
2. Upon clicking "Ver Álbum", the `goAlbum` action is caught in `src/main.js`:
   ```javascript
   if (action === 'goAlbum') {
     const reveal = state.reveal;
     if (reveal && reveal.pack && reveal.pack.isPendingPack) {
       if (hasSupabaseConfig) {
         await dbOpenPendingPack(reveal.pack.id);
         const fetched = await fetchFullState(state.user.id);
         if (fetched) state = fetched;
       }
     }
     state.reveal = null;
     setRoute('album');
   }
   ```

This deferred persistence ensures full adherence to R3.
