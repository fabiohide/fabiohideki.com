import { PLAYER_STICKERS } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';

export function renderChallenges(state) {
  const challenges = state.challenges || [];
  const completedCount = challenges.filter(c => c.completed).length;
  const pendingCount = challenges.filter(c => c.pendingValidation && !c.completed).length;
  const usedSlots = completedCount + pendingCount;
  const maxChallenges = 4;
  const canClaimMore = usedSlots < maxChallenges;

  return `
    <section class="page-view challenges-view">
      <div class="section-heading">
        <h2>Desafios</h2>
      </div>

      ${renderChallengesContent(state)}
    </section>
  `;
}

export function renderChallengesContent(state) {
  const challenges = state.challenges || [];
  const completedCount = challenges.filter(c => c.completed).length;
  const pendingCount = challenges.filter(c => c.pendingValidation && !c.completed).length;
  const usedSlots = completedCount + pendingCount;
  const maxChallenges = 4;
  const canClaimMore = usedSlots < maxChallenges;

  return `
    <div class="challenges-content-wrapper" style="width: 100%;">
      <div class="challenges-progress-bar-wrapper">
        <div class="challenges-meta">
          <span class="challenges-used">${usedSlots} / ${maxChallenges} desafios usados</span>
          ${pendingCount > 0 ? `<span class="challenges-pending-badge">${pendingCount} aguardando validação</span>` : ''}
        </div>
        <div class="challenges-track">
          ${[1, 2, 3, 4].map(i => `<span class="challenges-dot ${usedSlots >= i ? 'is-filled' : ''}"></span>`).join('')}
        </div>
      </div>

      <div class="challenges-rule-note">
        <span class="rule-icon">ℹ</span>
        <p>Reporte e aguarde a confirmação do Flávio.</p>
      </div>

      <div class="challenges-list">
        ${challenges.map(c => renderChallenge(c, canClaimMore, state)).join('')}
      </div>
    </div>
  `;
}

function renderChallenge(challenge, canClaimMore, state) {
  const isCompleted = challenge.completed;
  const isPending   = challenge.pendingValidation && !isCompleted;

  let actionEl = '';

  if (isCompleted) {
    actionEl = `<button class="button" disabled style="background: rgba(0, 99, 225, 0.12); color: var(--color-signal-blue); border: 1px solid rgba(0, 99, 225, 0.28); min-width: 160px;">Concluído (+${challenge.pickedId || 'figurinha'})</button>`;
  } else if (isPending) {
    actionEl = `<button class="button" disabled style="background: rgba(242, 193, 78, 0.12); color: #f2c14e; border: 1px solid rgba(242, 193, 78, 0.28); min-width: 160px;">Aguardando</button>`;
  } else {
    actionEl = canClaimMore
      ? `<button class="button" data-action="claimChallenge" data-value="${challenge.id}" style="background: transparent; border: 2.5px solid var(--color-paper); color: var(--color-paper); font-weight: 700; min-width: 160px;">Reportar</button>`
      : `<button class="button button-secondary" disabled title="Limite de 4 desafios atingido" style="min-width: 160px;">Limite atingido</button>`;
  }

  return `
    <article class="challenge-item ${isCompleted ? 'is-completed' : ''} ${isPending ? 'is-pending' : ''}">
      <div class="challenge-info">
        <h4 class="challenge-title">${challenge.title}</h4>
        <p class="challenge-desc">${challenge.desc}</p>
      </div>
      <div class="challenge-action">
        ${actionEl}
      </div>
    </article>
  `;
}

export function renderChallengePicker(state) {
  if (!state.activeChallengeId) return '';

  const challenge = (state.challenges || []).find(c => c.id === state.activeChallengeId);
  if (!challenge) return '';

  // Pool: qualquer figurinha de jogador que o player não tenha
  const pool = PLAYER_STICKERS.filter(
    s => !state.collection[s.id] || state.collection[s.id].quantity === 0
  );

  return `
    <div class="challenge-picker-overlay" id="challengePickerOverlay">
      <div class="challenge-picker-bg" data-action="closeChallengePicke"></div>
      <div class="challenge-picker-content">
        <div class="challenge-picker-header">
          <h3>Escolha sua figurinha bônus</h3>
          <p class="challenge-picker-sub">Desafio: <strong>${challenge.title}</strong></p>
          <p class="challenge-picker-note">Sua escolha será enviada para validação dos administradores.</p>
          <button class="close-highlight-btn" data-action="closeChallengePicke">✕</button>
        </div>
        <div class="challenge-picker-grid">
          ${pool.length === 0
            ? `<p class="empty-text">Você já tem todas as figurinhas!</p>`
            : pool.map(s => `
              <div class="picker-item">
                <div class="picker-card-wrapper">
                  ${stickerCard(s.id, {}, { small: true })}
                </div>
                <button class="button button-primary"
                        data-action="pickChallengeSticker"
                        data-challenge="${challenge.id}"
                        data-value="${s.id}">
                  Escolher
                </button>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>
  `;
}

export function renderChallengeConfirmation(state) {
  if (!state.confirmChallengeId) return '';

  const challenge = (state.challenges || []).find(c => c.id === state.confirmChallengeId);
  if (!challenge) return '';

  return `
    <div class="challenge-picker-overlay" id="challengeConfirmOverlay">
      <div class="challenge-picker-bg" data-action="cancelChallenge"></div>
      <div class="challenge-picker-content" style="max-width: 420px; text-align: center;">
        <div class="challenge-picker-header">
          <h3>Confirmar Desafio</h3>
          <p class="challenge-picker-sub" style="margin-top: 10px; font-size: 0.9rem;">
            Você confirma que concluiu o desafio:<br>
            <strong>${challenge.title}</strong>?
          </p>
          <p class="challenge-picker-note" style="margin-top: 14px; text-align: left;">
            Ao confirmar, você poderá escolher a sua figurinha bônus e o desafio será enviado para validação dos administradores.
          </p>
        </div>
        <div class="challenge-confirm-buttons" style="display: flex; gap: 12px; justify-content: center; margin-top: 16px; width: 100%;">
          <button class="button button-secondary" data-action="cancelChallenge" style="flex: 1;">Cancelar</button>
          <button class="button button-primary" data-action="confirmChallenge" data-value="${challenge.id}" style="flex: 1;">Confirmar</button>
        </div>
      </div>
    </div>
  `;
}
