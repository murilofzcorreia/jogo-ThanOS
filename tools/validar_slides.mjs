// Confere a navegação das três apresentações geradas por gerar_slides.mjs
// (ThanOS_SO1.pptx, ThanOS_SO2.pptx e ThanOS_Completo.pptx).
//
//   node validar_slides.mjs
//
// Lê cada .pptx (não o código do gerador) e cruza com mapa_slides.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CHEGADAS, CONVERSA, CONVERSA_SO2, ETAPAS, GEMS, LIMITES } from './dados.mjs';

const require = createRequire(import.meta.url);
const JSZip = require('jszip');

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');
const mapa = JSON.parse(fs.readFileSync(path.join(TOOLS, 'mapa_slides.json'), 'utf8'));
const CONVERSAS = { so1: CONVERSA, so2: CONVERSA_SO2, completo: CONVERSA };

const desfaz = (t) => t.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
let totalOk = 0;
let totalFalhas = 0;

async function validar(v) {
  const falhas = [];
  const ok = [];
  const confere = (cond, msg) => (cond ? ok : falhas).push(msg);

  const zip = await JSZip.loadAsync(fs.readFileSync(path.resolve(ROOT, v.arquivo)));
  const ler = (n) => zip.file(n).async('string');

  // Ordem dos slides
  const pres = await ler('ppt/presentation.xml');
  const presRels = await ler('ppt/_rels/presentation.xml.rels');
  const ridAlvo = {};
  for (const m of presRels.matchAll(/<Relationship [^>]*>/g)) {
    ridAlvo[m[0].match(/Id="([^"]+)"/)[1]] = m[0].match(/Target="([^"]+)"/)[1];
  }
  const ordem = [...pres.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)].map((m) => path.posix.basename(ridAlvo[m[1]]));
  const numDoArquivo = Object.fromEntries(ordem.map((f, i) => [f, i + 1]));
  confere(ordem.length === v.total, `número de slides: ${ordem.length} (esperado ${v.total})`);

  // Links e textos de cada slide
  const slides = [];
  for (const [i, arq] of ordem.entries()) {
    const num = i + 1;
    const xml = await ler(`ppt/slides/${arq}`);
    const rels = await ler(`ppt/slides/_rels/${arq}.rels`);
    const relAlvo = {};
    for (const m of rels.matchAll(/<Relationship [^>]*>/g)) {
      relAlvo[m[0].match(/Id="([^"]+)"/)[1]] = m[0].match(/Target="([^"]+)"/)[1];
    }
    const links = [];
    let quebrados = 0;
    for (const m of xml.matchAll(/<p:cNvPr [^>]*>\s*(<a:hlinkClick [^>]*\/>)/g)) {
      const h = m[1];
      const action = (h.match(/action="([^"]+)"/) || [])[1];
      const rid = (h.match(/r:id="([^"]+)"/) || [])[1];
      const alvo = rid ? numDoArquivo[path.posix.basename(relAlvo[rid] || '')] : undefined;
      if (action !== 'ppaction://hlinksldjump' || !alvo) quebrados++;
      else links.push(alvo);
    }
    const objetos = (xml.match(/<p:cNvPr /g) || []).length - 1; // menos o grupo raiz
    const textos = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => desfaz(m[1]));
    const linksDeTrecho = (xml.match(/<a:rPr[^>]*>(?:(?!<\/a:rPr>)[\s\S])*<a:hlinkClick/g) || []).length;
    const descrs = [...xml.matchAll(/descr="([^"]*)"/g)].map((m) => m[1]);
    slides.push({ num, links, quebrados, objetos, textos, linksDeTrecho, descrs, info: v.slides[i] });
  }

  const S = (n) => slides[n - 1];
  const saidas = (n) => new Set(S(n).links.filter((x) => x !== n));
  const numDe = (key) => (v.slides.find((s) => s.key === key) || {}).num;

  // 1. Links válidos, só no nível da forma, e em todo objeto (clicar no fundo não avança)
  confere(slides.every((s) => s.quebrados === 0), 'todo link aponta para um slide existente');
  confere(slides.every((s) => s.linksDeTrecho === 0), 'nenhum link em trecho de texto (só na forma)');
  const semLink = slides.filter((s) => s.links.length + s.quebrados !== s.objetos);
  confere(semLink.length === 0, `todo objeto tem link${semLink.length ? ` — faltam em: ${semLink.map((s) => s.num).join(', ')}` : ''}`);

  // 2. Nenhum beco sem saída e tudo alcançável a partir da capa
  const becos = slides.filter((s) => saidas(s.num).size === 0);
  confere(becos.length === 0, `nenhum slide sem saída${becos.length ? ` — ${becos.map((s) => s.num).join(', ')}` : ''}`);
  const visto = new Set([1]);
  const fila = [1];
  while (fila.length) {
    const n = fila.shift();
    for (const a of saidas(n)) if (!visto.has(a)) { visto.add(a); fila.push(a); }
  }
  confere(visto.size === slides.length, `todos os ${slides.length} slides alcançáveis a partir da capa (alcançados: ${visto.size})`);

  // 3. Etapas da versão: 1 carta certa e 3 erradas que voltam; o encaixe avança
  const etapasDaVersao = ETAPAS.filter((et) => v.gemas.includes(et.gid));
  confere(v.etapas.length === etapasDaVersao.length, `etapas nesta versão: ${v.etapas.length} (esperado ${etapasDaVersao.length})`);
  if (etapasDaVersao.length) {
    let etapasOk = 0;
    for (const et of v.etapas) {
      const out = saidas(et.slide);
      const esperado = new Set([et.ok, ...et.erros]);
      const bate = out.size === 4 && [...esperado].every((x) => out.has(x)) && new Set(et.erros).size === 3;
      const errosVoltam = et.erros.every((e) => {
        const o = saidas(e);
        return o.size === 1 && o.has(et.slide) && S(e).info.etapa === et.n;
      });
      const prox = v.slides[et.ok - 1].next;
      const okAvanca = saidas(et.ok).size === 1 && saidas(et.ok).has(prox);
      if (bate && errosVoltam && okAvanca) etapasOk++;
      else falhas.push(`etapa ${et.n}: cartas=${[...out]} esperado=${[...esperado]} errosVoltam=${errosVoltam} okAvanca=${okAvanca}`);
    }
    confere(etapasOk === etapasDaVersao.length, `${etapasDaVersao.length} etapas com 4 cartas (1 certa, 3 erros que voltam à etapa): ${etapasOk}/${etapasDaVersao.length}`);
    const letras = v.etapas.reduce((a, e) => ((a[e.certa] = (a[e.certa] || 0) + 1), a), {});
    confere(Object.keys(letras).length === 4, `respostas certas distribuídas: ${JSON.stringify(letras)}`);
  }

  // 4. Caminho certo da capa até o fim da versão, usando só links que existem no slide
  const caminho = [];
  let atual = 1;
  const passos = new Set();
  while (atual && !passos.has(atual)) {
    passos.add(atual);
    caminho.push(atual);
    const prox = S(atual).info.next;
    if (!prox) break;
    if (!saidas(atual).has(prox)) {
      falhas.push(`caminho: slide ${atual} (${S(atual).info.key}) não tem link para ${prox}`);
      break;
    }
    atual = prox;
  }
  const chaves = caminho.map((n) => S(n).info.key);
  const etapasNoCaminho = chaves.filter((k) => /^e\d\d$/.test(k)).map((k) => Number(k.slice(1)));
  const joiasNoCaminho = chaves.filter((k) => k.startsWith('conquista_')).map((k) => k.slice(10));
  const saloesNoCaminho = chaves.filter((k) => k.startsWith('salao_')).map((k) => Number(k.slice(6)));
  const saloesEsperados = [];
  for (let k = v.inicio; k <= v.fimSalao; k++) saloesEsperados.push(k);
  confere(chaves[chaves.length - 1] === v.fim, `caminho certo termina em "${v.fim}" (${caminho.length} slides)`);
  confere(etapasNoCaminho.join() === etapasDaVersao.map((et) => et.n).join(), `caminho certo passa pelas etapas da versão em ordem (${etapasNoCaminho.length})`);
  confere(joiasNoCaminho.join() === v.gemas.join(), `caminho certo conquista as joias na ordem: ${joiasNoCaminho.join(' → ')}`);
  confere(saloesNoCaminho.join() === saloesEsperados.join(), `caminho certo passa pelos salões de ${v.inicio} a ${v.fimSalao} joias`);
  confere(caminho.every((n, i) => n === i + 1), 'a seta do teclado segue o caminho certo (erros ficam no apêndice)');
  if (v.fim === 'conclusao') {
    confere(chaves.indexOf('epilogo') === chaves.indexOf('estalo') + 1 && chaves.includes('estalo'), 'caminho certo passa pelo epílogo logo depois do estalo');
  } else {
    confere(!chaves.includes('estalo') && chaves.indexOf('fim_so1') === chaves.indexOf(`salao_${v.fimSalao}`) + 1, 'a versão termina no "SO 1 concluído", sem estalo');
  }

  // 5. Conversa de abertura da versão
  const conversa = CONVERSAS[v.versao];
  const salaoInicial = numDe(`salao_${v.inicio}`);
  const cenas = slides.filter((s) => s.info.tipo === 'conversa');
  const cenasOk = cenas.length === conversa.length
    && chaves.slice(1, 1 + conversa.length).every((k, i) => k === `conversa_${i + 1}`)
    && cenas.every((s, i) => s.textos.includes(conversa[i].fala) && saidas(s.num).has(salaoInicial));
  confere(cenasOk, `conversa de abertura com ${conversa.length} falas logo após a capa, cada uma com saída para o Salão`);

  // 6. Cenas de chegada das alas da versão: altar aceso → falas → abertura da ala
  const comChegada = v.gemas.filter((gid) => CHEGADAS[gid]);
  if (comChegada.length) {
    const ruins = [];
    for (const gid of comChegada) {
      const c = CHEGADAS[gid];
      const salao = numDe(`salao_${GEMS[gid].ordem}`);
      const intro = numDe(`intro_${gid}`);
      const primeira = numDe(`chegada_${gid}_1`);
      let bom = Boolean(primeira) && saidas(salao).has(primeira) && !saidas(salao).has(intro);
      c.falas.forEach((f, i) => {
        const n = numDe(`chegada_${gid}_${i + 1}`);
        const prox = i === c.falas.length - 1 ? intro : numDe(`chegada_${gid}_${i + 2}`);
        if (!n || !S(n).textos.includes(f.fala) || !saidas(n).has(prox) || !saidas(n).has(intro)) bom = false;
      });
      if (!bom) ruins.push(gid);
    }
    confere(ruins.length === 0, `cenas de chegada (${comChegada.join(', ')})${ruins.length ? ` — problema em ${ruins.join(', ')}` : ''}`);
  }

  // 7. Mapa das joias: só as alas desta versão têm link
  const mapaNum = numDe('mapa');
  const esperadoMapa = new Set([numDe('capa'), ...v.gemas.map((gid) => numDe(GEMS[gid].so1 ? `intro_${gid}` : `previa_${gid}`))]);
  const linksMapa = saidas(mapaNum);
  confere(linksMapa.size === esperadoMapa.size && [...esperadoMapa].every((n) => linksMapa.has(n)), 'Mapa das joias leva só às alas desta versão');

  // 8. Etapas: retrato, fala do mentor e as 4 alternativas da história no slide
  if (etapasDaVersao.length) {
    let comRetrato = 0;
    let comFala = 0;
    let comRotulos = 0;
    for (const et of etapasDaVersao) {
      const info = v.etapas.find((e) => e.n === et.n);
      const sl = S(info.slide);
      if (sl.descrs.includes(`Retrato de ${et.mentor}`)) comRetrato++;
      else falhas.push(`etapa ${et.n}: sem o retrato de ${et.mentor}`);
      if (sl.textos.includes(et.fala) && sl.textos.includes(et.mentor.toUpperCase())) comFala++;
      else falhas.push(`etapa ${et.n}: fala de ${et.mentor} não está no slide ${info.slide}`);
      if (et.opcoes.every((op) => sl.textos.includes(op.label))) comRotulos++;
      else falhas.push(`etapa ${et.n}: alguma alternativa da história não está no slide ${info.slide}`);
    }
    const n = etapasDaVersao.length;
    confere(comRetrato === n && comFala === n && comRotulos === n, `as ${n} etapas mostram retrato, fala do mentor e as 4 alternativas da história`);
  }

  // 9. Regras de texto e metadados
  const caminhosLocais = slides.filter((s) => s.descrs.some((d) => /[a-z]:[\\/]|\\/i.test(d)));
  confere(caminhosLocais.length === 0, 'nenhum caminho de arquivo local no texto alternativo das imagens');
  const core = await ler('docProps/core.xml');
  confere(!/@|Users/i.test(core), 'metadados sem e-mail ou pasta de usuário');

  console.log(`\n== ${v.titulo} (${v.arquivo}) ==`);
  for (const m of ok) console.log(`  ok   ${m}`);
  for (const m of falhas) console.log(`  FALHA ${m}`);
  totalOk += ok.length;
  totalFalhas += falhas.length;
}

for (const v of mapa.versoes) await validar(v);

// Textos (valem para as três versões)
const falhasTexto = [];
const cenasTodas = [...CONVERSA, ...CONVERSA_SO2, ...Object.values(CHEGADAS).flatMap((c) => c.falas)];
if (cenasTodas.some((f) => f.fala.length > LIMITES.cena)) falhasTexto.push(`fala de cena com mais de ${LIMITES.cena} caracteres`);
if (ETAPAS.some((et) => et.fala.length > LIMITES.fala)) falhasTexto.push(`fala de etapa com mais de ${LIMITES.fala} caracteres`);
if (ETAPAS.some((et) => et.opcoes.some((op) => op.label.length > LIMITES.opcao))) falhasTexto.push(`alternativa com mais de ${LIMITES.opcao} caracteres`);
console.log('\n== Textos do roteiro ==');
if (falhasTexto.length) for (const m of falhasTexto) console.log(`  FALHA ${m}`);
else console.log(`  ok   falas e alternativas dentro dos limites (cenas ${LIMITES.cena}, etapas ${LIMITES.fala}, alternativas ${LIMITES.opcao})`);
totalFalhas += falhasTexto.length;
totalOk += falhasTexto.length ? 0 : 1;

console.log(totalFalhas ? `\n${totalFalhas} falha(s).` : `\nTudo certo: ${totalOk} verificações nas ${mapa.versoes.length} versões.`);
process.exit(totalFalhas ? 1 : 0);
