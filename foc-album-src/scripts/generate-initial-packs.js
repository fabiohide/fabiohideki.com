import { PLAYER_STICKERS, POOL_CONFIG, TEST_ACCOUNT_USERNAMES, shuffleArray } from '../src/data/stickers.js';

const REAL_PLAYER_USERNAMES = [
  'fabio_hideki',
  'flavio_ciampone',
  'pedro_godoy',
  'kammy',
  'daniel_chamon',
  'daniel_mekaro',
  'david_matougolias',
  'diogo_costa',
  'gabriel_firmo',
  'gabriel_oliveira',
  'gian_rumachella',
  'guilherme_faria',
  'guilherme_monteiro',
  'dreadsgu',
  'hygow_lial',
  'jp_rodriguez',
  'leonardo_belchior',
  'lucas_hubacek',
  'marc_emerim',
  'marcos_dhrago',
  'mateus_barbosa',
  'nicholas_sukorski',
  'rigel_duarte',
  'roberto_rocha',
  'rodrigo_bunda',
  'tamara_holanda',
  'victor_faria',
];

const PACK_SIZE = 6;
const TEST_PACK_COUNT = 3;

function buildPool() {
  return Object.entries(POOL_CONFIG).flatMap(([stickerId, count]) => Array.from({ length: count }, () => stickerId));
}

function validatePool() {
  const playerIds = new Set(PLAYER_STICKERS.map((sticker) => sticker.id));
  const configuredIds = Object.keys(POOL_CONFIG);
  const missing = PLAYER_STICKERS.map((sticker) => sticker.id).filter((id) => !(id in POOL_CONFIG));
  const unknown = configuredIds.filter((id) => !playerIds.has(id));
  const total = Object.values(POOL_CONFIG).reduce((sum, count) => sum + count, 0);

  if (missing.length) throw new Error(`POOL_CONFIG sem figurinhas: ${missing.join(', ')}`);
  if (unknown.length) throw new Error(`POOL_CONFIG com ids desconhecidos: ${unknown.join(', ')}`);
  if (total !== REAL_PLAYER_USERNAMES.length * PACK_SIZE) {
    throw new Error(`Pool inicial deve ter ${REAL_PLAYER_USERNAMES.length * PACK_SIZE} slots, recebeu ${total}`);
  }
}

function drawUniquePack(pool, username) {
  const pack = [];
  const used = new Set();

  for (let attempt = 0; attempt < 2000 && pack.length < PACK_SIZE; attempt += 1) {
    const index = Math.floor(Math.random() * pool.length);
    const stickerId = pool[index];
    if (used.has(stickerId)) continue;
    used.add(stickerId);
    pack.push(stickerId);
    pool.splice(index, 1);
  }

  if (pack.length !== PACK_SIZE) {
    throw new Error(`Nao foi possivel gerar pack sem repetidas para ${username}`);
  }

  return pack;
}

export function generateInitialPacks(usernames = REAL_PLAYER_USERNAMES) {
  validatePool();

  const realUsernames = usernames.filter((username) => !TEST_ACCOUNT_USERNAMES.includes(username));
  if (realUsernames.length !== REAL_PLAYER_USERNAMES.length) {
    throw new Error(`Esperava ${REAL_PLAYER_USERNAMES.length} jogadores reais, recebeu ${realUsernames.length}`);
  }

  const pool = shuffleArray(buildPool());
  const packs = {};

  shuffleArray(realUsernames).forEach((username) => {
    packs[username] = drawUniquePack(pool, username);
  });

  if (pool.length !== 0) {
    throw new Error(`Pool inicial sobrou com ${pool.length} slots`);
  }

  return packs;
}

export function generateTestPacks() {
  const playerIds = PLAYER_STICKERS.map((sticker) => sticker.id);
  return Object.fromEntries(
    TEST_ACCOUNT_USERNAMES.map((username) => [
      username,
      Array.from({ length: TEST_PACK_COUNT }, () => shuffleArray(playerIds).slice(0, PACK_SIZE)),
    ]),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packs = generateInitialPacks();
  const testPacks = generateTestPacks();
  console.log(JSON.stringify({ packs, testPacks }, null, 2));
}
