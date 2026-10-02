// Teste do Assistente Tastefy: desejo (o que quer comer), companhia e texto livre.
// Uso: cd pesquisa && bun teste_tastefy.js
globalThis.window = globalThis;
require('../site/js/menu-data.js');
const A = require('../site/js/assistente.js');
const menu = window.N1.categories.flatMap(c => c.items);
const erros = [];
const POOL = { frango: ['combo-p', 'combo-m', 'combo-g', 'combo-gg', 'bites-p', 'bites-m', 'combinho'], burger: ['trio', '4-em-n1', 'dupla', 'dupla-bites', '3-burgers', 'super-combo'], belisco: ['bites-p', 'bites-m', 'batata', 'combinho', 'combo-p'] };

/* 1) interpretar: frases reais → o que o assistente entende */
const casos = [
  ['frango pra ver o jogo com 4 amigos', { desejo: 0, quem: 2, pessoas: 3, ocasiao: 0 }],
  ['quero um hambúrguer', { desejo: 1 }],
  ['to sozinho e com muita fome', { quem: 0, pessoas: 0, fome: 2 }],
  ['jantar com minha namorada, algo leve', { quem: 1, pessoas: 1, fome: 0 }],
  ['somos 8 da família, prato feito', { desejo: 3, quem: 3, pessoas: 4, grande: 3 }],
  ['uma porção de batata pra beliscar', { desejo: 2, fome: 0 }],
  ['quero pizza', { fora: 'pizza' }],
  ['sushi pra 3', { fora: 'sushi', pessoas: 2 }],
  ['me surpreende', { desejo: 5 }],
  ['almoço com a turma do trabalho, uns 12', { quem: 4, ocasiao: 2, pessoas: 4, grande: 7 }],
  ['serie na netflix com 2 amigos e um docinho', { desejo: 4, quem: 2, pessoas: 1, ocasiao: 1 }],
  ['to com fome as 20h', {}],
  ['bom dia', {}]
];
for (const [txt, esp] of casos) {
  const r = A.interpretar(txt);
  for (const k of Object.keys(esp)) if (r[k] !== esp[k]) erros.push(`interpretar("${txt}"): ${k} = ${r[k]} (esperado ${esp[k]})`);
  for (const k of Object.keys(r)) if (!(k in esp)) erros.push(`interpretar("${txt}"): entendeu a mais: ${k} = ${r[k]}`);
}

/* 2) plano: todas as combinações de desejo × companhia × fome × ocasião × hora */
const grupos = [0, 1, 2, 3].map(i => ({ pessoas: i })).concat(A.GRANDE.map((_, j) => ({ pessoas: 4, grande: j })));
let total = 0, fallback = 0, vazios = 0;
const por = {};
A.DESEJO.forEach((d, di) => grupos.forEach(g => A.FOME.forEach((_, fi) => A.OCASIAO.forEach((_, oi) => [12, 20].forEach(hora => A.QUEM.forEach((q, qi) => {
  if (q.n != null && q.n !== g.pessoas) return; // solo e casal só combinam com 1 e 2 pessoas
  const resp = Object.assign({ desejo: di, quem: qi, fome: fi, ocasiao: oi, hora }, g); total++;
  let pl; try { pl = A.plano(resp, menu); } catch (e) { erros.push(`desejo=${d.id} quem=${q.id} ${JSON.stringify(g)} fome=${fi}: ERRO ${e.message}`); return; }
  if (!pl.rec || !pl.rec.ids.length) { vazios++; erros.push(`desejo=${d.id} ${JSON.stringify(g)}: sem recomendação`); return; }
  const k = d.id; por[k] = por[k] || { ok: 0, fb: 0 };
  const pool = POOL[d.id], almoco = pl.ocasiao === 'almoco';
  if (pool && !almoco) {
    const dentro = o => o.ids.every(id => pool.includes(id));
    const teveNota = /não achei só/.test(pl.intro);
    if (!dentro(pl.rec) && !teveNota) erros.push(`desejo=${d.id} ${JSON.stringify(g)} fome=${fi}: recomendou fora do tipo (${pl.rec.ids}) sem avisar`);
    if (teveNota) { fallback++; por[k].fb++; } else por[k].ok++;
    for (const op of pl.opcoes) if (!teveNota && !dentro(op.o)) erros.push(`desejo=${d.id} ${JSON.stringify(g)}: opção fora do tipo (${op.o.ids})`);
  } else por[k].ok++;
  if (d.id === 'prato' && !/almoço|Prato feito|combos/.test(pl.intro + pl.rec.nome)) erros.push(`prato: sem prato feito nem aviso de horário (${pl.rec.nome})`);
  if (d.id === 'doce') { const ex = pl.extra(pl.rec); if (!/Brigadeiro|brigadeiro/.test(ex.texto + ex.nome) && pl.rec.doces < pl.n) erros.push(`doce: sugeriu ${ex.tipo} em vez de doce (${pl.rec.nome})`); }
  if (!/^[A-ZÀ-Úa-zà-ú]/.test(pl.intro)) erros.push('intro estranha: ' + pl.intro);
}))))));
console.log(total + ' combinações · fallback com aviso: ' + fallback + ' · ' + JSON.stringify(por));
console.log(erros.length ? erros.length + ' problemas:\n' + [...new Set(erros)].slice(0, 25).join('\n') : '0 problemas');
