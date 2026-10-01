/* Assistente N1: lógica de recomendação (sem interface).
   Usada pelo site (window.N1Assist) e pelos testes (pesquisa/teste_assistente.js).
   Regra: cada item tem capacidade = quantas pessoas alimenta com fome normal.
   Necessidade = pessoas × fator da fome. O recomendado é o pedido mais barato que dá conta;
   "Mais em conta" é mais barato e cobre pelo menos 80%; "Completão" dá conta, custa ≥ 12% a mais e não exagera.
   A mesma quantidade de pessoas vale para comida, bebida, doce e preço por pessoa. */
(function (root) {
  const GRUPO = [
    { n: 1, label: 'Só eu', txt: 'Pra você' },
    { n: 2, label: '2', txt: 'Pra dois' },
    { n: 3, label: '3', txt: 'Pra três' },
    { n: 4, label: '4', txt: 'Pra quatro' },
    { n: null, label: '5 ou mais', grande: true }
  ];
  const GRANDE = [5, 6, 7, 8, 9, 10, 11, 12].map(n => ({ n, label: String(n), txt: 'Pra ' + n + ' pessoas' }))
    .concat([{ n: 15, label: '13 ou mais', txt: 'Pra galera grande (conto 15)' }]);
  const FOME = [
    { f: 0.75, label: 'Beliscar', txt: ' só pra beliscar' },
    { f: 1, label: 'Fome normal', txt: '' },
    { f: 1.35, label: 'Fome de campeão', txt: ' com fome de campeão' }
  ];
  const OCASIAO = [
    { id: 'jogo', label: 'Jogo 🏆', txt: ' no jogo' },
    { id: 'serie', label: 'Série/filme', txt: ' na série' },
    { id: 'almoco', label: 'Almoço', txt: ' no almoço' },
    { id: 'pular', label: 'Pular', txt: '' }
  ];
  // capacidade (pessoas com fome normal), bebidas/doces já inclusos, onde pode entrar
  const CAP = {
    combinho: { cap: 0.8, bebidas: 1, solo: 1 }, trio: { cap: 1, bebidas: 1, solo: 1 }, '4-em-n1': { cap: 1.15, bebidas: 1, doces: 1, solo: 1 },
    'combo-p': { cap: 1.5, solo: 1 },
    tradicional: { cap: 1.1, almoco: 1 }, parmegiana: { cap: 1.1, almoco: 1 }, 'frito-salada': { cap: 1.1, almoco: 1 },
    batata: { cap: 0.45 }, 'bites-p': { cap: 1.5, petisco: 1 }, 'bites-m': { cap: 2.6, petisco: 1 },
    dupla: { cap: 1.8, grupo: 1 }, 'dupla-bites': { cap: 2.2, grupo: 1 }, 'super-combo': { cap: 2.3, bebidas: 2, grupo: 1 },
    '3-burgers': { cap: 2.7, grupo: 1 }, 'combo-m': { cap: 2.5, grupo: 1, multi: 1 }, 'combo-g': { cap: 4.0, grupo: 1, multi: 1 }, 'combo-gg': { cap: 6.0, grupo: 1, multi: 1 }
  };
  const UPGRADE = { trio: '4-em-n1' }; // troca melhor que somar o extra
  const COCA = 11.9, COCA_AVULSA = 13.9, BRIG = 7.9, MOLHO = 6.9;
  const curto = n => n.split(' · ')[0];
  const r2 = v => Math.round(v * 100) / 100;
  const real = v => 'R$ ' + v.toFixed(2).replace('.', ',');

  function montar(menu, ids) { // pedido = lista de ids (com repetição)
    const by = id => menu.find(i => i.id === id);
    const cont = {}; ids.forEach(id => cont[id] = (cont[id] || 0) + 1);
    const nome = Object.keys(cont).map(id => (cont[id] > 1 ? cont[id] + '× ' : '') + curto(by(id).name)).join(' + ');
    const lim = id => { const g = (by(id).groups || []).find(x => x.id === 'bebida'); return g ? g.max : 0; };
    return { ids, nome, price: r2(ids.reduce((s, id) => s + by(id).price, 0)), cap: r2(ids.reduce((s, id) => s + CAP[id].cap, 0)),
      bebidas: ids.reduce((s, id) => s + (CAP[id].bebidas || 0), 0), doces: ids.reduce((s, id) => s + (CAP[id].doces || 0), 0),
      limBebida: ids.reduce((s, id) => s + lim(id), 0), img: by(ids[0]).img };
  }

  function candidatos(menu, n, fome, oc, need) {
    const k = Object.keys(CAP), L = [];
    if (oc === 'almoco') { // almoço: prato feito pra cada um (+ batata individual pra quem tá com fome de campeão)
      const pf = o => Object.assign(o, { nome: o.nome.replace(/(d+× )?Tradicional N1/, (m, q) => (q || (n > 1 ? n + '× ' : '')) + 'Prato feito N1' + (n > 1 ? ' (cada um escolhe o seu)' : ' (Tradicional, Parmegiana ou Frito com Salada)')) });
      L.push(Array(n).fill('tradicional')); L.push(Array(n).fill('tradicional').concat(Array(n).fill('batata')));
      return L.map(ids => pf(montar(menu, ids)));
    }
    if (n === 1) {
      k.filter(id => CAP[id].solo).forEach(id => L.push([id]));
    } else {
      k.filter(id => CAP[id].grupo || (fome === 0 && CAP[id].petisco)).forEach(id => L.push([id]));
      if (need > 4.2) { // combinações para grupos grandes (até 4 combos)
        const M = k.filter(id => CAP[id].multi);
        const gera = (pre, from, left) => { if (pre.length >= 2) L.push(pre.slice()); if (!left) return; for (let i = from; i < M.length; i++) { pre.push(M[i]); gera(pre, i, left - 1); pre.pop(); } };
        gera([], 0, 4);
      }
    }
    return L.map(ids => montar(menu, ids));
  }

  function plano(resp, menu) {
    const G0 = GRUPO[resp.pessoas], g = G0.grande ? GRANDE[resp.grande == null ? 0 : resp.grande] : G0;
    const fo = FOME[resp.fome];
    let oc = OCASIAO[resp.ocasiao], nota = '';
    const hora = resp.hora == null ? 12 : resp.hora;
    if (oc.id === 'almoco' && (hora < 11 || hora >= 15)) { nota = 'O almoço N1 sai das 11h às 15h, então agora te mostro os combos 😉 '; oc = OCASIAO[3]; }
    const n = g.n, need = r2(n * fo.f);
    const ops = candidatos(menu, n, resp.fome, oc.id, need).sort((a, b) => a.price - b.price || a.ids.length - b.ids.length || b.cap - a.cap);
    const rec = ops.find(o => o.cap >= need) || ops[ops.length - 1];
    const econ = ops.filter(o => o.price < rec.price && o.cap >= need * 0.8).sort((a, b) => b.cap - a.cap || a.price - b.price)[0] || null;
    const inteiro = c => Math.max(1, Math.floor(c + 0.25)); // 1,8 → 2 · 1,55 → 1 · 2,5 → 2
    const vale = o => inteiro(o.cap) > inteiro(rec.cap) || o.bebidas > rec.bebidas || o.doces > rec.doces;
    const top = ops.find(o => o.price >= rec.price * 1.12 && o.cap >= need && o.cap >= rec.cap && o.cap <= need * 1.6 && o.ids.length <= rec.ids.length + 1 && vale(o)) || null;
    const porPessoa = o => r2(o.price / n);             // mesmo divisor para todas as opções
    const alimenta = o => inteiro(o.cap); // em pessoas inteiras, sem inflar

    function extra(o) { // uma única sugestão, coerente com a ocasião e com o que já vem incluso
      const querBebida = oc.id === 'jogo' || oc.id === 'almoco' || oc.id === 'pular';
      const faltam = Math.max(0, n - o.bebidas);
      const q = Math.min(faltam, o.limBebida); // só latas a preço de combo (sem avulsas na sugestão)
      if (querBebida && q > 0) {
        const lata = k => ({ qtd: k, total: r2(k * COCA), nome: k + '× Coca-Cola lata' });
        const jaVem = o.bebidas ? 'Já vem ' + o.bebidas + (o.bebidas > 1 ? ' latas' : ' lata') + '. ' : '';
        const cabe = q < faltam ? ' (é o que cabe no preço de combo)' : '';
        const ini = oc.id === 'jogo' ? 'Dia de jogo pede Coca gelada! ' : oc.id === 'almoco' ? 'Pra acompanhar o almoço, ' : 'Pra não faltar bebida, ';
        const verbo = (oc.id === 'jogo' || o.bebidas) ? 'Incluo ' : 'incluo ';
        const botoes = [Object.assign({ label: q > 1 ? 'Bora, ' + q + ' latas' : 'Bora!' }, lata(q))];
        if (q >= 2) botoes.push(Object.assign({ label: 'Só ' + Math.ceil(q / 2) }, lata(Math.ceil(q / 2))));
        botoes.push({ label: 'Já tenho bebida', qtd: 0, total: 0, nome: '' });
        return Object.assign({ tipo: 'bebida', qtdCombo: q, qtdAvulsa: 0, botoes,
          texto: ini + jaVem + verbo + (q > 1 ? q + ' latas' : '1 lata') + cabe + ' por <b>+ ' + real(r2(q * COCA)) + '</b>?' }, lata(q));
      }
      const faltamDoce = Math.max(0, n - o.doces);
      if (faltamDoce > 0) {
        if (o.ids.length === 1 && UPGRADE[o.ids[0]]) {
          const up = montar(menu, [UPGRADE[o.ids[0]]]), dif = r2(up.price - o.price);
          return { tipo: 'troca', qtd: 1, total: dif, nome: 'troca pro ' + up.nome, troca: up,
            texto: 'Por <b>+ ' + real(dif) + '</b> eu troco pro ' + up.nome + ', que já vem com brigadeiro 😉 Bora?', botoes: [{ label: 'Bora, troca!', qtd: 1 }, { label: 'Não, valeu', qtd: 0 }] };
        }
        const q = faltamDoce, total = r2(q * BRIG);
        return { tipo: 'doce', qtd: q, total, nome: q + '× Brigadeiro N1',
          texto: (oc.id === 'serie' ? 'Série boa termina com doce. ' : '') + (q > 1 ? 'Um brigadeiro de colher pra cada um? São ' + q + ' por' : 'Um brigadeiro de colher pra fechar? Sai por') + ' <b>+ ' + real(total) + '</b>.', botoes: [{ label: 'Bora!', qtd: q, total, nome: q + '× Brigadeiro N1' }, { label: 'Não, valeu', qtd: 0, total: 0, nome: '' }] };
      }
      return { tipo: 'molho', qtd: 1, total: MOLHO, nome: '1× Molho extra', texto: 'Já vem bebida e doce. Quer um molho extra pra mergulhar? <b>+ ' + real(MOLHO) + '</b>.', botoes: [{ label: 'Bora!', qtd: 1, total: MOLHO, nome: '1× Molho extra' }, { label: 'Não, valeu', qtd: 0, total: 0, nome: '' }] };
    }
    const nOp = [top, rec, econ].filter(Boolean).length;
    const aberturas = [', fiz as contas e eu iria nisso:', ', eu iria nesse aqui:', nOp === 3 ? ', separei três caminhos:' : nOp === 2 ? ', separei dois caminhos:' : ', esse aqui resolve:'];
    const intro = nota + g.txt + fo.txt + oc.txt + aberturas[(resp.pessoas + resp.fome + resp.ocasiao) % 3];
    return { n, need, intro, rec, econ, top, porPessoa, alimenta, extra, ocasiao: oc.id,
      opcoes: [top && { o: top, papel: 'Completão' }, { o: rec, papel: 'O que eu levaria' }, econ && { o: econ, papel: 'Mais em conta' }].filter(Boolean) };
  }

  const api = { GRUPO, GRANDE, FOME, OCASIAO, CAP, plano, COCA, COCA_AVULSA, BRIG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.N1Assist = api;
})(typeof window !== 'undefined' ? window : globalThis);
