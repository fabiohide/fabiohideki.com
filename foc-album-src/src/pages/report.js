import { HOUSE_META, PLAYER_STICKERS, STICKERS } from '../data/stickers.js';
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

function getSubmitBlockedReason(hasDeckLink, hasThreeHouses, isScoreValid, correctPicks, selectedCount, maxPicks) {
  if (!hasDeckLink) {
    return 'Por favor, insira o link do seu deck.';
  }
  if (!hasThreeHouses) {
    return 'Selecione exatamente 3 casas para o seu deck.';
  }
  if (!isScoreValid) {
    return 'O placar inserido é inválido (vencedor deve ter 3 chaves, sem empates).';
  }
  if (!correctPicks) {
    return `Selecione a quantidade correta de figurinhas (${selectedCount}/${maxPicks} selecionadas).`;
  }
  return 'Preencha todos os campos obrigatórios.';
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

      <div class="section-heading" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 10px; margin-bottom: 16px;">
        <h2>${activeTab === 'match' ? `Rodada ${state.activeRound.number} - SAS 86` : 'Desafios'}</h2>
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

  const count = iCanGet.length;
  const label = (count === 2 || count >= 3) ? 'diferentes' : 'diferente';
  const badgeBg = count >= 3 ? 'rgba(0, 204, 102, 0.15)' : 'rgba(255, 140, 0, 0.15)';
  const badgeColor = count >= 3 ? '#00cc66' : '#ff8c00';

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
          <span class="pre-match-badge can-get" style="margin: 0; padding: 2px 8px; background: ${badgeBg}; color: ${badgeColor}; border-radius: var(--radius-sm); font-size: 0.72rem;">
            ${count} ${label}
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
              const hasDiffForOpponent = myHouses[code].some(s => !state.opponentCollection[s.id] || state.opponentCollection[s.id].quantity === 0);
              const itemClass = hasDiffForOpponent
                ? 'has-all'
                : (owned > 0 ? 'opp-has-some' : 'has-none');

              let inlineStyle = '';
              let hexSvg = '';
              const hasEmblem = state.collection[code + ' 0'] && state.collection[code + ' 0'].quantity > 0;
              if (owned === 0 && hasEmblem) {
                const oppHasAll = opponentHouses[code].length === total;
                const fill = oppHasAll ? 'var(--color-ash)' : 'var(--color-signal-blue)';
                hexSvg = `
                  <svg viewBox="0 0 100 100" style="width: 12px; height: 12px; fill: ${fill}; margin-right: 4px; display: inline-block; vertical-align: middle; flex-shrink: 0;">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25"/>
                  </svg>
                `;
                inlineStyle = `style="border: 2.5px solid ${fill};"`;
              }

              return `
                <details class="pre-match-accordion-item ${itemClass}" ${inlineStyle}>
                  <summary class="pre-match-accordion-header">
                    ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" class="house-mini-icon"/>` : ''}
                    <span class="house-mini-name">${code}</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                      ${hexSvg}
                      <span class="house-mini-count" style="margin: 0;">${owned}/${total}</span>
                    </div>
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
              const hasDiffForPlayer = opponentHouses[code].some(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);
              const itemClass = hasDiffForPlayer
                ? 'has-missing'
                : (owned > 0 ? 'opp-has-some' : 'has-none');

              let inlineStyle = '';
              let hexOppSvg = '';
              const oppHasEmblem = state.opponentCollection[code + ' 0'] && state.opponentCollection[code + ' 0'].quantity > 0;
              if (owned === 0 && oppHasEmblem) {
                const iHaveAll = myHouses[code].length === total;
                const fill = iHaveAll ? 'var(--color-ash)' : 'var(--color-green)';
                hexOppSvg = `
                  <svg viewBox="0 0 100 100" style="width: 12px; height: 12px; fill: ${fill}; margin-right: 4px; display: inline-block; vertical-align: middle; flex-shrink: 0;">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25"/>
                  </svg>
                `;
                inlineStyle = `style="border: 2.5px solid ${fill};"`;
              }

              return `
                <details class="pre-match-accordion-item ${itemClass}" ${inlineStyle}>
                  <summary class="pre-match-accordion-header">
                    ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" class="house-mini-icon"/>` : ''}
                    <span class="house-mini-name">${code}</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                      ${hexOppSvg}
                      <span class="house-mini-count" style="margin: 0;">${owned}/${total}</span>
                    </div>
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

            const houseStickers = PLAYER_STICKERS.filter(s => s.house === house.code);
            const hasOpponentUnique = houseStickers.some(s => state.opponentCollection[s.id] && (!state.collection[s.id] || state.collection[s.id].quantity === 0));
            
            const oppPlayerStickersCount = houseStickers.filter(s => state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0).length;
            const hasEmblem = state.collection[house.code + ' 0'] && state.collection[house.code + ' 0'].quantity > 0;
            const playerIsMissingStickers = houseStickers.some(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);
            const showHexagon = hasEmblem && oppPlayerStickersCount === 0 && playerIsMissingStickers && !isSelected;
            
            const showDot = hasOpponentUnique && !isSelected && !showHexagon;

            return `
              <button class="house-selector-chip ${isSelected ? 'is-selected' : ''}" 
                      data-action="toggleHouse" 
                      data-value="${house.code}" 
                      type="button"
                      style="position: relative;">
                ${showDot ? '<span class="house-green-dot"></span>' : ''}
                ${showHexagon ? `
                  <svg class="house-green-hexagon" viewBox="0 0 24 24" fill="currentColor" style="position: absolute; top: 4px; right: 4px; width: 12px; height: 12px; color: #00cc66; filter: drop-shadow(0 0 3px rgba(0, 204, 102, 0.6)); pointer-events: none;">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
                  </svg>
                ` : ''}
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
      let ruleLabelText = '';
      
      if (!state.report.fallbackActive) {
        // Pick Normal
        // 1. Add opponent eligible stickers
        const eligibleInSelected = oppEligibleInSelected.map(s => ({ ...s, source: 'opponent' }));
        pool = [...eligibleInSelected];
        
        // 2. Add emblem fallback stickers for selected houses where opponent has 0 player stickers
        selectedCodes.forEach(hc => {
          const oppHasZero = !PLAYER_STICKERS.some(s => s.house === hc && state.opponentCollection[s.id] && state.opponentCollection[s.id].quantity > 0);
          if (oppHasZero) {
            const hasEmblem = state.collection[hc + ' 0'] && state.collection[hc + ' 0'].quantity > 0;
            if (hasEmblem) {
              const missingInHouse = PLAYER_STICKERS.filter(s => 
                s.house === hc && 
                (!state.collection[s.id] || state.collection[s.id].quantity === 0)
              );
              missingInHouse.forEach(s => {
                pool.push({ ...s, source: 'emblem' });
              });
            }
          }
        });

        const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
          const hasEligible = pool.some(s => s.house === hc);
          return sum + (hasEligible ? 1 : 0);
        }, 0);
        maxPicks = Math.min(myKeys, maxPicksPossible);
        ruleLabelText = `Pick Normal: Você pode escolher até 1 figurinha inédita do oponente para cada casa do seu deck. As figurinhas de brasão do oponente permitem você escolher uma figurinha da casa correspondente, contanto que ele não tenha nenhuma figurinha de jogador nela.`;
      } else {
        const poolMap = new Map();
        selectedCodes.forEach(houseCode => {
          const oppEligibleInHouse = oppEligibleInSelected.filter(s => s.house === houseCode);
          if (oppEligibleInHouse.length > 0) {
            oppEligibleInHouse.forEach(s => {
              poolMap.set(s.id, { ...s, source: 'opponent' });
            });
          } else {
            const playerMissingInHouse = PLAYER_STICKERS.filter(s => 
              s.house === houseCode && 
              (!state.collection[s.id] || state.collection[s.id].quantity === 0)
            );
            playerMissingInHouse.forEach(s => {
              poolMap.set(s.id, { ...s, source: 'fallback' });
            });
          }
        });
        
        pool = Array.from(poolMap.values());
        const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
          const hasEligible = pool.some(s => s.house === hc);
          return sum + (hasEligible ? 1 : 0);
        }, 0);
        maxPicks = Math.min(myKeys, maxPicksPossible);
        const figText = maxPicks === 1 ? 'figurinha inédita' : 'figurinhas inéditas';
        ruleLabelText = `Quebra-Regra Ativo: Você pode escolher até ${maxPicks} ${figText} para cada casa do seu deck, mesmo que seu oponente não tenha ela.`;
      }

      picksSectionHtml = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <h4 style="margin: 0;">Figurinhas Solicitadas</h4>
            <span class="selection-counter">${state.selectedPickIds.length}/${maxPicks} selecionadas</span>
          </div>

          <!-- Quebra-Regra Toggle -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0 12px; padding: 8px 12px; background: rgba(255, 152, 0, 0.04); border: 1px solid rgba(255, 152, 0, 0.12); border-radius: var(--radius-md);">
            <span style="font-size: 0.8rem; font-weight: 700; color: ${state.report.fallbackActive ? '#ff9800' : 'var(--color-ash)'};">
              ${state.report.fallbackActive ? 'Quebra-Regra Ativo' : 'Quebra-Inativo'}
            </span>
            <label class="quebra-regra-switch" style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
              <input type="checkbox" data-action="toggleQuebraRegra" style="opacity: 0; width: 0; height: 0;" ${state.report.fallbackActive ? 'checked' : ''}>
              <span class="slider" style="position: absolute; cursor: pointer; inset: 0; background-color: var(--color-iron); transition: .3s; border-radius: 24px; border: 1.5px solid rgba(255,255,255,0.08);"></span>
            </label>
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
                  
                  const hasEmblem = state.collection[sticker.house + ' 0'] && state.collection[sticker.house + ' 0'].quantity > 0;
                  let borderStyle = '';
                  if (isSelected) {
                    borderStyle = 'border-color: var(--color-signal-blue); background: rgba(49, 133, 255, 0.04);';
                  } else if (hasEmblem) {
                    const borderColor = sticker.source === 'emblem' ? 'var(--color-signal-blue)' : 'var(--color-green)';
                    borderStyle = `border-color: ${borderColor}; background: rgba(255, 255, 255, 0.01);`;
                  }
                  
                  const sourceBadge = sticker.source === 'opponent'
                    ? `<span style="font-size: 0.65rem; background: rgba(76, 175, 80, 0.15); color: #81c784; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; margin-left: 8px; display: inline-block; border: 1px solid rgba(76, 175, 80, 0.2);">Oponente</span>`
                    : (sticker.source === 'emblem'
                      ? `<span style="font-size: 0.65rem; background: rgba(49, 133, 255, 0.15); color: #8db9ff; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; margin-left: 8px; display: inline-block; border: 1px solid rgba(49, 133, 255, 0.2);">Brasão</span>`
                      : `<span style="font-size: 0.65rem; background: rgba(255, 152, 0, 0.15); color: #ffb74d; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: bold; margin-left: 8px; display: inline-block; border: 1px solid rgba(255, 152, 0, 0.2);">Quebra-Regra</span>`);

                  return `
                    <div class="picker-list-item" style="padding: 10px 12px; min-height: auto; ${borderStyle}">
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

          ${state.report.fallbackActive ? `
            <div style="margin-top: 14px; margin-bottom: 14px; padding: 12px; background: rgba(255, 152, 0, 0.02); border-radius: var(--radius-md); border: 1px solid rgba(255, 152, 0, 0.08);">
              <span style="font-size: 0.78rem; font-weight: 800; color: #ff9800; display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em;">Motivo:</span>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: ${state.report.quebraRegraMotive === 'qty' ? 'var(--color-paper)' : 'var(--color-ash)'}; cursor: pointer; line-height: 1.3;">
                  <input type="radio" name="quebra_regra_motivo" data-action="setQuebraRegraMotive" data-value="qty" ${state.report.quebraRegraMotive === 'qty' ? 'checked' : ''} style="margin: 2px 0 0 0; accent-color: #ff9800; width: 14px; height: 14px; flex-shrink: 0;">
                  <span>Quantidade de Figurinhas Inéditas do oponente menor que 3.</span>
                </label>
                <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: ${state.report.quebraRegraMotive === 'combo' ? 'var(--color-paper)' : 'var(--color-ash)'}; cursor: pointer; line-height: 1.3;">
                  <input type="radio" name="quebra_regra_motivo" data-action="setQuebraRegraMotive" data-value="combo" ${state.report.quebraRegraMotive === 'combo' ? 'checked' : ''} style="margin: 2px 0 0 0; accent-color: #ff9800; width: 14px; height: 14px; flex-shrink: 0;">
                  <span>Combinações de casas impossível pelas coleções não especiais.</span>
                </label>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // 4. Submit button
  const hasDeckLink = Boolean(report.deckUrl);
  let correctPicks = false;
  let maxPicks = myKeys;
  if (isScoreValid && hasThreeHouses) {
    const selectedCodes = state.selectedHouseCodes || [];
    const oppEligible = PLAYER_STICKERS.filter(s => 
      state.opponentCollection[s.id] && 
      (!state.collection[s.id] || state.collection[s.id].quantity === 0)
    );
    const oppEligibleInSelected = oppEligible.filter(s => selectedCodes.includes(s.house));
    
    let pool = [];
    if (!state.report.fallbackActive) {
      pool = oppEligibleInSelected;
      const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
        const houseEligible = pool.filter(s => s.house === hc);
        const hasEmblem = state.collection[hc + ' 0'] && state.collection[hc + ' 0'].quantity > 0;
        const limit = hasEmblem ? houseEligible.length : Math.min(1, houseEligible.length);
        return sum + limit;
      }, 0);
      maxPicks = Math.min(myKeys, maxPicksPossible);
    } else {
      const poolMap = new Map();
      selectedCodes.forEach(houseCode => {
        const oppEligibleInHouse = oppEligibleInSelected.filter(s => s.house === houseCode);
        if (oppEligibleInHouse.length > 0) {
          oppEligibleInHouse.forEach(s => {
            poolMap.set(s.id, s);
          });
        } else {
          const playerMissingInHouse = PLAYER_STICKERS.filter(s => 
            s.house === houseCode && 
            (!state.collection[s.id] || state.collection[s.id].quantity === 0)
          );
          playerMissingInHouse.forEach(s => {
            poolMap.set(s.id, s);
          });
        }
      });
      pool = Array.from(poolMap.values());
      const maxPicksPossible = selectedCodes.reduce((sum, hc) => {
        const houseEligible = pool.filter(s => s.house === hc);
        const hasEmblem = state.collection[hc + ' 0'] && state.collection[hc + ' 0'].quantity > 0;
        const limit = hasEmblem ? houseEligible.length : Math.min(1, houseEligible.length);
        return sum + limit;
      }, 0);
      maxPicks = Math.min(myKeys, maxPicksPossible);
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
      ${!canSubmit ? `
        <div class="submit-tooltip" style="margin-top: 8px; padding: 10px 12px; background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.2); border-radius: var(--radius-md); display: flex; align-items: flex-start; gap: 8px;">
          <svg style="width: 14px; height: 14px; color: #ff5252; flex-shrink: 0; margin-top: 2px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span style="font-size: 0.76rem; color: #ff8a80; line-height: 1.3;">
            ${getSubmitBlockedReason(hasDeckLink, hasThreeHouses, isScoreValid, correctPicks, state.selectedPickIds.length, maxPicks)}
          </span>
        </div>
      ` : ''}
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
