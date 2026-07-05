# Original User Request

## Initial Request — 2026-07-03T14:56:00-03:00

# Teamwork Project Task

Desenvolvimento de um novo fluxo de reporte de partida em etapa única, integração com a API do Decks of KeyForge (DoK) para registrar decks dinamicamente e sistema de liberação/abertura de pacotes de figurinhas pós-partida validados pelo administrador no álbum de KeyForge FOC 2026.

Working directory: `/Users/fabio/Documents/antigravity/fabito/foc-album-src`
Integrity mode: development

## Requirements

### R1. Nova Interface de Reporte de Partida e Integração com Decks of KeyForge (DoK)
- Ocupar toda a largura da linha com a seção de "Pré-partida", tornando-a colapsável.
- Implementar seção "Seu deck" com cabeçalho `<h4>Seu deck</h4>`, input de texto para link do DoK, botão "Colar" à esquerda (lê do clipboard) e botão de Enviar/Remover.
- Buscar informações do deck na API do DoK de forma assíncrona (usando proxy CORS público como `https://corsproxy.io/?`) ao submeter o link, exibindo um card com Nome, SAS, Set e 3 Casas (com ícones em branco).
- Implementar badge colorido de SAS e diferença em relação ao SAS máximo de 86 (verde para 86-82, amarelo para 81-77, vermelho para <=76).
- Implementar formulário de placar numérico simples independente com validação (um vencedor com 3 chaves, perdedor com 0-2, sem empates, WO 0x0 exclusivo de admin).
- Liberar o picker de figurinhas após confirmação do placar (comportamento especial de mensagem de consolo se fizer 0 chaves).
- Enviar o reporte único e exibir modal de sucesso direcionando para o álbum ou tabela de classificação.

### R2. Gerenciamento e Validação no Painel de Admin
- Exibir os reportes individuais (placar e figurinhas solicitadas) enviados por cada jogador nas partidas.
- Adicionar alerta visual caso os placares reportados sejam divergentes.
- Implementar botão "Liberar Figurinhas" em cada partida (habilitado se os placares reportados coincidem) que cria e envia um pacote para a tabela `foc2026_pending_packs`.
- Adicionar botão de W.O. (0x0) direto no painel exclusivo do admin.

### R3. Recebimento e Abertura de Pacotes Pós-Partida
- Carregar pacotes pendentes da tabela `foc2026_pending_packs` na aba de Pacotes.
- Exibir as figurinhas correspondentes em animação de reveal apenas uma vez, com o texto *"Rodada X - [Nome do Jogador] vs [Nome do Oponente]"*.
- Registrar as figurinhas no banco de dados (tabela `foc2026_collections`) apenas após o jogador clicar no botão "Ver Álbum" ao final della revelação.

### R4. Verificação Automatizada
- Criar scripts de teste unitário locais em JavaScript para validar a lógica de SAS (cálculo de badges, cores e diferença em relação ao SAS 86) e as validações do placar (regras de empate, 3 chaves obrigatórias, etc.).

## Acceptance Criteria

### Fluxo de Reporte e Deck DoK
- [ ] O input de deck aceita e valida links do DoK, extrai o UUID e faz a consulta dinamicamente sem recarregar a página.
- [ ] O card do deck exibe corretamente o nome, as 3 casas correspondentes, a coleção (set) com o ícone SVG correspondente na pasta `/assets/sets` em cor branca e o badge de SAS calculado.
- [ ] O placar do reporte valida localmente chaves de 0 a 3, impedindo o envio se não houver um vencedor com 3 chaves ou se houver empates.
- [ ] O botão "Reportar" altera seu estado para "Editar" ao ser enviado com sucesso.
- [ ] O modal de sucesso pós-reporte redireciona corretamente para o Álbum e Standings.

### Admin e Liberação de Pacotes
- [ ] O painel do administrador exibe os reportes de cada jogador de forma isolada para cada confronto de rodada ativa.
- [ ] O botão "Liberar Figurinhas" do admin é habilitado unicamente se os placares de ambos os jogadores coincidem.
- [ ] Ao clicar em "Liberar Figurinhas", o pacote correspondente é inserido na tabela `foc2026_pending_packs`.

### Fluxo de Abertura de Pacotes
- [ ] Pacotes pendentes são carregados no frontend a partir de `foc2026_pending_packs`.
- [ ] A inserção dos stickers na tabela `foc2026_collections` e logs é efetuada no Supabase exclusivamente após o clique em "Ver Álbum" na tela de revelação de pacote.
