# Supabase FOC 2026

Este diretório cobre os passos 1, 2 e 3 antes do lançamento:

1. Criar/validar tabelas `foc2026_*`.
2. Fixar as regras atuais de negócio no banco.
3. Aplicar RLS e mover operações críticas para RPCs.

## Premissa de segurança

RLS por usuário só é segura se o app usar Supabase Auth. O login visual atual por `username` não autentica o usuário no banco. Para lançamento, cada jogador precisa entrar com Supabase Auth e o username deve bater com:

- `auth.users.email`, ou
- `auth.users.raw_user_meta_data->>'username'`.

O SQL em `001_schema_rls.sql` usa a função `foc2026_current_username()` para resolver o usuário atual.

## Ordem

1. Criar usuários no Supabase Auth.
2. Aplicar `001_schema_rls.sql`.
3. Gerar a distribuição dos packs iniciais com `scripts/generate-initial-packs.js`.
4. Rodar seed dos jogadores/rodadas/partidas/desafios usando essa distribuição.
4. Ajustar o frontend para usar RPCs nas operações críticas.

## Regra do pack inicial

- Apenas jogadores reais entram no pool inicial.
- `teste_1` e `teste_2` ficam fora do pool principal.
- Cada jogador real recebe exatamente 6 figurinhas de jogadores.
- Nenhum jogador real pode receber figurinha repetida no pack inicial.
- O pool global tem 162 slots: 27 jogadores reais × 6 figurinhas.
- A distribuição não é uniforme. Ela cria raridade artificial:
  - algumas figurinhas têm 4 ou 5 cópias;
  - algumas têm 6 cópias;
  - outras têm 7 ou 8 cópias.
- As contas de teste podem receber 3 pacotinhos aleatórios separados, sem consumir o pool principal.

O arquivo `src/data/stickers.js` mantém `POOL_CONFIG`, e `scripts/generate-initial-packs.js` valida que:

- todas as 27 figurinhas de jogador estão no pool;
- a soma total é 162;
- cada pack real tem 6 figurinhas únicas;
- o pool é consumido por completo.
