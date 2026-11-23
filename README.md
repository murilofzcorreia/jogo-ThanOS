# ThanOS — Jogo Didático de Sistemas Operacionais

Créditos originais: Murilo Fuzi Correia e Álvaro de Freitas Grotto (Sistemas Operacionais · FCT/UNESP).

## Versão Google Apresentações (atual)

O jogo sai em três apresentações, todas montadas só com links entre slides, no mesmo esquema do `TrabalhoSO.pptx` de exemplo:

| Arquivo | Versão | O que tem |
|---|---|---|
| **`ThanOS_SO1.pptx`** | Apresentação SO 1 (156 slides) | Abertura, as joias do Poder, do Tempo e do Espaço com as 25 etapas e o slide "SO 1 concluído". Não tem estalo, que precisa das seis joias. |
| **`ThanOS_SO2.pptx`** | Apresentação SO 2 (20 slides) | Começa com 3 joias já na Manopla e uma conversa de recapitulação. Depois vêm as joias da Realidade, da Alma e da Mente (prévia e coleta demonstrativa), o estalo, o epílogo e a conclusão. |
| **`ThanOS_Completo.pptx`** | Jogo completo (167 slides) | Tudo, do começo ao estalo. |

O texto completo do jogo, para revisão do professor, está em **`ROTEIRO.md`**.

### A história

Titã, o planeta de Thanos, morreu porque os recursos acabaram, e Thanos concluiu que a saída era eliminar metade de todos. Um sistema operacional enfrenta o mesmo dilema (CPU, memória e disco finitos) e resolve compartilhando.

No jogo, a Manopla forjada por Eitri é o computador FCTarc13. O jogador é Thanos montando o FCTos01, o sistema operacional sem o qual a Manopla não aguenta as joias.

Cada ala tem um mentor que apresenta os desafios:
- Poder: Eitri, em Nidavellir
- Tempo: Wong e Doutor Estranho, em Kamar-Taj e Titã
- Espaço: Loki e Heimdall, na nave asgardiana e na Bifrost

A abertura de cada ala cita o Ancião do Universo que guardava a joia nos quadrinhos (*The Thanos Quest*, 1990). As joias de SO 2 trazem um gancho para *Ultimato*.

### Como abrir no Google Apresentações

1. Suba o `.pptx` no Google Drive.
2. Clique com o botão direito no arquivo → **Abrir com** → **Apresentações Google**. Isso cria uma cópia editável no formato do Google.
3. Clique em **Apresentar** e jogue clicando nas cartas e nos botões.

As fontes Young Serif e Archivo existem no Google Fonts, então o Google mostra o visual original sem instalar nada. No PowerPoint ou no LibreOffice, instale as duas antes (pasta `visuais/fontes/`).

### Como se joga

- **Capa → conversa de abertura → Salão.**
  - A conversa tem 8 falas curtas, uma por slide: Eitri entrega a Manopla a Thanos e explica a história e como se joga. Quem fala fica em destaque.
  - "Pular conversa" vai direto ao Salão.
  - O Eitri e os mentores (Doutor Estranho, Wong, Loki, Heimdall e Fauce de Ébano) são pixel art original no estilo do sprite do Thanos, desenhados por `tools/gerar_personagens.mjs`.
- **Salão:** mostra a Manopla e os 6 altares. Só o altar aceso tem link, e a ordem é Poder → Tempo → Espaço → Realidade → Alma → Mente.
- **Joias de SO 1 (Poder, Tempo e Espaço):**
  - Ao clicar no altar aceso, uma **cena de chegada** de 3 falas mostra Thanos chegando à ala: Fauce de Ébano e Eitri em Nidavellir, Wong e Doutor Estranho em Kamar-Taj, Loki e Heimdall na nave asgardiana. "Pular cena" vai direto à abertura da ala.
  - Depois vem a abertura da ala e as etapas, 25 no total. Cada etapa traz o retrato e a fala do mentor, 4 alternativas (A–D) no mundo da história, com o termo técnico, e o esquema da bancada FCTarc13.
  - Escolha certa: abre o slide **Encaixe confirmado**, com o feedback, a nota de engenharia e o esquema aceso.
  - Escolha errada: abre o slide **Configuração rejeitada**, com a explicação daquela alternativa, e o botão **Tentar de novo** volta para a mesma etapa.
- **Joias de SO 2 (Realidade, Alma e Mente):** mostram uma prévia dos tópicos, o Ancião dos quadrinhos, o gancho de *Ultimato* e a coleta demonstrativa.
- **Fim:**
  - No jogo completo e no SO 2, com as 6 joias vêm **Dar o estalo**, o **Epílogo** ("Titã não precisava cair") e a conclusão.
  - No SO 1, o Salão com 3 joias mostra **Concluir o SO 1**, que leva ao slide "SO 1 concluído".
  - O **Mapa das joias** tem atalhos para as alas da versão aberta. As alas da outra apresentação aparecem apagadas e sem link.
- **Ao apresentar:**
  - Clicar no fundo não avança, porque todo objeto tem link para o próprio slide.
  - As setas do teclado avançam pela ordem física, que é o caminho certo. Os slides de erro e os créditos ficam no fim, no apêndice.
  - As notas do apresentador de cada etapa trazem a resposta e a nota de engenharia.

### Limitações do Google Apresentações

- Ele não importa sons nem transições do `.pptx`. Se quiser transição, use **Slide → Transição → Aplicar a todos os slides**. Os sons de `visuais/audio/` podem ser inseridos à mão pelo Drive.
- A pixel art pode ficar um pouco suavizada, porque o Google redimensiona as imagens com filtro.

### Como regenerar

Os textos vêm de dois arquivos:
- `tools/curriculo.mjs`, com o conteúdo de SO: o que é certo ou errado, os feedbacks e as notas de engenharia. É uma cópia sem alteração de `so1_curriculum.gd` e `stages.json` do projeto em Godot.
- `tools/roteiro.mjs`, com a história: a conversa de abertura, as cenas de chegada, as falas dos mentores, as alternativas no mundo da história, as aberturas das alas, os Anciões e o epílogo. Cada alternativa usa o mesmo `id` de `curriculo.mjs`.

`tools/dados.mjs` junta os dois. Para mudar algum texto, edite `roteiro.mjs` e regenere com Node.js 24:

```powershell
cd tools; npm install; node gerar_slides.mjs; node exportar_roteiro.mjs; node validar_slides.mjs
```

- `gerar_slides.mjs` gera as três apresentações e o `mapa_slides.json`, que diz qual slide é qual em cada uma. Com uma pasta como argumento (`node gerar_slides.mjs <pasta>`), grava as três lá, o que ajuda quando algum `.pptx` está aberto no PowerPoint.
- `exportar_roteiro.mjs` gera o `ROTEIRO.md`, com as mesmas letras dos slides.
- `gerar_personagens.mjs` redesenha os sprites e retratos dos personagens em `visuais/prontos_libreoffice/personagens/`. Só precisa rodar se mudar algum desenho.
- `validar_slides.mjs` abre as três apresentações e confere, em cada uma:
  - todo link aponta para um slide que existe
  - todo objeto tem link
  - não há slide sem saída
  - todos os slides podem ser alcançados a partir da capa
  - a conversa de abertura da versão vem logo depois da capa, e cada fala tem saída para o Salão
  - o altar aceso abre a cena de chegada, que termina (ou pula) na abertura da ala
  - as etapas da versão têm 1 carta certa e 3 erradas que voltam à etapa, com o retrato, a fala do mentor e as 4 alternativas da história
  - o caminho certo passa pelas joias e salões da versão e termina no lugar certo: "SO 1 concluído" no SO 1, epílogo e conclusão nas outras
  - o Mapa das joias só leva às alas da versão
  - as falas e alternativas ficam dentro do limite de tamanho

---

## Versão LibreOffice Calc (anterior)

Versão em **LibreOffice Calc** (`.ods`) com os mesmos visuais, paleta, fontes e currículo da bancada **FCTarc13 / FCTos01** (sem macros e sem quiz/`?`).

### Como abrir e jogar

1. **Fontes (opcional, recomendado):** antes de abrir a planilha, instale as duas fontes SIL OFL em `visuais/fontes/` (`YoungSerif-Regular.ttf` e `Archivo-Variable.ttf` — clique com o botão direito → *Instalar para todos os usuários*) para preservar a tipografia idêntica à versão original.
2. **Abrir o jogo:** dê duplo clique em **`ThanOS_SO1_Calc.ods`** para abrir no **LibreOffice Calc**.
3. **Sem bloqueio de segurança:** toda a interatividade usa apenas fórmulas nativas OpenFormula, listas suspensas (`Validade de Dados`), hiperlinks internos e formatação condicional — **zero macros**.
4. **Controles na planilha:**
   - Clique (ou `Ctrl + Clique`, conforme a configuração do seu Calc) nos botões dourados para navegar entre o `SALAO`, as 6 Joias, o `ESTALO` e o `GUIA`.
   - Nas bancadas (`J1_PODER`, `J2_TEMPO`, `J3_ESPACO`), clique nas células douradas destacadas e selecione a configuração na lista suspensa (`▼`).
   - Observe os esquemas arquiteturais ao vivo (placa-mãe `FCTarc13`, módulos do Kernel, trilha de boot, barra de 12 MB da RAM e as 3 matrizes de disco `B00–B15`) acenderem automaticamente.


### Estrutura das 9 abas (`ThanOS_SO1_Calc.ods`)

| Aba | Módulo | Conteúdo |
|---|---|---|
| `SALAO` | Hub Central | Logotipo ThanOS, HUD da Manopla com barra de progresso (`X / 25`), LEDs das 6 joias, monumento central e cartões de acesso às alas Oeste (SO 1) e Leste (SO 2). |
| `J1_PODER` | SO 1 · Etapas 01–07 | Requisitos do projeto, 4 recursos de hardware, braço robótico como dispositivo periférico, justificativa, 2 funções do SO, ponto de partida e os 4 componentes do Kernel (`FCTarc13` ao vivo). |
| `J2_TEMPO` | SO 1 · Etapas 08–16 | Persistência em HD/SSD, sequência de boot do BIOS na ROM, passagem para RAM e `IC` / `Register of Scheduler`, escalonamento por turnos, multiprogramação e gerenciamento de processos. |
| `J3_ESPACO` | SO 1 · Etapas 17–25 | Busca na RAM, particionamento lógico fixo e variável em tamanhos diferentes (barra dinâmica de 12 MB), divisão do HD em blocos e matrizes interativas `B00–B15` de Alocação Contígua, Lista Encadeada e Nó-i. |
| `J4_REALIDADE` | SO 2 · Etapas 26–33 | Estrutura reservada para o próximo semestre (Contexto, Tabela de Processos, Mutex e Syscalls), com opção demonstrativa para testar o Estalo Final. |
| `J5_ALMA` | SO 2 · Etapas 34–40 | Estrutura reservada para o próximo semestre (Interrupções, ISR, Vetores, Drivers, Atomicidade e Ciclo de Vida), com opção demonstrativa. |
| `J6_MENTE` | SO 2 · Etapas 43–46 | Estrutura reservada para o próximo semestre (1 CPU física, Prioridades, Modo Núcleo/Usuário e MMU), com opção demonstrativa. |
| `ESTALO` | Conclusão | Conferência das 6 joias e gatilho `DAR O ESTALO` (liberado somente com 6/6 joias encaixadas), exibindo a síntese final do `FCTos01`. |
| `GUIA` | Manual e Reset | Instruções de uso, lista exata das células de entrada para reiniciar uma partida com `Delete` e mapa curricular completo. |


### Como regenerar ou expandir para SO 2

Os scripts em `tools/` permitem regenerar o `.ods` programaticamente com Node.js (v24+ sem dependências externas):

- `node tools/gerar_calc.mjs` — gera `ThanOS_SO1_Calc.ods` a partir das imagens em `visuais/prontos_libreoffice/`.
- `node tools/validar_ods.mjs` — valida o pacote ZIP/ODF (`mimetype`, XMLs, manifest, estilos, margens/mesclagens, zero sobreposição de imagens com texto, zero `?` e simulação completa das 25 etapas + Estalo).
