// Gera o jogo ThanOS como apresentação jogável para o Google Apresentações
// (navegação só por links entre slides), em três versões:
//   ThanOS_SO1.pptx       Apresentação SO 1 (Poder, Tempo e Espaço; termina no "SO 1 concluído")
//   ThanOS_SO2.pptx       Apresentação SO 2 (Realidade, Alma e Mente; termina no estalo)
//   ThanOS_Completo.pptx  o jogo inteiro
//
//   cd tools && npm install && node gerar_slides.mjs && node validar_slides.mjs
//   node gerar_slides.mjs <pasta>   grava as três versões em outra pasta
//
// Mecânica (igual ao TrabalhoSO.pptx de exemplo): cada carta é uma forma com link
// para outro slide. Todo objeto que não é botão tem link para o próprio slide, então
// clicar no fundo não avança a apresentação. A ordem física dos slides é o caminho
// certo; os slides de erro e os créditos ficam no apêndice, no fim.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FASES } from './curriculo.mjs';
import {
  ALAS, ARTE, CHEGADAS, CONVERSA, CONVERSA_SO2, EPILOGO, ETAPAS, FIM_SO1, GEMS, MONUMENTO, ORDEM, PREVIA_BLOCOS, SINTESE, SO2_PREVIEWS, pad2, rng,
} from './dados.mjs';

const require = createRequire(import.meta.url);
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const ART = path.join(ROOT, 'visuais', 'prontos_libreoffice');
// Pasta de saída opcional como argumento (útil para testes ou quando um .pptx está aberto)
const PASTA = path.resolve(process.argv[2] || ROOT);
const MAPA = path.join(TOOLS, 'mapa_slides.json');

const W = 10;
const H = 5.625;

// Paleta do ThanOS (visuais/paleta_e_referencia.md)
const P = {
  VAZIO: '07060C',
  ARDOSIA: '2B2534',
  NOGUEIRA: '3D3049',
  NOGUEIRA_ESC: '231A2C',
  LATAO: 'D9A53F',
  LATAO_CLARO: 'F7D886',
  LATAO_ESC: '8C6322',
  CARTAO: '16111E',
  CARTAO_SOMBRA: '2A2036',
  TINTA: 'F3EAD6',
  TINTA_SUAVE: 'C8B48A',
  SOBRE_OURO: '1A1208',
  LUZ: 'FFFAF0',
  ERRO: 'FF5A5A',
};
const F_TIT = 'Young Serif';
const F_TXT = 'Archivo';

function mix(a, b, t) {
  const pa = [0, 2, 4].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [0, 2, 4].map((i) => parseInt(b.slice(i, i + 2), 16));
  return pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const DIM_LINE = mix(P.TINTA_SUAVE, P.VAZIO, 0.55);

// ---------------------------------------------------------------------------
// Roteiro: ordem física dos slides e chaves para os links
// ---------------------------------------------------------------------------

const K = {
  e: (n) => `e${pad2(n)}`,
  ok: (n) => `e${pad2(n)}_ok`,
  err: (n, l) => `e${pad2(n)}_err_${l}`,
  entrada: (gid) => (GEMS[gid].so1 ? `intro_${gid}` : `previa_${gid}`),
  // o altar do Salão abre a cena de chegada, quando a ala tem uma
  chegada: (gid) => (CHEGADAS[gid] ? `chegada_${gid}_1` : (GEMS[gid].so1 ? `intro_${gid}` : `previa_${gid}`)),
};

const ROTEIRO = [];
function add(key, tipo, build, extra = {}) {
  ROTEIRO.push({ key, tipo, build, ...extra });
}

// ---------------------------------------------------------------------------
// Construção de um slide
// ---------------------------------------------------------------------------

let pres;
let NUM = {};

// As três apresentações saem do mesmo jogo; cada versão escolhe as joias que entram.
const VERSOES = [
  {
    id: 'so1', titulo: 'Apresentação SO 1', arquivo: 'ThanOS_SO1.pptx',
    descricao: 'Joias do Poder, do Tempo e do Espaço · 25 etapas', gemas: ['poder', 'tempo', 'espaco'], conversa: CONVERSA,
  },
  {
    id: 'so2', titulo: 'Apresentação SO 2', arquivo: 'ThanOS_SO2.pptx',
    descricao: 'Joias da Realidade, da Alma e da Mente', gemas: ['realidade', 'alma', 'mente'], conversa: CONVERSA_SO2,
  },
  {
    id: 'completo', titulo: 'Jogo completo', arquivo: 'ThanOS_Completo.pptx',
    descricao: 'SO 1 e SO 2 · as seis Joias do Infinito', gemas: ORDEM, conversa: CONVERSA,
  },
];
for (const v of VERSOES) {
  v.inicio = GEMS[v.gemas[0]].ordem; // Salão onde a versão começa (joias já na Manopla)
  v.fimSalao = GEMS[v.gemas[v.gemas.length - 1]].ordem + 1; // Salão depois da última joia
  v.fim = v.fimSalao === 6 ? 'conclusao' : 'fim_so1';
}
let V = VERSOES[2]; // versão em montagem
const L = (key) => {
  const n = NUM[key];
  if (!n) throw new Error(`link para slide inexistente: ${key}`);
  return n;
};

function limpa(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

class SB {
  constructor(num) {
    this.s = pres.addSlide();
    this.num = num;
    this.s.background = { color: P.VAZIO };
  }

  link(target) {
    return { slide: target ?? this.num };
  }

  rect(x, y, w, h, o = {}) {
    this.s.addShape(o.shape || pres.shapes.RECTANGLE, limpa({
      x, y, w, h,
      fill: o.fill ? { color: o.fill, transparency: o.transparency || 0 } : { type: 'none' },
      line: o.line ? { color: o.line, width: o.lineW || 1, dashType: o.dash || 'solid' } : { type: 'none' },
      shadow: o.shadow ? { type: 'outer', color: '000000', opacity: 0.5, blur: 6, offset: 4, angle: 90 } : undefined,
      hyperlink: this.link(o.link),
    }));
  }

  // content: string ou lista de [texto, opções] (cada item vira um run)
  text(content, x, y, w, h, o = {}) {
    const runOpts = (ro = {}) => limpa({
      lang: 'pt-BR',
      fontFace: ro.font || o.font || F_TXT,
      fontSize: ro.size || o.size || 12,
      color: ro.color || o.color || P.TINTA,
      bold: ro.bold ?? o.bold ?? false,
      italic: ro.italic ?? false,
      charSpacing: ro.charSpacing ?? o.charSpacing,
      breakLine: ro.breakLine,
      paraSpaceAfter: ro.psa,
    });
    const runs = typeof content === 'string'
      ? [{ text: content, options: runOpts() }]
      : content.map(([t, ro]) => ({ text: t, options: runOpts(ro) }));
    // O pptxgenjs só cria a relação do link da forma quando o mesmo objeto de link
    // também está num trecho de texto. O link de trecho é removido depois.
    const hl = this.link(o.link);
    runs[0].options.hyperlink = hl;
    const base = limpa({
      x, y, w, h,
      align: o.align || 'left',
      valign: o.valign || 'top',
      margin: o.margin ?? 0,
      lineSpacingMultiple: o.lsm,
      fit: 'none',
      hyperlink: hl,
      ...runOpts(),
    });
    delete base.breakLine;
    if (o.fill || o.line) {
      base.shape = pres.shapes.RECTANGLE;
      base.fill = o.fill ? { color: o.fill, transparency: o.transparency || 0 } : { type: 'none' };
      if (o.line) base.line = { color: o.line, width: o.lineW || 1, dashType: o.dash || 'solid' };
    } else {
      base.isTextBox = true;
    }
    this.s.addText(runs, base);
  }

  img(file, x, y, w, h, o = {}) {
    this.s.addImage(limpa({
      path: path.join(ART, file),
      x, y, w, h,
      altText: o.alt || path.basename(file, '.png').replace(/_/g, ' '),
      transparency: o.transparency,
      hyperlink: this.link(o.link),
    }));
  }

  line(x1, y1, x2, y2, color, width = 1, o = {}) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    this.s.addShape(pres.shapes.LINE, limpa({
      x, y,
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
      flipH: (x2 < x1) !== (y2 < y1) ? true : undefined,
      line: { color, width },
      hyperlink: this.link(o.link),
    }));
  }

  notes(t) {
    this.s.addNotes(t);
  }
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

function fundo(s) {
  s.rect(0, 0, W, H, { fill: P.VAZIO });
}

function estrelas(s, areas, qtd = 18, seed = 3) {
  const r = rng(seed);
  for (let i = 0; i < qtd; i++) {
    const a = areas[i % areas.length];
    const d = r() < 0.25 ? 0.045 : 0.028;
    s.rect(a[0] + r() * (a[2] - d), a[1] + r() * (a[3] - d), d, d, {
      shape: pres.shapes.OVAL,
      fill: r() < 0.3 ? P.LATAO_CLARO : P.TINTA,
      transparency: r() < 0.5 ? 20 : 55,
    });
  }
}

function painel(s, x, y, w, h, o = {}) {
  s.rect(x, y, w, h, { fill: o.fill || P.CARTAO, line: o.line || P.LATAO, lineW: o.lineW || 1.25, shadow: o.shadow ?? true });
}

function botao(s, label, x, y, w, h, target, tipo = 'principal') {
  const principal = tipo === 'principal';
  s.text(label, x, y, w, h, {
    fill: principal ? P.LATAO : P.CARTAO,
    line: principal ? P.LATAO_CLARO : mix(P.TINTA_SUAVE, P.CARTAO, 0.3),
    lineW: 1,
    color: principal ? P.SOBRE_OURO : P.TINTA,
    bold: true,
    size: 13,
    align: 'center',
    valign: 'middle',
    link: target,
  });
}

function molduraJoia(s, gid, x, y, lado, o = {}) {
  const g = GEMS[gid];
  s.rect(x, y, lado, lado, { fill: mix(P.CARTAO, g.cor, 0.12), line: P.LATAO, lineW: 1.75, link: o.link });
  const t = lado * 0.62;
  s.img(g.img, x + (lado - t) / 2, y + (lado - t) / 2, t, t, { alt: g.nome, link: o.link });
}

function cabecalhoEtapa(s, et, modo) {
  const g = GEMS[et.gid];
  s.img(g.img, 0.45, 0.33, 0.34, 0.34, { alt: g.nome });
  s.text(`${g.nome.toUpperCase()} · ETAPA ${et.nn} DE 25`, 0.88, 0.33, 4.8, 0.34, {
    size: 10, bold: true, color: P.LATAO, charSpacing: 1, valign: 'middle',
  });
  const n = et.total;
  const lado = 0.13;
  const gap = 0.07;
  const larg = n * lado + (n - 1) * gap;
  const x0 = 9.52 - larg;
  const yc = 0.5 - lado / 2;
  s.text(`${et.idx + 1} de ${n} nesta ala`, x0 - 1.75, 0.33, 1.6, 0.34, {
    size: 9, color: P.TINTA_SUAVE, align: 'right', valign: 'middle',
  });
  for (let i = 0; i < n; i++) {
    const feito = i < et.idx || (i === et.idx && modo === 'ok');
    const atual = i === et.idx && modo !== 'ok';
    s.rect(x0 + i * (lado + gap), yc, lado, lado, {
      fill: feito ? g.cor : atual ? P.CARTAO : P.NOGUEIRA,
      line: atual ? P.LATAO_CLARO : feito ? g.cor : P.NOGUEIRA,
      lineW: atual ? 1.5 : 0.75,
    });
  }
}

// estilo: 'jogo' (clicável), 'ok' (escolha certa), 'erro' (escolha errada)
function carta(s, et, op, x, y, w, h, estilo, target) {
  const g = GEMS[et.gid];
  const fill = estilo === 'ok' ? mix(P.CARTAO_SOMBRA, g.cor, 0.2) : P.CARTAO_SOMBRA;
  const line = estilo === 'ok' ? g.cor : estilo === 'erro' ? P.ERRO : mix(P.TINTA_SUAVE, P.CARTAO, 0.45);
  s.rect(x, y, w, h, { fill, line, lineW: estilo === 'jogo' ? 1 : 1.5, link: target });
  const b = 0.4;
  s.text(op.letra, x + 0.14, y + (h - b) / 2, b, b, {
    fill: estilo === 'ok' ? g.cor : estilo === 'erro' ? P.NOGUEIRA : P.LATAO,
    color: estilo === 'erro' ? P.TINTA : P.SOBRE_OURO,
    bold: true, size: 14, align: 'center', valign: 'middle', link: target,
  });
  s.text(op.label, x + 0.7, y + 0.04, w - 0.85, h - 0.08, { size: 12, color: P.TINTA, valign: 'middle', link: target });
}

// ---------------------------------------------------------------------------
// Esquemas da bancada (regras de GitHub/thanOS/scripts/ui/fct_schematic.gd)
// Antes da resposta, as peças que ainda não foram acopladas aparecem sem nome,
// para o esquema não entregar a configuração certa.
// ---------------------------------------------------------------------------

const LEGENDA = {
  placa_fctarc: 'BANCADA · PLACA FCTarc13',
  arquitetura_so: 'BANCADA · CAMADAS DO FCTos01',
  persistencia_boot: 'BANCADA · ENERGIA E PARTIDA',
  escalonador: 'BANCADA · EXECUÇÃO NA CPU',
  barramento_ram: 'BANCADA · MEMÓRIA PRINCIPAL',
  matriz_disco: 'BANCADA · ARMAZENAMENTO',
};

function dbox(c, x, y, w, h, label, on, sub, fs = 9.5) {
  const runs = [[label, { size: fs, bold: true, color: on ? P.LUZ : P.TINTA_SUAVE, breakLine: Boolean(sub) }]];
  if (sub) runs.push([sub, { size: 8.5, color: on ? P.LATAO_CLARO : mix(P.TINTA_SUAVE, P.VAZIO, 0.25) }]);
  c.s.text(runs, x, y, w, h, {
    fill: on ? mix(P.CARTAO_SOMBRA, c.g.cor, 0.2) : P.CARTAO,
    line: on ? c.g.cor : DIM_LINE,
    lineW: on ? 1.5 : 0.75,
    align: 'center',
    valign: 'middle',
    margin: 2,
  });
}

function dline(c, x1, y1, x2, y2, on) {
  c.s.line(x1, y1, x2, y2, on ? c.g.cor : mix(P.LATAO_ESC, P.VAZIO, 0.35), on ? 2 : 1);
}

function moldura(c, x, y, w, h, on, titulo, tituloOn) {
  c.s.rect(x, y, w, h, { fill: P.NOGUEIRA_ESC, line: on === 'gem' ? c.g.cor : on ? P.LATAO : DIM_LINE, lineW: on ? 1.5 : 0.75 });
  if (titulo) {
    c.s.text(titulo, x + 0.1, y + 0.06, w - 0.2, 0.22, {
      size: 8.5, bold: true, color: tituloOn ? P.LATAO_CLARO : P.TINTA_SUAVE, valign: 'middle', charSpacing: 0.5,
    });
  }
}

const DIAGRAMAS = {
  placa_fctarc(c) {
    const { n, ok } = c;
    const mapeada = n > 1 || ok;
    const hw = n >= 3 || (n === 2 && ok);
    const braco = (n === 3 && ok) || n > 3;
    const bx = c.x;
    const by = c.y;
    const bw = c.w;
    const bh = 2.25;
    moldura(c, bx, by, bw, bh, mapeada, mapeada ? 'PLACA-MÃE · MAPEADA' : 'PLACA-MÃE · A MAPEAR', mapeada);
    const cw = (bw - 0.3) / 2;
    const ch = 0.74;
    const cols = [bx + 0.1, bx + bw - 0.1 - cw];
    const rows = [by + 0.36, by + bh - 0.1 - ch];
    const centro = [bx + bw / 2, (rows[0] + ch + rows[1]) / 2];
    const itens = hw
      ? [['CPU', 'Processador'], ['RAM', 'Principal'], ['HD / SSD', 'Secundária'], ['E/S', 'Periféricos']]
      : [['Soquete 1', 'vazio'], ['Soquete 2', 'vazio'], ['Soquete 3', 'vazio'], ['Soquete 4', 'vazio']];
    const pos = [[cols[0], rows[0]], [cols[1], rows[0]], [cols[0], rows[1]], [cols[1], rows[1]]];
    pos.forEach(([x, y]) => dline(c, x + cw / 2, y + ch / 2, centro[0], centro[1], hw));
    c.s.rect(centro[0] - 0.08, centro[1] - 0.08, 0.16, 0.16, { shape: pres.shapes.OVAL, fill: hw ? c.g.cor : P.LATAO_ESC });
    pos.forEach(([x, y], i) => dbox(c, x, y, cw, ch, itens[i][0], hw, itens[i][1]));

    const ay = by + bh + 0.3;
    const ah = c.h - bh - 0.3;
    const ex = cols[1] + cw / 2;
    dline(c, ex, rows[1] + ch, ex, ay, braco || hw);
    c.s.rect(bx, ay, bw, ah, { fill: P.CARTAO, line: braco ? c.g.cor : DIM_LINE, lineW: braco ? 1.5 : 0.75 });
    c.s.text('BRAÇO ROBÓTICO', bx + 0.1, ay + 0.07, bw - 0.2, 0.22, { size: 9, bold: true, color: P.TINTA, align: 'center' });
    c.s.text(braco ? 'DISPOSITIVO PERIFÉRICO' : n >= 3 ? 'aguardando classificação' : 'aguardando conexão', bx + 0.1, ay + ah - 0.3, bw - 0.2, 0.22, {
      size: 8.5, bold: braco, color: braco ? P.LATAO_CLARO : P.TINTA_SUAVE, align: 'center',
    });
    // braço desenhado com linhas
    const ox = bx + bw / 2 - 0.12;
    const oy = ay + ah / 2 + 0.02;
    const cor = braco ? P.LATAO_CLARO : mix(P.TINTA_SUAVE, P.VAZIO, 0.5);
    const junta = braco ? c.g.cor : P.NOGUEIRA;
    c.s.rect(ox - 0.2, oy + 0.2, 0.4, 0.07, { fill: cor });
    c.s.line(ox, oy + 0.2, ox - 0.04, oy + 0.03, cor, 3);
    c.s.line(ox - 0.04, oy + 0.03, ox + 0.14, oy - 0.15, cor, 2.5);
    c.s.line(ox + 0.14, oy - 0.15, ox + 0.33, oy - 0.03, cor, 2);
    c.s.line(ox + 0.33, oy - 0.03, ox + 0.41, oy - 0.09, cor, 1.5);
    c.s.line(ox + 0.33, oy - 0.03, ox + 0.41, oy + 0.03, cor, 1.5);
    for (const [jx, jy] of [[ox - 0.04, oy + 0.03], [ox + 0.14, oy - 0.15]]) {
      c.s.rect(jx - 0.045, jy - 0.045, 0.09, 0.09, { shape: pres.shapes.OVAL, fill: junta });
    }
  },

  arquitetura_so(c) {
    const { n, ok } = c;
    const progs = n > 4 || (n === 4 && ok);
    const funcs = n > 5 || (n === 5 && ok);
    const kernel = n > 6 || (n === 6 && ok);
    const mods = n === 7 && ok;
    const pw = (c.w - 0.1) / 2;
    const x2 = c.x + pw + 0.1;
    let y = c.y;
    dbox(c, c.x, y, pw, 0.56, 'Programa 1', progs, progs ? 'Vertical · em turnos' : 'aguardando');
    dbox(c, x2, y, pw, 0.56, 'Programa 2', progs, progs ? 'Horizontal · em turnos' : 'aguardando');
    dline(c, c.x + pw / 2, y + 0.56, c.x + pw / 2, y + 0.7, funcs);
    dline(c, x2 + pw / 2, y + 0.56, x2 + pw / 2, y + 0.7, funcs);
    y += 0.7;
    dbox(c, c.x, y, pw, 0.62, funcs ? 'Máquina Estendida' : 'Função 1', funcs, funcs ? 'Base p/ programação' : 'aguardando');
    dbox(c, x2, y, pw, 0.62, funcs ? 'Gerente de Recursos' : 'Função 2', funcs, funcs ? 'Uso organizado' : 'aguardando');
    y += 0.77;
    const kh = 1.5;
    moldura(c, c.x, y, c.w, kh, mods ? 'gem' : kernel, kernel ? 'NÚCLEO · TAREFAS DEFINIDAS' : 'NÚCLEO (KERNEL FCTos01)', kernel);
    const mw = (c.w - 0.3) / 2;
    const mh = 0.48;
    const nomes = mods
      ? ['Escalonador', 'Ger. Memória', 'Sist. Arquivos', 'Software de E/S']
      : ['Módulo 1', 'Módulo 2', 'Módulo 3', 'Módulo 4'];
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => {
      dbox(c, c.x + 0.1 + i * (mw + 0.1), y + 0.38 + j * (mh + 0.1), mw, mh, nomes[k], mods);
    });
    y += kh + 0.13;
    dbox(c, c.x, y, c.w, 0.6, 'Hardware FCTarc13', true, 'CPU · RAM · HD/SSD · Braço');
  },

  persistencia_boot(c) {
    const { n, ok } = c;
    const energia = n >= 10;
    const disco = n > 8 || (n === 8 && ok);
    const permanente = n > 9 || (n === 9 && ok);
    const rom = n > 10 || (n === 10 && ok);
    const entrega = n === 11 && ok;
    const cw = (c.w - 0.1) / 2;
    let y = c.y;
    dbox(c, c.x, y, c.w, 0.36, energia ? 'ENERGIA: LIGADA' : 'ENERGIA: DESLIGADA', energia);
    y += 0.46;
    dbox(c, c.x, y, cw, 0.66, disco ? 'HD / SSD' : 'Destino do SO', disco, disco ? (permanente ? 'Permanente (SO + progs)' : 'Não volátil') : 'aguardando');
    dbox(c, c.x + cw + 0.1, y, cw, 0.66, rom ? 'Memória ROM' : 'Firmware', rom, rom ? 'BIOS de inicialização' : 'aguardando');
    y += 0.76;
    const th = 1.72;
    moldura(c, c.x, y, c.w, th, rom ? 'gem' : false, 'PARTIDA DA FCTarc13', rom);
    const passos = rom
      ? ['1 · Setup', '2 · POST (autoteste)', '3 · Descompacta dados', '4 · Lê o disco', '5 · Carrega o SO']
      : ['Passo 1', 'Passo 2', 'Passo 3', 'Passo 4', 'Passo 5'];
    passos.forEach((p, i) => dbox(c, c.x + 0.1, y + 0.34 + i * 0.27, c.w - 0.2, 0.23, p, rom, undefined, 9));
    y += th + 0.1;
    dbox(c, c.x, y, cw, 0.66, 'Memória RAM', entrega, entrega ? 'Núcleo carregado' : 'Volátil (aguardando)');
    dbox(c, c.x + cw + 0.1, y, cw, 0.66, entrega ? 'IC + Reg. Scheduler' : 'Registradores', entrega, entrega ? '1ª instr. do Escalonador' : 'aguardando');
  },

  escalonador(c) {
    const { n, ok } = c;
    const turnos = n > 12 || (n === 12 && ok);
    const fila = n > 13 || (n === 13 && ok);
    const multi = n > 14 || (n === 14 && ok);
    const proc = n > 15 || (n === 15 && ok);
    const ger = n === 16 && ok;
    const qw = (c.w - 0.2) / 3;
    const fx = [0, 1, 2].map((i) => c.x + i * (qw + 0.1));
    const cpu = { x: c.x + 0.25, y: c.y + 1.05, w: c.w - 0.5, h: 0.7 };
    const alvo = [-0.45, 0, 0.45].map((d) => cpu.x + cpu.w / 2 + d);
    fx.forEach((x, i) => dline(c, x + qw / 2, c.y + 0.62, alvo[i], cpu.y, fila));
    dbox(c, fx[0], c.y, qw, 0.62, 'SO', fila || turnos, 'FCTos01');
    dbox(c, fx[1], c.y, qw, 0.62, 'P1', fila, 'Programa 1');
    dbox(c, fx[2], c.y, qw, 0.62, 'P2', fila, 'Programa 2');
    dbox(c, cpu.x, cpu.y, cpu.w, cpu.h, turnos ? 'CPU · turnos' : 'CPU', turnos, turnos ? (multi ? 'Sistema multiprogramado' : 'Escalonamento') : 'aguardando');
    const py = c.y + 2.0;
    moldura(c, c.x, py, c.w, 1.4, proc || ger ? 'gem' : false, 'CICLO DE PROCESSO', proc);
    const lw = (c.w - 0.4) / 3;
    const caixas = [
      [proc ? 'Etapas' : 'pendente', proc],
      [proc ? 'Elementos' : 'pendente', proc],
      [ger ? 'Gerência do SO' : 'pendente', ger],
    ];
    caixas.forEach(([t, on], i) => dbox(c, c.x + 0.1 + i * (lw + 0.1), py + 0.5, lw, 0.66, t, on, undefined, on ? 9.5 : 8.5));
  },

  barramento_ram(c) {
    const { n, ok } = c;
    const ligada = n > 17 || (n === 17 && ok);
    const busca = n > 18 || (n === 18 && ok);
    const part = n > 19 || (n === 19 && ok);
    const sob = n > 20 || (n === 20 && ok);
    const modos = n === 21 && ok;
    dbox(c, c.x, c.y, c.w, 0.62, 'CPU FCTarc13', busca, busca ? 'Busca instruções na RAM' : 'aguardando');
    dline(c, c.x + c.w / 2, c.y + 0.62, c.x + c.w / 2, c.y + 0.95, busca);
    const ry = c.y + 0.95;
    const rh = 1.35;
    c.s.rect(c.x, ry, c.w, rh, { fill: P.CARTAO, line: part ? c.g.cor : P.LATAO_ESC, lineW: 1.5 });
    c.s.text(ligada ? 'RAM · 12 MB · ENQUANTO LIGADA' : 'RAM · 12 MB', c.x + 0.1, ry + 0.06, c.w - 0.2, 0.22, {
      size: 8.5, bold: true, color: P.LATAO_CLARO, valign: 'middle', charSpacing: 0.5,
    });
    const ix = c.x + 0.08;
    const iw = c.w - 0.16;
    const iy = ry + 0.36;
    const ih = rh - 0.46;
    if (sob) {
      const ws = [iw * 0.32, iw * 0.44];
      ws.push(iw - ws[0] - ws[1] - 0.08);
      const dados = [['SO', '4 MB'], ['Programa 1', '6 MB'], ['P2', '2 MB']];
      let x = ix;
      ws.forEach((w, i) => {
        dbox(c, x, iy, w, ih, dados[i][0], true, dados[i][1]);
        x += w + 0.04;
      });
    } else if (part) {
      const w = (iw - 0.08) / 3;
      ['SO', 'Prog 1', 'Prog 2'].forEach((t, i) => dbox(c, ix + i * (w + 0.04), iy, w, ih, t, true, 'partição'));
    } else {
      dbox(c, ix, iy, iw, ih, 'SO + Programa 1 + Programa 2', ligada, ligada ? 'em execução' : 'aguardando');
    }
    const fy = ry + rh + 0.15;
    const pw = (c.w - 0.1) / 2;
    dbox(c, c.x, fy, pw, 0.66, modos ? 'Lógico fixo' : 'Modo A', modos, modos ? 'No início do SO' : 'aguardando');
    dbox(c, c.x + pw + 0.1, fy, pw, 0.66, modos ? 'Lógico variável' : 'Modo B', modos, modos ? 'Durante as atividades' : 'aguardando');
    const nota = sob ? 'Partições sob medida: 4 + 6 + 2 = 12 MB' : part ? 'Partições de tamanho igual' : '';
    if (nota) c.s.text(nota, c.x, fy + 0.78, c.w, 0.26, { size: 9, color: P.TINTA_SUAVE, align: 'center' });
  },

  matriz_disco(c) {
    const { n, ok } = c;
    const blocos = n > 22 || (n === 22 && ok);
    let ativos = [];
    if (ok && n === 22) ativos = [...Array(16).keys()];
    if (ok && n === 23) ativos = [4, 5, 6, 7];
    if (ok && n === 24) ativos = [2, 9, 5, 14];
    if (ok && n === 25) ativos = [1, 6, 11, 15];
    const gh = 2.2;
    if (!blocos) {
      dbox(c, c.x, c.y, c.w, gh, 'HD da FCTarc13', false, 'sem organização');
    } else {
      const cw = (c.w - 0.18) / 4;
      const ch = (gh - 0.18) / 4;
      const centro = (i) => [c.x + (i % 4) * (cw + 0.06) + cw / 2, c.y + Math.floor(i / 4) * (ch + 0.06) + ch / 2 + 0.1];
      for (let i = 0; i < 16; i++) {
        const on = ativos.includes(i);
        c.s.text(`B${pad2(i)}`, c.x + (i % 4) * (cw + 0.06), c.y + Math.floor(i / 4) * (ch + 0.06), cw, ch, {
          fill: on ? mix(P.CARTAO_SOMBRA, c.g.cor, 0.25) : P.CARTAO,
          line: on ? c.g.cor : DIM_LINE,
          lineW: on ? 1.5 : 0.75,
          size: 9.5, bold: true, color: on ? P.LUZ : P.TINTA_SUAVE,
          align: 'center', valign: n === 24 && ok ? 'top' : 'middle', margin: 2,
        });
      }
      if (n === 24 && ok) {
        for (let i = 0; i < ativos.length - 1; i++) {
          const [x1, y1] = centro(ativos[i]);
          const [x2, y2] = centro(ativos[i + 1]);
          dline(c, x1, y1, x2, y2, true);
        }
      }
    }
    const my = c.y + gh + 0.15;
    const mh = c.h - gh - 0.15;
    const meta = {
      22: ok ? ['HD EM BLOCOS', 'Dividido em 16 blocos lógicos (B00 a B15), prontos para receber arquivos.'] : ['HD', 'Aguardando a organização do armazenamento secundário.'],
      23: ok ? ['ALOCAÇÃO CONTÍGUA', '1º bloco no diretório: B04\nSequência: B04 → B05 → B06 → B07'] : ['SISTEMA DE ARQUIVOS 1', 'Arquivo de 4 blocos aguardando alocação.'],
      24: ok ? ['LISTA ENCADEADA', '1º bloco: B02\nB02 → B09 → B05 → B14'] : ['SISTEMA DE ARQUIVOS 2', 'Arquivo de 4 blocos aguardando alocação.'],
      25: ok ? ['NÓ-I (TABELA DE ÍNDICES)', 'Tabela nível 1:\n[0] B01 · [1] B06 · [2] B11 · [3] B15'] : ['SISTEMA DE ARQUIVOS 3', 'Arquivo de 4 blocos aguardando alocação.'],
    }[n];
    c.s.rect(c.x, my, c.w, mh, { fill: P.CARTAO, line: ok ? c.g.cor : P.LATAO_ESC, lineW: ok ? 1.5 : 1 });
    c.s.text([
      [meta[0], { size: 9, bold: true, color: P.LATAO_CLARO, charSpacing: 0.5, breakLine: true, psa: 4 }],
      [meta[1], { size: 10, color: P.TINTA }],
    ], c.x + 0.12, my + 0.1, c.w - 0.24, mh - 0.2, { valign: 'top' });
  },
};

// Região do esquema nas telas de etapa
const RE = { x: 6.4, y: 0.76, w: 3.12, h: 4.5 };

function esquema(s, et, aceso, erro = false) {
  const g = GEMS[et.gid];
  s.rect(RE.x, RE.y, RE.w, RE.h, { fill: P.VAZIO, line: erro ? P.ERRO : aceso ? g.cor : P.LATAO_ESC, lineW: 1.5 });
  s.rect(RE.x + 0.03, RE.y + 0.03, RE.w - 0.06, 0.36, { fill: P.CARTAO });
  s.text(LEGENDA[et.diagrama], RE.x + 0.14, RE.y + 0.03, RE.w - 0.28, 0.36, {
    size: 8.5, bold: true, color: P.LATAO_CLARO, charSpacing: 0.5, valign: 'middle',
  });
  const c = { s, g, n: et.n, ok: aceso, x: RE.x + 0.13, y: RE.y + 0.55, w: RE.w - 0.26, h: RE.h - 0.67 };
  DIAGRAMAS[et.diagrama](c);
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

function slideCapa(s) {
  fundo(s);
  estrelas(s, [[0.05, 0.05, 2.2, 5.5]], 14, 11);
  s.img('cenario/salao_2x.png', 2.34, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
  s.rect(2.34, 0, 7.66, 5.625, { fill: P.VAZIO, transparency: 55 });
  s.img(`manopla/${MONUMENTO[V.inicio]}.png`, 5.6, 1.75, 1.45, 1.9, { alt: `Manopla do Infinito com ${V.inicio} de 6 joias` });
  s.img('thanos/thanos_costas_parado.png', 6.06, 3.85, 0.54, 0.72, { alt: 'Thanos' });
  s.img('logo_thanos.png', 0.4, 0.3, 5.3, 5.3 * 246 / 1131, { alt: 'ThanOS, um jogo de Sistemas Operacionais' });
  painel(s, 0.4, 1.72, 3.9, 3.55);
  s.text(V.titulo.toUpperCase(), 0.7, 1.92, 3.3, 0.28, { size: 11, bold: true, color: P.LATAO, charSpacing: 1.5, valign: 'middle' });
  s.text('Trabalho de Sistemas Operacionais · FCT/UNESP', 0.7, 2.2, 3.3, 0.26, { size: 10, color: P.TINTA_SUAVE, valign: 'middle' });
  s.text('Reúna as seis Joias do Infinito montando o FCTos01, o sistema operacional da FCTarc13.', 0.7, 2.52, 3.3, 0.66, { size: 12 });
  botao(s, 'Iniciar', 0.7, 3.24, 3.3, 0.48, L('conversa_1'));
  botao(s, 'Mapa das joias', 0.7, 3.82, 3.3, 0.4, L('mapa'), 'secundario');
  botao(s, 'Créditos', 0.7, 4.3, 3.3, 0.4, L('creditos'), 'secundario');
  s.text(V.descricao, 0.7, 4.82, 3.3, 0.3, { size: 9.5, color: P.TINTA_SUAVE, valign: 'middle' });
  s.notes(`Capa da ${V.titulo}. Clique em Iniciar. Jogue sempre clicando: as setas do teclado avançam pela ordem dos slides sem validar escolhas.`);
}

// Cena com diálogo (conversa de abertura e chegadas às alas): uma fala por slide.
// Thanos fica à esquerda e o elenco da cena à direita; quem fala fica em destaque.
const PE = 2.85; // linha do chão dos personagens

function slideCena(s, cena, i) {
  const fala = cena.falas[i];
  const n = cena.falas.length;
  const ultima = i === n - 1;
  fundo(s);
  if (cena.gid) {
    // chegada a uma ala: céu estrelado, chão na cor da joia e a joia brilhando no centro
    const g = GEMS[cena.gid];
    estrelas(s, [[0.05, 0.05, 9.9, 2.7]], 26, 70 + i);
    s.rect(0, PE - 0.05, W, H - PE + 0.05, { fill: mix(P.VAZIO, g.cor, 0.1) });
    s.rect(4.0, 0.95, 2.0, 2.0, { shape: pres.shapes.OVAL, fill: g.cor, transparency: 86 });
    s.rect(4.35, 1.3, 1.3, 1.3, { shape: pres.shapes.OVAL, fill: g.cor, transparency: 76 });
    s.img(g.img, 4.55, 1.5, 0.9, 0.9, { alt: g.nome });
    s.text(cena.lugar, 0.4, 0.28, 6.0, 0.5, { font: F_TIT, size: 22, color: P.LATAO_CLARO, valign: 'middle' });
    s.text(`Chegada à ala da ${g.nome}`, 0.4, 0.78, 6.0, 0.3, { size: 10.5, color: P.TINTA_SUAVE, valign: 'middle' });
  } else {
    // abertura: o Salão de Titã com a Manopla vazia
    estrelas(s, [[0.05, 0.6, 1.05, 2.8], [8.9, 0.6, 1.05, 2.8]], 12, 60 + i);
    s.img('cenario/salao_2x.png', 1.17, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
    s.rect(0, 0, W, H, { fill: P.VAZIO, transparency: 45 });
    s.img(`manopla/${MONUMENTO[V.inicio]}.png`, 4.35, 1.05, 1.3, 1.7, { alt: `Manopla do Infinito com ${V.inicio} de 6 joias` });
  }

  const xs = cena.elenco.length === 1 ? [7.05] : [6.35, 7.95];
  const elenco = [{ nome: 'Thanos', cx: 2.85 }, ...cena.elenco.map((nome, k) => ({ nome, cx: xs[k] }))];
  for (const p of elenco) {
    const arte = ARTE[p.nome];
    const w = 1.2 * arte.escala;
    const h = 1.6 * arte.escala;
    const falando = p.nome === fala.quem;
    s.img(arte.sprite, p.cx - w / 2, PE - h, w, h, { alt: p.nome, transparency: falando ? undefined : 50 });
    if (falando) s.text('▼', p.cx - 0.2, PE - h - 0.38, 0.4, 0.3, { size: 14, color: P.LATAO, align: 'center', valign: 'middle' });
  }

  painel(s, 0.4, 3.5, 9.2, 1.78);
  const nome = fala.quem.toUpperCase();
  s.text(nome, 0.6, 3.24, Math.max(1.5, 0.15 * nome.length + 0.5), 0.34, {
    fill: P.LATAO, line: P.LATAO_CLARO, lineW: 0.75, color: P.SOBRE_OURO, bold: true, size: 11, charSpacing: 1.5, align: 'center', valign: 'middle',
  });
  s.text(fala.fala, 0.7, 3.72, 8.6, 0.95, { size: 16, valign: 'top' });
  s.text(`${i + 1} / ${n}`, 0.7, 4.78, 0.9, 0.32, { size: 10, color: P.TINTA_SUAVE, valign: 'middle' });
  if (cena.dica && i === 0) {
    s.text(cena.dica, 1.6, 4.78, 5.6, 0.32, { size: 9.5, color: P.TINTA_SUAVE, valign: 'middle' });
  }
  if (ultima) botao(s, cena.fimRotulo, 7.3, 4.72, 2.1, 0.42, L(cena.fim));
  else {
    botao(s, 'Continuar', 7.9, 4.72, 1.5, 0.42, L(cena.chave(i + 2)));
    botao(s, cena.pularRotulo, 8.1, 0.2, 1.7, 0.36, L(cena.fim), 'secundario');
  }
  s.notes(`${cena.titulo} (${i + 1}/${n}). ${ultima ? `O botão leva a: ${cena.fimRotulo}.` : `Continuar avança a cena; ${cena.pularRotulo} vai direto para: ${cena.fimRotulo}.`}`);
}

const cenaAbertura = () => ({
  titulo: 'Conversa de abertura',
  falas: V.conversa,
  elenco: ['Eitri'],
  chave: (n) => `conversa_${n}`,
  fim: `salao_${V.inicio}`,
  fimRotulo: 'Entrar no Salão',
  pularRotulo: 'Pular conversa',
  dica: 'Jogue clicando nos botões: as setas do teclado pulam etapas sem validar a escolha.',
});

const cenaChegada = (gid) => ({
  titulo: `Chegada: ${CHEGADAS[gid].lugar}`,
  gid,
  lugar: CHEGADAS[gid].lugar,
  falas: CHEGADAS[gid].falas,
  elenco: CHEGADAS[gid].elenco,
  chave: (n) => `chegada_${gid}_${n}`,
  fim: `intro_${gid}`,
  fimRotulo: 'Abrir a ala',
  pularRotulo: 'Pular cena',
});

function slideCreditos(s) {
  fundo(s);
  estrelas(s, [[0.05, 0.05, 9.9, 0.5], [0.05, 5.1, 9.9, 0.5]], 16, 21);
  painel(s, 1.6, 0.6, 6.8, 4.4);
  s.img('logo_thanos.png', 2.6, 0.85, 4.8, 4.8 * 246 / 1131, { alt: 'ThanOS' });
  s.text('Créditos', 2.0, 2.05, 6.0, 0.5, { font: F_TIT, size: 24, color: P.LATAO_CLARO, align: 'center', valign: 'middle' });
  s.text([
    ['Murilo Fuzi Correia', { size: 15, bold: true, breakLine: true }],
    ['Álvaro de Freitas Grotto', { size: 15, bold: true, breakLine: true, psa: 6 }],
    ['Sistemas Operacionais · FCT/UNESP', { size: 11.5, color: P.TINTA_SUAVE }],
  ], 2.0, 2.6, 6.0, 1.0, { align: 'center' });
  s.text('Arte em pixel art, personagem e sons originais do projeto. Fontes Young Serif e Archivo (SIL OFL). Homenagem a Vingadores: Guerra Infinita, sem imagens ou marcas da Marvel.', 2.2, 3.62, 5.6, 0.62, {
    size: 9.5, color: P.TINTA_SUAVE, align: 'center',
  });
  botao(s, 'Voltar ao início', 3.9, 4.35, 2.2, 0.44, L('capa'));
  s.notes('Créditos.');
}

// Salão com k joias na manopla (k = 0..6)
const SALAO = { cx: 5.0, cy: 3.0, sx: 0.0135, sy: 0.0112, aw: 0.56, ah: 0.75 };

function slideSalao(s, k) {
  fundo(s);
  estrelas(s, [[0.05, 1.0, 1.05, 4.6], [8.9, 1.0, 1.05, 4.6]], 16, 40 + k);
  s.img('cenario/salao_2x.png', 1.17, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
  if (k === 6) s.img('cenario/feixe_4x.png', 4.72, 0.55, 0.56, 2.5, { alt: 'Feixe de luz sobre a manopla', transparency: 25 });
  s.img(`manopla/${MONUMENTO[k]}.png`, 4.3, 2.035, 1.4, 1.83, { alt: `Manopla com ${k} de 6 joias` });

  const proximo = k < 6 && V.gemas.includes(ORDEM[k]) ? ORDEM[k] : null;
  const fimSo1 = !proximo && k < 6;
  for (const f of FASES) {
    const g = GEMS[f.id];
    const cx = SALAO.cx + g.posicao[0] * SALAO.sx;
    const cy = SALAO.cy + g.posicao[1] * SALAO.sy;
    const ax = cx - SALAO.aw / 2;
    const ay = cy - SALAO.ah / 2;
    const estado = g.ordem < k ? 'feita' : g.id === proximo ? 'proxima' : 'travada';
    const link = estado === 'proxima' ? L(K.chegada(g.id)) : undefined;
    const altar = { feita: 'altar_vazio', proxima: 'altar_aceso', travada: 'altar_adormecido' }[estado];
    s.img(`altares/${altar}.png`, ax, ay, SALAO.aw, SALAO.ah, { alt: `Altar ${pad2(g.altar)}`, link });
    if (estado !== 'feita') {
      const t = estado === 'proxima' ? 0.32 : 0.26;
      s.img(g.img, cx - t / 2, ay + SALAO.ah * 0.43 - t / 2, t, t, { alt: g.nome, link, transparency: estado === 'travada' ? 45 : undefined });
    }
    s.img(`altares/etiqueta_${pad2(g.altar)}.png`, cx - 0.17, ay + SALAO.ah - 0.15, 0.34, 0.19, { alt: `Etiqueta ${pad2(g.altar)}`, link });
    if (estado === 'proxima') {
      s.text(`Entrar · ${g.nome}`, cx - 0.98, ay - 0.34, 1.96, 0.27, {
        fill: P.LATAO, line: P.LATAO_CLARO, lineW: 0.75, color: P.SOBRE_OURO, bold: true, size: 9.5, align: 'center', valign: 'middle', link,
      });
    }
  }

  if (proximo) {
    const g = GEMS[proximo];
    const cx = SALAO.cx + g.posicao[0] * SALAO.sx;
    const cy = SALAO.cy + g.posicao[1] * SALAO.sy;
    // Thanos ao lado do altar, virado para o centro (o selo "Entrar" fica acima do altar)
    const tx = cx + (cx < SALAO.cx ? 0.6 : -0.6);
    s.img('thanos/thanos_frente_parado.png', tx - 0.21, cy - 0.2, 0.42, 0.56, { alt: 'Thanos' });
  } else {
    botao(s, fimSo1 ? 'Concluir o SO 1' : 'Dar o estalo', 3.9, 3.98, 2.2, 0.44, L(fimSo1 ? 'fim_so1' : 'estalo'));
    s.img('thanos/thanos_costas_parado.png', 4.79, 4.5, 0.42, 0.56, { alt: 'Thanos' });
  }

  // HUD
  painel(s, 0.15, 0.15, 3.75, 0.8, { shadow: false });
  s.img(`manopla/hud_manopla_${k === 6 ? 'completa' : 'vazia'}.png`, 0.25, 0.22, 0.79, 0.65, { alt: 'Manopla' });
  s.text(k === 6 ? 'A manopla está completa' : fimSo1 ? 'SO 1 completo' : 'Colete as seis Joias do Infinito', 1.12, 0.19, 2.72, 0.26, { size: 10.5, bold: true, valign: 'middle' });
  s.text(`${k} de 6 joias na manopla`, 1.12, 0.44, 2.72, 0.22, { size: 9.5, color: P.TINTA_SUAVE, valign: 'middle' });
  ORDEM.forEach((gid, i) => {
    const g = GEMS[gid];
    s.img(i < k ? g.img : g.contorno, 1.1 + i * 0.27, 0.67, 0.22, 0.22, { alt: `${g.nome} ${i < k ? 'na manopla' : 'pendente'}` });
  });

  s.text(k === 6 ? 'Clique em Dar o estalo' : fimSo1 ? 'Clique em Concluir o SO 1' : 'Clique no altar aceso para entrar na ala', 0.15, 5.05, 2.65, 0.4, {
    fill: P.CARTAO, line: P.LATAO, lineW: 1, size: 10, valign: 'middle', align: 'center',
  });
  s.notes(k === 6
    ? 'Salão com as seis joias. O botão Dar o estalo leva ao final.'
    : fimSo1
    ? `Salão com ${k} de 6 joias: fim da apresentação SO 1. O botão Concluir o SO 1 leva ao encerramento.`
    : `Salão com ${k} de 6 joias. Próxima: ${GEMS[proximo].nome} (altar ${pad2(GEMS[proximo].altar)}). Só o altar aceso tem link.`);
}

function slideIntroJoia(s, gid) {
  const g = GEMS[gid];
  const etapas = ETAPAS.filter((e) => e.gid === gid);
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  molduraJoia(s, gid, 0.6, 0.6, 2.25);
  s.img('thanos/thanos_frente_parado.png', 1.35, 3.2, 0.75, 1.0, { alt: 'Thanos' });
  s.text(`${g.ordem + 1}ª joia da expedição`, 0.6, 4.35, 2.25, 0.3, { size: 10, color: P.TINTA_SUAVE, align: 'center' });
  const ala = g.ala;
  s.text(g.nome, 3.25, 0.5, 6.2, 0.62, { font: F_TIT, size: 30, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(`${ala.lugar} · mentor: ${ala.mentor} · ${g.modulo} · ${g.faixa}`, 3.25, 1.12, 6.2, 0.3, {
    size: 11, color: P.TINTA_SUAVE, valign: 'middle',
  });
  s.text(ala.abertura, 3.25, 1.52, 6.2, 1.3, { size: 12 });
  s.text([
    [`NOS QUADRINHOS · ${ala.anciao.nome.toUpperCase()}`, { size: 9, bold: true, color: P.LATAO, charSpacing: 1.5, breakLine: true, psa: 4 }],
    [ala.anciao.texto, { size: 11 }],
  ], 3.25, 2.95, 6.2, 1.38, { fill: P.CARTAO_SOMBRA, line: P.LATAO_ESC, lineW: 1, margin: 8, valign: 'top' });
  botao(s, 'Abrir a bancada', 3.25, 4.62, 2.4, 0.48, L(K.e(etapas[0].n)));
  botao(s, 'Voltar ao Salão', 5.85, 4.62, 2.1, 0.48, L(`salao_${g.ordem}`), 'secundario');
  s.notes(`${g.nome}: ${etapas.length} etapas (${g.faixa}). Mentor: ${ala.mentor}.`);
}

const CARTAS_Y = 2.62;
const CARTA_H = 0.6;
const CARTA_GAP = 0.06;

// Caixa de fala do mentor, com o retrato em pixel art à esquerda
function falaMentor(s, et, x, y, w, h) {
  const g = GEMS[et.gid];
  s.rect(x, y, w, h, { fill: P.CARTAO_SOMBRA, line: g.cor, lineW: 1.25 });
  const lado = h - 0.2;
  s.rect(x + 0.1, y + 0.1, lado, lado, { fill: mix(P.CARTAO, g.cor, 0.22), line: g.cor, lineW: 1 });
  s.img(ARTE[et.mentor].retrato, x + 0.14, y + 0.14, lado - 0.08, lado - 0.08, { alt: `Retrato de ${et.mentor}` });
  const tx = x + lado + 0.25;
  s.text([
    [et.mentor.toUpperCase(), { size: 9.5, bold: true, color: P.LATAO, charSpacing: 1.5, breakLine: true, psa: 3 }],
    [et.fala, { size: 12 }],
  ], tx, y + 0.08, x + w - tx - 0.1, h - 0.16, { valign: 'top' });
}

function slideEtapa(s, et) {
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  cabecalhoEtapa(s, et, 'jogo');
  s.text(et.nome, 0.45, 0.76, 5.8, 0.42, { font: F_TIT, size: 18, color: P.LATAO_CLARO, valign: 'middle' });
  falaMentor(s, et, 0.45, 1.22, 5.8, 1.28);
  et.opcoes.forEach((op, i) => {
    const alvo = op.certa ? L(K.ok(et.n)) : L(K.err(et.n, op.letra));
    carta(s, et, op, 0.45, CARTAS_Y + i * (CARTA_H + CARTA_GAP), 5.8, CARTA_H, 'jogo', alvo);
  });
  esquema(s, et, false);
  const certa = et.opcoes.find((o) => o.certa);
  s.notes(`Etapa ${et.nn}. Escolha correta: ${certa.letra}) ${certa.label}\nNo enunciado técnico: ${certa.tecnico}\nDiretriz original: ${et.diretriz}\nNota de engenharia: ${et.nota}`);
}

function slideOk(s, et) {
  const g = GEMS[et.gid];
  const op = et.opcoes.find((o) => o.certa);
  const ultima = et.idx === et.total - 1;
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  cabecalhoEtapa(s, et, 'ok');
  s.text('Encaixe confirmado', 0.45, 0.76, 5.8, 0.44, { font: F_TIT, size: 20, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(et.titulo, 0.45, 1.2, 5.8, 0.28, { size: 11, color: P.TINTA_SUAVE, valign: 'middle' });
  carta(s, et, op, 0.45, 1.56, 5.8, CARTA_H, 'ok');
  s.text(op.feedback, 0.45, 2.36, 5.8, 0.85, { size: 13 });
  s.text([
    ['NOTA DE ENGENHARIA', { size: 9, bold: true, color: P.LATAO, charSpacing: 1.5, breakLine: true, psa: 4 }],
    [et.nota, { size: 12 }],
  ], 0.45, 3.28, 5.8, 1.2, { fill: P.CARTAO_SOMBRA, line: P.LATAO_ESC, lineW: 1, margin: 8, valign: 'top' });
  const prox = ultima ? `conquista_${et.gid}` : K.e(et.n + 1);
  botao(s, ultima ? `Conquistar a ${g.nome}` : 'Próxima etapa', 0.45, 4.68, ultima ? 3.2 : 2.4, 0.48, L(prox));
  esquema(s, et, true);
  s.notes(`Etapa ${et.nn} concluída. ${ultima ? 'Última etapa da ala: o botão leva à joia conquistada.' : 'O botão leva à próxima etapa.'}`);
}

function slideErro(s, et, op) {
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  cabecalhoEtapa(s, et, 'jogo');
  s.text('Configuração rejeitada', 0.45, 0.76, 5.8, 0.44, { font: F_TIT, size: 20, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(et.titulo, 0.45, 1.2, 5.8, 0.28, { size: 11, color: P.TINTA_SUAVE, valign: 'middle' });
  carta(s, et, op, 0.45, 1.56, 5.8, CARTA_H, 'erro');
  s.text(op.feedback, 0.45, 2.36, 5.8, 0.95, { size: 13.5 });
  s.text(`A bancada não mudou. Ouça ${et.mentor} de novo e escolha outra opção.`, 0.45, 3.4, 5.8, 0.5, {
    size: 11, color: P.TINTA_SUAVE,
  });
  s.img('thanos/thanos_costas_parado.png', 0.5, 4.42, 0.56, 0.75, { alt: 'Thanos' });
  botao(s, 'Tentar de novo', 1.25, 4.68, 2.4, 0.48, L(K.e(et.n)));
  esquema(s, et, false, true);
  s.notes(`Escolha errada na etapa ${et.nn} (${op.letra}). O botão volta para a mesma etapa.`);
}

function slideConquista(s, gid) {
  const g = GEMS[gid];
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  molduraJoia(s, gid, 0.6, 0.6, 2.0);
  s.text(`${g.ordem + 1} de 6 joias na manopla`, 0.6, 2.7, 2.0, 0.3, { size: 10, color: P.TINTA_SUAVE, align: 'center' });
  s.img('thanos/thanos_frente_parado.png', 1.22, 3.2, 0.75, 1.0, { alt: 'Thanos' });
  const titulo = g.so1 ? `${g.nome} conquistada` : `${g.nome} coletada`;
  s.text(titulo, 2.95, 0.5, 4.3, 0.95, { font: F_TIT, size: 24, color: P.LATAO_CLARO, valign: 'middle' });
  if (g.so1) {
    const etapas = ETAPAS.filter((e) => e.gid === gid);
    const fim = etapas[etapas.length - 1].opcoes.find((o) => o.certa).feedback;
    s.text(fim, 2.95, 1.5, 4.3, 0.8, { size: 12.5 });
    s.text('MONTADO NESTA ALA', 2.95, 2.38, 4.3, 0.26, { size: 9, bold: true, color: P.LATAO, charSpacing: 1.5, valign: 'middle' });
    s.text(etapas.map((et, i) => [`${et.nn}  ${et.nome}`, { breakLine: i < etapas.length - 1 }]), 2.95, 2.68, 4.3, 1.9, {
      size: 10, lsm: 1.05,
    });
  } else {
    s.text('Joia coletada em modo demonstrativo: o conteúdo de SO 2 chega no próximo semestre.', 2.95, 1.5, 4.3, 0.8, { size: 12.5 });
    s.text('PRÉVIA DESTA ALA', 2.95, 2.38, 4.3, 0.26, { size: 9, bold: true, color: P.LATAO, charSpacing: 1.5, valign: 'middle' });
    const blocos = PREVIA_BLOCOS[gid];
    s.text(blocos.map(([t, e], i) => [`${t} · ${e}`, { breakLine: i < blocos.length - 1, psa: 4 }]), 2.95, 2.68, 4.3, 1.5, { size: 10.5 });
  }
  s.rect(7.4, 0.6, 2.05, 2.7, { fill: mix(P.CARTAO, P.ARDOSIA, 0.6), line: P.LATAO, lineW: 1.25 });
  s.img(`manopla/${MONUMENTO[g.ordem + 1]}.png`, 7.6, 0.72, 1.65, 2.16, { alt: `Manopla com ${g.ordem + 1} de 6 joias` });
  s.text('A joia foi encaixada na manopla', 7.4, 3.38, 2.05, 0.45, { size: 9.5, color: P.TINTA_SUAVE, align: 'center' });
  botao(s, 'Voltar ao Salão', 2.95, 4.68, 2.4, 0.48, L(`salao_${g.ordem + 1}`));
  s.notes(`${titulo}. O botão leva ao Salão com ${g.ordem + 1} de 6 joias.`);
}

function slidePrevia(s, gid) {
  const g = GEMS[gid];
  const pv = SO2_PREVIEWS[gid];
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  molduraJoia(s, gid, 0.5, 0.5, 1.1);
  s.text([
    [pv.module_badge, { size: 11, bold: true, breakLine: true }],
    [pv.range_label, { size: 10, color: P.TINTA_SUAVE }],
  ], 1.75, 0.5, 2.15, 1.1, { fill: P.CARTAO_SOMBRA, line: P.LATAO, lineW: 1.25, margin: 7, valign: 'middle' });
  s.rect(0.5, 1.8, 3.4, 3.35, { fill: P.VAZIO, line: P.LATAO, lineW: 1.25 });
  s.text('PRÉVIA SO 2 · PRÓXIMO SEMESTRE', 0.65, 1.88, 3.1, 0.3, { size: 8.5, bold: true, color: P.LATAO_CLARO, charSpacing: 0.5, valign: 'middle' });
  PREVIA_BLOCOS[gid].forEach(([t, e], i) => {
    s.text([[t, { size: 10, bold: true, breakLine: true }], [e, { size: 9, color: P.LATAO_CLARO }]], 0.68, 2.3 + i * 0.92, 3.04, 0.76, {
      fill: mix(P.CARTAO_SOMBRA, g.cor, 0.2), line: g.cor, lineW: 1.25, align: 'center', valign: 'middle', margin: 4,
    });
  });
  s.text(g.nome, 4.15, 0.42, 5.35, 0.6, { font: F_TIT, size: 28, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(`Altar ${pad2(g.altar)} · lapidação ${g.lapidacao}`, 4.15, 1.0, 5.35, 0.28, { size: 11, color: P.TINTA_SUAVE, valign: 'middle' });
  s.text(pv.headline, 4.15, 1.3, 5.35, 0.5, { font: F_TIT, size: 13, color: P.LATAO_CLARO });
  s.text([
    [`NOS QUADRINHOS · ${g.ala.anciao.nome.toUpperCase()}`, { size: 8.5, bold: true, color: P.LATAO, charSpacing: 1.2, breakLine: true, psa: 2 }],
    [g.ala.anciao.texto, { size: 10, breakLine: true, psa: 6 }],
    ['EM ULTIMATO (SO 2)', { size: 8.5, bold: true, color: P.LATAO, charSpacing: 1.2, breakLine: true, psa: 2 }],
    [g.ala.ultimato, { size: 10 }],
  ], 4.15, 1.84, 5.35, 1.78, { valign: 'top' });
  s.text(pv.notice, 4.15, 3.7, 5.35, 0.85, {
    size: 9.5, fill: P.CARTAO, line: P.TINTA_SUAVE, lineW: 1, dash: 'dash', margin: 7, valign: 'middle',
  });
  botao(s, 'Coletar joia (Demonstração SO 2)', 4.15, 4.68, 3.7, 0.48, L(`conquista_${gid}`));
  botao(s, 'Voltar', 8.0, 4.68, 1.3, 0.48, L(`salao_${g.ordem}`), 'secundario');
  s.notes(`${g.nome}: prévia de SO 2 com coleta demonstrativa.`);
}

function cinzas(s, seed) {
  const r = rng(seed);
  for (let i = 0; i < 28; i++) {
    const d = 0.03 + r() * 0.04;
    const x = 2.2 + r() * 5.6;
    const y = 0.4 + r() * 4.8;
    if (x > 3.6 && x < 6.4 && y > 1.4 && y < 4.4) continue;
    s.rect(x, y, d, d, { fill: r() < 0.5 ? P.TINTA_SUAVE : '8A8070', transparency: 35 });
  }
}

function slideEstalo(s) {
  fundo(s);
  s.img('cenario/salao_2x.png', 1.17, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
  s.rect(0, 0, W, H, { fill: P.VAZIO, transparency: 30 });
  cinzas(s, 77);
  s.img('manopla/monumento_queimada_pos_estalo.png', 4.05, 1.55, 1.9, 2.48, { alt: 'Manopla queimada depois do estalo' });
  s.text('O estalo foi dado', 0.5, 0.35, 9.0, 0.7, { font: F_TIT, size: 34, color: P.LATAO_CLARO, align: 'center', valign: 'middle' });
  s.text('A manopla queimou e o salão virou cinza. O FCTos01 está completo.', 0.5, 1.05, 9.0, 0.4, { size: 13, align: 'center', valign: 'middle' });
  botao(s, 'Continuar', 3.9, 4.6, 2.2, 0.48, L('epilogo'));
  s.notes('O estalo. O botão leva ao epílogo.');
}

function slideEpilogo(s) {
  fundo(s);
  estrelas(s, [[0.05, 0.05, 9.9, 0.45], [0.05, 5.2, 9.9, 0.4]], 16, 91);
  painel(s, 0.6, 0.5, 8.8, 4.6);
  s.rect(0.95, 0.85, 1.9, 2.6, { fill: mix(P.CARTAO, P.ARDOSIA, 0.6), line: P.LATAO, lineW: 1.25 });
  s.img('manopla/monumento_queimada_pos_estalo.png', 1.1, 0.98, 1.6, 2.09, { alt: 'Manopla queimada depois do estalo' });
  s.img('thanos/thanos_frente_parado.png', 1.6, 3.6, 0.6, 0.8, { alt: 'Thanos' });
  s.text('EPÍLOGO', 3.2, 0.8, 5.8, 0.3, { size: 10, bold: true, color: P.LATAO, charSpacing: 2, valign: 'middle' });
  s.text(EPILOGO.titulo, 3.2, 1.1, 5.8, 0.6, { font: F_TIT, size: 26, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(EPILOGO.texto, 3.2, 1.8, 5.8, 1.85, { size: 12.5 });
  s.text(EPILOGO.gancho, 3.2, 3.72, 5.8, 0.55, { size: 11, color: P.LATAO_CLARO, italic: true });
  botao(s, 'Continuar', 3.2, 4.4, 2.2, 0.48, L('conclusao'));
  s.notes('Epílogo: fecha a premissa (Titã morreu por falta de gerência de recursos) e deixa o gancho para SO 2.');
}

function slideConclusao(s) {
  fundo(s);
  s.img('cenario/salao_2x.png', 1.17, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
  s.rect(0, 0, W, H, { fill: P.VAZIO, transparency: 40 });
  painel(s, 1.0, 0.5, 8.0, 4.6);
  s.text('FCTos01 concluído', 1.4, 0.72, 7.2, 0.62, { font: F_TIT, size: 30, color: P.LATAO_CLARO, valign: 'middle' });
  ORDEM.forEach((gid, i) => s.img(GEMS[gid].img, 1.4 + i * 0.62, 1.45, 0.46, 0.46, { alt: GEMS[gid].nome }));
  s.text(SINTESE, 1.4, 2.1, 7.2, 1.25, { size: 12.5 });
  s.text('As joias da Realidade, da Alma e da Mente foram coletadas em modo demonstrativo: o conteúdo de SO 2 chega no próximo semestre.', 1.4, 3.38, 7.2, 0.55, {
    size: 11, color: P.TINTA_SUAVE,
  });
  botao(s, 'Nova expedição', 1.4, 4.25, 2.3, 0.5, L('capa'));
  botao(s, 'Mapa das joias', 3.9, 4.25, 2.1, 0.5, L('mapa'), 'secundario');
  botao(s, 'Créditos', 6.2, 4.25, 1.6, 0.5, L('creditos'), 'secundario');
  s.notes('Conclusão do jogo.');
}

function slideFimSo1(s) {
  fundo(s);
  s.img('cenario/salao_2x.png', 1.17, 0, 7.66, 5.625, { alt: 'Salão de Titã' });
  s.rect(0, 0, W, H, { fill: P.VAZIO, transparency: 40 });
  painel(s, 0.8, 0.5, 8.4, 4.6);
  s.rect(1.15, 0.85, 2.0, 2.7, { fill: mix(P.CARTAO, P.ARDOSIA, 0.6), line: P.LATAO, lineW: 1.25 });
  s.img(`manopla/${MONUMENTO[3]}.png`, 1.3, 0.98, 1.7, 2.22, { alt: 'Manopla com 3 de 6 joias' });
  s.text(FIM_SO1.titulo, 3.5, 0.75, 5.4, 0.62, { font: F_TIT, size: 28, color: P.LATAO_CLARO, valign: 'middle' });
  ORDEM.forEach((gid, i) => {
    const g = GEMS[gid];
    s.img(i < 3 ? g.img : g.contorno, 3.5 + i * 0.55, 1.45, 0.4, 0.4, { alt: `${g.nome} ${i < 3 ? 'na manopla' : 'no SO 2'}` });
  });
  s.text(FIM_SO1.texto, 3.5, 2.0, 5.4, 1.45, { size: 12 });
  s.text(FIM_SO1.gancho, 3.5, 3.48, 5.4, 0.5, { size: 11, color: P.LATAO_CLARO, italic: true });
  botao(s, 'Nova expedição', 1.15, 4.3, 2.3, 0.5, L('capa'));
  botao(s, 'Mapa das joias', 3.65, 4.3, 2.1, 0.5, L('mapa'), 'secundario');
  botao(s, 'Créditos', 5.95, 4.3, 1.6, 0.5, L('creditos'), 'secundario');
  s.notes('Fim da apresentação SO 1. As outras três joias estão na apresentação SO 2.');
}

function slideMapa(s) {
  fundo(s);
  painel(s, 0.2, 0.18, 9.6, 5.27);
  s.text('Mapa das joias', 0.6, 0.42, 6.0, 0.6, { font: F_TIT, size: 28, color: P.LATAO_CLARO, valign: 'middle' });
  s.text(V.id === 'completo'
    ? 'Atalhos para abrir qualquer ala. O Salão segue a ordem guiada da expedição.'
    : `Atalhos para as alas da ${V.titulo}.`, 0.6, 1.0, 6.6, 0.3, { size: 11, color: P.TINTA_SUAVE, valign: 'middle' });
  botao(s, 'Voltar ao início', 7.5, 0.5, 1.9, 0.44, L('capa'), 'secundario');
  ORDEM.forEach((gid, i) => {
    const g = GEMS[gid];
    const x = 0.6 + (i % 3) * 2.975;
    const y = 1.5 + Math.floor(i / 3) * 1.95;
    const aqui = V.gemas.includes(gid);
    const link = aqui ? L(K.entrada(gid)) : undefined;
    s.rect(x, y, 2.75, 1.75, { fill: aqui ? P.CARTAO_SOMBRA : P.CARTAO, line: mix(P.TINTA_SUAVE, P.CARTAO, aqui ? 0.45 : 0.7), lineW: 1, link });
    s.img(g.img, x + 0.18, y + 0.2, 0.62, 0.62, { alt: g.nome, link, transparency: aqui ? undefined : 55 });
    s.text(g.nome, x + 0.92, y + 0.18, 1.75, 0.7, { font: F_TIT, size: 14, color: aqui ? P.LATAO_CLARO : P.TINTA_SUAVE, valign: 'middle', link });
    s.text([
      [`${i + 1}ª joia · ${g.modulo}`, { bold: true, breakLine: true }],
      [aqui ? (g.so1 ? g.faixa : 'Prévia e coleta demonstrativa') : `Na apresentação ${g.modulo}`, { color: P.TINTA_SUAVE }],
    ], x + 0.18, y + 1.0, 2.45, 0.6, { size: 10, link, color: aqui ? P.TINTA : P.TINTA_SUAVE });
  });
  s.notes(`Mapa das joias: atalhos para as alas da ${V.titulo}.`);
}

// ---------------------------------------------------------------------------
// Roteiro (ordem física = caminho certo; apêndice no fim)
// ---------------------------------------------------------------------------

function montarRoteiro() {
  ROTEIRO.length = 0;
  const abertura = cenaAbertura();
  add('capa', 'capa', slideCapa, { next: 'conversa_1' });
  V.conversa.forEach((_, i) => {
    add(`conversa_${i + 1}`, 'conversa', (s) => slideCena(s, abertura, i), { next: i === V.conversa.length - 1 ? abertura.fim : `conversa_${i + 2}` });
  });
  for (const gid of V.gemas) {
    const k = GEMS[gid].ordem;
    add(`salao_${k}`, 'salao', (s) => slideSalao(s, k), { next: K.chegada(gid) });
    const g = GEMS[gid];
    if (CHEGADAS[gid]) {
      const cena = cenaChegada(gid);
      cena.falas.forEach((_, i) => {
        add(cena.chave(i + 1), 'chegada', (s) => slideCena(s, cena, i), { next: i === cena.falas.length - 1 ? cena.fim : cena.chave(i + 2), gem: gid });
      });
    }
    if (g.so1) {
      const etapas = ETAPAS.filter((e) => e.gid === gid);
      add(`intro_${gid}`, 'intro', (s) => slideIntroJoia(s, gid), { next: K.e(etapas[0].n) });
      etapas.forEach((et, i) => {
        add(K.e(et.n), 'etapa', (s) => slideEtapa(s, et), { next: K.ok(et.n), etapa: et.n, gem: gid });
        add(K.ok(et.n), 'ok', (s) => slideOk(s, et), {
          next: i === etapas.length - 1 ? `conquista_${gid}` : K.e(et.n + 1), etapa: et.n, gem: gid,
        });
      });
    } else {
      add(`previa_${gid}`, 'previa', (s) => slidePrevia(s, gid), { next: `conquista_${gid}`, gem: gid });
    }
    add(`conquista_${gid}`, 'conquista', (s) => slideConquista(s, gid), { next: `salao_${k + 1}`, gem: gid });
  }
  const kFim = V.fimSalao;
  if (kFim === 6) {
    add('salao_6', 'salao', (s) => slideSalao(s, 6), { next: 'estalo' });
    add('estalo', 'estalo', slideEstalo, { next: 'epilogo' });
    add('epilogo', 'epilogo', slideEpilogo, { next: 'conclusao' });
    add('conclusao', 'conclusao', slideConclusao, { next: null });
  } else {
    add(`salao_${kFim}`, 'salao', (s) => slideSalao(s, kFim), { next: 'fim_so1' });
    add('fim_so1', 'fim', slideFimSo1, { next: null });
  }
  add('mapa', 'mapa', slideMapa, { next: null });
  // Apêndice
  add('creditos', 'creditos', slideCreditos, { next: null });
  for (const et of ETAPAS.filter((e) => V.gemas.includes(e.gid))) {
    for (const op of et.opcoes.filter((o) => !o.certa)) {
      add(K.err(et.n, op.letra), 'erro', (s) => slideErro(s, et, op), { next: K.e(et.n), etapa: et.n, gem: et.gid });
    }
  }
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

async function gerarVersao() {
  montarRoteiro();
  pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = `ThanOS — ${V.titulo}`;
  pres.subject = 'Jogo de Sistemas Operacionais para Google Apresentações';
  pres.author = 'ThanOS';
  pres.company = 'FCT/UNESP';
  pres.theme = { headFontFace: F_TIT, bodyFontFace: F_TXT };

  NUM = {};
  ROTEIRO.forEach((r, i) => {
    if (NUM[r.key]) throw new Error(`chave repetida: ${r.key}`);
    NUM[r.key] = i + 1;
  });
  ROTEIRO.forEach((r, i) => r.build(new SB(i + 1)));

  const bruto = await pres.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(bruto);
  // O pptxgenjs repete o link de slide em cada trecho de texto (fica sublinhado e azul
  // no Google). O link da forma já basta: removemos os links de trecho.
  const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  for (const nome of slides) {
    const xml = await zip.file(nome).async('string');
    zip.file(nome, xml
      .replace(/<a:hlinkClick [^>]*[^/]>\s*<a:extLst>[\s\S]*?<\/a:extLst>\s*<\/a:hlinkClick>/g, '')
      // o pptxgenjs sublinha todo trecho com link; o jogo não usa sublinhado
      .replace(/(<a:rPr [^>]*?) u="sng"/g, '$1'));
  }
  const final = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const out = path.join(PASTA, V.arquivo);
  fs.writeFileSync(out, final);
  console.log(`ok: ${V.titulo}: ${ROTEIRO.length} slides → ${out} (${(final.length / 1024 / 1024).toFixed(2)} MB)`);

  const etapas = ETAPAS.filter((et) => V.gemas.includes(et.gid));
  return {
    versao: V.id,
    titulo: V.titulo,
    arquivo: path.relative(ROOT, out).split(path.sep).join('/'),
    total: ROTEIRO.length,
    gemas: V.gemas,
    inicio: V.inicio,
    fimSalao: V.fimSalao,
    fim: V.fim,
    slides: ROTEIRO.map((r, i) => ({
      num: i + 1,
      key: r.key,
      tipo: r.tipo,
      next: r.next ? NUM[r.next] : null,
      etapa: r.etapa ?? null,
      gem: r.gem ?? null,
    })),
    etapas: etapas.map((et) => ({
      n: et.n,
      gem: et.gid,
      slide: NUM[K.e(et.n)],
      ok: NUM[K.ok(et.n)],
      erros: et.opcoes.filter((o) => !o.certa).map((o) => NUM[K.err(et.n, o.letra)]),
      certa: et.opcoes.find((o) => o.certa).letra,
    })),
  };
}

const versoes = [];
for (const v of VERSOES) {
  V = v;
  versoes.push(await gerarVersao());
}
fs.writeFileSync(MAPA, JSON.stringify({ versoes }, null, 2), 'utf8');
