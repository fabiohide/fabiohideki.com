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

async function run() {
  console.log('Resetando dados de fabio_hideki...');

  // 1. Deleta a coleção
  const { error: delCollError } = await supabase
    .from('foc2026_collections')
    .delete()
    .eq('player_username', 'fabio_hideki');
  
  if (delCollError) {
    console.error('Erro ao deletar coleções:', delCollError);
  } else {
    console.log('Coleções deletadas com sucesso.');
  }

  // 2. Deleta logs de figurinhas
  const { error: delLogError } = await supabase
    .from('foc2026_stickers_log')
    .delete()
    .eq('player_username', 'fabio_hideki');

  if (delLogError) {
    console.error('Erro ao deletar logs:', delLogError);
  } else {
    console.log('Logs deletados com sucesso.');
  }

  // 3. Atualiza pack_opened para false em foc2026_players
  const { error: updateError } = await supabase
    .from('foc2026_players')
    .update({ pack_opened: false })
    .eq('username', 'fabio_hideki');

  if (updateError) {
    console.error('Erro ao atualizar player:', updateError);
  } else {
    console.log('Player atualizado com sucesso (pack_opened = false).');
  }

  // 4. Reseta as partidas onde fabio_hideki participa
  const { data: matches, error: fetchMatchesError } = await supabase
    .from('foc2026_matches')
    .select('id, player_a_username, player_b_username')
    .or('player_a_username.eq.fabio_hideki,player_b_username.eq.fabio_hideki');

  if (fetchMatchesError) {
    console.error('Erro ao buscar partidas:', fetchMatchesError);
  } else if (matches) {
    console.log(`Resetando ${matches.length} partidas de fabio_hideki...`);
    for (const m of matches) {
      const { error: matchResetError } = await supabase
        .from('foc2026_matches')
        .update({
          player_a_keys: 0,
          player_b_keys: 0,
          player_a_reported: false,
          player_b_reported: false,
          confirmed_at: null,
          completed: false,
          player_a_houses: null,
          player_b_houses: null,
          player_a_picks_completed: false,
          player_b_picks_completed: false
        })
        .eq('id', m.id);

      if (matchResetError) {
        console.error(`Erro ao resetar partida ${m.id}:`, matchResetError);
      } else {
        console.log(`Partida ${m.id} resetada com sucesso.`);
      }
    }
  }

  // 5. Deleta figurinhas obtidas via pick pós-partida de fabio_hideki
  const { error: delPickError } = await supabase
    .from('foc2026_collections')
    .delete()
    .eq('source', 'pick')
    .eq('player_username', 'fabio_hideki');

  if (delPickError) {
    console.error('Erro ao deletar coleções do tipo pick:', delPickError);
  } else {
    console.log('Coleções do tipo pick deletadas com sucesso.');
  }

  // 6. Também remove o rascunho de pack_extra_opened se existir no localstorage do browser
  // (Isso será feito no carregamento ou no main.js, mas no banco já limpamos as coleções de pacotinho).

  console.log('Reset finalizado para fabio_hideki!');
}

run();
