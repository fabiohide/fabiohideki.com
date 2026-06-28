import './style/base.css';
import './style/card.css';
import './style/pack.css';
import './style/album.css';
import './style/report.css';

import { createInitialState } from './data/mock-state.js';
import { renderPacks } from './pages/packs.js';
import { renderAlbum } from './pages/album.js';
import { renderReport } from './pages/report.js';
import { hasSupabaseConfig } from './supabase.js';

const state = createInitialState();
const app = document.querySelector('#app');

function setRoute(route) {
  state.currentRoute = route;
  window.history.replaceState(null, '', `#${route}`);
  render();
}

function openPack(packId) {
  const pack = state.packs.find((item) => item.id === packId);
  if (!pack || pack.opened) return;

  pack.opened = true;
  if (pack.type === 'player') state.user.packOpened = true;

  const newIds = [];
  const duplicateIds = [];

  pack.stickerIds.forEach((id) => {
    if (state.collection[id]) {
      state.collection[id].quantity += 1;
      state.collection[id].isNew = true;
      state.collection[id].source = 'pack';
      duplicateIds.push(id);
    } else {
      state.collection[id] = { quantity: 1, isNew: true, source: 'pack' };
      newIds.push(id);
    }
  });

  state.reveal = { pack, newIds, duplicateIds };
  render();
}

function clearNew(stickerId) {
  if (state.collection[stickerId]) state.collection[stickerId].isNew = false;
  render();
}

function setAlbumPage(index) {
  state.albumPage = Math.max(0, Math.min(index, 21));
  render();
}

function submitHouses() {
  state.report.housesSubmitted = true;
  render();
}

function setKeys(side, value) {
  const next = Number(value);
  const other = side === 'a' ? state.report.playerBKeys : state.report.playerAKeys;
  if (next + other > 3) return;
  if (side === 'a') state.report.playerAKeys = next;
  if (side === 'b') state.report.playerBKeys = next;
  render();
}

function reportMatch() {
  if (!state.report.housesSubmitted) return;
  state.report.reported = true;
  render();
}

function pickSticker(stickerId) {
  if (state.report.pickedIds.includes(stickerId)) return;
  if (state.report.pickedIds.length >= state.report.playerAKeys) return;

  state.report.pickedIds.push(stickerId);
  if (state.collection[stickerId]) {
    state.collection[stickerId].quantity += 1;
    state.collection[stickerId].isNew = true;
    state.collection[stickerId].source = 'pick';
  } else {
    state.collection[stickerId] = { quantity: 1, isNew: true, source: 'pick' };
  }
  render();
}

function completePicks() {
  state.report.completed = true;
  render();
}

const actions = {
  setRoute,
  openPack,
  clearNew,
  setAlbumPage,
  submitHouses,
  setKeys,
  reportMatch,
  pickSticker,
  completePicks,
};

function routeView() {
  if (state.currentRoute === 'album') return renderAlbum(state, actions);
  if (state.currentRoute === 'report') return renderReport(state, actions);
  return renderPacks(state, actions);
}

function navItem(route, label, icon) {
  const active = state.currentRoute === route ? 'is-active' : '';
  const disabled = route === 'report' && !state.user.packOpened ? 'is-disabled' : '';
  const badge = route === 'packs' && state.packs.some((pack) => !pack.opened) ? '<span class="nav-badge"></span>' : '';
  return `
    <button class="nav-item ${active} ${disabled}" data-route="${route}" ${disabled ? 'disabled' : ''}>
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge}
    </button>
  `;
}

function render() {
  const unopened = state.packs.filter((pack) => !pack.opened).length;
  const collected = Object.keys(state.collection).length;

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">KeyForge Tournament</p>
          <h1>FOC 26</h1>
        </div>
        <div class="header-status">
          <span>R${state.activeRound.number}</span>
          <strong>${state.activeRound.active ? 'Ativa' : 'Em breve'}</strong>
        </div>
      </header>

      <main class="app-main">
        <section class="dashboard-strip">
          <article>
            <span>Packs</span>
            <strong>${unopened}</strong>
          </article>
          <article>
            <span>Album</span>
            <strong>${collected}/42</strong>
          </article>
          <article>
            <span>Supabase</span>
            <strong>${hasSupabaseConfig ? 'On' : 'Mock'}</strong>
          </article>
        </section>
        ${routeView()}
      </main>

      <nav class="bottom-nav">
        ${navItem('packs', 'Pacotinhos', '▰')}
        ${navItem('album', 'Album', '▣')}
        ${navItem('report', 'Reporte', '◇')}
      </nav>
    </div>
  `;

  app.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.route));
  });

  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const action = element.dataset.action;
      const value = element.dataset.value;
      if (action === 'openPack') openPack(value);
      if (action === 'clearNew') clearNew(value);
      if (action === 'pagePrev') setAlbumPage(state.albumPage - 1);
      if (action === 'pageNext') setAlbumPage(state.albumPage + 1);
      if (action === 'setPage') setAlbumPage(Number(value));
      if (action === 'submitHouses') submitHouses();
      if (action === 'reportMatch') reportMatch();
      if (action === 'pickSticker') pickSticker(value);
      if (action === 'completePicks') completePicks();
      if (action === 'goAlbum') setRoute('album');
    });
  });

  app.querySelectorAll('[data-keys]').forEach((input) => {
    input.addEventListener('change', () => setKeys(input.dataset.keys, input.value));
  });
}

const hashRoute = window.location.hash.replace('#', '');
if (['packs', 'album', 'report'].includes(hashRoute)) state.currentRoute = hashRoute;

render();
