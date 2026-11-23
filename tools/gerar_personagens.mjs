// Desenha os personagens do jogo em pixel art ORIGINAL, no mesmo estilo do sprite
// do Thanos: 24×32 pixels, contorno escuro, ampliado 6× sem filtro. São homenagens
// desenhadas pelo projeto (cores e silhueta), sem usar arte da Marvel.
//
//   node gerar_personagens.mjs              → visuais/prontos_libreoffice/personagens/
//   node gerar_personagens.mjs previa.png   → também grava uma folha com todos lado a lado
//
// Para cada personagem saem dois arquivos:
//   <id>_frente.png   corpo inteiro (144×192), usado nas cenas
//   <id>_retrato.png  cabeça e ombros (108×108), usado na caixa de fala das etapas

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(TOOLS, '..', 'visuais', 'prontos_libreoffice', 'personagens');
const ESCALA = 6;
const CONTORNO = '140e18'; // o mesmo do Thanos

// Cada personagem: paleta (A = contorno) e a metade esquerda do desenho
// (colunas 0–11, 32 linhas). A metade direita é o espelho. `extras` quebra a
// simetria: [linha, coluna inicial, trecho] ('.' mantém o pixel de baixo).
export const PERSONAGENS = {
  eitri: {
    nome: 'Eitri',
    cores: {
      S: 'd9a07a', s: 'a86e50', H: '8a7464', h: '5e4c40', L: 'b8a48e',
      T: '4a4458', t: '2e2a3a', P: '7a4a2e', p: '54301c', B: '2a1e1a',
      M: 'a9b0ba', m: '6c7380', W: 'e6eaee', O: '3a2a24',
    },
    metade: [
      '............',
      '........AAAA',
      '.......AHHHH',
      '......AHHLHH',
      '......AHhhSS',
      '......AHSASS',
      '......AHSSSs',
      '......AHHHHH',
      '......AHHLHH',
      '..AAAAAHHHHH',
      '.ATTTTAhHHLH',
      '.ATTTTAhHHHH',
      'ATTtAPPhHHHH',
      'ATTtAPPhHHLH',
      'ATTtAPPPhHHH',
      'ATTtABBBBhHH',
      'ATTtAPPPPPhH',
      'ATTtAPPPPPPh',
      'AMMWAPPPPPPP',
      'AMMMAPpPPPPP',
      'AmMMAPpPPPPP',
      '.AmmAPpPPPPP',
      '..AAAPpPPPPP',
      '....APpPPPPP',
      '....APPPPPPA',
      '.....ATTTTA.',
      '.....ATTtTA.',
      '.....ATTtTA.',
      '....AOOOOOA.',
      '....AOOOOOA.',
      '.....AAAAA..',
      '............',
    ],
    // martelo de ferreiro
    extras: [[22, 0, '.Ap'], [23, 0, '.ApA'], [24, 0, '.ApA'], [25, 0, 'AAAAA'], [26, 0, 'AMMWA'], [27, 0, 'AmmmA'], [28, 0, 'AAAAA']],
  },

  estranho: {
    nome: 'Doutor Estranho',
    cores: {
      H: '2a2024', g: 'a4a2ae', S: 'e0b08e', s: 'b8845c', K: '3a2a26',
      R: 'b8323a', r: '7c1e28', T: '2c3a78', t: '1c2654', B: '8c6322',
      G: 'd9a53f', E: '3fd68a', P: '1c1c2c', O: '3a2a24',
    },
    metade: [
      '............',
      '........AAAA',
      '.......AHHHH',
      '......AHHHHH',
      '......AgHHHH',
      '......AgSSSS',
      '......ASSASS',
      '...AA.ASSSSs',
      '..ARRAASSSKK',
      '..ARRRAAKKKK',
      '.ARRRRAATTTT',
      '.ARRRrATTTTG',
      '.ARRRrATtTTE',
      '.ARRRrATtTTG',
      '.ARRRrATtTTT',
      '.ARRRrABBBBB',
      '.ARRRrATtTTT',
      'ARRRSSATtTTT',
      'ARRRSSATtTTT',
      'ARRRAAATtTTT',
      'ARRRrAATtTTT',
      'ARRRrATTtTTT',
      'ARRRrATTtTTT',
      'ARRRrATTTTTT',
      'ARRRrAAAAAAA',
      'ARRRrA.APPA.',
      'ARRRrA.APPA.',
      'ARRRrA.APPA.',
      'AAAAAA.AOOA.',
      '......AOOOA.',
      '......AAAAA.',
      '............',
    ],
  },

  wong: {
    nome: 'Wong',
    cores: {
      S: 'c8946c', s: '9c6a48', L: 'e4b896', K: '4a3428',
      R: 'b8622c', r: '8a4420', M: '6e2a22', m: '4e1c16', B: '2e2228', O: '3a2a24',
    },
    metade: [
      '............',
      '........AAAA',
      '.......ASSLL',
      '......ASSSLL',
      '......ASSSSS',
      '......ASSSSS',
      '......ASSASS',
      '......AsSSSs',
      '......AsSKKS',
      '...AAAAAsSSS',
      '..AMMMMMASSS',
      '.AMMMMMRRASS',
      '.AMMmMMRRRAS',
      '.AMMmMMRRRRA',
      '.AMMmMMRRRRR',
      '.AMMmMMBBBBB',
      '.AMMmMMRRrRR',
      'ASSMmMMRRrRR',
      'ASSMmMMRRrRR',
      '.AAMmMMRRrRR',
      '..AMmMMRRrRR',
      '..AMmMMRRrRR',
      '..AMmMMRRrRR',
      '..AMmMMRRrRR',
      '..AMMMMRRRRR',
      '..AAAAAAAAAA',
      '.......AOOA.',
      '.......AOOA.',
      '......AOOOA.',
      '......AAAAA.',
      '............',
      '............',
    ],
  },

  loki: {
    nome: 'Loki',
    cores: {
      S: 'ecccb4', s: 'c09c84', H: '141418', h: '34343e', N: '22262a', n: '141618',
      V: '2f7a3c', v: '1e5228', G: 'd9a53f', O: '1a1a1e',
    },
    metade: [
      '............',
      '........AAAA',
      '.......AHHHH',
      '......AHHhHH',
      '......AHHSSS',
      '......AHSSSS',
      '......AHSASS',
      '......AHSSSs',
      '......AHHSSS',
      '......AHHHSS',
      '...AGGGAHHNN',
      '..AVGGGNAHNN',
      '..AVVNNNNNGN',
      '..AVVNnNNNGN',
      '..AVVNnNNNGN',
      '..AVVNnGGGGG',
      '..AVVNnNNVVN',
      '..AVSSnNNVVN',
      '..AVSSnNNVVN',
      '..AVAAnNNVVN',
      '..AVvANNNVVN',
      '..AVvANNNVVN',
      '..AVvANNNVVA',
      '..AVvAANNNA.',
      '..AVvA.ANNA.',
      '..AVvA.ANNA.',
      '..AVvA.ANNA.',
      '..AVvA.AOOA.',
      '..AAAA.AOOA.',
      '......AOOOA.',
      '......AAAAA.',
      '............',
    ],
  },

  heimdall: {
    nome: 'Heimdall',
    cores: {
      S: '6b4430', s: '4e2e20', E: 'ff9a3c', G: 'd9a53f', g: '8c6322', L: 'f7d886',
      C: '3a2e48', c: '241c30', O: '2a2028', W: 'd0d6de',
    },
    metade: [
      '............',
      '........AAAA',
      '....A..AGGLL',
      '...AGA.AGGGG',
      '...AGGAAgGGG',
      '....AGGgSSSS',
      '.....AGgSESS',
      '.....AGgSSSs',
      '.....AGgSSSS',
      '..AAAAAgsSSS',
      '.AGGLGGAAsSS',
      '.AGGGGGAGGGG',
      '.AgGGGgAGgGG',
      '.ACgggCAGgGG',
      '.ACCCCCAGgGL',
      '.ACCCCCAgggg',
      '.ACCCCCAGGGG',
      'ASSCCCCAGgGG',
      'ASSCCCCAGgGG',
      '.AACCCCAGgGG',
      '..ACCCCACCCC',
      '..ACcCCACCCC',
      '..ACcCCACCCC',
      '..ACcCCAAAAA',
      '..AAAAA.ACCA',
      '........ACCA',
      '........AGGA',
      '........AGGA',
      '.......AOOOA',
      '.......AAAAA',
      '............',
      '............',
    ],
    // espada fincada no chão, ao lado da mão
    extras: [[19, 0, 'AGGA'], [20, 0, 'AWA'], [21, 0, 'AWA'], [22, 0, 'AWA'], [23, 0, 'AWA'], [24, 0, 'AWA'], [25, 0, 'AWA'], [26, 0, 'AWA'], [27, 0, '.A']],
  },

  fauce: {
    nome: 'Fauce de Ébano',
    cores: {
      S: 'a8a89c', s: '7c7c72', D: '1e1e26', d: '121218', Y: 'd9a53f',
    },
    metade: [
      '............',
      '........AAAA',
      '.......ASSSS',
      '.......ASSSS',
      '.......ASSSS',
      '.......ASASS',
      '.......ASSSS',
      '.......AsSSS',
      '........AsSS',
      '........AsSS',
      '....AAAAADDD',
      '...ADDDDDYDD',
      '...ADdDDDYDD',
      '...ADdDDDYDD',
      '...ADdDDDYDD',
      '...ADdDDDYDD',
      '...ADdDDDYDD',
      '..ASSdDDDYDD',
      '..ASAdDDDYDD',
      '..ASAdDDDYDD',
      '...AAdDDDYDD',
      '....AdDDDYDD',
      '....AdDDDYDD',
      '....AdDDDYDD',
      '....AdDDDYDD',
      '....AdDDDYDD',
      '....AdDDDYDD',
      '...AdDDDDYDD',
      '...AAAAAAAAA',
      '............',
      '............',
      '............',
    ],
  },
};

// Recorte do retrato: cabeça e ombros (18×18 pixels)
const RETRATO = { x: 3, y: 0, lado: 18 };

function grade(p) {
  if (p.metade.length !== 32) throw new Error(`${p.nome}: ${p.metade.length} linhas (esperado 32)`);
  const linhas = p.metade.map((m) => {
    if (m.length !== 12) throw new Error(`${p.nome}: linha com ${m.length} colunas: ${m}`);
    return [...(m + [...m].reverse().join(''))];
  });
  for (const [y, x0, trecho] of p.extras || []) {
    [...trecho].forEach((ch, i) => { if (ch !== '.') linhas[y][x0 + i] = ch; });
  }
  return linhas;
}

function crc32(b) {
  let c = ~0;
  for (const v of b) {
    c ^= v;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function bloco(tipo, dados) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}

// pixels: função (x, y) → 'rrggbb' ou null (transparente)
function png(w, h, pixels) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = pixels(x, y);
      if (!hex) continue;
      const i = y * (w * 4 + 1) + 1 + x * 4;
      raw[i] = parseInt(hex.slice(0, 2), 16);
      raw[i + 1] = parseInt(hex.slice(2, 4), 16);
      raw[i + 2] = parseInt(hex.slice(4, 6), 16);
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(raw)),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

function corDe(p, ch) {
  if (ch === '.') return null;
  if (ch === 'A') return CONTORNO;
  const hex = p.cores[ch];
  if (!hex) throw new Error(`${p.nome}: cor desconhecida "${ch}"`);
  return hex;
}

fs.mkdirSync(DIR, { recursive: true });
const grades = {};
for (const [id, p] of Object.entries(PERSONAGENS)) {
  const g = grade(p);
  grades[id] = g;
  fs.writeFileSync(path.join(DIR, `${id}_frente.png`),
    png(24 * ESCALA, 32 * ESCALA, (x, y) => corDe(p, g[Math.floor(y / ESCALA)][Math.floor(x / ESCALA)])));
  const L = RETRATO.lado;
  fs.writeFileSync(path.join(DIR, `${id}_retrato.png`),
    png(L * ESCALA, L * ESCALA, (x, y) => corDe(p, g[RETRATO.y + Math.floor(y / ESCALA)][RETRATO.x + Math.floor(x / ESCALA)])));
}
console.log(`ok: ${Object.keys(PERSONAGENS).length} personagens em ${DIR}`);

// Folha de conferência (opcional): todos lado a lado, sobre fundo escuro
const previa = process.argv[2];
if (previa) {
  const ids = Object.keys(grades);
  const e = 5;
  const w = ids.length * 26 * e;
  const h = 34 * e;
  fs.writeFileSync(previa, png(w, h, (x, y) => {
    const k = Math.floor(x / (26 * e));
    const gx = Math.floor((x % (26 * e)) / e) - 1;
    const gy = Math.floor(y / e) - 1;
    const id = ids[k];
    const ch = gx >= 0 && gx < 24 && gy >= 0 && gy < 32 ? grades[id][gy][gx] : '.';
    return corDe(PERSONAGENS[id], ch) || '2b2534';
  }));
  console.log(`prévia: ${previa}`);
}
