# ThanOS — Roteiro do jogo

Texto completo da versão em slides, na ordem em que aparece no jogo. Gerado por `tools/exportar_roteiro.mjs` a partir de `tools/roteiro.mjs` (história) e `tools/curriculo.mjs` (conteúdo de SO). Para mudar algum texto, edite `roteiro.mjs` e gere de novo.

As letras das alternativas são as mesmas dos slides. **✓** marca a alternativa certa. Em cada uma, "Retorno" é a explicação que a bancada mostra ao jogador.

O jogo sai em três apresentações:

- `ThanOS_SO1.pptx`: Apresentação SO 1. Abertura, joias do Poder, do Tempo e do Espaço (as 25 etapas) e o slide "SO 1 concluído".
- `ThanOS_SO2.pptx`: Apresentação SO 2. Abertura própria, joias da Realidade, da Alma e da Mente, estalo, epílogo e conclusão.
- `ThanOS_Completo.pptx`: o jogo inteiro.

## Premissa

Titã, o planeta de Thanos, morreu porque os recursos acabaram. Thanos concluiu que a única saída era eliminar metade de todos: o estalo.

É o mesmo dilema de um sistema operacional: CPU, memória e disco são finitos e muitos programas disputam esses recursos. Um SO bem feito resolve isso compartilhando, com turnos, partições e escalonamento.

No jogo, a Manopla do Infinito forjada por Eitri é o computador FCTarc13, e o sistema operacional que vai controlá-la é o FCTos01. Sem ele, a energia das joias queima o braço de quem usa a Manopla.

## Abertura: conversa entre Eitri e Thanos

Logo depois da capa, Eitri entrega a Manopla a Thanos e explica o jogo, uma fala por slide. O botão "Pular conversa" vai direto ao Salão.

**Eitri:** Então você veio buscar a Manopla, Thanos. Eu a forjei em Nidavellir para segurar as seis Joias do Infinito de uma vez.

**Thanos:** Titã caiu porque os recursos acabaram. Com as seis joias, eu não deixo o universo ter o mesmo fim.

**Eitri:** Só que Manopla nenhuma aguenta isso sozinha. Sem um sistema operacional, a energia de uma única joia já queima o seu braço.

**Thanos:** Um sistema operacional. E o que ele faz pela Manopla?

**Eitri:** Ele gerencia os recursos: divide a energia, organiza a memória e dá a vez a cada programa. Chama-se FCTos01, e a Manopla é o computador dele, a FCTarc13.

**Eitri:** Cada joia é uma ala do Salão. Lá, um mentor te dá um desafio por etapa. Escolha certa, e uma peça do FCTos01 é instalada na Manopla.

**Thanos:** E se eu errar?

**Eitri:** A bancada mostra o motivo e você tenta de novo. Nenhuma joia se perde. Comece pelo altar aceso: a Joia do Poder espera por você.

### Abertura da apresentação SO 2

Na apresentação SO 2, a conversa de abertura é outra: Thanos volta com as três joias de SO 1 já na Manopla.

**Eitri:** Você voltou, Thanos. Poder, Tempo e Espaço já estão na Manopla: o FCTos01 tem hardware, núcleo, partida, escalonador e memória organizada.

**Thanos:** Faltam três joias: Realidade, Alma e Mente.

**Eitri:** Elas guardam a próxima parte do sistema: contexto e tabela de processos, interrupções e drivers, modo núcleo e proteção de memória.

**Eitri:** Por enquanto, cada ala mostra o que vem no SO 2 e deixa você coletar a joia em modo demonstrativo. Siga o altar aceso.

## Joia do Poder — Nidavellir (SO 1 · Etapas 01 a 07)

**Cena de chegada (Nidavellir)**, logo depois de clicar no altar aceso:

> **Fauce de Ébano:** Senhor, chegamos a Nidavellir. A Ordem Negra aguarda suas ordens enquanto o anão acende a forja.
>
> **Eitri:** Primeiro o hardware, depois o núcleo. Sem isso, a Joia do Poder queima a Manopla na primeira faísca.
>
> **Thanos:** Então forje com cuidado, Eitri. Recurso mal administrado foi o que destruiu Titã.

**Mentor:** Eitri

Na forja dos anões, ao redor de uma estrela de nêutrons, Eitri foi obrigado a forjar a Manopla que vai segurar as seis joias. Mas Manopla sem sistema operacional é só metal: a energia de uma única joia já queimaria o braço de quem a usa. Nesta ala você define o hardware da FCTarc13 e o núcleo do FCTos01.

> **Nos quadrinhos (o Campeão):** Em The Thanos Quest (1990), o Campeão do Universo guardava a Gema do Poder e achava que ela estava quebrada. Hardware sem sistema operacional também parece quebrado: tem poder, mas ninguém consegue usá-lo.

### Etapa 01 · Requisito Prévio do Projeto

**Eitri:** Você quer uma Manopla que segure seis joias. Antes de acender a forja, preciso de um levantamento. O que precisamos conhecer antes de começar o projeto do FCTos01?

- **A)** Só quem forjou a Manopla (fabricante do sistema)
  - Enunciado técnico: Catalogar apenas o fabricante do sistema de computação
  - Retorno: Insuficiente. O fabricante comercial não informa quais recursos de hardware ou cargas de programa o SO precisa gerenciar.
- **B)** Só a velocidade máxima que a Manopla alcança (velocidade do sistema)
  - Enunciado técnico: Registrar somente a velocidade máxima do sistema
  - Retorno: Insuficiente. Clock isolado não descreve memória, dispositivos nem necessidades dos programas de usuário.
- **C) ✓** Os recursos que a Manopla terá e o que os programas vão exigir dela (recursos + programas de usuário)
  - Enunciado técnico: Mapear recursos disponíveis e características dos programas de usuários
  - Retorno: Correto. Conhecer os recursos da FCTarc13 e o perfil dos dois programas do braço robótico define toda a arquitetura do núcleo.
- **D)** Só o nome e o modelo gravados no metal (marca e modelo)
  - Enunciado técnico: Fixar apenas a marca e o modelo do equipamento
  - Retorno: Insuficiente. Rótulos comerciais não substituem o levantamento técnico dos recursos e das aplicações.

**Nota de engenharia:** O projeto do SO começa mapeando o hardware disponível e o comportamento geral dos programas de usuário que vão utilizá-lo.

### Etapa 02 · Os Quatro Recursos de Hardware

**Eitri:** A Manopla precisa de quatro encaixes de hardware para o FCTos01 administrar. Quais são os quatro recursos que eu forjo nela?

- **A) ✓** Processador, RAM, Periféricos e HD ou SSD (os quatro recursos principais)
  - Enunciado técnico: Conectar: Processador, RAM, Periféricos e HD ou SSD
  - Retorno: Barramento energizado. CPU, RAM, Periféricos e armazenamento secundário formam o núcleo de hardware administrado pelo FCTos01.
- **B)** Gabinete, leitor de CD-ROM, porta USB e filtro de linha (estrutura e acessórios)
  - Enunciado técnico: Conectar: Gabinete, unidade de CD-ROM, porta USB e filtro de linha
  - Retorno: Falha de barramento. Gabinete e filtro de linha são estrutura elétrica/mecânica, não os quatro recursos principais de computação.
- **C)** ROM, memória cache, braço robótico e porta USB (componentes de apoio)
  - Enunciado técnico: Conectar: ROM, memória cache, braço robótico e porta USB
  - Retorno: Incompleto. Cache e ROM não substituem RAM, Processador e armazenamento em disco/SSD na visão principal do sistema.
- **D)** CPU, braço robótico, cooler e porta USB (sem memória principal nem disco)
  - Enunciado técnico: Conectar: CPU, braço robótico, cooler e porta USB
  - Retorno: Falha de barramento. Falta a memória principal (RAM) e o armazenamento secundário (HD ou SSD); cooler é apenas refrigeração.

**Nota de engenharia:** Os quatro pilares de hardware gerenciados pelo SO são: Processador (CPU), Memória RAM, Periféricos e HD ou SSD.

### Etapa 03 · Classificação do Braço Robótico

**Eitri:** A Manopla vai ficar presa ao seu braço, fora do núcleo da FCTarc13, recebendo e executando comandos. Na arquitetura de computadores, que tipo de dispositivo ela é?

- **A)** Um dispositivo de auxílio
  - Enunciado técnico: Classificar como Dispositivo de auxílio
  - Retorno: Termo impreciso. O hardware externo acoplado ao barramento de E/S é um dispositivo periférico.
- **B)** Um dispositivo alternativo
  - Enunciado técnico: Classificar como Dispositivo alternativo
  - Retorno: Classificação inválida na Arquitetura de Computadores: dispositivos de E/S externos são periféricos.
- **C)** Um dispositivo alternador
  - Enunciado técnico: Classificar como Dispositivo alternador
  - Retorno: Alternador remete a energia elétrica, não à função computacional do braço robótico.
- **D) ✓** Um dispositivo periférico, controlado por entrada e saída
  - Enunciado técnico: Classificar e ligar como Dispositivo Periférico
  - Retorno: Braço robótico reconhecido. Como atua externamente ao núcleo CPU-memória, ele é classificado como Dispositivo Periférico.

**Nota de engenharia:** Na arquitetura de computadores, o braço robótico é um Dispositivo Periférico controlado via entrada e saída pelo sistema.

### Etapa 04 · Justificativa Técnica do SO

**Eitri:** Os Guardiões só seguraram a Joia do Poder porque dividiram a energia de mãos dadas. Por que a Manopla precisa de um sistema operacional, e não só de joias?

- **A)** Para a Manopla criar programas de usuário sozinha
  - Enunciado técnico: Fazer a FCTarc13 gerar novos programas de usuário automaticamente
  - Retorno: Incorreto. O SO gerencia a execução de programas já desenvolvidos, não os gera sozinho.
- **B) ✓** Para dar impressão de execução paralela e dividir os recursos com ordem, como os Guardiões de mãos dadas
  - Enunciado técnico: Dar impressão de execução paralela e compartilhar recursos de forma organizada
  - Retorno: Diretriz validada. O FCTos01 alterna turnos entre programas e evita conflito pelo processador, memória e braço robótico.
- **C)** Para os programas não dependerem do código VHDL gravado na ROM
  - Enunciado técnico: Impedir que programas dependam do código VHDL da memória ROM
  - Retorno: Incorreto. VHDL descreve o hardware em FPGA; a função do SO é organizar execução e compartilhamento.
- **D)** Para rodar os programas de usuário direto em modo Kernel, com poder total
  - Enunciado técnico: Executar programas de usuários direto em modo Kernel para segurança
  - Retorno: Erro grave de segurança. Programas de usuário em modo Kernel teriam acesso irrestrito e poderiam derrubar o sistema.

**Nota de engenharia:** O SO existe para dar a impressão de execução paralela aos programas de usuário e permitir o compartilhamento organizado dos recursos.

### Etapa 05 · Duas Funções Principais do SO

**Eitri:** Com o FCTos01, você só estala os dedos: a Manopla esconde a complexidade das joias e divide a energia sem queimar seu braço. Quais são as duas funções de todo sistema operacional?

- **A)** Intermediador para braços robóticos e executor isolado
  - Enunciado técnico: Ativar: Intermediador para braços robóticos e executor isolado
  - Retorno: Incorreto. Reduzir o SO a um intermediador robótico ignora o gerenciamento geral do computador.
- **B) ✓** Máquina Virtual (Estendida) e Gerente de Recursos
  - Enunciado técnico: Ativar: Máquina Virtual (Estendida) e Gerente de Recursos
  - Retorno: Camada dupla ativada. O SO abstrai o hardware como Máquina Estendida e arbitra o uso seguro como Gerente de Recursos.
- **C)** Máquina conceitual e gerente de atividades implícitas
  - Enunciado técnico: Ativar: Máquina conceitual e gerente de atividades implícitas
  - Retorno: Terminologia incorreta. Os dois papéis clássicos são Máquina Estendida (Virtual) e Gerente de Recursos.
- **D)** Carregador de programas e manipulador exclusivo de braços
  - Enunciado técnico: Ativar: Carregador de programas e manipulador exclusivo de braços
  - Retorno: Visão restrita. Um SO genérico não se define apenas por manipular braços robóticos.

**Nota de engenharia:** Todo SO atua como Máquina Virtual/Estendida (base simplificada para programação) e Gerente de Recursos (uso ordenado do hardware).

### Etapa 06 · Ponto de Partida da Chefia

**Fauce de Ébano:** Senhor, a Ordem Negra aguarda. Antes de nos mandar à Terra, o senhor precisa decidir por onde começa o núcleo do FCTos01. Qual é a primeira tarefa?

- **A)** Começar montando direto a tabela de processos
  - Enunciado técnico: Começar pela elaboração direta da tabela de processos
  - Retorno: Estrutura de dados vem depois da definição das responsabilidades de cada subsistema do núcleo.
- **B)** Começar pela interface visual com o usuário
  - Enunciado técnico: Começar caracterizando a interface visual com o usuário
  - Retorno: A interface fica na camada mais externa; o núcleo parte da definição funcional dos componentes do SO.
- **C)** Começar pelo diagrama de fluxo de dados da micro-memória
  - Enunciado técnico: Começar pelo diagrama de fluxo de dados sobre a micro-memória
  - Retorno: Etapa prematura. Sem definir os componentes do SO e suas tarefas, não há o que mapear no fluxo de instruções.
- **D) ✓** Definir a tarefa de cada componente principal do SO, como cada filho recebe sua missão
  - Enunciado técnico: Definir as tarefas dos componentes principais do SO
  - Retorno: Marco zero estabelecido. Com o papel de cada componente definido, o restante da arquitetura pode ser detalhado.

**Nota de engenharia:** Antes de desenhar interfaces, tabelas ou fluxos de micro-instruções, a equipe precisa definir as tarefas dos componentes principais do SO.

### Etapa 07 · Os Quatro Componentes do Núcleo

**Eitri:** Fauce de Ébano, Próxima Meia-Noite, Corvus Glaive e Cull Obsidian: cada filho seu cuida de uma frente. O núcleo do FCTos01 também se divide assim. Quantos e quais módulos ele tem?

- **A) ✓** 4 módulos: Escalonador, Gerente de memória, Sistema de arquivos e Software de E/S
  - Retorno: Kernel completo selado! Você concluiu o Bloco 1 de SO 1 e conquistou a Joia do Poder.
- **B)** 4 módulos: Processador, RAM, HD e Braço robótico
  - Retorno: Confusão de camadas. Esses quatro itens são recursos físicos de hardware, não componentes de software do núcleo.
- **C)** 3 módulos: BIOS, Controlador de DMA e Controlador de IRQ
  - Retorno: Erro estrutural. BIOS, DMA e IRQ pertencem a firmware e controladores de hardware, não aos 4 módulos do núcleo.
- **D)** 3 módulos: Inicializador do sistema, Escalonador e Finalizador
  - Retorno: Incompleto. Falta o gerenciamento de memória, de arquivos e de entrada/saída.

**Nota de engenharia:** Todo núcleo de SO se apoia em 4 componentes: Escalonador de processos e threads, Gerente de memória, Sistema de arquivos e Software de E/S.

## Joia do Tempo — Kamar-Taj e Titã (SO 1 · Etapas 08 a 16)

**Cena de chegada (Kamar-Taj)**, logo depois de clicar no altar aceso:

> **Wong:** Kamar-Taj não costuma receber visitas armadas, Thanos. Mas Eitri avisou: a Manopla precisa de um sistema para aguentar as joias.
>
> **Doutor Estranho:** A Joia do Tempo fica no Olho de Agamotto. Antes, você vai aprender onde o FCTos01 se guarda e como ele divide o tempo da CPU.
>
> **Thanos:** Então comecemos. Tempo é o único recurso que nem eu posso desperdiçar.

**Mentor:** Wong e Doutor Estranho

Em Kamar-Taj, Wong guarda a biblioteca dos Mestres das Artes Místicas. Em Titã, Doutor Estranho enfrenta Thanos com o Olho de Agamotto, depois de olhar milhões de futuros. Nesta ala você decide onde o FCTos01 fica guardado, como a Manopla dá a partida e como o processador divide o tempo entre os programas.

> **Nos quadrinhos (o Jardineiro):** O Jardineiro guardava a Gema do Tempo. Thanos fez as plantas dele crescerem sem controle até vencê-lo. Sem escalonador, os processos também disputam a CPU sem controle.

### Etapa 08 · Persistência com Computador Desligado

**Wong:** A Manopla vai ficar desligada na viagem até Titã. O que estiver só na memória de Estranho vai se perder. Onde guardamos o FCTos01 e os dois programas?

- **A)** Na palma da mão de Estranho, onde cabem poucos símbolos (registradores da CPU)
  - Enunciado técnico: Alojar nos registradores da CPU
  - Retorno: Inviável. Registradores são minúsculos e voláteis, zerados ao desligar a máquina.
- **B)** Na memória de Estranho, enquanto ele estiver acordado (RAM)
  - Enunciado técnico: Alojar na memória RAM
  - Retorno: Perda total ao desligar. A RAM é memória volátil e apaga tudo quando a energia é cortada.
- **C) ✓** Na biblioteca de Kamar-Taj, que não esquece nada (SSD ou HD)
  - Enunciado técnico: Alojar no SSD ou HD (armazenamento secundário)
  - Retorno: Chave desligada e dados preservados. SSD e HD são não voláteis e guardam SO e programas sem alimentação elétrica.
- **D)** Nas anotações rápidas do Wong, à mão para consulta (memória cache)
  - Enunciado técnico: Alojar na memória cache
  - Retorno: Perda total ao desligar. A cache é volátil e serve apenas para acelerar acessos durante a execução.

**Nota de engenharia:** Com o sistema sem energia, somente memórias secundárias não voláteis como SSD ou HD preservam o SO e os programas.

### Etapa 09 · Papel da Memória Secundária

**Wong:** Eu guardo os livros desta biblioteca há muito tempo. Explique à equipe por que o FCTos01 e os programas ficam gravados no disco.

- **A)** Só enquanto os programas estão sendo compilados
  - Enunciado técnico: Armazenar somente durante a compilação dos programas
  - Retorno: Incorreto. Executáveis já compilados e o próprio SO continuam no disco após a compilação.
- **B)** Só para os programas conversarem entre si
  - Enunciado técnico: Armazenar somente para interação direta entre os programas
  - Retorno: Incorreto. A função essencial do disco aqui é a guarda permanente mesmo fora de execução.
- **C)** Só enquanto a Manopla estiver ligada
  - Enunciado técnico: Armazenar somente enquanto o computador estiver ligado
  - Retorno: Essa é a característica da RAM (volátil), não do disco rígido.
- **D) ✓** Para guardá-los de forma permanente, prontos sempre que a Manopla religar (armazenamento permanente)
  - Enunciado técnico: Armazenamento permanente do SO e dos programas de usuário
  - Retorno: Confirmado. A persistência permanente garante que o computador possa inicializar o SO sempre que for religado.

**Nota de engenharia:** A memória secundária existe para armazenar o sistema operacional e os programas permanentemente.

### Etapa 10 · Sequência de Boot, BIOS e ROM

**Doutor Estranho:** Energia religada. O ritual do Olho de Agamotto vem de um livro antigo que ninguém reescreve, e os gestos seguem uma ordem fixa. Quem conduz a partida da Manopla, e em que ordem?

- **A)** Chipset da placa-mãe: HD → BUST → Links → Carrega SO → USB
  - Enunciado técnico: Executar via Chipset (Placa-mãe): HD → BUST → Links → Carrega SO → USB
  - Retorno: Sequência inválida. BUST não existe e o responsável pela rotina de inicialização na ROM é o BIOS.
- **B)** Chipset da controladora de HD: Reset → START → Correlaciona → Terminais
  - Enunciado técnico: Executar via Chipset (Controladora HD): Reset → START → Correlaciona → Terminais
  - Retorno: Sequência inválida. O código inicial de boot reside na memória ROM executando o BIOS.
- **C) ✓** BIOS gravado na ROM: Setup → POST → Descompacta → Lê disco → Carrega SO
  - Enunciado técnico: Executar via BIOS (na ROM): Setup → POST → Descompacta → Lê disco → Carrega SO
  - Retorno: Trilha de boot acesa! O BIOS armazenado na ROM concluiu POST e leitura do disco com sucesso.
- **D)** FPGA da placa de boot: Atualiza setup → DUST → Links → Terminais
  - Enunciado técnico: Executar via FPGA (Placa de Boot): Atualiza setup → DUST → Links → Terminais
  - Retorno: Sequência inválida. DUST e links não correspondem ao processo real de POST e carga do SO pelo BIOS.

**Nota de engenharia:** Ao ligar, o BIOS (gravado na memória ROM) verifica o setup, faz o POST, descompacta dados, lê o armazenamento e carrega o SO.

### Etapa 11 · Passagem de Bastão do BIOS

**Doutor Estranho:** Em Titã, eu entrego a Joia do Tempo e saio de cena. O BIOS faz o mesmo: antes de encerrar, passa o controle ao FCTos01. Quais duas tarefas ele cumpre?

- **A)** (1) Fazer o POST e (2) descompactar dados
  - Enunciado técnico: (1) Fazer o POST e (2) Descompactar dados
  - Retorno: Ainda são ações iniciais; falta transferir o núcleo para a RAM e apontar o IC.
- **B) ✓** (1) Copiar o núcleo do HD/SSD para a RAM e (2) gravar o início do Escalonador no IC e no Register of Scheduler
  - Enunciado técnico: (1) Copiar núcleo do HD/SSD para a RAM e (2) Gravar início do Escalonador no IC e Register of Scheduler
  - Retorno: Controle transferido! O Kernel está residente na RAM e o IC aponta para a primeira instrução do Escalonador.
- **C)** (1) Descompactar dados e (2) ler os dispositivos de armazenamento
  - Enunciado técnico: (1) Descompactar dados e (2) Ler dispositivos de armazenamento
  - Retorno: Essas são etapas intermediárias do boot, não as duas ações de entrega final antes do BIOS encerrar.
- **D)** (1) Verificar o setup e (2) executar o POST
  - Enunciado técnico: (1) Verificar setup e (2) Executar o POST
  - Retorno: Setup e POST acontecem logo no início ao ligar o computador, não no encerramento do BIOS.

**Nota de engenharia:** Antes de sair, o BIOS carrega o núcleo do SO do HD/SSD para a RAM e grava o endereço inicial do Escalonador no IC e no Register of Scheduler.

### Etapa 12 · O Que Significa Escalonamento

**Doutor Estranho:** Contra Dormammu, repeti o mesmo instante, uma volta de cada vez, até ele ceder. O Escalonador também divide o tempo em voltas. Que situação do dia a dia explica isso?

- **A) ✓** Turnos de trabalho organizados em uma empresa
  - Retorno: Analogia calibrada. Assim como trabalhadores se revezam por turnos, tarefas se revezam pelo tempo de processamento.
- **B)** Confinamento de gado
  - Retorno: Não traduz a ideia de alternância temporal de uso de um recurso único.
- **C)** Andar em montanha-russa
  - Enunciado técnico: Andar em montanha russa
  - Retorno: Analogia sem relação com divisão organizada de tempo e turnos de execução.
- **D)** Dormir de barriga para cima
  - Retorno: Não representa compartilhamento temporal nem organização em turnos.

**Nota de engenharia:** Escalonamento equivale a organizar turnos de trabalho em uma empresa: dividir o tempo disponível entre tarefas em ordem.

### Etapa 13 · Quem Entra na Fila do Escalonador

**Doutor Estranho:** Em Titã, cada herói ataca na sua vez, inclusive quem comanda o plano. Na CPU da Manopla, quem entra nesse revezamento?

- **A) ✓** O FCTos01 e os programas de usuário: todos são escalonados para usar o processador
  - Enunciado técnico: SO e programas de usuário são escalonados para usar o processador
  - Retorno: Anel de turnos completo! O próprio código do SO e os dois programas de usuário alternam o uso da CPU.
- **B)** Os programas de usuário são antecipados para uso dentro do SO
  - Enunciado técnico: Antecipação dos programas de usuário para uso no SO
  - Retorno: Relação incorreta. O escalonamento reparte o tempo da CPU entre o SO e os programas de usuário.
- **C)** O SO e os programas passam por uma multiplicação escalar
  - Enunciado técnico: Submeter SO e programas a uma multiplicação escalar
  - Retorno: Jogo de palavras sem sentido arquitetural: escalonamento trata de turnos na CPU, não de álgebra vetorial.
- **D)** Os programas de usuário são guardados dentro do código do SO
  - Enunciado técnico: Programas de usuário são alocados dentro do código do SO
  - Retorno: Os programas permanecem separados do SO e disputam turnos no processador com ele.

**Nota de engenharia:** Tanto o sistema operacional quanto os programas de usuário são escalonados para utilizar o processador.

### Etapa 14 · Classificação de Multiprogramação

**Doutor Estranho:** Eu examinei 14.000.605 futuros, alternando de um para outro. A Manopla também mantém vários programas e alterna os turnos entre eles. Como se classifica esse sistema?

- **A)** Sistema Bi-executado
  - Enunciado técnico: Configurar sistema como Bi-executado
  - Retorno: Classificação inexistente na literatura de Sistemas Operacionais.
- **B) ✓** Sistema Multiprogramado
  - Enunciado técnico: Configurar sistema como Multiprogramado
  - Retorno: Modo Multiprogramado ativo. A FCTarc13 mantém múltiplos programas em memória alternando turnos de CPU.
- **C)** Sistema Bi-executável
  - Enunciado técnico: Configurar sistema como Bi-executável
  - Retorno: Termo incorreto. Mesmo com dois programas de usuário na prática, a categoria técnica é Multiprogramado.
- **D)** Sistema Monoprogramado
  - Enunciado técnico: Configurar sistema como Monoprogramado
  - Retorno: Incompatível. Um sistema monoprogramado executaria apenas um programa de usuário do começo ao fim antes de outro.

**Nota de engenharia:** Sistemas capazes de manter e alternar vários programas em execução são classificados como Multiprogramados.

### Etapa 15 · Conceito Cotidiano de Processo

**Doutor Estranho:** O plano em Titã tem etapas e participantes: Mantis acalma Thanos, Homem-Aranha e Homem de Ferro puxam a Manopla. Que exemplo do dia a dia traduz um processo?

- **A)** O movimento das ondas do mar
  - Enunciado técnico: Movimentos ondulatórios do mar
  - Retorno: Analogia física contínua que não evidencia etapas e elementos organizados de trabalho.
- **B)** A força centrípeta
  - Enunciado técnico: Força centrípeta
  - Retorno: Conceito de mecânica clássica sem relação com etapas de execução de software.
- **C) ✓** Um processo de produção numa empresa: um conjunto de etapas e elementos
  - Enunciado técnico: Processo de produção em uma empresa: conjunto de etapas e elementos
  - Retorno: Modelo mental validado. Programa em execução envolve código, dados, contexto e etapas coordenadas até concluir a tarefa.
- **D)** A força centrífuga
  - Enunciado técnico: Força centrífuga
  - Retorno: Conceito físico distante da estrutura de etapas e elementos de um processo computacional.

**Nota de engenharia:** Um processo se compara a um processo de produção em uma empresa: um conjunto de etapas e elementos necessários para gerar um resultado.

### Etapa 16 · Gerenciamento de Processos pelo SO

**Doutor Estranho:** Só um futuro dá certo, e alguém precisa coordenar cada passo dele. Qual é a relação entre o FCTos01 e os processos dos programas de usuário?

- **A)** O SO reconstrói a si mesmo e aos programas
  - Enunciado técnico: Processo de reconstrução do SO e dos programas
  - Retorno: Incorreto. Os programas já existem; o papel do SO é gerenciar seus processos durante a execução.
- **B)** O SO fragmenta a si mesmo e aos programas
  - Enunciado técnico: Processo de fragmentação do SO e dos programas
  - Retorno: Incorreto. O SO não existe para fragmentar programas, e sim para gerenciar sua execução ordenada.
- **C)** O SO faz análise estática dos programas
  - Enunciado técnico: Processo de análise estática dos programas
  - Retorno: Incorreto. A relação central em tempo de operação é o gerenciamento da execução desses programas.
- **D) ✓** O FCTos01 gerencia os processos de execução dos programas de usuário
  - Enunciado técnico: O SO gerencia os processos de execução dos programas de usuário
  - Retorno: Gerenciamento de processos estabilizado! Você concluiu o Bloco 2 de SO 1 e conquistou a Joia do Tempo.

**Nota de engenharia:** O sistema operacional gerencia os processos de execução dos programas de usuário, reunindo atividades e elementos necessários para rodá-los.

## Joia do Espaço — A nave asgardiana e a Bifrost (SO 1 · Etapas 17 a 25)

**Cena de chegada (A nave asgardiana)**, logo depois de clicar no altar aceso:

> **Loki:** Bem-vindo à nave de Asgard. Eu trouxe o Tesseract, mas ele só abre portais para quem sabe onde cada coisa está.
>
> **Heimdall:** Eu vejo todos os endereços dos Nove Reinos. O FCTos01 precisa saber onde mora cada dado: na RAM, nas partições e nos blocos do disco.
>
> **Thanos:** Se o espaço for bem dividido, ninguém precisa ser jogado para fora da nave.

**Mentor:** Loki e Heimdall

Loki carrega o Tesseract, o cubo que abre portais entre quaisquer pontos do universo, na nave dos refugiados de Asgard. Heimdall enxerga todos os endereços dos Nove Reinos. Nesta ala você organiza onde cada coisa mora: a memória RAM, as partições e os blocos do disco.

> **Nos quadrinhos (o Corredor):** O Corredor, o ser mais rápido do universo, guardava a Gema do Espaço. Thanos o envelheceu e depois o rejuvenesceu até virar bebê para tomar a joia. No FCTos01, espaço é endereço: saber onde cada dado está.

### Etapa 17 · Permanência Volátil na RAM

**Loki:** Os refugiados de Asgard só existem a bordo enquanto a nave funciona. Quando você a destruiu, nada sobrou. A RAM da Manopla é assim. O que ela guarda, e por quanto tempo?

- **A)** O SO e os programas, só para compilá-los juntos
  - Enunciado técnico: A RAM armazena ambos apenas para compilá-los todos juntos
  - Retorno: Incorreto. SO e programas já chegam prontos para execução, não para recompilação conjunta na RAM.
- **B)** O SO e os programas, para fazer convolução entre eles
  - Enunciado técnico: A RAM armazena para realizar convolução entre eles
  - Retorno: Incorreto. Convolução é operação matemática/sinais, não a função da memória principal.
- **C) ✓** O SO e os programas, enquanto a Manopla está ligada (memória volátil)
  - Enunciado técnico: A RAM armazena o SO e os programas enquanto o computador está ligado
  - Retorno: Barramento confirmado. A RAM guarda o SO e os programas em execução ativa enquanto há energia no sistema.
- **D)** O SO e os programas, para sempre
  - Enunciado técnico: A RAM armazena o SO e os programas permanentemente
  - Retorno: Erro de arquitetura. A guarda permanente pertence ao HD/SSD; a RAM perde o conteúdo quando desligada.

**Nota de engenharia:** A memória RAM armazena o sistema operacional e os programas de usuário enquanto o computador está ligado.

### Etapa 18 · Busca de Instruções na RAM

**Loki:** Guardado no Cofre de Odin, o Tesseract não serve para nada: só a joia encaixada na Manopla pode ser usada. Por que o FCTos01 e os programas precisam estar na RAM para rodar?

- **A)** Porque é na RAM que o SO e os programas são convolucionados
  - Enunciado técnico: A RAM é onde SO e programas são convolucionados
  - Retorno: Conceito incorreto. A CPU realiza busca de instruções (fetch) a partir da RAM.
- **B)** Porque a RAM guarda tudo mesmo depois de desligar
  - Enunciado técnico: A RAM garante armazenamento permanente após desligar
  - Retorno: Incorreto. A característica permanente é do armazenamento secundário, não da RAM.
- **C)** Porque é na RAM que o SO e os programas são compilados juntos
  - Enunciado técnico: A RAM é onde SO e programas são compilados juntos
  - Retorno: Incorreto. Na execução, a CPU busca instruções já compiladas a partir da memória RAM.
- **D) ✓** Porque a CPU busca as instruções e os dados direto da RAM (busca de instruções)
  - Enunciado técnico: A RAM é a memória a partir da qual o SO e os programas são buscados
  - Retorno: Fluxo de busca ativo! O processador lê instruções da RAM a cada ciclo porque ela é rápida e endereçável pela CPU.

**Nota de engenharia:** A CPU busca diretamente da RAM as instruções e dados do sistema operacional e dos programas de usuário durante a execução.

### Etapa 19 · Organização Lógica da RAM

**Loki:** Na nave asgardiana, cada grupo tem seu compartimento. Na RAM da Manopla, o FCTos01 e os dois programas dividem o mesmo espaço. Como organizar essa memória?

- **A) ✓** Dividir a RAM em regiões, uma para cada um (particionamento)
  - Enunciado técnico: Aplicar Particionamento da memória RAM
  - Retorno: Divisórias lógicas traçadas! O Particionamento separa regiões dedicadas ao SO e a cada programa na RAM.
- **B)** Aplicar acondicionamento
  - Enunciado técnico: Aplicar Acondicionamento
  - Retorno: Termo fora do padrão da disciplina. A técnica correta é Particionamento.
- **C)** Aplicar adicionamento
  - Enunciado técnico: Aplicar Adicionamento
  - Retorno: Não existe particionamento por adicionamento na organização da memória.
- **D)** Aplicar um encaixamento genérico
  - Enunciado técnico: Aplicar Encaixamento genérico
  - Retorno: Termo inadequado. Em Sistemas Operacionais, a divisão organizada da RAM é chamada de Particionamento.

**Nota de engenharia:** A organização da RAM entre SO e programas de usuário é feita por Particionamento.

### Etapa 20 · O Problema dos Tamanhos Diferentes

**Loki:** Na cápsula de Rocket, Thor, Groot e Rocket não cabem em espaços iguais. Na RAM é igual: SO com 4 MB, Programa 1 com 6 MB e Programa 2 com 2 MB. Que regra as partições seguem?

- **A)** Executáveis do mesmo tamanho: partições de tamanhos iguais
  - Enunciado técnico: Códigos executáveis têm tamanhos iguais: particionar em tamanhos iguais
  - Retorno: Falha de alocação. Com partições iguais de 4 MB, o Programa 1 (6 MB) não cabe e o Programa 2 (2 MB) desperdiça metade do bloco.
- **B) ✓** Programas de tamanhos diferentes: partições de tamanhos diferentes
  - Enunciado técnico: Programas têm tamanhos diferentes: particionar em tamanhos diferentes
  - Retorno: Partições ajustadas sob medida! Cada programa recebe o espaço proporcional à sua demanda sem transbordar nem sobrar demais.
- **C)** A memória não pode ser particionada: particionamento existencial
  - Enunciado técnico: Memória não pode ser particionada: particionamento existencial
  - Retorno: Incorreto. A RAM pode e deve ser particionada logicamente pelo SO em faixas de tamanhos distintos.
- **D)** A memória não pode ser particionada: particionamento unilateral
  - Enunciado técnico: Memória não pode ser particionada: particionamento unilateral
  - Retorno: Conceito inválido. O particionamento lógico existe exatamente para acomodar múltiplos programas de tamanhos variados.

**Nota de engenharia:** Como os programas possuem tamanhos diferentes, o particionamento da RAM deve ser feito em tamanhos diferentes.

### Etapa 21 · Quando e Como Particionar a RAM

**Loki:** Algumas cabines da nave foram definidas na partida; o porão foi rearrumado durante a viagem. Quando e de que jeito as partições da RAM podem ser definidas?

- **A)** Somente fixo, definido durante as atividades do SO
  - Enunciado técnico: Somente particionamento lógico fixo durante as atividades do SO
  - Retorno: Incorreto. Se muda durante as atividades do SO, é variável; fixo é definido no início.
- **B)** Somente variável, definido no início das atividades do SO
  - Enunciado técnico: Somente particionamento lógico variável no início das atividades do SO
  - Retorno: Incorreto. O particionamento variável ocorre justamente durante as atividades conforme surgem processos.
- **C)** Fixo, definido durante as atividades do SO, ou variável, definido no início
  - Enunciado técnico: Particionamento lógico fixo (durante o SO) ou variável (no início do SO)
  - Retorno: Inversão temporal! Partições fixas são determinadas no início, enquanto as variáveis se ajustam durante a operação.
- **D) ✓** Fixo, definido no início das atividades do SO, ou variável, ajustado durante elas (tamanhos diferentes)
  - Enunciado técnico: Particionamento lógico fixo (início do SO) ou variável (durante o SO) de tamanhos diferentes
  - Retorno: Controlador de RAM calibrado! Fixo nasce na inicialização; Variável se adapta dinamicamente conforme os programas entram e saem.

**Nota de engenharia:** O particionamento lógico de tamanhos diferentes pode ser Fixo (definido no início das atividades do SO) ou Variável (ajustado durante as atividades do SO).

### Etapa 22 · Divisão do Disco em Blocos

**Heimdall:** Além da RAM, o FCTos01 precisa organizar outra memória para guardar arquivos. Olhe o Tesseract: um cubo feito de partes iguais. Que estrutura você aplica?

- **A) ✓** Dividir o HD em blocos, como as partes do cubo
  - Enunciado técnico: Aplicar divisão do HD em blocos
  - Retorno: Grade de blocos ativada! O HD foi fatiado em blocos numerados (B00 a B15) prontos para receber arquivos.
- **B)** Dividir a memória cache em conjuntos associativos
  - Enunciado técnico: Divisão da memória cache em conjuntos associativos
  - Retorno: Conjuntos associativos são organização de hardware da cache, não armazenamento de arquivos controlado pelo SO.
- **C)** Dividir os registradores em mapas de bits
  - Enunciado técnico: Divisão dos registradores em mapas de bits
  - Retorno: Incorreto. Registradores armazenam palavras de CPU; quem é fatiado em blocos para arquivos é o HD.
- **D)** Dividir a ROM em instâncias
  - Enunciado técnico: Divisão da ROM em instâncias
  - Retorno: Incorreto. A ROM é somente leitura e guarda o BIOS, não arquivos gravados pelo usuário.

**Nota de engenharia:** O armazenamento secundário é organizado pelo sistema de arquivos por meio da divisão do HD em blocos.

### Etapa 23 · Alocação Contígua de Arquivos

**Heimdall:** Na Bifrost, cada trecho vem logo depois do outro: basta saber onde a ponte começa. O arquivo tem blocos lado a lado e o diretório só guarda o 1º. Que alocação é essa?

- **A)** Alocação por Lista Encadeada
  - Enunciado técnico: Identificar como Alocação por Lista Encadeada
  - Retorno: Incorreto. Na lista encadeada os blocos ficam espalhados e cada bloco aponta para o próximo.
- **B)** Nó-i (i-node)
  - Enunciado técnico: Identificar como Nó-i (i-node)
  - Retorno: Incorreto. Nó-i utiliza tabelas de endereços para blocos não sequenciais.
- **C) ✓** Alocação Contígua (blocos lado a lado: B04 → B05 → B06 → B07)
  - Enunciado técnico: Alocar arquivo por Alocação Contígua (blocos adjacentes B04 → B05 → B06 → B07)
  - Retorno: Feixe sequencial fechado! Apenas o endereço inicial B04 basta para localizar todos os 4 blocos contíguos.
- **D)** Lista Encadeada usando Índice
  - Enunciado técnico: Identificar como Lista Encadeada usando Índice
  - Retorno: Incorreto. Quando todos os blocos precisam ficar lado a lado a partir do 1º endereço, trata-se de Alocação Contígua.

**Nota de engenharia:** Na Alocação Contígua, sabendo o endereço do primeiro bloco e a posição na sequência, encontra-se qualquer bloco do arquivo.

### Etapa 24 · Alocação por Lista Encadeada

**Heimdall:** Os portais não ficam lado a lado: cada um mostra o endereço do próximo. Os blocos do arquivo estão espalhados e cada um guarda onde está o seguinte. Que alocação é essa?

- **A)** Nó-i (i-node)
  - Enunciado técnico: Identificar como Nó-i
  - Retorno: Incorreto. No Nó-i os endereços ficam concentrados em tabelas, não embutidos em cada bloco de dados.
- **B) ✓** Alocação por Lista Encadeada (B02 → B09 → B05 → B14)
  - Enunciado técnico: Conectar arquivo por Alocação por Lista Encadeada (B02 → B09 → B05 → B14)
  - Retorno: Cadeia de ponteiros ligada! Mesmo espalhados pelo HD, os blocos formam um caminho contínuo de endereços.
- **C)** Alocação Contígua
  - Enunciado técnico: Identificar como Alocação Contígua
  - Retorno: Incorreto. Alocação contígua exige blocos vizinhos em sequência física.
- **D)** Lista Encadeada usando Índice
  - Enunciado técnico: Identificar como Lista Encadeada usando Índice
  - Retorno: Incorreto. Quando o próprio bloco anterior guarda o ponteiro do próximo, é Lista Encadeada simples.

**Nota de engenharia:** Na Alocação por Lista Encadeada, cada bloco aponta para o endereço do bloco seguinte em uma região específica do bloco anterior.

### Etapa 25 · Alocação por Nó-i (Tabelas de Índices)

**Heimdall:** Eu enxergo todos os endereços dos Nove Reinos e anoto tudo em tabelas. Os blocos ficam livres pelo disco e os endereços vão para tabelas em vários níveis. Que método é esse?

- **A) ✓** Nó-i: tabelas de endereços em níveis (B01, B06, B11, B15)
  - Enunciado técnico: Indexar blocos espalhados via Nó-i (tabelas de endereços em níveis)
  - Retorno: Tabela Nó-i sincronizada! Módulo SO 1 (Etapas 01 a 25) finalizado — você conquistou a Joia do Espaço.
- **B)** Alocação Contígua
  - Enunciado técnico: Identificar como Alocação Contígua
  - Retorno: Incorreto. Alocação contígua não usa tabelas multinível nem aceita blocos espalhados.
- **C)** Lista Encadeada usando Índice
  - Enunciado técnico: Identificar como Lista Encadeada usando Índice
  - Retorno: Incorreto. Tabelas organizadas em diferentes níveis por arquivo caracterizam o Nó-i.
- **D)** Alocação por Lista Encadeada
  - Enunciado técnico: Identificar como Alocação por Lista Encadeada
  - Retorno: Incorreto. Na lista encadeada o endereço fica no bloco anterior, não em tabelas em diferentes níveis.

**Nota de engenharia:** No método Nó-i (i-node), os registros de uma ou mais tabelas multinível armazenam os endereços de todos os blocos do arquivo.

## Joia da Realidade — Lugar Nenhum (SO 2 · prévia e coleta demonstrativa)

**Contexto, Mutex e Chamadas de Sistema do Braço Robótico** (Etapas 26 a 33)

- Etapas 26–28: Contexto nos registradores, salvamento/recuperação ao expirar quantum e Tabela de Processos na RAM.
- Etapas 29–30: Braço robótico como recurso compartilhado com Mutex, evitando monopólio por processos de usuário.
- Etapas 31–33: Controle via Chamada de Sistema (Syscall) por chamada a procedimento ao enviar comandos ao robô e finalizar.

> **Nos quadrinhos (o Colecionador):** O Colecionador trocou a Gema da Realidade pelo Corredor, que ele queria como espécime raro. O catálogo dele, com cada peça numerada e seu estado, lembra a tabela de processos de um SO.

**Em Ultimato (SO 2):** A ilusão de Thanos mostrando Lugar Nenhum como era vira salvar e restaurar o contexto. Os heróis passando a Manopla de mão em mão em Ultimato, um por vez, viram o mutex.

Blocos da prévia: Contexto + Tabela de Processos (RAM) (Etapas 26–28); Mutex + Controle contra Monopólio (Etapas 29–30); Chamada de Sistema (Braço Robótico) (Etapas 31–33).

Aviso no slide: Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Como você está demonstrando a base de SO 1, colete esta joia em modo demonstrativo para completar a Manopla e liberar o Estalo Final.

## Joia da Alma — Vormir (SO 2 · prévia e coleta demonstrativa)

**Interrupções, Vetores, Drivers, Atomicidade e Ciclo de Vida** (Etapas 34 a 40)

- Etapas 34–36: Interrupção (como campainha do telefone), Rotina de Tratamento (ISR) e Vetores de Interrupção.
- Etapas 37–38: Instalação de Driver atuando como Tradutor entre o sistema operacional e o braço robótico.
- Etapas 39–40: Atomicidade do movimento completo do braço e ciclo de vida (Rodando, Bloqueado, Pronto e Concluído).

> **Nos quadrinhos (o Intermediário):** O Intermediário, que vive entre a vida e a morte, guardava a Gema da Alma, e Thanos o enganou com uma falsa aliança. Viver entre estados é o ciclo de vida de um processo.

**Em Ultimato (SO 2):** O pager de Nick Fury chamando a Capitã Marvel vira a interrupção. Thor entendendo "Eu sou Groot" vira o driver tradutor. Os desaparecidos que ficam bloqueados por cinco anos e voltam prontos viram o ciclo de vida.

Blocos da prévia: Interrupções + Vetores + ISR (Etapas 34–36); Driver (Tradutor do Braço Robótico) (Etapas 37–38); Atomicidade + Ciclo de Vida (Etapas 39–40).

Aviso no slide: Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Colete-a em modo demonstrativo para somar as seis joias na Manopla e liberar o Estalo Final.

## Joia da Mente — Wakanda (SO 2 · prévia e coleta demonstrativa)

**Execução em 1 CPU, Prioridades, Modos Protegidos e MMU** (Etapas 43 a 46)

- Etapas 43–44: Impossibilidade de execução física literalmente simultânea na FCTarc e escalonamento Prioritário.
- Etapa 45: Separação entre Modo Núcleo (execução protegida do SO) e Modo Usuário (execução desprotegida).
- Etapa 46: Unidade de Gerência de Memória (MMU) traduzindo e protegendo endereços em tempo de execução.

> **Nos quadrinhos (o Grão-Mestre):** O Grão-Mestre perdeu a Gema da Mente para Thanos num jogo de estratégia. Decidir quem joga primeiro é escalonar por prioridade.

**Em Ultimato (SO 2):** Só quem veste a Manopla executa instruções privilegiadas: é o modo núcleo, e o resto do universo roda em modo usuário. Em Wakanda, proteger Shuri e Visão vem antes de tudo: é a prioridade.

Blocos da prévia: 1 CPU Física + Escalonamento Prioritário (Etapas 43–44); Modo Núcleo (Protegido) vs. Usuário (Etapa 45); MMU (Gerência e Proteção de Memória) (Etapa 46).

Aviso no slide: Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Colete-a em modo demonstrativo para completar a Manopla do Infinito e realizar o Estalo Final.

## Final

**Fim da apresentação SO 1 — SO 1 concluído:** As 25 etapas de SO 1 foram validadas: hardware da FCTarc13, braço robótico periférico, núcleo de 4 módulos, persistência e boot BIOS/ROM → RAM/IC, escalonamento multiprogramado, particionamento lógico da RAM e alocação de disco contígua, encadeada e nó-i.

*A Manopla tem 3 de 6 joias. Realidade, Alma e Mente continuam na apresentação SO 2.*

Na apresentação SO 2 e no jogo completo, o final é este:

**O estalo:** a manopla queimou e o salão virou cinza. O FCTos01 está completo.

**Epílogo — Titã não precisava cair:** Titã morreu porque os recursos acabaram, e Thanos concluiu que a única saída era eliminar metade de todos. Ao montar o FCTos01, você fez o contrário: o escalonador dividiu o tempo da CPU em turnos, as partições acomodaram programas de tamanhos diferentes e o disco organizou cada bloco. Um bom gerente de recursos compartilha em vez de eliminar.

*Continua em SO 2: Ultimato. Contexto, interrupções, mutex e o estalo que traz todos de volta.*

**Conclusão:** Todas as 25 etapas de SO 1 foram validadas (Hardware FCTarc13, Braço Robótico Periférico, Kernel de 4 módulos, Persistência e Boot BIOS/ROM → RAM/IC, Escalonamento Multiprogramado, Particionamento Lógico da RAM e Alocação de Disco Contígua, Encadeada e Nó-i) e as 6 Joias do Infinito selaram o Estalo Final.

## Referências da história

- Filmes: *Guardiões da Galáxia* (2014), *Doutor Estranho* (2016), *Thor: Ragnarok* (2017), *Vingadores: Guerra Infinita* (2018) e *Vingadores: Ultimato* (2019).
- Quadrinhos: *The Thanos Quest* (1990), em que Thanos toma uma gema de cada Ancião do Universo.
- Todo o texto do jogo é autoral. O jogo usa nomes e acontecimentos como homenagem, sem imagens, logotipos ou falas transcritas da Marvel.
