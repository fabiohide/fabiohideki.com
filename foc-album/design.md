# FOC 26 Digital Album — Design System Specifications

Este documento descreve as especificações e tokens de design adotados para o Álbum Digital FOC 26 baseados em um esquema de cores de **neutros escuros e tons profundos de quase preto**.

---

## 1. Paleta de Cores (Tons Neutros Escuros)

*   **Fundo Principal (Background)**: `#070812` (azul-escuro profundo espacial com gradientes radiais sutis de luz colorida nas extremidades).
*   **Cabeçalho e Rodapé (Header & Footer)**: `rgba(4, 4, 6, 0.96)` (neutro quase preto puro com `backdrop-filter: blur(20px)` para efeito de vidro escurecido fosco premium).
*   **Bordas e Divisórias (Borders)**: `rgba(255, 255, 255, 0.06)` (borda ultra discreta, translúcida, de alto contraste apenas em tela escura).
*   **Painel Unificado de Pacotes**: `#0d0f17` (cinza-azulado escurecido neutro).
*   **Cards de Pacotinhos Fechados**: `rgba(255, 255, 255, 0.02)` com hover ativo em `rgba(255, 255, 255, 0.04)`.

---

## 2. Tipografia Display & Leitura

*   **Títulos & Botões Gerais**: FWC Normal (`FWC` Normal Black para títulos `h2` e Normal Regular para botões).
*   **Aba de Navegação Inferior**: FWC Condensed Light (`FWC Condensed Light` com peso `300`).
*   **Contador do Progresso Numérico**: FWC Semi Expanded Black (`FWC Semi Expanded Black` com peso `900` para destaque numérico de figurinhas obtidas).
*   **Fonte de Leitura & Corpo**: `Fixture` (Condensed Bold / Regular) — utilizada em todo o corpo do texto de leitura, slot de figurinhas e textos secundários de instruções.

---

## 3. Botões e Ações Temáticas

*   **Botão Dourado (Brasões)**: Gradiente dourado metálico com texto em marrom-escuro (`linear-gradient(135deg, #f9db76, #bd7e1f)` / `#1d1405`).
*   **Botão Prateado (Jogadores)**: Gradiente cinza metálico com texto em cinza-escuro (`linear-gradient(135deg, #e2e8f0, #94a3b8)` / `#0f172a`).
*   **Botão Compacto de Pacotes**: `min-height: 32px; font-size: 0.76rem; border-radius: var(--radius-sm);` — ideal para exibição lado a lado (2 colunas) no mobile vertical.

---

## 4. Efeitos Visuais Premium

*   **Efeito 3D Drag de Cards**: Rotação e inclinação espacial real em graus 3D controlados por ponteiro do mouse ou toque físico no celular.
*   **Luz Holográfica Reativa**: Um gradiente radial branco de opacidade reativa segue a inclinação em tempo real, gerando a sensação física de reflexo de papel laminado.
*   **Cantos Retos do Álbum (0 Corner Radius)**: Álbum digital no modo `'double'` renderizado com cantos vivos (`border-radius: 0`) para visual de revista moderna e minimalista.
