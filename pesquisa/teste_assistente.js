// Teste do Assistente N1: roda todas as combinações de respostas e verifica coerência.
// Uso: cd pesquisa && bun teste_assistente.js   (gera testes_assistente.md)
globalThis.window = globalThis;
require('../site/js/menu-data.js');
const A = require('../site/js/assistente.js');
const fs = require('fs');
const menu = window.N1.categories.flatMap(c => c.items), by = id => menu.find(i => i.id === id);
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
const erros = [], linhas = [];
let n = 0;
// grupos: 1, 2, 3, 4 e as 4 faixas de "5 ou mais"
const grupos = [0, 1, 2, 3].map(i => ({ pessoas: i })).concat([0, 1, 2, 3].map(j => ({ pessoas: 4, grande: j })));
const casos = [];
grupos.forEach(gr => A.FOME.forEach((_, fome) => A.OCASIAO.forEach((_, ocasiao) => casos.push(Object.assign({ fome, ocasiao, hora: 20 }, gr, ocasiao === 2 ? { hora: 12 } : {})))));
casos.push({ pessoas: 0, fome: 1, ocasiao: 2, hora: 20 }, { pessoas: 3, fome: 1, ocasiao: 2, hora: 9 }); // almoço fora do horário

for (const c of casos) {
  n++;
  const p = A.plano(c, menu);
  const gl = c.pessoas === 4 ? A.GRANDE[c.grande].label : A.GRUPO[c.pessoas].label;
  const ctx = `[${gl} · ${A.FOME[c.fome].label} · ${A.OCASIAO[c.ocasiao].label}${c.ocasiao === 2 ? ' · ' + c.hora + 'h' : ''}]`;
  const chk = (ok, msg) => { if (!ok) erros.push(ctx + ' ' + msg); };
  const ids = p.opcoes.map(x => x.o.ids.slice().sort().join('+'));
  const pr = p.opcoes.map(x => x.o.price), pp = p.opcoes.map(x => p.porPessoa(x.o));
  // comida
  chk(p.rec.cap >= p.need, `recomendado (${p.rec.nome}) alimenta ~${p.rec.cap}, precisa ${p.need}`);
  chk(new Set(ids).size === ids.length, 'opções repetidas');
  chk(pr.every((v, i) => !i || pr[i - 1] > v), 'preços fora de ordem: ' + pr.join(' / '));
  chk(pp.every((v, i) => !i || pp[i - 1] > v), 'preço por pessoa não acompanha o preço: ' + pp.join(' / '));
  if (p.econ) chk(p.econ.cap >= p.need * 0.8, '"mais em conta" alimenta pouco');
  const nCam = (p.intro.match(/(três|dois) caminhos/) || [])[1]; if (nCam) chk((nCam === 'três' ? 3 : 2) === p.opcoes.length, 'texto fala em ' + nCam + ' caminhos, mas há ' + p.opcoes.length);
  chk(!/: [A-ZÁÉÍÓÚ][a-z]/.test(p.intro.replace(/isto:|aqui:|caminhos:|resolve:/g, '')) && !/[a-z], Incluo/.test(p.extra(p.rec).texto), 'maiúscula no meio da frase');
  if (p.n >= 5) chk(p.rec.ids.every(id => id !== '3-burgers'), 'grupo grande recebendo só burgers');
  if (p.top) { chk(p.top.price >= p.rec.price * 1.12, 'completão quase igual ao recomendado'); chk(p.top.cap >= p.rec.cap, 'completão alimenta menos que o recomendado'); chk(p.top.cap <= p.need * 1.6, 'completão exagerado'); }
  if (p.n === 1) chk(p.opcoes.every(x => x.o.cap <= 1.7), 'opção de grupo para 1 pessoa');
  if (p.n >= 3) chk(p.rec.cap >= p.n * 0.75, 'pouca comida para o grupo');
  if (c.ocasiao === 2 && c.hora >= 11 && c.hora < 15) chk(p.opcoes.every(x => x.o.ids.some(id => A.CAP[id].almoco)), 'almoço sem prato feito');
  if (c.ocasiao === 2 && (c.hora < 11 || c.hora >= 15)) chk(/11h às 15h/.test(p.intro) && p.ocasiao === 'pular', 'almoço fora do horário não avisado');
  // extra (para cada opção que o cliente pode escolher)
  for (const x of p.opcoes) {
    const o = x.o, ex = o && p.extra(o);
    if (ex.tipo === 'bebida') {
      chk(ex.qtd === p.n - o.bebidas, `latas (${ex.qtd}) ≠ pessoas (${p.n}) − inclusas (${o.bebidas})`);
      chk(ex.qtdCombo <= o.limBebida, 'mais latas no preço de combo do que o item aceita');
      chk(Math.abs(ex.total - (ex.qtdCombo * A.COCA + ex.qtdAvulsa * A.COCA_AVULSA)) < 0.005, 'conta das latas errada');
    }
    if (ex.tipo === 'doce') { chk(ex.qtd === p.n - o.doces, 'brigadeiros ≠ pessoas'); chk(!(o.ids.length === 1 && o.ids[0] === 'trio'), 'oferece brigadeiro avulso em vez do 4 em N1'); }
    if (ex.tipo === 'troca') chk(ex.troca.price <= o.price + A.BRIG, 'troca mais cara que somar o extra');
    chk(!(o.doces >= p.n && ex.tipo === 'doce'), 'oferece doce que já vem');
    chk(!/undefined|NaN|\d[.,]\d{3,}/.test(p.intro + ex.texto + o.nome), 'texto com erro ou decimal quebrado');
  }
  const ex = p.extra(p.rec), final = ex.tipo === 'troca' ? ex.troca.price : Math.round((p.rec.price + ex.total) * 100) / 100;
  linhas.push(`### ${n}. ${gl} · ${A.FOME[c.fome].label} · ${A.OCASIAO[c.ocasiao].label}${c.ocasiao === 2 ? ' (' + c.hora + 'h)' : ''}`,
    `- Necessidade: ${p.need} porções para ${p.n} pessoa(s)`, `- N1: "${p.intro}"`,
    ...p.opcoes.map(x => `  - ${x.papel === 'O que eu levaria' ? '**' : ''}${x.papel}: ${x.o.nome} — ${brl(x.o.price)} (alimenta ~${p.alimenta(x.o)} · ${brl(p.porPessoa(x.o))}/pessoa)${x.papel === 'O que eu levaria' ? '**' : ''}`),
    `- N1 (extra): "${ex.texto.replace(/<\/?b>/g, '')}"`,
    `- Fechamento: ${ex.tipo === 'troca' ? ex.troca.nome : p.rec.nome + ' + ' + ex.nome} = **${brl(final)}**`, '');
}
const md = `# Teste automático do Assistente N1\n\n${n} conversas testadas · ${erros.length} problema(s) encontrado(s) pelas regras automáticas.\n\nRegras: comida suficiente, opções diferentes e em ordem de preço, mesmo divisor no preço por pessoa, completão com degrau real, latas = pessoas − inclusas, limite de latas a preço de combo, troca pelo 4 em N1 em vez de brigadeiro avulso, almoço com prato feito (e aviso fora das 11h–15h), textos sem erro.\n\n` +
  (erros.length ? '## Problemas\n' + erros.map(e => '- ' + e).join('\n') + '\n\n' : '') + '## Conversas geradas\n\n' + linhas.join('\n');
fs.writeFileSync('testes_assistente.md', md);
console.log(`${n} conversas · ${erros.length} problemas`);
erros.slice(0, 40).forEach(e => console.log(' -', e));
