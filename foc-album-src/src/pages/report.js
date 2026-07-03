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
  /*
  const report = state.report;
  const selectedCodes = state.selectedHouseCodes || [];
  const allHouses = Object.keys(HOUSE_META);
  
  // Calculate pick pool dynamically
  const eligible = PLAYER_STICKERS
    .filter(s => selectedCodes.includes(s.house))
    .filter(s => state.opponentCollection[s.id])
    .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0);

  const isFallback = eligible.length === 0;
  const pool = isFallback
    ? PLAYER_STICKERS
        .filter(s => selectedCodes.includes(s.house))
        .filter(s => !state.collection[s.id] || state.collection[s.id].quantity === 0)
    : eligible;

  const maxPicks = isFallback ? 3 : Math.min(report.playerAKeys, eligible.length);
  const finalMaxPicks = report.playerAKeys > 0 ? maxPicks : 0;
  
  const selectedPicks = state.selectedPickIds || [];
  const remaining = Math.max(0, finalMaxPicks - selectedPicks.length);

  return `
    <!-- ETAPA 1: CASAS -->
    <section class="panel houses-panel" style="margin-top: 20px;">
      <div class="step-header">
        <span class="step-number">Etapa 1</span>
        <h4>Selecione as 3 casas do seu deck</h4>
      </div>
      <div class="house-selector-grid">
        \${allHouses.map((code) => {
          const house = HOUSE_META[code];
          const isSelected = selectedCodes.includes(code);
          return `
            <button class="house-selector-chip \${isSelected ? 'is-selected' : ''}" 
                    data-action="toggleHouse" 
                    data-value="\${code}" 
                    type="button">
              \${house ? `<img src="\${getAssetUrl(house.icon)}" alt="" />` : ''}
              <span class="house-name">\${code}</span>
              \${isSelected ? '<span class="check-indicator">✓</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div style="margin-top: 10px; font-size: 0.8rem; color: var(--color-ash);">
        \${selectedCodes.length} de 3 selecionadas
      </div>
    </section>

    <!-- ETAPA 2: PLACAR -->
    <section class="panel score-panel" style="margin-top: 20px;">
      <div class="step-header">
        <span class="step-number">Etapa 2</span>
        <h4>Informe o resultado da partida (Chaves)</h4>
        <p>Defina quantas chaves você e seu oponente forjaram (de 0 a 3).</p>
      </div>

      <div class="stepper-grid">
        <div class="stepper-item">
          <span class="stepper-label">Suas chaves</span>
          <div class="stepper-control">
            <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="-1" \${report.playerAKeys === 0 ? 'disabled' : ''}>−</button>
            <span class="stepper-value">\${report.playerAKeys}</span>
            <button class="stepper-btn" data-action="adjustKeys" data-side="a" data-amount="1" \${report.playerAKeys === 3 ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <div class="stepper-item">
          <span class="stepper-label">Chaves do adversário</span>
          <div class="stepper-control">
            <button class="stepper-btn" data-action="adjustKeys" data-side="b" data-amount="-1" \${report.playerBKeys === 0 ? 'disabled' : ''}>−</button>
            <span class="stepper-value">\${report.playerBKeys}</span>
            <button class="stepper-btn" data-action="adjustKeys" data-side="b" data-amount="1" \${report.playerBKeys === 3 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ETAPA 3: PICKS -->
    <section class="panel picker-panel" style="margin-top: 20px;">
      <div class="step-header">
        <span class="step-number">Etapa 3</span>
        <h4>Escolha suas figurinhas (Picks)</h4>
        <p class="picker-instruction">
          \${selectedCodes.length < 3 
            ? 'Selecione 3 casas na Etapa 1 para liberar as opções de picks.'
            : finalMaxPicks === 0
              ? 'Você forjou 0 chaves nesta partida, portanto não possui picks para escolher.'
              : isFallback 
                ? 'Regra de Fallback Ativa: como o adversário não possui figurinhas elegíveis, você pode escolher livremente até 3 de suas casas.'
                : `Como você forjou \${report.playerAKeys} \${report.playerAKeys === 1 ? 'chave' : 'chaves'}, você pode escolher até \${finalMaxPicks} figurinha(s) do oponente.`}
        </p>
      </div>

      \${selectedCodes.length === 3 && finalMaxPicks > 0 ? `
        <div style="margin-bottom: 12px; font-weight: 700; color: var(--color-gold); font-size: 0.85rem;">
          \${remaining} escolhas restantes
        </div>

        \${isFallback ? `
          <div class="fallback-banner" style="margin-bottom: 16px;">
            <span class="fallback-icon">⚡</span>
            <div>
              <strong>Fallback ativo</strong>
              <p>Escolha até 3 figurinhas que você não tem nas casas do seu deck.</p>
            </div>
          </div>
        ` : ''}

        \${pool.length ? `
          <div class="picker-list">
            \${pool.map((sticker) => {
              const isSelected = selectedPicks.includes(sticker.id);
              return `
                <div class="picker-list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--color-iron); border-radius: var(--radius-sm); margin-bottom: 6px;">
                  <div>
                    <strong>\${sticker.id}</strong>
                    <span style="font-size: 0.8rem; color: var(--color-ash); margin-left: 6px;">\${sticker.houseName} · \${sticker.name}</span>
                  </div>
                  <button class="button \${isSelected ? 'button-primary' : 'button-secondary'}" 
                          data-action="toggleReportPick" 
                          data-value="\${sticker.id}" 
                          style="padding: 4px 12px; font-size: 0.78rem; height: 28px; min-height: auto; margin: 0;">
                    \${isSelected ? 'Selecionada' : 'Pegar'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <p class="empty-text">Não há figurinhas disponíveis para pegar nas casas selecionadas.</p>
        `}
      ` : ''}
    </section>

    <!-- SUBMISSAO -->
    <div style="margin-top: 24px; text-align: center;">
      <button class="button button-primary button-large" 
              data-action="submitSingleReport" 
              \${selectedCodes.length === 3 ? '' : 'disabled'} 
              style="width: 100%; max-width: 400px; padding: 14px; font-size: 1rem;">
        Enviar Reporte da Partida
      </button>
    </div>
  `;
  */
  
  return `
    <div class="panel" style="padding: 24px; text-align: center; color: var(--color-ash); background: var(--color-carbon); border-radius: var(--radius-lg); box-shadow: var(--shadow-subtle); margin-top: 20px;">
      <span style="font-size: 2.2rem; display: block; margin-bottom: 12px; filter: grayscale(1) opacity(0.5);">🔒</span>
      <h4 style="color: var(--color-paper); font-size: 1.05rem; margin: 0 0 6px;">Reporte suspenso temporariamente</h4>
      <p style="font-size: 0.82rem; margin: 0; line-height: 1.4;">O reporte de partidas desta rodada será liberado em breve pelos organizadores.</p>
    </div>
  `;
}

function renderReportSummary(state) {
  const report = state.report;
  const myMatch = state.matches && state.matches.find(m => m.id === report.matchId);
  const isPlayerA = report.isPlayerA;
  const myHouses = (isPlayerA ? myMatch?.player_a_houses : myMatch?.player_b_houses)?.split(',') || [];
  const myKeys = isPlayerA ? myMatch?.player_a_keys : myMatch?.player_b_keys;
  const oppKeys = isPlayerA ? myMatch?.player_a_opp_keys : myMatch?.player_b_opp_keys;
  
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
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-paper); margin-top: 4px;">
            Você <span style="color: var(--color-gold); font-size: 1.3rem;">${myKeys}</span> x <span style="color: var(--color-gold); font-size: 1.3rem;">${oppKeys}</span> Adversário
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
