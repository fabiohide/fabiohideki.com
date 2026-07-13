import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'x-player-username': 'fabio_hideki'
    }
  }
});

const HOUSES = [
  'BRB', 'DIS', 'LGS', 'MRS', 'SCT', 'RDP', 'SHW', 'UNT', 'SAU', 'STA', 'UNF', 'EKW', 'GST', 'SKB'
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function run() {
  console.log('--- GERADOR DE PACOTES DE BRASÕES DA RODADA 3 ---');
  console.log('Regra: 2 brasões de casas já possuídas + 2 brasões de casas não possuídas.\n');
  
  // 1. Busca todos os jogadores
  const { data: players, error: playersError } = await supabase
    .from('foc2026_players')
    .select('username, name');

  if (playersError) {
    console.error('Erro ao buscar jogadores:', playersError);
    process.exit(1);
  }

  // 2. Busca todas as coleções
  const { data: collections, error: colError } = await supabase
    .from('foc2026_collections')
    .select('player_username, sticker_id, quantity');

  if (colError) {
    console.error('Erro ao buscar coleções:', colError);
    process.exit(1);
  }

  // Agrupa coleções
  const playerCollections = {};
  players.forEach(p => {
    playerCollections[p.username] = new Set();
  });

  collections.forEach(c => {
    if (c.quantity > 0 && playerCollections[c.player_username]) {
      playerCollections[c.player_username].add(c.sticker_id);
    }
  });

  const pendingPacksToInsert = [];

  players.forEach(player => {
    const username = player.username;
    if (username === 'admin' || username === 'album' || username === 'rodrigo_bunda' || username === 'gian_rumachella') {
      console.log(`Pulando jogador ${player.name} (${username})...`);
      return;
    }

    const ownedStickers = playerCollections[username] || new Set();
    const ownedHouses = [];
    const unownedHouses = [];

    HOUSES.forEach(house => {
      let hasHouseSticker = false;
      for (let i = 0; i <= 3; i++) {
        if (ownedStickers.has(`${house} ${i}`)) {
          hasHouseSticker = true;
          break;
        }
      }

      if (hasHouseSticker) {
        ownedHouses.push(house);
      } else {
        unownedHouses.push(house);
      }
    });

    const shuffledOwned = shuffle(ownedHouses);
    const shuffledUnowned = shuffle(unownedHouses);
    const selectedStickers = [];

    // Tenta obter 2 brasões de casas possuídas
    const ownedToGet = shuffledOwned.slice(0, 2);
    ownedToGet.forEach(h => selectedStickers.push(`${h} 0`));

    // Tenta obter 2 brasões de casas não possuídas
    const unownedToGet = shuffledUnowned.slice(0, 2);
    unownedToGet.forEach(h => selectedStickers.push(`${h} 0`));

    // Fallback para complementar até 4 figurinhas
    if (selectedStickers.length < 4) {
      const remainingSlots = 4 - selectedStickers.length;
      if (shuffledOwned.length > 2) {
        const extraOwned = shuffledOwned.slice(2, 2 + remainingSlots);
        extraOwned.forEach(h => selectedStickers.push(`${h} 0`));
      } else if (shuffledUnowned.length > 2) {
        const extraUnowned = shuffledUnowned.slice(2, 2 + remainingSlots);
        extraUnowned.forEach(h => selectedStickers.push(`${h} 0`));
      }
    }

    console.log(`Jogador: ${player.name} (${username})`);
    console.log(`  - Casas possuídas: ${ownedHouses.length} (${ownedHouses.join(', ')})`);
    console.log(`  - Casas não possuídas: ${unownedHouses.length} (${unownedHouses.join(', ')})`);
    console.log(`  - Brasões selecionados: ${selectedStickers.join(', ')}`);

    if (selectedStickers.length > 0) {
      pendingPacksToInsert.push({
        player_username: username,
        round_number: 3,
        opponent_name: 'Extra Pack',
        sticker_ids: selectedStickers,
        opened: false,
        pack_type: 'emblem_round',
        challenge_name: 'Rodada 3 - Extra Pack'
      });
    }
  });

  console.log(`\nTotal de pacotes a serem inseridos: ${pendingPacksToInsert.length}`);
  
  if (pendingPacksToInsert.length > 0) {
    const targetUsernames = pendingPacksToInsert.map(p => p.player_username);
    
    console.log('Limpando pacotes antigos de extra pack da Rodada 3 para estes usuários...');
    const { error: clearErr } = await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', 3)
      .eq('pack_type', 'emblem_round')
      .in('player_username', targetUsernames);
      
    if (clearErr) {
      console.error('Erro ao limpar pacotes antigos:', clearErr);
      process.exit(1);
    }
    
    console.log('Gravando novos pacotes no banco de dados...');
    const { error: insertErr } = await supabase
      .from('foc2026_pending_packs')
      .insert(pendingPacksToInsert);

    if (insertErr) {
      console.error('Erro ao salvar os pacotes no banco:', insertErr);
    } else {
      console.log('Sucesso: Todos os pacotes da Rodada 3 foram gerados e salvos no banco de dados!');
    }
  }
}

run();
