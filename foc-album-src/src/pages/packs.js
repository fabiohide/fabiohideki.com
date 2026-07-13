import { getSticker } from '../data/stickers.js';
import { stickerCard } from '../components/sticker-card.js';
import { getAssetUrl } from '../utils/format.js';

export function renderPacks(state) {
  const reveal = state.reveal;

  return `
    <section class="page-view packs-view">
      <div class="section-heading">
        <h2>Pacotinhos</h2>
      </div>

      <div class="panel packs-panel">
        <div class="pack-grid">
          ${state.packs.map((pack) => renderPack(pack, state)).join('')}
        </div>
      </div>

      ${reveal ? renderReveal(reveal, state.collection, state) : ''}
    </section>
  `;
}

function renderPack(pack, state) {
  const packClass = pack.type === 'challenge' ? 'is-golden' : (pack.type === 'emblem_round' ? 'is-emblem-round' : 'is-player');
  const btnClass = pack.type === 'challenge' ? 'button-gold' : (pack.type === 'emblem_round' ? 'button-rainbow' : 'button-silver');
  const disabled = pack.opened || pack.disabled ? 'disabled' : '';

  let label = 'Abrir';
  if (pack.opened || pack.disabled) {
    const openedCount = (state && state.openedPacksCount && state.openedPacksCount[pack.type] !== undefined)
      ? state.openedPacksCount[pack.type]
      : (state && state.packs ? state.packs.filter(p => p.type === pack.type && p.opened).length : 0);

    if (openedCount === 0) {
      label = '0&nbsp;Aberto';
    } else if (openedCount === 1) {
      label = '1&nbsp;Aberto';
    } else {
      label = `${openedCount}&nbsp;Abertos`;
    }
  }

  return `
    <article class="pack-card ${packClass}">
      <div class="pack-art">
        <img src="${getAssetUrl(pack.image)}" alt="${pack.title}" />
      </div>
      <button class="button ${btnClass}" data-action="openPack" data-value="${pack.id}" ${disabled}>
        ${label}
      </button>
    </article>
  `;
}

function renderReveal(reveal, collection, state) {
  // Inicializa estados do reveal se não definidos
  reveal.flippedIndexes = reveal.flippedIndexes || [];
  reveal.ripped = reveal.ripped || false;

  const cards = reveal.pack.stickerIds.map((id, index) => {
    const sticker = getSticker(id);
    const isFlipped = reveal.flippedIndexes.includes(index);
    const cardClass = isFlipped ? 'is-flipped' : '';
    const isCrest = sticker?.type === 'crest' ? 'is-crest' : '';

    return `
      <div class="flip-card ${cardClass} ${isCrest}" data-index="${index}">
        <div class="flip-card-inner">
          <div class="flip-card-back" style="padding: 0; background: transparent;">
            <img src="${getAssetUrl('/assets/sticker_back.webp')}" alt="Verso" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          <div class="flip-card-front">
            ${stickerCard(id, collection, { small: true, forceOwned: true })}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const stateClass = reveal.ripped ? 'state-revealing' : 'state-unopened';
  const allFlipped = reveal.flippedIndexes.length === reveal.pack.stickerIds.length;
  const actionsStyle = allFlipped ? 'opacity: 1; pointer-events: auto;' : 'opacity: 0; pointer-events: none;';

  const isPending = reveal.pack.isPendingPack;
  const isCrest = reveal.pack.type === 'challenge';
  const isEmblemRound = reveal.pack.type === 'emblem_round';
  
  let eyebrowText = isCrest ? 'Pacotinho dourado' : (isEmblemRound ? 'Extra Pack' : (isPending ? 'Pacotinho de Match' : 'Pacotinho inicial'));
  let h2Text = `${reveal.newIds.length} novas figurinhas!`;
  
  if (isPending && state) {
    if (isEmblemRound) {
      eyebrowText = '';
      h2Text = `Rodada ${reveal.pack.roundNumber || 3}: Extra Pack`;
    } else if (isCrest && reveal.pack.challengeName) {
      h2Text = reveal.pack.challengeName;
      const oppPart = reveal.pack.subtitle && reveal.pack.subtitle !== 'Desafio' ? ` · vs ${reveal.pack.opponentName || reveal.pack.subtitle.replace('vs ', '')}` : '';
      const roundNum = reveal.pack.roundNumber || 1;
      eyebrowText = `Desafio Completado · Rodada ${roundNum}${oppPart}`;
    } else {
      const opp = reveal.pack.subtitle || 'Adversário';
      const roundPart = reveal.pack.title.replace('Pacotinho ', '');
      h2Text = `${roundPart} - ${state.user.name} ${opp}`;
    }
  }

  return `
    <div class="reveal-overlay ${stateClass}" id="revealOverlay">
      <div class="reveal-overlay-bg"></div>

      <!-- Fase 1: Pacotinho Fechado -->
      <div class="pack-opening-stage">
        <div class="pack-wrapper-3d" id="packWrapper">
          <div class="pack-rip-container" id="packRipContainer">
            <div class="pack-half pack-top">
              <img src="${getAssetUrl(reveal.pack.image)}" alt="${reveal.pack.title}" />
            </div>
            <div class="pack-half pack-bottom">
              <img src="${getAssetUrl(reveal.pack.image)}" alt="${reveal.pack.title}" />
            </div>
          </div>
          <div class="pack-glow-back"></div>
        </div>
        <div class="pack-instruction">
          <h3>${reveal.pack.title}</h3>
          <p>Clique no pacote para rasgar</p>
        </div>
      </div>

      <!-- Fase 2: Figurinhas Reveladas Uma a Uma -->
      <div class="cards-reveal-stage">
        <div class="reveal-header">
          <p class="eyebrow">${eyebrowText}</p>
          <h2>${h2Text}</h2>
          <p class="reveal-hint">Clique nas figurinhas para revelá-las</p>
        </div>
        <div class="reveal-cards-grid" id="revealCardsGrid">
          ${cards}
        </div>
        <div class="reveal-actions" style="${actionsStyle} transition: opacity 0.5s ease;">
          <button class="button button-secondary" data-action="goAlbum">Ver álbum</button>
        </div>
      </div>
    </div>
  `;
}

export function initPacks(state, actions) {
  const overlay = document.querySelector('#revealOverlay');
  if (!overlay) return;

  const reveal = state.reveal;
  if (!reveal) return;

  reveal.flippedIndexes = reveal.flippedIndexes || [];
  reveal.ripped = reveal.ripped || false;

  // Limpa o reveal ao navegar pelas abas inferiores
  document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
    nav.addEventListener('click', () => {
      state.reveal = null;
    });
  });

  const btnGoAlbum = overlay.querySelector('[data-action="goAlbum"]');
  if (btnGoAlbum) {
    btnGoAlbum.addEventListener('click', () => {
      state.reveal = null;
    });
  }

  if (reveal.ripped) {
    setupCardsReveal(overlay, reveal, state);
    return;
  }

  const packWrapper = overlay.querySelector('#packWrapper');
  if (packWrapper) {
    packWrapper.addEventListener('click', () => {
      if (overlay.classList.contains('state-ripping') || reveal.ripped) return;

      overlay.classList.remove('state-unopened');
      overlay.classList.add('state-ripping');

      createRipParticles(packWrapper, reveal.pack.type === 'challenge');
      playRipSound();

      setTimeout(() => {
        reveal.ripped = true;
        overlay.classList.remove('state-ripping');
        overlay.classList.add('state-revealing');
        setupCardsReveal(overlay, reveal, state);
      }, 1200);
    });
  }
}

function setupCardsReveal(overlay, reveal, state) {
  // Evita registrar listeners duplicados a cada re-render
  if (overlay._cardsInitialized) return;
  overlay._cardsInitialized = true;

  const cards = overlay.querySelectorAll('.flip-card');
  console.log('cards queried:', cards.length);
  const actionsContainer = overlay.querySelector('.reveal-actions');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index, 10);
      console.log('card clicked', index);
      if (reveal.flippedIndexes.includes(index) || card.classList.contains('is-charging')) return;

      const stickerId = reveal.pack.stickerIds[index];
      const sticker = getSticker(stickerId);
      const isCrest = sticker?.type === 'crest';

      if (isCrest) {
        card.classList.add('is-charging');
        playChargeSound();

        const chargeInterval = setInterval(() => {
          if (card.classList.contains('is-charging')) {
            createSparkParticle(card, true);
          } else {
            clearInterval(chargeInterval);
          }
        }, 60);

        setTimeout(() => {
          clearInterval(chargeInterval);
          card.classList.remove('is-charging');
          card.classList.add('is-flipped');
          if (!reveal.flippedIndexes.includes(index)) reveal.flippedIndexes.push(index);
          playRevealSound(true);
          createCardParticles(card, true);
          checkAllFlipped();
        }, 400);
      } else {
        card.classList.add('is-flipped');
        if (!reveal.flippedIndexes.includes(index)) reveal.flippedIndexes.push(index);
        playRevealSound(false);
        createCardParticles(card, false);
        checkAllFlipped();
      }
    });
  });

  function checkAllFlipped() {
    const allFlipped = reveal.flippedIndexes.length === reveal.pack.stickerIds.length;
    if (allFlipped && actionsContainer) {
      setTimeout(() => {
        actionsContainer.style.opacity = '1';
        actionsContainer.style.pointerEvents = 'auto';
      }, 500);
    }
  }
}

function createRipParticles(parent, isGold) {
  const rect = parent.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'pack-particle';

    const size = Math.random() * 8 + 4;
    particle.style.setProperty('--size', `${size}px`);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 180 + 50;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    const duration = Math.random() * 0.6 + 0.6;
    particle.style.setProperty('--duration', `${duration}s`);

    let color;
    if (isGold) {
      const colors = ['#f2c14e', '#ffd700', '#ffffff', '#e5c158', '#b8860b'];
      color = colors[Math.floor(Math.random() * colors.length)];
    } else {
      const colors = ['#3185ff', '#ffffff', '#1e90ff', '#8a2be2', '#00ffff'];
      color = colors[Math.floor(Math.random() * colors.length)];
    }
    particle.style.setProperty('--particle-color', color);

    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    parent.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
}

function createSparkParticle(card, isGold) {
  const rect = card.getBoundingClientRect();
  const particle = document.createElement('div');
  particle.className = 'pack-particle';

  const size = Math.random() * 4 + 2;
  particle.style.setProperty('--size', `${size}px`);

  const dx = (Math.random() - 0.5) * 60;
  const dy = - (Math.random() * 40 + 10);
  particle.style.setProperty('--dx', `${dx}px`);
  particle.style.setProperty('--dy', `${dy}px`);

  const duration = Math.random() * 0.3 + 0.2;
  particle.style.setProperty('--duration', `${duration}s`);
  particle.style.setProperty('--particle-color', isGold ? '#ffd700' : '#3185ff');

  particle.style.left = `${Math.random() * rect.width}px`;
  particle.style.top = `${Math.random() * rect.height}px`;

  card.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, duration * 1000);
}

function createCardParticles(card, isGold) {
  const rect = card.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const count = isGold ? 35 : 15;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'pack-particle';

    const size = Math.random() * 6 + 3;
    particle.style.setProperty('--size', `${size}px`);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 120 + 30;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    const duration = Math.random() * 0.5 + 0.4;
    particle.style.setProperty('--duration', `${duration}s`);

    let color;
    if (isGold) {
      const colors = ['#f2c14e', '#ffd700', '#ffffff', '#fff8dc'];
      color = colors[Math.floor(Math.random() * colors.length)];
    } else {
      const colors = ['#3185ff', '#ffffff', '#e0ffff'];
      color = colors[Math.floor(Math.random() * colors.length)];
    }
    particle.style.setProperty('--particle-color', color);

    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    card.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
}

function playRipSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Falha silenciosa
  }
}

function playChargeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Silencioso
  }
}

function playRevealSound(isCrest) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isCrest) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(329.63, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc2.start();
      osc2.stop(ctx.currentTime + 0.55);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    }

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Silencioso
  }
}
