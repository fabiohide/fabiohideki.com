import fs from 'fs';
import path from 'path';
import { PLAYER_STICKERS, shuffleArray } from '../src/data/stickers.js';

const PLAYERS_SERIES = {
  // Série A (15 jogadores)
  'leonardo_belchior': { name: 'Leo Butinão', serie: 'A' },
  'david_matougolias': { name: 'David Pereira Neto', serie: 'A' },
  'marcos_dhrago': { name: 'Marcos Dhrago', serie: 'A' },
  'diogo_costa': { name: 'Diogo Costa', serie: 'A' },
  'dreadsgu': { name: 'DreadsGu', serie: 'A' },
  'daniel_mekaro': { name: 'Daniel Mekaro', serie: 'A' },
  'flavio_ciampone': { name: 'Flávio Ciampone', serie: 'A' },
  'guilherme_faria': { name: 'Guilherme Faria', serie: 'A' },
  'lucas_hubacek': { name: 'Lucas Hubacek', serie: 'A' },
  'kammy': { name: 'Camilly Marcondes', serie: 'A' },
  'marc_emerim': { name: 'Marc Emerim', serie: 'A' },
  'nicholas_sukorski': { name: 'Nicholas Sukorski', serie: 'A' },
  'pedro_godoy': { name: 'Pedro Godoy', serie: 'A' },
  'roberto_rocha': { name: 'Roberto Rocha', serie: 'A' },
  'victor_faria': { name: 'Victor Faria', serie: 'A' },

  // Série B (12 jogadores)
  'rodrigo_bunda': { name: 'Rodrigo Bunda', serie: 'B' },
  'daniel_chamon': { name: 'Daniel Chamon', serie: 'B' },
  'fabio_hideki': { name: 'Fábio Hideki', serie: 'B' },
  'gabriel_firmo': { name: 'Gabriel Firmo', serie: 'B' },
  'gian_rumachella': { name: 'Gian Rumachella', serie: 'B' },
  'hygow_lial': { name: 'Hygow Lial', serie: 'B' },
  'jp_rodriguez': { name: 'JP Rodriguez', serie: 'B' },
  'mateus_barbosa': { name: 'Mateus Barbosa', serie: 'B' },
  'guilherme_monteiro': { name: 'Guilherme Monteiro', serie: 'B' },
  'rigel_duarte': { name: 'Rigel Duarte', serie: 'B' },
  'tamara_holanda': { name: 'Tamara Holanda', serie: 'B' },
  'gabriel_oliveira': { name: 'Gabriel Oliveira', serie: 'B' }
};

const NAME_TO_USERNAME = {
  'Daniel Chamon': 'daniel_chamon',
  'Marc Emerim': 'marc_emerim',
  'David Pereira Neto': 'david_matougolias',
  'David MatouGolias': 'david_matougolias',
  'Mateus Barbosa': 'mateus_barbosa',
  'Victor Faria': 'victor_faria',
  'Kammy': 'kammy',
  'Camilly Marcondes': 'kammy',
  'Guilherme Monteiro': 'guilherme_monteiro',
  'Daniel Mekaro': 'daniel_mekaro',
  'JP Rodriguez': 'jp_rodriguez',
  'Leo Butinão': 'leonardo_belchior',
  'Rigel Duarte': 'rigel_duarte',
  'Gian Rumachella': 'gian_rumachella',
  'Rodrigo Bunda': 'rodrigo_bunda',
  'Diogo Costa': 'diogo_costa',
  'Flávio Ciampone': 'flavio_ciampone',
  'Gabriel Firmo': 'gabriel_firmo',
  'Lucas Hubacek': 'lucas_hubacek',
  'Marcos Dhrago': 'marcos_dhrago',
  'DreadsGu': 'dreadsgu',
  'Pedro Godoy': 'pedro_godoy',
  'Nicholas Sukorski': 'nicholas_sukorski',
  'Roberto Rocha': 'roberto_rocha',
  'Gabriel Oliveira': 'gabriel_oliveira',
  'Tamara Holanda': 'tamara_holanda',
  'Guilherme Faria': 'guilherme_faria',
  'Hygow Lial': 'hygow_lial',
  'Fábio Hideki': 'fabio_hideki'
};

const PACK_SIZE = 6;

function generatePacks() {
  const stickersA = [];
  const stickersB = [];

  PLAYER_STICKERS.forEach(s => {
    const username = NAME_TO_USERNAME[s.name];
    const player = PLAYERS_SERIES[username];
    if (player) {
      if (player.serie === 'A') {
        stickersA.push(s.id);
      } else {
        stickersB.push(s.id);
      }
    } else {
      console.warn(`Figurinha ${s.id} (${s.name}) não pôde ser mapeada para um jogador.`);
    }
  });

  console.log(`Mapeadas ${stickersA.length} figurinhas para a Série A e ${stickersB.length} para a Série B.`);

  // Quantidades de cada figurinha nas pools (raridades artificiais)
  const qtyA = [8, 8, 8, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 4];
  const poolConfigA = {};
  stickersA.forEach((id, i) => {
    poolConfigA[id] = qtyA[i];
  });

  const qtyB = [8, 8, 7, 7, 6, 6, 6, 6, 5, 5, 4, 4];
  const poolConfigB = {};
  stickersB.forEach((id, i) => {
    poolConfigB[id] = qtyB[i];
  });

  const usersA = Object.keys(PLAYERS_SERIES).filter(u => PLAYERS_SERIES[u].serie === 'A');
  const usersB = Object.keys(PLAYERS_SERIES).filter(u => PLAYERS_SERIES[u].serie === 'B');

  let packs = {};

  // Função para desenhar pacote sem repetições
  function drawUniquePack(pool, username) {
    const pack = [];
    const used = new Set();

    // Filtra figurinhas que ainda têm quantidade disponível
    for (let attempt = 0; attempt < 1000 && pack.length < PACK_SIZE; attempt++) {
      const index = Math.floor(Math.random() * pool.length);
      const stickerId = pool[index];
      if (used.has(stickerId)) continue;
      used.add(stickerId);
      pack.push(stickerId);
      pool.splice(index, 1);
    }

    if (pack.length !== PACK_SIZE) {
      return null;
    }
    return pack;
  }

  // Tenta gerar a distribuição geral até que nenhuma colisão insolúvel ocorra nas pools
  let success = false;
  let attempts = 0;

  while (!success && attempts < 10000) {
    attempts++;
    packs = {};

    const poolA = Object.entries(poolConfigA).flatMap(([id, count]) => Array.from({ length: count }, () => id));
    const poolB = Object.entries(poolConfigB).flatMap(([id, count]) => Array.from({ length: count }, () => id));
    const shuffledPoolA = shuffleArray(poolA);
    const shuffledPoolB = shuffleArray(poolB);

    let failed = false;

    // Distribui Série A
    for (const username of shuffleArray(usersA)) {
      const p = drawUniquePack(shuffledPoolA, username);
      if (!p) {
        failed = true;
        break;
      }
      packs[username] = p;
    }

    if (failed) continue;

    // Distribui Série B
    for (const username of shuffleArray(usersB)) {
      const p = drawUniquePack(shuffledPoolB, username);
      if (!p) {
        failed = true;
        break;
      }
      packs[username] = p;
    }

    if (failed) continue;

    success = true;
  }

  if (!success) {
    throw new Error('Não foi possível gerar a distribuição de pacotes após 10000 tentativas.');
  }

  console.log(`Distribuição de pacotinhos concluída com sucesso em ${attempts} tentativas!`);

  // Packs de teste
  const allPlayerIds = PLAYER_STICKERS.map(s => s.id);
  const testPacks = {
    'teste_1': shuffleArray(allPlayerIds).slice(0, PACK_SIZE),
    'teste_2': shuffleArray(allPlayerIds).slice(0, PACK_SIZE)
  };

  return { packs, testPacks };
}

const result = generatePacks();
const destPath = path.resolve(process.cwd(), 'src/data/initial-packs.json');
fs.writeFileSync(destPath, JSON.stringify(result, null, 2), 'utf-8');
console.log('Novos pacotinhos gerados e salvos com sucesso em src/data/initial-packs.json!');
