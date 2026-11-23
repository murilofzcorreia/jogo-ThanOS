// Junta o conteúdo técnico (curriculo.mjs) com a história (roteiro.mjs).
// Usado por gerar_slides.mjs, exportar_roteiro.mjs e validar_slides.mjs, para que
// os slides e o ROTEIRO.md mostrem as mesmas letras e os mesmos textos.

import { FASES, SO1_STAGES, SO2_PREVIEWS } from './curriculo.mjs';
import {
  ALAS, CHEGADAS, CONVERSA, CONVERSA_SO2, ETAPAS as ROTEIRO_ETAPAS, EPILOGO, FIM_SO1, PREMISSA, LIMITES,
} from './roteiro.mjs';

export { SO2_PREVIEWS, ALAS, CHEGADAS, CONVERSA, CONVERSA_SO2, EPILOGO, FIM_SO1, PREMISSA, LIMITES };

// Arte de cada personagem (pixel art do projeto; os mentores saem de gerar_personagens.mjs).
// `escala` deixa o Eitri, que é um gigante, maior que os outros nas cenas.
const pers = (id, escala = 1) => ({
  sprite: `personagens/${id}_frente.png`,
  retrato: `personagens/${id}_retrato.png`,
  escala,
});
export const ARTE = {
  Thanos: { sprite: 'thanos/thanos_frente_parado.png', retrato: null, escala: 1 },
  Eitri: pers('eitri', 1.25),
  'Fauce de Ébano': pers('fauce', 1.05),
  Wong: pers('wong'),
  'Doutor Estranho': pers('estranho'),
  Loki: pers('loki'),
  Heimdall: pers('heimdall', 1.08),
};
function exigeArte(nome, onde) {
  if (!ARTE[nome]) throw new Error(`${onde}: personagem sem arte em dados.mjs: ${nome}`);
}
CONVERSA.forEach((c, i) => exigeArte(c.quem, `CONVERSA[${i}]`));
CONVERSA_SO2.forEach((c, i) => exigeArte(c.quem, `CONVERSA_SO2[${i}]`));
for (const [gid, c] of Object.entries(CHEGADAS)) {
  c.elenco.forEach((n) => exigeArte(n, `CHEGADAS.${gid}`));
  c.falas.forEach((f, i) => {
    exigeArte(f.quem, `CHEGADAS.${gid}[${i}]`);
    if (f.quem !== 'Thanos' && !c.elenco.includes(f.quem)) throw new Error(`CHEGADAS.${gid}[${i}]: ${f.quem} fala mas não está no elenco`);
  });
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ordem guiada das alas (ordem do conteúdo = ordem em que Eitri ativa os encaixes)
export const ORDEM = ['poder', 'tempo', 'espaco', 'realidade', 'alma', 'mente'];

const GEM_IMG = {
  poder: 'joia_poder_roxa',
  tempo: 'joia_tempo_verde',
  espaco: 'joia_espaco_azul',
  realidade: 'joia_realidade_vermelha',
  alma: 'joia_alma_laranja',
  mente: 'joia_mente_amarela',
};

export const MONUMENTO = [
  'monumento_0_vazia',
  'monumento_1_poder',
  'monumento_2_tempo',
  'monumento_3_espaco_so1_completo',
  'monumento_4_realidade',
  'monumento_5_alma',
  'monumento_6_completa_pronta',
];

export const GEMS = {};
FASES.forEach((f, i) => {
  GEMS[f.id] = {
    id: f.id,
    nome: f.joia,
    curto: f.nome_curto,
    cor: f.cor.slice(1).toUpperCase(),
    lapidacao: f.lapidacao === 'triangulo' ? 'triângulo' : f.lapidacao,
    modulo: f.modulo,
    faixa: f.faixa,
    altar: i + 1,
    posicao: f.posicao,
    ordem: ORDEM.indexOf(f.id),
    img: `joias/${GEM_IMG[f.id]}.png`,
    contorno: `joias/contorno_${f.id}.png`,
    so1: Boolean(SO1_STAGES[f.id]),
    ala: ALAS[f.id],
  };
});

// Posição da carta certa em cada etapa (A=0 … D=3), fixa e equilibrada.
const POS_CERTA = [2, 0, 3, 1, 1, 3, 0, 2, 3, 2, 1, 0, 0, 1, 2, 3, 2, 3, 0, 1, 3, 0, 2, 1, 0];
const LETRAS = ['A', 'B', 'C', 'D'];

export const ETAPAS = [];
for (const gid of ['poder', 'tempo', 'espaco']) {
  const lista = SO1_STAGES[gid];
  lista.forEach((st, idx) => {
    const corte = st.title.indexOf(' · ');
    const nome = st.title.slice(corte + 3);
    const fonte = st.aula_options || st.options;
    const historia = ROTEIRO_ETAPAS[st.number];
    if (!historia) throw new Error(`roteiro.mjs: falta a etapa ${st.number}`);
    exigeArte(historia.mentor, `etapa ${st.number}`);
    if (fonte.length !== 4) throw new Error(`${st.title}: esperava 4 alternativas`);
    const certa = fonte.filter((o) => o.correct);
    if (certa.length !== 1) throw new Error(`${st.title}: esperava 1 alternativa certa`);
    for (const o of fonte) {
      if (!historia.opcoes[o.id]) throw new Error(`roteiro.mjs: etapa ${st.number} sem rótulo para a opção ${o.id}`);
    }
    for (const id of Object.keys(historia.opcoes)) {
      if (!fonte.some((o) => o.id === id)) throw new Error(`roteiro.mjs: etapa ${st.number} tem opção desconhecida ${id}`);
    }
    const erradas = fonte.filter((o) => !o.correct);
    const r = rng(st.number * 7919);
    for (let i = erradas.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [erradas[i], erradas[j]] = [erradas[j], erradas[i]];
    }
    const ordem = [...erradas];
    ordem.splice(POS_CERTA[st.number - 1], 0, certa[0]);
    ETAPAS.push({
      gid,
      n: st.number,
      nn: pad2(st.number),
      nome,
      titulo: st.title,
      diretriz: st.directive,
      nota: st.engineering_note,
      diagrama: st.diagram,
      mentor: historia.mentor,
      fala: historia.fala,
      idx,
      total: lista.length,
      opcoes: ordem.map((o, i) => ({
        letra: LETRAS[i],
        id: o.id,
        label: historia.opcoes[o.id],
        tecnico: o.label,
        certa: o.correct,
        feedback: o.feedback,
      })),
    });
  });
}
if (ETAPAS.length !== 25) throw new Error('esperava 25 etapas');

// Síntese final (aba ESTALO de tools/gerar_calc.mjs)
export const SINTESE =
  'Todas as 25 etapas de SO 1 foram validadas (Hardware FCTarc13, Braço Robótico Periférico, Kernel de 4 módulos, Persistência e Boot BIOS/ROM → RAM/IC, Escalonamento Multiprogramado, Particionamento Lógico da RAM e Alocação de Disco Contígua, Encadeada e Nó-i) e as 6 Joias do Infinito selaram o Estalo Final.';

// Prévias de SO 2 (rótulos do esquema de fct_schematic.gd)
export const PREVIA_BLOCOS = {
  realidade: [
    ['Contexto + Tabela de Processos (RAM)', 'Etapas 26–28'],
    ['Mutex + Controle contra Monopólio', 'Etapas 29–30'],
    ['Chamada de Sistema (Braço Robótico)', 'Etapas 31–33'],
  ],
  alma: [
    ['Interrupções + Vetores + ISR', 'Etapas 34–36'],
    ['Driver (Tradutor do Braço Robótico)', 'Etapas 37–38'],
    ['Atomicidade + Ciclo de Vida', 'Etapas 39–40'],
  ],
  mente: [
    ['1 CPU Física + Escalonamento Prioritário', 'Etapas 43–44'],
    ['Modo Núcleo (Protegido) vs. Usuário', 'Etapa 45'],
    ['MMU (Gerência e Proteção de Memória)', 'Etapa 46'],
  ],
};
