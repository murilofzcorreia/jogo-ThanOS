# Guia Visual e Paleta — ThanOS (LibreOffice)

Assets recuperados do projeto Godot (`C:\Users\User\Documents\GitHub\thanOS`) e preparados para inserção direta no LibreOffice (Impress, Calc, Draw ou Writer).

## Paleta de Cores

### Cenário e Interface
| Papel | Token | Hex | Uso recomendado no LibreOffice |
|---|---|---|---|
| Vazio do espaço | `VAZIO` | `#07060c` | Fundo principal dos slides / tela |
| Piso de pedra de Titã | `ARDOSIA` | `#2b2534` | Área do salão / fundo secundário |
| Pedra (paredes e pedestais) | `NOGUEIRA` / `NOGUEIRA_ESCURA` | `#3d3049` / `#231a2c` | Elementos arquitetônicos e bordas internas |
| Ouro da manopla e destaque | `LATAO` / `LATAO_CLARO` / `LATAO_ESCURO` | `#d9a53f` / `#f7d886` / `#8c6322` | Molduras (2 px), botão selecionado (`#d9a53f`), títulos (`#f7d886`) |
| Superfície dos painéis | `CARTAO` / `CARTAO_SOMBRA` | `#16111e` / `#2a2036` | Caixa de perguntas, menus e cartões de conteúdo |
| Texto principal | `TINTA` | `#f3ead6` | Perguntas, enunciados e botões comuns (contraste 15:1 sobre `CARTAO`) |
| Texto secundário | `TINTA_SUAVE` | `#c8b48a` | Subtítulos, dicas e metadados (contraste 9:1 sobre `CARTAO`) |
| Texto sobre ouro | `SOBRE_OURO` | `#1a1208` | Texto de botão em foco sobre fundo `#d9a53f` (contraste 8:1) |
| Pele de Thanos | `TITA` | `#7a5a9e` | Acentos do personagem |
| Alvo em foco no mundo | `LUZ_FOCO` | `#fffaf0` | Brilho e destaque pontual |

### As Seis Joias do Infinito
| Joia | Cor (Hex) | Lapidação | Módulo | Faixa original |
|---|---|---|---|---|
| Joia do Poder | `#a66bff` | Redonda | SO 1 | Etapas 01 a 07 |
| Joia do Tempo | `#3fd68a` | Navete | SO 1 | Etapas 08 a 16 |
| Joia do Espaço | `#4c8dff` | Quadrada (degraus) | SO 1 | Etapas 17 a 25 |
| Joia da Realidade | `#ff4b4b` | Gota | SO 2 | Etapas 26 a 33 |
| Joia da Alma | `#ff9a3c` | Triângulo | SO 2 | Etapas 34 a 40 |
| Joia da Mente | `#ffd84a` | Losango | SO 2 | Etapas 43 a 46 |

## Tipografia

As fontes originais (licença SIL OFL) estão em `fontes/`:
- **`YoungSerif-Regular.ttf`**: títulos (40–56 pt/px), nomes das joias e estados (26 pt/px), preferencialmente em ouro claro (`#f7d886`).
- **`Archivo-Variable.ttf`**: textos de pergunta/corpo (22 px, peso 500), botões (22 px, peso 640), dados/rótulos (18 px, peso 600) e teclas (18 px, peso 700).

> **Dica no Windows / LibreOffice:** Instale os dois arquivos `.ttf` da pasta `fontes/` (botão direito → *Instalar para todos os usuários*) antes de abrir o arquivo no LibreOffice para que o layout mantenha a identidade original.

## Organização das Pastas

- `prontos_libreoffice/`: imagens já recortadas, coloridas com brilho e ampliadas por *Nearest Neighbor* (sem borrão de pixel art) e com fundo transparente:
  - `logo_thanos.png` (`1131×246`): logotipo principal "THANOS — Um jogo de Sistemas Operacionais".
  - `joias/`: cada joia individual colorida com brilho (`104×104`) e seu contorno tracejado dourado de encaixe pendente (`104×104`).
  - `manopla/`: progressão completa do monumento central (`416×544`, de 0 a 6 joias + versão queimada pós-estalo) e manopla compacta de HUD (`272×224`, vazia e completa).
  - `thanos/`: poses recortadas do personagem (`144×192` — frente parado/passos, costas e lado).
  - `altares/`: vitrines dos altares (`192×256` — adormecido, atento, aceso e vazio) e etiquetas numeradas `01` a `06` (`120×66`).
  - `cenario/`: fundo do salão (`salao_2x.png`), camadas de estrelas, tapete, luminária, parapeito, feixe de luz e poça de luz ampliados.
- `originais/`: spritesheets originais (`assets/art/`) e `icon.svg` sem alteração.
- `telas_referencia/`: capturas de tela reais do protótipo em Godot (menus, hub, painéis de SO 1/SO 2, estalo e conclusão) para guiar a diagramação dos slides/telas.
- `fontes/`: `Archivo-Variable.ttf`, `YoungSerif-Regular.ttf` e licenças `OFL_*.txt`.
- `audio/`: efeitos sonoros em `.wav` (`encaixe.wav`, `estalo.wav`, `joia.wav`, `painel.wav`, `travado.wav`, `ui_move.wav`, `ui_ok.wav`, `ui_voltar.wav`) compatíveis com ações de clique/transição no LibreOffice Impress.
