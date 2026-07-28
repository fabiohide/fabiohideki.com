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

async function run() {
  const isWriteMode = process.argv.includes('--write');
  console.log(`--- GERADOR E DISTRIBUIDOR DE EXTRA PACK DA RODADA 7 (${isWriteMode ? 'MODO GRAVAÇÃO' : 'MODO SIMULAÇÃO/DRY-RUN'}) ---`);

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

  // 3. Busca pacotes pendentes (não abertos)
  const { data: pendingPacks, error: pendingError } = await supabase
    .from('foc2026_pending_packs')
    .select('player_username, sticker_ids, round_number, pack_type')
    .eq('opened', false);

  if (pendingError) {
    console.error('Erro ao buscar pacotes pendentes:', pendingError);
    process.exit(1);
  }

  // Agrupa coleções e pendentes
  const playerOwned = {};
  players.forEach(p => {
    playerOwned[p.username] = new Set();
  });

  collections.forEach(c => {
    if (c.quantity > 0 && playerOwned[c.player_username]) {
      playerOwned[c.player_username].add(c.sticker_id);
    }
  });

  pendingPacks.forEach(p => {
    const user = p.player_username;
    if (playerOwned[user]) {
      // Ignora o próprio extra pack da rodada 7 se já existir pendente, pois vamos substituí-lo
      if (p.round_number === 7 && p.pack_type === 'emblem_round') {
        return;
      }
      if (p.sticker_ids) {
        p.sticker_ids.forEach(sid => playerOwned[user].add(sid));
      }
    }
  });

  const pendingPacksToInsert = [];
  const summaryTable = [];

  players.forEach(player => {
    const username = player.username;
    if (username === 'admin' || username === 'album' || username === 'teste_1' || username === 'teste_2') {
      return;
    }

    const owned = playerOwned[username] || new Set();
    
    // Brasões já possuídos (fórmula ou fisicamente na coleção ou pendentes)
    const currentEmblems = new Set();
    owned.forEach(sid => {
      if (sid.endsWith(' 0')) {
        currentEmblems.add(sid);
      }
    });

    // Calcula os brasões faltantes das 14 casas
    const missing = HOUSES
      .map(h => `${h} 0`)
      .filter(sid => !currentEmblems.has(sid));

    console.log(`Jogador: ${player.name} (${username})`);
    console.log(`  - Brasões possuídos: ${currentEmblems.size} (${Array.from(currentEmblems).sort().map(sid => sid.split(' ')[0]).join(', ') || 'Nenhum'})`);
    console.log(`  - Faltantes para o Extra Pack 7: ${missing.map(sid => sid.split(' ')[0]).join(', ')} (Qtd: ${missing.length})`);

    summaryTable.push({
      name: player.name,
      ownedBefore: Array.from(currentEmblems).sort().map(sid => sid.split(' ')[0]).join(', '),
      received: missing.map(sid => sid.split(' ')[0]).join(', ')
    });

    if (missing.length === 4) {
      pendingPacksToInsert.push({
        player_username: username,
        round_number: 7,
        opponent_name: 'Extra Pack',
        sticker_ids: missing,
        opened: false,
        pack_type: 'emblem_round',
        challenge_name: 'Rodada 7 - Extra Pack'
      });
    } else {
      console.warn(`  - AVISO: ${player.name} tem um número incomum de brasões faltantes: ${missing.length}`);
      // Insere de qualquer forma para o player com a quantidade de brasões que faltar
      if (missing.length > 0) {
        pendingPacksToInsert.push({
          player_username: username,
          round_number: 7,
          opponent_name: 'Extra Pack',
          sticker_ids: missing,
          opened: false,
          pack_type: 'emblem_round',
          challenge_name: 'Rodada 7 - Extra Pack'
        });
      }
    }
  });

  console.log('\n--- TABELA DE DISTRIBUIÇÃO ---');
  console.log('| Jogador | Brasões que já tinha | Recebido no Extra Pack 7 |');
  console.log('|---|---|---|');
  summaryTable.sort((a, b) => a.name.localeCompare(b.name)).forEach(row => {
    console.log(`| ${row.name} | ${row.ownedBefore || 'Nenhum'} | ${row.received} |`);
  });
  console.log('------------------------------\n');

  if (isWriteMode && pendingPacksToInsert.length > 0) {
    const targetUsernames = pendingPacksToInsert.map(p => p.player_username);
    
    console.log('Limpando pacotes antigos de extra pack da Rodada 7 para todos os usuários...');
    const { error: clearErr } = await supabase
      .from('foc2026_pending_packs')
      .delete()
      .eq('round_number', 7)
      .eq('pack_type', 'emblem_round')
      .in('player_username', targetUsernames);
      
    if (clearErr) {
      console.error('Erro ao limpar pacotes antigos:', clearErr);
      process.exit(1);
    }
    
    console.log('Gravando novos pacotes da Rodada 7 no banco de dados...');
    const { error: insertErr } = await supabase
      .from('foc2026_pending_packs')
      .insert(pendingPacksToInsert);

    if (insertErr) {
      console.error('Erro ao salvar os novos pacotes no banco:', insertErr);
    } else {
      console.log('Sucesso: Todos os pacotes da Rodada 7 foram gerados e salvos no banco de dados!');
      
      // Log admin action
      await supabase
        .from('foc2026_admin_logs')
        .insert({
          message: 'Admin gerou e distribuiu os Extra Packs da Rodada 7 (todos os brasões faltantes para cada player)',
          admin_username: 'fabio_hideki'
        });
      console.log('Ação administrativa registrada nos logs!');
    }
  }
}

run();
