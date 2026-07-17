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

const TARGET_PLAYERS = [
  'daniel_chamon',
  'david_matougolias',
  'gabriel_firmo',
  'gian_rumachella',
  'guilherme_monteiro',
  'kammy',
  'leonardo_belchior',
  'rodrigo_bunda'
];

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
  console.log('--- ROLLBACK E RE-GERAÇÃO DO EXTRA PACK DA RODADA 4 ---');
  console.log(`Jogadores alvo: ${TARGET_PLAYERS.join(', ')}\n`);
  
  // 1. Busca todos os jogadores
  const { data: players, error: playersError } = await supabase
    .from('foc2026_players')
    .select('username, name')
    .in('username', TARGET_PLAYERS);

  if (playersError) {
    console.error('Erro ao buscar jogadores:', playersError);
    process.exit(1);
  }

  // 2. Busca todas as coleções dos jogadores alvo
  const { data: collections, error: colError } = await supabase
    .from('foc2026_collections')
    .select('player_username, sticker_id, quantity')
    .in('player_username', TARGET_PLAYERS);

  if (colError) {
    console.error('Erro ao buscar coleções:', colError);
    process.exit(1);
  }

  // 3. Busca pacotes pendentes (não abertos) dos jogadores alvo
  const { data: pendingPacks, error: pendingError } = await supabase
    .from('foc2026_pending_packs')
    .select('player_username, sticker_ids')
    .eq('opened', false)
    .in('player_username', TARGET_PLAYERS);

  if (pendingError) {
    console.error('Erro ao buscar pacotes pendentes:', pendingError);
    process.exit(1);
  }

  // Agrupa coleções
  const playerCollections = {};
  TARGET_PLAYERS.forEach(u => {
    playerCollections[u] = new Set();
  });

  // Adiciona figurinhas que já estão na coleção
  collections.forEach(c => {
    if (c.quantity > 0 && playerCollections[c.player_username]) {
      playerCollections[c.player_username].add(c.sticker_id);
    }
  });

  // Adiciona figurinhas de pacotes pendentes (ainda não abertos)
  pendingPacks.forEach(p => {
    if (playerCollections[p.player_username] && p.sticker_ids) {
      p.sticker_ids.forEach(sid => {
        playerCollections[p.player_username].add(sid);
        console.log(`[Pendente] Considerando figurinha '${sid}' como possuída para ${p.player_username}`);
      });
    }
  });

  const pendingPacksToInsert = [];

  players.forEach(player => {
    const username = player.username;
    const ownedStickers = playerCollections[username] || new Set();
    const ownedPlayerHouses = [];
    const unownedHouses = [];

    HOUSES.forEach(house => {
      // Check if player has at least one player sticker of this house (index 1, 2 or 3)
      let hasPlayerSticker = false;
      for (let i = 1; i <= 3; i++) {
        if (ownedStickers.has(`${house} ${i}`)) {
          hasPlayerSticker = true;
          break;
        }
      }

      // Check if player has any sticker at all in this house (index 0 to 3)
      let hasAnySticker = false;
      for (let i = 0; i <= 3; i++) {
        if (ownedStickers.has(`${house} ${i}`)) {
          hasAnySticker = true;
          break;
        }
      }

      if (hasPlayerSticker) {
        ownedPlayerHouses.push(house);
      }
      if (!hasAnySticker) {
        unownedHouses.push(house);
      }
    });

    const shuffledOwned = shuffle(ownedPlayerHouses);
    const shuffledUnowned = shuffle(unownedHouses);
    const selectedStickers = [];

    if (unownedHouses.length > 0) {
      // 1. Try to get 2 emblems from ownedPlayerHouses
      const ownedToGet = shuffledOwned.slice(0, 2);
      ownedToGet.forEach(h => selectedStickers.push(`${h} 0`));
      
      // 2. Try to get 1 emblem from unownedHouses
      const unownedToGet = shuffledUnowned.slice(0, 1);
      unownedToGet.forEach(h => selectedStickers.push(`${h} 0`));
      
      // Fallback
      if (selectedStickers.length < 3) {
        const remainingSlots = 3 - selectedStickers.length;
        const remainingUnowned = shuffledUnowned.filter(h => !selectedStickers.includes(`${h} 0`));
        const remainingOwned = shuffledOwned.filter(h => !selectedStickers.includes(`${h} 0`));
        
        remainingUnowned.slice(0, remainingSlots).forEach(h => selectedStickers.push(`${h} 0`));
        if (selectedStickers.length < 3) {
          const newRemainingSlots = 3 - selectedStickers.length;
          remainingOwned.slice(0, newRemainingSlots).forEach(h => selectedStickers.push(`${h} 0`));
        }
      }
    } else {
      const allShuffled = shuffle(HOUSES);
      allShuffled.slice(0, 3).forEach(h => selectedStickers.push(`${h} 0`));
    }

    console.log(`\nJogador: ${player.name} (${username})`);
    console.log(`  - Casas com fig. de jogador: ${ownedPlayerHouses.length} (${ownedPlayerHouses.join(', ')})`);
    if (unownedHouses.length === 0) {
      console.log(`  - Casas não possuídas: Nenhuma (todas representadas)`);
    } else {
      console.log(`  - Casas não possuídas: ${unownedHouses.length} (${unownedHouses.join(', ')})`);
    }
    console.log(`  - NOVO Extra Pack Sorteado: ${selectedStickers.join(', ')}`);

    if (selectedStickers.length === 3) {
      pendingPacksToInsert.push({
        player_username: username,
        round_number: 4,
        opponent_name: 'Extra Pack',
        sticker_ids: selectedStickers,
        opened: false,
        pack_type: 'emblem_round',
        challenge_name: 'Rodada 4 - Extra Pack'
      });
    } else {
      console.error(`  - ERRO: Falha ao gerar 3 figurinhas para ${username}. Obtidas: ${selectedStickers.length}`);
    }
  });

  console.log(`\nTotal de novos pacotes a serem inseridos: ${pendingPacksToInsert.length}`);
  
  if (pendingPacksToInsert.length > 0) {
    console.log('Limpando pacotes antigos de extra pack da Rodada 4 apenas para estes jogadores alvo...');
    const { error: clearErr } = await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', 4)
      .eq('pack_type', 'emblem_round')
      .in('player_username', TARGET_PLAYERS);
      
    if (clearErr) {
      console.error('Erro ao limpar pacotes antigos:', clearErr);
      process.exit(1);
    }
    
    console.log('Gravando novos pacotes recalculados no banco de dados...');
    const { error: insertErr } = await supabase
      .from('foc2026_pending_packs')
      .insert(pendingPacksToInsert);

    if (insertErr) {
      console.error('Erro ao salvar os pacotes no banco:', insertErr);
    } else {
      console.log('Sucesso: Os pacotes da Rodada 4 dos jogadores selecionados foram re-gerados com sucesso!');
      
      // Log admin action
      await supabase
        .from('foc2026_admin_logs')
        .insert({
          message: `Admin re-gerou os Extra Packs da Rodada 4 para os jogadores com pacotes pendentes: ${TARGET_PLAYERS.join(', ')}`,
          admin_username: 'fabio_hideki'
        });
      console.log('Ação de rollback registrada nos logs de administração!');
    }
  }
}

run();
