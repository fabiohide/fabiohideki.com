import { HOUSE_META, PLAYER_STICKERS } from '../data/stickers.js';
import { renderChallengesContent } from './challenges.js';
import { getAssetUrl } from '../utils/format.js';

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

      ${!report.completed ? renderPreMatch(state) : ''}
      ${renderHousesSection(state)}
      ${report.housesSubmitted ? renderScoreSection(report, state) : ''}
      ${report.confirmed ? renderPicker(state) : ''}
  `;
}

function statusPill(report) {
  if (report.completed) return '<strong class="status-pill is-completed">Picks Concluídos</strong>';
  if (report.confirmed) return '<strong class="status-pill is-confirmed">Confirmada</strong>';
  if (report.conflict) return '<strong class="status-pill is-conflict">Conflito</strong>';
  if (report.reported) return '<strong class="status-pill is-reported">Aguardando confirmação</strong>';
  if (report.opponentReported) return '<strong class="status-pill is-active">Confirmar reporte</strong>';
  if (report.housesSubmitted) return '<strong class="status-pill is-active">Aguardando Placar</strong>';
  return '<strong class="status-pill is-waiting">Aguardando Casas</strong>';
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
  const heCanGet = PLAYER_STICKERS.filter(s =>
    state.collection[s.id] && (!state.opponentCollection[s.id] || state.opponentCollection[s.id].quantity === 0)
  );

  const opponent = state.matches.find(m => m.id === state.report.matchId);
  const opponentName = opponent ? opponent.playerB : 'Adversário';

  return `
    <section class="panel pre-match-panel">
      <div class="step-header">
        <span class="step-number">Pré-partida</span>
        <h4>Figurinhas disponíveis</h4>
        <p>Veja o que cada jogador tem antes de escolher seu deck.</p>
      </div>

      <div class="pre-match-summary">
        <span class="pre-match-badge can-get">${iCanGet.length} figurinha${iCanGet.length !== 1 ? 's' : ''} que você pode tentar pegar</span>
      </div>

      <div class="pre-match-grid">
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
    </section>
  `;
}

function renderHousesSection(state) {
  const report = state.report;
  const selectedCodes = state.selectedHouseCodes || [];
  
  if (!report.housesSubmitted) {
    const allHouses = Object.keys(HOUSE_META);
    return `
      <section class="panel houses-panel">
        <div class="step-header">
          <span class="step-number">Etapa 1</span>
          <h4>Selecione as 3 casas do seu deck</h4>
        </div>
        <div class="house-selector-grid">
          ${allHouses.map((code) => {
            const house = HOUSE_META[code];
            const isSelected = selectedCodes.includes(code);
            return `
              <button class="house-selector-chip ${isSelected ? 'is-selected' : ''}" 
                      data-action="toggleHouse" 
                      data-value="${code}" 
                      type="button">
                ${house ? `<img src="${getAssetUrl(house.icon)}" alt="" />` : ''}
                <span class="house-name">${code}</span>
                ${isSelected ? '<span class="check-indicator">✓</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="panel-action-bar">
          <span class="selection-counter">${selectedCodes.length} de 3 selecionadas</span>
          <button class="button button-primary" data-action="submitHouses" ${selectedCodes.length === 3 ? '' : 'disabled'}>
            Confirmar casas
          </button>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel houses-panel">
      <div class="panel-row-divided">
        <div class="deck-display">
          <span class="panel-label">Seu deck</span>
          <div class="house-chips">
            ${selectedCodes.map((code) => houseChip(code)).join('')}
          </div>
        </div>
        <div class="deck-display">
          <span class="panel-label">Deck do adversário</span>
          <div class="house-chips">
            ${report.confirmed || report.completed 
              ? report.opponentHouses.map((code, idx) => houseChip(code, true, idx)).join('') 
              : ['???', '???', '???'].map((code) => `<span class="house-chip is-hidden">${code}</span>`).join('')}
          </div>
        </div>
      </div>
    </section>
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

function renderScoreSection(report, state) {
  const showStepper = !report.reported || report.conflict;
  const isExpired = state && state.activeRound.deadline && new Date(state.activeRound.deadline) < new Date();
  const ownKeys = report.playerAKeys;
  
  return `
    <section class="panel score-panel">
      <div class="step-header">
        <span class="step-number">Etapa 2</span>
        <h4>${report.opponentReported && !report.reported ? 'Confirme o reporte da partida' : 'Informe suas chaves forjadas'}</h4>
        <p>Cada jogador reporta apenas as próprias chaves. O segundo reporte confirma a partida.</p>
      </div>

      ${report.conflict ? `
        <div class="alert-box is-error">
          <span class="alert-icon">⚠</span>
          <div class="alert-content">
            <strong>Divergência nos dados!</strong>
            <p>Seu reporte: Você ${report.playerAKeys} - ${report.playerBKeys} Oponente.</p>
            <p>Reporte do oponente: Você ${report.opponentKeysB} - ${report.opponentKeysA} Oponente.</p>
            <p>Ajuste os valores abaixo para corrigir.</p>
          </div>
        </div>
      ` : ''}

      ${showStepper ? `
        <div class="stepper-grid">
          <div class="stepper-item">
            <span class="stepper-label">Suas chaves</span>
            <div class="stepper-control">
              <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="-1" ${report.playerAKeys === 0 || isExpired ? 'disabled' : ''}>−</button>
              <span class="stepper-value">${report.playerAKeys}</span>
              <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="1" ${report.playerAKeys === 3 || isExpired ? 'disabled' : ''}>+</button>
            </div>
          </div>

          ${report.opponentReported || report.confirmed ? `
            <div class="stepper-item is-readonly">
              <span class="stepper-label">Chaves do adversário</span>
              <div class="stepper-control">
                <span class="stepper-value">${report.playerBKeys}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <button class="button button-primary button-large" data-action="reportMatch" ${isExpired ? 'disabled' : ''}>
          ${isExpired ? 'Prazo encerrado' : (report.opponentReported ? 'Confirmar reporte' : report.conflict ? 'Corrigir e reenviar' : 'Enviar reporte')}
        </button>
      ` : `
        <div class="score-display-card">
          <span class="score-label">Placar reportado</span>
          <div class="score-numbers">
            <div class="score-num-item">
              <span class="score-player">Você</span>
              <strong class="score-num">${ownKeys}</strong>
            </div>
            <div class="score-divider">-</div>
            <div class="score-num-item">
              <span class="score-player">Adversário</span>
              <strong class="score-num">${report.playerBKeys}</strong>
            </div>
          </div>
          ${!report.confirmed ? `
            <button class="button button-secondary button-large" data-action="editReport">
              Alterar meu reporte
            </button>
          ` : ''}
        </div>
      `}
    </section>
  `;
}

function renderPicker(state) {
  const report = state.report;
  const selectedCodes = state.selectedHouseCodes || [];

  // Figurinhas elegíveis: casas do SEU deck ∩ coleção do adversário ∩ você não tem
  const eligible = PLAYER_STICKERS
    .filter(s => selectedCodes.includes(s.house))
    .filter(s => state.opponentCollection[s.id])
    .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);

  const isFallback = eligible.length === 0;

  // Se for fallback, escolhe livremente dentre as que você não tem das casas do seu deck
  const pool = isFallback
    ? PLAYER_STICKERS
        .filter(s => selectedCodes.includes(s.house))
        .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0)
    : eligible;

  const maxPicks = isFallback ? 3 : Math.min(report.playerAKeys, eligible.length);
  const remaining = Math.max(0, maxPicks - report.pickedIds.length);

  return `
    <section class="panel picker-panel">
      <div class="countdown-wrapper">
        <div class="countdown-bar" id="countdown-timer">
          <!-- Vanilla JS Date Countdown -->
        </div>
      </div>

      <div class="section-heading compact">
        <p class="eyebrow">Picker pós-partida</p>
        <h2>${remaining} escolhas restantes</h2>
        <p class="picker-instruction">
          ${isFallback 
            ? 'Regra de Fallback Ativa: como o adversário não tinha figurinhas elegíveis, você pode escolher livremente até 3 de suas casas.' 
            : `Como você ganhou ${report.playerAKeys} ${report.playerAKeys === 1 ? 'chave' : 'chaves'}, você pode escolher até ${maxPicks} figurinha(s) elegível(eis) do adversário.`}
        </p>
      </div>

      ${isFallback ? `
        <div class="fallback-banner">
          <span class="fallback-icon">⚡</span>
          <div>
            <strong>Fallback ativo</strong>
            <p>Você pode escolher livremente até 3 figurinhas que você não tem nas casas do seu deck jogado.</p>
          </div>
        </div>
      ` : ''}

      ${pool.length ? `
        <div class="picker-list">
          ${pool.map((sticker) => {
            return `
              <div class="picker-list-item">
                <div>
                  <strong>${sticker.id}</strong>
                  <span>${sticker.houseName} · ${sticker.name}</span>
                </div>
                <button class="button button-secondary" 
                        data-action="pickSticker" 
                        data-value="${sticker.id}" 
                        ${remaining === 0 || report.pickedIds.includes(sticker.id) || report.completed ? 'disabled' : ''}>
                  ${report.pickedIds.includes(sticker.id) ? 'Escolhida' : 'Pegar'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state-panel">
          <span class="empty-icon">✕</span>
          <p class="empty-text">Não há figurinhas elegíveis para pegar.</p>
        </div>
      `}

      ${report.completed ? `
        <div class="alert-box is-success">
          <span class="alert-icon">✓</span>
          <div class="alert-content">
            <strong>Picks concluídos com sucesso!</strong>
            <p>As figurinhas escolhidas foram enviadas para um novo pacotinho.</p>
          </div>
        </div>
      ` : `
        <button class="button button-primary button-large" data-action="completePicks" ${report.completed ? 'disabled' : ''}>
          Concluir picks
        </button>
      `}
    </section>
  `;
}

export function initCountdown(state) {
  if (window.countdownInterval) {
    clearInterval(window.countdownInterval);
  }
  
  const timerEl = document.getElementById('countdown-timer');
  if (timerEl && state.report.confirmedAt && !state.report.completed) {
    function updateTimer() {
      const currentTimerEl = document.getElementById('countdown-timer');
      if (!currentTimerEl) {
        clearInterval(window.countdownInterval);
        return;
      }
      
      const deadline = new Date(state.report.confirmedAt).getTime() + 48 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = deadline - now;
      
      if (diff <= 0) {
        currentTimerEl.innerHTML = `
          <div class="countdown-content is-expired">
            <span class="countdown-icon">⏱</span>
            <span class="countdown-text">Tempo para picks expirado! (Limite de 48h atingido)</span>
          </div>
        `;
        clearInterval(window.countdownInterval);
        
        document.querySelectorAll('[data-action="pickSticker"]').forEach(btn => {
          btn.disabled = true;
        });
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      currentTimerEl.innerHTML = `
        <div class="countdown-content">
          <span class="countdown-icon">⏱</span>
          <span class="countdown-text">Tempo restante para os picks:</span>
          <strong class="countdown-time">${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s</strong>
        </div>
      `;
    }
    
    updateTimer();
    window.countdownInterval = setInterval(updateTimer, 1000);
  }

  // Timer do prazo da PARTIDA (separado do timer de picks de 48h)
  const matchDeadlineEl = document.getElementById('match-deadline-display');
  if (matchDeadlineEl && state.activeRound.deadline) {
    if (window.matchDeadlineInterval) {
      clearInterval(window.matchDeadlineInterval);
    }
    function updateMatchDeadline() {
      const el = document.getElementById('match-deadline-display');
      if (!el) return;
      const deadline = new Date(state.activeRound.deadline).getTime();
      const diff = deadline - Date.now();
      if (diff <= 0) {
        el.innerHTML = '⏱ Prazo encerrado';
        el.classList.add('is-expired');
        if (!state.report.reported) {
          // Bloqueia reporte
          document.querySelectorAll('[data-action="reportMatch"]').forEach(b => b.disabled = true);
        }
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        el.textContent = `⏱ Prazo: ${h}h ${m.toString().padStart(2,'0')}m`;
      }
    }
    updateMatchDeadline();
    window.matchDeadlineInterval = setInterval(updateMatchDeadline, 30000);
  }
}
