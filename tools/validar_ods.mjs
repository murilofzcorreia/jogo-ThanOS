import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'c:\\Users\\User\\Documents\\jogoMadias';
const ODS_PATH = path.join(ROOT, 'ThanOS_SO1_Calc.ods');
const TMP_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\024e7f4f-b727-462d-a76d-09012927a354\\scratch\\ods_check';

function assert(cond, msg) {
  if (!cond) throw new Error(`VALIDATION FAILED: ${msg}`);
}

function unescXml(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// ============================================================================
// 1. Check ZIP header entry #1 (uncompressed 'mimetype')
// ============================================================================
const odsBuf = fs.readFileSync(ODS_PATH);
assert(odsBuf.readUInt32LE(0) === 0x04034b50, 'Not a valid ZIP file');
const method1 = odsBuf.readUInt16LE(8);
const compLen1 = odsBuf.readUInt32LE(18);
const rawLen1 = odsBuf.readUInt32LE(22);
const nameLen1 = odsBuf.readUInt16LE(26);
const extraLen1 = odsBuf.readUInt16LE(28);
const name1 = odsBuf.subarray(30, 30 + nameLen1).toString('utf8');
const dataStart1 = 30 + nameLen1 + extraLen1;
const data1 = odsBuf.subarray(dataStart1, dataStart1 + rawLen1).toString('ascii');

assert(name1 === 'mimetype', `Entry #1 must be mimetype, got ${name1}`);
assert(method1 === 0, `mimetype compression method must be 0 (STORED), got ${method1}`);
assert(compLen1 === 46 && rawLen1 === 46, `mimetype length must be 46, got ${rawLen1}`);
assert(data1 === 'application/vnd.oasis.opendocument.spreadsheet', `Unexpected mimetype: ${data1}`);
console.log('[OK] ZIP check: entry #1 is uncompressed mimetype (46 bytes).');

// ============================================================================
// 2. Extract via PowerShell ZipFile & validate XML well-formedness via .NET
// ============================================================================
if (fs.existsSync(TMP_DIR)) {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TMP_DIR, { recursive: true });

const psCheckScript = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory('${ODS_PATH}', '${TMP_DIR}')
$xmlFiles = @('content.xml', 'styles.xml', 'meta.xml', 'settings.xml', 'META-INF\\manifest.xml')
foreach ($rel in $xmlFiles) {
    $full = Join-Path '${TMP_DIR}' $rel
    if (-not (Test-Path $full)) { throw "Missing $rel" }
    $doc = New-Object System.Xml.XmlDocument
    $doc.Load($full)
}
Write-Output 'XML_OK'
`;
const psRes = execFileSync('powershell', ['-NoProfile', '-Command', psCheckScript], { encoding: 'utf8' });
assert(psRes.includes('XML_OK'), `PowerShell XML load failed: ${psRes}`);
console.log('[OK] XML well-formedness: all 5 XML files parsed cleanly via .NET XmlDocument.');

const contentXml = fs.readFileSync(path.join(TMP_DIR, 'content.xml'), 'utf8');
const stylesXml = fs.readFileSync(path.join(TMP_DIR, 'styles.xml'), 'utf8');
const manifestXml = fs.readFileSync(path.join(TMP_DIR, 'META-INF', 'manifest.xml'), 'utf8');
const settingsXml = fs.readFileSync(path.join(TMP_DIR, 'settings.xml'), 'utf8');

// ============================================================================
// 3. Manifest & Embedded Image check
// ============================================================================
const manifestPaths = new Set();
for (const m of manifestXml.matchAll(/manifest:full-path="([^"]+)"/g)) {
  manifestPaths.add(m[1]);
}
const imageHrefs = new Set();
for (const m of contentXml.matchAll(/<draw:image[^>]+xlink:href="([^"]+)"/g)) {
  imageHrefs.add(unescXml(m[1]));
}
assert(imageHrefs.size === 19, `Expected 19 unique embedded images, got ${imageHrefs.size}`);
for (const href of imageHrefs) {
  assert(manifestPaths.has(href), `Manifest missing image: ${href}`);
  assert(fs.existsSync(path.join(TMP_DIR, href)), `Extracted folder missing image: ${href}`);
}
console.log(`[OK] Manifest & Images: all ${imageHrefs.size} PNGs present in ZIP and manifest.xml.`);

// ============================================================================
// 4. Styles & Content-Validation Integrity
// ============================================================================
// Extract named styles from <office:styles> in styles.xml
const officeStylesBlock = stylesXml.match(/<office:styles>([\s\S]*?)<\/office:styles>/)[1];
const namedStyles = new Set();
for (const m of officeStylesBlock.matchAll(/<style:style[^>]+style:name="([^"]+)"/g)) {
  namedStyles.add(m[1]);
}

// Extract automatic styles in content.xml
const autoStylesBlock = contentXml.match(/<office:automatic-styles>([\s\S]*?)<\/office:automatic-styles>/)[1];
const autoStyles = new Set();
for (const m of autoStylesBlock.matchAll(/<style:style[^>]+style:name="([^"]+)"/g)) {
  autoStyles.add(m[1]);
}

// Verify every style:map apply-style-name resolves in <office:styles>
let mapCount = 0;
for (const m of autoStylesBlock.matchAll(/<style:map[^>]+style:apply-style-name="([^"]+)"/g)) {
  assert(namedStyles.has(m[1]), `<style:map> references missing named style in styles.xml: ${m[1]}`);
  mapCount++;
}

// Extract validations
const validations = new Map();
for (const m of contentXml.matchAll(/<table:content-validation\s+([^>]+)>([\s\S]*?)<\/table:content-validation>/g)) {
  const attrs = m[1];
  const name = attrs.match(/table:name="([^"]+)"/)[1];
  const cond = unescXml(attrs.match(/table:condition="([^"]+)"/)[1]);
  assert(cond.startsWith('of:cell-content-is-in-list(') && cond.endsWith(')'), `Invalid validation cond (${name}): ${cond}`);
  const innerList = cond.slice('of:cell-content-is-in-list('.length, -1);
  const rawItems = innerList.split(';');
  const options = rawItems.map((it) => {
    assert(it.startsWith('"') && it.endsWith('"'), `Malformed list option in ${name}: ${it}`);
    const opt = it.slice(1, -1);
    assert(!opt.includes('"') && !opt.includes(';'), `Unsafe character in option (${name}): ${opt}`);
    return opt;
  });
  validations.set(name, options);
}
assert(validations.size === 40, `Expected 40 validations, got ${validations.size}`);

// Verify every referenced table:style-name, draw:style-name, table:content-validation-name
for (const m of contentXml.matchAll(/table:style-name="([^"]+)"/g)) {
  assert(autoStyles.has(m[1]) || namedStyles.has(m[1]), `Missing table/cell/col/row style: ${m[1]}`);
}
for (const m of contentXml.matchAll(/draw:style-name="([^"]+)"/g)) {
  assert(autoStyles.has(m[1]), `Missing draw style: ${m[1]}`);
}
for (const m of contentXml.matchAll(/table:content-validation-name="([^"]+)"/g)) {
  assert(validations.has(m[1]), `Missing validation: ${m[1]}`);
}
console.log(`[OK] Styles & Validations: ${namedStyles.size} named styles, ${autoStyles.size} auto styles, ${mapCount} style maps, ${validations.size} dropdowns verified.`);

// ============================================================================
// 5. Parse tables, verify Grid & Merge Integrity, Check Image vs Text Overlap
// ============================================================================
function parseXml(xml) {
  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const len = xml.length;
  let i = 0;
  while (i < len) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) break;
    if (lt > i) {
      stack[stack.length - 1].text += unescXml(xml.slice(i, lt));
    }
    if (xml.startsWith('<?', lt)) {
      i = xml.indexOf('?>', lt) + 2;
      continue;
    }
    if (xml.startsWith('<!--', lt)) {
      i = xml.indexOf('-->', lt) + 3;
      continue;
    }
    // Find closing '>' outside quotes
    let j = lt + 1;
    let inQ = false;
    while (j < len) {
      const ch = xml[j];
      if (ch === '"') inQ = !inQ;
      else if (ch === '>' && !inQ) break;
      j++;
    }
    const rawTag = xml.slice(lt + 1, j);
    i = j + 1;
    if (rawTag.startsWith('/')) {
      stack.pop();
      continue;
    }
    const selfClose = rawTag.endsWith('/');
    const body = selfClose ? rawTag.slice(0, -1).trim() : rawTag.trim();
    const spIdx = body.search(/\s/);
    const tag = spIdx === -1 ? body : body.slice(0, spIdx);
    const attrStr = spIdx === -1 ? '' : body.slice(spIdx + 1);
    const attrs = {};
    for (const am of attrStr.matchAll(/([A-Za-z0-9_:-]+)="([^"]*)"/g)) {
      attrs[am[1]] = unescXml(am[2]);
    }
    const node = { tag, attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

const contentDom = parseXml(contentXml);
const findChild = (node, tag) => node.children.find((c) => c.tag === tag);
const findAll = (node, tag, acc = []) => {
  for (const c of node.children) {
    if (c.tag === tag) acc.push(c);
    findAll(c, tag, acc);
  }
  return acc;
};

const docContent = findChild(contentDom, 'office:document-content');
const autoStylesNode = findChild(docContent, 'office:automatic-styles');
const spreadsheetNode = findChild(findChild(docContent, 'office:body'), 'office:spreadsheet');
const tablesNodes = spreadsheetNode.children.filter((c) => c.tag === 'table:table');

const colWidthMap = new Map();
const rowHeightMap = new Map();
for (const stNode of autoStylesNode.children) {
  if (stNode.tag !== 'style:style') continue;
  const sName = stNode.attrs['style:name'];
  const fam = stNode.attrs['style:family'];
  if (fam === 'table-column') {
    const p = findChild(stNode, 'style:table-column-properties');
    colWidthMap.set(sName, parseFloat(p.attrs['style:column-width']));
  } else if (fam === 'table-row') {
    const p = findChild(stNode, 'style:table-row-properties');
    rowHeightMap.set(sName, parseFloat(p.attrs['style:row-height']));
  }
}

function colLetters(idx0) {
  let n = idx0;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

const sheetNames = new Set();
const sheetCells = new Map(); // "SHEET.A1" -> { formula, value, validation, text }

for (const tbl of tablesNodes) {
  const sName = tbl.attrs['table:name'];
  sheetNames.add(sName);
  assert(settingsXml.includes(`config:name="${sName}"`), `settings.xml missing ShowGrid config for ${sName}`);

  // Verify child order: shapes (if any) before columns before rows
  const childTags = tbl.children.map((c) => c.tag);
  const shapesIdx = childTags.indexOf('table:shapes');
  const firstColIdx = childTags.indexOf('table:table-column');
  const firstRowIdx = childTags.indexOf('table:table-row');
  if (shapesIdx !== -1) assert(shapesIdx < firstColIdx, `In ${sName}, <table:shapes> must precede <table:table-column>`);
  assert(firstColIdx < firstRowIdx, `In ${sName}, <table:table-column> must precede <table:table-row>`);

  const colWidths = tbl.children
    .filter((c) => c.tag === 'table:table-column')
    .map((c) => colWidthMap.get(c.attrs['table:style-name']));
  const colStarts = [0];
  for (let i = 0; i < colWidths.length; i++) colStarts.push(colStarts[i] + colWidths[i]);

  const frames = [];
  const shapesNode = findChild(tbl, 'table:shapes');
  if (shapesNode) {
    for (const fr of shapesNode.children) {
      if (fr.tag !== 'draw:frame') continue;
      frames.push({
        name: fr.attrs['draw:name'],
        x1: parseFloat(fr.attrs['svg:x']),
        y1: parseFloat(fr.attrs['svg:y']),
        x2: parseFloat(fr.attrs['svg:x']) + parseFloat(fr.attrs['svg:width']),
        y2: parseFloat(fr.attrs['svg:y']) + parseFloat(fr.attrs['svg:height']),
      });
    }
  }

  const rowNodes = tbl.children.filter((c) => c.tag === 'table:table-row');
  const rowStarts = [0];
  for (let r = 0; r < rowNodes.length; r++) {
    rowStarts.push(rowStarts[r] + rowHeightMap.get(rowNodes[r].attrs['table:style-name']));
  }

  const expectedCovered = new Set();
  const contentBoxes = [];

  for (let r0 = 0; r0 < rowNodes.length; r0++) {
    let c0 = 0;
    for (const cellNode of rowNodes[r0].children) {
      const tag = cellNode.tag;
      const coord = `${c0},${r0}`;

      if (tag === 'table:covered-table-cell') {
        assert(expectedCovered.has(coord), `Unexpected covered cell at ${sName}!${colLetters(c0)}${r0 + 1}`);
        expectedCovered.delete(coord);
        c0++;
        continue;
      }

      assert(tag === 'table:table-cell', `Unexpected row child tag ${tag} in ${sName}`);
      assert(!expectedCovered.has(coord), `Covered coordinate emitted as table-cell at ${sName}!${colLetters(c0)}${r0 + 1}`);
      const spanC = cellNode.attrs['table:number-columns-spanned'] ? parseInt(cellNode.attrs['table:number-columns-spanned'], 10) : 1;
      const spanR = cellNode.attrs['table:number-rows-spanned'] ? parseInt(cellNode.attrs['table:number-rows-spanned'], 10) : 1;

      for (let rr = r0; rr < r0 + spanR; rr++) {
        for (let cc = c0; cc < c0 + spanC; cc++) {
          if (rr === r0 && cc === c0) continue;
          const ck = `${cc},${rr}`;
          assert(!expectedCovered.has(ck), `Merge overlap at ${sName}!${colLetters(cc)}${rr + 1}`);
          expectedCovered.add(ck);
        }
      }

      const formula = cellNode.attrs['table:formula'] ?? null;
      const valName = cellNode.attrs['table:content-validation-name'] ?? null;
      const texts = cellNode.children.filter((p) => p.tag === 'text:p').map((p) => p.text);
      const addr = `${sName}.${colLetters(c0)}${r0 + 1}`;
      sheetCells.set(addr, { formula, validation: valName, text: texts.join('\n') });

      if (texts.length > 0 || formula || valName) {
        contentBoxes.push({
          addr,
          x1: colStarts[c0],
          y1: rowStarts[r0],
          x2: colStarts[c0 + spanC],
          y2: rowStarts[r0 + spanR],
        });
      }

      c0++;
    }
    assert(c0 === colWidths.length, `Row ${r0 + 1} in ${sName} has ${c0} cells, expected ${colWidths.length}`);
  }
  assert(expectedCovered.size === 0, `Unclosed merge covers remaining in ${sName}: ${[...expectedCovered].join(', ')}`);

  for (const fr of frames) {
    for (const cb of contentBoxes) {
      const overlapX = fr.x1 < cb.x2 - 0.002 && fr.x2 > cb.x1 + 0.002;
      const overlapY = fr.y1 < cb.y2 - 0.002 && fr.y2 > cb.y1 + 0.002;
      assert(!(overlapX && overlapY), `Image ${fr.name} overlaps non-empty cell ${cb.addr}`);
    }
  }
}
console.log(`[OK] Grid, Merge & Zero-Overlap check: ${sheetNames.size} sheets verified with 0 cell mismatches and 0 image/text overlaps.`);

// ============================================================================
// 6. Zero '?' audit across all visible text & validation help/error messages
// ============================================================================
for (const tm of contentXml.matchAll(/<text:p>([\s\S]*?)<\/text:p>/g)) {
  const txt = unescXml(tm[1]);
  assert(!txt.includes('?'), `Found forbidden '?' in <text:p>: ${txt}`);
}
for (const hm of contentXml.matchAll(/table:title="([^"]+)"/g)) {
  const txt = unescXml(hm[1]);
  assert(!txt.includes('?'), `Found forbidden '?' in table:title: ${txt}`);
}
console.log('[OK] Zero "?" audit: 0 question marks in all visible text and validation dialogs.');

// ============================================================================
// 7. Formula Syntax & Cross-Sheet Reference Audit
// ============================================================================
const ALLOWED_FUNCS = new Set(['IF', 'AND', 'OR', 'NOT', 'SUM', 'COUNTIF', 'COUNTA', 'HYPERLINK', 'REPT', 'ROUND', 'MAX', 'MIN', 'FALSE']);

for (const [addr, cell] of sheetCells) {
  if (!cell.formula) continue;
  const f = cell.formula;
  assert(f.startsWith('of:='), `Formula at ${addr} does not start with of:=`);
  const expr = f.slice(4);

  // Balanced parens, brackets, quotes
  let paren = 0;
  let brack = 0;
  let inQ = false;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"') inQ = !inQ;
    else if (!inQ) {
      if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (ch === '[') brack++;
      else if (ch === ']') brack--;
      assert(paren >= 0 && brack >= 0, `Unbalanced delimiters in ${addr}: ${expr}`);
    }
  }
  assert(!inQ && paren === 0 && brack === 0, `Unclosed delimiter/quote in ${addr}: ${expr}`);

  // Strip quoted strings, check function names & cross-sheet targets
  const noStrings = expr.replace(/"[^"]*"/g, '""');
  for (const fn of noStrings.matchAll(/([A-Z0-9_]+)\s*\(/g)) {
    assert(ALLOWED_FUNCS.has(fn[1]), `Unsupported/unexpected function ${fn[1]} in ${addr}`);
  }
  for (const hl of expr.matchAll(/HYPERLINK\("#([A-Z0-9_]+)\.([A-Z]+\d+)"/g)) {
    assert(sheetNames.has(hl[1]), `Broken HYPERLINK sheet ${hl[1]} in ${addr}`);
  }
  for (const ref of noStrings.matchAll(/\[([A-Z0-9_]+)\.([A-Z]+\d+)\]/g)) {
    assert(sheetNames.has(ref[1]), `Broken cross-sheet ref ${ref[1]} in ${addr}`);
    assert(sheetCells.has(`${ref[1]}.${ref[2]}`), `Out-of-bounds ref ${ref[1]}.${ref[2]} in ${addr}`);
  }
}
console.log('[OK] Formula syntax & cross-sheet reference audit passed.');

// ============================================================================
// 8. Full Progression Simulation via OpenFormula Evaluator
// ============================================================================
function evalWorkbook(overrides = {}) {
  const values = new Map();
  for (const [addr, c] of sheetCells) {
    if (Object.prototype.hasOwnProperty.call(overrides, addr)) {
      values.set(addr, overrides[addr]);
    } else if (!c.formula) {
      values.set(addr, c.text ?? '');
    }
  }

  function resolveRef(curSheet, rawRef) {
    // rawRef inside [...] like .I12 or J1_PODER.I4 or .G14:.G17
    const clean = rawRef.replace(/\$/g, '');
    if (clean.includes(':')) {
      const [a, b] = clean.split(':');
      const [s1, col1, row1] = parseSingleRef(curSheet, a);
      const [, col2, row2] = parseSingleRef(curSheet, b);
      const out = [];
      for (let r = row1; r <= row2; r++) {
        for (let c = col1; c <= col2; c++) {
          out.push(evalCell(`${s1}.${colLetters(c)}${r}`));
        }
      }
      return out;
    }
    const [s, c, r] = parseSingleRef(curSheet, clean);
    return evalCell(`${s}.${colLetters(c)}${r}`);
  }

  function parseSingleRef(curSheet, token) {
    let sh = curSheet;
    let cellPart = token;
    if (token.startsWith('.')) {
      cellPart = token.slice(1);
    } else if (token.includes('.')) {
      const parts = token.split('.');
      sh = parts[0];
      cellPart = parts[1];
    }
    const m = cellPart.match(/^([A-Z]+)(\d+)$/);
    assert(m, `Invalid ref token: ${token} in ${curSheet}`);
    let col = 0;
    for (let i = 0; i < m[1].length; i++) col = col * 26 + (m[1].charCodeAt(i) - 64);
    return [sh, col - 1, parseInt(m[2], 10)];
  }

  function evalExpr(curSheet, expr) {
    // Convert OpenFormula to JS evaluation safely via a recursive-descent mini-evaluator
    let pos = 0;
    const len = expr.length;
    const skipWs = () => { while (pos < len && expr[pos] === ' ') pos++; };

    function parseOrCmp() {
      let left = parseAdd();
      skipWs();
      while (pos < len) {
        if (expr.startsWith('<=', pos)) { pos += 2; left = left <= parseAdd(); }
        else if (expr.startsWith('>=', pos)) { pos += 2; left = left >= parseAdd(); }
        else if (expr.startsWith('<>', pos)) { pos += 2; left = left !== parseAdd(); }
        else if (expr[pos] === '=') { pos += 1; left = left === parseAdd(); }
        else if (expr[pos] === '<') { pos += 1; left = left < parseAdd(); }
        else if (expr[pos] === '>') { pos += 1; left = left > parseAdd(); }
        else break;
        skipWs();
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      skipWs();
      while (pos < len && (expr[pos] === '+' || expr[pos] === '-' || expr[pos] === '&')) {
        const op = expr[pos++];
        const right = parseMul();
        if (op === '+') left = Number(left) + Number(right);
        else if (op === '-') left = Number(left) - Number(right);
        else left = String(left) + String(right);
        skipWs();
      }
      return left;
    }

    function parseMul() {
      let left = parseAtom();
      skipWs();
      while (pos < len && (expr[pos] === '*' || expr[pos] === '/')) {
        const op = expr[pos++];
        const right = parseAtom();
        left = op === '*' ? Number(left) * Number(right) : Number(left) / Number(right);
        skipWs();
      }
      return left;
    }

    function parseAtom() {
      skipWs();
      if (expr[pos] === '(') {
        pos++;
        const v = parseOrCmp();
        skipWs();
        assert(expr[pos] === ')', `Expected ) at ${pos} in ${expr}`);
        pos++;
        return v;
      }
      if (expr[pos] === '"') {
        pos++;
        let s = '';
        while (pos < len && expr[pos] !== '"') s += expr[pos++];
        pos++;
        return s;
      }
      if (expr[pos] === '[') {
        pos++;
        let r = '';
        while (pos < len && expr[pos] !== ']') r += expr[pos++];
        pos++;
        return resolveRef(curSheet, r);
      }
      if (/[0-9]/.test(expr[pos])) {
        let num = '';
        while (pos < len && /[0-9.]/.test(expr[pos])) num += expr[pos++];
        return Number(num);
      }
      const m = expr.slice(pos).match(/^([A-Z0-9_]+)\s*\(/);
      assert(m, `Unexpected token at pos ${pos} in ${curSheet}: ${expr.slice(pos)}`);
      const fn = m[1];
      pos += m[0].length;
      const args = [];
      skipWs();
      if (expr[pos] !== ')') {
        while (true) {
          args.push(parseOrCmp());
          skipWs();
          if (expr[pos] === ';') { pos++; continue; }
          break;
        }
      }
      assert(expr[pos] === ')', `Expected ) closing ${fn} in ${expr}`);
      pos++;
      switch (fn) {
        case 'IF': return args[0] ? args[1] : (args.length > 2 ? args[2] : false);
        case 'AND': return args.every(Boolean);
        case 'OR': return args.some(Boolean);
        case 'NOT': return !args[0];
        case 'FALSE': return false;
        case 'SUM': return args.flat().reduce((a, b) => a + Number(b), 0);
        case 'COUNTA': return args.flat().filter((x) => x !== '').length;
        case 'COUNTIF': {
          const arr = Array.isArray(args[0]) ? args[0] : [args[0]];
          return arr.filter((x) => x === args[1]).length;
        }
        case 'HYPERLINK': return args[1] ?? args[0];
        case 'REPT': return String(args[0]).repeat(Math.max(0, Number(args[1])));
        case 'ROUND': return Math.round(Number(args[0]));
        case 'MAX': return Math.max(...args.flat().map(Number));
        case 'MIN': return Math.min(...args.flat().map(Number));
        default: throw new Error(`Unhandled fn ${fn}`);
      }
    }

    const res = parseOrCmp();
    skipWs();
    assert(pos === len, `Trailing expr at ${pos} in ${expr}`);
    return res;
  }

  const stack = new Set();
  function evalCell(addr) {
    if (values.has(addr)) return values.get(addr);
    const cell = sheetCells.get(addr);
    assert(cell, `Missing cell ${addr}`);
    if (!cell.formula) {
      values.set(addr, cell.text ?? '');
      return values.get(addr);
    }
    assert(!stack.has(addr), `Circular formula at ${addr}`);
    stack.add(addr);
    const sh = addr.split('.')[0];
    const v = evalExpr(sh, cell.formula.slice(4));
    stack.delete(addr);
    values.set(addr, v);
    return v;
  }

  for (const addr of sheetCells.keys()) evalCell(addr);
  return values;
}

// 8a. Test Initial Empty State
const emptyVals = evalWorkbook();
assert(emptyVals.get('J1_PODER.I2') === '0 / 7', `Empty Poder counter mismatch: ${emptyVals.get('J1_PODER.I2')}`);
assert(emptyVals.get('J2_TEMPO.I2') === '0 / 9', `Empty Tempo counter mismatch: ${emptyVals.get('J2_TEMPO.I2')}`);
assert(emptyVals.get('J3_ESPACO.I2') === '0 / 9', `Empty Espaco counter mismatch: ${emptyVals.get('J3_ESPACO.I2')}`);
assert(emptyVals.get('SALAO.I3') === 'ETAPAS SO 1: 0 / 25   [░░░░░░░░░░]', `Empty SALAO I3 mismatch: ${emptyVals.get('SALAO.I3')}`);
assert(emptyVals.get('SALAO.I4') === 'JOIAS SO 1: 0 / 3   |   TOTAL MANOPLA: 0 / 6', `Empty SALAO I4 mismatch: ${emptyVals.get('SALAO.I4')}`);
assert(emptyVals.get('ESTALO.I13') === '○ TRAVADA', `Empty Estalo state mismatch: ${emptyVals.get('ESTALO.I13')}`);

// 8b. Verify every validation dropdown contains the expected correct options and fill all 25 SO 1 stages
const FULL_SO1 = {
  // J1_PODER
  'J1_PODER.G14': 'Mapear recursos disponíveis e características dos programas de usuários',
  'J1_PODER.G16': 'Processador (CPU)',
  'J1_PODER.G17': 'Memória RAM',
  'J1_PODER.G18': 'Periféricos (E/S)',
  'J1_PODER.G19': 'HD ou SSD',
  'J1_PODER.G20': 'Dispositivo Periférico',
  'J1_PODER.G21': 'Dar impressão de execução paralela e compartilhar recursos de forma organizada',
  'J1_PODER.G23': 'Máquina Virtual ou Estendida',
  'J1_PODER.G24': 'Gerente de Recursos',
  'J1_PODER.G25': 'Definir as tarefas dos componentes principais do SO',
  'J1_PODER.G27': 'Escalonador de processos e threads',
  'J1_PODER.G28': 'Gerente de memória',
  'J1_PODER.G29': 'Sistema de arquivos',
  'J1_PODER.G30': 'Software de entrada e saída',
  // J2_TEMPO
  'J2_TEMPO.G13': 'SSD ou HD (armazenamento secundário)',
  'J2_TEMPO.G14': 'Armazenamento permanente do SO e dos programas de usuário',
  'J2_TEMPO.G16': 'Acionar BIOS armazenado na memória ROM',
  'J2_TEMPO.G17': 'Verificar o setup e executar o POST',
  'J2_TEMPO.G18': 'Descompactar dados e ler dispositivos de armazenamento',
  'J2_TEMPO.G19': 'Iniciar o carregamento do Sistema Operacional',
  'J2_TEMPO.G21': 'Carregar núcleo do SO do HD ou SSD para a memória RAM',
  'J2_TEMPO.G22': 'Gravar início do Escalonador no IC e no Register of Scheduler',
  'J2_TEMPO.G23': 'Turnos de trabalho organizados em uma empresa',
  'J2_TEMPO.G24': 'SO e programas de usuário são escalonados para usar o processador',
  'J2_TEMPO.G25': 'Sistema Multiprogramado',
  'J2_TEMPO.G26': 'Processo de produção em uma empresa: conjunto de etapas e elementos',
  'J2_TEMPO.G27': 'O SO gerencia os processos de execução dos programas de usuário',
  // J3_ESPACO
  'J3_ESPACO.G25': 'A RAM armazena o SO e os programas enquanto o computador está ligado',
  'J3_ESPACO.G26': 'A RAM é a memória a partir da qual o SO e os programas são buscados',
  'J3_ESPACO.G27': 'Aplicar Particionamento da memória RAM',
  'J3_ESPACO.G29': 'Programas têm tamanhos diferentes: particionar em tamanhos diferentes',
  'J3_ESPACO.G30': '4 MB',
  'J3_ESPACO.G31': '6 MB',
  'J3_ESPACO.G32': '2 MB',
  'J3_ESPACO.G34': 'Definido no início das atividades do SO',
  'J3_ESPACO.G35': 'Ajustado durante as atividades do SO',
  'J3_ESPACO.G36': 'Aplicar divisão do HD em blocos',
  'J3_ESPACO.G38': 'B04',
  'J3_ESPACO.G39': 'B04 → B05 → B06 → B07 (adjacentes)',
  'J3_ESPACO.G40': 'Alocação Contígua',
  'J3_ESPACO.G42': 'B02 → B09',
  'J3_ESPACO.G43': 'B09 → B05',
  'J3_ESPACO.G44': 'B05 → B14',
  'J3_ESPACO.G45': 'Alocação por Lista Encadeada',
  'J3_ESPACO.G47': 'Criar tabela Nó-i em níveis para endereços do arquivo',
  'J3_ESPACO.G48': 'B01, B06, B11 e B15 (espalhados pelo disco)',
  'J3_ESPACO.G49': 'Nó-i (i-node)',
};

// Ensure every answer in FULL_SO1 is actually present in that cell's dropdown list
for (const [addr, val] of Object.entries(FULL_SO1)) {
  const cell = sheetCells.get(addr);
  assert(cell && cell.validation, `Input cell missing validation at ${addr}`);
  const opts = validations.get(cell.validation);
  assert(opts.includes(val), `Dropdown ${cell.validation} at ${addr} does not contain option "${val}"`);
}

const so1Done = evalWorkbook({ ...FULL_SO1, 'ESTALO.G13': 'DAR O ESTALO' });
assert(so1Done.get('J1_PODER.I2') === '7 / 7', `Poder full mismatch: ${so1Done.get('J1_PODER.I2')}`);
assert(so1Done.get('J1_PODER.I4') === '★ CONQUISTADA', `Poder badge mismatch: ${so1Done.get('J1_PODER.I4')}`);
assert(so1Done.get('J2_TEMPO.I2') === '9 / 9', `Tempo full mismatch: ${so1Done.get('J2_TEMPO.I2')}`);
assert(so1Done.get('J2_TEMPO.I4') === '★ CONQUISTADA', `Tempo badge mismatch: ${so1Done.get('J2_TEMPO.I4')}`);
assert(so1Done.get('J3_ESPACO.I2') === '9 / 9', `Espaco full mismatch: ${so1Done.get('J3_ESPACO.I2')}`);
assert(so1Done.get('J3_ESPACO.I4') === '★ CONQUISTADA', `Espaco badge mismatch: ${so1Done.get('J3_ESPACO.I4')}`);
assert(so1Done.get('SALAO.I3') === 'ETAPAS SO 1: 25 / 25   [██████████]', `SALAO SO1 bar mismatch: ${so1Done.get('SALAO.I3')}`);
assert(so1Done.get('SALAO.I4') === 'JOIAS SO 1: 3 / 3   |   TOTAL MANOPLA: 3 / 6', `SALAO SO1 gems mismatch: ${so1Done.get('SALAO.I4')}`);
assert(so1Done.get('J3_ESPACO.B9') === 'SO · 1 MB' && so1Done.get('J3_ESPACO.E9') === 'SO · 1 MB', 'RAM SO 4MB bar mismatch');
assert(so1Done.get('J3_ESPACO.F9') === 'PROG 1 · 1 MB' && so1Done.get('J3_ESPACO.E10') === 'PROG 1 · 1 MB', 'RAM Prog1 6MB bar mismatch');
assert(so1Done.get('J3_ESPACO.F10') === 'PROG 2 · 1 MB' && so1Done.get('J3_ESPACO.G10') === 'PROG 2 · 1 MB', 'RAM Prog2 2MB bar mismatch');
assert(so1Done.get('J3_ESPACO.K13') === '✓ CONTÍGUA' && so1Done.get('J3_ESPACO.K15') === '✓ ENCADEADA', 'Disk 1/2 status mismatch');
assert(so1Done.get('J3_ESPACO.G22') === '★ MÓDULO SO 1 (ETAPAS 01–25) COMPLETO', 'Disk 3 i-node status mismatch');
assert(so1Done.get('J1_PODER.B9') === '■ CPU · ATIVA' && so1Done.get('J1_PODER.H11') === '■ KERNEL FCTos01 OPERACIONAL', 'Poder schematic mismatch');
assert(so1Done.get('J2_TEMPO.B9') === '■ HD/SSD PERSISTENTE' && so1Done.get('J2_TEMPO.E10') === '■ IC → ESCALONADOR' && so1Done.get('J2_TEMPO.J10') === '■ T4: PROG 2 (ROBÔ)', 'Tempo schematic mismatch');
assert(so1Done.get('J3_ESPACO.B14') === '■ B04 · ARQ' && so1Done.get('J3_ESPACO.I13') === '■ B02→B09' && so1Done.get('J3_ESPACO.E22') === '■ B15 · NÓ-I', 'Disk block matrix cell mismatch');
assert(so1Done.get('ESTALO.I13') === '✗ BLOQUEADO', `Estalo should be blocked at 3/6, got: ${so1Done.get('ESTALO.I13')}`);

// 8c. Negative checks: duplicate hardware in Etapa 02, out-of-order in Etapa 10, RAM overflow in Etapa 20
const negCheck = evalWorkbook({
  'J1_PODER.G16': 'Processador (CPU)',
  'J1_PODER.G17': 'Processador (CPU)',
  'J2_TEMPO.G16': 'Verificar o setup e executar o POST',
  'J3_ESPACO.G30': '8 MB',
  'J3_ESPACO.G31': '6 MB',
  'J3_ESPACO.G32': '2 MB',
});
assert(negCheck.get('J1_PODER.I16') === '✗ DUPLICADO', `Expected duplicate check at J1_PODER.I16, got ${negCheck.get('J1_PODER.I16')}`);
assert(negCheck.get('J2_TEMPO.I16') === '✗ FORA DE ORDEM', `Expected out-of-order check at J2_TEMPO.I16, got ${negCheck.get('J2_TEMPO.I16')}`);
assert(String(negCheck.get('J3_ESPACO.H9')).includes('✗ ESTOURO'), `Expected RAM overflow check at J3_ESPACO.H9, got ${negCheck.get('J3_ESPACO.H9')}`);

// 8d. Full 6/6 + Estalo unlocked
const ALL_6 = {
  ...FULL_SO1,
  'J4_REALIDADE.G8': 'Coletar joia em modo demonstração',
  'J5_ALMA.G8': 'Coletar joia em modo demonstração',
  'J6_MENTE.G8': 'Coletar joia em modo demonstração',
  'ESTALO.G13': 'DAR O ESTALO',
};
const allDone = evalWorkbook(ALL_6);
assert(allDone.get('SALAO.I4') === 'JOIAS SO 1: 3 / 3   |   TOTAL MANOPLA: 6 / 6', `All 6 gems mismatch: ${allDone.get('SALAO.I4')}`);
assert(allDone.get('SALAO.B6') === '◆ PODER · OK', 'Poder LED mismatch');
assert(allDone.get('SALAO.D6') === '◆ TEMPO · OK', 'Tempo LED mismatch');
assert(allDone.get('SALAO.F6') === '◆ ESPAÇO · OK', 'Espaco LED mismatch');
assert(allDone.get('SALAO.H6') === '◆ REALIDADE · DEMO', 'Realidade LED mismatch');
assert(allDone.get('SALAO.J6') === '◆ ALMA · DEMO', 'Alma LED mismatch');
assert(allDone.get('SALAO.L6') === '◆ MENTE · DEMO', 'Mente LED mismatch');
assert(allDone.get('ESTALO.I13') === '★ ESTALO REALIZADO', `Estalo final mismatch: ${allDone.get('ESTALO.I13')}`);
assert(allDone.get('ESTALO.B16').includes('CONCLUSÃO DO FCTos01'), 'Estalo conclusion text missing');

console.log('[OK] Full progression simulation: 0/25 -> 25/25 (SO 1) -> duplicate/order error checks -> 6/6 -> ESTALO REALIZADO.');

// Cleanup temp extraction folder
fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log('[OK] All validation checks passed and temp files cleaned up.');
