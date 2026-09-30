// Projeção com cardápio CMV 28% (base set/2026 BI Tastefy). Premissas de adesão conservadoras.
const base = { visitas: 517910, pedidos: 60850, gmv: 3587464, ticket: 58.96, cmvHoje: 28.8, cmvNovo: 27.7, conv: 11.75 };
const repricing = +(base.ticket * 0.041).toFixed(2); // +4,1% no mix real (impacto_mix.js)
const pontes = [
  ['Novos preços no mix real (CMV 28%)', repricing, 'mesmo mix de jul–set, preços novos'],
  ['Molho extra', +(0.12 * 6.9).toFixed(2), '12% dos pedidos × R$ 6,90'],
  ['Bebida com preço de combo', +(0.06 * 11.9).toFixed(2), '+6 p.p. dos pedidos × R$ 11,90'],
  ['Troca premium (Onion/Cheddar)', +(0.06 * 8.9).toFixed(2), '6% dos pedidos × R$ 8,90'],
  ['Doce no fim do pedido', +(0.05 * 7.9).toFixed(2), '+5 p.p. dos pedidos × R$ 7,90'],
];
const up = pontes.reduce((s, p) => s + p[1], 0), ticket = +(base.ticket + up).toFixed(2);
const gmv = Math.round(base.pedidos * ticket);
const mb0 = base.gmv * (1 - base.cmvHoje / 100), mb1 = gmv * (1 - base.cmvNovo / 100);
const pedUp = Math.round(base.visitas * 0.1255), gmvUp = Math.round(pedUp * ticket);
console.log(JSON.stringify({ pontes, up: +up.toFixed(2), ticket, gmv, deltaGmv: gmv - base.gmv, deltaPct: +((gmv / base.gmv - 1) * 100).toFixed(1),
  margemHoje: Math.round(mb0), margemNova: Math.round(mb1), deltaMargem: Math.round(mb1 - mb0), upside: { pedidos: pedUp, gmv: gmvUp, delta: gmvUp - base.gmv } }, null, 1));
