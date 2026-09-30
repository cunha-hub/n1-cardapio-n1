// Efeito da precificação CMV 28% sobre o mix real de vendas N1 (BI Tastefy, iFood, jul–set/26).
const d = require('./precos_cmv28.json'); const P = Object.fromEntries(d.itens.map(o => [o.id, o]));
// [id novo, qtd jul–set, preço médio atual (BI)]
const mix = [['dupla', 32821, 49.45], ['combo-m', 12536, 78.68], ['bites-m', 11644, 54.41], ['combo-p', 10722, 55.09], ['combo-g', 3878, 131.72],
  ['trio', 9085 + 8612, 44.3], ['bites-p', 11453, 31.99], ['super-combo', 4856, 70.55], ['dupla-bites', 5156 + 4364, 57.3], ['caixa-g', 1868, 94.11],
  ['caixa-m', 2897, 59.84], ['combinho', 5075, 33.0], ['3-burgers', 4257, 72.6], ['combo-gg', 743, 182.22], ['caixa-p', 3531, 34.95],
  ['salada', 3836, 29.19], ['4-em-n1', 2327, 46.68], ['classic', 2519 + 1404, 27.4], ['bites-ind', 3812, 13.64], ['molho', 4558, 8.05],
  ['coca', 2940 + 2843, 12.1], ['brigadeiro', 799, 8.19], ['tradicional', 1733, 34.62], ['onion', 927, 36], ['garlic', 1277, 35.82], ['bbq', 476, 31]];
let q = 0, r0 = 0, r1 = 0, c = 0;
for (const [id, n, p0] of mix) { const o = P[id]; q += n; r0 += n * p0; r1 += n * o.preco; c += n * o.custo; }
console.log(JSON.stringify({ unidades: q, receitaAtual: Math.round(r0), receitaNova: Math.round(r1), deltaPct: +((r1 / r0 - 1) * 100).toFixed(1),
  cmvAtual: +(c / r0 * 100).toFixed(1), cmvNovo: +(c / r1 * 100).toFixed(1), margemAtual: Math.round(r0 - c), margemNova: Math.round(r1 - c) }));
