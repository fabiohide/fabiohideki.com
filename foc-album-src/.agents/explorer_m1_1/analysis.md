# Design Strategy & Implementation Plan: Match Reporting (R1) & Unit Testing (R4)

This report details the codebase analysis, UI layout strategy, integration mapping, and test architecture to deliver a single-step match report flow integrated with Decks of KeyForge (DoK), alongside a zero-dependency unit test suite.

---

## 1. Codebase Structure & Architecture Analysis

The application is a frontend single-page application built with Vite, jQuery, and Supabase. The relevant files to modify and create are:

1. **`src/pages/report.js`**: Renders the match view. It currently contains a collapsible accordion of available stickers (`renderPreMatch`) and an empty `renderSingleReportForm`.
2. **`src/main.js`**: Global state controller and action router. It maps action triggers (e.g., clicks, route changes) to Supabase operations or local state changes.
3. **`src/supabase.js`**: Exposes the database interaction layer, mapping local JS calls to PostgreSQL RPCs.
4. **`src/utils/`**: Utilities directory. We will introduce new files here:
   - `src/utils/sas.js`: Parses the DoK URLs and calculates SAS badge data.
   - `src/utils/validation.js`: Implements the score validation rules.
5. **`tests/`**: Unit test suite folder. We will create:
   - `tests/run-tests.js`: A zero-dependency Node.js script to run unit tests.

---

## 2. R1: Match Reporting UI & Decks of KeyForge (DoK) Specification

### A. Collapsible Pre-Match Panel
Currently, the pre-match panel takes half-width on desktop.
- **UI Update**: Modify `renderPreMatch` in `src/pages/report.js` to wrap the section in a native HTML `<details>` and `<summary>` element.
- **Width**: Force full width by styling the details element with `grid-column: 1 / -1; width: 100%;`.
- **CSS Transitions**: Add CSS rule to `src/style/report.css` to rotate the chevron when the panel is opened:
  ```css
  .pre-match-panel[open] .chevron-icon {
    transform: rotate(180deg);
  }
  ```

### B. Decks of KeyForge URL Parser & API Client
- **URL Pattern**: A typical Decks of KeyForge link is `https://www.decksofkeyforge.com/decks/e3b6a22f-d890-4828-98e3-982823617300`. The UUID is a 36-character hex string: `([0-9a-fA-F-]{36})`.
- **CORS Proxy**: Direct requests to `www.decksofkeyforge.com` fail due to CORS. Use `https://corsproxy.io/?https://www.decksofkeyforge.com/api/decks/${uuid}`.
- **House Names Mapping**: The DoK API returns expansion/set codes (e.g., `COTA`, `WC`) and house names (e.g., `Brobnar`, `Star Alliance`). Map them case-insensitively to the project's 3-letter codes:
  ```javascript
  export const HOUSE_NAME_TO_CODE = {
    'brobnar': 'BRB',
    'dis': 'DIS',
    'logos': 'LGS',
    'mars': 'MRS',
    'sanctum': 'SCT',
    'redemption': 'RDP',
    'shadows': 'SHW',
    'untamed': 'UNT',
    'saurian': 'SAU',
    'star alliance': 'STA',
    'unfathomable': 'UNF',
    'ekwidon': 'EKW',
    'geistoid': 'GST',
    'skyborn': 'SKB'
  };
  ```

### C. SAS Badge Calculations
- **Baseline**: Calculate the difference relative to the maximum SAS baseline of **86** (i.e. `diff = SAS - 86`).
- **Color Grading**:
  - **Green** (`sas-green`): `SAS >= 82` (covers 86-82 and above).
  - **Yellow** (`sas-yellow`): `77 <= SAS <= 81`.
  - **Red** (`sas-red`): `SAS <= 76`.

### D. Score Validation Rules
Validation prevents invalid report submissions:
- **Rule 1 (No Ties)**: Both players cannot have the same score (`myKeys !== oppKeys`).
- **Rule 2 (Winner Limit)**: One player must have exactly **3 chaves** (`myKeys === 3` or `oppKeys === 3`).
- **Rule 3 (Loser Limit)**: The loser must have between **0 and 2 chaves**.
- **Rule 4 (W.O. Rule)**: A `0x0` score (both 0 keys) is ONLY allowed if the reporting user is an administrator.

---

## 3. Detailed Implementations & Code Snippets

### A. SAS Utilities (`src/utils/sas.js`)
```javascript
import { HOUSE_NAME_TO_CODE } from './validation.js';

export function parseDokResponse(data) {
  if (!data || !data.deck) {
    throw new Error('Formato de resposta inválido do DoK.');
  }
  const deck = data.deck;
  const name = deck.name;
  const sas = Number(deck.sasRating);
  const expansion = deck.expansion || 'COTA';
  
  let houses = [];
  if (Array.isArray(deck.houses)) {
    houses = deck.houses.map(h => {
      if (typeof h === 'string') return h;
      if (h && typeof h === 'object') return h.name || h.house || '';
      return '';
    }).filter(Boolean);
  }
  
  const houseCodes = houses.map(name => {
    const clean = name.toLowerCase().trim();
    return HOUSE_NAME_TO_CODE[clean] || null;
  }).filter(Boolean);

  return {
    name,
    sas,
    expansion,
    houses: houseCodes
  };
}

export function getSasBadgeData(sas) {
  const target = 86;
  const diff = sas - target;
  const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
  
  let colorClass = 'sas-red';
  if (sas >= 82) {
    colorClass = 'sas-green';
  } else if (sas >= 77) {
    colorClass = 'sas-yellow';
  }
  
  return {
    diff,
    diffStr,
    colorClass
  };
}
```

### B. Validation Utilities (`src/utils/validation.js`)
```javascript
export const HOUSE_NAME_TO_CODE = {
  'brobnar': 'BRB',
  'dis': 'DIS',
  'logos': 'LGS',
  'mars': 'MRS',
  'sanctum': 'SCT',
  'redemption': 'RDP',
  'shadows': 'SHW',
  'untamed': 'UNT',
  'saurian': 'SAU',
  'star alliance': 'STA',
  'unfathomable': 'UNF',
  'ekwidon': 'EKW',
  'geistoid': 'GST',
  'skyborn': 'SKB'
};

export function validateScore(myKeys, oppKeys, isAdmin = false) {
  const mk = Number(myKeys);
  const ok = Number(oppKeys);

  if (isNaN(mk) || isNaN(ok)) {
    return { valid: false, message: 'Os placares devem ser numéricos.' };
  }

  if (mk < 0 || mk > 3 || ok < 0 || ok > 3) {
    return { valid: false, message: 'As chaves devem estar entre 0 e 3.' };
  }

  if (mk === 0 && ok === 0) {
    if (isAdmin) {
      return { valid: true, isWO: true };
    } else {
      return { valid: false, message: 'W.O. (0x0) é exclusivo para administradores.' };
    }
  }

  if (mk === ok) {
    return { valid: false, message: 'Não são permitidos empates.' };
  }

  const hasWinner3 = (mk === 3 || ok === 3);
  if (!hasWinner3) {
    return { valid: false, message: 'O vencedor deve ter exatamente 3 chaves.' };
  }

  const loserKeys = mk === 3 ? ok : mk;
  if (loserKeys < 0 || loserKeys > 2) {
    return { valid: false, message: 'O perdedor deve ter entre 0 e 2 chaves.' };
  }

  return { valid: true, isWO: false };
}
```

### C. Match Page (`src/pages/report.js`) Changes
```javascript
import { getAssetUrl } from '../utils/format.js';
import { getSasBadgeData } from '../utils/sas.js';
import { validateScore } from '../utils/validation.js';
import { HOUSE_META, PLAYER_STICKERS } from '../data/stickers.js';
import { renderChallengesContent } from './challenges.js';

// ... formatDeadlineDate ...

export function renderReport(state) {
  // ... check if packOpened ...
  const activeTab = state.reportTab || 'match';
  return `
    <section class="page-view report-view">
      <!-- TABS BAR -->
      <div class="report-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; width: 100%;">
        <button class="tab-button" data-action="setReportTab" data-value="match" style="flex: 1; background: ${activeTab === 'match' ? 'var(--color-signal-blue)' : 'transparent'}; color: ${activeTab === 'match' ? 'var(--color-paper)' : 'var(--color-ash)'}; border: 1.5px solid ${activeTab === 'match' ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.08)'}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Partida
        </button>
        <button class="tab-button" data-action="setReportTab" data-value="challenges" style="flex: 1; background: ${activeTab === 'challenges' ? 'var(--color-signal-blue)' : 'transparent'}; color: ${activeTab === 'challenges' ? 'var(--color-paper)' : 'var(--color-ash)'}; border: 1.5px solid ${activeTab === 'challenges' ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.08)'}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Desafios
        </button>
      </div>

      <div class="section-heading" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 10px;">
        <h2>${activeTab === 'match' ? `Rodada ${state.activeRound.number}` : 'Desafios'}</h2>
        ${activeTab === 'match' && (state.user.isAdmin || ['teste_1', 'teste_2'].includes(state.user.id)) ? `
          <button class="button button-secondary" data-action="resetMatch" style="margin: 0; padding: 6px 12px; font-size: 0.78rem; font-family: 'Fixture', sans-serif; text-transform: uppercase; font-weight: 700; height: 32px; min-height: auto;">
            Resetar Partida
          </button>
        ` : ''}
      </div>

      ${activeTab === 'challenges' ? renderChallengesContent(state) : renderMatchReportContent(state)}
    </section>
  `;
}

function renderPreMatch(state) {
  // Collection counts logic
  const myHouses = {};
  const opponentHouses = {};
  Object.keys(HOUSE_META).forEach(code => {
    const houseStickers = PLAYER_STICKERS.filter(s => s.house === code);
    myHouses[code] = houseStickers.filter(s => state.collection[s.id]);
    opponentHouses[code] = houseStickers.filter(s => state.opponentCollection[s.id]);
  });

  const iCanGet = PLAYER_STICKERS.filter(s =>
    state.opponentCollection[s.id] && (!state.collection[s.id] || state.collection[s.id].quantity === 0)
  );

  const opponent = state.matches.find(m => m.id === state.report.matchId);
  const opponentName = opponent ? (state.report.isPlayerA ? opponent.playerB : opponent.playerA) : 'Adversário';

  return `
    <details class="panel pre-match-panel" style="grid-column: 1 / -1; width: 100%; margin-bottom: 16px;">
      <summary class="step-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; list-style: none;">
        <div style="display: flex; flex-direction: column;">
          <span class="step-number">Pré-partida</span>
          <h4 style="margin: 0;">Figurinhas disponíveis</h4>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--color-ash);">Veja o que cada jogador tem antes de escolher o deck.</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="pre-match-badge can-get" style="margin: 0; padding: 2px 8px; background: rgba(49, 133, 255, 0.15); color: #8db9ff; border-radius: var(--radius-sm); font-size: 0.72rem;">
            ${iCanGet.length} obter
          </span>
          <span class="chevron-icon" style="font-size: 0.8rem; transition: transform 0.2s;">▼</span>
        </div>
      </summary>

      <div class="pre-match-grid" style="margin-top: 16px;">
        <!-- ... existing grid cols for Sua colecão & Opponent collection ... -->
      </div>
    </details>
  `;
}

export function renderSingleReportForm(state) {
  const report = state.report;
  
  // 1. Seu deck view
  let deckSectionHtml = '';
  if (report.deckName) {
    const badge = getSasBadgeData(report.deckSas);
    const deckHousesArray = report.deckHouses ? report.deckHouses.split(',') : [];
    
    deckSectionHtml = `
      <div class="deck-card" style="background: var(--color-graphite); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
          <div>
            <h4 style="margin: 0; font-family: var(--font-display); font-size: 1.1rem; color: var(--color-paper);">${report.deckName}</h4>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--color-ash); margin-top: 6px;">
              <img src="${getAssetUrl(`/assets/sets/${report.deckSet.toLowerCase()}.svg`)}" alt="${report.deckSet}" style="width: 18px; height: 18px; filter: brightness(0) invert(1);" onerror="this.style.display='none'" />
              <span>Set: <strong>${report.deckSet}</strong></span>
            </div>
          </div>
          <span class="status-pill ${badge.colorClass}" style="font-size: 0.78rem; padding: 4px 10px;">SAS ${report.deckSas} (${badge.diffStr})</span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap;">
          ${deckHousesArray.map(code => {
            const h = HOUSE_META[code];
            return `
              <span class="house-chip" style="min-height: auto; padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);">
                ${h ? `<img src="${getAssetUrl(h.icon)}" alt="" style="width: 14px; height: 14px; filter: brightness(0) invert(1);" />` : ''}
                <strong>${code}</strong>
              </span>
            `;
          }).join('')}
        </div>
        <button class="button button-secondary" data-action="removeDeck" style="width: 100%; margin: 12px 0 0 0; padding: 6px; font-size: 0.78rem; border-color: rgba(235, 87, 87, 0.3); color: #ff8c8c; height: 32px; min-height: auto;">
          Remover Deck
        </button>
      </div>
    `;
  } else {
    deckSectionHtml = `
      <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
        <h4 style="margin: 0;">Seu deck</h4>
        <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
          <button class="button button-secondary" data-action="pasteDeckLink" style="margin: 0; padding: 0 14px; min-height: 40px; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem; font-weight: bold;">
            Colar
          </button>
          <input type="text" id="deck-link-input" placeholder="Insira o link do Decks of KeyForge" style="flex: 1; min-height: 40px; margin: 0; background: var(--color-graphite); border: 1.5px solid rgba(255,255,255,0.08); color: var(--color-paper); border-radius: var(--radius-md); padding: 0 12px; font-size: 0.85rem;" />
          <button class="button button-primary" data-action="fetchDeck" style="margin: 0; min-height: 40px; padding: 0 16px; font-size: 0.8rem; font-weight: bold;">
            Buscar
          </button>
        </div>
        <div id="deck-fetch-error" style="color: #ff8c8c; font-size: 0.78rem; display: none; margin-top: 2px;"></div>
      </div>
    `;
  }

  // 2. Placar view
  const validation = validateScore(report.playerAKeys, report.playerBKeys, state.user.isAdmin);
  const scoreErrorHtml = (!validation.valid && (report.playerAKeys > 0 || report.playerBKeys > 0))
    ? `<div class="alert-box is-error" style="margin: 8px 0 0 0; padding: 8px 12px;"><span class="alert-icon">⚠️</span><div class="alert-content">${validation.message}</div></div>`
    : '';

  const scoreSectionHtml = `
    <div style="margin-bottom: 24px;">
      <h4 style="margin: 0 0 10px 0;">Placar</h4>
      <div class="stepper-grid" style="margin: 0;">
        <div class="stepper-item">
          <span class="stepper-label">Suas Chaves</span>
          <div class="stepper-control">
            <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="-1" ${report.playerAKeys <= 0 ? 'disabled' : ''}>-</button>
            <span class="stepper-value">${report.playerAKeys}</span>
            <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="1" ${report.playerAKeys >= 3 ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="stepper-item">
          <span class="stepper-label">Chaves Adversário</span>
          <div class="stepper-control">
            <button class="stepper-btn" data-action="adjustKeys" data-side="b" data-amount="-1" ${report.playerBKeys <= 0 ? 'disabled' : ''}>-</button>
            <span class="stepper-value">${report.playerBKeys}</span>
            <button class="stepper-btn" data-action="adjustKeys" data-side="b" data-amount="1" ${report.playerBKeys >= 3 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      </div>
      ${scoreErrorHtml}
    </div>
  `;

  // 3. Picks view
  let picksSectionHtml = '';
  const myKeys = report.playerAKeys;
  const isScoreValid = validation.valid;

  if (isScoreValid && report.deckHouses) {
    if (myKeys === 0) {
      picksSectionHtml = `
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">Figurinhas Solicitadas</h4>
          <div class="alert-box is-success" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.06); color: var(--color-ash); margin: 0; padding: 10px 14px;">
            <div class="alert-content" style="font-size: 0.8rem;">
              <strong>Consolação:</strong> Você fez 0 chaves e não pode solicitar figurinhas do oponente. Mais sorte na próxima rodada!
            </div>
          </div>
        </div>
      `;
    } else {
      const selectedCodes = report.deckHouses.split(',');
      const eligible = PLAYER_STICKERS
        .filter(s => selectedCodes.includes(s.house))
        .filter(s => state.opponentCollection[s.id])
        .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);

      const isFallback = eligible.length === 0;
      const pool = isFallback 
        ? PLAYER_STICKERS.filter(s => selectedCodes.includes(s.house) && (!state.collection[s.id] || state.collection[s.id].quantity === 0))
        : eligible;

      const maxPicks = isFallback ? myKeys : Math.min(myKeys, eligible.length);
      
      picksSectionHtml = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <h4 style="margin: 0;">Figurinhas Solicitadas</h4>
            <span class="selection-counter">${state.selectedPickIds.length}/${maxPicks} selecionadas</span>
          </div>
          <p class="picker-instruction" style="margin: 0 0 10px 0; font-size: 0.78rem;">
            ${isFallback 
              ? '<strong>Modo Fallback:</strong> Nenhuma figurinha inédita nas casas do seu deck no oponente. Selecione da coleção geral.' 
              : `Escolha ${maxPicks} figurinha(s) inédita(s) nas casas do seu deck.`
            }
          </p>
          
          ${pool.length === 0 
            ? `<p style="font-size: 0.82rem; color: var(--color-ash); font-style: italic;">Nenhuma figurinha disponível nas suas casas.</p>`
            : `
              <div class="picker-list" style="margin: 0; gap: 8px;">
                ${pool.map(sticker => {
                  const isSelected = state.selectedPickIds.includes(sticker.id);
                  const isLimitReached = state.selectedPickIds.length >= maxPicks;
                  const btnDisabled = !isSelected && isLimitReached;
                  
                  return `
                    <div class="picker-list-item" style="padding: 10px 12px; min-height: auto; ${isSelected ? 'border-color: var(--color-signal-blue); background: rgba(49, 133, 255, 0.04);' : ''}">
                      <div>
                        <strong style="font-size: 0.9rem;">${sticker.name}</strong>
                        <span style="font-size: 0.75rem; margin-top: 1px;">ID: ${sticker.id} | Casa: ${sticker.house}</span>
                      </div>
                      <button class="button ${isSelected ? 'button-primary' : 'button-secondary'}" 
                              data-action="toggleReportPick" 
                              data-value="${sticker.id}" 
                              ${btnDisabled ? 'disabled' : ''} 
                              style="margin: 0; padding: 4px 10px; font-size: 0.72rem; min-height: auto; height: 28px;">
                        ${isSelected ? 'Desmarcar' : 'Escolher'}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            `
          }
        </div>
      `;
    }
  }

  // 4. Submit button
  const isDeckLoaded = Boolean(report.deckName);
  let correctPicks = false;
  if (isScoreValid && report.deckHouses) {
    const selectedCodes = report.deckHouses.split(',');
    const eligible = PLAYER_STICKERS
      .filter(s => selectedCodes.includes(s.house))
      .filter(s => state.opponentCollection[s.id])
      .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);
    const expectedCount = eligible.length === 0 ? myKeys : Math.min(myKeys, eligible.length);
    correctPicks = myKeys === 0 || state.selectedPickIds.length === expectedCount;
  }
  
  const canSubmit = isDeckLoaded && isScoreValid && correctPicks;

  return `
    <div class="panel" style="margin-top: 16px; padding: 20px; background: var(--color-carbon); border-radius: var(--radius-lg);">
      ${deckSectionHtml}
      ${scoreSectionHtml}
      ${picksSectionHtml}
      
      <button class="button button-primary" data-action="submitSingleReport" ${!canSubmit ? 'disabled' : ''} style="width: 100%; margin: 16px 0 0 0; height: 44px; font-size: 0.9rem; text-transform: uppercase; font-weight: 700;">
        Reportar Partida
      </button>
    </div>
    
    ${state.showSuccessModal ? renderSuccessModal() : ''}
  `;
}

function renderSuccessModal() {
  return `
    <div class="highlight-overlay" id="successReportModal">
      <div class="highlight-overlay-bg"></div>
      <div class="highlight-content" style="background: var(--color-carbon); padding: 28px; border-radius: var(--radius-lg); border: 1.5px solid rgba(255,255,255,0.08); text-align: center; max-width: 360px; box-shadow: var(--shadow-deep); z-index: 2001;">
        <span style="font-size: 2.8rem; color: var(--color-green); display: block; margin-bottom: 8px;">✓</span>
        <h3 style="font-family: var(--font-display); color: var(--color-paper); margin: 0 0 6px; font-size: 1.25rem;">Reporte Enviado!</h3>
        <p style="font-size: 0.85rem; color: var(--color-ash); margin: 0 0 20px; line-height: 1.4;">Seu reporte de partida foi salvo com sucesso.</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <button class="button button-primary" data-action="goAlbum" style="width: 100%; margin: 0; height: 36px; font-size: 0.82rem; font-weight: bold;">Ver Álbum</button>
          <button class="button button-secondary" data-action="setRoute" data-value="table" style="width: 100%; margin: 0; height: 36px; font-size: 0.82rem; font-weight: bold;">Ver Classificação (Tabela)</button>
        </div>
      </div>
    </div>
  `;
}
```

---

## 4. R1: Controller (`src/main.js`) Operations

To support single-step reports and clipboard pasting/API fetch, the event listener block and functions in `src/main.js` must be expanded:

### A. New Actions Registry
Add new operations inside `src/main.js` to bind DOM clicks:
```javascript
// Register these inside the event action dispatcher around line 942
if (action === 'pasteDeckLink') pasteDeckLink();
if (action === 'fetchDeck') fetchDeck();
if (action === 'removeDeck') removeDeck();
```

### B. Pasting from Clipboard (`pasteDeckLink`)
```javascript
async function pasteDeckLink() {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById('deck-link-input');
    if (input) {
      input.value = text.trim();
    }
  } catch (err) {
    console.error('Falha ao acessar o clipboard:', err);
  }
}
```

### C. Fetching DoK Deck Details (`fetchDeck`)
```javascript
import { parseDokResponse } from './utils/sas.js';

async function fetchDeck() {
  const input = document.getElementById('deck-link-input');
  const errorEl = document.getElementById('deck-fetch-error');
  if (!input) return;
  
  const url = input.value.trim();
  if (errorEl) errorEl.style.display = 'none';

  const matchUuid = url.match(/decks\/([0-9a-fA-F-]{36})/);
  if (!matchUuid) {
    if (errorEl) {
      errorEl.textContent = 'URL do Decks of KeyForge inválida.';
      errorEl.style.display = 'block';
    }
    return;
  }
  
  const uuid = matchUuid[1];
  const searchBtn = document.querySelector('[data-action="fetchDeck"]');
  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.textContent = 'Buscando...';
  }

  try {
    const proxy = 'https://corsproxy.io/?';
    const apiUrl = `https://www.decksofkeyforge.com/api/decks/${uuid}`;
    const response = await fetch(`${proxy}${encodeURIComponent(apiUrl)}`);
    if (!response.ok) throw new Error('Falha no proxy ou API do DoK.');
    
    const data = await response.json();
    const deckInfo = parseDokResponse(data);

    state.report.deckName = deckInfo.name;
    state.report.deckSas = deckInfo.sas;
    state.report.deckSet = deckInfo.expansion;
    state.report.deckHouses = deckInfo.houses.join(',');
    state.report.deckUrl = url;

    // Prefill houses in player selection
    state.selectedHouseCodes = deckInfo.houses;
    state.selectedPickIds = []; // clear previous picks

    render();
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = 'Erro ao buscar o deck. Verifique a conexão.';
      errorEl.style.display = 'block';
    }
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Buscar';
    }
  }
}
```

### D. Resetting Deck State (`removeDeck`)
```javascript
function removeDeck() {
  state.report.deckName = null;
  state.report.deckSas = null;
  state.report.deckSet = null;
  state.report.deckHouses = null;
  state.report.deckUrl = null;
  state.selectedHouseCodes = [];
  state.selectedPickIds = [];
  render();
}
```

### E. Adjusting Pick Toggles (`toggleReportPick`)
Modify `toggleReportPick` inside `src/main.js` to compute `maxPicks` correctly:
```javascript
function toggleReportPick(stickerId) {
  if (!state.selectedPickIds) state.selectedPickIds = [];
  const index = state.selectedPickIds.indexOf(stickerId);
  const selectedCodes = state.selectedHouseCodes || [];
  
  const eligible = PLAYER_STICKERS
    .filter(s => selectedCodes.includes(s.house))
    .filter(s => state.opponentCollection[s.id])
    .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);

  const isFallback = eligible.length === 0;
  const maxPicks = isFallback ? state.report.playerAKeys : Math.min(state.report.playerAKeys, eligible.length);

  if (index > -1) {
    state.selectedPickIds.splice(index, 1);
  } else {
    if (state.selectedPickIds.length < maxPicks) {
      state.selectedPickIds.push(stickerId);
    }
  }
  render();
}
```

### F. Submitting Single-Step Report (`submitSingleReport`)
Update the submission flow to pass the deck details and properly reset overlay flags:
```javascript
async function submitSingleReport() {
  const report = state.report;
  if (!report.deckHouses) return;
  const pickedIds = state.selectedPickIds || [];
  const matchId = report.matchId;

  if (hasSupabaseConfig) {
    const btn = document.querySelector('[data-action="submitSingleReport"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
    }
    try {
      await dbSubmitSingleReport(
        matchId,
        report.deckHouses.split(','),
        report.playerAKeys,
        report.playerBKeys,
        pickedIds,
        report.deckName,
        report.deckSas,
        report.deckSet,
        report.deckUrl
      );
      
      const fetched = await fetchFullState(state.user.id);
      if (fetched) {
        state = fetched;
        state.report.reported = true;
        state.report.completed = true;
        state.showSuccessModal = true;
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao submeter o reporte.');
    }
  } else {
    // Offline Simulation
    state.report.housesSubmitted = true;
    state.report.reported = true;
    state.report.completed = true;
    
    pickedIds.forEach(id => {
      if (state.collection[id]) {
        state.collection[id].quantity += 1;
      } else {
        state.collection[id] = { quantity: 1, source: 'pick', isNew: true };
      }
    });
    
    state.showSuccessModal = true;
  }
  render();
}
```

### G. Success Modal Route Changes
Ensure that navigating to another page automatically clears the success modal flag:
```javascript
function setRoute(route) {
  state.currentRoute = route;
  state.showSuccessModal = false; // Reset success modal
  window.history.replaceState(null, '', `#${route}`);
  render();
}
```

---

## 5. R1: Database RPC Compatibility Mismatch Warning

In `supabase/001_schema_rls.sql`, the SQL RPC `foc2026_submit_single_report` expects parameters `p_houses` and `p_picks` as **`text`** (comma-separated lists):
```sql
create or replace function public.foc2026_submit_single_report(
  p_match_id text,
  p_houses text,
  p_my_keys int,
  p_opp_keys int,
  p_picks text,
  p_deck_name text,
  ...
```
However, in `src/supabase.js`, `dbSubmitSingleReport` passes the JavaScript array inputs directly. This will fail at runtime.
- **Action**: Modify `dbSubmitSingleReport` in `src/supabase.js` to explicitly serialize the arrays:
  ```javascript
  export async function dbSubmitSingleReport(matchId, houses, myKeys, oppKeys, picks, deckName, deckSas, deckSet, deckUrl) {
    if (!supabase) return;
    
    const housesStr = Array.isArray(houses) ? houses.join(',') : houses;
    const picksStr = Array.isArray(picks) ? picks.join(',') : (picks || '');

    await supabase.rpc('foc2026_submit_single_report', {
      p_match_id: matchId,
      p_houses: housesStr,
      p_my_keys: myKeys,
      p_opp_keys: oppKeys,
      p_picks: picksStr,
      p_deck_name: deckName,
      p_deck_sas: deckSas,
      p_deck_set: deckSet,
      p_deck_url: deckUrl
    });
  }
  ```

---

## 6. R4: Unit Tests Architecture

To ensure 100% test verification without external framework dependencies, we establish a lightweight, ES-module-based test runner that executes inside Node.js.

### A. Test Runner File (`tests/run-tests.js`)
Create the test suite at `tests/run-tests.js`:
```javascript
import { getSasBadgeData } from '../src/utils/sas.js';
import { validateScore } from '../src/utils/validation.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// --- SAS Tests ---
test('SAS calculations map correctly to badges and colors', () => {
  // SAS >= 82 (Green)
  const t86 = getSasBadgeData(86);
  assert(t86.diff === 0, 'SAS 86 should have diff 0');
  assert(t86.diffStr === '0', 'SAS 86 diff string should be "0"');
  assert(t86.colorClass === 'sas-green', 'SAS 86 should be green');

  const t82 = getSasBadgeData(82);
  assert(t82.diff === -4, 'SAS 82 should have diff -4');
  assert(t82.colorClass === 'sas-green', 'SAS 82 should be green');

  const t90 = getSasBadgeData(90);
  assert(t90.diff === 4, 'SAS 90 should have diff +4');
  assert(t90.colorClass === 'sas-green', 'SAS 90 should be green');

  // 77 <= SAS <= 81 (Yellow)
  const t81 = getSasBadgeData(81);
  assert(t81.diff === -5, 'SAS 81 should have diff -5');
  assert(t81.colorClass === 'sas-yellow', 'SAS 81 should be yellow');

  const t77 = getSasBadgeData(77);
  assert(t77.diff === -9, 'SAS 77 should have diff -9');
  assert(t77.colorClass === 'sas-yellow', 'SAS 77 should be yellow');

  // SAS <= 76 (Red)
  const t76 = getSasBadgeData(76);
  assert(t76.diff === -10, 'SAS 76 should have diff -10');
  assert(t76.colorClass === 'sas-red', 'SAS 76 should be red');

  const t60 = getSasBadgeData(60);
  assert(t60.diff === -26, 'SAS 60 should have diff -26');
  assert(t60.colorClass === 'sas-red', 'SAS 60 should be red');
});

// --- Score Validation Tests ---
test('Score validation enforces win conditions, limits, and no-ties', () => {
  // Valid scores (Winner has 3 keys, Loser has 0-2 keys)
  assert(validateScore(3, 0, false).valid === true, '3x0 should be valid');
  assert(validateScore(3, 1, false).valid === true, '3x1 should be valid');
  assert(validateScore(3, 2, false).valid === true, '3x2 should be valid');
  assert(validateScore(0, 3, false).valid === true, '0x3 should be valid');
  assert(validateScore(1, 3, false).valid === true, '1x3 should be valid');
  assert(validateScore(2, 3, false).valid === true, '2x3 should be valid');

  // Invalid scores (Ties)
  assert(validateScore(3, 3, false).valid === false, '3x3 tie should be invalid');
  assert(validateScore(2, 2, false).valid === false, '2x2 tie should be invalid');
  assert(validateScore(0, 0, false).valid === false, '0x0 tie should be invalid for players');

  // Invalid scores (No winner with 3 keys)
  assert(validateScore(2, 1, false).valid === false, '2x1 should be invalid (no winner at 3)');
  assert(validateScore(1, 0, false).valid === false, '1x0 should be invalid');

  // Invalid scores (Scores exceeding 3 or negative)
  assert(validateScore(4, 2, false).valid === false, 'Keys cannot exceed 3');
  assert(validateScore(3, -1, false).valid === false, 'Keys cannot be negative');

  // WO validations (0x0 is allowed only for administrators)
  assert(validateScore(0, 0, true).valid === true, '0x0 (WO) is valid for admins');
  assert(validateScore(0, 0, true).isWO === true, '0x0 is classified as WO');
  assert(validateScore(0, 0, false).valid === false, '0x0 (WO) is invalid for regular players');
});

// --- Runner execution ---
let passed = 0;
let failed = 0;
console.log('=== running unit tests ===');
for (const t of tests) {
  try {
    t.fn();
    console.log(`[PASS] ${t.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${t.name}:`, err.message);
    failed++;
  }
}
console.log(`\nResults: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
```

### B. Integrate test execution in `package.json`
Add the test runner script to the project's scripts in `package.json`:
```json
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build && cp ../foc-album/index.html ../foc-album/404.html",
    "preview": "vite preview --host 0.0.0.0",
    "test": "node tests/run-tests.js"
  }
```

---

## 7. Clean, Step-by-Step Implementation Plan

For the implementer, follow these steps to execute this strategy safely:

### Step 1: Create Utility Files
1. Create `src/utils/validation.js` and paste the validation functions (including `HOUSE_NAME_TO_CODE` and `validateScore`).
2. Create `src/utils/sas.js` and paste the SAS calculation functions (including `parseDokResponse` and `getSasBadgeData`).

### Step 2: Implement Unit Tests
1. Create the `tests/` directory at the project root if it does not exist.
2. Create `tests/run-tests.js` and insert the test suite.
3. Update `package.json` to include `"test": "node tests/run-tests.js"` in the `"scripts"` object.
4. Execute `pnpm test` in the terminal to verify the testing harness passes correctly.

### Step 3: Modify the Database Interaction Layer
1. In `src/supabase.js`, import arrays serialization rules inside `dbSubmitSingleReport`. Ensure `houses` and `picks` are joined with commas when calling the RPC.
2. Check that the parameters list sent to `foc2026_submit_single_report` covers all 9 values (including deck details).

### Step 4: Redesign the UI Layout
1. In `src/pages/report.js`, import `getSasBadgeData` and `validateScore`.
2. Wrap `renderPreMatch` in `<details class="panel pre-match-panel" style="grid-column: 1 / -1; width: 100%; margin-bottom: 16px;">`. Add a `<summary>` with chevron indicators.
3. Implement `renderSingleReportForm(state)` returning sections for "Seu deck" (collapsible/paste inputs vs card details), "Placar" (steppers and error messages), "Figurinhas Solicitadas" (picks or consolation labels), and "Reportar Partida" submit button.
4. Implement `renderSuccessModal()` inside `report.js` and conditionally mount it in the return template when `state.showSuccessModal` is true.

### Step 5: Update the Controller State Engine
1. In `src/main.js`, update `setRoute(route)` to reset `state.showSuccessModal = false`.
2. Implement controller actions: `pasteDeckLink()`, `fetchDeck()` (parsing the clipboard or text values and fetching DoK via proxy), `removeDeck()`, `toggleReportPick()` (calculating limits based on `playerAKeys` and missing/opponent owned stickers), and `submitSingleReport()`.
3. Map events in `main.js` render actions register for `pasteDeckLink`, `fetchDeck`, `removeDeck`, `submitSingleReport` and `goAlbum`.

### Step 6: Verify
1. Run `pnpm test` to verify unit test assertions are fully satisfied.
2. Build the project using `pnpm build` to confirm Vite compilation works without errors.
