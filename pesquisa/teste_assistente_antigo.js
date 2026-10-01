// Mesmas regras aplicadas à tabela antiga do Assistente (para comparação).
globalThis.window = globalThis;
require('../site/js/menu-data.js');
const A = require('../site/js/assistente.js');
const menu = window.N1.categories.flatMap(c => c.items), by = id => menu.find(i => i.id === id);
const REC = { 1: { b: ['combinho', '4-em-n1', 'combo-p'], n: ['trio', '4-em-n1', 'combo-p'], c: ['4-em-n1', 'combo-p', 'combo-m'] },
  2: { b: ['dupla', 'dupla-bites', 'combo-m'], n: ['dupla-bites', 'combo-m', 'super-combo'], c: ['combo-m', 'super-combo', 'combo-g'] },
  3: { b: ['3-burgers', 'combo-m', 'combo-g'], n: ['combo-m', 'combo-g', 'combo-gg'], c: ['combo-m', 'combo-g', 'combo-gg'] },
  5: { b: ['combo-g', 'combo-gg', 'combo-gg'], n: ['combo-g', 'combo-gg', 'combo-gg'], c: ['combo-g', 'combo-gg', 'combo-gg'] } };
const P = [1, 2, 3, 5], F = ['b', 'n', 'c'];
const tipos = {}; let casos = 0, comErro = 0;
A.GRUPO.forEach((g, gi) => A.FOME.forEach((f, fi) => A.OCASIAO.forEach((o, oi) => {
  const ids = (oi === 2 && gi === 0) ? ['tradicional', 'parmegiana', 'combo-p'] : REC[P[gi]][F[fi]];
  const [e, r, t] = ids; const need = g.n * f.f; const errs = [];
  if (A.CAP[r].cap < need) errs.push('recomendado não alimenta o grupo');
  if (new Set(ids).size < 3) errs.push('opções repetidas');
  if (!(by(t).price > by(r).price && by(r).price > by(e).price)) errs.push('preços fora de ordem');
  if (g.n === 1 && ids.some(id => A.CAP[id].cap > 1.5)) errs.push('combo de grupo para 1 pessoa');
  if (oi === 0 && ['super-combo', 'trio', '4-em-n1', 'combinho'].includes(r)) errs.push('oferece Coca que já vem no combo');
  casos++; if (errs.length) comErro++; errs.forEach(x => tipos[x] = (tipos[x] || 0) + 1);
})));
console.log(`Tabela antiga: ${comErro} de ${casos} conversas com pelo menos 1 incoerência`); console.log(tipos);
