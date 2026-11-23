// Gera ROTEIRO.md (texto completo do jogo, para revisão do professor) a partir de
// roteiro.mjs + curriculo.mjs, com as mesmas letras dos slides.
//
//   node exportar_roteiro.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALAS, CHEGADAS, CONVERSA, CONVERSA_SO2, EPILOGO, FIM_SO1, ETAPAS, GEMS, ORDEM, PREMISSA, PREVIA_BLOCOS, SINTESE, SO2_PREVIEWS,
} from './dados.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(process.argv[2] || path.join(TOOLS, '..', 'ROTEIRO.md'));

const L = [];
const p = (t = '') => L.push(t);

p('# ThanOS — Roteiro do jogo');
p();
p('Texto completo da versão em slides, na ordem em que aparece no jogo. Gerado por `tools/exportar_roteiro.mjs` a partir de `tools/roteiro.mjs` (história) e `tools/curriculo.mjs` (conteúdo de SO). Para mudar algum texto, edite `roteiro.mjs` e gere de novo.');
p();
p('As letras das alternativas são as mesmas dos slides. **✓** marca a alternativa certa. Em cada uma, "Retorno" é a explicação que a bancada mostra ao jogador.');
p();
p('O jogo sai em três apresentações:');
p();
p('- `ThanOS_SO1.pptx`: Apresentação SO 1. Abertura, joias do Poder, do Tempo e do Espaço (as 25 etapas) e o slide "SO 1 concluído".');
p('- `ThanOS_SO2.pptx`: Apresentação SO 2. Abertura própria, joias da Realidade, da Alma e da Mente, estalo, epílogo e conclusão.');
p('- `ThanOS_Completo.pptx`: o jogo inteiro.');
p();
p('## Premissa');
p();
for (const t of PREMISSA) { p(t); p(); }
p('## Abertura: conversa entre Eitri e Thanos');
p();
p('Logo depois da capa, Eitri entrega a Manopla a Thanos e explica o jogo, uma fala por slide. O botão "Pular conversa" vai direto ao Salão.');
p();
for (const c of CONVERSA) { p(`**${c.quem}:** ${c.fala}`); p(); }
p('### Abertura da apresentação SO 2');
p();
p('Na apresentação SO 2, a conversa de abertura é outra: Thanos volta com as três joias de SO 1 já na Manopla.');
p();
for (const c of CONVERSA_SO2) { p(`**${c.quem}:** ${c.fala}`); p(); }

for (const gid of ORDEM) {
  const g = GEMS[gid];
  const ala = ALAS[gid];
  if (g.so1) {
    p(`## ${g.nome} — ${ala.lugar} (${g.modulo} · ${g.faixa})`);
    p();
    const chegada = CHEGADAS[gid];
    if (chegada) {
      p(`**Cena de chegada (${chegada.lugar})**, logo depois de clicar no altar aceso:`);
      p();
      for (const f of chegada.falas) { p(`> **${f.quem}:** ${f.fala}`); p('>'); }
      L.pop();
      p();
    }
    p(`**Mentor:** ${ala.mentor}`);
    p();
    p(ala.abertura);
    p();
    p(`> **Nos quadrinhos (${ala.anciao.nome}):** ${ala.anciao.texto}`);
    p();
    for (const et of ETAPAS.filter((e) => e.gid === gid)) {
      p(`### ${et.titulo}`);
      p();
      p(`**${et.mentor}:** ${et.fala}`);
      p();
      for (const op of et.opcoes) {
        p(`- **${op.letra})${op.certa ? ' ✓' : ''}** ${op.label}`);
        if (op.label !== op.tecnico) p(`  - Enunciado técnico: ${op.tecnico}`);
        p(`  - Retorno: ${op.feedback}`);
      }
      p();
      p(`**Nota de engenharia:** ${et.nota}`);
      p();
    }
  } else {
    const pv = SO2_PREVIEWS[gid];
    p(`## ${g.nome} — ${ala.lugar} (SO 2 · prévia e coleta demonstrativa)`);
    p();
    p(`**${pv.headline}** (${pv.range_label})`);
    p();
    for (const t of pv.topics) p(`- ${t}`);
    p();
    p(`> **Nos quadrinhos (${ala.anciao.nome}):** ${ala.anciao.texto}`);
    p();
    p(`**Em Ultimato (SO 2):** ${ala.ultimato}`);
    p();
    p(`Blocos da prévia: ${PREVIA_BLOCOS[gid].map(([t, e]) => `${t} (${e})`).join('; ')}.`);
    p();
    p(`Aviso no slide: ${pv.notice}`);
    p();
  }
}

p('## Final');
p();
p(`**Fim da apresentação SO 1 — ${FIM_SO1.titulo}:** ${FIM_SO1.texto}`);
p();
p(`*${FIM_SO1.gancho}*`);
p();
p('Na apresentação SO 2 e no jogo completo, o final é este:');
p();
p('**O estalo:** a manopla queimou e o salão virou cinza. O FCTos01 está completo.');
p();
p(`**Epílogo — ${EPILOGO.titulo}:** ${EPILOGO.texto}`);
p();
p(`*${EPILOGO.gancho}*`);
p();
p(`**Conclusão:** ${SINTESE}`);
p();
p('## Referências da história');
p();
p('- Filmes: *Guardiões da Galáxia* (2014), *Doutor Estranho* (2016), *Thor: Ragnarok* (2017), *Vingadores: Guerra Infinita* (2018) e *Vingadores: Ultimato* (2019).');
p('- Quadrinhos: *The Thanos Quest* (1990), em que Thanos toma uma gema de cada Ancião do Universo.');
p('- Todo o texto do jogo é autoral. O jogo usa nomes e acontecimentos como homenagem, sem imagens, logotipos ou falas transcritas da Marvel.');
p();

fs.writeFileSync(OUT, L.join('\n'), 'utf8');
console.log(`ok: ${OUT}`);
