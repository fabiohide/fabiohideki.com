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
  const pending = (state.pendingChallenges && state.pendingChallenges.length > 0)
    ? state.pendingChallenges
    : challenges.filter(c => c.pendingValidation && !c.completed);

  // Lógica de Partida Congelada (W.O.)
  const isExpired = state.activeRound.deadline && new Date(state.activeRound.deadline) < new Date();
  const isMatchFrozen = isExpired && !state.report.completed;

  let woSectionHtml = '';
  if (isMatchFrozen) {
    woSectionHtml = `
      <div class="panel admin-panel" style="margin-top: 20px; border: 1px solid rgba(220, 60, 60, 0.3); background: rgba(220, 60, 60, 0.05);">
        <span class="panel-label" style="color: #ff6b6b; font-weight: 700;">Partida Congelada (Prazo Vencido)</span>
        <div style="padding: 12px 0; display: flex; flex-direction: column; gap: 8px;">
          <p style="margin: 0; font-size: 0.85rem; color: var(--color-paper);">
            A partida da Rodada <strong>${state.activeRound.number}</strong> não foi reportada a tempo e o prazo limite (<strong>${state.activeRound.deadline ? new Date(state.activeRound.deadline).toLocaleDateString() : '—'}</strong>) já expirou.
          </p>
          <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
            <button class="button button-primary" data-action="confirmWO" data-value="r1m1" style="flex: 1; min-width: 140px; height: 36px; min-height: auto; padding: 0 12px; background: #dc3c3c; border-color: #dc3c3c;">
              Confirmar W.O. (0x0)
            </button>
            <button class="button button-secondary" data-action="unfreezeMatch" data-value="r1m1" style="flex: 1; min-width: 140px; height: 36px; min-height: auto; padding: 0 12px;">
              Descongelar (+24h)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="panel admin-panel">
      <span class="panel-label">Validação de Desafios</span>
      ${pending.length === 0 
        ? `<p class="empty-text" style="padding: 20px 0; text-align: center; color: var(--color-ash); font-size: 0.85rem;">Nenhum desafio aguardando validação no momento.</p>`
        : `
          <div class="admin-challenges-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            ${pending.map(c => `
              <div class="admin-challenge-card" style="padding: 16px; background: var(--color-iron); border-radius: var(--radius-md); box-shadow: var(--shadow-subtle); display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <h5 style="margin: 0 0 4px; font-size: 0.95rem; color: var(--color-paper);">${c.title}</h5>
                  ${c.playerName ? `<p style="margin: 0 0 4px; font-size: 0.8rem; color: var(--color-gold);">Jogador: <strong>${c.playerName}</strong></p>` : ''}
                  <p style="margin: 0 0 8px; font-size: 0.8rem; color: var(--color-ash);">${c.desc}</p>
                  <span style="font-size: 0.78rem; padding: 3px 8px; background: var(--color-graphite); border-radius: var(--radius-sm); color: var(--color-gold);">
                    Figurinha solicitada: <strong>${c.pickedId || '—'}</strong>
                  </span>
                </div>
                <button class="button button-primary" data-action="approveChallenge" data-value="${c.id}" data-player="${c.playerUsername || ''}" style="min-width: 100px; height: 36px; min-height: auto; padding: 0 16px;">
                  Aprovar
                </button>
              </div>
            `).join('')}
          </div>
        `
      }
    </div>
    ${woSectionHtml}
  `;
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
              return `
                <div style="color: var(--color-ash); line-height: 1.4; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
                  <span style="color: var(--color-steel); font-weight: 600;">[${dateStr}]</span> ${log.message}
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    </div>
  `;
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
                        <span style="font-size: 0.72rem; color: var(--color-steel); white-space: nowrap; margin-top: 2px; font-family: monospace;">[${dateStr}]</span>
                        <div style="flex: 1;">
                          <span style="color: var(--color-paper); font-weight: 500;">${log.message}</span>
                          <span style="font-size: 0.64rem; padding: 2px 6px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); margin-left: 6px; font-weight: 700; text-transform: uppercase; color: var(--color-steel); display: inline-block;">${log.type || 'info'}</span>
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
                        let placarText = 'Aguardando reporte';

                        if (m.completed) {
                          statusLabel = 'Concluído';
                          statusBg = 'rgba(0, 180, 100, 0.15)';
                          statusColor = '#00e680';
                          placarText = `Placar: <strong>${m.player_a_keys} x ${m.player_b_keys}</strong>`;
                        } else if (m.player_a_reported && m.player_b_reported) {
                          statusLabel = 'Conflito';
                          statusBg = 'rgba(230, 80, 80, 0.15)';
                          statusColor = '#ff6666';
                          placarText = `Divergência: <strong>${m.player_a_keys} vs ${m.player_b_keys}</strong>`;
                        } else if (m.player_a_reported || m.player_b_reported) {
                          statusLabel = 'Parcial';
                          statusBg = 'rgba(255, 170, 0, 0.12)';
                          statusColor = '#ffb300';
                          if (m.player_a_reported) {
                            placarText = `Reportado por ${pA.name} (${m.player_a_keys} chaves)`;
                          } else {
                            placarText = `Reportado por ${pB.name} (${m.player_b_keys} chaves)`;
                          }
                        }

                        // Busca picks de figurinhas para esta partida
                        const roundPicks = (state.allPicks || []).filter(log => log.round === r.number);
                        
                        const pAPicks = roundPicks
                          .filter(log => log.player_username === m.player_a_username)
                          .map(log => {
                            const matchObj = log.message.match(/[A-Z]{3}\s\d/);
                            return matchObj ? matchObj[0] : '';
                          })
                          .filter(Boolean);

                        const pBPicks = roundPicks
                          .filter(log => log.player_username === m.player_b_username)
                          .map(log => {
                            const matchObj = log.message.match(/[A-Z]{3}\s\d/);
                            return matchObj ? matchObj[0] : '';
                          })
                          .filter(Boolean);

                        let picksHtml = '';
                        if (pAPicks.length > 0 || pBPicks.length > 0) {
                          picksHtml = `
                            <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 6px;">
                              ${pAPicks.length > 0 ? `<div><span style="color: var(--color-gold); font-weight: 600;">${pA.name}:</span> ${pAPicks.map(id => `<span style="background: var(--color-graphite); padding: 2px 6px; border-radius: var(--radius-xs); margin-left: 4px; color: var(--color-paper); font-weight: bold; border: 1px solid rgba(255,255,255,0.04);">${id}</span>`).join('')}</div>` : ''}
                              ${pBPicks.length > 0 ? `<div><span style="color: var(--color-gold); font-weight: 600;">${pB.name}:</span> ${pBPicks.map(id => `<span style="background: var(--color-graphite); padding: 2px 6px; border-radius: var(--radius-xs); margin-left: 4px; color: var(--color-paper); font-weight: bold; border: 1px solid rgba(255,255,255,0.04);">${id}</span>`).join('')}</div>` : ''}
                            </div>
                          `;
                        }

                        return `
                          <div style="padding: 12px; background: rgba(0,0,0,0.18); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 600; gap: 10px;">
                              <span style="color: var(--color-paper);">${pA.name} <span style="color: var(--color-steel); font-weight: normal;">vs</span> ${pB.name}</span>
                              <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: var(--radius-sm); background: ${statusBg}; color: ${statusColor}; font-weight: 700; text-transform: uppercase;">${statusLabel}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: var(--color-ash); font-weight: 500;">
                              ${placarText}
                            </div>
                            ${picksHtml}
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
