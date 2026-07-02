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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Limpando dados antigos de teste_1 e teste_2...');

  // 1. Limpa coleções de teste_1 e teste_2
  const { error: delCollErr } = await supabase
    .from('foc2026_collections')
    .delete()
    .in('player_username', ['teste_1', 'teste_2']);
  if (delCollErr) console.error('Erro ao limpar coleções:', delCollErr);

  // 2. Limpa stickers log de teste_1 e teste_2
  const { error: delLogErr } = await supabase
    .from('foc2026_stickers_log')
    .delete()
    .in('player_username', ['teste_1', 'teste_2']);
  if (delLogErr) console.error('Erro ao limpar logs de figurinhas:', delLogErr);

  // 3. Reseta pack_opened para false em foc2026_players
  const { error: updPlayerErr } = await supabase
    .from('foc2026_players')
    .update({ pack_opened: false })
    .in('username', ['teste_1', 'teste_2']);
  if (updPlayerErr) console.error('Erro ao resetar pack_opened:', updPlayerErr);

  console.log('Criando rodadas de testes (101, 102, 103)...');

  // Deativa todas as outras rodadas
  const { error: deacErr } = await supabase
    .from('foc2026_rounds')
    .update({ active: false })
    .eq('active', true);
  if (deacErr) console.error('Erro ao desativar rodadas:', deacErr);

  const testRounds = [
    { number: 101, name: 'Teste - Rodada 1', active: true, sas_limit: 80, deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { number: 102, name: 'Teste - Rodada 2', active: false, sas_limit: 80, deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    { number: 103, name: 'Teste - Rodada 3', active: false, sas_limit: 80, deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  for (const r of testRounds) {
    // Tenta obter se já existe
    const { data: existing } = await supabase
      .from('foc2026_rounds')
      .select('*')
      .eq('number', r.number)
      .single();

    if (existing) {
      await supabase
        .from('foc2026_rounds')
        .update({ active: r.active, name: r.name, deadline: r.deadline })
        .eq('number', r.number);
    } else {
      await supabase
        .from('foc2026_rounds')
        .insert(r);
    }
  }

  console.log('Limpando partidas antigas das rodadas de testes...');
  const { error: delMatchesErr } = await supabase
    .from('foc2026_matches')
    .delete()
    .in('round_number', [101, 102, 103]);
  if (delMatchesErr) console.error('Erro ao deletar partidas antigas:', delMatchesErr);

  console.log('Inserindo partidas de teste (teste_1 vs teste_2)...');
  const testMatches = [
    { id: 'test-m1', round_number: 101, player_a_username: 'teste_1', player_b_username: 'teste_2' },
    { id: 'test-m2', round_number: 102, player_a_username: 'teste_1', player_b_username: 'teste_2' },
    { id: 'test-m3', round_number: 103, player_a_username: 'teste_1', player_b_username: 'teste_2' }
  ];

  for (const m of testMatches) {
    const { error: insMatchErr } = await supabase
      .from('foc2026_matches')
      .insert(m);
    if (insMatchErr) console.error(`Erro ao inserir partida ${m.id}:`, insMatchErr);
  }

  console.log('Setup das rodadas e partidas de teste finalizado com sucesso!');
}

run();
