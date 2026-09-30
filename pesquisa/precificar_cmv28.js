// Precificação do cardápio mestre N1 com CMV-teto de 28%.
// Custos: planilha "CMV 2026 - NOVA OPERAÇÃO", aba "Precificação N1" (corte mais caro), exportada em 30/09/2026.
// Regra: preço = menor valor terminado em ,90 com (custo + embalagem) / preço <= 28%.
// Uso: bun pesquisa/precificar_cmv28.js
const TETO = 0.28;
const C = { // custo do produto (R$)
  bbq: 5.97, burger: 6.24, salada: 6.67, garlic: 7.58, bbc: 7.71, onion: 7.48,
  bitesInd: 3.07, bitesP: 7.65, bitesM: 14.35, caixaP: 8.17, caixaM: 15.38, caixaG: 25.20,
  batataInd: 2.02, batataSuper: 6.31, aipimInd: 1.71, aipimSuper: 5.39, ringsInd: 2.62, ringsSuper: 8.56,
  cheddarSuper: 9.15, pureSuper: 3.18, pureMega: 4.54, saladaSide: 3.57,
  molho: 1.87, molhoCheddar: 2.33, brigadeiro: 2.02, churros: 2.63, coca: 3.32,
  tradicional: 8.38, parmegiana: 8.08, fritoSalada: 8.09, estrogonofe: 8.01,
  comboP: 16.40, comboM: 23.57, comboG: 40.61, comboGG: 57.87,
};
const K = { p: 0.78, m: 1.00, g: 1.64, prato: 0.32, bebida: 0.32, none: 0 }; // embalagem kraft
const price90 = cost => { let p = Math.ceil(cost / TETO) - 0.10; if (p * TETO < cost) p += 1; while ((p - 1) * TETO >= cost && p - 1 > 0) p -= 1; return +p.toFixed(2); };
const cmv = (cost, p) => +(cost / p * 100).toFixed(1);

// hoje = preço atual no iFood N1 Vitória (30/09/2026), para comparação
const items = [
  // id, nome, custo, embalagem, preço hoje iFood, preço atual planilha, componentes para "de" (preço avulso somado)
  ['combo-p', 'Combo P · Caixa P + acomp. Super + molho', C.comboP, 'm', 54.90, 55.90, ['caixa-p', 'batata-super', 'molho']],
  ['combo-m', 'Combo M · Caixa M + acomp. Super + molho', C.comboM, 'm', 79.90, 79.90, ['caixa-m', 'batata-super', 'molho']],
  ['combo-g', 'Combo G · Caixa G + 2 acomp. + 2 molhos', C.comboG, 'm', 132.90, 139.90, ['caixa-g', 'batata-super', 'batata-super', 'molho', 'molho']],
  ['combo-gg', 'Combo GG · Caixa G + Caixa M + 2 acomp. + 3 molhos', C.comboGG, 'g', 189.90, 219.90, ['caixa-g', 'caixa-m', 'batata-super', 'batata-super', 'molho', 'molho', 'molho']],
  ['caixa-p', 'Caixa P · Cortes clássicos', C.caixaP, 'p', 29.90, 31.90],
  ['caixa-m', 'Caixa M · Cortes clássicos', C.caixaM, 'p', 54.90, 56.90],
  ['caixa-g', 'Caixa G · Cortes clássicos', C.caixaG, 'm', 84.90, 92.90],
  ['bites-ind', 'Chicken Bites Individual', C.bitesInd, 'none', 9.99, 9.90],
  ['bites-p', 'Chicken Bites P', C.bitesP, 'p', 26.90, 28.90],
  ['bites-m', 'Chicken Bites M', C.bitesM, 'p', 49.90, 52.90],
  ['classic', 'Chicken Burger', C.burger, 'p', 29.90, 31.90],
  ['bbq', 'Chicken Barbecue', C.bbq, 'p', 29.90, 29.90],
  ['salada', 'Chicken Salada', C.salada, 'p', 32.90, 33.90],
  ['onion', 'Chicken Onion Burger', C.onion, 'p', 32.90, 38.90],
  ['garlic', 'Chicken Garlic Bacon', C.garlic, 'p', 32.90, 38.90],
  ['bbc', 'BBC · Barbecue, Bacon & Cheddar', C.bbc, 'p', 36.90, 39.90],
  ['dupla', 'Dupla N1 · 2 burgers clássicos', 2 * C.burger, 'p', 44.90, 49.90, ['classic', 'classic']],
  ['dupla-bites', 'Dupla N1 + Chicken Bites', 2 * C.burger + C.bitesInd, 'p', 52.90, null, ['classic', 'classic', 'bites-ind']],
  ['trio', 'Trio Burger N1 · burger + batata + Coca', C.burger + C.batataInd + C.coca, 'p', 44.90, 44.90, ['classic', 'batata-ind', 'coca']],
  ['4-em-n1', '4 em N1 · burger + batata + Coca + brigadeiro', C.burger + C.batataInd + C.coca + C.brigadeiro, 'p', 39.99, null, ['classic', 'batata-ind', 'coca', 'brigadeiro']],
  ['combinho', 'Combinho Chicken Bites + batata + Coca', C.bitesInd + C.batataInd + C.coca, 'p', 29.90, null, ['bites-ind', 'batata-ind', 'coca']],
  ['super-combo', 'Super Combo · 2 burgers + batata Super + 2 Cocas', 2 * C.burger + C.batataSuper + 2 * C.coca, 'm', 79.90, 89.90, ['classic', 'classic', 'batata-super', 'coca', 'coca']],
  ['3-burgers', 'Trinca N1 · 3 burgers clássicos', 3 * C.burger, 'm', 64.90, null, ['classic', 'classic', 'classic']],
  ['tradicional', 'Tradicional N1', C.tradicional, 'prato', 34.90, 38.90],
  ['parmegiana', 'Frango à Parmegiana N1', C.parmegiana, 'prato', 39.90, 38.90],
  ['frito-salada', 'Frango Frito com Salada N1', C.fritoSalada, 'prato', 34.90, 38.90],
  ['estrogonofe', 'Estrogonofe de Frango N1', C.estrogonofe, 'prato', 32.90, 33.90],
  ['batata-ind', 'Batata Frita Individual', C.batataInd, 'none', 11.90, 11.90],
  ['batata-super', 'Batata Frita Super', C.batataSuper, 'p', null, 34.90],
  ['aipim-ind', 'Aipim Frito Individual', C.aipimInd, 'none', 12.90, 12.90],
  ['rings-ind', 'Onion Rings Individual', C.ringsInd, 'none', 12.90, 12.90],
  ['molho', 'Maionese da casa (potinho)', C.molho, 'none', 6.49, 8.90],
  ['brigadeiro', 'Brigadeiro N1 de colher', C.brigadeiro, 'none', 7.90, 9.90],
  ['churros', 'Churros N1', C.churros, 'none', 10.90, 11.90],
  ['coca', 'Coca-Cola lata', C.coca, 'bebida', 7.90, 11.90],
];
const P = {};
const out = items.map(([id, nome, custo, emb, hoje, planilha, comp]) => {
  const total = custo + K[emb]; const preco = price90(total); P[id] = preco;
  return { id, nome, custo: +total.toFixed(2), preco, cmv: cmv(total, preco), hoje, cmvHoje: hoje ? cmv(total, hoje) : null, planilha, comp };
});
out.forEach(o => { if (o.comp) { o.de = +o.comp.reduce((s, c) => s + P[c], 0).toFixed(2); o.economia = +(o.de - o.preco).toFixed(2); } });

// complementos dentro do combo: só o custo do produto (a embalagem já está no combo)
const extra = (nome, custo) => { const p = price90(custo); return { nome, custo, preco: p, cmv: cmv(custo, p) }; };
const comp = [
  extra('Onion Rings no lugar da batata (Δ custo)', C.ringsSuper - C.batataSuper),
  extra('Cheddar & Bacon no lugar da batata (Δ custo)', C.cheddarSuper - C.batataSuper),
  extra('Purê Mega no lugar do Super (Δ custo)', C.pureMega - C.pureSuper),
  extra('+ Batata individual extra', C.batataInd),
  extra('+ Chicken Bites individual', C.bitesInd),
  extra('Molho extra', C.molho), extra('Molho Cheddar extra', C.molhoCheddar),
  extra('Coca-Cola lata no combo', C.coca),
  extra('Brigadeiro no combo', C.brigadeiro), extra('Churros no combo', C.churros),
  extra('Burger Salada no lugar do clássico (Δ)', C.salada - C.burger),
  extra('Burger Onion/Garlic no lugar do clássico (Δ)', C.garlic - C.burger),
  extra('Burger BBC no lugar do clássico (Δ)', C.bbc - C.burger),
];
console.log(JSON.stringify({ itens: out, complementos: comp }, null, 1));
