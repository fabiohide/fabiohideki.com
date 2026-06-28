import { HOUSE_META, PLAYER_STICKERS } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';

export function renderReport(state) {
  if (!state.user.packOpened) {
    return `
      <section class="page-view report-view">
        <div class="locked-panel">
          <span class="lock-mark">◇</span>
          <h2>Reporte bloqueado</h2>
          <p>Abra o pack inicial para liberar a rodada.</p>
        </div>
      </section>
    `;
  }

  const report = state.report;
  return `
    <section class="page-view report-view">
      <div class="section-heading">
        <p class="eyebrow">Rodada ${state.activeRound.number}</p>
        <h2>Partida ativa</h2>
      </div>

      <article class="panel match-card">
        <span class="panel-label">${state.matches[0].playerA} vs ${state.matches[0].playerB}</span>
        <div class="match-status">
          ${statusPill(report)}
        </div>
      </article>

      ${renderHouses(report, state.selectedHouseCodes)}
      ${report.housesSubmitted ? renderScore(report) : ''}
      ${report.reported ? renderPicker(state) : ''}
    </section>
  `;
}

function statusPill(report) {
  if (report.completed) return '<strong class="status-pill is-done">Picks concluidos</strong>';
  if (report.reported) return '<strong class="status-pill is-reported">Reportada</strong>';
  if (report.housesSubmitted) return '<strong class="status-pill is-active">Ativa</strong>';
  return '<strong class="status-pill is-waiting">Aguardando casas</strong>';
}

function renderHouses(report, selectedCodes) {
  return `
    <section class="panel houses-panel">
      <div class="panel-row">
        <div>
          <span class="panel-label">Suas casas</span>
          <div class="house-chips">
            ${selectedCodes.map((code) => houseChip(code)).join('')}
          </div>
        </div>
      </div>
      <div class="panel-row">
        <div>
          <span class="panel-label">Adversario</span>
          <div class="house-chips">
            ${report.reported ? report.opponentHouses.map((code) => houseChip(code)).join('') : ['???', '???', '???'].map((code) => `<span class="house-chip is-hidden">${code}</span>`).join('')}
          </div>
        </div>
      </div>
      <button class="button button-primary" data-action="submitHouses" ${report.housesSubmitted ? 'disabled' : ''}>
        ${report.housesSubmitted ? 'Casas informadas' : 'Informar casas'}
      </button>
    </section>
  `;
}

function houseChip(code) {
  const house = HOUSE_META[code];
  return `
    <span class="house-chip">
      ${house ? `<img src="${house.icon}" alt="" />` : ''}
      ${code}
    </span>
  `;
}

function renderScore(report) {
  return `
    <section class="panel score-panel">
      <span class="panel-label">Placar</span>
      <div class="score-grid">
        <label>
          Voce
          <select data-keys="a">
            ${[0, 1, 2, 3].map((value) => `<option value="${value}" ${report.playerAKeys === value ? 'selected' : ''} ${value + report.playerBKeys > 3 ? 'disabled' : ''}>${value}</option>`).join('')}
          </select>
        </label>
        <label>
          Adversario
          <select data-keys="b">
            ${[0, 1, 2, 3].map((value) => `<option value="${value}" ${report.playerBKeys === value ? 'selected' : ''} ${value + report.playerAKeys > 3 ? 'disabled' : ''}>${value}</option>`).join('')}
          </select>
        </label>
      </div>
      <button class="button button-primary" data-action="reportMatch" ${report.reported ? 'disabled' : ''}>
        ${report.reported ? 'Placar reportado' : 'Reportar partida'}
      </button>
    </section>
  `;
}

function renderPicker(state) {
  const report = state.report;
  const eligible = PLAYER_STICKERS
    .filter((sticker) => state.selectedHouseCodes.includes(sticker.house))
    .filter((sticker) => state.opponentCollection[sticker.id])
    .sort((a, b) => Number(Boolean(state.collection[a.id])) - Number(Boolean(state.collection[b.id])));
  const remaining = Math.max(0, report.playerAKeys - report.pickedIds.length);

  return `
    <section class="panel picker-panel">
      <div class="section-heading compact">
        <p class="eyebrow">Picker</p>
        <h2>${remaining} escolhas restantes</h2>
      </div>
      ${eligible.length ? `
        <div class="picker-grid">
          ${eligible.map((sticker) => `
            <div class="picker-item">
              ${stickerCard(sticker.id, { ...state.collection, [sticker.id]: state.collection[sticker.id] || { quantity: 0 } }, { small: true })}
              <button class="button button-secondary" data-action="pickSticker" data-value="${sticker.id}" ${remaining === 0 || report.pickedIds.includes(sticker.id) ? 'disabled' : ''}>
                ${report.pickedIds.includes(sticker.id) ? 'Escolhida' : 'Pegar'}
              </button>
            </div>
          `).join('')}
        </div>
      ` : '<p class="empty-state">O adversario nao tem figurinhas elegiveis.</p>'}
      <button class="button button-primary" data-action="completePicks" ${report.completed ? 'disabled' : ''}>
        ${report.completed ? 'Concluido' : 'Concluir picks'}
      </button>
    </section>
  `;
}
