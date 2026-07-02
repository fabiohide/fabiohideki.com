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
      'x-player-username': 'teste_1'
    }
  }
});

async function run() {
  console.log('Resetando figurinhas de teste_1...');

  // Deleta a coleção
  const { error: delCollError } = await supabase
    .from('foc2026_collections')
    .delete()
    .eq('player_username', 'teste_1');
  
  if (delCollError) {
    console.error('Erro ao deletar coleções:', delCollError);
  } else {
    console.log('Coleções deletadas com sucesso.');
  }

  // Deleta logs de figurinhas
  const { error: delLogError } = await supabase
    .from('foc2026_stickers_log')
    .delete()
    .eq('player_username', 'teste_1');

  if (delLogError) {
    console.error('Erro ao deletar logs:', delLogError);
  } else {
    console.log('Logs deletados com sucesso.');
  }

  // Atualiza pack_opened para false
  const { error: updateError } = await supabase
    .from('foc2026_players')
    .update({ pack_opened: false })
    .eq('username', 'teste_1');

  if (updateError) {
    console.error('Erro ao atualizar player:', updateError);
  } else {
    console.log('Player atualizado com sucesso (pack_opened = false).');
  }

  console.log('Reset finalizado para teste_1!');
}

run();
