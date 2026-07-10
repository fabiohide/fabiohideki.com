import { STICKERS } from '../data/stickers.js';

export function renderAdmin(state) {
  const currentTab = state.adminTab || 'rounds';
  
  let tabContent = '';

  if (currentTab === 'validation') {
    tabContent = renderValidationTab(state);
  } else if (currentTab === 'collections') {
    tabContent = renderCollectionsTab(state);
  } else if (currentTab === 'history') {
    tabContent = renderHistoryTab(state);
  } else if (currentTab === 'rounds') {
    tabContent = renderRoundsTab(state);
  }

  return `
    <section class="page-view admin-view">
      <div class="section-heading">
        <h2>Painel Admin</h2>
      </div>

      <div class="admin-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; overflow-x: auto;">
        <button class="button ${currentTab === 'rounds' ? 'button-primary' : 'button-secondary'}" data-action="setAdminTab" data-value="rounds" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Rodadas</button>
        <button class="button ${currentTab === 'validation' ? 'button-primary' : 'button-secondary'}" data-action="setAdminTab" data-value="validation" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Validações</button>
        <button class="button ${currentTab === 'collections' ? 'button-primary' : 'button-secondary'}" data-action="setAdminTab" data-value="collections" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Coleções</button>
        <button class="button ${currentTab === 'history' ? 'button-primary' : 'button-secondary'}" data-action="setAdminTab" data-value="history" style="flex: 1; height: 38px; min-height: auto; padding: 0 8px; white-space: nowrap;">Histórico Geral</button>
      </div>

      ${tabContent}
    </section>
  `;
}

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
        ? `<p class="empty-text" style="padding: 16px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum desafio aguardando validação no momento.</p>`
        : `<div class="admin-challenges-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            ${pendingChallenges.map(c => `
              <div class="admin-challenge-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); box-shadow: var(--shadow-subtle); display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; border-left: 3px solid var(--color-gold);">
                <div style="flex: 1; min-width: 200px;">
                  <h5 style="margin: 0 0 4px; font-size: 0.95rem; color: var(--color-paper);">${c.title}</h5>
                  ${c.playerName ? `<p style="margin: 0 0 4px; font-size: 0.8rem; color: var(--color-gold);">Jogador: <strong>${c.playerName}</strong></p>` : ''}
                  <p style="margin: 0 0 8px; font-size: 0.8rem; color: var(--color-ash);">${c.desc}</p>
                  <span style="font-size: 0.78rem; padding: 3px 8px; background: var(--color-graphite); border-radius: var(--radius-sm); color: var(--color-gold);">
                    Figurinha solicitada: <strong>${c.pickedId || '—'}</strong>
                  </span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="button button-secondary" data-action="rejectChallenge" data-value="${c.id}" data-player="${c.playerUsername || ''}" style="min-width: 80px; height: 36px; min-height: auto; padding: 0 12px; background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1.5px solid rgba(255, 77, 77, 0.2);">
                    Rejeitar
                  </button>
                  <button class="button button-primary" data-action="approveChallenge" data-value="${c.id}" data-player="${c.playerUsername || ''}" style="min-width: 80px; height: 36px; min-height: auto; padding: 0 12px;">
                    Aprovar
                  </button>
                </div>
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
              const bothReported = m.player_a_reported && m.player_b_reported;
              // Conflito = os dois reportaram mas os placares não batem entre si
              const hasConflict = bothReported &&
                (m.player_a_keys !== m.player_b_opp_keys || m.player_a_opp_keys !== m.player_b_keys);
              
              const canRelease = bothReported && !hasConflict && !m.packs_released;
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
                          Deck: ${m.player_a_deck_url ? `<a href="${m.player_a_deck_url}" target="_blank" style="color: var(--color-gold); text-decoration: underline; font-size: 0.8rem;">Link do Deck</a>` : 'N/A'}<br/>
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
                          Deck: ${m.player_b_deck_url ? `<a href="${m.player_b_deck_url}" target="_blank" style="color: var(--color-gold); text-decoration: underline; font-size: 0.8rem;">Link do Deck</a>` : 'N/A'}<br/>
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
                      <button class="button button-secondary" data-action="rejectMatch" data-value="${m.id}" style="height: 32px; min-height: auto; font-size: 0.75rem; padding: 0 10px; background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1.5px solid rgba(255, 77, 77, 0.2);" ${(m.player_a_reported || m.player_b_reported) ? '' : 'disabled'}>
                        Rejeitar
                      </button>
                      <button class="button button-secondary" data-action="confirmWO" data-value="${m.id}" style="height: 32px; min-height: auto; font-size: 0.75rem; padding: 0 10px;">
                        W.O.
                      </button>
                      <button class="button button-primary" data-action="releasePacks" data-match="${m.id}" style="height: 32px; min-height: auto; font-size: 0.75rem; padding: 0 14px;" ${!canRelease ? 'disabled' : ''}>
                        Aprovar
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

function renderCollectionsTab(state) {
  const activePlayerId = state.selectedAdminPlayerId || 'fabio_hideki';
  const activePlayer = (state.players || []).find(p => p.id === activePlayerId) || state.players[0];
  const playerCollection = activePlayer ? activePlayer.collection || {} : {};

  // Inicializa o estado de edição pendente do Admin se necessário
  if (!state.adminEditCollection || state.adminEditCollection.playerId !== activePlayerId) {
    state.adminEditCollection = {
      playerId: activePlayerId,
      quantities: {}
    };
    STICKERS.forEach(s => {
      state.adminEditCollection.quantities[s.id] = playerCollection[s.id]?.quantity || 0;
    });
  }

  // Verifica se há alguma alteração pendente em relação à coleção original
  let hasPendingChanges = false;
  STICKERS.forEach(s => {
    const originalQty = playerCollection[s.id]?.quantity || 0;
    const currentQty = state.adminEditCollection.quantities[s.id];
    if (originalQty !== currentQty) {
      hasPendingChanges = true;
    }
  });

  return `
    <div class="panel admin-panel">
      <span class="panel-label">Gerenciar Coleções</span>
      
      <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.78rem; color: var(--color-ash); font-weight: 600; text-transform: uppercase;">Selecionar Jogador</label>
        <select id="adminPlayerSelect" style="width: 100%; max-width: 320px; background: var(--color-iron); color: var(--color-paper); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 10px 14px; font-weight: 600; outline: none; font-size: 0.88rem;">
          ${(state.players || []).map(p => `
            <option value="${p.id}" ${p.id === activePlayerId ? 'selected' : ''}>${p.name} (${p.serie ? `Série ${p.serie}` : 'Sem Série'})</option>
          `).join('')}
        </select>
      </div>

      <div style="max-height: 400px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: var(--radius-lg); background: rgba(0,0,0,0.15);">
        ${STICKERS.map(s => {
          const qty = state.adminEditCollection.quantities[s.id];
          const originalQty = playerCollection[s.id]?.quantity || 0;
          const isChanged = qty !== originalQty;
          return `
            <div class="admin-sticker-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-iron); border-radius: var(--radius-md); gap: 12px; flex-wrap: wrap; border-left: 3px solid ${isChanged ? 'var(--color-signal-blue)' : 'transparent'};">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-gold); background: var(--color-graphite); padding: 3px 6px; border-radius: var(--radius-sm);">${s.id}</span>
                <span style="font-size: 0.88rem; color: var(--color-paper); font-weight: 600;">${s.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 0.82rem; font-weight: 600; color: var(--color-ash);">Qtd: <strong style="color: ${isChanged ? 'var(--color-signal-blue)' : 'var(--color-paper)'}; font-size: 0.9rem;">${qty}</strong></span>
                <div style="display: flex; gap: 4px;">
                  <button class="button button-secondary" data-action="adminRemoveSticker" data-player="${activePlayer.id}" data-value="${s.id}" style="width: 28px; height: 28px; min-width: auto; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;" ${qty <= 0 ? 'disabled' : ''}>-</button>
                  <button class="button button-primary" data-action="adminAddSticker" data-player="${activePlayer.id}" data-value="${s.id}" style="width: 28px; height: 28px; min-width: auto; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; line-height: 1;">+</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- BOTOES DE CONFIRMACAO EM MASSA -->
      ${hasPendingChanges ? `
        <div style="display: flex; gap: 10px; margin-top: 16px;">
          <button class="button button-secondary" data-action="adminCancelStickers" style="flex: 1; height: 36px; min-height: auto; margin: 0;">Cancelar</button>
          <button class="button button-primary" data-action="adminConfirmStickers" data-player="${activePlayer.id}" style="flex: 1; height: 36px; min-height: auto; margin: 0; background: var(--color-signal-blue); border-color: var(--color-signal-blue);">OK (Confirmar)</button>
        </div>
      ` : ''}

      <div class="panel" style="margin-top: 24px; max-height: 250px; overflow-y: auto; background: var(--color-graphite); border: 1px solid rgba(255,255,255,0.04);">
        <span class="panel-label" style="font-size: 0.76rem;">Histórico de Edições (Admin)</span>
        <div style="font-family: monospace; font-size: 0.74rem; display: flex; flex-direction: column; gap: 6px; padding: 8px 0;">
          ${(state.adminLogs || []).length === 0
            ? `<p style="color: var(--color-ash); text-align: center; margin: 0; padding: 12px;">Nenhuma edição realizada ainda.</p>`
            : (state.adminLogs || []).slice().map(log => {
              const d = new Date(log.timestamp);
              const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const adminPlayer = log.adminUsername && state.players
                ? state.players.find(p => p.id === log.adminUsername)
                : null;
              const adminLabel = adminPlayer ? adminPlayer.name : (log.adminUsername || null);
              const adminBadge = adminLabel
                ? `<span style="display:inline-block; background: rgba(49,133,255,0.18); color: #8db9ff; border-radius: 4px; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; margin-right: 4px; vertical-align: middle;">${adminLabel}</span>`
                : '';
              return `
                <div style="color: var(--color-ash); line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
                  <span style="color: var(--color-smoke); font-weight: 600;">[${dateStr}]</span> ${adminBadge}${log.message}
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    </div>
  `;
}

function getLogBadgeHtml(type) {
  let labelText = type || 'info';
  let color = 'var(--color-steel)';
  let bg = 'rgba(255, 255, 255, 0.05)';
  let border = '1px solid rgba(255, 255, 255, 0.05)';
  
  if (type === 'pick') {
    labelText = 'oponente';
    color = '#00cc66';
    bg = 'rgba(0, 204, 102, 0.1)';
    border = '1px solid rgba(0, 204, 102, 0.2)';
  } else if (type === 'fallback') {
    labelText = 'quebra-regra';
    color = '#ff9800';
    bg = 'rgba(255, 152, 0, 0.1)';
    border = '1px solid rgba(255, 152, 0, 0.2)';
  } else if (type === 'challenge') {
    labelText = 'desafios';
    color = '#3185ff';
    bg = 'rgba(49, 133, 255, 0.1)';
    border = '1px solid rgba(49, 133, 255, 0.2)';
  } else if (type === 'pack') {
    labelText = 'pacotinho';
    color = '#ff5252';
    bg = 'rgba(255, 82, 82, 0.1)';
    border = '1px solid rgba(255, 82, 82, 0.2)';
  }

  return `<span style="font-size: 0.64rem; padding: 2px 6px; border-radius: var(--radius-full); background: ${bg}; color: ${color}; border: ${border}; margin-left: 6px; font-weight: 700; text-transform: uppercase; display: inline-block; vertical-align: middle;">${labelText}</span>`;
}

function renderHistoryTab(state) {
  const logs = state.stickersLog || [];
  const logsByRound = {};
  
  logs.forEach(log => {
    const r = log.round || 1;
    if (!logsByRound[r]) logsByRound[r] = [];
    logsByRound[r].push(log);
  });

  return `
    <div class="panel admin-panel">
      <span class="panel-label">Histórico Geral de Entradas</span>
      ${logs.length === 0
        ? `<p class="empty-text" style="padding: 20px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum registro de entrada de figurinhas.</p>`
        : `
          <div class="timeline-wrapper" style="margin-top: 12px; display: flex; flex-direction: column; gap: 20px;">
            ${Object.keys(logsByRound).sort((a,b) => b - a).map(roundNum => `
              <div>
                <h4 style="font-size: 0.9rem; color: var(--color-gold); text-transform: uppercase; border-left: 3px solid var(--color-gold); padding-left: 8px; margin: 0 0 10px; font-weight: 700; letter-spacing: 0.05em;">Rodada ${roundNum}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; border-left: 1px dashed rgba(255,255,255,0.08); padding-left: 12px; margin-left: 8px;">
                  ${logsByRound[roundNum].slice().map(log => {
                    const d = new Date(log.timestamp);
                    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return `
                      <div style="font-size: 0.8rem; color: var(--color-ash); display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;">
                        <span style="font-size: 0.72rem; color: var(--color-smoke); white-space: nowrap; margin-top: 2px; font-family: monospace;">[${dateStr}]</span>
                        <div style="flex: 1;">
                          <span style="color: var(--color-paper); font-weight: 500;">${log.message}</span>
                          ${getLogBadgeHtml(log.type)}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `
      }
    </div>
  `;
}

function renderRoundsTab(state) {
  const rounds = state.allRounds || [];
  const players = state.players || [];
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  return `
    <style>
      details.round-details-expand[open] svg.chevron-icon {
        transform: rotate(180deg);
      }
    </style>
    <div class="panel admin-panel">
      <span class="panel-label">Gerenciar Rodadas</span>
      
      <div class="admin-rounds-list" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
        ${rounds.map(r => {
          const deadlineLocal = r.deadline ? new Date(new Date(r.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
          const activeBadge = r.active 
            ? `<span style="background: var(--color-green); color: #000; padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Ativa</span>`
            : `<span style="background: var(--color-steel); color: var(--color-ash); padding: 2px 6px; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; text-transform: uppercase;">Inativa</span>`;

          const roundMatches = (state.allMatches || []).filter(m => m.round_number === r.number);

          return `
            <div class="round-management-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); border: 1.5px solid ${r.active ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.04)'}; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <h4 style="margin: 0; font-size: 1rem; color: var(--color-paper);">${r.name}</h4>
                ${activeBadge}
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.76rem; color: var(--color-ash); font-weight: 600; text-transform: uppercase;">Prazo de Encerramento</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="date" class="round-deadline-input" data-round="${r.number}" value="${deadlineLocal}" style="background: var(--color-graphite); color: var(--color-paper); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 6px 10px; font-family: sans-serif; font-size: 0.82rem; outline: none; flex: 1;" />
                  <button class="button button-secondary" data-action="saveRoundDeadline" data-round="${r.number}" style="height: 32px; min-height: auto; font-size: 0.76rem; padding: 0 12px; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase;">Salvar</button>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 4px;">
                ${r.active 
                  ? `<button class="button button-secondary" data-action="deactivateRound" data-round="${r.number}" style="flex: 1; height: 32px; min-height: auto; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; border-color: var(--color-red); color: var(--color-red);">Encerrar Rodada</button>`
                  : `<button class="button button-primary" data-action="activateRound" data-round="${r.number}" style="flex: 1; height: 32px; min-height: auto; margin: 0; font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; background: var(--color-signal-blue); border-color: var(--color-signal-blue);">Começar Rodada</button>`
                }
              </div>

              <!-- DROPDOWN DE CONFRONTOS -->
              <details class="round-details-expand" style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
                <summary style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: var(--color-ash); outline: none; list-style: none; user-select: none;">
                  <span>Ver Confrontos (${roundMatches.length})</span>
                  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </summary>
                
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                  ${roundMatches.length === 0 
                    ? `<p style="font-size: 0.78rem; color: var(--color-steel); text-align: center; margin: 0;">Nenhum confronto cadastrado para esta rodada.</p>`
                    : roundMatches.map(m => {
                        const pA = playerMap[m.player_a_username] || { name: m.player_a_username };
                        const pB = playerMap[m.player_b_username] || { name: m.player_b_username };

                        // Determina status da partida
                        let statusLabel = 'Pendente';
                        let statusBg = 'var(--color-graphite)';
                        let statusColor = 'var(--color-steel)';
                        
                        const bothRep = m.player_a_reported && m.player_b_reported;
                        const conflict = bothRep &&
                          (m.player_a_keys !== m.player_b_opp_keys || m.player_a_opp_keys !== m.player_b_keys);

                        if (m.completed && !conflict) {
                          statusLabel = 'Concluído';
                          statusBg = 'rgba(0, 180, 100, 0.15)';
                          statusColor = '#00e680';
                        } else if (conflict) {
                          statusLabel = 'Conflito';
                          statusBg = 'rgba(230, 80, 80, 0.15)';
                          statusColor = '#ff6666';
                        } else if (m.player_a_reported || m.player_b_reported) {
                          statusLabel = 'Parcial';
                          statusBg = 'rgba(255, 170, 0, 0.12)';
                          statusColor = '#ffb300';
                        }

                        let reportAHtml = '';
                        if (m.player_a_reported) {
                          const pAPicksFormatted = m.player_a_picks
                            ? m.player_a_picks.split(',').join(', ')
                            : 'Nenhum pick';
                          reportAHtml = `
                            <div style="font-size: 0.8rem; color: var(--color-paper); padding: 6px 0; border-top: 1px dashed rgba(255,255,255,0.06);">
                              <strong>${pA.name}</strong> - ${m.player_a_houses || 'Sem casas'} - Picks: ${pAPicksFormatted} <br/>
                              <span style="color: var(--color-gold); font-weight: 600;">${pA.name} ${m.player_a_keys} x ${m.player_a_opp_keys} ${pB.name}</span>
                            </div>
                          `;
                        } else {
                          reportAHtml = `
                            <div style="font-size: 0.8rem; color: var(--color-ash); padding: 6px 0; border-top: 1px dashed rgba(255,255,255,0.06);">
                              <strong>${pA.name}</strong>: Não reportou ainda.
                            </div>
                          `;
                        }

                        let reportBHtml = '';
                        if (m.player_b_reported) {
                          const pBPicksFormatted = m.player_b_picks
                            ? m.player_b_picks.split(',').join(', ')
                            : 'Nenhum pick';
                          reportBHtml = `
                            <div style="font-size: 0.8rem; color: var(--color-paper); padding: 6px 0; border-top: 1px dashed rgba(255,255,255,0.06);">
                              <strong>${pB.name}</strong> - ${m.player_b_houses || 'Sem casas'} - Picks: ${pBPicksFormatted} <br/>
                              <span style="color: var(--color-gold); font-weight: 600;">${pA.name} ${m.player_b_opp_keys} x ${m.player_b_keys} ${pB.name}</span>
                            </div>
                          `;
                        } else {
                          reportBHtml = `
                            <div style="font-size: 0.8rem; color: var(--color-ash); padding: 6px 0; border-top: 1px dashed rgba(255,255,255,0.06);">
                              <strong>${pB.name}</strong>: Não reportou ainda.
                            </div>
                          `;
                        }

                        return `
                          <div style="padding: 12px; background: rgba(0,0,0,0.18); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 600; gap: 10px; margin-bottom: 4px;">
                              <span style="color: var(--color-paper);">${pA.name} <span style="color: var(--color-steel); font-weight: normal;">vs</span> ${pB.name}</span>
                              <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: var(--radius-sm); background: ${statusBg}; color: ${statusColor}; font-weight: 700; text-transform: uppercase;">${statusLabel}</span>
                            </div>
                            ${reportAHtml}
                            ${reportBHtml}
                          </div>
                        `;
                      }).join('')
                  }
                </div>
              </details>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
