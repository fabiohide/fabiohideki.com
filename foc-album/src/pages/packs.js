import { getSticker } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';

export function renderPacks(state) {
  const reveal = state.reveal;
  const collected = Object.keys(state.collection).length;

  return `
    <section class="page-view packs-view">
      <div class="section-heading">
        <p class="eyebrow">Pacotinhos</p>
        <h2>Abra, revele, cole.</h2>
      </div>

      <div class="pack-grid">
        ${state.packs.map((pack) => renderPack(pack)).join('')}
      </div>

      <section class="panel collection-summary">
        <div>
          <span class="panel-label">Colecao atual</span>
          <strong>${collected}/42</strong>
        </div>
        <div class="meter"><span style="width: ${(collected / 42) * 100}%"></span></div>
      </section>

      ${reveal ? renderReveal(reveal, state.collection) : ''}
    </section>
  `;
}

function renderPack(pack) {
  const packClass = pack.type === 'crest' ? 'is-golden' : 'is-player';
  const disabled = pack.opened ? 'disabled' : '';
  return `
    <article class="pack-card ${packClass}">
      <div class="pack-art">
        <img src="${pack.image}" alt="${pack.title}" />
      </div>
      <div class="pack-info">
        <span>${pack.type === 'crest' ? 'Brasoes' : 'Jogadores'}</span>
        <h3>${pack.title}</h3>
        <p>${pack.subtitle}</p>
      </div>
      <button class="button ${pack.type === 'crest' ? 'button-gold' : 'button-primary'}" data-action="openPack" data-value="${pack.id}" ${disabled}>
        ${pack.opened ? 'Aberto' : 'Abrir pack'}
      </button>
    </article>
  `;
}

function renderReveal(reveal, collection) {
  const cards = reveal.pack.stickerIds.map((id) => {
    const sticker = getSticker(id);
    return `
      <div class="reveal-item">
        ${stickerCard(id, collection, { small: true })}
        <span>${sticker?.type === 'crest' ? 'Brasao' : 'Jogador'}</span>
      </div>
    `;
  }).join('');

  return `
    <section class="panel reveal-panel">
      <div class="section-heading compact">
        <p class="eyebrow">${reveal.pack.type === 'crest' ? 'Pack dourado' : 'Pack inicial'}</p>
        <h2>${reveal.newIds.length} novas, ${reveal.duplicateIds.length} repetidas</h2>
      </div>
      <div class="reveal-grid">${cards}</div>
      <button class="button button-secondary" data-action="goAlbum">Ver no album</button>
    </section>
  `;
}
