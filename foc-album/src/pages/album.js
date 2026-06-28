import { ALBUM_PAGES, getSticker, HOUSE_META, STICKERS } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';

export function renderAlbum(state) {
  const page = ALBUM_PAGES[state.albumPage];
  const collected = Object.keys(state.collection).length;

  return `
    <section class="page-view album-view">
      <div class="section-heading">
        <p class="eyebrow">Album</p>
        <h2>${collected}/42 figurinhas</h2>
      </div>

      <div class="album-stage">
        <button class="album-control" data-action="pagePrev" ${state.albumPage === 0 ? 'disabled' : ''}>‹</button>
        ${renderAlbumPage(page, state.collection)}
        <button class="album-control" data-action="pageNext" ${state.albumPage === ALBUM_PAGES.length - 1 ? 'disabled' : ''}>›</button>
      </div>

      <div class="page-rail">
        ${ALBUM_PAGES.map((item, index) => `
          <button class="${index === state.albumPage ? 'is-active' : ''}" data-action="setPage" data-value="${index}">
            ${String(item.number).padStart(2, '0')}
          </button>
        `).join('')}
      </div>

      <section class="house-progress">
        ${Object.values(HOUSE_META).map((house) => renderHouseProgress(house, state.collection)).join('')}
      </section>
    </section>
  `;
}

function renderAlbumPage(page, collection) {
  const layout = page.layout ? `layout-${page.layout}` : '';
  return `
    <article class="album-page ${layout}" style="background-image: url('${page.background}')">
      ${page.stickers.map((id) => {
        const sticker = getSticker(id);
        return `<div class="album-slot" aria-label="${sticker?.name || id}">${stickerCard(id, collection)}</div>`;
      }).join('')}
      <span class="page-number">${String(page.number).padStart(2, '0')}</span>
    </article>
  `;
}

function renderHouseProgress(house, collection) {
  const houseStickers = STICKERS.filter((sticker) => sticker.house === house.code);
  const owned = houseStickers.filter((sticker) => collection[sticker.id]).length;
  return `
    <article>
      <img src="${house.icon}" alt="" />
      <span>${house.code}</span>
      <strong>${owned}/${houseStickers.length}</strong>
    </article>
  `;
}
