import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = 'c:\\Users\\User\\Documents\\jogoMadias';
const OUT_ODS = path.join(ROOT, 'ThanOS_SO1_Calc.ods');
const ART_DIR = path.join(ROOT, 'visuais', 'prontos_libreoffice');

// ============================================================================
// 1. Minimal pure-JS ZIP writer (entry #1 MUST be uncompressed 'mimetype')
// ============================================================================
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const dosTime = 0x5000;
  const dosDate = 0x5b77; // 2025-11-23

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const rawBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(rawBuf);
    const method = entry.store ? 0 : 8;
    const compBuf = entry.store ? rawBuf : zlib.deflateRawSync(rawBuf, { level: 9 });

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compBuf.length, 18);
    local.writeUInt32LE(rawBuf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    localParts.push(local, compBuf);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compBuf.length, 20);
    central.writeUInt32LE(rawBuf.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    centralParts.push(central);
    offset += local.length + compBuf.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

// ============================================================================
// 2. XML escaping & helpers
// ============================================================================
function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(idx0) {
  let n = idx0;
  let out = '';
  while (n >= 0) {
    out = String.fromCharCode((n % 26) + 65) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

function refCell(col0, row1) {
  return `${colLetter(col0)}${row1}`;
}

function assertCleanText(text, ctx) {
  if (String(text).includes('?')) {
    throw new Error(`Interrogation mark forbidden in ThanOS UI (${ctx}): ${text}`);
  }
}

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    buf,
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

// ============================================================================
// 3. Palette & Theme Constants (from DESIGN.md)
// ============================================================================
const PAL = {
  VAZIO: '#07060c',
  ARDOSIA: '#2b2534',
  NOGUEIRA: '#3d3049',
  NOGUEIRA_ESC: '#231a2c',
  LATAO: '#d9a53f',
  LATAO_CLARO: '#f7d886',
  LATAO_ESC: '#8c6322',
  CARTAO: '#16111e',
  CARTAO_SOMBRA: '#2a2036',
  TINTA: '#f3ead6',
  TINTA_SUAVE: '#c8b48a',
  SOBRE_OURO: '#1a1208',
  PODER: '#a66bff',
  TEMPO: '#3fd68a',
  ESPACO: '#4c8dff',
  REALIDADE: '#ff4b4b',
  ALMA: '#ff9a3c',
  MENTE: '#ffd84a',
};

// ============================================================================
// 4. Image Registry
// ============================================================================
const IMAGES_MAP = {
  logo: path.join(ART_DIR, 'logo_thanos.png'),
  hud_full: path.join(ART_DIR, 'manopla', 'hud_manopla_completa.png'),
  hud_empty: path.join(ART_DIR, 'manopla', 'hud_manopla_vazia.png'),
  mon_full: path.join(ART_DIR, 'manopla', 'monumento_6_completa_pronta.png'),
  mon_burned: path.join(ART_DIR, 'manopla', 'monumento_queimada_pos_estalo.png'),
  thanos: path.join(ART_DIR, 'thanos', 'thanos_frente_parado.png'),
  gem_poder: path.join(ART_DIR, 'joias', 'joia_poder_roxa.png'),
  gem_tempo: path.join(ART_DIR, 'joias', 'joia_tempo_verde.png'),
  gem_espaco: path.join(ART_DIR, 'joias', 'joia_espaco_azul.png'),
  gem_realidade: path.join(ART_DIR, 'joias', 'joia_realidade_vermelha.png'),
  gem_alma: path.join(ART_DIR, 'joias', 'joia_alma_laranja.png'),
  gem_mente: path.join(ART_DIR, 'joias', 'joia_mente_amarela.png'),
  altar_aceso: path.join(ART_DIR, 'altares', 'altar_aceso.png'),
  altar_adormecido: path.join(ART_DIR, 'altares', 'altar_adormecido.png'),
  etiqueta_01: path.join(ART_DIR, 'altares', 'etiqueta_01.png'),
  etiqueta_02: path.join(ART_DIR, 'altares', 'etiqueta_02.png'),
  etiqueta_03: path.join(ART_DIR, 'altares', 'etiqueta_03.png'),
  etiqueta_04: path.join(ART_DIR, 'altares', 'etiqueta_04.png'),
  etiqueta_05: path.join(ART_DIR, 'altares', 'etiqueta_05.png'),
  etiqueta_06: path.join(ART_DIR, 'altares', 'etiqueta_06.png'),
};

const loadedImages = {};
for (const [key, filePath] of Object.entries(IMAGES_MAP)) {
  const info = readPngSize(filePath);
  loadedImages[key] = {
    key,
    zipPath: `Pictures/${key}.png`,
    ...info,
  };
}

// ============================================================================
// 5. Named Conditional Styles in styles.xml
// ============================================================================
const NAMED_STYLES = [
  { name: 'ST_OK', bg: '#133824', fg: '#b8ffd8', border: '#3fd68a', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_ERR', bg: '#47151b', fg: '#ffd0d0', border: '#ff4b4b', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_WAIT', bg: '#1d1728', fg: '#c8b48a', border: '#8c6322', borderW: '1pt', bold: false, align: 'center' },
  { name: 'ST_GOLD', bg: '#d9a53f', fg: '#1a1208', border: '#f7d886', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_PODER_ON', bg: '#2c1b4a', fg: '#ebd8ff', border: '#a66bff', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_TEMPO_ON', bg: '#123626', fg: '#c4ffe2', border: '#3fd68a', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_ESPACO_ON', bg: '#14284f', fg: '#d4e5ff', border: '#4c8dff', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_REALIDADE_ON', bg: '#45161b', fg: '#ffd4d4', border: '#ff4b4b', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_ALMA_ON', bg: '#452712', fg: '#ffe2c7', border: '#ff9a3c', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_MENTE_ON', bg: '#423510', fg: '#fff4ba', border: '#ffd84a', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_BLOCK_OFF', bg: '#14101c', fg: '#8f81a1', border: '#3d3049', borderW: '1pt', bold: false, align: 'center' },
  { name: 'ST_RAM_SO', bg: '#8c6322', fg: '#fffaf0', border: '#f7d886', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_RAM_P1', bg: '#1e468f', fg: '#fffaf0', border: '#4c8dff', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_RAM_P2', bg: '#1b6e47', fg: '#fffaf0', border: '#3fd68a', borderW: '1.5pt', bold: true, align: 'center' },
  { name: 'ST_ESTALO_DONE', bg: '#423010', fg: '#fff4c4', border: '#f7d886', borderW: '2pt', bold: true, align: 'center' },
];

// ============================================================================
// 6. Automatic Style & Validation Registries for content.xml
// ============================================================================
class OdsWorkbook {
  constructor() {
    this.sheets = [];
    this.cellStyles = new Map();
    this.colStyles = new Map();
    this.rowStyles = new Map();
    this.tableStyles = new Map();
    this.validations = new Map();
  }

  getCellStyle(opts = {}) {
    const norm = {
      bg: opts.bg ?? PAL.VAZIO,
      fg: opts.fg ?? PAL.TINTA,
      font: opts.font ?? 'Archivo',
      size: opts.size ?? 10,
      bold: !!opts.bold,
      italic: !!opts.italic,
      halign: opts.halign ?? 'start',
      valign: opts.valign ?? 'middle',
      wrap: opts.wrap !== false,
      pad: opts.pad ?? '0.10cm',
      bTop: opts.bTop ?? opts.border ?? 'none',
      bBot: opts.bBot ?? opts.border ?? 'none',
      bLeft: opts.bLeft ?? opts.border ?? 'none',
      bRight: opts.bRight ?? opts.border ?? 'none',
      maps: opts.maps ?? [],
    };
    const key = JSON.stringify(norm);
    if (!this.cellStyles.has(key)) {
      const name = `ce_${this.cellStyles.size + 1}`;
      this.cellStyles.set(key, { name, ...norm });
    }
    return this.cellStyles.get(key).name;
  }

  getColStyle(widthCm) {
    const w = widthCm.toFixed(3);
    if (!this.colStyles.has(w)) {
      const name = `co_${this.colStyles.size + 1}`;
      this.colStyles.set(w, { name, widthCm: w });
    }
    return this.colStyles.get(w).name;
  }

  getRowStyle(heightCm) {
    const h = heightCm.toFixed(3);
    if (!this.rowStyles.has(h)) {
      const name = `ro_${this.rowStyles.size + 1}`;
      this.rowStyles.set(h, { name, heightCm: h });
    }
    return this.rowStyles.get(h).name;
  }

  getTableStyle(tabColor) {
    if (!this.tableStyles.has(tabColor)) {
      const name = `ta_${this.tableStyles.size + 1}`;
      this.tableStyles.set(tabColor, { name, tabColor });
    }
    return this.tableStyles.get(tabColor).name;
  }

  addValidation(name, options, baseCellAddr, promptTitle = '', promptBody = '') {
    for (const opt of options) {
      if (opt.includes(';') || opt.includes('"') || opt.includes('?')) {
        throw new Error(`Invalid character in dropdown option (${name}): ${opt}`);
      }
    }
    assertCleanText(promptTitle, `validation title ${name}`);
    assertCleanText(promptBody, `validation body ${name}`);
    this.validations.set(name, { name, options, baseCellAddr, promptTitle, promptBody });
    return name;
  }

  createSheet(name, tabColor, colWidths) {
    const sheet = new OdsSheet(this, name, tabColor, colWidths);
    this.sheets.push(sheet);
    return sheet;
  }
}

class OdsSheet {
  constructor(wb, name, tabColor, colWidths) {
    this.wb = wb;
    this.name = name;
    this.tabColor = tabColor;
    this.colWidths = colWidths;
    this.rowHeights = []; // 0-based index -> height in cm
    this.cells = new Map(); // "c,r1" -> cellDef
    this.covered = new Set(); // "c,r1"
    this.merges = [];
    this.images = [];
    this.nextR = 1;
  }

  ensureRow(r1, defaultH = 0.65) {
    while (this.rowHeights.length < r1) {
      this.rowHeights.push(defaultH);
    }
  }

  setRowHeight(r1, hCm) {
    this.ensureRow(r1);
    this.rowHeights[r1 - 1] = hCm;
  }

  addRow(hCm = 0.65) {
    const r1 = this.nextR++;
    this.setRowHeight(r1, hCm);
    return r1;
  }

  addBlankRow(hCm = 0.35, styleOpts = { bg: PAL.VAZIO }) {
    const r1 = this.addRow(hCm);
    const st = this.wb.getCellStyle(styleOpts);
    for (let c = 0; c < this.colWidths.length; c++) {
      this.setCell(c, r1, { style: st });
    }
    return r1;
  }

  fillRowBg(r1, startC, endC, styleOpts) {
    const st = this.wb.getCellStyle(styleOpts);
    for (let c = startC; c <= endC; c++) {
      if (!this.cells.has(`${c},${r1}`) && !this.covered.has(`${c},${r1}`)) {
        this.setCell(c, r1, { style: st });
      }
    }
  }

  setCell(c, r1, def = {}) {
    this.ensureRow(r1);
    if (def.text !== undefined) {
      if (Array.isArray(def.text)) {
        def.text.forEach((t) => assertCleanText(t, `${this.name}!${refCell(c, r1)}`));
      } else {
        assertCleanText(def.text, `${this.name}!${refCell(c, r1)}`);
      }
    }
    if (def.formula && !def.formula.startsWith('of:=')) {
      throw new Error(`Formula must start with of:= (${this.name}!${refCell(c, r1)}): ${def.formula}`);
    }
    const styleName = def.style ?? this.wb.getCellStyle(def.styleOpts ?? {});
    const spanC = def.spanC ?? 1;
    const spanR = def.spanR ?? 1;
    if (spanC > 1 || spanR > 1) {
      for (let rr = r1; rr < r1 + spanR; rr++) {
        this.ensureRow(rr);
        for (let cc = c; cc < c + spanC; cc++) {
          if (cc === c && rr === r1) continue;
          const k = `${cc},${rr}`;
          if (this.covered.has(k) || this.cells.has(k)) {
            throw new Error(`Merge overlap on ${this.name}!${refCell(cc, rr)}`);
          }
          this.covered.add(k);
          this.cells.set(k, { covered: true, style: styleName });
        }
      }
      this.merges.push({ c1: c, r1, c2: c + spanC - 1, r2: r1 + spanR - 1 });
    }
    const key = `${c},${r1}`;
    this.cells.set(key, {
      c,
      r1,
      style: styleName,
      text: def.text,
      formula: def.formula,
      valueType: def.valueType,
      value: def.value,
      validation: def.validation,
      spanC,
      spanR,
      isReserve: !!def.isReserve,
    });
    return refCell(c, r1);
  }

  setBox(c1, r1, c2, r2, def = {}) {
    return this.setCell(c1, r1, {
      ...def,
      spanC: c2 - c1 + 1,
      spanR: r2 - r1 + 1,
    });
  }

  // Reserve empty cells and place proportional image inside bounding box
  placeImage(imgKey, c1, r1, c2, r2, padCm = 0.14, styleOpts = { bg: PAL.CARTAO }) {
    this.ensureRow(r2);
    this.setBox(c1, r1, c2, r2, {
      styleOpts,
      isReserve: true,
    });
    let x0 = 0;
    for (let c = 0; c < c1; c++) x0 += this.colWidths[c];
    let boxW = 0;
    for (let c = c1; c <= c2; c++) boxW += this.colWidths[c];
    let y0 = 0;
    for (let r = 0; r < r1 - 1; r++) y0 += this.rowHeights[r];
    let boxH = 0;
    for (let r = r1 - 1; r <= r2 - 1; r++) boxH += this.rowHeights[r];

    const availW = Math.max(0.2, boxW - 2 * padCm);
    const availH = Math.max(0.2, boxH - 2 * padCm);
    const img = loadedImages[imgKey];
    if (!img) throw new Error(`Unknown image key: ${imgKey}`);
    const scale = Math.min(availW / img.width, availH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = x0 + (boxW - w) / 2;
    const y = y0 + (boxH - h) / 2;

    this.images.push({
      name: `${this.name}_${imgKey}_${this.images.length + 1}`,
      zipPath: img.zipPath,
      xCm: x.toFixed(3),
      yCm: y.toFixed(3),
      wCm: w.toFixed(3),
      hCm: h.toFixed(3),
    });
  }
}

// ============================================================================
// 7. Common Style Presets
// ============================================================================
const B_GOLD = `1.5pt solid ${PAL.LATAO}`;
const B_GOLD_THICK = `2.5pt solid ${PAL.LATAO}`;
const B_GOLD_DIM = `1pt solid ${PAL.LATAO_ESC}`;
const B_STONE = `1pt solid ${PAL.NOGUEIRA}`;

const MAPS_STATUS = [
  { cond: 'cell-content()="✓ CORRETO"', style: 'ST_OK' },
  { cond: 'cell-content()="✓ ACOPLADO"', style: 'ST_OK' },
  { cond: 'cell-content()="✓ PASSO OK"', style: 'ST_OK' },
  { cond: 'cell-content()="★ CONQUISTADA"', style: 'ST_OK' },
  { cond: 'cell-content()="★ DEMO ATIVA"', style: 'ST_GOLD' },
  { cond: 'cell-content()="★ ESTALO LIBERADO"', style: 'ST_GOLD' },
  { cond: 'cell-content()="★ ESTALO REALIZADO"', style: 'ST_ESTALO_DONE' },
  { cond: 'cell-content()="✗ AJUSTAR"', style: 'ST_ERR' },
  { cond: 'cell-content()="✗ DUPLICADO"', style: 'ST_ERR' },
  { cond: 'cell-content()="✗ INVÁLIDO"', style: 'ST_ERR' },
  { cond: 'cell-content()="✗ FORA DE ORDEM"', style: 'ST_ERR' },
  { cond: 'cell-content()="✗ BLOQUEADO"', style: 'ST_ERR' },
  { cond: 'cell-content()="○ PENDENTE"', style: 'ST_WAIT' },
  { cond: 'cell-content()="○ EM CONSTRUÇÃO"', style: 'ST_WAIT' },
  { cond: 'cell-content()="○ AGUARDANDO SO 2"', style: 'ST_WAIT' },
  { cond: 'cell-content()="○ TRAVADA"', style: 'ST_WAIT' },
];

function gemStyleMaps(styleOnName) {
  return [
    { cond: 'cell-content()="■ CONCLUÍDA"', style: styleOnName },
    { cond: 'cell-content()="■ OK"', style: styleOnName },
    { cond: 'cell-content()="◆ PODER · OK"', style: 'ST_PODER_ON' },
    { cond: 'cell-content()="◆ TEMPO · OK"', style: 'ST_TEMPO_ON' },
    { cond: 'cell-content()="◆ ESPAÇO · OK"', style: 'ST_ESPACO_ON' },
    { cond: 'cell-content()="◆ REALIDADE · DEMO"', style: 'ST_REALIDADE_ON' },
    { cond: 'cell-content()="◆ ALMA · DEMO"', style: 'ST_ALMA_ON' },
    { cond: 'cell-content()="◆ MENTE · DEMO"', style: 'ST_MENTE_ON' },
  ];
}

function makeButtonStyle(bg = PAL.LATAO, fg = PAL.SOBRE_OURO, border = `1.5pt solid ${PAL.LATAO_CLARO}`) {
  return {
    bg,
    fg,
    border,
    bold: true,
    size: 10,
    halign: 'center',
    valign: 'middle',
    wrap: true,
  };
}

function makeCardOpts(extra = {}) {
  return {
    bg: PAL.CARTAO,
    fg: PAL.TINTA,
    border: B_GOLD_DIM,
    size: 10,
    wrap: true,
    ...extra,
  };
}

// ============================================================================
// 8. Build Workbook
// ============================================================================
const wb = new OdsWorkbook();

// Pre-create sheets so cross-sheet references are well-defined
const COLS_STD = [0.5, 1.8, 3.0, 3.0, 3.0, 3.0, 3.4, 3.4, 2.7, 3.7, 3.7, 0.5]; // 12 cols (A..L, inner B..K)
const COLS_SALAO = [0.5, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 2.35, 0.5]; // 14 cols (A..N, inner B..M)

const sSalao = wb.createSheet('SALAO', PAL.LATAO, COLS_SALAO);
const sPoder = wb.createSheet('J1_PODER', PAL.PODER, COLS_STD);
const sTempo = wb.createSheet('J2_TEMPO', PAL.TEMPO, COLS_STD);
const sEspaco = wb.createSheet('J3_ESPACO', PAL.ESPACO, COLS_STD);
const sRealidade = wb.createSheet('J4_REALIDADE', PAL.REALIDADE, COLS_STD);
const sAlma = wb.createSheet('J5_ALMA', PAL.ALMA, COLS_STD);
const sMente = wb.createSheet('J6_MENTE', PAL.MENTE, COLS_STD);
const sEstalo = wb.createSheet('ESTALO', PAL.LATAO_CLARO, COLS_STD);
const sGuia = wb.createSheet('GUIA', PAL.ARDOSIA, COLS_STD);

// References exported by each gem sheet for SALAO & ESTALO
const TRACK = {};

// ============================================================================
// Helper to build standard single/multi stage sections on SO 1 sheets
// ============================================================================
function addGemHeader(sheet, cfg) {
  sheet.addBlankRow(0.45);
  const r2 = sheet.addRow(1.1);
  const r3 = sheet.addRow(1.1);
  const r4 = sheet.addRow(1.1);
  const r5 = sheet.addRow(1.1);

  // Fill void margins
  for (const r of [r2, r3, r4, r5]) {
    sheet.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sheet.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
  }

  // Left reserve box: Gem PNG (B2:C5)
  sheet.placeImage(cfg.gemImg, 1, r2, 2, r5, 0.25, {
    bg: PAL.CARTAO,
    bTop: `2.5pt solid ${cfg.accent}`,
    bBot: B_GOLD,
    bLeft: B_GOLD,
    bRight: B_GOLD_DIM,
  });

  // Title & Subtitle (D2:H5)
  sheet.setBox(3, r2, 7, r3, {
    text: cfg.title,
    styleOpts: {
      bg: PAL.CARTAO,
      fg: PAL.LATAO_CLARO,
      font: 'Young Serif',
      size: 16,
      bold: true,
      bTop: `2.5pt solid ${cfg.accent}`,
      bBot: B_GOLD_DIM,
      halign: 'start',
      valign: 'middle',
    },
  });
  sheet.setBox(3, r4, 7, r5, {
    text: cfg.subtitle,
    styleOpts: {
      bg: PAL.CARTAO,
      fg: PAL.TINTA_SUAVE,
      size: 10,
      bBot: B_GOLD,
      halign: 'start',
      valign: 'middle',
    },
  });

  // Counter & Status (I2:J5) — placeholders updated after stages added
  const counterRef = sheet.setBox(8, r2, 9, r3, {
    text: '0 / ' + cfg.totalSteps,
    styleOpts: {
      bg: PAL.CARTAO_SOMBRA,
      fg: PAL.LATAO_CLARO,
      size: 13,
      bold: true,
      halign: 'center',
      bTop: `2.5pt solid ${cfg.accent}`,
      bLeft: B_GOLD_DIM,
      bRight: B_GOLD_DIM,
      bBot: B_GOLD_DIM,
    },
  });
  const badgeRef = sheet.setBox(8, r4, 9, r5, {
    text: '○ EM CONSTRUÇÃO',
    styleOpts: {
      bg: '#1d1728',
      fg: PAL.TINTA_SUAVE,
      size: 10,
      bold: true,
      halign: 'center',
      bBot: B_GOLD,
      bLeft: B_GOLD_DIM,
      bRight: B_GOLD_DIM,
      maps: MAPS_STATUS,
    },
  });

  // Right reserve box: Altar PNG (K2:K5)
  sheet.placeImage(cfg.altarImg, 10, r2, 10, r5, 0.15, {
    bg: PAL.CARTAO,
    bTop: `2.5pt solid ${cfg.accent}`,
    bBot: B_GOLD,
    bLeft: B_GOLD_DIM,
    bRight: B_GOLD,
  });

  // Navigation bar (Row 6)
  const rNav = sheet.addRow(0.95);
  sheet.setCell(0, rNav, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rNav, { styleOpts: { bg: PAL.VAZIO } });

  sheet.setBox(1, rNav, 2, rNav, {
    formula: 'of:=HYPERLINK("#SALAO.A1";"◀ SALÃO DE TITÃ")',
    valueType: 'string',
    value: '◀ SALÃO DE TITÃ',
    text: '◀ SALÃO DE TITÃ',
    styleOpts: makeButtonStyle(),
  });
  sheet.setBox(3, rNav, 4, rNav, {
    formula: `of:=HYPERLINK("#${cfg.prevSheet}.A1";"${cfg.prevLabel}")`,
    valueType: 'string',
    value: cfg.prevLabel,
    text: cfg.prevLabel,
    styleOpts: makeButtonStyle(PAL.CARTAO_SOMBRA, PAL.LATAO_CLARO, B_GOLD_DIM),
  });
  sheet.setBox(5, rNav, 6, rNav, {
    formula: `of:=HYPERLINK("#${cfg.nextSheet}.A1";"${cfg.nextLabel}")`,
    valueType: 'string',
    value: cfg.nextLabel,
    text: cfg.nextLabel,
    styleOpts: makeButtonStyle(PAL.CARTAO_SOMBRA, PAL.LATAO_CLARO, B_GOLD_DIM),
  });
  sheet.setBox(7, rNav, 10, rNav, {
    text: 'Dica: clique nas células douradas (▼) para montar a bancada da FCTarc13.',
    styleOpts: {
      bg: PAL.CARTAO,
      fg: PAL.TINTA_SUAVE,
      size: 9,
      italic: true,
      border: B_STONE,
      halign: 'center',
    },
  });

  return { counterRef, badgeRef, counterRow: r2, badgeRow: r4 };
}

function addTableHeader(sheet) {
  sheet.addBlankRow(0.30);
  const rH = sheet.addRow(0.80);
  sheet.setCell(0, rH, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rH, { styleOpts: { bg: PAL.VAZIO } });

  const hdrStyle = {
    bg: PAL.ARDOSIA,
    fg: PAL.LATAO_CLARO,
    size: 9,
    bold: true,
    bTop: B_GOLD,
    bBot: B_GOLD,
    bLeft: B_GOLD_DIM,
    bRight: B_GOLD_DIM,
    halign: 'center',
  };
  sheet.setCell(1, rH, { text: 'ETAPA', styleOpts: hdrStyle });
  sheet.setBox(2, rH, 5, rH, { text: 'DIRETRIZ TÉCNICA DE ENGENHARIA (FCTarc13 / FCTos01)', styleOpts: hdrStyle });
  sheet.setBox(6, rH, 7, rH, { text: 'BANCADA INTERATIVA (SELEÇÃO ▼)', styleOpts: hdrStyle });
  sheet.setCell(8, rH, { text: 'ESTADO', styleOpts: hdrStyle });
  sheet.setBox(9, rH, 10, rH, { text: 'RETORNO DO SISTEMA E SÍNTESE', styleOpts: hdrStyle });
}

function addSingleStage(sheet, valPrefix, stage) {
  const r = sheet.addRow(1.55);
  sheet.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });

  const valName = `${valPrefix}_e${stage.num}`;
  const inputRef = refCell(6, r);
  const statusRef = refCell(8, r);

  sheet.wb.addValidation(valName, stage.options.map((o) => o.label), `${sheet.name}.${inputRef}`, stage.title, 'Escolha a diretriz correta na bancada.');

  sheet.setCell(1, r, {
    text: `ETAPA ${String(stage.num).padStart(2, '0')}`,
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_STONE },
  });
  sheet.setBox(2, r, 5, r, {
    text: [stage.title, stage.directive],
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE, halign: 'start', valign: 'middle' },
  });
  sheet.setBox(6, r, 7, r, {
    validation: valName,
    styleOpts: { bg: '#21182c', fg: PAL.LATAO_CLARO, bold: true, size: 9, border: B_GOLD, halign: 'center' },
  });

  const correctOpt = stage.options.find((o) => o.correct);
  sheet.setCell(8, r, {
    formula: `of:=IF([.${inputRef}]="";"○ PENDENTE";IF([.${inputRef}]="${correctOpt.label}";"✓ CORRETO";"✗ AJUSTAR"))`,
    valueType: 'string',
    value: '○ PENDENTE',
    text: '○ PENDENTE',
    styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
  });

  // Build nested IF feedback formula
  let fbFormula = '"Aguardando configuração na bancada."';
  for (let i = stage.options.length - 1; i >= 0; i--) {
    const o = stage.options[i];
    const msg = o.correct ? `${o.feedback} | Síntese: ${stage.note}` : o.feedback;
    fbFormula = `IF([.${inputRef}]="${o.label}";"${msg}";${fbFormula})`;
  }
  fbFormula = `of:=IF([.${inputRef}]="";"Aguardando configuração na bancada.";${fbFormula})`;

  sheet.setBox(9, r, 10, r, {
    formula: fbFormula,
    valueType: 'string',
    value: 'Aguardando configuração na bancada.',
    text: 'Aguardando configuração na bancada.',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE, halign: 'start' },
  });

  return { row: r, inputRef, statusRef };
}

function addUnorderedMultiStage(sheet, valPrefix, stage) {
  // Header row for the multi-slot stage
  const rHdr = sheet.addRow(1.15);
  sheet.setCell(0, rHdr, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rHdr, { styleOpts: { bg: PAL.VAZIO } });

  sheet.setCell(1, rHdr, {
    text: `ETAPA ${String(stage.num).padStart(2, '0')}`,
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_STONE },
  });
  sheet.setBox(2, rHdr, 7, rHdr, {
    text: [stage.title, stage.directive],
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE },
  });

  const valName = `${valPrefix}_e${stage.num}`;
  const slotRows = [];
  for (let i = 0; i < stage.slots.length; i++) {
    const r = sheet.addRow(0.95);
    sheet.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sheet.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
    slotRows.push({ r, label: stage.slots[i], inputRef: refCell(6, r), statusRef: refCell(8, r) });
  }

  const firstInput = slotRows[0].inputRef;
  const lastInput = slotRows[slotRows.length - 1].inputRef;
  const rangeAddr = `[.${firstInput}:.${lastInput}]`;

  sheet.wb.addValidation(valName, stage.options.map((o) => o.label), `${sheet.name}.${firstInput}`, stage.title, 'Preencha cada soquete sem repetir itens.');

  const correctOpts = stage.options.filter((o) => o.correct);
  const allOkCond = `AND(${correctOpts.map((o) => `COUNTIF(${rangeAddr};"${o.label}")=1`).join(';')})`;
  const anyErrCond = `OR(${slotRows.map((s) => `[.${s.statusRef}]="✗ DUPLICADO";[.${s.statusRef}]="✗ INVÁLIDO"`).join(';')})`;

  const statusRef = refCell(8, rHdr);
  sheet.setCell(8, rHdr, {
    formula: `of:=IF(${allOkCond};"✓ CORRETO";IF(${anyErrCond};"✗ AJUSTAR";"○ PENDENTE"))`,
    valueType: 'string',
    value: '○ PENDENTE',
    text: '○ PENDENTE',
    styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
  });

  sheet.setBox(9, rHdr, 10, rHdr, {
    formula: `of:=IF(${allOkCond};"Conjunto validado! Síntese: ${stage.note}";"Configure todos os ${stage.slots.length} encaixes abaixo sem repetir itens.")`,
    valueType: 'string',
    value: `Configure todos os ${stage.slots.length} encaixes abaixo sem repetir itens.`,
    text: `Configure todos os ${stage.slots.length} encaixes abaixo sem repetir itens.`,
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
  });

  const isCorrectExpr = (inRef) => `OR(${correctOpts.map((o) => `[.${inRef}]="${o.label}"`).join(';')})`;

  for (const s of slotRows) {
    sheet.setCell(1, s.r, { text: '↳', styleOpts: { bg: PAL.CARTAO, fg: PAL.LATAO, halign: 'center', border: B_STONE } });
    sheet.setBox(2, s.r, 5, s.r, {
      text: s.label,
      styleOpts: { bg: '#120e18', fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
    });
    sheet.setBox(6, s.r, 7, s.r, {
      validation: valName,
      styleOpts: { bg: '#21182c', fg: PAL.LATAO_CLARO, bold: true, size: 9, border: B_GOLD, halign: 'center' },
    });
    sheet.setCell(8, s.r, {
      formula: `of:=IF([.${s.inputRef}]="";"○ PENDENTE";IF(${isCorrectExpr(s.inputRef)};IF(COUNTIF(${rangeAddr};[.${s.inputRef}])>1;"✗ DUPLICADO";"✓ ACOPLADO");"✗ INVÁLIDO"))`,
      valueType: 'string',
      value: '○ PENDENTE',
      text: '○ PENDENTE',
      styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
    });

    let fbFormula = '"Selecione um item neste encaixe."';
    for (let i = stage.options.length - 1; i >= 0; i--) {
      const o = stage.options[i];
      fbFormula = `IF([.${s.inputRef}]="${o.label}";"${o.feedback}";${fbFormula})`;
    }
    fbFormula = `of:=IF([.${s.inputRef}]="";"Selecione um item neste encaixe.";IF(COUNTIF(${rangeAddr};[.${s.inputRef}])>1;"Item repetido em outro encaixe. Escolha outro componente distinto.";${fbFormula}))`;

    sheet.setBox(9, s.r, 10, s.r, {
      formula: fbFormula,
      valueType: 'string',
      value: 'Selecione um item neste encaixe.',
      text: 'Selecione um item neste encaixe.',
      styleOpts: { bg: '#120e18', fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
    });
  }

  return { row: rHdr, statusRef, rangeAddr, slotInputs: slotRows.map((s) => s.inputRef) };
}

function addOrderedMultiStage(sheet, valPrefix, stage) {
  const rHdr = sheet.addRow(1.15);
  sheet.setCell(0, rHdr, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rHdr, { styleOpts: { bg: PAL.VAZIO } });

  sheet.setCell(1, rHdr, {
    text: `ETAPA ${String(stage.num).padStart(2, '0')}`,
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_STONE },
  });
  sheet.setBox(2, rHdr, 7, rHdr, {
    text: [stage.title, stage.directive],
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE },
  });

  const sharedName = stage.sharedOptions ? `${valPrefix}_e${stage.num}` : null;
  if (sharedName) {
    sheet.wb.addValidation(sharedName, stage.sharedOptions.map((o) => o.label), `${sheet.name}.${refCell(6, rHdr + 1)}`, stage.title, 'Selecione na ordem exata.');
  }

  const slotRows = [];
  for (let i = 0; i < stage.slots.length; i++) {
    const r = sheet.addRow(0.95);
    sheet.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sheet.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
    const sl = stage.slots[i];
    let valName = sharedName;
    if (!valName) {
      valName = `${valPrefix}_e${stage.num}_s${i + 1}`;
      sheet.wb.addValidation(valName, sl.options.map((o) => o.label), `${sheet.name}.${refCell(6, r)}`, `${stage.title} - ${sl.label}`, 'Selecione a configuração correta.');
    }
    slotRows.push({ r, sl, valName, inputRef: refCell(6, r), statusRef: refCell(8, r) });
  }

  const allOkCond = `AND(${slotRows.map((s) => `[.${s.inputRef}]="${s.sl.expected}"`).join(';')})`;
  const anyErrCond = `OR(${slotRows.map((s) => `[.${s.statusRef}]="✗ INVÁLIDO";[.${s.statusRef}]="✗ FORA DE ORDEM"`).join(';')})`;
  const statusRef = refCell(8, rHdr);

  sheet.setCell(8, rHdr, {
    formula: `of:=IF(${allOkCond};"✓ CORRETO";IF(${anyErrCond};"✗ AJUSTAR";"○ PENDENTE"))`,
    valueType: 'string',
    value: '○ PENDENTE',
    text: '○ PENDENTE',
    styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
  });

  sheet.setBox(9, rHdr, 10, rHdr, {
    formula: `of:=IF(${allOkCond};"Etapa concluída! Síntese: ${stage.note}";"Configure os ${slotRows.length} passos abaixo para validar a etapa.")`,
    valueType: 'string',
    value: `Configure os ${slotRows.length} passos abaixo para validar a etapa.`,
    text: `Configure os ${slotRows.length} passos abaixo para validar a etapa.`,
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
  });

  for (const s of slotRows) {
    sheet.setCell(1, s.r, { text: '↳', styleOpts: { bg: PAL.CARTAO, fg: PAL.LATAO, halign: 'center', border: B_STONE } });
    sheet.setBox(2, s.r, 5, s.r, {
      text: s.sl.label,
      styleOpts: { bg: '#120e18', fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
    });
    sheet.setBox(6, s.r, 7, s.r, {
      validation: s.valName,
      styleOpts: { bg: '#21182c', fg: PAL.LATAO_CLARO, bold: true, size: 9, border: B_GOLD, halign: 'center' },
    });

    const opts = stage.sharedOptions ?? s.sl.options;
    const otherValid = opts.filter((o) => o.isOrderStep && o.label !== s.sl.expected);
    const outOfOrderExpr = otherValid.length ? `OR(${otherValid.map((o) => `[.${s.inputRef}]="${o.label}"`).join(';')})` : 'FALSE()';

    sheet.setCell(8, s.r, {
      formula: `of:=IF([.${s.inputRef}]="";"○ PENDENTE";IF([.${s.inputRef}]="${s.sl.expected}";"${s.sl.okBadge ?? '✓ PASSO OK'}";IF(${outOfOrderExpr};"✗ FORA DE ORDEM";"✗ INVÁLIDO")))`,
      valueType: 'string',
      value: '○ PENDENTE',
      text: '○ PENDENTE',
      styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
    });

    let fbFormula = `"${s.sl.emptyMsg ?? 'Selecione uma opção.'}"`;
    for (let i = opts.length - 1; i >= 0; i--) {
      const o = opts[i];
      let msg = o.feedback;
      if (o.label === s.sl.expected && s.sl.okMsg) msg = s.sl.okMsg;
      else if (o.isOrderStep && o.label !== s.sl.expected) msg = 'Ordem incorreta: esta ação pertence a outro passo da sequência.';
      fbFormula = `IF([.${s.inputRef}]="${o.label}";"${msg}";${fbFormula})`;
    }
    fbFormula = `of:=IF([.${s.inputRef}]="";"${s.sl.emptyMsg ?? 'Selecione uma opção.'}";${fbFormula})`;

    sheet.setBox(9, s.r, 10, s.r, {
      formula: fbFormula,
      valueType: 'string',
      value: s.sl.emptyMsg ?? 'Selecione uma opção.',
      text: s.sl.emptyMsg ?? 'Selecione uma opção.',
      styleOpts: { bg: '#120e18', fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
    });
  }

  return { row: rHdr, statusRef, slotInputs: slotRows.map((s) => s.inputRef) };
}

// ============================================================================
// 9. SHEET 1: J1_PODER (Etapas 01 a 07)
// ============================================================================
{
  const hdr = addGemHeader(sPoder, {
    gemImg: 'gem_poder',
    altarImg: 'altar_aceso',
    accent: PAL.PODER,
    title: 'JOIA DO PODER · MÓDULO SO 1 (ETAPAS 01 A 07)',
    subtitle: 'Bancada FCTarc13: requisitos do projeto, 4 recursos de hardware, braço robótico, justificativa e os 4 componentes do Kernel FCTos01.',
    totalSteps: 7,
    prevSheet: 'GUIA',
    prevLabel: '☰ GUIA DO JOGO',
    nextSheet: 'J2_TEMPO',
    nextLabel: 'PRÓXIMA: JOIA DO TEMPO ▶',
  });

  // Live Schematic Placeholder Rows (rows 8..12) — formulas updated after stage rows are emitted
  sPoder.addBlankRow(0.35);
  const rSchTitle = sPoder.addRow(0.70);
  sPoder.setCell(0, rSchTitle, { styleOpts: { bg: PAL.VAZIO } });
  sPoder.setCell(11, rSchTitle, { styleOpts: { bg: PAL.VAZIO } });
  sPoder.setBox(1, rSchTitle, 3, rSchTitle, { text: 'ESQUEMA AO VIVO · HARDWARE FCTarc13', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.PODER, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sPoder.setBox(4, rSchTitle, 6, rSchTitle, { text: 'CAMADAS DO FCTos01', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.PODER, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sPoder.setBox(7, rSchTitle, 10, rSchTitle, { text: '4 COMPONENTES DO KERNEL', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.PODER, bold: true, size: 9, halign: 'center', border: B_STONE } });

  const rS1 = sPoder.addRow(0.75);
  const rS2 = sPoder.addRow(0.75);
  const rS3 = sPoder.addRow(0.75);
  for (const rr of [rS1, rS2, rS3]) {
    sPoder.setCell(0, rr, { styleOpts: { bg: PAL.VAZIO } });
    sPoder.setCell(11, rr, { styleOpts: { bg: PAL.VAZIO } });
  }

  addTableHeader(sPoder);

  const e1 = addSingleStage(sPoder, 'val_p', {
    num: 1,
    title: 'Etapa 01 · Requisito Prévio do Projeto',
    directive: 'A FCT designou a equipe para criar o FCTos01 do zero. Defina na bancada o conhecimento essencial que precisa ser levantado antes de iniciar o projeto do SO.',
    note: 'O projeto do SO começa mapeando o hardware disponível e o comportamento geral dos programas de usuário que vão utilizá-lo.',
    options: [
      { label: 'Mapear recursos disponíveis e características dos programas de usuários', correct: true, feedback: 'Correto. Conhecer os recursos da FCTarc13 e o perfil dos dois programas do braço robótico define toda a arquitetura do núcleo.' },
      { label: 'Catalogar apenas o fabricante do sistema de computação', correct: false, feedback: 'Insuficiente. O fabricante comercial não informa quais recursos de hardware ou cargas de programa o SO precisa gerenciar.' },
      { label: 'Registrar somente a velocidade máxima do sistema', correct: false, feedback: 'Insuficiente. Clock isolado não descreve memória, dispositivos nem necessidades dos programas de usuário.' },
      { label: 'Fixar apenas a marca e o modelo do equipamento', correct: false, feedback: 'Insuficiente. Rótulos comerciais não substituem o levantamento técnico dos recursos e das aplicações.' },
    ],
  });

  const e2 = addUnorderedMultiStage(sPoder, 'val_p', {
    num: 2,
    title: 'Etapa 02 · Os Quatro Recursos de Hardware',
    directive: 'Inspecione a placa-mãe da FCTarc13 e acople nos 4 soquetes os principais recursos de hardware que ficam à disposição do sistema operacional.',
    note: 'Os quatro pilares de hardware gerenciados pelo SO são: Processador (CPU), Memória RAM, Periféricos e HD ou SSD.',
    slots: ['Soquete de Hardware 1', 'Soquete de Hardware 2', 'Soquete de Hardware 3', 'Soquete de Hardware 4'],
    options: [
      { label: 'Processador (CPU)', correct: true, feedback: 'CPU acoplada ao soquete principal da FCTarc13.' },
      { label: 'Memória RAM', correct: true, feedback: 'Módulos de RAM conectados ao barramento de memória principal.' },
      { label: 'Periféricos (E/S)', correct: true, feedback: 'Controladora de periféricos habilitada na placa.' },
      { label: 'HD ou SSD', correct: true, feedback: 'Armazenamento secundário conectado ao barramento de disco.' },
      { label: 'Gabinete e Filtro de linha', correct: false, feedback: 'Gabinete e filtro de linha são estrutura mecânica/elétrica, não recursos lógicos gerenciados pelo núcleo.' },
      { label: 'Cooler e unidade de CD-ROM', correct: false, feedback: 'Cooler é apenas refrigeração física; faltam os recursos principais de processamento, memória e disco.' },
      { label: 'ROM e Memória Cache', correct: false, feedback: 'Incompleto. ROM e Cache não substituem RAM, Processador e HD/SSD na visão principal do sistema.' },
    ],
  });

  const e3 = addSingleStage(sPoder, 'val_p', {
    num: 3,
    title: 'Etapa 03 · Classificação do Braço Robótico',
    directive: 'Analise a função do braço robótico na arquitetura da FCTarc13 e conecte-o na porta correspondente à sua classificação correta.',
    note: 'Na arquitetura de computadores, o braço robótico é um Dispositivo Periférico controlado via entrada e saída pelo sistema.',
    options: [
      { label: 'Dispositivo Periférico', correct: true, feedback: 'Braço robótico reconhecido. Como atua externamente ao núcleo CPU-memória, ele é classificado como Dispositivo Periférico.' },
      { label: 'Dispositivo alternativo', correct: false, feedback: 'Classificação inválida na Arquitetura de Computadores: dispositivos de E/S externos são periféricos.' },
      { label: 'Dispositivo de auxílio', correct: false, feedback: 'Termo impreciso. O hardware externo acoplado ao barramento de E/S é um dispositivo periférico.' },
      { label: 'Dispositivo alternador', correct: false, feedback: 'Alternador remete a energia elétrica, não à função computacional do braço robótico.' },
    ],
  });

  const e4 = addSingleStage(sPoder, 'val_p', {
    num: 4,
    title: 'Etapa 04 · Justificativa Técnica do SO',
    directive: 'Com os recursos da FCTarc13 e o perfil dos programas mapeados, defina a justificativa técnica pela qual a equipe precisa desenvolver o SO.',
    note: 'O SO existe para dar a impressão de execução paralela aos programas de usuário e permitir o compartilhamento organizado dos recursos.',
    options: [
      { label: 'Dar impressão de execução paralela e compartilhar recursos de forma organizada', correct: true, feedback: 'Diretriz validada. O FCTos01 alterna turnos entre programas e evita conflito por processador, memória e braço robótico.' },
      { label: 'Executar programas de usuários direto em modo Kernel para segurança', correct: false, feedback: 'Erro grave de segurança. Programas de usuário em modo Kernel teriam acesso irrestrito e poderiam derrubar o sistema.' },
      { label: 'Impedir que programas dependam do código VHDL da memória ROM', correct: false, feedback: 'Incorreto. VHDL descreve o hardware em FPGA; a função do SO é organizar execução e compartilhamento.' },
      { label: 'Fazer a FCTarc13 gerar novos programas de usuário automaticamente', correct: false, feedback: 'Incorreto. O SO gerencia a execução de programas já desenvolvidos, não os gera sozinho.' },
    ],
  });

  const e5 = addUnorderedMultiStage(sPoder, 'val_p', {
    num: 5,
    title: 'Etapa 05 · Duas Funções Principais do SO',
    directive: 'Estabeleça na camada intermediária do sistema as duas principais funções desempenhadas por qualquer sistema operacional.',
    note: 'Todo SO atua como Máquina Virtual/Estendida (base simplificada para programação) e Gerente de Recursos (uso ordenado do hardware).',
    slots: ['Função Estrutural 1', 'Função Estrutural 2'],
    options: [
      { label: 'Máquina Virtual ou Estendida', correct: true, feedback: 'Camada de abstração conectada: os programas enxergam uma máquina mais fácil de programar.' },
      { label: 'Gerente de Recursos', correct: true, feedback: 'Camada de controle conectada: CPU, RAM e periféricos passam a ter arbitragem ordenada.' },
      { label: 'Manipulador físico de braços robóticos', correct: false, feedback: 'Isso seria específico de um dispositivo, não uma das duas funções universais de qualquer SO.' },
      { label: 'Gerente de atividades implícitas', correct: false, feedback: 'Conceito inválido. A função real é gerenciar os recursos físicos e lógicos explicitamente.' },
      { label: 'Carregador isolado de programas', correct: false, feedback: 'Visão restrita. Os dois papéis clássicos são Máquina Estendida e Gerente de Recursos.' },
    ],
  });

  const e6 = addSingleStage(sPoder, 'val_p', {
    num: 6,
    title: 'Etapa 06 · Ponto de Partida da Chefia',
    directive: 'Como chefe da equipe contratada pela Unesp para desenvolver o SO da FCTarc13, determine a tarefa inicial que abre o desenvolvimento do núcleo.',
    note: 'Antes de desenhar interfaces, tabelas ou fluxos de micro-instruções, a equipe precisa definir as tarefas dos componentes principais do SO.',
    options: [
      { label: 'Definir as tarefas dos componentes principais do SO', correct: true, feedback: 'Marco zero estabelecido. Com o papel de cada componente definido, o restante da arquitetura pode ser detalhado.' },
      { label: 'Começar pelo diagrama de fluxo de dados sobre a micro-memória', correct: false, feedback: 'Etapa prematura. Sem definir os componentes do SO e suas tarefas, não há o que mapear no fluxo de instruções.' },
      { label: 'Começar pela elaboração direta da tabela de processos', correct: false, feedback: 'Estrutura de dados vem depois da definição das responsabilidades de cada subsistema do núcleo.' },
      { label: 'Começar caracterizando a interface visual com o usuário', correct: false, feedback: 'A interface fica na camada mais externa; o núcleo parte da definição funcional dos componentes do SO.' },
    ],
  });

  const e7 = addUnorderedMultiStage(sPoder, 'val_p', {
    num: 7,
    title: 'Etapa 07 · Os Quatro Componentes do Núcleo',
    directive: 'Estruture o Kernel do FCTos01 instalando nos 4 módulos os principais componentes presentes em qualquer núcleo de sistema operacional.',
    note: 'Todo núcleo de SO se apoia em 4 componentes: Escalonador de processos e threads, Gerente de memória, Sistema de arquivos e Software de E/S.',
    slots: ['Módulo do Kernel 1', 'Módulo do Kernel 2', 'Módulo do Kernel 3', 'Módulo do Kernel 4'],
    options: [
      { label: 'Escalonador de processos e threads', correct: true, feedback: 'Módulo acoplado: o escalonador decide quem usa a CPU.' },
      { label: 'Gerente de memória', correct: true, feedback: 'Módulo acoplado: controle de partições e endereços da RAM ativado.' },
      { label: 'Sistema de arquivos', correct: true, feedback: 'Módulo acoplado: organização lógica de blocos no disco pronta.' },
      { label: 'Software de entrada e saída', correct: true, feedback: 'Módulo acoplado: drivers e controle de periféricos integrados.' },
      { label: 'BIOS e Controlador de DMA', correct: false, feedback: 'Rejeitado pelo Kernel: BIOS e controladores físicos ficam abaixo do núcleo de software.' },
      { label: 'Processador e Memória RAM', correct: false, feedback: 'Confusão de camadas: CPU e RAM são hardware físico, não módulos de software do núcleo.' },
      { label: 'Inicializador e Finalizador', correct: false, feedback: 'Incompleto: faltam gerência de memória, sistema de arquivos e software de E/S.' },
    ],
  });

  // Wire Live Schematic Blocks (rows rS1..rS3)
  const schStyle = (activeLabel, inactiveLabel) => ({
    bg: '#14101c',
    fg: '#8f81a1',
    border: B_STONE,
    size: 9,
    bold: true,
    halign: 'center',
    maps: [
      { cond: `cell-content()="${activeLabel}"`, style: 'ST_PODER_ON' },
      { cond: `cell-content()="${inactiveLabel}"`, style: 'ST_BLOCK_OFF' },
    ],
  });

  sPoder.setBox(1, rS1, 2, rS1, {
    formula: `of:=IF(COUNTIF(${e2.rangeAddr};"Processador (CPU)")=1;"■ CPU · ATIVA";"□ CPU · VAZIO")`,
    valueType: 'string', value: '□ CPU · VAZIO', text: '□ CPU · VAZIO',
    styleOpts: schStyle('■ CPU · ATIVA', '□ CPU · VAZIO'),
  });
  sPoder.setCell(3, rS1, {
    formula: `of:=IF(COUNTIF(${e2.rangeAddr};"Memória RAM")=1;"■ RAM · ATIVA";"□ RAM · VAZIO")`,
    valueType: 'string', value: '□ RAM · VAZIO', text: '□ RAM · VAZIO',
    styleOpts: schStyle('■ RAM · ATIVA', '□ RAM · VAZIO'),
  });
  sPoder.setBox(1, rS2, 2, rS2, {
    formula: `of:=IF(COUNTIF(${e2.rangeAddr};"HD ou SSD")=1;"■ HD/SSD · ATIVO";"□ HD/SSD · VAZIO")`,
    valueType: 'string', value: '□ HD/SSD · VAZIO', text: '□ HD/SSD · VAZIO',
    styleOpts: schStyle('■ HD/SSD · ATIVO', '□ HD/SSD · VAZIO'),
  });
  sPoder.setCell(3, rS2, {
    formula: `of:=IF(COUNTIF(${e2.rangeAddr};"Periféricos (E/S)")=1;"■ E/S · ATIVO";"□ E/S · VAZIO")`,
    valueType: 'string', value: '□ E/S · VAZIO', text: '□ E/S · VAZIO',
    styleOpts: schStyle('■ E/S · ATIVO', '□ E/S · VAZIO'),
  });
  sPoder.setBox(1, rS3, 3, rS3, {
    formula: `of:=IF([.${e3.inputRef}]="Dispositivo Periférico";"■ BRAÇO · PERIFÉRICO E/S";"□ BRAÇO ROBÓTICO · PENDENTE")`,
    valueType: 'string', value: '□ BRAÇO ROBÓTICO · PENDENTE', text: '□ BRAÇO ROBÓTICO · PENDENTE',
    styleOpts: schStyle('■ BRAÇO · PERIFÉRICO E/S', '□ BRAÇO ROBÓTICO · PENDENTE'),
  });

  // Middle Schematic: SO Layers
  sPoder.setBox(4, rS1, 6, rS1, {
    formula: `of:=IF(COUNTIF(${e5.rangeAddr};"Máquina Virtual ou Estendida")=1;"■ MÁQUINA ESTENDIDA · ATIVA";"□ MÁQUINA ESTENDIDA · INATIVA")`,
    valueType: 'string', value: '□ MÁQUINA ESTENDIDA · INATIVA', text: '□ MÁQUINA ESTENDIDA · INATIVA',
    styleOpts: schStyle('■ MÁQUINA ESTENDIDA · ATIVA', '□ MÁQUINA ESTENDIDA · INATIVA'),
  });
  sPoder.setBox(4, rS2, 6, rS2, {
    formula: `of:=IF(COUNTIF(${e5.rangeAddr};"Gerente de Recursos")=1;"■ GERENTE DE RECURSOS · ATIVO";"□ GERENTE DE RECURSOS · INATIVO")`,
    valueType: 'string', value: '□ GERENTE DE RECURSOS · INATIVO', text: '□ GERENTE DE RECURSOS · INATIVO',
    styleOpts: schStyle('■ GERENTE DE RECURSOS · ATIVO', '□ GERENTE DE RECURSOS · INATIVO'),
  });
  sPoder.setBox(4, rS3, 6, rS3, {
    formula: `of:=IF([.${e4.statusRef}]="✓ CORRETO";"■ PARALELISMO ORGANIZADO";"□ JUSTIFICATIVA DO SO · PENDENTE")`,
    valueType: 'string', value: '□ JUSTIFICATIVA DO SO · PENDENTE', text: '□ JUSTIFICATIVA DO SO · PENDENTE',
    styleOpts: schStyle('■ PARALELISMO ORGANIZADO', '□ JUSTIFICATIVA DO SO · PENDENTE'),
  });

  // Right Schematic: 4 Kernel Modules
  sPoder.setBox(7, rS1, 8, rS1, {
    formula: `of:=IF(COUNTIF(${e7.rangeAddr};"Escalonador de processos e threads")=1;"■ ESCALONADOR";"□ ESCALONADOR")`,
    valueType: 'string', value: '□ ESCALONADOR', text: '□ ESCALONADOR',
    styleOpts: schStyle('■ ESCALONADOR', '□ ESCALONADOR'),
  });
  sPoder.setBox(9, rS1, 10, rS1, {
    formula: `of:=IF(COUNTIF(${e7.rangeAddr};"Gerente de memória")=1;"■ GER. MEMÓRIA";"□ GER. MEMÓRIA")`,
    valueType: 'string', value: '□ GER. MEMÓRIA', text: '□ GER. MEMÓRIA',
    styleOpts: schStyle('■ GER. MEMÓRIA', '□ GER. MEMÓRIA'),
  });
  sPoder.setBox(7, rS2, 8, rS2, {
    formula: `of:=IF(COUNTIF(${e7.rangeAddr};"Sistema de arquivos")=1;"■ SIST. ARQUIVOS";"□ SIST. ARQUIVOS")`,
    valueType: 'string', value: '□ SIST. ARQUIVOS', text: '□ SIST. ARQUIVOS',
    styleOpts: schStyle('■ SIST. ARQUIVOS', '□ SIST. ARQUIVOS'),
  });
  sPoder.setBox(9, rS2, 10, rS2, {
    formula: `of:=IF(COUNTIF(${e7.rangeAddr};"Software de entrada e saída")=1;"■ SOFTWARE E/S";"□ SOFTWARE E/S")`,
    valueType: 'string', value: '□ SOFTWARE E/S', text: '□ SOFTWARE E/S',
    styleOpts: schStyle('■ SOFTWARE E/S', '□ SOFTWARE E/S'),
  });
  sPoder.setBox(7, rS3, 10, rS3, {
    formula: `of:=IF([.${e7.statusRef}]="✓ CORRETO";"■ KERNEL FCTos01 OPERACIONAL";"□ KERNEL INCOMPLETO")`,
    valueType: 'string', value: '□ KERNEL INCOMPLETO', text: '□ KERNEL INCOMPLETO',
    styleOpts: schStyle('■ KERNEL FCTos01 OPERACIONAL', '□ KERNEL INCOMPLETO'),
  });

  // Wire Header Counter & Badge
  const statusList = [e1, e2, e3, e4, e5, e6, e7].map((e) => `IF([.${e.statusRef}]="✓ CORRETO";1;0)`).join('+');
  sPoder.cells.get(`8,${hdr.counterRow}`).formula = `of:=(${statusList}) & " / 7"`;
  sPoder.cells.get(`8,${hdr.counterRow}`).valueType = 'string';
  sPoder.cells.get(`8,${hdr.counterRow}`).value = '0 / 7';
  sPoder.cells.get(`8,${hdr.badgeRow}`).formula = `of:=IF((${statusList})=7;"★ CONQUISTADA";"○ EM CONSTRUÇÃO")`;

  sPoder.addBlankRow(0.5);
  TRACK.poder = {
    sheet: 'J1_PODER',
    statusCells: [e1, e2, e3, e4, e5, e6, e7].map((e) => e.statusRef),
    badgeRef: hdr.badgeRef,
    inputs: [e1.inputRef, ...e2.slotInputs, e3.inputRef, e4.inputRef, ...e5.slotInputs, e6.inputRef, ...e7.slotInputs],
  };
}

// ============================================================================
// 10. SHEET 2: J2_TEMPO (Etapas 08 a 16)
// ============================================================================
{
  const hdr = addGemHeader(sTempo, {
    gemImg: 'gem_tempo',
    altarImg: 'altar_aceso',
    accent: PAL.TEMPO,
    title: 'JOIA DO TEMPO · MÓDULO SO 1 (ETAPAS 08 A 16)',
    subtitle: 'Trilha de Boot (ROM/BIOS → RAM/IC), escalonamento por turnos de CPU, sistemas multiprogramados e gerenciamento de processos.',
    totalSteps: 9,
    prevSheet: 'J1_PODER',
    prevLabel: '◀ ANTERIOR: PODER',
    nextSheet: 'J3_ESPACO',
    nextLabel: 'PRÓXIMA: JOIA DO ESPAÇO ▶',
  });

  sTempo.addBlankRow(0.35);
  const rSchT = sTempo.addRow(0.70);
  sTempo.setCell(0, rSchT, { styleOpts: { bg: PAL.VAZIO } });
  sTempo.setCell(11, rSchT, { styleOpts: { bg: PAL.VAZIO } });
  sTempo.setBox(1, rSchT, 6, rSchT, { text: 'ESQUEMA AO VIVO · TRILHA DE BOOT (PERSISTÊNCIA → BIOS → RAM / IC)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.TEMPO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sTempo.setBox(7, rSchT, 10, rSchT, { text: 'TURNOS DE CPU (MULTIPROGRAMAÇÃO)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.TEMPO, bold: true, size: 9, halign: 'center', border: B_STONE } });

  const rT1 = sTempo.addRow(0.80);
  const rT2 = sTempo.addRow(0.80);
  for (const rr of [rT1, rT2]) {
    sTempo.setCell(0, rr, { styleOpts: { bg: PAL.VAZIO } });
    sTempo.setCell(11, rr, { styleOpts: { bg: PAL.VAZIO } });
  }

  addTableHeader(sTempo);

  const e8 = addSingleStage(sTempo, 'val_t', {
    num: 8,
    title: 'Etapa 08 · Persistência com Computador Desligado',
    directive: 'A energia da bancada será cortada. Aloje o sistema operacional e os dois programas de usuário no recurso capaz de mantê-los gravados sem energia.',
    note: 'Com o sistema sem energia, somente memórias secundárias não voláteis como SSD ou HD preservam o SO e os programas.',
    options: [
      { label: 'SSD ou HD (armazenamento secundário)', correct: true, feedback: 'Chave desligada e dados preservados. SSD e HD são não voláteis e guardam SO e programas sem alimentação elétrica.' },
      { label: 'Memória RAM', correct: false, feedback: 'Perda total ao desligar. A RAM é memória volátil e apaga tudo quando a energia é cortada.' },
      { label: 'Memória Cache', correct: false, feedback: 'Perda total ao desligar. A cache é volátil e serve apenas para acelerar acessos durante a execução.' },
      { label: 'Registradores da CPU', correct: false, feedback: 'Inviável. Registradores são minúsculos e voláteis, zerados ao desligar a máquina.' },
    ],
  });

  const e9 = addSingleStage(sTempo, 'val_t', {
    num: 9,
    title: 'Etapa 09 · Papel da Memória Secundária',
    directive: 'Registre para a equipe a razão arquitetural pela qual o sistema operacional e os dois programas de usuário permanecem gravados no disco rígido.',
    note: 'A memória secundária existe para armazenar o sistema operacional e os programas permanentemente.',
    options: [
      { label: 'Armazenamento permanente do SO e dos programas de usuário', correct: true, feedback: 'Confirmado. A persistência permanente garante que o computador possa inicializar o SO sempre que for religado.' },
      { label: 'Armazenar somente durante a compilação dos programas', correct: false, feedback: 'Incorreto. Executáveis já compilados e o próprio SO continuam no disco após a compilação.' },
      { label: 'Armazenar somente para interação direta entre os programas', correct: false, feedback: 'Incorreto. A função essencial do disco aqui é a guarda permanente mesmo fora de execução.' },
      { label: 'Armazenar somente enquanto o computador estiver ligado', correct: false, feedback: 'Essa é a característica da RAM (volátil), não do disco rígido.' },
    ],
  });

  const e10 = addOrderedMultiStage(sTempo, 'val_t', {
    num: 10,
    title: 'Etapa 10 · Sequência de Boot, BIOS e ROM',
    directive: 'Energia religada. Execute na ordem exata os 4 passos iniciais da partida até iniciar o carregamento do sistema operacional.',
    note: 'Ao ligar, o BIOS (gravado na memória ROM) verifica o setup, faz o POST, descompacta dados, lê o armazenamento e carrega o SO.',
    slots: [
      { label: 'Passo 1/4 — Firmware e memória de partida', expected: 'Acionar BIOS armazenado na memória ROM' },
      { label: 'Passo 2/4 — Configuração e autoteste de hardware', expected: 'Verificar o setup e executar o POST' },
      { label: 'Passo 3/4 — Preparação e acesso ao disco', expected: 'Descompactar dados e ler dispositivos de armazenamento' },
      { label: 'Passo 4/4 — Partida do sistema operacional', expected: 'Iniciar o carregamento do Sistema Operacional' },
    ],
    sharedOptions: [
      { label: 'Acionar BIOS armazenado na memória ROM', isOrderStep: true, feedback: 'Chip ROM com firmware BIOS energizado na partida.' },
      { label: 'Verificar o setup e executar o POST', isOrderStep: true, feedback: 'Setup validado e POST aprovado sem falhas de hardware.' },
      { label: 'Descompactar dados e ler dispositivos de armazenamento', isOrderStep: true, feedback: 'Tabelas descompactadas e setor de boot lido no HD/SSD.' },
      { label: 'Iniciar o carregamento do Sistema Operacional', isOrderStep: true, feedback: 'Sequência inicial de boot do BIOS completada na ordem exata.' },
      { label: 'Acionar rotina BUST no Chipset', isOrderStep: false, feedback: 'Instrução inexistente. A inicialização cabe ao BIOS na ROM.' },
    ],
  });

  const e11 = addOrderedMultiStage(sTempo, 'val_t', {
    num: 11,
    title: 'Etapa 11 · Passagem de Bastão do BIOS',
    directive: 'O BIOS da FCTarc13 está prestes a encerrar sua execução. Realize na ordem as duas tarefas finais que entregam o controle da CPU ao SO.',
    note: 'Antes de sair, o BIOS carrega o núcleo do SO do HD/SSD para a RAM e grava o endereço inicial do Escalonador no IC e no Register of Scheduler.',
    slots: [
      { label: 'Tarefa 1/2 — Transferência para memória principal', expected: 'Carregar núcleo do SO do HD ou SSD para a memória RAM' },
      { label: 'Tarefa 2/2 — Ponteiro inicial de execução na CPU', expected: 'Gravar início do Escalonador no IC e no Register of Scheduler' },
    ],
    sharedOptions: [
      { label: 'Carregar núcleo do SO do HD ou SSD para a memória RAM', isOrderStep: true, feedback: 'Imagem do núcleo FCTos01 transferida do disco para a RAM.' },
      { label: 'Gravar início do Escalonador no IC e no Register of Scheduler', isOrderStep: true, feedback: 'Registrador IC e Register of Scheduler apontam para a 1ª instrução do Escalonador.' },
      { label: 'Reiniciar o POST na ROM', isOrderStep: false, feedback: 'O POST já terminou antes; refazê-lo impediria o SO de assumir a CPU.' },
      { label: 'Descompactar tabelas na memória Cache', isOrderStep: false, feedback: 'O núcleo precisa ser carregado na RAM e apontado no IC e Register of Scheduler.' },
    ],
  });

  const e12 = addSingleStage(sTempo, 'val_t', {
    num: 12,
    title: 'Etapa 12 · O Que Significa Escalonamento',
    directive: 'O Escalonador entrou em cena. Associe na bancada a analogia cotidiana que descreve corretamente o princípio do escalonamento.',
    note: 'Escalonamento equivale a organizar turnos de trabalho em uma empresa: dividir o tempo disponível entre tarefas em ordem.',
    options: [
      { label: 'Turnos de trabalho organizados em uma empresa', correct: true, feedback: 'Analogia calibrada. Assim como trabalhadores se revezam por turnos, tarefas se revezam pelo tempo de processamento.' },
      { label: 'Andar em montanha russa', correct: false, feedback: 'Analogia sem relação com divisão organizada de tempo e turnos de execução.' },
      { label: 'Confinamento de gado', correct: false, feedback: 'Não traduz a ideia de alternância temporal de uso de um recurso único.' },
      { label: 'Dormir de barriga para cima', correct: false, feedback: 'Não representa compartilhamento temporal nem organização em turnos.' },
    ],
  });

  const e13 = addSingleStage(sTempo, 'val_t', {
    num: 13,
    title: 'Etapa 13 · Quem Entra na Fila do Escalonador',
    directive: 'Estabeleça na linha do processador a relação exata entre o sistema operacional, os programas de usuário e o escalonamento.',
    note: 'Tanto o sistema operacional quanto os programas de usuário são escalonados para utilizar o processador.',
    options: [
      { label: 'SO e programas de usuário são escalonados para usar o processador', correct: true, feedback: 'Anel de turnos completo. O próprio código do SO e os dois programas de usuário alternam o uso da CPU.' },
      { label: 'Antecipação dos programas de usuário para uso no SO', correct: false, feedback: 'Relação incorreta. O escalonamento reparte o tempo da CPU entre o SO e os programas de usuário.' },
      { label: 'Submeter SO e programas a uma multiplicação escalar', correct: false, feedback: 'Jogo de palavras sem sentido arquitetural: escalonamento trata de turnos na CPU, não de álgebra vetorial.' },
      { label: 'Programas de usuário são alocados dentro do código do SO', correct: false, feedback: 'Os programas permanecem separados do SO e disputam turnos no processador com ele.' },
    ],
  });

  const e14 = addSingleStage(sTempo, 'val_t', {
    num: 14,
    title: 'Etapa 14 · Classificação de Multiprogramação',
    directive: 'Com o sistema operacional e múltiplos programas de usuário alternando turnos de execução, configure a classificação do sistema na FCTarc13.',
    note: 'Sistemas capazes de manter e alternar vários programas em execução são classificados como Multiprogramados.',
    options: [
      { label: 'Sistema Multiprogramado', correct: true, feedback: 'Modo Multiprogramado ativo. A FCTarc13 mantém múltiplos programas em memória alternando turnos de CPU.' },
      { label: 'Sistema Monoprogramado', correct: false, feedback: 'Incompatível. Um sistema monoprogramado executaria apenas um programa de usuário do começo ao fim antes de outro.' },
      { label: 'Sistema Bi-executado', correct: false, feedback: 'Classificação inexistente na literatura de Sistemas Operacionais.' },
      { label: 'Sistema Bi-executável', correct: false, feedback: 'Termo incorreto. Mesmo com dois programas de usuário na prática, a categoria técnica é Multiprogramado.' },
    ],
  });

  const e15 = addSingleStage(sTempo, 'val_t', {
    num: 15,
    title: 'Etapa 15 · Conceito Cotidiano de Processo',
    directive: 'Estruture o conceito de Processo na linha de execução ligando-o ao exemplo cotidiano que melhor traduz sua composição.',
    note: 'Um processo se compara a um processo de produção em uma empresa: um conjunto de etapas e elementos necessários para gerar um resultado.',
    options: [
      { label: 'Processo de produção em uma empresa: conjunto de etapas e elementos', correct: true, feedback: 'Modelo mental validado. Programa em execução envolve código, dados, contexto e etapas coordenadas até concluir a tarefa.' },
      { label: 'Movimentos ondulatórios do mar', correct: false, feedback: 'Analogia física contínua que não evidencia etapas e elementos organizados de trabalho.' },
      { label: 'Força centrípeta', correct: false, feedback: 'Conceito de mecânica clássica sem relação com etapas de execução de software.' },
      { label: 'Força centrífuga', correct: false, feedback: 'Conceito físico distante da estrutura de etapas e elementos de um processo computacional.' },
    ],
  });

  const e16 = addSingleStage(sTempo, 'val_t', {
    num: 16,
    title: 'Etapa 16 · Gerenciamento de Processos pelo SO',
    directive: 'Conclua o subsistema de execução ativando a relação correta entre o sistema operacional e os processos dos programas de usuário.',
    note: 'O sistema operacional gerencia os processos de execução dos programas de usuário, reunindo atividades e elementos necessários para rodá-los.',
    options: [
      { label: 'O SO gerencia os processos de execução dos programas de usuário', correct: true, feedback: 'Gerenciamento de processos estabilizado. Você concluiu o Bloco 2 de SO 1 e conquistou a Joia do Tempo.' },
      { label: 'Processo de fragmentação do SO e dos programas', correct: false, feedback: 'Incorreto. O SO não existe para fragmentar programas, e sim para gerenciar sua execução ordenada.' },
      { label: 'Processo de reconstrução do SO e dos programas', correct: false, feedback: 'Incorreto. Os programas já existem; o papel do SO é gerenciar seus processos durante a execução.' },
      { label: 'Processo de análise estática dos programas', correct: false, feedback: 'Incorreto. A relação central em tempo de operação é o gerenciamento da execução desses programas.' },
    ],
  });

  // Wire Boot & CPU Turn Schematics (rT1..rT2)
  const schT = (onLbl, offLbl) => ({
    bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 9, bold: true, halign: 'center',
    maps: [
      { cond: `cell-content()="${onLbl}"`, style: 'ST_TEMPO_ON' },
      { cond: `cell-content()="${offLbl}"`, style: 'ST_BLOCK_OFF' },
    ],
  });

  sTempo.setBox(1, rT1, 2, rT1, {
    formula: `of:=IF(AND([.${e8.statusRef}]="✓ CORRETO";[.${e9.statusRef}]="✓ CORRETO");"■ HD/SSD PERSISTENTE";"□ HD/SSD · AGUARDANDO")`,
    valueType: 'string', value: '□ HD/SSD · AGUARDANDO', text: '□ HD/SSD · AGUARDANDO',
    styleOpts: schT('■ HD/SSD PERSISTENTE', '□ HD/SSD · AGUARDANDO'),
  });
  sTempo.setBox(3, rT1, 4, rT1, {
    formula: `of:=IF([.${e10.slotInputs[0]}]="Acionar BIOS armazenado na memória ROM";"■ ROM · BIOS ATIVO";"□ ROM · BIOS INATIVO")`,
    valueType: 'string', value: '□ ROM · BIOS INATIVO', text: '□ ROM · BIOS INATIVO',
    styleOpts: schT('■ ROM · BIOS ATIVO', '□ ROM · BIOS INATIVO'),
  });
  sTempo.setBox(5, rT1, 6, rT1, {
    formula: `of:=IF(AND([.${e10.slotInputs[1]}]="Verificar o setup e executar o POST";[.${e10.slotInputs[2]}]="Descompactar dados e ler dispositivos de armazenamento");"■ SETUP + POST + DISCO OK";"□ POST E LEITURA · PENDENTE")`,
    valueType: 'string', value: '□ POST E LEITURA · PENDENTE', text: '□ POST E LEITURA · PENDENTE',
    styleOpts: schT('■ SETUP + POST + DISCO OK', '□ POST E LEITURA · PENDENTE'),
  });

  sTempo.setBox(1, rT2, 3, rT2, {
    formula: `of:=IF([.${e11.slotInputs[0]}]="Carregar núcleo do SO do HD ou SSD para a memória RAM";"■ NÚCLEO NA RAM";"□ NÚCLEO NO DISCO")`,
    valueType: 'string', value: '□ NÚCLEO NO DISCO', text: '□ NÚCLEO NO DISCO',
    styleOpts: schT('■ NÚCLEO NA RAM', '□ NÚCLEO NO DISCO'),
  });
  sTempo.setBox(4, rT2, 6, rT2, {
    formula: `of:=IF([.${e11.slotInputs[1]}]="Gravar início do Escalonador no IC e no Register of Scheduler";"■ IC → ESCALONADOR";"□ IC · SEM ENDEREÇO")`,
    valueType: 'string', value: '□ IC · SEM ENDEREÇO', text: '□ IC · SEM ENDEREÇO',
    styleOpts: schT('■ IC → ESCALONADOR', '□ IC · SEM ENDEREÇO'),
  });

  const turnOn = (lbl) => ({
    bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 9, bold: true, halign: 'center',
    maps: [
      { cond: `cell-content()="${lbl}"`, style: 'ST_TEMPO_ON' },
      { cond: 'cell-content()="○ TURNO LIVRE"', style: 'ST_BLOCK_OFF' },
    ],
  });
  const schedOk = `AND([.${e12.statusRef}]="✓ CORRETO";[.${e13.statusRef}]="✓ CORRETO";[.${e14.statusRef}]="✓ CORRETO")`;
  sTempo.setBox(7, rT1, 8, rT1, {
    formula: `of:=IF(${schedOk};"■ T1: SO · KERNEL";"○ TURNO LIVRE")`,
    valueType: 'string', value: '○ TURNO LIVRE', text: '○ TURNO LIVRE', styleOpts: turnOn('■ T1: SO · KERNEL'),
  });
  sTempo.setBox(9, rT1, 10, rT1, {
    formula: `of:=IF(${schedOk};"■ T2: PROG 1 (ROBÔ)";"○ TURNO LIVRE")`,
    valueType: 'string', value: '○ TURNO LIVRE', text: '○ TURNO LIVRE', styleOpts: turnOn('■ T2: PROG 1 (ROBÔ)'),
  });
  sTempo.setBox(7, rT2, 8, rT2, {
    formula: `of:=IF(AND([.${e15.statusRef}]="✓ CORRETO";[.${e16.statusRef}]="✓ CORRETO");"■ T3: SO · PROCESSOS";"○ TURNO LIVRE")`,
    valueType: 'string', value: '○ TURNO LIVRE', text: '○ TURNO LIVRE', styleOpts: turnOn('■ T3: SO · PROCESSOS'),
  });
  sTempo.setBox(9, rT2, 10, rT2, {
    formula: `of:=IF(AND([.${e15.statusRef}]="✓ CORRETO";[.${e16.statusRef}]="✓ CORRETO");"■ T4: PROG 2 (ROBÔ)";"○ TURNO LIVRE")`,
    valueType: 'string', value: '○ TURNO LIVRE', text: '○ TURNO LIVRE', styleOpts: turnOn('■ T4: PROG 2 (ROBÔ)'),
  });

  const tList = [e8, e9, e10, e11, e12, e13, e14, e15, e16].map((e) => `IF([.${e.statusRef}]="✓ CORRETO";1;0)`).join('+');
  sTempo.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).formula = `of:=(${tList}) & " / 9"`;
  sTempo.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).valueType = 'string';
  sTempo.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).value = '0 / 9';
  sTempo.cells.get(`8,${hdr.badgeRef.replace(/\D/g, '')}`).formula = `of:=IF((${tList})=9;"★ CONQUISTADA";"○ EM CONSTRUÇÃO")`;

  sTempo.addBlankRow(0.5);
  TRACK.tempo = {
    sheet: 'J2_TEMPO',
    statusCells: [e8, e9, e10, e11, e12, e13, e14, e15, e16].map((e) => e.statusRef),
    badgeRef: hdr.badgeRef,
    inputs: [
      e8.inputRef, e9.inputRef, ...e10.slotInputs, ...e11.slotInputs,
      e12.inputRef, e13.inputRef, e14.inputRef, e15.inputRef, e16.inputRef,
    ],
  };
}

// ============================================================================
// 11. SHEET 3: J3_ESPACO (Etapas 17 a 25)
// ============================================================================
{
  const hdr = addGemHeader(sEspaco, {
    gemImg: 'gem_espaco',
    altarImg: 'altar_aceso',
    accent: PAL.ESPACO,
    title: 'JOIA DO ESPAÇO · MÓDULO SO 1 (ETAPAS 17 A 25)',
    subtitle: 'Memória RAM (busca, particionamento lógico fixo e variável em tamanhos diferentes) e Alocação de Arquivos em Blocos (Contígua, Lista Encadeada e Nó-i).',
    totalSteps: 9,
    prevSheet: 'J2_TEMPO',
    prevLabel: '◀ ANTERIOR: TEMPO',
    nextSheet: 'J4_REALIDADE',
    nextLabel: 'PRÓXIMA: JOIA DA REALIDADE ▶',
  });

  // Live RAM 12 MB Bar (in rows 8..9) + 3 Disk 4x4 Matrices (in rows 11..15)
  sEspaco.addBlankRow(0.35);
  const rRamHdr = sEspaco.addRow(0.65);
  sEspaco.setCell(0, rRamHdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setCell(11, rRamHdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setBox(1, rRamHdr, 10, rRamHdr, {
    text: 'MAPA AO VIVO DA MEMÓRIA RAM (12 BLOCOS DE 1 MB — PARTIÇÕES DE TAMANHOS DIFERENTES)',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE },
  });

  const rRamBar = sEspaco.addRow(0.85);
  sEspaco.setCell(0, rRamBar, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setCell(11, rRamBar, { styleOpts: { bg: PAL.VAZIO } });
  const rRamBar2 = sEspaco.addRow(0.85);
  sEspaco.setCell(0, rRamBar2, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setCell(11, rRamBar2, { styleOpts: { bg: PAL.VAZIO } });

  sEspaco.addBlankRow(0.25);
  const rDiskHdr = sEspaco.addRow(0.65);
  sEspaco.setCell(0, rDiskHdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setCell(11, rDiskHdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setBox(1, rDiskHdr, 3, rDiskHdr, { text: 'DISCO 1 · ALOCAÇÃO CONTÍGUA', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sEspaco.setBox(4, rDiskHdr, 6, rDiskHdr, { text: 'DISCO 2 · LISTA ENCADEADA', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sEspaco.setBox(7, rDiskHdr, 10, rDiskHdr, { text: 'DISCO 3 · NÓ-I (TABELAS)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });

  // Disk 4 rows (each disk shows 4 rows of 4 blocks using cols or grouped pairs!)
  // Cols 1..10 = 10 inner cols:
  // Matrix 1 in cols 1..3 (3 cols? Wait: 4 blocks need 4 cells or 2x2? Wait: we have 10 inner cols (B..K)!)
  // Look: 4 rows x 2 blocks per cell? No, 10 inner cols can fit 4+3+3? Even cleaner:
  // Put 2 blocks in cols 1..2? Wait: if we show 16 blocks as a 4x4 grid, 3 matrices side by side = 12 cols! Since we have 10 inner cols (B..K), let's make 2 rows of 8 blocks per matrix OR put Matrix 1 & 2 side by side (4 cols + 2 gap + 4 cols = 10 cols!) and Matrix 3 right below OR make each block show "B00 | B01"? Wait: NO! If each block is its own cell, it can light up INDIVIDUALLY!
  // Let's check: how many cols do we have? 10 inner cols (B..K).
  // Put 2 blocks per row? 4 rows x 4 cols doesn't fit 3x4=12 inside 10 cols, EXCEPT:
  // Row band A: Matrix 1 (cols B..E, 4 cols x 4 rows = B00..B15!) | Spacer F | Matrix 2 (cols G..J, 4 cols x 4 rows = B00..B15!) | K = Status!
  // Wait: what about Matrix 3 (Nó-i)? Right below in Row band B (cols B..E = 4 cols x 4 rows = B00..B15!), and cols F..K = Tabela Nó-i de Índices (Direto / Indireto)!!
  // THAT'S EVEN BETTER for teaching Nó-i!! Because Nó-i literally HAS an index table alongside the disk blocks!
  const rM1Rows = [sEspaco.addRow(0.68), sEspaco.addRow(0.68), sEspaco.addRow(0.68), sEspaco.addRow(0.68)];
  for (const rr of rM1Rows) {
    sEspaco.setCell(0, rr, { styleOpts: { bg: PAL.VAZIO } });
    sEspaco.setCell(11, rr, { styleOpts: { bg: PAL.VAZIO } });
  }
  sEspaco.addBlankRow(0.20);
  const rDisk3Hdr = sEspaco.addRow(0.65);
  sEspaco.setCell(0, rDisk3Hdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setCell(11, rDisk3Hdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setBox(1, rDisk3Hdr, 4, rDisk3Hdr, { text: 'DISCO 3 · BLOCOS PARA NÓ-I (B00–B15)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sEspaco.setBox(6, rDisk3Hdr, 10, rDisk3Hdr, { text: 'TABELA NÓ-I DO ARQUIVO (ENDEREÇAMENTO EM NÍVEIS)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });

  const rM3Rows = [sEspaco.addRow(0.68), sEspaco.addRow(0.68), sEspaco.addRow(0.68), sEspaco.addRow(0.68)];
  for (const rr of rM3Rows) {
    sEspaco.setCell(0, rr, { styleOpts: { bg: PAL.VAZIO } });
    sEspaco.setCell(11, rr, { styleOpts: { bg: PAL.VAZIO } });
  }

  // Fix rDiskHdr to match exact 4-col matrices (B..E = Matrix 1, G..J = Matrix 2)
  sEspaco.cells.delete(`1,${rDiskHdr}`);
  for (let c = 1; c <= 10; c++) {
    sEspaco.cells.delete(`${c},${rDiskHdr}`);
    sEspaco.covered.delete(`${c},${rDiskHdr}`);
  }
  sEspaco.merges = sEspaco.merges.filter((m) => m.r1 !== rDiskHdr);
  sEspaco.setBox(1, rDiskHdr, 4, rDiskHdr, { text: 'DISCO 1 · ALOCAÇÃO CONTÍGUA (B00–B15)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sEspaco.setCell(5, rDiskHdr, { styleOpts: { bg: PAL.VAZIO } });
  sEspaco.setBox(6, rDiskHdr, 9, rDiskHdr, { text: 'DISCO 2 · LISTA ENCADEADA (B00–B15)', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });
  sEspaco.setCell(10, rDiskHdr, { text: 'STATUS', styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.ESPACO, bold: true, size: 9, halign: 'center', border: B_STONE } });

  addTableHeader(sEspaco);

  const e17 = addSingleStage(sEspaco, 'val_e', {
    num: 17,
    title: 'Etapa 17 · Permanência Volátil na RAM',
    directive: 'Analise a operação da FCTarc13 e estabeleça no barramento principal a relação temporal entre a memória RAM, o SO e os programas de usuário.',
    note: 'A memória RAM armazena o sistema operacional e os programas de usuário enquanto o computador está ligado.',
    options: [
      { label: 'A RAM armazena o SO e os programas enquanto o computador está ligado', correct: true, feedback: 'Barramento confirmado. A RAM guarda o SO e os programas em execução ativa enquanto há energia no sistema.' },
      { label: 'A RAM armazena o SO e os programas permanentemente', correct: false, feedback: 'Erro de arquitetura. A guarda permanente pertence ao HD/SSD; a RAM perde o conteúdo quando desligada.' },
      { label: 'A RAM armazena ambos apenas para compilá-los todos juntos', correct: false, feedback: 'Incorreto. SO e programas já chegam prontos para execução, não para recompilação conjunta na RAM.' },
      { label: 'A RAM armazena para realizar convolução entre eles', correct: false, feedback: 'Incorreto. Convolução é operação matemática/sinais, não a função da memória principal.' },
    ],
  });

  const e18 = addSingleStage(sEspaco, 'val_e', {
    num: 18,
    title: 'Etapa 18 · Busca de Instruções na RAM',
    directive: 'Explique no fluxo de dados da FCTarc13 por que o sistema operacional e os programas de usuário precisam estar carregados na RAM para rodar.',
    note: 'A CPU busca diretamente da RAM as instruções e dados do sistema operacional e dos programas de usuário durante a execução.',
    options: [
      { label: 'A RAM é a memória a partir da qual o SO e os programas são buscados', correct: true, feedback: 'Fluxo de busca ativo. O processador lê instruções da RAM a cada ciclo porque ela é rápida e endereçável pela CPU.' },
      { label: 'A RAM é onde SO e programas são compilados juntos', correct: false, feedback: 'Incorreto. Na execução, a CPU busca instruções já compiladas a partir da memória RAM.' },
      { label: 'A RAM garante armazenamento permanente após desligar', correct: false, feedback: 'Incorreto. A característica permanente é do armazenamento secundário, não da RAM.' },
      { label: 'A RAM é onde SO e programas são convolucionados', correct: false, feedback: 'Conceito incorreto. A CPU realiza busca de instruções (fetch) a partir da RAM.' },
    ],
  });

  const e19 = addSingleStage(sEspaco, 'val_e', {
    num: 19,
    title: 'Etapa 19 · Organização Lógica da RAM',
    directive: 'Com o sistema operacional e os dois programas de usuário dividindo a mesma memória RAM, aplique o método correto para organizar esse armazenamento.',
    note: 'A organização da RAM entre SO e programas de usuário é feita por Particionamento.',
    options: [
      { label: 'Aplicar Particionamento da memória RAM', correct: true, feedback: 'Divisórias lógicas traçadas. O Particionamento separa regiões dedicadas ao SO e a cada programa na RAM.' },
      { label: 'Aplicar Encaixamento genérico', correct: false, feedback: 'Termo inadequado. Em Sistemas Operacionais, a divisão organizada da RAM é chamada de Particionamento.' },
      { label: 'Aplicar Acondicionamento', correct: false, feedback: 'Termo fora do padrão da disciplina. A técnica correta é Particionamento.' },
      { label: 'Aplicar Adicionamento', correct: false, feedback: 'Não existe particionamento por adicionamento na organização da memória.' },
    ],
  });

  const e20 = addOrderedMultiStage(sEspaco, 'val_e', {
    num: 20,
    title: 'Etapa 20 · O Problema dos Tamanhos Diferentes',
    directive: 'O SO ocupa 4 MB, o Programa 1 ocupa 6 MB e o Programa 2 ocupa 2 MB (total 12 MB). Defina a regra das partições e dimensione os blocos no mapa da RAM acima.',
    note: 'Como os programas possuem tamanhos diferentes, o particionamento da RAM deve ser feito em tamanhos diferentes (4 MB + 6 MB + 2 MB).',
    slots: [
      {
        label: 'Regra arquitetural de particionamento',
        expected: 'Programas têm tamanhos diferentes: particionar em tamanhos diferentes',
        okBadge: '✓ REGRA OK',
        okMsg: 'Regra validada: partições sob medida evitam desperdício e falta de espaço.',
        options: [
          { label: 'Programas têm tamanhos diferentes: particionar em tamanhos diferentes', feedback: 'Regra correta.' },
          { label: 'Códigos executáveis têm tamanhos iguais: particionar em tamanhos iguais', feedback: 'Falha de alocação: em partições iguais de 4 MB, o Prog 1 (6 MB) não cabe.' },
          { label: 'Memória não pode ser particionada: particionar existencialmente', feedback: 'Incorreto: a RAM deve ser particionada logicamente em faixas de tamanhos variados.' },
          { label: 'Memória não pode ser particionada: particionar unilateralmente', feedback: 'Conceito inválido para o gerenciamento de memória.' },
        ],
      },
      {
        label: 'Partição do Sistema Operacional (demanda: 4 MB)',
        expected: '4 MB',
        okBadge: '✓ 4 MB OK',
        okMsg: 'SO alocado em 4 MB no mapa da RAM.',
        options: [
          { label: '2 MB', feedback: 'Insuficiente: o núcleo do SO precisa de 4 MB.' },
          { label: '4 MB', feedback: 'Tamanho exato do SO (4 MB).' },
          { label: '6 MB', feedback: 'Desperdício ou conflito: o SO exige exatamente 4 MB.' },
          { label: '8 MB', feedback: 'Excede o necessário e impede os demais programas de caberem em 12 MB.' },
        ],
      },
      {
        label: 'Partição do Programa 1 (demanda: 6 MB)',
        expected: '6 MB',
        okBadge: '✓ 6 MB OK',
        okMsg: 'Programa 1 alocado em 6 MB no mapa da RAM.',
        options: [
          { label: '2 MB', feedback: 'Insuficiente: o Programa 1 ocupa 6 MB.' },
          { label: '4 MB', feedback: 'Falta espaço: em 4 MB, o Programa 1 (6 MB) transborda.' },
          { label: '6 MB', feedback: 'Tamanho exato do Programa 1 (6 MB).' },
          { label: '8 MB', feedback: 'Excede a necessidade real de 6 MB.' },
        ],
      },
      {
        label: 'Partição do Programa 2 (demanda: 2 MB)',
        expected: '2 MB',
        okBadge: '✓ 2 MB OK',
        okMsg: 'Programa 2 alocado em 2 MB no mapa da RAM.',
        options: [
          { label: '2 MB', feedback: 'Tamanho exato do Programa 2 (2 MB).' },
          { label: '4 MB', feedback: 'Desperdiça 2 MB sem necessidade.' },
          { label: '6 MB', feedback: 'Desperdiça 4 MB e estoura a RAM.' },
          { label: '8 MB', feedback: 'Estoura o limite de 12 MB da RAM.' },
        ],
      },
    ],
  });

  const e21 = addOrderedMultiStage(sEspaco, 'val_e', {
    num: 21,
    title: 'Etapa 21 · Quando e Como Particionar a RAM',
    directive: 'Configure no controlador de memória da FCTarc13 em que momento cada modo de particionamento lógico de tamanhos diferentes atua.',
    note: 'O particionamento lógico de tamanhos diferentes pode ser Fixo (definido no início das atividades do SO) ou Variável (ajustado durante as atividades do SO).',
    slots: [
      {
        label: 'Particionamento Lógico Fixo',
        expected: 'Definido no início das atividades do SO',
        okBadge: '✓ MODO OK',
        options: [
          { label: 'Definido no início das atividades do SO', feedback: 'Modo Fixo validado: fronteiras de tamanhos diferentes definidas na partida do SO.' },
          { label: 'Ajustado durante as atividades do SO', feedback: 'Inversão temporal: ajustes durante as atividades do SO pertencem ao modo Variável, não ao Fixo.' },
          { label: 'Definido somente após desligar o computador', feedback: 'Incorreto: partições da RAM existem enquanto o sistema opera.' },
          { label: 'Definido aleatoriamente pelo braço robótico', feedback: 'Incorreto: quem define as partições da RAM é o Gerente de Memória do SO.' },
        ],
      },
      {
        label: 'Particionamento Lógico Variável',
        expected: 'Ajustado durante as atividades do SO',
        okBadge: '✓ MODO OK',
        options: [
          { label: 'Ajustado durante as atividades do SO', feedback: 'Modo Variável validado: regiões criadas sob demanda enquanto os programas executam.' },
          { label: 'Definido no início das atividades do SO', feedback: 'Inversão temporal: definir tudo apenas no início caracteriza o modo Fixo, não o Variável.' },
          { label: 'Definido somente após desligar o computador', feedback: 'Incorreto: partições da RAM existem enquanto o sistema opera.' },
          { label: 'Definido aleatoriamente pelo braço robótico', feedback: 'Incorreto: quem define as partições da RAM é o Gerente de Memória do SO.' },
        ],
      },
    ],
  });

  const e22 = addSingleStage(sEspaco, 'val_e', {
    num: 22,
    title: 'Etapa 22 · Divisão do Disco em Blocos',
    directive: 'Além da RAM, o sistema operacional precisa organizar e controlar o armazenamento secundário para guardar arquivos. Formate a estrutura correta.',
    note: 'O armazenamento secundário é organizado pelo sistema de arquivos por meio da divisão do HD em blocos.',
    options: [
      { label: 'Aplicar divisão do HD em blocos', correct: true, feedback: 'Grade de blocos ativada. O HD foi fatiado em blocos numerados (B00 a B15) prontos para receber arquivos.' },
      { label: 'Divisão dos registradores em mapas de bits', correct: false, feedback: 'Incorreto. Registradores armazenam palavras de CPU; quem é fatiado em blocos para arquivos é o HD.' },
      { label: 'Divisão da memória cache em conjuntos associativos', correct: false, feedback: 'Conjuntos associativos são organização de hardware da cache, não armazenamento de arquivos pelo SO.' },
      { label: 'Divisão da ROM em instâncias', correct: false, feedback: 'Incorreto. A ROM é somente leitura e guarda o BIOS, não arquivos gravados pelo usuário.' },
    ],
  });

  const e23 = addOrderedMultiStage(sEspaco, 'val_e', {
    num: 23,
    title: 'Etapa 23 · Alocação Contígua de Arquivos',
    directive: 'Sistema de Arquivos 1: o diretório guarda apenas o endereço do 1º bloco e todos os blocos ficam em sequência, um ao lado do outro (observe o Disco 1 acima).',
    note: 'Na Alocação Contígua, sabendo o endereço do primeiro bloco e a posição na sequência, encontra-se qualquer bloco do arquivo.',
    slots: [
      {
        label: 'Endereço inicial registrado no diretório',
        expected: 'B04',
        okBadge: '✓ DIR OK',
        options: [
          { label: 'B04', feedback: 'Bloco inicial B04 gravado no diretório.' },
          { label: 'B00', feedback: 'O arquivo contíguo do experimento inicia em B04.' },
          { label: 'B02', feedback: 'B02 pertence ao experimento de Lista Encadeada.' },
          { label: 'B14', feedback: 'B14 é o fim da cadeia encadeada, não o início contíguo.' },
        ],
      },
      {
        label: 'Blocos ocupados pelo arquivo no Disco 1',
        expected: 'B04 → B05 → B06 → B07 (adjacentes)',
        okBadge: '✓ SEQ OK',
        options: [
          { label: 'B04 → B05 → B06 → B07 (adjacentes)', feedback: 'Sequência contígua B04 a B07 preenchida sem saltos.' },
          { label: 'B02, B09, B05 e B14 (com buracos)', feedback: 'Quebra a regra da sequência contígua: endereço inicial + deslocamento falharia nos buracos.' },
          { label: 'B01, B06, B11 e B15 (espalhados)', feedback: 'Blocos espalhados sem sequência física exigem ponteiros ou índices.' },
        ],
      },
      {
        label: 'Nome técnico da estratégia 1',
        expected: 'Alocação Contígua',
        okBadge: '✓ TIPO OK',
        options: [
          { label: 'Alocação Contígua', feedback: 'Alocação Contígua validada na matriz do Disco 1.' },
          { label: 'Alocação por Lista Encadeada', feedback: 'Na lista encadeada os blocos ficam espalhados com ponteiros.' },
          { label: 'Lista Encadeada usando Índice', feedback: 'Quando todos os blocos ficam lado a lado a partir do 1º endereço, é Alocação Contígua.' },
          { label: 'Nó-i (i-node)', feedback: 'Nó-i utiliza tabelas de endereços em níveis.' },
        ],
      },
    ],
  });

  const e24 = addOrderedMultiStage(sEspaco, 'val_e', {
    num: 24,
    title: 'Etapa 24 · Alocação por Lista Encadeada',
    directive: 'Sistema de Arquivos 2: os blocos ficam espalhados; cada bloco guarda o endereço do próximo (B02 → B09 → B05 → B14 no Disco 2 acima).',
    note: 'Na Alocação por Lista Encadeada, cada bloco aponta para o endereço do bloco seguinte em uma região específica do bloco anterior.',
    slots: [
      {
        label: 'Ponteiro gravado no bloco B02',
        expected: 'B02 → B09',
        okBadge: '✓ LINK 1',
        options: [
          { label: 'B02 → B09', feedback: 'Ligação B02 → B09 estabelecida no Disco 2.' },
          { label: 'B02 → B03 (sequencial)', feedback: 'Esta lista salta para B09, não depende de bloco vizinho.' },
          { label: 'Sem ponteiro no bloco', feedback: 'Sem ponteiro em B02 não é possível localizar o restante do arquivo.' },
        ],
      },
      {
        label: 'Ponteiro gravado no bloco B09',
        expected: 'B09 → B05',
        okBadge: '✓ LINK 2',
        options: [
          { label: 'B09 → B05', feedback: 'Ligação B09 → B05 estabelecida no Disco 2.' },
          { label: 'B09 → B10 (sequencial)', feedback: 'O próximo bloco do arquivo após B09 é B05.' },
          { label: 'Sem ponteiro no bloco', feedback: 'Sem ponteiro em B09 a cadeia se rompe.' },
        ],
      },
      {
        label: 'Ponteiro gravado no bloco B05',
        expected: 'B05 → B14',
        okBadge: '✓ LINK 3',
        options: [
          { label: 'B05 → B14', feedback: 'Cadeia B02 → B09 → B05 → B14 fechada até o fim do arquivo.' },
          { label: 'B05 → B06 (sequencial)', feedback: 'O último bloco deste arquivo está em B14.' },
          { label: 'Sem ponteiro no bloco', feedback: 'Sem ponteiro em B05 não se chega ao bloco final B14.' },
        ],
      },
      {
        label: 'Nome técnico da estratégia 2',
        expected: 'Alocação por Lista Encadeada',
        okBadge: '✓ TIPO OK',
        options: [
          { label: 'Alocação por Lista Encadeada', feedback: 'Alocação por Lista Encadeada validada no Disco 2.' },
          { label: 'Alocação Contígua', feedback: 'Alocação contígua exige blocos adjacentes em sequência física.' },
          { label: 'Lista Encadeada usando Índice', feedback: 'Quando o próprio bloco anterior guarda o ponteiro do próximo, é Lista Encadeada simples.' },
          { label: 'Nó-i (i-node)', feedback: 'No Nó-i os endereços ficam concentrados em tabelas multinível, não dentro dos blocos de dados.' },
        ],
      },
    ],
  });

  const e25 = addOrderedMultiStage(sEspaco, 'val_e', {
    num: 25,
    title: 'Etapa 25 · Alocação por Nó-i (Tabelas de Índices)',
    directive: 'Sistema de Arquivos 3: os blocos ficam livres pelo disco e todos os endereços são registrados em uma ou mais tabelas organizadas em diferentes níveis.',
    note: 'No método Nó-i (i-node), os registros de uma ou mais tabelas multinível armazenam os endereços de todos os blocos do arquivo.',
    slots: [
      {
        label: 'Estrutura de indexação no diretório/metadados',
        expected: 'Criar tabela Nó-i em níveis para endereços do arquivo',
        okBadge: '✓ TABELA OK',
        options: [
          { label: 'Criar tabela Nó-i em níveis para endereços do arquivo', feedback: 'Tabela Nó-i alocada no diretório de metadados.' },
          { label: 'Gravar ponteiro do próximo bloco dentro de cada bloco', feedback: 'Isso caracteriza Lista Encadeada, não Nó-i.' },
          { label: 'Exigir blocos lado a lado sem tabela de índices', feedback: 'Isso descreveria Alocação Contígua.' },
        ],
      },
      {
        label: 'Endereços mapeados na tabela (Disco 3)',
        expected: 'B01, B06, B11 e B15 (espalhados pelo disco)',
        okBadge: '✓ BLOCOS OK',
        options: [
          { label: 'B01, B06, B11 e B15 (espalhados pelo disco)', feedback: 'Endereços B01, B06, B11 e B15 gravados na tabela Nó-i.' },
          { label: 'B04, B05, B06 e B07 (adjacentes)', feedback: 'Esses são os blocos adjacentes do experimento Contíguo.' },
          { label: 'Somente B00 no diretório', feedback: 'O Nó-i precisa apontar todos os blocos do arquivo (diretos e em níveis).' },
        ],
      },
      {
        label: 'Nome técnico da estratégia 3',
        expected: 'Nó-i (i-node)',
        okBadge: '✓ TIPO OK',
        options: [
          { label: 'Nó-i (i-node)', feedback: 'Nó-i concluído. Você finalizou todas as 25 etapas de SO 1 e conquistou a Joia do Espaço.' },
          { label: 'Alocação Contígua', feedback: 'Alocação contígua não usa tabelas multinível.' },
          { label: 'Alocação por Lista Encadeada', feedback: 'Na lista encadeada o endereço fica no bloco anterior, não em tabelas.' },
          { label: 'Lista Encadeada usando Índice', feedback: 'Tabelas organizadas em diferentes níveis por arquivo caracterizam o Nó-i.' },
        ],
      },
    ],
  });

  // Wire Live 12-MB RAM Bar (6 blocks in rRamBar + 6 blocks in rRamBar2 -> wait: 10 cols in B..K -> let's put 5 blocks per row? 5*2=10 cols! Wait: 12 MB = 6 blocks in rRamBar (using cols 1..6? No, 10 cols -> put 6 blocks on rRamBar using cols 1..6 and 6 blocks on rRamBar2 using cols 1..6, and put SUMMARY in cols 7..10!))
  // Look how clean that is:
  // Cols 1..6 (6 blocks per row * 2 rows = 12 blocks of 1 MB!)
  // Cols 7..10 (4 cols, spanning rRamBar..rRamBar2): Live Partition Summary (Rule + SO + Prog1 + Prog2 + Total MB)!
  const ramRuleRef = e20.slotInputs[0];
  const soRef = e20.slotInputs[1];
  const p1Ref = e20.slotInputs[2];
  const p2Ref = e20.slotInputs[3];
  const mbVal = (r) => `IF([.${r}]="2 MB";2;IF([.${r}]="4 MB";4;IF([.${r}]="6 MB";6;IF([.${r}]="8 MB";8;0))))`;
  const soMb = mbVal(soRef);
  const p1Mb = mbVal(p1Ref);
  const p2Mb = mbVal(p2Ref);

  const ramStyleOpts = {
    bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 8, bold: true, halign: 'center',
    maps: [
      { cond: 'cell-content()="SO · 1 MB"', style: 'ST_RAM_SO' },
      { cond: 'cell-content()="PROG 1 · 1 MB"', style: 'ST_RAM_P1' },
      { cond: 'cell-content()="PROG 2 · 1 MB"', style: 'ST_RAM_P2' },
      { cond: 'cell-content()="RAM · LIVRE"', style: 'ST_BLOCK_OFF' },
    ],
  };

  for (let idx = 1; idx <= 12; idx++) {
    const row = idx <= 6 ? rRamBar : rRamBar2;
    const col = idx <= 6 ? idx : idx - 6;
    sEspaco.setCell(col, row, {
      formula: `of:=IF(${idx}<=${soMb};"SO · 1 MB";IF(${idx}<=(${soMb}+${p1Mb});"PROG 1 · 1 MB";IF(${idx}<=(${soMb}+${p1Mb}+${p2Mb});"PROG 2 · 1 MB";"RAM · LIVRE")))`,
      valueType: 'string', value: 'RAM · LIVRE', text: 'RAM · LIVRE',
      styleOpts: ramStyleOpts,
    });
  }
  sEspaco.setBox(7, rRamBar, 10, rRamBar2, {
    formula: `of:=IF([.${e20.statusRef}]="✓ CORRETO";"■ PARTICIONAMENTO ATIVO: SO 4 MB + P1 6 MB + P2 2 MB = 12 MB";IF((${soMb}+${p1Mb}+${p2Mb})>12;"✗ ESTOURO: " & (${soMb}+${p1Mb}+${p2Mb}) & " MB > 12 MB";"Total alocado: " & (${soMb}+${p1Mb}+${p2Mb}) & " / 12 MB (Etapas 19–21)"))`,
    valueType: 'string', value: 'Total alocado: 0 / 12 MB (Etapas 19–21)', text: 'Total alocado: 0 / 12 MB (Etapas 19–21)',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, bold: true, border: B_GOLD_DIM, halign: 'center' },
  });

  // Wire Disk 1 (Contiguous B00..B15 in cols 1..4, rows rM1Rows[0..3])
  // Wire Disk 2 (Linked List B00..B15 in cols 6..9, rows rM1Rows[0..3])
  // Wire Disk 3 (i-node B00..B15 in cols 1..4, rows rM3Rows[0..3])
  const diskStyle = (onTxt, offTxt, errTxt = null) => {
    const maps = [
      { cond: `cell-content()="${onTxt}"`, style: 'ST_ESPACO_ON' },
      { cond: `cell-content()="${offTxt}"`, style: 'ST_BLOCK_OFF' },
    ];
    if (errTxt) maps.push({ cond: `cell-content()="${errTxt}"`, style: 'ST_ERR' });
    return { bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 8, bold: true, halign: 'center', maps };
  };

  for (let i = 0; i < 16; i++) {
    const rOff = Math.floor(i / 4);
    const cOff = i % 4;
    const bName = `B${String(i).padStart(2, '0')}`;

    // Disk 1: Contiguous
    const r1 = rM1Rows[rOff];
    const c1 = 1 + cOff;
    if (i === 4) {
      sEspaco.setCell(c1, r1, {
        formula: `of:=IF(OR([.${e23.slotInputs[0]}]="B04";[.${e23.slotInputs[1]}]="B04 → B05 → B06 → B07 (adjacentes)");"■ B04 · ARQ";"· B04")`,
        valueType: 'string', value: '· B04', text: '· B04',
        styleOpts: diskStyle('■ B04 · ARQ', '· B04'),
      });
    } else if (i >= 5 && i <= 7) {
      const onLbl = `■ ${bName} · ARQ`;
      const offLbl = `· ${bName}`;
      sEspaco.setCell(c1, r1, {
        formula: `of:=IF([.${e23.slotInputs[1]}]="B04 → B05 → B06 → B07 (adjacentes)";"${onLbl}";"${offLbl}")`,
        valueType: 'string', value: offLbl, text: offLbl,
        styleOpts: diskStyle(onLbl, offLbl),
      });
    } else if (i === 2 || i === 9 || i === 14) {
      const offLbl = `· ${bName}`;
      const errLbl = `✗ ${bName}`;
      sEspaco.setCell(c1, r1, {
        formula: `of:=IF([.${e23.slotInputs[1]}]="B02, B09, B05 e B14 (com buracos)";"${errLbl}";"${offLbl}")`,
        valueType: 'string', value: offLbl, text: offLbl,
        styleOpts: diskStyle('NONE', offLbl, errLbl),
      });
    } else {
      const offLbl = `· ${bName}`;
      sEspaco.setCell(c1, r1, { text: offLbl, styleOpts: { bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 8, halign: 'center' } });
    }

    // Disk 2: Linked List (B02->B09, B09->B05, B05->B14, B14·FIM)
    const c2 = 6 + cOff;
    if (i === 2) {
      sEspaco.setCell(c2, r1, {
        formula: `of:=IF([.${e24.slotInputs[0]}]="B02 → B09";"■ B02→B09";"· B02")`,
        valueType: 'string', value: '· B02', text: '· B02',
        styleOpts: diskStyle('■ B02→B09', '· B02'),
      });
    } else if (i === 9) {
      sEspaco.setCell(c2, r1, {
        formula: `of:=IF([.${e24.slotInputs[1]}]="B09 → B05";"■ B09→B05";"· B09")`,
        valueType: 'string', value: '· B09', text: '· B09',
        styleOpts: diskStyle('■ B09→B05', '· B09'),
      });
    } else if (i === 5) {
      sEspaco.setCell(c2, r1, {
        formula: `of:=IF([.${e24.slotInputs[2]}]="B05 → B14";"■ B05→B14";"· B05")`,
        valueType: 'string', value: '· B05', text: '· B05',
        styleOpts: diskStyle('■ B05→B14', '· B05'),
      });
    } else if (i === 14) {
      sEspaco.setCell(c2, r1, {
        formula: `of:=IF([.${e24.slotInputs[2]}]="B05 → B14";"■ B14 · FIM";"· B14")`,
        valueType: 'string', value: '· B14', text: '· B14',
        styleOpts: diskStyle('■ B14 · FIM', '· B14'),
      });
    } else {
      const offLbl = `· ${bName}`;
      sEspaco.setCell(c2, r1, { text: offLbl, styleOpts: { bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 8, halign: 'center' } });
    }

    // Disk 3: i-node (B01, B06, B11, B15)
    const r3 = rM3Rows[rOff];
    const c3 = 1 + cOff;
    if (i === 1 || i === 6 || i === 11 || i === 15) {
      const onLbl = `■ ${bName} · NÓ-I`;
      const offLbl = `· ${bName}`;
      sEspaco.setCell(c3, r3, {
        formula: `of:=IF([.${e25.slotInputs[1]}]="B01, B06, B11 e B15 (espalhados pelo disco)";"${onLbl}";"${offLbl}")`,
        valueType: 'string', value: offLbl, text: offLbl,
        styleOpts: diskStyle(onLbl, offLbl),
      });
    } else {
      const offLbl = `· ${bName}`;
      sEspaco.setCell(c3, r3, { text: offLbl, styleOpts: { bg: '#14101c', fg: '#8f81a1', border: B_STONE, size: 8, halign: 'center' } });
    }
  }

  // Spacers & Status cells beside Disk 1/2/3
  for (let k = 0; k < 4; k++) {
    sEspaco.setCell(5, rM1Rows[k], { styleOpts: { bg: PAL.VAZIO } });
    sEspaco.setCell(5, rM3Rows[k], { styleOpts: { bg: PAL.VAZIO } });
  }
  sEspaco.setBox(10, rM1Rows[0], 10, rM1Rows[1], {
    formula: `of:=IF([.${e23.statusRef}]="✓ CORRETO";"✓ CONTÍGUA";"○ D1")`,
    valueType: 'string', value: '○ D1', text: '○ D1',
    styleOpts: { bg: '#14101c', fg: PAL.TINTA_SUAVE, size: 8, bold: true, halign: 'center', border: B_STONE, maps: [{ cond: 'cell-content()="✓ CONTÍGUA"', style: 'ST_OK' }] },
  });
  sEspaco.setBox(10, rM1Rows[2], 10, rM1Rows[3], {
    formula: `of:=IF([.${e24.statusRef}]="✓ CORRETO";"✓ ENCADEADA";"○ D2")`,
    valueType: 'string', value: '○ D2', text: '○ D2',
    styleOpts: { bg: '#14101c', fg: PAL.TINTA_SUAVE, size: 8, bold: true, halign: 'center', border: B_STONE, maps: [{ cond: 'cell-content()="✓ ENCADEADA"', style: 'ST_OK' }] },
  });

  // i-node table box (cols 6..10, rows rM3Rows[0..3])
  sEspaco.setBox(6, rM3Rows[0], 10, rM3Rows[0], {
    formula: `of:=IF([.${e25.slotInputs[0]}]="Criar tabela Nó-i em níveis para endereços do arquivo";"■ TABELA NÓ-I CRIADA NO DIRETÓRIO";"□ TABELA NÓ-I · AGUARDANDO")`,
    valueType: 'string', value: '□ TABELA NÓ-I · AGUARDANDO', text: '□ TABELA NÓ-I · AGUARDANDO',
    styleOpts: diskStyle('■ TABELA NÓ-I CRIADA NO DIRETÓRIO', '□ TABELA NÓ-I · AGUARDANDO'),
  });
  sEspaco.setBox(6, rM3Rows[1], 10, rM3Rows[2], {
    formula: `of:=IF([.${e25.slotInputs[1]}]="B01, B06, B11 e B15 (espalhados pelo disco)";"■ NÍVEL DIRETO → [B01] [B06] [B11] [B15] (suporta indireção)";"□ ENTRADAS DA TABELA: [ -- ] [ -- ] [ -- ] [ -- ]")`,
    valueType: 'string', value: '□ ENTRADAS DA TABELA: [ -- ] [ -- ] [ -- ] [ -- ]', text: '□ ENTRADAS DA TABELA: [ -- ] [ -- ] [ -- ] [ -- ]',
    styleOpts: diskStyle('■ NÍVEL DIRETO → [B01] [B06] [B11] [B15] (suporta indireção)', '□ ENTRADAS DA TABELA: [ -- ] [ -- ] [ -- ] [ -- ]'),
  });
  sEspaco.setBox(6, rM3Rows[3], 10, rM3Rows[3], {
    formula: `of:=IF([.${e25.statusRef}]="✓ CORRETO";"★ MÓDULO SO 1 (ETAPAS 01–25) COMPLETO";"○ COMPLETE AS ETAPAS 22–25 NA BANCADA ABAIXO")`,
    valueType: 'string', value: '○ COMPLETE AS ETAPAS 22–25 NA BANCADA ABAIXO', text: '○ COMPLETE AS ETAPAS 22–25 NA BANCADA ABAIXO',
    styleOpts: diskStyle('★ MÓDULO SO 1 (ETAPAS 01–25) COMPLETO', '○ COMPLETE AS ETAPAS 22–25 NA BANCADA ABAIXO'),
  });

  const eList = [e17, e18, e19, e20, e21, e22, e23, e24, e25].map((e) => `IF([.${e.statusRef}]="✓ CORRETO";1;0)`).join('+');
  sEspaco.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).formula = `of:=(${eList}) & " / 9"`;
  sEspaco.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).valueType = 'string';
  sEspaco.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).value = '0 / 9';
  sEspaco.cells.get(`8,${hdr.badgeRef.replace(/\D/g, '')}`).formula = `of:=IF((${eList})=9;"★ CONQUISTADA";"○ EM CONSTRUÇÃO")`;

  sEspaco.addBlankRow(0.5);
  TRACK.espaco = {
    sheet: 'J3_ESPACO',
    statusCells: [e17, e18, e19, e20, e21, e22, e23, e24, e25].map((e) => e.statusRef),
    badgeRef: hdr.badgeRef,
    inputs: [
      e17.inputRef, e18.inputRef, e19.inputRef, ...e20.slotInputs, ...e21.slotInputs,
      e22.inputRef, ...e23.slotInputs, ...e24.slotInputs, ...e25.slotInputs,
    ],
  };
}

// ============================================================================
// 12. SHEETS 4-6: SO 2 STRUCTURED ALTARS (J4_REALIDADE, J5_ALMA, J6_MENTE)
// ============================================================================
function buildSo2Sheet(sheet, cfg) {
  const hdr = addGemHeader(sheet, {
    gemImg: cfg.gemImg,
    altarImg: 'altar_adormecido',
    accent: cfg.accent,
    title: cfg.title,
    subtitle: `${cfg.rangeLabel} · Estrutura reservada para o módulo SO 2 (próximo semestre), com roteiro oficial de tópicos e modo demonstrativo opcional.`,
    totalSteps: cfg.slots.length,
    prevSheet: cfg.prevSheet,
    prevLabel: cfg.prevLabel,
    nextSheet: cfg.nextSheet,
    nextLabel: cfg.nextLabel,
  });

  sheet.addBlankRow(0.35);

  // Notice + Demo Toggle Box
  const rDemo = sheet.addRow(1.30);
  sheet.setCell(0, rDemo, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rDemo, { styleOpts: { bg: PAL.VAZIO } });

  const demoInput = refCell(6, rDemo);
  const valName = `val_so2_${cfg.id}`;
  sheet.wb.addValidation(valName, ['Aguardando conteúdo de SO 2', 'Coletar joia em modo demonstração'], `${sheet.name}.${demoInput}`, 'Modo Demonstração (SO 2)', 'Use apenas para testar o Estalo Final.');

  sheet.setBox(1, rDemo, 5, rDemo, {
    text: [
      'MODO DEMONSTRAÇÃO OPCIONAL (NÃO É CONTEÚDO AVALIADO DE SO 2)',
      'Esta joia pertence a SO 2 (próximo semestre). Para testar a Manopla completa no Estalo Final, ative a demonstração ao lado.',
    ],
    styleOpts: { bg: '#211524', fg: PAL.TINTA_SUAVE, size: 9, border: `1.5pt dashed ${cfg.accent}` },
  });
  sheet.setBox(6, rDemo, 7, rDemo, {
    validation: valName,
    styleOpts: { bg: '#21182c', fg: PAL.LATAO_CLARO, bold: true, size: 9, border: B_GOLD, halign: 'center' },
  });
  sheet.setCell(8, rDemo, {
    formula: `of:=IF([.${demoInput}]="Coletar joia em modo demonstração";"★ DEMO ATIVA";"○ AGUARDANDO SO 2")`,
    valueType: 'string', value: '○ AGUARDANDO SO 2', text: '○ AGUARDANDO SO 2',
    styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, border: B_GOLD_DIM, halign: 'center', maps: MAPS_STATUS },
  });
  sheet.setBox(9, rDemo, 10, rDemo, {
    formula: `of:=IF([.${demoInput}]="Coletar joia em modo demonstração";"Joia encaixada em modo demonstrativo para validar o Estalo Final.";"Aguardando definição do professor em SO 2 (próximo semestre).")`,
    valueType: 'string', value: 'Aguardando definição do professor em SO 2 (próximo semestre).', text: 'Aguardando definição do professor em SO 2 (próximo semestre).',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE },
  });

  // Update header counter & badge to link to demo toggle
  sheet.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).formula = `of:=IF([.${demoInput}]="Coletar joia em modo demonstração";"DEMO / " & ${cfg.slots.length};"0 / " & ${cfg.slots.length})`;
  sheet.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).valueType = 'string';
  sheet.cells.get(`8,${hdr.counterRef.replace(/\D/g, '')}`).value = `0 / ${cfg.slots.length}`;
  sheet.cells.get(`8,${hdr.badgeRef.replace(/\D/g, '')}`).formula = `of:=IF([.${demoInput}]="Coletar joia em modo demonstração";"★ DEMO ATIVA";"○ AGUARDANDO SO 2")`;
  sheet.cells.get(`8,${hdr.badgeRef.replace(/\D/g, '')}`).value = '○ AGUARDANDO SO 2';

  // Roadmap Header
  sheet.addBlankRow(0.35);
  const rHdr = sheet.addRow(0.75);
  sheet.setCell(0, rHdr, { styleOpts: { bg: PAL.VAZIO } });
  sheet.setCell(11, rHdr, { styleOpts: { bg: PAL.VAZIO } });
  const hSt = { bg: PAL.ARDOSIA, fg: PAL.LATAO_CLARO, bold: true, size: 9, halign: 'center', bTop: B_GOLD, bBot: B_GOLD, bLeft: B_GOLD_DIM, bRight: B_GOLD_DIM };
  sheet.setCell(1, rHdr, { text: 'ETAPA', styleOpts: hSt });
  sheet.setBox(2, rHdr, 5, rHdr, { text: 'ASSUNTO PREVISTO NO CURRÍCULO DE SO 2 (EMENTA)', styleOpts: hSt });
  sheet.setBox(6, rHdr, 7, rHdr, { text: 'ESPAÇO DA BANCADA (A DEFINIR)', styleOpts: hSt });
  sheet.setCell(8, rHdr, { text: 'ESTADO', styleOpts: hSt });
  sheet.setBox(9, rHdr, 10, rHdr, { text: 'NOTAS PARA EXPANSÃO FUTURA', styleOpts: hSt });

  for (const sl of cfg.slots) {
    const r = sheet.addRow(1.15);
    sheet.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sheet.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
    sheet.setCell(1, r, { text: sl.etapa, styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: cfg.accent, bold: true, size: 9, halign: 'center', border: B_STONE } });
    sheet.setBox(2, r, 5, r, { text: [sl.titulo, sl.desc], styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE } });
    sheet.setBox(6, r, 7, r, { text: 'Conteúdo a definir em SO 2', styleOpts: { bg: '#14101c', fg: PAL.TINTA_SUAVE, italic: true, size: 9, halign: 'center', border: `1pt dashed ${PAL.LATAO_ESC}` } });
    sheet.setCell(8, r, { text: '○ AGUARDANDO SO 2', styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, size: 8, halign: 'center', border: B_STONE } });
    sheet.setBox(9, r, 10, r, { text: 'Estrutura pronta para receber validação de dados e feedback causal em SO 2.', styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, border: B_STONE } });
  }

  sheet.addBlankRow(0.5);
  return { sheet: cfg.sheetName, demoInput, badgeRef: hdr.badgeRef };
}

TRACK.realidade = buildSo2Sheet(sRealidade, {
  id: 'realidade',
  sheetName: 'J4_REALIDADE',
  gemImg: 'gem_realidade',
  accent: PAL.REALIDADE,
  title: 'JOIA DA REALIDADE · PRÉVIA SO 2 (ETAPAS 26 A 33)',
  rangeLabel: 'Etapas 26 a 33',
  prevSheet: 'J3_ESPACO',
  prevLabel: '◀ ANTERIOR: ESPAÇO',
  nextSheet: 'J5_ALMA',
  nextLabel: 'PRÓXIMA: JOIA DA ALMA ▶',
  slots: [
    { etapa: 'ETAPAS 26–28', titulo: 'Contexto nos Registradores e Tabela de Processos', desc: 'Salvamento e recuperação do contexto ao expirar o quantum; estrutura da Tabela de Processos na RAM.' },
    { etapa: 'ETAPAS 29–30', titulo: 'Braço Robótico Compartilhado e Mutex', desc: 'Controle de exclusão mútua com Mutex para evitar conflito e monopólio por processos de usuário.' },
    { etapa: 'ETAPAS 31–33', titulo: 'Chamadas de Sistema (Syscalls)', desc: 'Controle do periférico via chamada de sistema por procedimento ao enviar comandos ao robô e encerrar.' },
  ],
});

TRACK.alma = buildSo2Sheet(sAlma, {
  id: 'alma',
  sheetName: 'J5_ALMA',
  gemImg: 'gem_alma',
  accent: PAL.ALMA,
  title: 'JOIA DA ALMA · PRÉVIA SO 2 (ETAPAS 34 A 40)',
  rangeLabel: 'Etapas 34 a 40',
  prevSheet: 'J4_REALIDADE',
  prevLabel: '◀ ANTERIOR: REALIDADE',
  nextSheet: 'J6_MENTE',
  nextLabel: 'PRÓXIMA: JOIA DA MENTE ▶',
  slots: [
    { etapa: 'ETAPAS 34–36', titulo: 'Interrupções, ISR e Vetores de Interrupção', desc: 'Mecanismo de interrupção (analogia da campainha), Rotina de Tratamento de Interrupção (ISR) e tabela de vetores.' },
    { etapa: 'ETAPAS 37–38', titulo: 'Driver como Tradutor de Dispositivo', desc: 'Instalação e papel do Driver como tradutor entre o sistema operacional e o hardware do braço robótico.' },
    { etapa: 'ETAPAS 39–40', titulo: 'Atomicidade e Ciclo de Vida dos Processos', desc: 'Execução atômica de movimentos completos e transições entre Rodando, Bloqueado, Pronto e Concluído.' },
  ],
});

TRACK.mente = buildSo2Sheet(sMente, {
  id: 'mente',
  sheetName: 'J6_MENTE',
  gemImg: 'gem_mente',
  accent: PAL.MENTE,
  title: 'JOIA DA MENTE · PRÉVIA SO 2 (ETAPAS 43 A 46)',
  rangeLabel: 'Etapas 43 a 46',
  prevSheet: 'J5_ALMA',
  prevLabel: '◀ ANTERIOR: ALMA',
  nextSheet: 'ESTALO',
  nextLabel: '⚡ IR PARA O ESTALO FINAL',
  slots: [
    { etapa: 'ETAPAS 43–44', titulo: 'Execução em 1 CPU Física e Prioridades', desc: 'Impossibilidade de execução física literalmente simultânea em 1 CPU na FCTarc e escalonamento Prioritário.' },
    { etapa: 'ETAPA 45', titulo: 'Modo Núcleo Protegido vs. Modo Usuário', desc: 'Separação entre execução privilegiada do núcleo do SO e execução restrita dos programas de usuário.' },
    { etapa: 'ETAPA 46', titulo: 'Unidade de Gerência de Memória (MMU)', desc: 'Tradução dinâmica e proteção de endereços físicos e lógicos pela MMU em tempo de execução.' },
  ],
});

// Helper formulas referencing gem sheets
const PODER_DONE = `[J1_PODER.${TRACK.poder.badgeRef}]="★ CONQUISTADA"`;
const TEMPO_DONE = `[J2_TEMPO.${TRACK.tempo.badgeRef}]="★ CONQUISTADA"`;
const ESPACO_DONE = `[J3_ESPACO.${TRACK.espaco.badgeRef}]="★ CONQUISTADA"`;
const REALIDADE_DONE = `[J4_REALIDADE.${TRACK.realidade.badgeRef}]="★ DEMO ATIVA"`;
const ALMA_DONE = `[J5_ALMA.${TRACK.alma.badgeRef}]="★ DEMO ATIVA"`;
const MENTE_DONE = `[J6_MENTE.${TRACK.mente.badgeRef}]="★ DEMO ATIVA"`;

const PODER_COUNT = TRACK.poder.statusCells.map((c) => `IF([J1_PODER.${c}]="✓ CORRETO";1;0)`).join('+');
const TEMPO_COUNT = TRACK.tempo.statusCells.map((c) => `IF([J2_TEMPO.${c}]="✓ CORRETO";1;0)`).join('+');
const ESPACO_COUNT = TRACK.espaco.statusCells.map((c) => `IF([J3_ESPACO.${c}]="✓ CORRETO";1;0)`).join('+');
const TOTAL_SO1_STEPS = `(${PODER_COUNT}+${TEMPO_COUNT}+${ESPACO_COUNT})`;
const TOTAL_SO1_GEMS = `(IF(${PODER_DONE};1;0)+IF(${TEMPO_DONE};1;0)+IF(${ESPACO_DONE};1;0))`;
const TOTAL_SO2_GEMS = `(IF(${REALIDADE_DONE};1;0)+IF(${ALMA_DONE};1;0)+IF(${MENTE_DONE};1;0))`;
const TOTAL_GEMS = `(${TOTAL_SO1_GEMS}+${TOTAL_SO2_GEMS})`;

// ============================================================================
// 13. SHEET 7: SALAO (Hub Central de Titã)
// ============================================================================
{
  sSalao.addBlankRow(0.45);
  const r2 = sSalao.addRow(1.15);
  const r3 = sSalao.addRow(1.15);
  const r4 = sSalao.addRow(1.15);
  const r5 = sSalao.addRow(1.15);

  for (const r of [r2, r3, r4, r5]) {
    sSalao.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sSalao.setCell(13, r, { styleOpts: { bg: PAL.VAZIO } });
  }

  // Logo reserve (B2:F5)
  sSalao.placeImage('logo', 1, r2, 5, r5, 0.25, {
    bg: PAL.CARTAO,
    bTop: B_GOLD_THICK,
    bBot: B_GOLD,
    bLeft: B_GOLD,
    bRight: B_GOLD_DIM,
  });

  // HUD Gauntlet reserve (G2:H5)
  sSalao.placeImage('hud_full', 6, r2, 7, r5, 0.25, {
    bg: PAL.CARTAO,
    bTop: B_GOLD_THICK,
    bBot: B_GOLD,
    bLeft: B_GOLD_DIM,
    bRight: B_GOLD_DIM,
  });

  // Live HUD Panel (I2:M5)
  sSalao.setBox(8, r2, 12, r2, {
    text: 'PAINEL DE MISSÃO · FCTos01 (SO 1 E PRÉVIA DE SO 2)',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, font: 'Young Serif', size: 12, bold: true, halign: 'center', bTop: B_GOLD_THICK, bLeft: B_GOLD_DIM, bRight: B_GOLD, bBot: B_GOLD_DIM },
  });
  sSalao.setBox(8, r3, 12, r3, {
    formula: `of:="ETAPAS SO 1: " & ${TOTAL_SO1_STEPS} & " / 25   [" & REPT("█";ROUND(${TOTAL_SO1_STEPS}*10/25;0)) & REPT("░";10-ROUND(${TOTAL_SO1_STEPS}*10/25;0)) & "]"`,
    valueType: 'string',
    value: 'ETAPAS SO 1: 0 / 25   [░░░░░░░░░░]',
    text: 'ETAPAS SO 1: 0 / 25   [░░░░░░░░░░]',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 10, bold: true, halign: 'center', bLeft: B_GOLD_DIM, bRight: B_GOLD, bBot: B_STONE },
  });
  sSalao.setBox(8, r4, 12, r4, {
    formula: `of:="JOIAS SO 1: " & ${TOTAL_SO1_GEMS} & " / 3   |   TOTAL MANOPLA: " & ${TOTAL_GEMS} & " / 6"`,
    valueType: 'string',
    value: 'JOIAS SO 1: 0 / 3   |   TOTAL MANOPLA: 0 / 6',
    text: 'JOIAS SO 1: 0 / 3   |   TOTAL MANOPLA: 0 / 6',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.LATAO_CLARO, size: 10, bold: true, halign: 'center', bLeft: B_GOLD_DIM, bRight: B_GOLD, bBot: B_STONE },
  });
  sSalao.setBox(8, r5, 12, r5, {
    formula: `of:=IF(${TOTAL_GEMS}=6;"Objetivo: Manopla completa — vá ao ESTALO FINAL no centro.";IF(${TOTAL_SO1_GEMS}=3;"SO 1 concluído! Ative as 3 demonstrações de SO 2 para testar o Estalo.";IF(NOT(${PODER_DONE});"Objetivo guiado: visite a Ala Oeste → Joia do Poder (Etapas 01–07).";IF(NOT(${TEMPO_DONE});"Objetivo guiado: visite a Joia do Tempo (Etapas 08–16).";"Objetivo guiado: visite a Joia do Espaço (Etapas 17–25)."))))`,
    valueType: 'string',
    value: 'Objetivo guiado: visite a Ala Oeste → Joia do Poder (Etapas 01–07).',
    text: 'Objetivo guiado: visite a Ala Oeste → Joia do Poder (Etapas 01–07).',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.TINTA_SUAVE, size: 9, bold: true, halign: 'center', bLeft: B_GOLD_DIM, bRight: B_GOLD, bBot: B_GOLD },
  });

  // Row 6: 6 Socket LEDs across B..M (2 cols each)
  const rLeds = sSalao.addRow(0.90);
  sSalao.setCell(0, rLeds, { styleOpts: { bg: PAL.VAZIO } });
  sSalao.setCell(13, rLeds, { styleOpts: { bg: PAL.VAZIO } });
  const leds = [
    { c: 1, expr: PODER_DONE, on: '◆ PODER · OK', off: '○ PODER' },
    { c: 3, expr: TEMPO_DONE, on: '◆ TEMPO · OK', off: '○ TEMPO' },
    { c: 5, expr: ESPACO_DONE, on: '◆ ESPAÇO · OK', off: '○ ESPAÇO' },
    { c: 7, expr: REALIDADE_DONE, on: '◆ REALIDADE · DEMO', off: '○ REALIDADE · SO 2' },
    { c: 9, expr: ALMA_DONE, on: '◆ ALMA · DEMO', off: '○ ALMA · SO 2' },
    { c: 11, expr: MENTE_DONE, on: '◆ MENTE · DEMO', off: '○ MENTE · SO 2' },
  ];
  for (const l of leds) {
    sSalao.setBox(l.c, rLeds, l.c + 1, rLeds, {
      formula: `of:=IF(${l.expr};"${l.on}";"${l.off}")`,
      valueType: 'string', value: l.off, text: l.off,
      styleOpts: { bg: '#14101c', fg: PAL.TINTA_SUAVE, bold: true, size: 9, halign: 'center', border: B_STONE, maps: gemStyleMaps('ST_GOLD') },
    });
  }

  sSalao.addBlankRow(0.35);

  // Wing Headers (Row 8)
  const rWings = sSalao.addRow(0.80);
  sSalao.setCell(0, rWings, { styleOpts: { bg: PAL.VAZIO } });
  sSalao.setCell(13, rWings, { styleOpts: { bg: PAL.VAZIO } });
  sSalao.setBox(1, rWings, 4, rWings, { text: 'ALA OESTE · MÓDULO SO 1 (ETAPAS 01–25)', styleOpts: { bg: PAL.ARDOSIA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_GOLD } });
  sSalao.setBox(5, rWings, 8, rWings, { text: 'MONUMENTO CENTRAL · MANOPLA DO INFINITO', styleOpts: { bg: PAL.ARDOSIA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_GOLD } });
  sSalao.setBox(9, rWings, 12, rWings, { text: 'ALA LESTE · MÓDULO SO 2 (ESTRUTURA)', styleOpts: { bg: PAL.ARDOSIA, fg: PAL.TINTA_SUAVE, bold: true, size: 10, halign: 'center', border: B_GOLD_DIM } });

  // Create 17 rows (rows 9..25) for the 3-column layout:
  // Left & Right wings: 3 altar cards of 5 rows each + 1 blank spacer row between cards (5+1+5+1+5 = 17 rows!)
  const hubRows = [];
  for (let i = 0; i < 17; i++) {
    const h = (i === 5 || i === 11) ? 0.35 : (i % 6 === 3 ? 0.85 : 0.90);
    const r = sSalao.addRow(h);
    sSalao.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sSalao.setCell(13, r, { styleOpts: { bg: PAL.VAZIO } });
    hubRows.push(r);
  }

  const addAltarCard = (startCol, rowIdx0, card) => {
    const r0 = hubRows[rowIdx0];
    const r1 = hubRows[rowIdx0 + 1];
    const r2 = hubRows[rowIdx0 + 2];
    const r3 = hubRows[rowIdx0 + 3];
    const r4 = hubRows[rowIdx0 + 4];

    // Gem PNG (top 3 rows of col startCol) & Plaque PNG (bottom 2 rows of col startCol)
    sSalao.placeImage(card.gemImg, startCol, r0, startCol, r2, 0.22, {
      bg: PAL.CARTAO,
      bTop: `2pt solid ${card.accent}`,
      bLeft: B_GOLD_DIM,
      bRight: B_STONE,
    });
    sSalao.placeImage(card.plaqueImg, startCol, r3, startCol, r4, 0.16, {
      bg: PAL.CARTAO,
      bBot: B_GOLD_DIM,
      bLeft: B_GOLD_DIM,
      bRight: B_STONE,
    });

    // Info & Action button (cols startCol+1 .. startCol+3)
    sSalao.setBox(startCol + 1, r0, startCol + 3, r0, {
      text: card.title,
      styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: card.accent, font: 'Young Serif', size: 11, bold: true, bTop: `2pt solid ${card.accent}`, bRight: B_GOLD_DIM, bBot: B_STONE },
    });
    sSalao.setBox(startCol + 1, r1, startCol + 3, r2, {
      text: card.desc,
      styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA_SUAVE, size: 9, bRight: B_GOLD_DIM, bBot: B_STONE },
    });
    sSalao.setBox(startCol + 1, r3, startCol + 3, r3, {
      formula: card.progressFormula,
      valueType: 'string',
      value: card.progressDefault,
      text: card.progressDefault,
      styleOpts: { bg: '#1d1728', fg: PAL.TINTA, size: 9, bold: true, halign: 'center', bRight: B_GOLD_DIM, bBot: B_STONE },
    });
    sSalao.setBox(startCol + 1, r4, startCol + 3, r4, {
      formula: `of:=HYPERLINK("#${card.target}.A1";"${card.btnLabel}")`,
      valueType: 'string',
      value: card.btnLabel,
      text: card.btnLabel,
      styleOpts: makeButtonStyle(card.isSo1 ? PAL.LATAO : PAL.CARTAO_SOMBRA, card.isSo1 ? PAL.SOBRE_OURO : PAL.LATAO_CLARO, `1.5pt solid ${card.accent}`),
    });
  };

  // West Wing (SO 1)
  addAltarCard(1, 0, {
    gemImg: 'gem_poder', plaqueImg: 'etiqueta_01', accent: PAL.PODER, isSo1: true,
    title: 'JOIA DO PODER · SO 1',
    desc: 'Etapas 01–07: FCTarc13, 4 recursos de hardware, braço robótico, funções e 4 módulos do Kernel.',
    progressFormula: `of:="Progresso: " & (${PODER_COUNT}) & " / 7   (" & [J1_PODER.${TRACK.poder.badgeRef}] & ")"`,
    progressDefault: 'Progresso: 0 / 7   (○ EM CONSTRUÇÃO)',
    target: 'J1_PODER', btnLabel: '▶ ABRIR BANCADA DO PODER',
  });
  addAltarCard(1, 6, {
    gemImg: 'gem_tempo', plaqueImg: 'etiqueta_05', accent: PAL.TEMPO, isSo1: true,
    title: 'JOIA DO TEMPO · SO 1',
    desc: 'Etapas 08–16: Persistência, boot do BIOS na ROM, carga no IC, escalonamento e processos.',
    progressFormula: `of:="Progresso: " & (${TEMPO_COUNT}) & " / 9   (" & [J2_TEMPO.${TRACK.tempo.badgeRef}] & ")"`,
    progressDefault: 'Progresso: 0 / 9   (○ EM CONSTRUÇÃO)',
    target: 'J2_TEMPO', btnLabel: '▶ ABRIR BANCADA DO TEMPO',
  });
  addAltarCard(1, 12, {
    gemImg: 'gem_espaco', plaqueImg: 'etiqueta_06', accent: PAL.ESPACO, isSo1: true,
    title: 'JOIA DO ESPAÇO · SO 1',
    desc: 'Etapas 17–25: RAM, particionamento fixo/variável e alocação Contígua, Encadeada e Nó-i.',
    progressFormula: `of:="Progresso: " & (${ESPACO_COUNT}) & " / 9   (" & [J3_ESPACO.${TRACK.espaco.badgeRef}] & ")"`,
    progressDefault: 'Progresso: 0 / 9   (○ EM CONSTRUÇÃO)',
    target: 'J3_ESPACO', btnLabel: '▶ ABRIR BANCADA DO ESPAÇO',
  });

  // East Wing (SO 2 structured)
  addAltarCard(9, 0, {
    gemImg: 'gem_realidade', plaqueImg: 'etiqueta_02', accent: PAL.REALIDADE, isSo1: false,
    title: 'JOIA DA REALIDADE · SO 2',
    desc: 'Etapas 26–33 (próximo semestre): Contexto, Tabela de Processos, Mutex e Syscalls.',
    progressFormula: `of:="Estado: " & [J4_REALIDADE.${TRACK.realidade.badgeRef}]`,
    progressDefault: 'Estado: ○ AGUARDANDO SO 2',
    target: 'J4_REALIDADE', btnLabel: '▶ ABRIR PRÉVIA REALIDADE',
  });
  addAltarCard(9, 6, {
    gemImg: 'gem_alma', plaqueImg: 'etiqueta_03', accent: PAL.ALMA, isSo1: false,
    title: 'JOIA DA ALMA · SO 2',
    desc: 'Etapas 34–40 (próximo semestre): Interrupções, ISR, Drivers, Atomicidade e Ciclo de Vida.',
    progressFormula: `of:="Estado: " & [J5_ALMA.${TRACK.alma.badgeRef}]`,
    progressDefault: 'Estado: ○ AGUARDANDO SO 2',
    target: 'J5_ALMA', btnLabel: '▶ ABRIR PRÉVIA ALMA',
  });
  addAltarCard(9, 12, {
    gemImg: 'gem_mente', plaqueImg: 'etiqueta_04', accent: PAL.MENTE, isSo1: false,
    title: 'JOIA DA MENTE · SO 2',
    desc: 'Etapas 43–46 (próximo semestre): 1 CPU física, Prioridades, Modo Núcleo/Usuário e MMU.',
    progressFormula: `of:="Estado: " & [J6_MENTE.${TRACK.mente.badgeRef}]`,
    progressDefault: 'Estado: ○ AGUARDANDO SO 2',
    target: 'J6_MENTE', btnLabel: '▶ ABRIR PRÉVIA MENTE',
  });

  // Fill Wing Spacer rows (5 & 11) cleanly in cols 1..4 and 9..12
  for (const spIdx of [5, 11]) {
    for (let c = 1; c <= 4; c++) sSalao.setCell(c, hubRows[spIdx], { styleOpts: { bg: PAL.VAZIO } });
    for (let c = 9; c <= 12; c++) sSalao.setCell(c, hubRows[spIdx], { styleOpts: { bg: PAL.VAZIO } });
  }

  // Center Column Monument (cols 5..8, rows hubRows[0..16])
  sSalao.placeImage('mon_full', 5, hubRows[0], 8, hubRows[9], 0.35, {
    bg: PAL.ARDOSIA,
    bTop: B_GOLD,
    bLeft: B_GOLD_DIM,
    bRight: B_GOLD_DIM,
  });
  sSalao.placeImage('thanos', 5, hubRows[10], 8, hubRows[12], 0.25, {
    bg: PAL.ARDOSIA,
    bLeft: B_GOLD_DIM,
    bRight: B_GOLD_DIM,
    bBot: B_GOLD_DIM,
  });
  sSalao.setBox(5, hubRows[13], 8, hubRows[14], {
    formula: `of:=IF(${TOTAL_GEMS}=6;"★ MANOPLA COMPLETA (6/6) — ESTALO DISPONÍVEL";"Manopla aguarda " & (6-${TOTAL_GEMS}) & " joia(s) para liberar o Estalo.")`,
    valueType: 'string',
    value: 'Manopla aguarda 6 joia(s) para liberar o Estalo.',
    text: 'Manopla aguarda 6 joia(s) para liberar o Estalo.',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_GOLD_DIM },
  });
  sSalao.setBox(5, hubRows[15], 8, hubRows[15], {
    formula: 'of:=HYPERLINK("#ESTALO.A1";"⚡ IR PARA O ESTALO FINAL")',
    valueType: 'string', value: '⚡ IR PARA O ESTALO FINAL', text: '⚡ IR PARA O ESTALO FINAL',
    styleOpts: makeButtonStyle(PAL.LATAO, PAL.SOBRE_OURO, B_GOLD_THICK),
  });
  sSalao.setBox(5, hubRows[16], 8, hubRows[16], {
    formula: 'of:=HYPERLINK("#GUIA.A1";"☰ GUIA / COMO REINICIAR")',
    valueType: 'string', value: '☰ GUIA / COMO REINICIAR', text: '☰ GUIA / COMO REINICIAR',
    styleOpts: makeButtonStyle(PAL.CARTAO_SOMBRA, PAL.LATAO_CLARO, B_GOLD_DIM),
  });

  sSalao.addBlankRow(0.5);
}

// ============================================================================
// 14. SHEET 8: ESTALO (Conclusão e Monumento Final)
// ============================================================================
{
  sEstalo.addBlankRow(0.45);
  const r2 = sEstalo.addRow(1.1);
  const r3 = sEstalo.addRow(1.1);
  const r4 = sEstalo.addRow(1.1);
  for (const r of [r2, r3, r4]) {
    sEstalo.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sEstalo.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
  }
  sEstalo.placeImage('logo', 1, r2, 5, r4, 0.25, { bg: PAL.CARTAO, border: B_GOLD });
  sEstalo.setBox(6, r2, 10, r3, {
    text: 'MANOPLA CENTRAL · O ESTALO FINAL',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, font: 'Young Serif', size: 16, bold: true, halign: 'center', border: B_GOLD },
  });
  sEstalo.setBox(6, r4, 8, r4, {
    formula: 'of:=HYPERLINK("#SALAO.A1";"◀ VOLTAR AO SALÃO")',
    valueType: 'string', value: '◀ VOLTAR AO SALÃO', text: '◀ VOLTAR AO SALÃO',
    styleOpts: makeButtonStyle(),
  });
  sEstalo.setBox(9, r4, 10, r4, {
    formula: 'of:=HYPERLINK("#GUIA.A1";"☰ ABRIR GUIA")',
    valueType: 'string', value: '☰ ABRIR GUIA', text: '☰ ABRIR GUIA',
    styleOpts: makeButtonStyle(PAL.CARTAO_SOMBRA, PAL.LATAO_CLARO, B_GOLD_DIM),
  });

  sEstalo.addBlankRow(0.35);

  // Monument gallery + Central checklist (9 rows)
  const eRows = [];
  for (let i = 0; i < 9; i++) {
    const r = sEstalo.addRow(0.95);
    sEstalo.setCell(0, r, { styleOpts: { bg: PAL.VAZIO } });
    sEstalo.setCell(11, r, { styleOpts: { bg: PAL.VAZIO } });
    eRows.push(r);
  }

  // Left: Charged Gauntlet
  sEstalo.placeImage('mon_full', 1, eRows[0], 2, eRows[7], 0.25, { bg: PAL.ARDOSIA, border: B_GOLD });
  sEstalo.setBox(1, eRows[8], 2, eRows[8], {
    text: 'MANOPLA CARREGADA (6/6)',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, bold: true, size: 8, halign: 'center', border: B_GOLD_DIM },
  });

  // Right: Burned Gauntlet + Thanos
  sEstalo.placeImage('mon_burned', 9, eRows[0], 10, eRows[5], 0.25, { bg: PAL.ARDOSIA, border: B_STONE });
  sEstalo.placeImage('thanos', 9, eRows[6], 10, eRows[7], 0.15, { bg: PAL.ARDOSIA, border: B_STONE });
  sEstalo.setBox(9, eRows[8], 10, eRows[8], {
    text: 'MANOPLA PÓS-ESTALO',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.TINTA_SUAVE, bold: true, size: 8, halign: 'center', border: B_STONE },
  });

  // Center checklist (cols 3..8, eRows[0..8])
  sEstalo.setBox(3, eRows[0], 8, eRows[0], {
    text: 'CONFERÊNCIA DAS 6 JOIAS DO INFINITO',
    styleOpts: { bg: PAL.ARDOSIA, fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_GOLD },
  });

  const checks = [
    { label: '1. Joia do Poder (SO 1 · Etapas 01–07)', expr: PODER_DONE, target: 'J1_PODER' },
    { label: '2. Joia do Tempo (SO 1 · Etapas 08–16)', expr: TEMPO_DONE, target: 'J2_TEMPO' },
    { label: '3. Joia do Espaço (SO 1 · Etapas 17–25)', expr: ESPACO_DONE, target: 'J3_ESPACO' },
    { label: '4. Joia da Realidade (SO 2 · Demo)', expr: REALIDADE_DONE, target: 'J4_REALIDADE' },
    { label: '5. Joia da Alma (SO 2 · Demo)', expr: ALMA_DONE, target: 'J5_ALMA' },
    { label: '6. Joia da Mente (SO 2 · Demo)', expr: MENTE_DONE, target: 'J6_MENTE' },
  ];
  checks.forEach((ck, idx) => {
    const rr = eRows[idx + 1];
    sEstalo.setBox(3, rr, 6, rr, {
      formula: `of:=HYPERLINK("#${ck.target}.A1";"${ck.label}")`,
      valueType: 'string', value: ck.label, text: ck.label,
      styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE },
    });
    sEstalo.setBox(7, rr, 8, rr, {
      formula: `of:=IF(${ck.expr};"✓ CORRETO";"○ PENDENTE")`,
      valueType: 'string', value: '○ PENDENTE', text: '○ PENDENTE',
      styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, halign: 'center', border: B_GOLD_DIM, maps: MAPS_STATUS },
    });
  });

  // Trigger Row (eRows[7]) + Gate Readout (eRows[8])
  const triggerRef = refCell(6, eRows[7]);
  sEstalo.wb.addValidation('val_estalo', ['Aguardando comando', 'DAR O ESTALO'], `ESTALO.${triggerRef}`, 'Estalo Final', 'Disponível quando todas as 6 joias estiverem encaixadas.');

  sEstalo.setBox(3, eRows[7], 5, eRows[7], {
    text: 'COMANDO DO ESTALO FINAL (SELECIONE ▼)',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, bold: true, size: 9, halign: 'center', border: B_GOLD },
  });
  sEstalo.setBox(6, eRows[7], 7, eRows[7], {
    validation: 'val_estalo',
    styleOpts: { bg: '#21182c', fg: PAL.LATAO_CLARO, bold: true, size: 10, halign: 'center', border: B_GOLD_THICK },
  });
  sEstalo.setCell(8, eRows[7], {
    formula: `of:=IF(${TOTAL_GEMS}=6;IF([.${triggerRef}]="DAR O ESTALO";"★ ESTALO REALIZADO";"★ ESTALO LIBERADO");IF([.${triggerRef}]="DAR O ESTALO";"✗ BLOQUEADO";"○ TRAVADA"))`,
    valueType: 'string', value: '○ TRAVADA', text: '○ TRAVADA',
    styleOpts: { bg: '#1d1728', fg: PAL.TINTA_SUAVE, bold: true, size: 9, halign: 'center', border: B_GOLD_DIM, maps: MAPS_STATUS },
  });

  sEstalo.setBox(3, eRows[8], 8, eRows[8], {
    formula: `of:=IF(${TOTAL_GEMS}<6;"Manopla incompleta: reúna todas as 6 joias (" & ${TOTAL_GEMS} & "/6) antes de dar o Estalo.";IF([.${triggerRef}]="DAR O ESTALO";"★ ESTALO REALIZADO! A Manopla queimou e o FCTos01 está completo.";"Manopla 6/6 pronta! Selecione DAR O ESTALO acima para concluir."))`,
    valueType: 'string', value: 'Manopla incompleta: reúna todas as 6 joias (0/6) antes de dar o Estalo.', text: 'Manopla incompleta: reúna todas as 6 joias (0/6) antes de dar o Estalo.',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.LATAO_CLARO, bold: true, size: 9, halign: 'center', border: B_GOLD_DIM },
  });

  sEstalo.addBlankRow(0.35);
  const rConc = sEstalo.addRow(2.10);
  sEstalo.setCell(0, rConc, { styleOpts: { bg: PAL.VAZIO } });
  sEstalo.setCell(11, rConc, { styleOpts: { bg: PAL.VAZIO } });
  sEstalo.setBox(1, rConc, 10, rConc, {
    formula: `of:=IF(AND(${TOTAL_GEMS}=6;[.${triggerRef}]="DAR O ESTALO");"CONCLUSÃO DO FCTos01: Todas as 25 etapas de SO 1 foram validadas (Hardware FCTarc13, Braço Robótico Periférico, Kernel de 4 módulos, Persistência e Boot BIOS/ROM → RAM/IC, Escalonamento Multiprogramado, Particionamento Lógico da RAM e Alocação de Disco Contígua, Encadeada e Nó-i) e as 6 Joias do Infinito selaram o Estalo Final. Créditos: Murilo Fuzi Correia e Álvaro de Freitas Grotto.";"Painel de Conclusão: será liberado automaticamente após completar as 6 joias na Manopla e acionar DAR O ESTALO.")`,
    valueType: 'string',
    value: 'Painel de Conclusão: será liberado automaticamente após completar as 6 joias na Manopla e acionar DAR O ESTALO.',
    text: 'Painel de Conclusão: será liberado automaticamente após completar as 6 joias na Manopla e acionar DAR O ESTALO.',
    styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 10, halign: 'center', border: B_GOLD },
  });

  sEstalo.addBlankRow(0.5);
  TRACK.estalo = { triggerRef };
}

// ============================================================================
// 15. SHEET 9: GUIA (Instruções, Fontes, Reset e Mapa Curricular)
// ============================================================================
{
  sGuia.addBlankRow(0.45);
  const rTop = sGuia.addRow(1.1);
  sGuia.setCell(0, rTop, { styleOpts: { bg: PAL.VAZIO } });
  sGuia.setCell(11, rTop, { styleOpts: { bg: PAL.VAZIO } });
  sGuia.setBox(1, rTop, 8, rTop, {
    text: 'GUIA DO PROFESSOR E DO ALUNO · ThanOS NO LIBREOFFICE CALC',
    styleOpts: { bg: PAL.CARTAO_SOMBRA, fg: PAL.LATAO_CLARO, font: 'Young Serif', size: 15, bold: true, halign: 'center', border: B_GOLD },
  });
  sGuia.setBox(9, rTop, 10, rTop, {
    formula: 'of:=HYPERLINK("#SALAO.A1";"◀ SALÃO DE TITÃ")',
    valueType: 'string', value: '◀ SALÃO DE TITÃ', text: '◀ SALÃO DE TITÃ',
    styleOpts: makeButtonStyle(),
  });

  sGuia.addBlankRow(0.30);

  const guiaBlocks = [
    {
      title: '1. COMO JOGAR (SEM MACROS E SEM QUIZ)',
      body: [
        '• Navegação: clique (ou Ctrl+Clique, dependendo da configuração do seu LibreOffice Calc) nos botões dourados para viajar entre o SALAO, as 6 Joias e o ESTALO.',
        '• Interação: em cada aba de Joia, clique nas células douradas com borda destacada e use a seta da lista suspensa (▼) para acoplar componentes na bancada FCTarc13.',
        '• Esquemas ao vivo: observe a placa-mãe, os módulos do Kernel, a trilha de boot, a barra de 12 MB da RAM e as 3 matrizes de disco acenderem conforme você acerta cada etapa.',
      ],
      h: 2.30,
    },
    {
      title: '2. COMO REINICIAR UMA PARTIDA LIMPA (LIMPAR DADOS)',
      body: [
        'Sem macros, basta selecionar as células de entrada abaixo e pressionar Delete (sem apagar fórmulas):',
        `• J1_PODER: ${TRACK.poder.inputs.join(', ')}`,
        `• J2_TEMPO: ${TRACK.tempo.inputs.join(', ')}`,
        `• J3_ESPACO: ${TRACK.espaco.inputs.join(', ')}`,
        `• Abas SO 2 e Estalo: J4_REALIDADE.${TRACK.realidade.demoInput}, J5_ALMA.${TRACK.alma.demoInput}, J6_MENTE.${TRACK.mente.demoInput}, ESTALO.${TRACK.estalo.triggerRef}`,
      ],
      h: 2.60,
    },
    {
      title: '3. FONTES E VISUAIS DO PROJETO',
      body: [
        '• Para manter a tipografia idêntica ao protótipo do Godot, instale as duas fontes em visuais/fontes/ (YoungSerif-Regular.ttf e Archivo-Variable.ttf) antes de abrir no Calc.',
        '• Todos os sprites pixel art, ícones, manoplas e capturas estão preservados em visuais/prontos_libreoffice/.',
        '• Créditos do trabalho: Murilo Fuzi Correia e Álvaro de Freitas Grotto (Sistemas Operacionais · FCT/UNESP).',
      ],
      h: 2.10,
    },
    {
      title: '4. MAPA CURRICULAR COBERTO (SO 1 COMPLETO + ESTRUTURA DE SO 2)',
      body: [
        '• Joia do Poder (SO 1 · Etapas 01–07): requisitos prévios, 4 recursos de hardware, braço robótico periférico, justificativa/funções do SO, ponto de partida e 4 componentes do Kernel.',
        '• Joia do Tempo (SO 1 · Etapas 08–16): persistência no HD/SSD, sequência de boot do BIOS na ROM, carga para RAM e IC, escalonamento por turnos, multiprogramação e processos.',
        '• Joia do Espaço (SO 1 · Etapas 17–25): busca na RAM, particionamento lógico fixo e variável em tamanhos diferentes, divisão do HD em blocos e alocação Contígua, Encadeada e Nó-i.',
        '• Joias da Realidade, Alma e Mente (SO 2 · Etapas 26–46): abas pré-estruturadas com ementa completa de SO 2 e opção demonstrativa para testar o Estalo Final.',
      ],
      h: 2.60,
    },
  ];

  for (const blk of guiaBlocks) {
    const rh = sGuia.addRow(0.75);
    sGuia.setCell(0, rh, { styleOpts: { bg: PAL.VAZIO } });
    sGuia.setCell(11, rh, { styleOpts: { bg: PAL.VAZIO } });
    sGuia.setBox(1, rh, 10, rh, {
      text: blk.title,
      styleOpts: { bg: PAL.ARDOSIA, fg: PAL.LATAO_CLARO, bold: true, size: 10, border: B_GOLD },
    });
    const rb = sGuia.addRow(blk.h);
    sGuia.setCell(0, rb, { styleOpts: { bg: PAL.VAZIO } });
    sGuia.setCell(11, rb, { styleOpts: { bg: PAL.VAZIO } });
    sGuia.setBox(1, rb, 10, rb, {
      text: blk.body,
      styleOpts: { bg: PAL.CARTAO, fg: PAL.TINTA, size: 9, border: B_STONE },
    });
    sGuia.addBlankRow(0.25);
  }
}

// ============================================================================
// 16. Serialize ODF XML Files
// ============================================================================
const NS_ALL = [
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"',
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"',
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"',
  'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"',
  'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"',
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"',
  'xmlns:xlink="http://www.w3.org/1999/xlink"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
  'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"',
  'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"',
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"',
  'xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2"',
  'xmlns:calcext="urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0"',
  'xmlns:tableooo="http://openoffice.org/2009/table"',
  'office:version="1.2"',
].join(' ');

function buildStylesXml() {
  const namedXml = NAMED_STYLES.map((st) => `
    <style:style style:name="${st.name}" style:family="table-cell" style:parent-style-name="Default">
      <style:table-cell-properties fo:background-color="${st.bg}" fo:border="${st.borderW} solid ${st.border}" style:vertical-align="middle" fo:padding="0.08cm" fo:wrap-option="wrap"/>
      <style:paragraph-properties fo:text-align="${st.align}"/>
      <style:text-properties fo:color="${st.fg}" fo:font-family="Archivo" fo:font-size="9pt" fo:font-weight="${st.bold ? 'bold' : 'normal'}"/>
    </style:style>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles ${NS_ALL}>
  <office:font-face-decls>
    <style:font-face style:name="Archivo" svg:font-family="Archivo"/>
    <style:font-face style:name="Young Serif" svg:font-family="'Young Serif'"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="table-cell">
      <style:table-cell-properties fo:background-color="${PAL.VAZIO}" style:vertical-align="middle"/>
      <style:text-properties style:font-name="Archivo" fo:font-family="Archivo" fo:font-size="10pt" fo:color="${PAL.TINTA}" fo:language="pt" fo:country="BR"/>
    </style:default-style>
    <style:style style:name="Default" style:family="table-cell">
      <style:table-cell-properties fo:background-color="${PAL.VAZIO}" style:vertical-align="middle"/>
      <style:text-properties style:font-name="Archivo" fo:font-family="Archivo" fo:font-size="10pt" fo:color="${PAL.TINTA}"/>
    </style:style>${namedXml}
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="29.7cm" fo:page-height="21.0cm" style:print-orientation="landscape" fo:margin-top="0.6cm" fo:margin-bottom="0.6cm" fo:margin-left="0.6cm" fo:margin-right="0.6cm" style:table-centering="horizontal"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="pm1"/>
  </office:master-styles>
</office:document-styles>`;
}

function buildContentXml() {
  const tablesXml = wb.sheets.map((sheet) => {
    const tStyle = wb.getTableStyle(sheet.tabColor);
    const shapesXml = sheet.images.length
      ? `<table:shapes>${sheet.images.map((im) => `
          <draw:frame draw:name="${escXml(im.name)}" draw:style-name="gr_img" svg:x="${im.xCm}cm" svg:y="${im.yCm}cm" svg:width="${im.wCm}cm" svg:height="${im.hCm}cm">
            <draw:image xlink:href="${escXml(im.zipPath)}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad" draw:mime-type="image/png"/>
          </draw:frame>`).join('')}</table:shapes>`
      : '';

    const colsXml = sheet.colWidths.map((w) => {
      const cStyle = wb.getColStyle(w);
      return `<table:table-column table:style-name="${cStyle}" table:default-cell-style-name="Default"/>`;
    }).join('');

    const rowsXml = [];
    const voidStyle = wb.getCellStyle({ bg: PAL.VAZIO });
    for (let r1 = 1; r1 <= sheet.rowHeights.length; r1++) {
      const rStyle = wb.getRowStyle(sheet.rowHeights[r1 - 1]);
      const cellsXml = [];
      for (let c = 0; c < sheet.colWidths.length; c++) {
        const cell = sheet.cells.get(`${c},${r1}`);
        if (!cell) {
          cellsXml.push(`<table:table-cell table:style-name="${voidStyle}"/>`);
          continue;
        }
        if (cell.covered) {
          cellsXml.push(`<table:covered-table-cell table:style-name="${cell.style}"/>`);
          continue;
        }
        const attrs = [`table:style-name="${cell.style}"`];
        if (cell.spanC > 1) attrs.push(`table:number-columns-spanned="${cell.spanC}"`);
        if (cell.spanR > 1) attrs.push(`table:number-rows-spanned="${cell.spanR}"`);
        if (cell.validation) attrs.push(`table:content-validation-name="${cell.validation}"`);
        if (cell.formula) attrs.push(`table:formula="${escXml(cell.formula)}"`);

        let inner = '';
        if (cell.valueType === 'float') {
          attrs.push('office:value-type="float"', `office:value="${cell.value ?? 0}"`);
          inner = `<text:p>${escXml(String(cell.value ?? 0))}</text:p>`;
        } else if (cell.text !== undefined) {
          attrs.push('office:value-type="string"');
          if (cell.formula && cell.value !== undefined) {
            attrs.push(`office:string-value="${escXml(cell.value)}"`);
          }
          const lines = Array.isArray(cell.text) ? cell.text : [cell.text];
          inner = lines.map((ln) => `<text:p>${escXml(ln)}</text:p>`).join('');
        }

        if (inner) {
          cellsXml.push(`<table:table-cell ${attrs.join(' ')}>${inner}</table:table-cell>`);
        } else {
          cellsXml.push(`<table:table-cell ${attrs.join(' ')}/>`);
        }
      }
      rowsXml.push(`<table:table-row table:style-name="${rStyle}">${cellsXml.join('')}</table:table-row>`);
    }

    return `
    <table:table table:name="${escXml(sheet.name)}" table:style-name="${tStyle}">
      ${shapesXml}
      ${colsXml}
      ${rowsXml.join('')}
    </table:table>`;
  }).join('');

  const autoStyles = [];

  // Graphic style for images
  autoStyles.push(`
    <style:style style:name="gr_img" style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none" fo:margin-left="0cm" fo:margin-right="0cm" fo:margin-top="0cm" fo:margin-bottom="0cm"/>
    </style:style>`);

  for (const [, col] of wb.colStyles) {
    autoStyles.push(`
    <style:style style:name="${col.name}" style:family="table-column">
      <style:table-column-properties fo:break-before="auto" style:column-width="${col.widthCm}cm"/>
    </style:style>`);
  }

  for (const [, row] of wb.rowStyles) {
    autoStyles.push(`
    <style:style style:name="${row.name}" style:family="table-row">
      <style:table-row-properties style:row-height="${row.heightCm}cm" fo:break-before="auto" style:use-optimal-row-height="false"/>
    </style:style>`);
  }

  for (const [, tb] of wb.tableStyles) {
    autoStyles.push(`
    <style:style style:name="${tb.name}" style:family="table">
      <style:table-properties table:display="true" style:writing-mode="lr-tb" tableooo:tab-color="${tb.tabColor}"/>
    </style:style>`);
  }

  for (const [, ce] of wb.cellStyles) {
    const mapsXml = ce.maps.map((m) => `<style:map style:condition="${escXml(m.cond)}" style:apply-style-name="${m.style}"/>`).join('');
    const fontFamilyAttr = ce.font.includes(' ') ? `'${ce.font}'` : ce.font;
    autoStyles.push(`
    <style:style style:name="${ce.name}" style:family="table-cell" style:parent-style-name="Default">
      <style:table-cell-properties fo:background-color="${ce.bg}" fo:border-top="${escXml(ce.bTop)}" fo:border-bottom="${escXml(ce.bBot)}" fo:border-left="${escXml(ce.bLeft)}" fo:border-right="${escXml(ce.bRight)}" fo:padding="${ce.pad}" style:vertical-align="${ce.valign}" fo:wrap-option="${ce.wrap ? 'wrap' : 'no-wrap'}"/>
      <style:paragraph-properties fo:text-align="${ce.halign}"/>
      <style:text-properties style:font-name="${escXml(ce.font)}" fo:font-family="${escXml(fontFamilyAttr)}" fo:font-size="${ce.size}pt" fo:color="${ce.fg}" fo:font-weight="${ce.bold ? 'bold' : 'normal'}" fo:font-style="${ce.italic ? 'italic' : 'normal'}"/>${mapsXml}
    </style:style>`);
  }

  const valXml = [...wb.validations.values()].map((v) => {
    const listExpr = v.options.map((o) => `"${o}"`).join(';');
    const cond = `of:cell-content-is-in-list(${listExpr})`;
    const help = v.promptBody ? `<table:help-message table:title="${escXml(v.promptTitle)}" table:display="true"><text:p>${escXml(v.promptBody)}</text:p></table:help-message>` : '';
    return `
      <table:content-validation table:name="${v.name}" table:condition="${escXml(cond)}" table:allow-empty-cell="true" table:display-list="unsorted" table:base-cell-address="${escXml(v.baseCellAddr)}">
        ${help}
        <table:error-message table:message-type="stop" table:display="true" table:title="Seleção inválida">${'<text:p>Escolha uma das opções disponíveis na lista suspensa.</text:p>'}</table:error-message>
      </table:content-validation>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${NS_ALL}>
  <office:font-face-decls>
    <style:font-face style:name="Archivo" svg:font-family="Archivo"/>
    <style:font-face style:name="Young Serif" svg:font-family="'Young Serif'"/>
  </office:font-face-decls>
  <office:automatic-styles>${autoStyles.join('')}
  </office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:calculation-settings table:case-sensitive="false" table:automatic-find-labels="false"/>
      <table:content-validations>${valXml}
      </table:content-validations>${tablesXml}
    </office:spreadsheet>
  </office:body>
</office:document-content>`;
}

function buildMetaXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.2">
  <office:meta>
    <dc:title>ThanOS — Um Jogo de Sistemas Operacionais (LibreOffice Calc)</dc:title>
    <dc:subject>Sistemas Operacionais 1 e 2 (FCT/UNESP)</dc:subject>
    <dc:creator>Murilo Fuzi Correia e Álvaro de Freitas Grotto</dc:creator>
    <meta:generator>ThanOS Calc Builder/1.0</meta:generator>
  </office:meta>
</office:document-meta>`;
}

function buildSettingsXml() {
  const tableEntries = wb.sheets.map((s) => `
          <config:config-item-map-entry config:name="${escXml(s.name)}">
            <config:config-item config:name="CursorPositionX" config:type="int">0</config:config-item>
            <config:config-item config:name="CursorPositionY" config:type="int">0</config:config-item>
            <config:config-item config:name="HorizontalSplitMode" config:type="short">0</config:config-item>
            <config:config-item config:name="VerticalSplitMode" config:type="short">0</config:config-item>
            <config:config-item config:name="ShowGrid" config:type="boolean">false</config:config-item>
            <config:config-item config:name="ShowPageBreaks" config:type="boolean">false</config:config-item>
            <config:config-item config:name="HasColumnRowHeaders" config:type="boolean">true</config:config-item>
            <config:config-item config:name="ZoomType" config:type="short">0</config:config-item>
            <config:config-item config:name="ZoomValue" config:type="int">85</config:config-item>
          </config:config-item-map-entry>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" xmlns:ooo="http://openoffice.org/2004/office" office:version="1.2">
  <office:settings>
    <config:config-item-set config:name="ooo:view-settings">
      <config:config-item config:name="VisibleAreaTop" config:type="int">0</config:config-item>
      <config:config-item config:name="VisibleAreaLeft" config:type="int">0</config:config-item>
      <config:config-item-map-indexed config:name="Views">
        <config:config-item-map-entry>
          <config:config-item config:name="ViewId" config:type="string">view1</config:config-item>
          <config:config-item config:name="ActiveTable" config:type="string">SALAO</config:config-item>
          <config:config-item config:name="ZoomType" config:type="short">0</config:config-item>
          <config:config-item config:name="ZoomValue" config:type="int">85</config:config-item>
          <config:config-item-map-named config:name="Tables">${tableEntries}
          </config:config-item-map-named>
        </config:config-item-map-entry>
      </config:config-item-map-indexed>
    </config:config-item-set>
    <config:config-item-set config:name="ooo:configuration-settings">
      <config:config-item config:name="AutoCalculate" config:type="boolean">true</config:config-item>
      <config:config-item config:name="ShowGrid" config:type="boolean">false</config:config-item>
      <config:config-item config:name="ShowZeroValues" config:type="boolean">true</config:config-item>
      <config:config-item config:name="HasSheetTabs" config:type="boolean">true</config:config-item>
    </config:config-item-set>
  </office:settings>
</office:document-settings>`;
}

function buildManifestXml(usedImagePaths) {
  const picEntries = [...usedImagePaths].sort().map((p) =>
    `  <manifest:file-entry manifest:full-path="${escXml(p)}" manifest:media-type="image/png"/>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
${picEntries}
</manifest:manifest>`;
}

// ============================================================================
// 17. Assemble and Write .ods Package
// ============================================================================
const usedPicPaths = new Set();
for (const s of wb.sheets) {
  for (const im of s.images) usedPicPaths.add(im.zipPath);
}

const entries = [
  { name: 'mimetype', data: Buffer.from('application/vnd.oasis.opendocument.spreadsheet', 'ascii'), store: true },
  { name: 'content.xml', data: buildContentXml(), store: false },
  { name: 'styles.xml', data: buildStylesXml(), store: false },
  { name: 'meta.xml', data: buildMetaXml(), store: false },
  { name: 'settings.xml', data: buildSettingsXml(), store: false },
  { name: 'META-INF/manifest.xml', data: buildManifestXml(usedPicPaths), store: false },
];

for (const img of Object.values(loadedImages)) {
  if (usedPicPaths.has(img.zipPath)) {
    entries.push({ name: img.zipPath, data: img.buf, store: true });
  }
}

const zipBuffer = buildZip(entries);
fs.writeFileSync(OUT_ODS, zipBuffer);

console.log(`Generated ${OUT_ODS} (${zipBuffer.length} bytes, ${wb.sheets.length} sheets, ${usedPicPaths.size} unique embedded PNGs, ${wb.validations.size} dropdowns)`);
