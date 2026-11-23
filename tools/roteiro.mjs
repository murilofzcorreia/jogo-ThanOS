// Roteiro narrativo do ThanOS (Guerra Infinita + quadrinhos).
//
// Este arquivo só traz a HISTÓRIA: falas dos mentores, rótulos das alternativas
// no mundo da história, aberturas das alas e epílogo. O que é certo ou errado,
// os feedbacks técnicos e as notas de engenharia continuam em curriculo.mjs.
// Cada alternativa usa o mesmo id de curriculo.mjs.
//
// Textos autorais: usam nomes e acontecimentos dos filmes e quadrinhos da Marvel,
// sem transcrever falas e sem imagens.

export const PREMISSA = [
  'Titã, o planeta de Thanos, morreu porque os recursos acabaram. Thanos concluiu que a única saída era eliminar metade de todos: o estalo.',
  'É o mesmo dilema de um sistema operacional: CPU, memória e disco são finitos e muitos programas disputam esses recursos. Um SO bem feito resolve isso compartilhando, com turnos, partições e escalonamento.',
  'No jogo, a Manopla do Infinito forjada por Eitri é o computador FCTarc13, e o sistema operacional que vai controlá-la é o FCTos01. Sem ele, a energia das joias queima o braço de quem usa a Manopla.',
];

// Conversa de abertura (cutscene): Eitri entrega a Manopla a Thanos e explica o jogo.
// Uma fala por slide. Quem fala fica em destaque; o outro fica esmaecido.
export const CONVERSA = [
  { quem: 'Eitri', fala: 'Então você veio buscar a Manopla, Thanos. Eu a forjei em Nidavellir para segurar as seis Joias do Infinito de uma vez.' },
  { quem: 'Thanos', fala: 'Titã caiu porque os recursos acabaram. Com as seis joias, eu não deixo o universo ter o mesmo fim.' },
  { quem: 'Eitri', fala: 'Só que Manopla nenhuma aguenta isso sozinha. Sem um sistema operacional, a energia de uma única joia já queima o seu braço.' },
  { quem: 'Thanos', fala: 'Um sistema operacional. E o que ele faz pela Manopla?' },
  { quem: 'Eitri', fala: 'Ele gerencia os recursos: divide a energia, organiza a memória e dá a vez a cada programa. Chama-se FCTos01, e a Manopla é o computador dele, a FCTarc13.' },
  { quem: 'Eitri', fala: 'Cada joia é uma ala do Salão. Lá, um mentor te dá um desafio por etapa. Escolha certa, e uma peça do FCTos01 é instalada na Manopla.' },
  { quem: 'Thanos', fala: 'E se eu errar?' },
  { quem: 'Eitri', fala: 'A bancada mostra o motivo e você tenta de novo. Nenhuma joia se perde. Comece pelo altar aceso: a Joia do Poder espera por você.' },
];

// Conversa de abertura da apresentação SO 2: Thanos volta com 3 joias na Manopla.
export const CONVERSA_SO2 = [
  { quem: 'Eitri', fala: 'Você voltou, Thanos. Poder, Tempo e Espaço já estão na Manopla: o FCTos01 tem hardware, núcleo, partida, escalonador e memória organizada.' },
  { quem: 'Thanos', fala: 'Faltam três joias: Realidade, Alma e Mente.' },
  { quem: 'Eitri', fala: 'Elas guardam a próxima parte do sistema: contexto e tabela de processos, interrupções e drivers, modo núcleo e proteção de memória.' },
  { quem: 'Eitri', fala: 'Por enquanto, cada ala mostra o que vem no SO 2 e deixa você coletar a joia em modo demonstrativo. Siga o altar aceso.' },
];

// Fim da apresentação SO 1 (no lugar do estalo, que precisa das seis joias)
export const FIM_SO1 = {
  titulo: 'SO 1 concluído',
  texto:
    'As 25 etapas de SO 1 foram validadas: hardware da FCTarc13, braço robótico periférico, núcleo de 4 módulos, persistência e boot BIOS/ROM → RAM/IC, escalonamento multiprogramado, particionamento lógico da RAM e alocação de disco contígua, encadeada e nó-i.',
  gancho: 'A Manopla tem 3 de 6 joias. Realidade, Alma e Mente continuam na apresentação SO 2.',
};

// Cenas de chegada: 3 falas quando Thanos entra numa ala de SO 1 (depois do
// altar aceso no Salão e antes da abertura da ala). `elenco` são os personagens
// que aparecem à direita; Thanos fica sempre à esquerda.
export const CHEGADAS = {
  poder: {
    lugar: 'Nidavellir',
    elenco: ['Fauce de Ébano', 'Eitri'],
    falas: [
      { quem: 'Fauce de Ébano', fala: 'Senhor, chegamos a Nidavellir. A Ordem Negra aguarda suas ordens enquanto o anão acende a forja.' },
      { quem: 'Eitri', fala: 'Primeiro o hardware, depois o núcleo. Sem isso, a Joia do Poder queima a Manopla na primeira faísca.' },
      { quem: 'Thanos', fala: 'Então forje com cuidado, Eitri. Recurso mal administrado foi o que destruiu Titã.' },
    ],
  },
  tempo: {
    lugar: 'Kamar-Taj',
    elenco: ['Wong', 'Doutor Estranho'],
    falas: [
      { quem: 'Wong', fala: 'Kamar-Taj não costuma receber visitas armadas, Thanos. Mas Eitri avisou: a Manopla precisa de um sistema para aguentar as joias.' },
      { quem: 'Doutor Estranho', fala: 'A Joia do Tempo fica no Olho de Agamotto. Antes, você vai aprender onde o FCTos01 se guarda e como ele divide o tempo da CPU.' },
      { quem: 'Thanos', fala: 'Então comecemos. Tempo é o único recurso que nem eu posso desperdiçar.' },
    ],
  },
  espaco: {
    lugar: 'A nave asgardiana',
    elenco: ['Loki', 'Heimdall'],
    falas: [
      { quem: 'Loki', fala: 'Bem-vindo à nave de Asgard. Eu trouxe o Tesseract, mas ele só abre portais para quem sabe onde cada coisa está.' },
      { quem: 'Heimdall', fala: 'Eu vejo todos os endereços dos Nove Reinos. O FCTos01 precisa saber onde mora cada dado: na RAM, nas partições e nos blocos do disco.' },
      { quem: 'Thanos', fala: 'Se o espaço for bem dividido, ninguém precisa ser jogado para fora da nave.' },
    ],
  },
};

// Aberturas das alas. As de SO 2 trazem o gancho de Ultimato.
export const ALAS = {
  poder: {
    lugar: 'Nidavellir',
    mentor: 'Eitri',
    abertura:
      'Na forja dos anões, ao redor de uma estrela de nêutrons, Eitri foi obrigado a forjar a Manopla que vai segurar as seis joias. Mas Manopla sem sistema operacional é só metal: a energia de uma única joia já queimaria o braço de quem a usa. Nesta ala você define o hardware da FCTarc13 e o núcleo do FCTos01.',
    anciao: {
      nome: 'o Campeão',
      texto:
        'Em The Thanos Quest (1990), o Campeão do Universo guardava a Gema do Poder e achava que ela estava quebrada. Hardware sem sistema operacional também parece quebrado: tem poder, mas ninguém consegue usá-lo.',
    },
  },
  tempo: {
    lugar: 'Kamar-Taj e Titã',
    mentor: 'Wong e Doutor Estranho',
    abertura:
      'Em Kamar-Taj, Wong guarda a biblioteca dos Mestres das Artes Místicas. Em Titã, Doutor Estranho enfrenta Thanos com o Olho de Agamotto, depois de olhar milhões de futuros. Nesta ala você decide onde o FCTos01 fica guardado, como a Manopla dá a partida e como o processador divide o tempo entre os programas.',
    anciao: {
      nome: 'o Jardineiro',
      texto:
        'O Jardineiro guardava a Gema do Tempo. Thanos fez as plantas dele crescerem sem controle até vencê-lo. Sem escalonador, os processos também disputam a CPU sem controle.',
    },
  },
  espaco: {
    lugar: 'A nave asgardiana e a Bifrost',
    mentor: 'Loki e Heimdall',
    abertura:
      'Loki carrega o Tesseract, o cubo que abre portais entre quaisquer pontos do universo, na nave dos refugiados de Asgard. Heimdall enxerga todos os endereços dos Nove Reinos. Nesta ala você organiza onde cada coisa mora: a memória RAM, as partições e os blocos do disco.',
    anciao: {
      nome: 'o Corredor',
      texto:
        'O Corredor, o ser mais rápido do universo, guardava a Gema do Espaço. Thanos o envelheceu e depois o rejuvenesceu até virar bebê para tomar a joia. No FCTos01, espaço é endereço: saber onde cada dado está.',
    },
  },
  realidade: {
    lugar: 'Lugar Nenhum',
    anciao: {
      nome: 'o Colecionador',
      texto:
        'O Colecionador trocou a Gema da Realidade pelo Corredor, que ele queria como espécime raro. O catálogo dele, com cada peça numerada e seu estado, lembra a tabela de processos de um SO.',
    },
    ultimato:
      'A ilusão de Thanos mostrando Lugar Nenhum como era vira salvar e restaurar o contexto. Os heróis passando a Manopla de mão em mão em Ultimato, um por vez, viram o mutex.',
  },
  alma: {
    lugar: 'Vormir',
    anciao: {
      nome: 'o Intermediário',
      texto:
        'O Intermediário, que vive entre a vida e a morte, guardava a Gema da Alma, e Thanos o enganou com uma falsa aliança. Viver entre estados é o ciclo de vida de um processo.',
    },
    ultimato:
      'O pager de Nick Fury chamando a Capitã Marvel vira a interrupção. Thor entendendo "Eu sou Groot" vira o driver tradutor. Os desaparecidos que ficam bloqueados por cinco anos e voltam prontos viram o ciclo de vida.',
  },
  mente: {
    lugar: 'Wakanda',
    anciao: {
      nome: 'o Grão-Mestre',
      texto:
        'O Grão-Mestre perdeu a Gema da Mente para Thanos num jogo de estratégia. Decidir quem joga primeiro é escalonar por prioridade.',
    },
    ultimato:
      'Só quem veste a Manopla executa instruções privilegiadas: é o modo núcleo, e o resto do universo roda em modo usuário. Em Wakanda, proteger Shuri e Visão vem antes de tudo: é a prioridade.',
  },
};

// Etapas de SO 1: quem fala, a fala (cena + desafio) e o rótulo de cada alternativa
// no mundo da história, pelo id de curriculo.mjs.
export const ETAPAS = {
  1: {
    mentor: 'Eitri',
    fala: 'Você quer uma Manopla que segure seis joias. Antes de acender a forja, preciso de um levantamento. O que precisamos conhecer antes de começar o projeto do FCTos01?',
    opcoes: {
      recursos_e_programas: 'Os recursos que a Manopla terá e o que os programas vão exigir dela (recursos + programas de usuário)',
      fabricante: 'Só quem forjou a Manopla (fabricante do sistema)',
      velocidade: 'Só a velocidade máxima que a Manopla alcança (velocidade do sistema)',
      marca_modelo: 'Só o nome e o modelo gravados no metal (marca e modelo)',
    },
  },
  2: {
    mentor: 'Eitri',
    fala: 'A Manopla precisa de quatro encaixes de hardware para o FCTos01 administrar. Quais são os quatro recursos que eu forjo nela?',
    opcoes: {
      hw_core_4: 'Processador, RAM, Periféricos e HD ou SSD (os quatro recursos principais)',
      hw_gabinete: 'Gabinete, leitor de CD-ROM, porta USB e filtro de linha (estrutura e acessórios)',
      hw_rom_cache: 'ROM, memória cache, braço robótico e porta USB (componentes de apoio)',
      hw_cooler: 'CPU, braço robótico, cooler e porta USB (sem memória principal nem disco)',
    },
  },
  3: {
    mentor: 'Eitri',
    fala: 'A Manopla vai ficar presa ao seu braço, fora do núcleo da FCTarc13, recebendo e executando comandos. Na arquitetura de computadores, que tipo de dispositivo ela é?',
    opcoes: {
      periferico: 'Um dispositivo periférico, controlado por entrada e saída',
      alternativo: 'Um dispositivo alternativo',
      auxilio: 'Um dispositivo de auxílio',
      alternador: 'Um dispositivo alternador',
    },
  },
  4: {
    mentor: 'Eitri',
    fala: 'Os Guardiões só seguraram a Joia do Poder porque dividiram a energia de mãos dadas. Por que a Manopla precisa de um sistema operacional, e não só de joias?',
    opcoes: {
      paralelo_compartilhado: 'Para dar impressão de execução paralela e dividir os recursos com ordem, como os Guardiões de mãos dadas',
      modo_kernel_usuario: 'Para rodar os programas de usuário direto em modo Kernel, com poder total',
      vhdl_rom: 'Para os programas não dependerem do código VHDL gravado na ROM',
      gerar_programas: 'Para a Manopla criar programas de usuário sozinha',
    },
  },
  5: {
    mentor: 'Eitri',
    fala: 'Com o FCTos01, você só estala os dedos: a Manopla esconde a complexidade das joias e divide a energia sem queimar seu braço. Quais são as duas funções de todo sistema operacional?',
    opcoes: {
      funcoes_duplas: 'Máquina Virtual (Estendida) e Gerente de Recursos',
      carregador_manipulador: 'Carregador de programas e manipulador exclusivo de braços',
      maquina_conceitual: 'Máquina conceitual e gerente de atividades implícitas',
      intermediador_executor: 'Intermediador para braços robóticos e executor isolado',
    },
  },
  6: {
    mentor: 'Fauce de Ébano',
    fala: 'Senhor, a Ordem Negra aguarda. Antes de nos mandar à Terra, o senhor precisa decidir por onde começa o núcleo do FCTos01. Qual é a primeira tarefa?',
    opcoes: {
      definir_tarefas_componentes: 'Definir a tarefa de cada componente principal do SO, como cada filho recebe sua missão',
      diagrama_micro_memoria: 'Começar pelo diagrama de fluxo de dados da micro-memória',
      tabela_processos: 'Começar montando direto a tabela de processos',
      interface_usuario: 'Começar pela interface visual com o usuário',
    },
  },
  7: {
    mentor: 'Eitri',
    fala: 'Fauce de Ébano, Próxima Meia-Noite, Corvus Glaive e Cull Obsidian: cada filho seu cuida de uma frente. O núcleo do FCTos01 também se divide assim. Quantos e quais módulos ele tem?',
    opcoes: {
      kernel_4_modulos: '4 módulos: Escalonador, Gerente de memória, Sistema de arquivos e Software de E/S',
      kernel_3_bios: '3 módulos: BIOS, Controlador de DMA e Controlador de IRQ',
      kernel_3_init: '3 módulos: Inicializador do sistema, Escalonador e Finalizador',
      kernel_4_hw: '4 módulos: Processador, RAM, HD e Braço robótico',
    },
  },
  8: {
    mentor: 'Wong',
    fala: 'A Manopla vai ficar desligada na viagem até Titã. O que estiver só na memória de Estranho vai se perder. Onde guardamos o FCTos01 e os dois programas?',
    opcoes: {
      ssd_hd: 'Na biblioteca de Kamar-Taj, que não esquece nada (SSD ou HD)',
      ram: 'Na memória de Estranho, enquanto ele estiver acordado (RAM)',
      cache: 'Nas anotações rápidas do Wong, à mão para consulta (memória cache)',
      registradores: 'Na palma da mão de Estranho, onde cabem poucos símbolos (registradores da CPU)',
    },
  },
  9: {
    mentor: 'Wong',
    fala: 'Eu guardo os livros desta biblioteca há muito tempo. Explique à equipe por que o FCTos01 e os programas ficam gravados no disco.',
    opcoes: {
      permanente: 'Para guardá-los de forma permanente, prontos sempre que a Manopla religar (armazenamento permanente)',
      somente_compilacao: 'Só enquanto os programas estão sendo compilados',
      somente_interacao: 'Só para os programas conversarem entre si',
      somente_ligado: 'Só enquanto a Manopla estiver ligada',
    },
  },
  10: {
    mentor: 'Doutor Estranho',
    fala: 'Energia religada. O ritual do Olho de Agamotto vem de um livro antigo que ninguém reescreve, e os gestos seguem uma ordem fixa. Quem conduz a partida da Manopla, e em que ordem?',
    opcoes: {
      boot_bios_rom: 'BIOS gravado na ROM: Setup → POST → Descompacta → Lê disco → Carrega SO',
      boot_chipset_placa: 'Chipset da placa-mãe: HD → BUST → Links → Carrega SO → USB',
      boot_fpga: 'FPGA da placa de boot: Atualiza setup → DUST → Links → Terminais',
      boot_chipset_hd: 'Chipset da controladora de HD: Reset → START → Correlaciona → Terminais',
    },
  },
  11: {
    mentor: 'Doutor Estranho',
    fala: 'Em Titã, eu entrego a Joia do Tempo e saio de cena. O BIOS faz o mesmo: antes de encerrar, passa o controle ao FCTos01. Quais duas tarefas ele cumpre?',
    opcoes: {
      bios_handoff: '(1) Copiar o núcleo do HD/SSD para a RAM e (2) gravar o início do Escalonador no IC e no Register of Scheduler',
      bios_descompacta: '(1) Descompactar dados e (2) ler os dispositivos de armazenamento',
      bios_setup: '(1) Verificar o setup e (2) executar o POST',
      bios_post_descompacta: '(1) Fazer o POST e (2) descompactar dados',
    },
  },
  12: {
    mentor: 'Doutor Estranho',
    fala: 'Contra Dormammu, repeti o mesmo instante, uma volta de cada vez, até ele ceder. O Escalonador também divide o tempo em voltas. Que situação do dia a dia explica isso?',
    opcoes: {
      turnos_empresa: 'Turnos de trabalho organizados em uma empresa',
      montanha_russa: 'Andar em montanha-russa',
      confinamento: 'Confinamento de gado',
      dormir: 'Dormir de barriga para cima',
    },
  },
  13: {
    mentor: 'Doutor Estranho',
    fala: 'Em Titã, cada herói ataca na sua vez, inclusive quem comanda o plano. Na CPU da Manopla, quem entra nesse revezamento?',
    opcoes: {
      so_e_programas_cpu: 'O FCTos01 e os programas de usuário: todos são escalonados para usar o processador',
      antecipacao: 'Os programas de usuário são antecipados para uso dentro do SO',
      multiplicacao_escalar: 'O SO e os programas passam por uma multiplicação escalar',
      dentro_do_so: 'Os programas de usuário são guardados dentro do código do SO',
    },
  },
  14: {
    mentor: 'Doutor Estranho',
    fala: 'Eu examinei 14.000.605 futuros, alternando de um para outro. A Manopla também mantém vários programas e alterna os turnos entre eles. Como se classifica esse sistema?',
    opcoes: {
      multiprogramado: 'Sistema Multiprogramado',
      monoprogramado: 'Sistema Monoprogramado',
      bi_executado: 'Sistema Bi-executado',
      bi_executavel: 'Sistema Bi-executável',
    },
  },
  15: {
    mentor: 'Doutor Estranho',
    fala: 'O plano em Titã tem etapas e participantes: Mantis acalma Thanos, Homem-Aranha e Homem de Ferro puxam a Manopla. Que exemplo do dia a dia traduz um processo?',
    opcoes: {
      producao_empresa: 'Um processo de produção numa empresa: um conjunto de etapas e elementos',
      ondas_mar: 'O movimento das ondas do mar',
      centripeta: 'A força centrípeta',
      centrifuga: 'A força centrífuga',
    },
  },
  16: {
    mentor: 'Doutor Estranho',
    fala: 'Só um futuro dá certo, e alguém precisa coordenar cada passo dele. Qual é a relação entre o FCTos01 e os processos dos programas de usuário?',
    opcoes: {
      so_gerencia_processos: 'O FCTos01 gerencia os processos de execução dos programas de usuário',
      fragmentacao: 'O SO fragmenta a si mesmo e aos programas',
      reconstrucao: 'O SO reconstrói a si mesmo e aos programas',
      analise: 'O SO faz análise estática dos programas',
    },
  },
  17: {
    mentor: 'Loki',
    fala: 'Os refugiados de Asgard só existem a bordo enquanto a nave funciona. Quando você a destruiu, nada sobrou. A RAM da Manopla é assim. O que ela guarda, e por quanto tempo?',
    opcoes: {
      enquanto_ligado: 'O SO e os programas, enquanto a Manopla está ligada (memória volátil)',
      permanente_ram: 'O SO e os programas, para sempre',
      compilacao_juntos: 'O SO e os programas, só para compilá-los juntos',
      convolucao: 'O SO e os programas, para fazer convolução entre eles',
    },
  },
  18: {
    mentor: 'Loki',
    fala: 'Guardado no Cofre de Odin, o Tesseract não serve para nada: só a joia encaixada na Manopla pode ser usada. Por que o FCTos01 e os programas precisam estar na RAM para rodar?',
    opcoes: {
      buscados_da_ram: 'Porque a CPU busca as instruções e os dados direto da RAM (busca de instruções)',
      compilados_ram: 'Porque é na RAM que o SO e os programas são compilados juntos',
      permanente_busca: 'Porque a RAM guarda tudo mesmo depois de desligar',
      convolucionados: 'Porque é na RAM que o SO e os programas são convolucionados',
    },
  },
  19: {
    mentor: 'Loki',
    fala: 'Na nave asgardiana, cada grupo tem seu compartimento. Na RAM da Manopla, o FCTos01 e os dois programas dividem o mesmo espaço. Como organizar essa memória?',
    opcoes: {
      particionamento: 'Dividir a RAM em regiões, uma para cada um (particionamento)',
      encaixamento: 'Aplicar um encaixamento genérico',
      acondicionamento: 'Aplicar acondicionamento',
      adicionamento: 'Aplicar adicionamento',
    },
  },
  20: {
    mentor: 'Loki',
    fala: 'Na cápsula de Rocket, Thor, Groot e Rocket não cabem em espaços iguais. Na RAM é igual: SO com 4 MB, Programa 1 com 6 MB e Programa 2 com 2 MB. Que regra as partições seguem?',
    opcoes: {
      tamanhos_diferentes: 'Programas de tamanhos diferentes: partições de tamanhos diferentes',
      tamanhos_iguais: 'Executáveis do mesmo tamanho: partições de tamanhos iguais',
      particionamento_existencial: 'A memória não pode ser particionada: particionamento existencial',
      particionamento_unilateral: 'A memória não pode ser particionada: particionamento unilateral',
    },
  },
  21: {
    mentor: 'Loki',
    fala: 'Algumas cabines da nave foram definidas na partida; o porão foi rearrumado durante a viagem. Quando e de que jeito as partições da RAM podem ser definidas?',
    opcoes: {
      fixo_inicio_variavel_durante: 'Fixo, definido no início das atividades do SO, ou variável, ajustado durante elas (tamanhos diferentes)',
      fixo_durante_variavel_inicio: 'Fixo, definido durante as atividades do SO, ou variável, definido no início',
      somente_fixo_durante: 'Somente fixo, definido durante as atividades do SO',
      somente_variavel_inicio: 'Somente variável, definido no início das atividades do SO',
    },
  },
  22: {
    mentor: 'Heimdall',
    fala: 'Além da RAM, o FCTos01 precisa organizar outra memória para guardar arquivos. Olhe o Tesseract: um cubo feito de partes iguais. Que estrutura você aplica?',
    opcoes: {
      hd_blocos: 'Dividir o HD em blocos, como as partes do cubo',
      registradores_bits: 'Dividir os registradores em mapas de bits',
      cache_associativa: 'Dividir a memória cache em conjuntos associativos',
      rom_instancias: 'Dividir a ROM em instâncias',
    },
  },
  23: {
    mentor: 'Heimdall',
    fala: 'Na Bifrost, cada trecho vem logo depois do outro: basta saber onde a ponte começa. O arquivo tem blocos lado a lado e o diretório só guarda o 1º. Que alocação é essa?',
    opcoes: {
      contigua: 'Alocação Contígua (blocos lado a lado: B04 → B05 → B06 → B07)',
      encadeada_err: 'Alocação por Lista Encadeada',
      indice_err: 'Lista Encadeada usando Índice',
      noi_err: 'Nó-i (i-node)',
    },
  },
  24: {
    mentor: 'Heimdall',
    fala: 'Os portais não ficam lado a lado: cada um mostra o endereço do próximo. Os blocos do arquivo estão espalhados e cada um guarda onde está o seguinte. Que alocação é essa?',
    opcoes: {
      lista_encadeada: 'Alocação por Lista Encadeada (B02 → B09 → B05 → B14)',
      contigua_err2: 'Alocação Contígua',
      indice_err2: 'Lista Encadeada usando Índice',
      noi_err2: 'Nó-i (i-node)',
    },
  },
  25: {
    mentor: 'Heimdall',
    fala: 'Eu enxergo todos os endereços dos Nove Reinos e anoto tudo em tabelas. Os blocos ficam livres pelo disco e os endereços vão para tabelas em vários níveis. Que método é esse?',
    opcoes: {
      noi: 'Nó-i: tabelas de endereços em níveis (B01, B06, B11, B15)',
      contigua_err3: 'Alocação Contígua',
      encadeada_err3: 'Alocação por Lista Encadeada',
      indice_enc_err3: 'Lista Encadeada usando Índice',
    },
  },
};

export const EPILOGO = {
  titulo: 'Titã não precisava cair',
  texto:
    'Titã morreu porque os recursos acabaram, e Thanos concluiu que a única saída era eliminar metade de todos. Ao montar o FCTos01, você fez o contrário: o escalonador dividiu o tempo da CPU em turnos, as partições acomodaram programas de tamanhos diferentes e o disco organizou cada bloco. Um bom gerente de recursos compartilha em vez de eliminar.',
  gancho: 'Continua em SO 2: Ultimato. Contexto, interrupções, mutex e o estalo que traz todos de volta.',
};

// Limites de tamanho para caber nos slides (conferidos pelo validador)
// (a fala das etapas divide a caixa com o retrato do mentor; cenas: caixa larga)
export const LIMITES = { fala: 200, opcao: 115, cena: 170 };
