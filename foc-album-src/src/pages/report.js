import { HOUSE_META, PLAYER_STICKERS } from '../data/stickers.js';
import { renderChallengesContent } from './challenges.js';
import { getAssetUrl } from '../utils/format.js';
import { getSasBadgeData } from '../utils/sas.js';
import { validateScore } from '../utils/validation.js';


function formatDeadlineDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const day = date.getDate();
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

export function renderReport(state) {
  if (!state.user.packOpened) {
    return `
      <section class="page-view report-view">
        <div class="locked-panel">
          <span class="lock-mark">◇</span>
          <h2>Reporte bloqueado</h2>
          <p>Abra o pacotinho inicial para liberar a rodada.</p>
        </div>
      </section>
    `;
  }

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
      
      ${renderReportModal(state)}
    </section>
  `;
}

function renderMatchReportContent(state) {
  const report = state.report;
  
  // Encontra a partida do jogador no array de partidas
  const myMatch = state.matches && state.matches.find(m => m.id === report.matchId);
  
  if (!myMatch) {
    return `
      <div class="panel" style="padding: 24px; text-align: center; color: var(--color-ash); background: var(--color-carbon); border-radius: var(--radius-lg); box-shadow: var(--shadow-subtle);">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 12px; filter: grayscale(1) opacity(0.5);">⏱</span>
        <h4 style="color: var(--color-paper); font-size: 1.05rem; margin: 0 0 6px;">Nenhuma partida nesta rodada</h4>
        <p style="font-size: 0.82rem; margin: 0; line-height: 1.4;">Você não possui confrontos agendados para a Rodada ${state.activeRound.number}.</p>
      </div>
    `;
  }

  return `
      <div class="round-info-bar">
        <span class="deadline-badge">Prazo: ${formatDeadlineDate(state.activeRound.deadline)}</span>
      </div>

      <article class="panel match-card">
        <div class="match-info">
          <span class="panel-label">Mesa 1</span>
          <h3>${myMatch.playerA} <span class="vs">vs</span> ${myMatch.playerB}</h3>
        </div>
        <div class="match-status-container">
          ${statusPill(report)}
        </div>
      </article>

      ${!report.reported ? renderPreMatch(state) : ''}
      ${!report.reported ? renderSingleReportForm(state) : renderReportSummary(state)}
  `;
}

function statusPill(report) {
  if (report.reported) return '<strong class="status-pill is-completed">Reporte Enviado</strong>';
  return '<strong class="status-pill is-waiting">Pendente</strong>';
}

function renderPreMatch(state) {
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
  const isPlayerA = state.report.isPlayerA;
  const opponentName = opponent ? (isPlayerA ? opponent.playerB : opponent.playerA) : 'Adversário';

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
        <div class="pre-match-col">
          <span class="panel-label">Sua coleção</span>
          <div class="pre-match-houses">
            ${Object.keys(HOUSE_META).map(code => {
              const house = HOUSE_META[code];
              const total = PLAYER_STICKERS.filter(s => s.house === code).length;
              const owned = myHouses[code].length;
              return `
                <details class="pre-match-accordion-item ${owned > 0 ? 'has-some' : 'has-none'} ${owned === total ? 'has-all' : ''}">
                  <summary class="pre-match-accordion-header">
                    ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" class="house-mini-icon"/>` : ''}
                    <span class="house-mini-name">${code}</span>
                    <span class="house-mini-count">${owned}/${total}</span>
                    <span class="chevron-icon">▼</span>
                  </summary>
                  <div class="pre-match-accordion-content">
                    ${myHouses[code].length === 0
                      ? '<p class="empty-text">Nenhuma obtida</p>'
                      : `<ul>
                          ${myHouses[code].map(s => `<li><strong>${s.id}</strong> — ${s.name}</li>`).join('')}
                         </ul>`
                    }
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        </div>
        <div class="pre-match-col">
          <span class="panel-label">${opponentName}</span>
          <div class="pre-match-houses">
            ${Object.keys(HOUSE_META).map(code => {
              const house = HOUSE_META[code];
              const total = PLAYER_STICKERS.filter(s => s.house === code).length;
              const owned = opponentHouses[code].length;
              return `
                <details class="pre-match-accordion-item ${owned > 0 ? 'has-some' : 'has-none'} ${owned === total ? 'has-all' : ''}">
                  <summary class="pre-match-accordion-header">
                    ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" class="house-mini-icon"/>` : ''}
                    <span class="house-mini-name">${code}</span>
                    <span class="house-mini-count">${owned}/${total}</span>
                    <span class="chevron-icon">▼</span>
                  </summary>
                  <div class="pre-match-accordion-content">
                    ${opponentHouses[code].length === 0
                      ? '<p class="empty-text">Nenhuma obtida</p>'
                      : `<ul>
                          ${opponentHouses[code].map(s => `<li><strong>${s.id}</strong> — ${s.name}</li>`).join('')}
                         </ul>`
                    }
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </details>
  `;
}

function houseChip(code, revealed = false, delayIndex = 0) {
  const house = HOUSE_META[code];
  const revealClass = revealed ? `is-revealed reveal-delay-${delayIndex}` : '';
  return `
    <span class="house-chip ${revealClass}">
      ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" />` : ''}
      <strong>${code}</strong>
    </span>
  `;
}

function renderSingleReportForm(state) {
  const report = state.report;
  
  // 1. Seu deck view
  const deckSectionHtml = `
    <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
      <h4 style="margin: 0;">Seu deck</h4>
      <div class="deck-input-row" style="display: flex; gap: 8px; align-items: center; width: 100%;">
        <input type="text" id="deck-link-input" placeholder="Link do Decks of KeyForge" 
               style="margin: 0; background: var(--color-graphite); border: 1.5px solid rgba(255,255,255,0.08); color: var(--color-paper); border-radius: var(--radius-md); padding: 0 12px; font-size: 0.85rem; flex: 1; min-height: 44px;" 
               value="${report.deckUrl || ''}" />
        <button class="button button-secondary btn-paste" data-action="pasteDeckLink" 
                style="margin: 0; padding: 0 14px; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem; font-weight: bold; flex-shrink: 0;">
          Colar
        </button>
      </div>
      
      <div style="margin-top: 12px;">
        <span class="panel-label" style="font-size: 0.78rem; display: block; margin-bottom: 8px; color: var(--color-ash);">Selecione as 3 casas do seu deck:</span>
        <div class="house-selector-grid" style="margin: 0;">
          ${Object.values(HOUSE_META).map((house) => {
            const isSelected = state.selectedHouseCodes.includes(house.code);
            return `
              <button class="house-selector-chip ${isSelected ? 'is-selected' : ''}" 
                      data-action="toggleHouse" 
                      data-value="${house.code}" 
                      type="button"
                      style="position: relative;">
                <img src="${getAssetUrl(house.icon)}" alt="${house.name}" />
                <span class="house-name">${house.name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // 2. Placar view — jogador reporta suas chaves forjadas E as do adversário
  const validation = validateScore(report.playerAKeys, report.playerBKeys, state.user.isAdmin);
  const isScoreValid = validation.valid;

  const scoreErrorHtml = !isScoreValid
    ? `<div class="alert-box is-error" style="margin: 8px 0 0 0;"><div class="alert-content">${validation.message}</div></div>`
    : '';

  const scoreSectionHtml = `
    <div style="margin-bottom: 24px;">
      <h4 style="margin: 0 0 6px 0;">Placar da Partida</h4>
      <p style="margin: 0 0 10px 0; font-size: 0.78rem; color: var(--color-ash);">Quantas chaves cada jogador forjou?</p>
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

  // 3. Picks view — baseado nas próprias chaves forjadas e nas regras de elegibilidade
  let picksSectionHtml = '';
  const myKeys = report.playerAKeys;
  const hasThreeHouses = state.selectedHouseCodes && state.selectedHouseCodes.length === 3;

  if (isScoreValid && hasThreeHouses) {
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
      const selectedCodes = state.selectedHouseCodes || [];
      
      // Opponent eligible stickers (opponent has, player is missing)
      const oppEligible = PLAYER_STICKERS.filter(s => 
        state.opponentCollection[s.id] && 
        (!state.collection[s.id] || state.collection[s.id].quantity === 0)
      );
      
      const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));
      
      let pool = [];
      let maxPicks = myKeys;
      let isFallback = false;
      let ruleLabelText = '';
      
      if (oppEligible.length >= 3) {
        pool = oppEligibleInSelected.map(s => ({ ...s, source: 'opponent' }));
        maxPicks = Math.min(myKeys, pool.length);
        ruleLabelText = `O oponente possui pelo menos 3 figurinhas inéditas. Você pode escolher até ${maxPicks} figurinha(s) inédita(s) dele nas casas selecionadas.`;
      } else {
        const playerMissing = PLAYER_STICKERS.filter(s => 
          selectedCodes.includes(s.house) && 
          (!state.collection[s.id] || state.collection[s.id].quantity === 0)
        );
        
        const poolMap = new Map();
        oppEligibleInSelected.forEach(s => {
          poolMap.set(s.id, { ...s, source: 'opponent' });
        });
        playerMissing.forEach(s => {
          if (!poolMap.has(s.id)) {
            poolMap.set(s.id, { ...s, source: 'fallback' });
          }
        });
        
        pool = Array.from(poolMap.values());
        maxPicks = Math.min(myKeys, pool.length);
        isFallback = true;
        ruleLabelText = `O oponente possui apenas ${oppEligible.length} figurinha(s) inédita(s). Você pode pegar as dele mais figurinhas da(s) casa(s) restante(s) do seu deck (fallback) para somar até ${maxPicks}.`;
      }

      picksSectionHtml = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <h4 style="margin: 0;">Figurinhas Solicitadas</h4>
            <span class="selection-counter">${state.selectedPickIds.length}/${maxPicks} selecionadas</span>
          </div>
          <p class="picker-instruction" style="margin: 0 0 10px 0; font-size: 0.78rem; color: var(--color-ash);">
            ${ruleLabelText}
          </p>
          
          ${pool.length === 0 
            ? `<p style="font-size: 0.82rem; color: var(--color-ash); font-style: italic;">Nenhuma figurinha disponível nas suas casas.</p>`
            : `
              <div class="picker-list" style="margin: 0; gap: 8px;">
                ${pool.map(sticker => {
                  const isSelected = state.selectedPickIds.includes(sticker.id);
                  const isLimitReached = state.selectedPickIds.length >= maxPicks;
                  const btnDisabled = !isSelected && isLimitReached;
                  
                  const sourceBadge = sticker.source === 'opponent'
                    ? `<span style="font-size: 0.65rem; background: rgba(76, 175, 80, 0.15); color: #81c784; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; margin-left: 8px; display: inline-block; border: 1px solid rgba(76, 175, 80, 0.2);">Oponente</span>`
                    : `<span style="font-size: 0.65rem; background: rgba(255, 152, 0, 0.15); color: #ffb74d; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; margin-left: 8px; display: inline-block; border: 1px solid rgba(255, 152, 0, 0.2);">Fallback/Geral</span>`;

                  return `
                    <div class="picker-list-item" style="padding: 10px 12px; min-height: auto; ${isSelected ? 'border-color: var(--color-signal-blue); background: rgba(49, 133, 255, 0.04);' : ''}">
                      <div style="display: flex; flex-direction: column;">
                        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                          <strong style="font-size: 0.9rem;">${sticker.name}</strong>
                          ${sourceBadge}
                        </div>
                        <span style="font-size: 0.75rem; margin-top: 2px; color: var(--color-ash);">ID: ${sticker.id} | Casa: ${sticker.house}</span>
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
  const hasDeckLink = Boolean(report.deckUrl);
  let correctPicks = false;
  if (isScoreValid && hasThreeHouses) {
    const selectedCodes = state.selectedHouseCodes || [];
    const oppEligible = PLAYER_STICKERS.filter(s => 
      state.opponentCollection[s.id] && 
      (!state.collection[s.id] || state.collection[s.id].quantity === 0)
    );
    const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));
    
    let pool = [];
    let maxPicks = myKeys;
    if (oppEligible.length >= 3) {
      pool = oppEligibleInSelected;
      maxPicks = Math.min(myKeys, pool.length);
    } else {
      const playerMissing = PLAYER_STICKERS.filter(s => 
        selectedCodes.includes(s.house) && 
        (!state.collection[s.id] || state.collection[s.id].quantity === 0)
      );
      
      const poolMap = new Map();
      oppEligibleInSelected.forEach(s => {
        poolMap.set(s.id, s);
      });
      playerMissing.forEach(s => {
        if (!poolMap.has(s.id)) {
          poolMap.set(s.id, s);
        }
      });
      pool = Array.from(poolMap.values());
      maxPicks = Math.min(myKeys, pool.length);
    }
    correctPicks = myKeys === 0 || state.selectedPickIds.length === maxPicks;
  }
  
  const canSubmit = hasDeckLink && hasThreeHouses && isScoreValid && correctPicks;

  return `
    <div class="panel" style="grid-column: 1 / -1; margin-top: 16px; padding: 20px; background: var(--color-carbon); border-radius: var(--radius-lg); width: 100%; box-sizing: border-box;">
      ${deckSectionHtml}
      ${scoreSectionHtml}
      ${picksSectionHtml}
      
      <button class="button button-primary" data-action="submitSingleReport" ${!canSubmit ? 'disabled' : ''} style="width: 100%; margin: 16px 0 0 0; height: 44px; font-size: 0.9rem; text-transform: uppercase; font-weight: 700;">
        Reportar Partida
      </button>
    </div>
  `;
}

function renderReportModal(state) {
  if (!state.reportModal) return '';
  const m = state.reportModal;
  const isSuccess = m.type === 'success';
  const icon = isSuccess ? '✓' : '✕';
  const iconColor = isSuccess ? 'var(--color-green)' : '#ff4d4d';
  
  return `
    <div class="highlight-overlay" id="reportResultModal">
      <div class="highlight-overlay-bg" data-action="closeReportModal"></div>
      <div class="highlight-content" style="background: var(--color-carbon); padding: 28px; border-radius: var(--radius-lg); border: 1.5px solid rgba(255, 255, 255, 0.08); text-align: center; max-width: 360px; box-shadow: var(--shadow-deep); z-index: 2001; display: flex; flex-direction: column; align-items: center;">
        <span style="font-size: 2.8rem; color: ${iconColor}; display: block; margin-bottom: 8px; font-weight: bold; line-height: 1;">${icon}</span>
        <h3 style="font-family: var(--font-display); color: var(--color-paper); margin: 0 0 8px; font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">${m.title}</h3>
        <p style="font-size: 0.85rem; color: var(--color-ash); margin: 0 0 20px; line-height: 1.4; text-align: center;">${m.message}</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          ${isSuccess 
            ? `
              <button class="button button-primary" data-action="goAlbum" style="width: 100%; margin: 0; height: 36px; font-size: 0.82rem; font-weight: bold; font-family: 'Fixture', sans-serif; text-transform: uppercase;">Ver Álbum</button>
              <button class="button button-secondary" data-action="closeReportModal" style="width: 100%; margin: 0; height: 36px; font-size: 0.82rem; font-weight: bold; font-family: 'Fixture', sans-serif; text-transform: uppercase;">Fechar</button>
            `
            : `
              <button class="button button-primary" data-action="closeReportModal" style="width: 100%; margin: 0; height: 36px; font-size: 0.82rem; font-weight: bold; font-family: 'Fixture', sans-serif; text-transform: uppercase;">Tentar Novamente</button>
            `
          }
        </div>
      </div>
    </div>
  `;
}

function renderReportSummary(state) {
  const report = state.report;
  const myMatch = state.matches && state.matches.find(m => m.id === report.matchId);
  const isPlayerA = report.isPlayerA;
  const myHouses = (isPlayerA ? myMatch?.player_a_houses : myMatch?.player_b_houses)?.split(',') || [];
  const myKeys = isPlayerA ? myMatch?.player_a_keys : myMatch?.player_b_keys;
  // oppKeys = chaves que o adversário reportou para si mesmo (player_b_keys se sou A, player_a_keys se sou B)
  const oppKeys = isPlayerA ? myMatch?.player_b_keys : myMatch?.player_a_keys;
  
  const myPicks = (isPlayerA ? myMatch?.player_a_picks : myMatch?.player_b_picks)?.split(',').filter(Boolean) || [];

  return `
    <div class="panel" style="margin-top: 20px; padding: 24px; background: var(--color-carbon); border-radius: var(--radius-lg);">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 2.5rem; color: var(--color-green); display: block; margin-bottom: 8px;">✓</span>
        <h4 style="color: var(--color-paper); font-size: 1.2rem; margin: 0 0 6px;">Reporte Enviado!</h4>
        <p style="font-size: 0.85rem; color: var(--color-ash); margin: 0;">Seus dados de partida foram enviados com sucesso e não requerem confirmação do adversário.</p>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; display: flex; flex-direction: column; gap: 14px;">
        <div>
          <span class="panel-label">Seu deck jogado</span>
          <div class="house-chips" style="display: flex; gap: 8px; margin-top: 6px;">
            ${myHouses.map(code => houseChip(code)).join('')}
          </div>
        </div>

        <div>
          <span class="panel-label">Resultado reportado por você</span>
          <div class="report-score-line">
            <span>Você forjou</span>
            <span style="color: var(--color-gold); font-size: 1.3rem; font-weight: 900; font-family: var(--font-display);">${myKeys}</span>
            <span>chave(s)</span>
            ${oppKeys !== undefined && oppKeys !== null
              ? `<span style="color: var(--color-ash); font-size: 0.85rem; font-weight: 400;">· Adversário reportou</span><span style="color: var(--color-gold); font-size: 1.3rem; font-weight: 900; font-family: var(--font-display);">${oppKeys}</span><span style="color: var(--color-ash); font-size: 0.85rem; font-weight: 400;">chave(s)</span>`
              : '<span style="color: var(--color-ash); font-size: 0.85rem; font-weight: 400;">· Aguardando reporte do adversário</span>'
            }
          </div>
        </div>

        <div>
          <span class="panel-label">Figurinhas solicitadas (Picks)</span>
          <div style="margin-top: 6px;">
            ${myPicks.length > 0
              ? myPicks.map(id => `<span style="background: var(--color-graphite); padding: 4px 10px; border-radius: var(--radius-sm); margin-right: 6px; font-weight: 700; border: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: var(--color-paper); display: inline-block;">${id}</span>`).join('')
              : '<span style="font-size: 0.85rem; color: var(--color-ash);">Nenhuma figurinha solicitada (0 chaves forjadas ou sem picks válidos).</span>'
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initCountdown(state) {
  // Mantido para compatibilidade, sem necessidade de contador ativo no novo fluxo
}
