import { formatPlayerNameFromLogin } from '../utils/format.js';

export function renderTable(state) {
  const activeTab = state.tableTab || state.user.serie || 'A';
  const standings = state.standings || [];

  // Filter players by active series tab
  const filteredPlayers = standings.filter(p => p.serie === activeTab);

  // Separate 'album' from active ranking list
  const albumData = filteredPlayers.find(p => p.username === 'album');
  const realPlayers = filteredPlayers.filter(p => p.username !== 'album');

  // Sort real players by: Stickers -> Wins -> Keys -> Challenges -> Name
  const sortedPlayers = [...realPlayers].sort((a, b) => {
    if (b.stickersCount !== a.stickersCount) return b.stickersCount - a.stickersCount;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.keys !== a.keys) return b.keys - a.keys;
    if (b.challengesCount !== a.challengesCount) return b.challengesCount - a.challengesCount;
    return formatPlayerNameFromLogin(a.username).localeCompare(formatPlayerNameFromLogin(b.username));
  });

  let albumRowHtml = '';
  if (activeTab === 'A' && albumData) {
    const isCurrentUser = state.user.id === 'album';
    const rowBg = isCurrentUser ? 'rgba(242, 193, 78, 0.06)' : 'rgba(255,255,255,0.01)';
    const dimmedColor = 'rgba(255, 255, 255, 0.35)';
    albumRowHtml = `
      <tr style="border-top: 1.5px solid rgba(255,255,255,0.08); background: ${rowBg}; color: ${dimmedColor}; font-style: italic;">
        <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: ${dimmedColor};">-</td>
        <td style="padding: 12px 24px 12px 14px; font-weight: 600; color: ${dimmedColor}; width: 1%; white-space: nowrap;">
          ${formatPlayerNameFromLogin(albumData.username)}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: ${dimmedColor};">
          ${String(albumData.stickersCount).padStart(2, '0')}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: ${dimmedColor};">
          ${String(albumData.wins).padStart(2, '0')}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: ${dimmedColor};">
          ${String(albumData.losses).padStart(2, '0')}
        </td>
        <td style="padding: 12px 10px; text-align: center; color: ${dimmedColor};">
          ${String(albumData.played).padStart(2, '0')}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: ${dimmedColor};">
          ${String(albumData.keys).padStart(2, '0')}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: ${dimmedColor};">
          ${String(albumData.challengesCount).padStart(2, '0')}
        </td>
      </tr>
    `;
  }

  return `
    <section class="page-view table-view">
      <!-- SERIES TABS BAR -->
      <div class="report-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; width: 100%;">
        <button class="tab-button" data-action="setTableTab" data-value="A" style="flex: 1; background: ${activeTab === 'A' ? 'var(--color-signal-blue)' : 'transparent'}; color: ${activeTab === 'A' ? 'var(--color-paper)' : 'var(--color-ash)'}; border: 1.5px solid ${activeTab === 'A' ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.08)'}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Série A
        </button>
        <button class="tab-button" data-action="setTableTab" data-value="B" style="flex: 1; background: ${activeTab === 'B' ? 'var(--color-signal-blue)' : 'transparent'}; color: ${activeTab === 'B' ? 'var(--color-paper)' : 'var(--color-ash)'}; border: 1.5px solid ${activeTab === 'B' ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.08)'}; padding: 10px; border-radius: var(--radius-md); font-weight: 700; font-family: var(--font-display); font-size: 0.8rem; text-transform: uppercase; cursor: pointer; transition: all 0.2s;">
          Série B
        </button>
      </div>

      <div class="section-heading" style="margin-top: 10px;">
        <h2>Classificação</h2>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="table-container" style="overflow-x: auto; width: 100%; border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-lg); background: rgba(0,0,0,0.15); margin-top: 10px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; min-width: 580px;">
          <thead>
            <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: var(--color-ash); font-family: 'Fixture', sans-serif; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em;">
              <th style="padding: 12px 10px; text-align: center; width: 50px;">#</th>
              <th style="padding: 12px 24px 12px 14px; width: 1%; white-space: nowrap;">Jogador</th>
              <th style="padding: 12px 10px; text-align: center; width: 70px;" title="Figurinhas Obtidas">Fig</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Vitórias">V</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Derrotas">D</th>
              <th style="padding: 12px 10px; text-align: center; width: 50px;" title="Partidas Jogadas">J</th>
              <th style="padding: 12px 10px; text-align: center; width: 60px;" title="Chaves Forjadas">Ch</th>
              <th style="padding: 12px 10px; text-align: center; width: 60px;" title="Desafios Concluídos">Des</th>
            </tr>
          </thead>
          <tbody>
            ${sortedPlayers.length === 0 && !albumRowHtml
              ? `<tr><td colspan="8" style="padding: 24px; text-align: center; color: var(--color-ash);">Nenhum jogador cadastrado nesta série.</td></tr>`
              : sortedPlayers.map((p, idx) => {
                  const isCurrentUser = p.username === state.user.id;
                  const rowBg = isCurrentUser 
                    ? 'rgba(242, 193, 78, 0.06)' 
                    : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
                  const nameColor = isCurrentUser ? 'var(--color-gold)' : 'var(--color-paper)';
                  
                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); background: ${rowBg}; transition: background 140ms ease;">
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: ${isCurrentUser ? 'var(--color-gold)' : 'var(--color-ash)'};">
                        ${String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 24px 12px 14px; font-weight: 600; color: ${nameColor}; width: 1%; white-space: nowrap;">
                        ${formatPlayerNameFromLogin(p.username)}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: var(--color-paper);">
                        ${String(p.stickersCount).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: #4cd964;">
                        ${String(p.wins).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: #ff3b30;">
                        ${String(p.losses).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; color: var(--color-ash);">
                        ${String(p.played).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: var(--color-gold);">
                        ${String(p.keys).padStart(2, '0')}
                      </td>
                      <td style="padding: 12px 10px; text-align: center; font-weight: 600; color: var(--color-signal-blue);">
                        ${String(p.challengesCount).padStart(2, '0')}
                      </td>
                    </tr>
                  `;
                }).join('') + albumRowHtml
            }
          </tbody>
        </table>
      </div>
      
      <!-- LEGEND / EXPLANATION -->
      <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.7rem; color: var(--color-ash); padding: 0 4px;">
        <span><strong>Fig:</strong> Figurinhas Obtidas</span>
        <span><strong>V:</strong> Vitórias</span>
        <span><strong>D:</strong> Derrotas</span>
        <span><strong>J:</strong> Partidas Jogadas</span>
        <span><strong>Ch:</strong> Chaves Forjadas</span>
        <span><strong>Des:</strong> Desafios Concluídos</span>
      </div>
    </section>
  `;
}
