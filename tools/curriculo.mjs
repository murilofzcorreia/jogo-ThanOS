// Dados do ThanOS para a versão Google Apresentações.
// Gerado a partir de:
//   GitHub/thanOS/scripts/so1_curriculum.gd (SO1_STAGES e SO2_PREVIEWS)
//   GitHub/thanOS/data/stages.json (fases)
// Os textos são copiados sem alteração.

export const FASES = [
  {
    "id": "poder",
    "joia": "Joia do Poder",
    "nome_curto": "Poder",
    "cor": "#a66bff",
    "lapidacao": "redonda",
    "posicao": [
      -132,
      -112
    ],
    "modulo": "SO 1",
    "ordem_guiada": 1,
    "faixa": "Etapas 01 a 07",
    "texto": "Módulo SO 1 · Etapas 01 a 07: Concepção da FCTarc13, 4 recursos de hardware, Braço Robótico como periférico, funções do SO e os 4 componentes do Kernel.",
    "cena": "res://scenes/ui/workbench_screen.tscn"
  },
  {
    "id": "realidade",
    "joia": "Joia da Realidade",
    "nome_curto": "Realidade",
    "cor": "#ff4b4b",
    "lapidacao": "gota",
    "posicao": [
      132,
      -112
    ],
    "modulo": "SO 2",
    "ordem_guiada": 4,
    "faixa": "Etapas 26 a 33",
    "texto": "Módulo SO 2 · Etapas 26 a 33: Contexto nos registradores, Tabela de Processos na RAM, compartilhamento do Braço Robótico, Mutex, Monopólio e Syscalls.",
    "cena": ""
  },
  {
    "id": "alma",
    "joia": "Joia da Alma",
    "nome_curto": "Alma",
    "cor": "#ff9a3c",
    "lapidacao": "triangulo",
    "posicao": [
      236,
      14
    ],
    "modulo": "SO 2",
    "ordem_guiada": 5,
    "faixa": "Etapas 34 a 40",
    "texto": "Módulo SO 2 · Etapas 34 a 40: Interrupções, Vetores e Rotinas de Tratamento (ISR), Driver como Tradutor, Atomicidade e Ciclo de Vida dos Processos.",
    "cena": ""
  },
  {
    "id": "mente",
    "joia": "Joia da Mente",
    "nome_curto": "Mente",
    "cor": "#ffd84a",
    "lapidacao": "losango",
    "posicao": [
      132,
      140
    ],
    "modulo": "SO 2",
    "ordem_guiada": 6,
    "faixa": "Etapas 43 a 46",
    "texto": "Módulo SO 2 · Etapas 43 a 46: Limites de execução em 1 CPU física na FCTarc, Escalonamento Prioritário, Modo Núcleo Protegido vs. Modo Usuário e MMU.",
    "cena": ""
  },
  {
    "id": "tempo",
    "joia": "Joia do Tempo",
    "nome_curto": "Tempo",
    "cor": "#3fd68a",
    "lapidacao": "navete",
    "posicao": [
      -132,
      140
    ],
    "modulo": "SO 1",
    "ordem_guiada": 2,
    "faixa": "Etapas 08 a 16",
    "texto": "Módulo SO 1 · Etapas 08 a 16: Persistência no HD/SSD, sequência de Boot do BIOS na ROM, passagem para a RAM e IC, Escalonamento e Processos.",
    "cena": "res://scenes/ui/workbench_screen.tscn"
  },
  {
    "id": "espaco",
    "joia": "Joia do Espaço",
    "nome_curto": "Espaço",
    "cor": "#4c8dff",
    "lapidacao": "quadrada",
    "posicao": [
      -236,
      14
    ],
    "modulo": "SO 1",
    "ordem_guiada": 3,
    "faixa": "Etapas 17 a 25",
    "texto": "Módulo SO 1 · Etapas 17 a 25: Busca na RAM, Particionamento Lógico Fixo e Variável em tamanhos diferentes, divisão do HD em blocos e Alocação Contígua, Encadeada e Nó-i.",
    "cena": "res://scenes/ui/workbench_screen.tscn"
  }
];

export const SO1_STAGES = {
  "poder": [
    {
      "number": 1,
      "title": "Etapa 01 · Requisito Prévio do Projeto",
      "diagram": "placa_fctarc",
      "schematic_step": 1,
      "mode_type": "single",
      "directive": "A FCT designou a equipe para criar o FCTos01 do zero. Defina na bancada o conhecimento essencial que precisa ser levantado antes de iniciar o projeto do sistema operacional.",
      "engineering_note": "O projeto do SO começa mapeando o hardware disponível e o comportamento geral dos programas de usuário que vão utilizá-lo.",
      "options": [
        {
          "id": "recursos_e_programas",
          "label": "Mapear recursos disponíveis e características dos programas de usuários",
          "correct": true,
          "feedback": "Correto. Conhecer os recursos da FCTarc13 e o perfil dos dois programas do braço robótico define toda a arquitetura do núcleo."
        },
        {
          "id": "fabricante",
          "label": "Catalogar apenas o fabricante do sistema de computação",
          "correct": false,
          "feedback": "Insuficiente. O fabricante comercial não informa quais recursos de hardware ou cargas de programa o SO precisa gerenciar."
        },
        {
          "id": "velocidade",
          "label": "Registrar somente a velocidade máxima do sistema",
          "correct": false,
          "feedback": "Insuficiente. Clock isolado não descreve memória, dispositivos nem necessidades dos programas de usuário."
        },
        {
          "id": "marca_modelo",
          "label": "Fixar apenas a marca e o modelo do equipamento",
          "correct": false,
          "feedback": "Insuficiente. Rótulos comerciais não substituem o levantamento técnico dos recursos e das aplicações."
        }
      ]
    },
    {
      "number": 2,
      "title": "Etapa 02 · Os Quatro Recursos de Hardware",
      "diagram": "placa_fctarc",
      "schematic_step": 2,
      "mode_type": "multi",
      "directive": "Inspecione a placa-mãe da FCTarc13 e acople os quatro principais recursos de hardware que ficam à disposição do sistema operacional.",
      "engineering_note": "Os quatro pilares de hardware gerenciados pelo SO são: Processador (CPU), Memória RAM, Periféricos e HD ou SSD.",
      "aula_options": [
        {
          "id": "hw_core_4",
          "label": "Conectar: Processador, RAM, Periféricos e HD ou SSD",
          "correct": true,
          "feedback": "Barramento energizado. CPU, RAM, Periféricos e armazenamento secundário formam o núcleo de hardware administrado pelo FCTos01."
        },
        {
          "id": "hw_gabinete",
          "label": "Conectar: Gabinete, unidade de CD-ROM, porta USB e filtro de linha",
          "correct": false,
          "feedback": "Falha de barramento. Gabinete e filtro de linha são estrutura elétrica/mecânica, não os quatro recursos principais de computação."
        },
        {
          "id": "hw_rom_cache",
          "label": "Conectar: ROM, memória cache, braço robótico e porta USB",
          "correct": false,
          "feedback": "Incompleto. Cache e ROM não substituem RAM, Processador e armazenamento em disco/SSD na visão principal do sistema."
        },
        {
          "id": "hw_cooler",
          "label": "Conectar: CPU, braço robótico, cooler e porta USB",
          "correct": false,
          "feedback": "Falha de barramento. Falta a memória principal (RAM) e o armazenamento secundário (HD ou SSD); cooler é apenas refrigeração."
        }
      ],
      "options": [
        {
          "id": "cpu",
          "label": "Instalar Processador (CPU)",
          "correct": true,
          "feedback": "CPU acoplada ao soquete principal da FCTarc13."
        },
        {
          "id": "ram",
          "label": "Instalar Memória RAM",
          "correct": true,
          "feedback": "Módulos de RAM conectados ao barramento de memória principal."
        },
        {
          "id": "perifericos",
          "label": "Conectar Periféricos (E/S)",
          "correct": true,
          "feedback": "Controladora de periféricos habilitada na placa."
        },
        {
          "id": "hd_ssd",
          "label": "Instalar HD ou SSD",
          "correct": true,
          "feedback": "Armazenamento secundário conectado ao barramento de disco."
        },
        {
          "id": "filtro",
          "label": "Conectar Gabinete e Filtro de linha",
          "correct": false,
          "feedback": "Gabinete e filtro de linha não são recursos lógicos gerenciados diretamente pelo núcleo do SO."
        },
        {
          "id": "cooler",
          "label": "Conectar Cooler e unidade de CD-ROM",
          "correct": false,
          "feedback": "Cooler é refrigeração física; faltam os recursos principais de processamento, memória e disco."
        }
      ]
    },
    {
      "number": 3,
      "title": "Etapa 03 · Classificação do Braço Robótico",
      "diagram": "placa_fctarc",
      "schematic_step": 3,
      "mode_type": "single",
      "directive": "Analise a função do braço robótico na arquitetura da FCTarc13 e conecte-o na porta correspondente à sua classificação correta.",
      "engineering_note": "Na arquitetura de computadores, o braço robótico é um Dispositivo Periférico controlado via entrada e saída pelo sistema.",
      "options": [
        {
          "id": "periferico",
          "label": "Classificar e ligar como Dispositivo Periférico",
          "correct": true,
          "feedback": "Braço robótico reconhecido. Como atua externamente ao núcleo CPU-memória, ele é classificado como Dispositivo Periférico."
        },
        {
          "id": "alternativo",
          "label": "Classificar como Dispositivo alternativo",
          "correct": false,
          "feedback": "Classificação inválida na Arquitetura de Computadores: dispositivos de E/S externos são periféricos."
        },
        {
          "id": "auxilio",
          "label": "Classificar como Dispositivo de auxílio",
          "correct": false,
          "feedback": "Termo impreciso. O hardware externo acoplado ao barramento de E/S é um dispositivo periférico."
        },
        {
          "id": "alternador",
          "label": "Classificar como Dispositivo alternador",
          "correct": false,
          "feedback": "Alternador remete a energia elétrica, não à função computacional do braço robótico."
        }
      ]
    },
    {
      "number": 4,
      "title": "Etapa 04 · Justificativa Técnica do SO",
      "diagram": "arquitetura_so",
      "schematic_step": 4,
      "mode_type": "single",
      "directive": "Com os recursos da FCTarc13 e o perfil dos programas mapeados, defina a justificativa técnica pela qual a equipe precisa desenvolver o sistema operacional.",
      "engineering_note": "O SO existe para dar a impressão de execução paralela aos programas de usuário e permitir o compartilhamento organizado dos recursos.",
      "options": [
        {
          "id": "paralelo_compartilhado",
          "label": "Dar impressão de execução paralela e compartilhar recursos de forma organizada",
          "correct": true,
          "feedback": "Diretriz validada. O FCTos01 alterna turnos entre programas e evita conflito pelo processador, memória e braço robótico."
        },
        {
          "id": "modo_kernel_usuario",
          "label": "Executar programas de usuários direto em modo Kernel para segurança",
          "correct": false,
          "feedback": "Erro grave de segurança. Programas de usuário em modo Kernel teriam acesso irrestrito e poderiam derrubar o sistema."
        },
        {
          "id": "vhdl_rom",
          "label": "Impedir que programas dependam do código VHDL da memória ROM",
          "correct": false,
          "feedback": "Incorreto. VHDL descreve o hardware em FPGA; a função do SO é organizar execução e compartilhamento."
        },
        {
          "id": "gerar_programas",
          "label": "Fazer a FCTarc13 gerar novos programas de usuário automaticamente",
          "correct": false,
          "feedback": "Incorreto. O SO gerencia a execução de programas já desenvolvidos, não os gera sozinho."
        }
      ]
    },
    {
      "number": 5,
      "title": "Etapa 05 · Duas Funções Principais do SO",
      "diagram": "arquitetura_so",
      "schematic_step": 5,
      "mode_type": "multi",
      "directive": "Estabeleça na camada intermediária do sistema as duas principais funções desempenhadas por qualquer sistema operacional.",
      "engineering_note": "Todo SO atua como Máquina Virtual/Estendida (base simplificada para programação) e Gerente de Recursos (uso ordenado do hardware).",
      "aula_options": [
        {
          "id": "funcoes_duplas",
          "label": "Ativar: Máquina Virtual (Estendida) e Gerente de Recursos",
          "correct": true,
          "feedback": "Camada dupla ativada. O SO abstrai o hardware como Máquina Estendida e arbitra o uso seguro como Gerente de Recursos."
        },
        {
          "id": "carregador_manipulador",
          "label": "Ativar: Carregador de programas e manipulador exclusivo de braços",
          "correct": false,
          "feedback": "Visão restrita. Um SO genérico não se define apenas por manipular braços robóticos."
        },
        {
          "id": "maquina_conceitual",
          "label": "Ativar: Máquina conceitual e gerente de atividades implícitas",
          "correct": false,
          "feedback": "Terminologia incorreta. Os dois papéis clássicos são Máquina Estendida (Virtual) e Gerente de Recursos."
        },
        {
          "id": "intermediador_executor",
          "label": "Ativar: Intermediador para braços robóticos e executor isolado",
          "correct": false,
          "feedback": "Incorreto. Reduzir o SO a um intermediador robótico ignora o gerenciamento geral do computador."
        }
      ],
      "options": [
        {
          "id": "maquina_estendida",
          "label": "Acoplar: Máquina Virtual ou Máquina Estendida (base para programação)",
          "correct": true,
          "feedback": "Camada de abstração conectada: os programas enxergam uma máquina mais fácil de programar."
        },
        {
          "id": "gerente_recursos",
          "label": "Acoplar: Gerente de Recursos (uso adequado do hardware)",
          "correct": true,
          "feedback": "Camada de controle conectada: CPU, RAM e periféricos passam a ter arbitragem ordenada."
        },
        {
          "id": "manipulador_bracos",
          "label": "Acoplar: Manipulador físico de braços robóticos",
          "correct": false,
          "feedback": "Isso seria específico de um dispositivo, não uma das duas funções universais de qualquer SO."
        },
        {
          "id": "gerente_implicito",
          "label": "Acoplar: Gerente de atividades implícitas",
          "correct": false,
          "feedback": "Conceito inválido. A função real é gerenciar os recursos físicos e lógicos explicitamente."
        }
      ]
    },
    {
      "number": 6,
      "title": "Etapa 06 · Ponto de Partida da Chefia",
      "diagram": "arquitetura_so",
      "schematic_step": 6,
      "mode_type": "single",
      "directive": "Como chefe da equipe contratada pela Unesp para desenvolver o SO da FCTarc13, determine a tarefa inicial que abre o desenvolvimento do núcleo.",
      "engineering_note": "Antes de desenhar interfaces, tabelas ou fluxos de micro-instruções, a equipe precisa definir as tarefas dos componentes principais do SO.",
      "options": [
        {
          "id": "definir_tarefas_componentes",
          "label": "Definir as tarefas dos componentes principais do SO",
          "correct": true,
          "feedback": "Marco zero estabelecido. Com o papel de cada componente definido, o restante da arquitetura pode ser detalhado."
        },
        {
          "id": "diagrama_micro_memoria",
          "label": "Começar pelo diagrama de fluxo de dados sobre a micro-memória",
          "correct": false,
          "feedback": "Etapa prematura. Sem definir os componentes do SO e suas tarefas, não há o que mapear no fluxo de instruções."
        },
        {
          "id": "tabela_processos",
          "label": "Começar pela elaboração direta da tabela de processos",
          "correct": false,
          "feedback": "Estrutura de dados vem depois da definição das responsabilidades de cada subsistema do núcleo."
        },
        {
          "id": "interface_usuario",
          "label": "Começar caracterizando a interface visual com o usuário",
          "correct": false,
          "feedback": "A interface fica na camada mais externa; o núcleo parte da definição funcional dos componentes do SO."
        }
      ]
    },
    {
      "number": 7,
      "title": "Etapa 07 · Os Quatro Componentes do Núcleo",
      "diagram": "arquitetura_so",
      "schematic_step": 7,
      "mode_type": "multi",
      "directive": "Estruture o Kernel do FCTos01 selecionando a quantidade correta e instalando os principais componentes presentes em qualquer núcleo de sistema operacional.",
      "engineering_note": "Todo núcleo de SO se apoia em 4 componentes: Escalonador de processos e threads, Gerente de memória, Sistema de arquivos e Software de E/S.",
      "aula_options": [
        {
          "id": "kernel_4_modulos",
          "label": "4 módulos: Escalonador, Gerente de memória, Sistema de arquivos e Software de E/S",
          "correct": true,
          "feedback": "Kernel completo selado! Você concluiu o Bloco 1 de SO 1 e conquistou a Joia do Poder."
        },
        {
          "id": "kernel_3_bios",
          "label": "3 módulos: BIOS, Controlador de DMA e Controlador de IRQ",
          "correct": false,
          "feedback": "Erro estrutural. BIOS, DMA e IRQ pertencem a firmware e controladores de hardware, não aos 4 módulos do núcleo."
        },
        {
          "id": "kernel_3_init",
          "label": "3 módulos: Inicializador do sistema, Escalonador e Finalizador",
          "correct": false,
          "feedback": "Incompleto. Falta o gerenciamento de memória, de arquivos e de entrada/saída."
        },
        {
          "id": "kernel_4_hw",
          "label": "4 módulos: Processador, RAM, HD e Braço robótico",
          "correct": false,
          "feedback": "Confusão de camadas. Esses quatro itens são recursos físicos de hardware, não componentes de software do núcleo."
        }
      ],
      "options": [
        {
          "id": "escalonador",
          "label": "Instalar Escalonador de processos e threads",
          "correct": true,
          "feedback": "Módulo 1/4 acoplado: o escalonador decide quem usa a CPU."
        },
        {
          "id": "gerente_memoria",
          "label": "Instalar Gerente de memória",
          "correct": true,
          "feedback": "Módulo 2/4 acoplado: controle de partições e endereços da RAM ativado."
        },
        {
          "id": "sistema_arquivos",
          "label": "Instalar Sistema de arquivos",
          "correct": true,
          "feedback": "Módulo 3/4 acoplado: organização lógica de blocos no disco pronta."
        },
        {
          "id": "software_es",
          "label": "Instalar Software de entrada e saída",
          "correct": true,
          "feedback": "Módulo 4/4 acoplado: drivers e controle de periféricos integrados."
        },
        {
          "id": "bios_dma",
          "label": "Instalar BIOS e Controlador de DMA",
          "correct": false,
          "feedback": "Rejeitado pelo Kernel: BIOS e controladores físicos ficam abaixo do núcleo de software."
        }
      ]
    }
  ],
  "tempo": [
    {
      "number": 8,
      "title": "Etapa 08 · Persistência com Computador Desligado",
      "diagram": "persistencia_boot",
      "schematic_step": 8,
      "mode_type": "single",
      "directive": "A energia da bancada será cortada. Aloje o sistema operacional e os dois programas de usuário no recurso capaz de mantê-los gravados mesmo com o computador desligado.",
      "engineering_note": "Com o sistema sem energia, somente memórias secundárias não voláteis como SSD ou HD preservam o SO e os programas.",
      "options": [
        {
          "id": "ssd_hd",
          "label": "Alojar no SSD ou HD (armazenamento secundário)",
          "correct": true,
          "feedback": "Chave desligada e dados preservados. SSD e HD são não voláteis e guardam SO e programas sem alimentação elétrica."
        },
        {
          "id": "ram",
          "label": "Alojar na memória RAM",
          "correct": false,
          "feedback": "Perda total ao desligar. A RAM é memória volátil e apaga tudo quando a energia é cortada."
        },
        {
          "id": "cache",
          "label": "Alojar na memória cache",
          "correct": false,
          "feedback": "Perda total ao desligar. A cache é volátil e serve apenas para acelerar acessos durante a execução."
        },
        {
          "id": "registradores",
          "label": "Alojar nos registradores da CPU",
          "correct": false,
          "feedback": "Inviável. Registradores são minúsculos e voláteis, zerados ao desligar a máquina."
        }
      ]
    },
    {
      "number": 9,
      "title": "Etapa 09 · Papel da Memória Secundária",
      "diagram": "persistencia_boot",
      "schematic_step": 9,
      "mode_type": "single",
      "directive": "Registre para a equipe a razão arquitetural pela qual o sistema operacional e os dois programas de usuário permanecem gravados no disco rígido.",
      "engineering_note": "A memória secundária existe para armazenar o sistema operacional e os programas permanentemente.",
      "options": [
        {
          "id": "permanente",
          "label": "Armazenamento permanente do SO e dos programas de usuário",
          "correct": true,
          "feedback": "Confirmado. A persistência permanente garante que o computador possa inicializar o SO sempre que for religado."
        },
        {
          "id": "somente_compilacao",
          "label": "Armazenar somente durante a compilação dos programas",
          "correct": false,
          "feedback": "Incorreto. Executáveis já compilados e o próprio SO continuam no disco após a compilação."
        },
        {
          "id": "somente_interacao",
          "label": "Armazenar somente para interação direta entre os programas",
          "correct": false,
          "feedback": "Incorreto. A função essencial do disco aqui é a guarda permanente mesmo fora de execução."
        },
        {
          "id": "somente_ligado",
          "label": "Armazenar somente enquanto o computador estiver ligado",
          "correct": false,
          "feedback": "Essa é a característica da RAM (volátil), não do disco rígido."
        }
      ]
    },
    {
      "number": 10,
      "title": "Etapa 10 · Sequência de Boot, BIOS e ROM",
      "diagram": "persistencia_boot",
      "schematic_step": 10,
      "mode_type": "multi",
      "directive": "Energia religada! Acione o firmware responsável pelos primeiros passos da partida, confirme onde ele reside e percorra as cinco etapas até o carregamento do SO.",
      "engineering_note": "Ao ligar, o BIOS (gravado na memória ROM) verifica o setup, faz o POST, descompacta dados, lê o armazenamento e carrega o SO.",
      "aula_options": [
        {
          "id": "boot_bios_rom",
          "label": "Executar via BIOS (na ROM): Setup → POST → Descompacta → Lê disco → Carrega SO",
          "correct": true,
          "feedback": "Trilha de boot acesa! O BIOS armazenado na ROM concluiu POST e leitura do disco com sucesso."
        },
        {
          "id": "boot_chipset_placa",
          "label": "Executar via Chipset (Placa-mãe): HD → BUST → Links → Carrega SO → USB",
          "correct": false,
          "feedback": "Sequência inválida. BUST não existe e o responsável pela rotina de inicialização na ROM é o BIOS."
        },
        {
          "id": "boot_fpga",
          "label": "Executar via FPGA (Placa de Boot): Atualiza setup → DUST → Links → Terminais",
          "correct": false,
          "feedback": "Sequência inválida. DUST e links não correspondem ao processo real de POST e carga do SO pelo BIOS."
        },
        {
          "id": "boot_chipset_hd",
          "label": "Executar via Chipset (Controladora HD): Reset → START → Correlaciona → Terminais",
          "correct": false,
          "feedback": "Sequência inválida. O código inicial de boot reside na memória ROM executando o BIOS."
        }
      ],
      "options": [
        {
          "id": "step_bios_rom",
          "label": "1. Selecionar Responsável: BIOS armazenado na memória ROM",
          "correct": true,
          "order": 1,
          "feedback": "Passo 1/4: chip ROM com firmware BIOS energizado."
        },
        {
          "id": "step_setup_post",
          "label": "2. Verificar o setup e executar o POST (autoteste de hardware)",
          "correct": true,
          "order": 2,
          "feedback": "Passo 2/4: setup validado e POST aprovado sem falhas de hardware."
        },
        {
          "id": "step_descompacta_disco",
          "label": "3. Descompactar dados e ler dispositivos de armazenamento",
          "correct": true,
          "order": 3,
          "feedback": "Passo 3/4: tabelas descompactadas e setor de boot lido no HD/SSD."
        },
        {
          "id": "step_carrega_so",
          "label": "4. Iniciar o carregamento do Sistema Operacional",
          "correct": true,
          "order": 4,
          "feedback": "Passo 4/4: sequência inicial de boot do BIOS completada na ordem exata."
        },
        {
          "id": "step_chipset_bust",
          "label": "Acionar rotina BUST no Chipset da controladora",
          "correct": false,
          "feedback": "Instrução inexistente. A inicialização cabe ao BIOS na ROM."
        }
      ]
    },
    {
      "number": 11,
      "title": "Etapa 11 · Passagem de Bastão do BIOS",
      "diagram": "persistencia_boot",
      "schematic_step": 11,
      "mode_type": "multi",
      "directive": "O BIOS da FCTarc13 está prestes a encerrar sua execução. Realize as duas tarefas finais que entregam o controle do processador ao sistema operacional.",
      "engineering_note": "Antes de sair, o BIOS carrega o núcleo do SO do HD/SSD para a RAM e grava o endereço inicial do Escalonador no IC e no Register of Scheduler.",
      "aula_options": [
        {
          "id": "bios_handoff",
          "label": "(1) Copiar núcleo do HD/SSD para a RAM e (2) Gravar início do Escalonador no IC e Register of Scheduler",
          "correct": true,
          "feedback": "Controle transferido! O Kernel está residente na RAM e o IC aponta para a primeira instrução do Escalonador."
        },
        {
          "id": "bios_descompacta",
          "label": "(1) Descompactar dados e (2) Ler dispositivos de armazenamento",
          "correct": false,
          "feedback": "Essas são etapas intermediárias do boot, não as duas ações de entrega final antes do BIOS encerrar."
        },
        {
          "id": "bios_setup",
          "label": "(1) Verificar setup e (2) Executar o POST",
          "correct": false,
          "feedback": "Setup e POST acontecem logo no início ao ligar o computador, não no encerramento do BIOS."
        },
        {
          "id": "bios_post_descompacta",
          "label": "(1) Fazer o POST e (2) Descompactar dados",
          "correct": false,
          "feedback": "Ainda são ações iniciais; falta transferir o núcleo para a RAM e apontar o IC."
        }
      ],
      "options": [
        {
          "id": "load_kernel_ram",
          "label": "1. Carregar núcleo do SO do HD ou SSD para a memória RAM",
          "correct": true,
          "order": 1,
          "feedback": "Tarefa 1/2 concluída: imagem do núcleo FCTos01 transferida para a RAM."
        },
        {
          "id": "load_ic_scheduler",
          "label": "2. Carregar endereço da 1ª instrução do Escalonador no IC e no Register of Scheduler",
          "correct": true,
          "order": 2,
          "feedback": "Tarefa 2/2 concluída: registrador IC e Register of Scheduler apontam para o Escalonador."
        },
        {
          "id": "rerun_post",
          "label": "Reiniciar o POST na ROM",
          "correct": false,
          "feedback": "O POST já terminou antes; refazê-lo impediria o sistema operacional de assumir a CPU."
        }
      ]
    },
    {
      "number": 12,
      "title": "Etapa 12 · O Que Significa Escalonamento",
      "diagram": "escalonador",
      "schematic_step": 12,
      "mode_type": "single",
      "directive": "O Escalonador entrou em cena. Associe na bancada a analogia cotidiana que descreve corretamente o princípio do escalonamento.",
      "engineering_note": "Escalonamento equivale a organizar turnos de trabalho em uma empresa: dividir o tempo disponível entre tarefas em ordem.",
      "options": [
        {
          "id": "turnos_empresa",
          "label": "Turnos de trabalho organizados em uma empresa",
          "correct": true,
          "feedback": "Analogia calibrada. Assim como trabalhadores se revezam por turnos, tarefas se revezam pelo tempo de processamento."
        },
        {
          "id": "montanha_russa",
          "label": "Andar em montanha russa",
          "correct": false,
          "feedback": "Analogia sem relação com divisão organizada de tempo e turnos de execução."
        },
        {
          "id": "confinamento",
          "label": "Confinamento de gado",
          "correct": false,
          "feedback": "Não traduz a ideia de alternância temporal de uso de um recurso único."
        },
        {
          "id": "dormir",
          "label": "Dormir de barriga para cima",
          "correct": false,
          "feedback": "Não representa compartilhamento temporal nem organização em turnos."
        }
      ]
    },
    {
      "number": 13,
      "title": "Etapa 13 · Quem Entra na Fila do Escalonador",
      "diagram": "escalonador",
      "schematic_step": 13,
      "mode_type": "single",
      "directive": "Estabeleça na linha do processador a relação exata entre o sistema operacional, os programas de usuário e o escalonamento.",
      "engineering_note": "Tanto o sistema operacional quanto os programas de usuário são escalonados para utilizar o processador.",
      "options": [
        {
          "id": "so_e_programas_cpu",
          "label": "SO e programas de usuário são escalonados para usar o processador",
          "correct": true,
          "feedback": "Anel de turnos completo! O próprio código do SO e os dois programas de usuário alternam o uso da CPU."
        },
        {
          "id": "antecipacao",
          "label": "Antecipação dos programas de usuário para uso no SO",
          "correct": false,
          "feedback": "Relação incorreta. O escalonamento reparte o tempo da CPU entre o SO e os programas de usuário."
        },
        {
          "id": "multiplicacao_escalar",
          "label": "Submeter SO e programas a uma multiplicação escalar",
          "correct": false,
          "feedback": "Jogo de palavras sem sentido arquitetural: escalonamento trata de turnos na CPU, não de álgebra vetorial."
        },
        {
          "id": "dentro_do_so",
          "label": "Programas de usuário são alocados dentro do código do SO",
          "correct": false,
          "feedback": "Os programas permanecem separados do SO e disputam turnos no processador com ele."
        }
      ]
    },
    {
      "number": 14,
      "title": "Etapa 14 · Classificação de Multiprogramação",
      "diagram": "escalonador",
      "schematic_step": 14,
      "mode_type": "single",
      "directive": "Com o sistema operacional e múltiplos programas de usuário alternando turnos de execução, configure a classificação do sistema na FCTarc13.",
      "engineering_note": "Sistemas capazes de manter e alternar vários programas em execução são classificados como Multiprogramados.",
      "options": [
        {
          "id": "multiprogramado",
          "label": "Configurar sistema como Multiprogramado",
          "correct": true,
          "feedback": "Modo Multiprogramado ativo. A FCTarc13 mantém múltiplos programas em memória alternando turnos de CPU."
        },
        {
          "id": "monoprogramado",
          "label": "Configurar sistema como Monoprogramado",
          "correct": false,
          "feedback": "Incompatível. Um sistema monoprogramado executaria apenas um programa de usuário do começo ao fim antes de outro."
        },
        {
          "id": "bi_executado",
          "label": "Configurar sistema como Bi-executado",
          "correct": false,
          "feedback": "Classificação inexistente na literatura de Sistemas Operacionais."
        },
        {
          "id": "bi_executavel",
          "label": "Configurar sistema como Bi-executável",
          "correct": false,
          "feedback": "Termo incorreto. Mesmo com dois programas de usuário na prática, a categoria técnica é Multiprogramado."
        }
      ]
    },
    {
      "number": 15,
      "title": "Etapa 15 · Conceito Cotidiano de Processo",
      "diagram": "escalonador",
      "schematic_step": 15,
      "mode_type": "single",
      "directive": "Estruture o conceito de Processo na linha de execução ligando-o ao exemplo cotidiano que melhor traduz sua composição.",
      "engineering_note": "Um processo se compara a um processo de produção em uma empresa: um conjunto de etapas e elementos necessários para gerar um resultado.",
      "options": [
        {
          "id": "producao_empresa",
          "label": "Processo de produção em uma empresa: conjunto de etapas e elementos",
          "correct": true,
          "feedback": "Modelo mental validado. Programa em execução envolve código, dados, contexto e etapas coordenadas até concluir a tarefa."
        },
        {
          "id": "ondas_mar",
          "label": "Movimentos ondulatórios do mar",
          "correct": false,
          "feedback": "Analogia física contínua que não evidencia etapas e elementos organizados de trabalho."
        },
        {
          "id": "centripeta",
          "label": "Força centrípeta",
          "correct": false,
          "feedback": "Conceito de mecânica clássica sem relação com etapas de execução de software."
        },
        {
          "id": "centrifuga",
          "label": "Força centrífuga",
          "correct": false,
          "feedback": "Conceito físico distante da estrutura de etapas e elementos de um processo computacional."
        }
      ]
    },
    {
      "number": 16,
      "title": "Etapa 16 · Gerenciamento de Processos pelo SO",
      "diagram": "escalonador",
      "schematic_step": 16,
      "mode_type": "single",
      "directive": "Conclua o subsistema de execução ativando a relação correta entre o sistema operacional e os processos dos programas de usuário.",
      "engineering_note": "O sistema operacional gerencia os processos de execução dos programas de usuário, reunindo atividades e elementos necessários para rodá-los.",
      "options": [
        {
          "id": "so_gerencia_processos",
          "label": "O SO gerencia os processos de execução dos programas de usuário",
          "correct": true,
          "feedback": "Gerenciamento de processos estabilizado! Você concluiu o Bloco 2 de SO 1 e conquistou a Joia do Tempo."
        },
        {
          "id": "fragmentacao",
          "label": "Processo de fragmentação do SO e dos programas",
          "correct": false,
          "feedback": "Incorreto. O SO não existe para fragmentar programas, e sim para gerenciar sua execução ordenada."
        },
        {
          "id": "reconstrucao",
          "label": "Processo de reconstrução do SO e dos programas",
          "correct": false,
          "feedback": "Incorreto. Os programas já existem; o papel do SO é gerenciar seus processos durante a execução."
        },
        {
          "id": "analise",
          "label": "Processo de análise estática dos programas",
          "correct": false,
          "feedback": "Incorreto. A relação central em tempo de operação é o gerenciamento da execução desses programas."
        }
      ]
    }
  ],
  "espaco": [
    {
      "number": 17,
      "title": "Etapa 17 · Permanência Volátil na RAM",
      "diagram": "barramento_ram",
      "schematic_step": 17,
      "mode_type": "single",
      "directive": "Analise a operação da FCTarc13 e estabeleça no barramento principal a relação temporal entre a memória RAM, o sistema operacional e os programas de usuário.",
      "engineering_note": "A memória RAM armazena o sistema operacional e os programas de usuário enquanto o computador está ligado.",
      "options": [
        {
          "id": "enquanto_ligado",
          "label": "A RAM armazena o SO e os programas enquanto o computador está ligado",
          "correct": true,
          "feedback": "Barramento confirmado. A RAM guarda o SO e os programas em execução ativa enquanto há energia no sistema."
        },
        {
          "id": "permanente_ram",
          "label": "A RAM armazena o SO e os programas permanentemente",
          "correct": false,
          "feedback": "Erro de arquitetura. A guarda permanente pertence ao HD/SSD; a RAM perde o conteúdo quando desligada."
        },
        {
          "id": "compilacao_juntos",
          "label": "A RAM armazena ambos apenas para compilá-los todos juntos",
          "correct": false,
          "feedback": "Incorreto. SO e programas já chegam prontos para execução, não para recompilação conjunta na RAM."
        },
        {
          "id": "convolucao",
          "label": "A RAM armazena para realizar convolução entre eles",
          "correct": false,
          "feedback": "Incorreto. Convolução é operação matemática/sinais, não a função da memória principal."
        }
      ]
    },
    {
      "number": 18,
      "title": "Etapa 18 · Busca de Instruções na RAM",
      "diagram": "barramento_ram",
      "schematic_step": 18,
      "mode_type": "single",
      "directive": "Explique no fluxo de dados da FCTarc13 por que o sistema operacional e os programas de usuário precisam estar carregados na RAM para rodar.",
      "engineering_note": "A CPU busca diretamente da RAM as instruções e dados do sistema operacional e dos programas de usuário durante a execução.",
      "options": [
        {
          "id": "buscados_da_ram",
          "label": "A RAM é a memória a partir da qual o SO e os programas são buscados",
          "correct": true,
          "feedback": "Fluxo de busca ativo! O processador lê instruções da RAM a cada ciclo porque ela é rápida e endereçável pela CPU."
        },
        {
          "id": "compilados_ram",
          "label": "A RAM é onde SO e programas são compilados juntos",
          "correct": false,
          "feedback": "Incorreto. Na execução, a CPU busca instruções já compiladas a partir da memória RAM."
        },
        {
          "id": "permanente_busca",
          "label": "A RAM garante armazenamento permanente após desligar",
          "correct": false,
          "feedback": "Incorreto. A característica permanente é do armazenamento secundário, não da RAM."
        },
        {
          "id": "convolucionados",
          "label": "A RAM é onde SO e programas são convolucionados",
          "correct": false,
          "feedback": "Conceito incorreto. A CPU realiza busca de instruções (fetch) a partir da RAM."
        }
      ]
    },
    {
      "number": 19,
      "title": "Etapa 19 · Organização Lógica da RAM",
      "diagram": "barramento_ram",
      "schematic_step": 19,
      "mode_type": "single",
      "directive": "Com o sistema operacional e os dois programas de usuário dividindo a mesma memória RAM, aplique o método correto para organizar esse armazenamento.",
      "engineering_note": "A organização da RAM entre SO e programas de usuário é feita por Particionamento.",
      "options": [
        {
          "id": "particionamento",
          "label": "Aplicar Particionamento da memória RAM",
          "correct": true,
          "feedback": "Divisórias lógicas traçadas! O Particionamento separa regiões dedicadas ao SO e a cada programa na RAM."
        },
        {
          "id": "encaixamento",
          "label": "Aplicar Encaixamento genérico",
          "correct": false,
          "feedback": "Termo inadequado. Em Sistemas Operacionais, a divisão organizada da RAM é chamada de Particionamento."
        },
        {
          "id": "acondicionamento",
          "label": "Aplicar Acondicionamento",
          "correct": false,
          "feedback": "Termo fora do padrão da disciplina. A técnica correta é Particionamento."
        },
        {
          "id": "adicionamento",
          "label": "Aplicar Adicionamento",
          "correct": false,
          "feedback": "Não existe particionamento por adicionamento na organização da memória."
        }
      ]
    },
    {
      "number": 20,
      "title": "Etapa 20 · O Problema dos Tamanhos Diferentes",
      "diagram": "barramento_ram",
      "schematic_step": 20,
      "mode_type": "single",
      "directive": "O SO ocupa 4 MB, o Programa 1 ocupa 6 MB e o Programa 2 ocupa 2 MB. Reconheça a restrição de tamanho e ajuste a regra das partições da RAM.",
      "engineering_note": "Como os programas possuem tamanhos diferentes, o particionamento da RAM deve ser feito em tamanhos diferentes.",
      "options": [
        {
          "id": "tamanhos_diferentes",
          "label": "Programas têm tamanhos diferentes: particionar em tamanhos diferentes",
          "correct": true,
          "feedback": "Partições ajustadas sob medida! Cada programa recebe o espaço proporcional à sua demanda sem transbordar nem sobrar demais."
        },
        {
          "id": "tamanhos_iguais",
          "label": "Códigos executáveis têm tamanhos iguais: particionar em tamanhos iguais",
          "correct": false,
          "feedback": "Falha de alocação. Com partições iguais de 4 MB, o Programa 1 (6 MB) não cabe e o Programa 2 (2 MB) desperdiça metade do bloco."
        },
        {
          "id": "particionamento_existencial",
          "label": "Memória não pode ser particionada: particionamento existencial",
          "correct": false,
          "feedback": "Incorreto. A RAM pode e deve ser particionada logicamente pelo SO em faixas de tamanhos distintos."
        },
        {
          "id": "particionamento_unilateral",
          "label": "Memória não pode ser particionada: particionamento unilateral",
          "correct": false,
          "feedback": "Conceito inválido. O particionamento lógico existe exatamente para acomodar múltiplos programas de tamanhos variados."
        }
      ]
    },
    {
      "number": 21,
      "title": "Etapa 21 · Quando e Como Particionar a RAM",
      "diagram": "barramento_ram",
      "schematic_step": 21,
      "mode_type": "multi",
      "directive": "Configure no controlador de memória da FCTarc13 em que momento e de que maneira as partições lógicas de tamanhos diferentes podem ser definidas.",
      "engineering_note": "O particionamento lógico de tamanhos diferentes pode ser Fixo (definido no início das atividades do SO) ou Variável (ajustado durante as atividades do SO).",
      "aula_options": [
        {
          "id": "fixo_inicio_variavel_durante",
          "label": "Particionamento lógico fixo (início do SO) ou variável (durante o SO) de tamanhos diferentes",
          "correct": true,
          "feedback": "Controlador de RAM calibrado! Fixo nasce na inicialização; Variável se adapta dinamicamente conforme os programas entram e saem."
        },
        {
          "id": "fixo_durante_variavel_inicio",
          "label": "Particionamento lógico fixo (durante o SO) ou variável (no início do SO)",
          "correct": false,
          "feedback": "Inversão temporal! Partições fixas são determinadas no início, enquanto as variáveis se ajustam durante a operação."
        },
        {
          "id": "somente_fixo_durante",
          "label": "Somente particionamento lógico fixo durante as atividades do SO",
          "correct": false,
          "feedback": "Incorreto. Se muda durante as atividades do SO, é variável; fixo é definido no início."
        },
        {
          "id": "somente_variavel_inicio",
          "label": "Somente particionamento lógico variável no início das atividades do SO",
          "correct": false,
          "feedback": "Incorreto. O particionamento variável ocorre justamente durante as atividades conforme surgem processos."
        }
      ],
      "options": [
        {
          "id": "fixo_inicio",
          "label": "Configurar Particionamento Lógico Fixo: definido no início das atividades do SO",
          "correct": true,
          "feedback": "Modo Fixo validado: fronteiras de tamanhos diferentes definidas na partida do SO."
        },
        {
          "id": "variavel_durante",
          "label": "Configurar Particionamento Lógico Variável: ajustado durante as atividades do SO",
          "correct": true,
          "feedback": "Modo Variável validado: regiões criadas sob demanda enquanto os programas executam."
        },
        {
          "id": "fixo_durante_erro",
          "label": "Configurar Particionamento Fixo apenas durante as atividades do SO",
          "correct": false,
          "feedback": "Conflito temporal: particionamento fixo não se remolda durante a operação normal."
        }
      ]
    },
    {
      "number": 22,
      "title": "Etapa 22 · Divisão do Disco em Blocos",
      "diagram": "matriz_disco",
      "schematic_step": 22,
      "mode_type": "single",
      "directive": "Além da RAM, o sistema operacional precisa organizar e controlar outro tipo de memória para armazenar arquivos. Formate a estrutura correta no simulador.",
      "engineering_note": "O armazenamento secundário é organizado pelo sistema de arquivos por meio da divisão do HD em blocos.",
      "options": [
        {
          "id": "hd_blocos",
          "label": "Aplicar divisão do HD em blocos",
          "correct": true,
          "feedback": "Grade de blocos ativada! O HD foi fatiado em blocos numerados (B00 a B15) prontos para receber arquivos."
        },
        {
          "id": "registradores_bits",
          "label": "Divisão dos registradores em mapas de bits",
          "correct": false,
          "feedback": "Incorreto. Registradores armazenam palavras de CPU; quem é fatiado em blocos para arquivos é o HD."
        },
        {
          "id": "cache_associativa",
          "label": "Divisão da memória cache em conjuntos associativos",
          "correct": false,
          "feedback": "Conjuntos associativos são organização de hardware da cache, não armazenamento de arquivos controlado pelo SO."
        },
        {
          "id": "rom_instancias",
          "label": "Divisão da ROM em instâncias",
          "correct": false,
          "feedback": "Incorreto. A ROM é somente leitura e guarda o BIOS, não arquivos gravados pelo usuário."
        }
      ]
    },
    {
      "number": 23,
      "title": "Etapa 23 · Alocação Contígua de Arquivos",
      "diagram": "matriz_disco",
      "schematic_step": 23,
      "mode_type": "multi",
      "directive": "Sistema de Arquivos 1: o arquivo é dividido em blocos, o diretório guarda apenas o endereço do 1º bloco e todos os blocos ficam em sequência, um ao lado do outro.",
      "engineering_note": "Na Alocação Contígua, sabendo o endereço do primeiro bloco e a posição na sequência, encontra-se qualquer bloco do arquivo.",
      "aula_options": [
        {
          "id": "contigua",
          "label": "Alocar arquivo por Alocação Contígua (blocos adjacentes B04 → B05 → B06 → B07)",
          "correct": true,
          "feedback": "Feixe sequencial fechado! Apenas o endereço inicial B04 basta para localizar todos os 4 blocos contíguos."
        },
        {
          "id": "encadeada_err",
          "label": "Identificar como Alocação por Lista Encadeada",
          "correct": false,
          "feedback": "Incorreto. Na lista encadeada os blocos ficam espalhados e cada bloco aponta para o próximo."
        },
        {
          "id": "indice_err",
          "label": "Identificar como Lista Encadeada usando Índice",
          "correct": false,
          "feedback": "Incorreto. Quando todos os blocos precisam ficar lado a lado a partir do 1º endereço, trata-se de Alocação Contígua."
        },
        {
          "id": "noi_err",
          "label": "Identificar como Nó-i (i-node)",
          "correct": false,
          "feedback": "Incorreto. Nó-i utiliza tabelas de endereços para blocos não sequenciais."
        }
      ],
      "options": [
        {
          "id": "contigua_b04",
          "label": "1. Registrar endereço inicial no diretório: B04",
          "correct": true,
          "order": 1,
          "feedback": "Bloco inicial B04 gravado no diretório."
        },
        {
          "id": "contigua_seq",
          "label": "2. Alocar blocos em sequência lado a lado: B05, B06 e B07",
          "correct": true,
          "order": 2,
          "feedback": "Sequência B04–B07 preenchida sem saltos."
        },
        {
          "id": "contigua_nome",
          "label": "3. Confirmar estratégia: Alocação Contígua",
          "correct": true,
          "order": 3,
          "feedback": "Alocação Contígua validada na matriz do disco."
        },
        {
          "id": "contigua_salto",
          "label": "Espalhar blocos entre B02 e B14 com buracos",
          "correct": false,
          "feedback": "Quebra a regra da sequência contígua: o endereço inicial + deslocamento falharia ao ler buracos."
        }
      ]
    },
    {
      "number": 24,
      "title": "Etapa 24 · Alocação por Lista Encadeada",
      "diagram": "matriz_disco",
      "schematic_step": 24,
      "mode_type": "multi",
      "directive": "Sistema de Arquivos 2: os blocos não precisam ficar lado a lado; o 1º bloco guarda o endereço do 2º bloco, o 2º guarda o do 3º e assim por diante.",
      "engineering_note": "Na Alocação por Lista Encadeada, cada bloco aponta para o endereço do bloco seguinte em uma região específica do bloco anterior.",
      "aula_options": [
        {
          "id": "lista_encadeada",
          "label": "Conectar arquivo por Alocação por Lista Encadeada (B02 → B09 → B05 → B14)",
          "correct": true,
          "feedback": "Cadeia de ponteiros ligada! Mesmo espalhados pelo HD, os blocos formam um caminho contínuo de endereços."
        },
        {
          "id": "contigua_err2",
          "label": "Identificar como Alocação Contígua",
          "correct": false,
          "feedback": "Incorreto. Alocação contígua exige blocos vizinhos em sequência física."
        },
        {
          "id": "indice_err2",
          "label": "Identificar como Lista Encadeada usando Índice",
          "correct": false,
          "feedback": "Incorreto. Quando o próprio bloco anterior guarda o ponteiro do próximo, é Lista Encadeada simples."
        },
        {
          "id": "noi_err2",
          "label": "Identificar como Nó-i",
          "correct": false,
          "feedback": "Incorreto. No Nó-i os endereços ficam concentrados em tabelas, não embutidos em cada bloco de dados."
        }
      ],
      "options": [
        {
          "id": "enc_1",
          "label": "1. Gravar no bloco B02 o ponteiro para B09",
          "correct": true,
          "order": 1,
          "feedback": "Ligação B02 → B09 estabelecida."
        },
        {
          "id": "enc_2",
          "label": "2. Gravar no bloco B09 o ponteiro para B05 e de B05 para B14",
          "correct": true,
          "order": 2,
          "feedback": "Cadeia B02 → B09 → B05 → B14 completa."
        },
        {
          "id": "enc_3",
          "label": "3. Confirmar estratégia: Alocação por Lista Encadeada",
          "correct": true,
          "order": 3,
          "feedback": "Alocação por Lista Encadeada validada na matriz."
        },
        {
          "id": "enc_erro_tabela",
          "label": "Remover ponteiros dos blocos e exigir sequência adjacente",
          "correct": false,
          "feedback": "Sem os ponteiros entre blocos espalhados, não é possível encontrar o restante do arquivo."
        }
      ]
    },
    {
      "number": 25,
      "title": "Etapa 25 · Alocação por Nó-i (Tabelas de Índices)",
      "diagram": "matriz_disco",
      "schematic_step": 25,
      "mode_type": "multi",
      "directive": "Sistema de Arquivos 3: os blocos ficam livres pelo disco e todos os endereços são registrados em uma ou mais tabelas organizadas em diferentes níveis.",
      "engineering_note": "No método Nó-i (i-node), os registros de uma ou mais tabelas multinível armazenam os endereços de todos os blocos do arquivo.",
      "aula_options": [
        {
          "id": "noi",
          "label": "Indexar blocos espalhados via Nó-i (tabelas de endereços em níveis)",
          "correct": true,
          "feedback": "Tabela Nó-i sincronizada! Módulo SO 1 (Etapas 01 a 25) finalizado — você conquistou a Joia do Espaço."
        },
        {
          "id": "contigua_err3",
          "label": "Identificar como Alocação Contígua",
          "correct": false,
          "feedback": "Incorreto. Alocação contígua não usa tabelas multinível nem aceita blocos espalhados."
        },
        {
          "id": "encadeada_err3",
          "label": "Identificar como Alocação por Lista Encadeada",
          "correct": false,
          "feedback": "Incorreto. Na lista encadeada o endereço fica no bloco anterior, não em tabelas em diferentes níveis."
        },
        {
          "id": "indice_enc_err3",
          "label": "Identificar como Lista Encadeada usando Índice",
          "correct": false,
          "feedback": "Incorreto. Tabelas organizadas em diferentes níveis por arquivo caracterizam o Nó-i."
        }
      ],
      "options": [
        {
          "id": "noi_tabela",
          "label": "1. Criar registro Nó-i na tabela de índices do arquivo",
          "correct": true,
          "order": 1,
          "feedback": "Tabela Nó-i alocada no diretório de metadados."
        },
        {
          "id": "noi_mapear",
          "label": "2. Apontar na tabela os blocos espalhados B01, B06, B11 e B15 (suportando níveis)",
          "correct": true,
          "order": 2,
          "feedback": "Endereços diretos e indiretos gravados nas tabelas."
        },
        {
          "id": "noi_confirmar",
          "label": "3. Confirmar estratégia: Nó-i (i-node)",
          "correct": true,
          "order": 3,
          "feedback": "Nó-i concluído! Todo o conteúdo de SO 1 (Etapas 01 a 25) está operacional."
        },
        {
          "id": "noi_erro_seq",
          "label": "Exigir blocos lado a lado sem tabela de índices",
          "correct": false,
          "feedback": "Isso descreveria Alocação Contígua, não Nó-i."
        }
      ]
    }
  ]
};

export const SO2_PREVIEWS = {
  "realidade": {
    "module_badge": "Módulo SO 2 · Próximo Semestre",
    "range_label": "Etapas 26 a 33",
    "headline": "Contexto, Mutex e Chamadas de Sistema do Braço Robótico",
    "topics": [
      "Etapas 26–28: Contexto nos registradores, salvamento/recuperação ao expirar quantum e Tabela de Processos na RAM.",
      "Etapas 29–30: Braço robótico como recurso compartilhado com Mutex, evitando monopólio por processos de usuário.",
      "Etapas 31–33: Controle via Chamada de Sistema (Syscall) por chamada a procedimento ao enviar comandos ao robô e finalizar."
    ],
    "notice": "Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Como você está demonstrando a base de SO 1, colete esta joia em modo demonstrativo para completar a Manopla e liberar o Estalo Final."
  },
  "alma": {
    "module_badge": "Módulo SO 2 · Próximo Semestre",
    "range_label": "Etapas 34 a 40",
    "headline": "Interrupções, Vetores, Drivers, Atomicidade e Ciclo de Vida",
    "topics": [
      "Etapas 34–36: Interrupção (como campainha do telefone), Rotina de Tratamento (ISR) e Vetores de Interrupção.",
      "Etapas 37–38: Instalação de Driver atuando como Tradutor entre o sistema operacional e o braço robótico.",
      "Etapas 39–40: Atomicidade do movimento completo do braço e ciclo de vida (Rodando, Bloqueado, Pronto e Concluído)."
    ],
    "notice": "Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Colete-a em modo demonstrativo para somar as seis joias na Manopla e liberar o Estalo Final."
  },
  "mente": {
    "module_badge": "Módulo SO 2 · Próximo Semestre",
    "range_label": "Etapas 43 a 46",
    "headline": "Execução em 1 CPU, Prioridades, Modos Protegidos e MMU",
    "topics": [
      "Etapas 43–44: Impossibilidade de execução física literalmente simultânea na FCTarc e escalonamento Prioritário.",
      "Etapa 45: Separação entre Modo Núcleo (execução protegida do SO) e Modo Usuário (execução desprotegida).",
      "Etapa 46: Unidade de Gerência de Memória (MMU) traduzindo e protegendo endereços em tempo de execução."
    ],
    "notice": "Esta joia pertence ao conteúdo de SO 2 (próximo semestre). Colete-a em modo demonstrativo para completar a Manopla do Infinito e realizar o Estalo Final."
  }
};
