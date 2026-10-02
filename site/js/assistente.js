/* Assistente Tastefy: lógica de recomendação (sem interface). Hoje conectado ao cardápio da N1 Chicken.
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
  const GRANDE = [5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 30].map(n => ({ n, label: n > 12 ? '~' + n : String(n), txt: 'Pra ' + (n > 12 ? 'umas ' : '') + n + ' pessoas' }));
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
  // o que o cliente está afim de comer (primeira pergunta) e com quem vai comer
  const DESEJO = [
    { id: 'frango', label: 'Frango crocante \u{1f357}', txt: ' (frango crocante)', nome: 'de frango' },
    { id: 'burger', label: 'Hambúrguer \u{1f354}', txt: ' (burger)', nome: 'de burger' },
    { id: 'belisco', label: 'Algo pra beliscar \u{1f35f}', txt: ' (petiscos)', nome: 'de petisco' },
    { id: 'prato', label: 'Prato feito \u{1f35a}', txt: '', nome: 'de prato feito' },
    { id: 'doce', label: 'Um docinho \u{1f36b}', txt: ' (e um docinho no final)', nome: 'de doce' },
    { id: 'surpresa', label: 'Me surpreende ✨', txt: '', nome: '' }
  ];
  const QUEM = [
    { id: 'solo', label: 'Só eu \u{1f60c}', n: 0 },                                   // n = posição em GRUPO
    { id: 'casal', label: 'A dois \u{1f495}', n: 1, txt: 'Pra vocês dois, num clima de date' },
    { id: 'amigos', label: 'Com amigos \u{1f37b}', pre: 'Com os amigos' },
    { id: 'familia', label: 'Com a família \u{1f468}‍\u{1f469}‍\u{1f467}', pre: 'Com a família' },
    { id: 'trabalho', label: 'Turma do trabalho \u{1f4bc}', pre: 'Com a turma do trabalho' }
  ];
  // o que cada desejo aceita do cardápio
  const POOL = {
    frango: ['combo-p', 'combo-m', 'combo-g', 'combo-gg', 'bites-p', 'bites-m', 'combinho'],
    burger: ['trio', '4-em-n1', 'dupla', 'dupla-bites', '3-burgers', 'super-combo'],
    belisco: ['bites-p', 'bites-m', 'batata', 'combinho', 'combo-p']
  };
  const POOL_GRUPO = { burger: ['3-burgers', 'super-combo', 'dupla', 'dupla-bites'], belisco: ['bites-m', 'bites-p'] };
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

  function candBase(menu, n, fome, oc, need, petisco) {
    const k = Object.keys(CAP), L = [];
    if (oc === 'almoco') { // almoço: prato feito pra cada um (+ batata individual pra quem tá com fome de campeão)
      const pf = o => Object.assign(o, { prato: true, nome: o.nome.replace(/(\d+× )?Tradicional N1/, (m, q) => (q || '') + 'Prato feito N1' + (n > 1 ? ' (cada um escolhe o seu)' : ' (Tradicional, Parmegiana ou Frito com Salada)')) });
      L.push(Array(n).fill('tradicional')); L.push(Array(n).fill('tradicional').concat(Array(n).fill('batata')));
      return L.map(ids => pf(montar(menu, ids)));
    }
    if (n === 1) {
      k.filter(id => CAP[id].solo).forEach(id => L.push([id]));
    } else {
      const G = k.filter(id => CAP[id].grupo);
      G.forEach(id => L.push([id]));
      if (fome === 0 || petisco) k.filter(id => CAP[id].petisco).forEach(id => L.push([id]));
      // degraus intermediários (ex.: 3–4 pessoas): um combo + Chicken Bites pra completar
      // Bites completam combos de frango; burger + Bites só vale para beliscar
      G.filter(id => id !== 'dupla-bites' && (fome === 0 || CAP[id].multi)).forEach(id => ['bites-p', 'bites-m'].forEach(b => L.push([id, b])));
      if (need > 4) { // grupos grandes: combinações de combos de frango (até 8)
        const M = k.filter(id => CAP[id].multi);
        const gera = (pre, from, left) => { if (pre.length >= 2) L.push(pre.slice()); if (!left) return; for (let i = from; i < M.length; i++) { pre.push(M[i]); gera(pre, i, left - 1); pre.pop(); } };
        gera([], 0, 8);
      }
    }
    return L.map(ids => montar(menu, ids));
  }

  const combos = (pool, max) => { const out = []; const rec = (pre, from) => { if (pre.length) out.push(pre.slice()); if (pre.length >= max) return; for (let i = from; i < pool.length; i++) { pre.push(pool[i]); rec(pre, i); pre.pop(); } }; rec([], 0); return out; };
  /* aplica o desejo (frango, burger, petisco): só entram itens do tipo; grupos maiores ganham combinações do próprio tipo */
  function candidatos(menu, n, fome, oc, need, des) {
    const base = candBase(menu, n, fome, oc, need, des === 'belisco');
    if (!POOL[des] || oc === 'almoco') return { ops: base, pediu: false, filtrou: false };
    const ok = new Set(POOL[des]);
    let L = base.filter(o => o.ids.every(id => ok.has(id)));
    if (POOL_GRUPO[des] && n > 1 && need > 2.4) combos(POOL_GRUPO[des], des === 'burger' ? 6 : 8).forEach(ids => { if (ids.length > 1 || !L.some(o => o.ids.length === 1 && o.ids[0] === ids[0])) L.push(montar(menu, ids)); });
    return { ops: L.length ? L : base, pediu: true, filtrou: L.length > 0 };
  }

  function plano(resp, menu) {
    const G0 = GRUPO[resp.pessoas], g = G0.grande ? GRANDE[resp.grande == null ? 0 : resp.grande] : G0;
    const fo = FOME[resp.fome], D = resp.desejo == null ? null : DESEJO[resp.desejo], Q = resp.quem == null ? null : QUEM[resp.quem];
    let oc = D && D.id === 'prato' ? OCASIAO[2] : OCASIAO[resp.ocasiao == null ? 3 : resp.ocasiao], nota = '';
    const hora = resp.hora == null ? 12 : resp.hora;
    if (oc.id === 'almoco' && (hora < 11 || hora >= 15)) { nota = (D && D.id === 'prato' ? 'O prato feito N1 sai' : 'O almoço N1 sai') + ' das 11h às 15h, então agora te mostro os combos '; oc = OCASIAO[3]; }
    const n = g.n, need = r2(n * fo.f);
    // ordenação: preço + R$ 8 por caixa extra (menos embalagens é melhor); o preço exibido continua o real
    const custo = o => o.price + 8 * (o.ids.filter(id => CAP[id].multi || CAP[id].grupo).length - 1);
    const cand = candidatos(menu, n, resp.fome, oc.id, need, D && D.id);
    if (cand.pediu && !cand.filtrou) nota += 'Pra essa combinação eu não achei só ' + D.nome + ', então montei o que fecha melhor: ';
    const ops = cand.ops.sort((a, b) => custo(a) - custo(b) || b.cap - a.cap);
    const basta = need * (n <= 6 ? 0.97 : 1); // 97% da necessidade já resolve em grupos pequenos
    const rec = ops.find(o => o.cap >= basta) || ops[ops.length - 1];
    const econ = ops.filter(o => o.price <= rec.price * 0.92 && o.cap >= need * 0.8 && o.ids.length <= rec.ids.length + 1)
      .sort((a, b) => b.cap - a.cap || custo(a) - custo(b))[0] || null;
    // "alimenta" contado na fome escolhida (Chicken Bites P dá pra ~2 beliscando),
    // coerente com a necessidade: quem cobre mostra pelo menos n; quem não cobre mostra no máximo n − 1 ("fica justo")
    const cobre = o => o.cap >= basta - 1e-9;
    const inteiro = c => Math.max(1, Math.floor(c / fo.f + 0.4));
    const pessoasOpcao = o => cobre(o) ? Math.max(n, inteiro(o.cap)) : Math.max(1, Math.min(n - 1, inteiro(o.cap)));
    const vale = o => inteiro(o.cap) > inteiro(rec.cap) || o.bebidas > rec.bebidas || o.doces > rec.doces;
    const top = ops.find(o => o.price >= rec.price * 1.12 && o.price <= rec.price * 1.6 && o.cap >= need && o.cap >= rec.cap && o.cap <= need * 1.6 && o.ids.length <= rec.ids.length + 1 && vale(o)) || null;
    const porPessoa = o => r2(o.price / n);             // mesmo divisor para todas as opções
    const alimenta = o => pessoasOpcao(o); // pessoas inteiras, na fome escolhida
    const justo = o => !cobre(o);

    function extra(o) { // uma única sugestão, coerente com a ocasião e com o que já vem incluso
      const querDoce = !!(D && D.id === 'doce' && Math.max(0, n - o.doces) > 0);
      const querBebida = (oc.id === 'jogo' || oc.id === 'almoco' || oc.id === 'pular') && !querDoce;
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
            texto: 'Por <b>+ ' + real(dif) + '</b> eu troco pro ' + up.nome + ', que já vem com brigadeiro Bora?', botoes: [{ label: 'Bora, troca!', qtd: 1 }, { label: 'Não, valeu', qtd: 0 }] };
        }
        const q = faltamDoce, total = r2(q * BRIG);
        return { tipo: 'doce', qtd: q, total, nome: q + '× Brigadeiro N1',
          texto: (D && D.id === 'doce' ? 'Você queria um docinho, então fecha assim: ' : oc.id === 'serie' ? 'Série boa termina com doce. ' : '') + (q > 1 ? 'Um brigadeiro de colher pra cada um? São ' + q + ' por' : 'Um brigadeiro de colher pra fechar? Sai por') + ' <b>+ ' + real(total) + '</b>.', botoes: [{ label: 'Bora!', qtd: q, total, nome: q + '× Brigadeiro N1' }, { label: 'Não, valeu', qtd: 0, total: 0, nome: '' }] };
      }
      return { tipo: 'molho', qtd: 1, total: MOLHO, nome: '1× Molho extra', texto: 'Já vem bebida e doce. Quer um molho extra pra mergulhar? <b>+ ' + real(MOLHO) + '</b>.', botoes: [{ label: 'Bora!', qtd: 1, total: MOLHO, nome: '1× Molho extra' }, { label: 'Não, valeu', qtd: 0, total: 0, nome: '' }] };
    }
    const nOp = [top, rec, econ].filter(Boolean).length;
    const aberturas = [', fiz as contas e eu iria nisso:', ', eu iria nesse aqui:', nOp === 3 ? ', separei três caminhos:' : nOp === 2 ? ', separei dois caminhos:' : ', esse aqui resolve:'];
    const quemTxt = !Q ? g.txt : Q.txt ? Q.txt : Q.pre ? Q.pre + ', ' + g.txt.charAt(0).toLowerCase() + g.txt.slice(1) : g.txt;
    const intro = nota + quemTxt + fo.txt + (D ? D.txt : '') + oc.txt + aberturas[(resp.pessoas + resp.fome + (resp.ocasiao || 0)) % 3];
    return { n, need, intro, rec, econ, top, porPessoa, alimenta, justo, extra, ocasiao: oc.id, desejo: D && D.id,
      opcoes: [top && { o: top, papel: 'Completão' }, { o: rec, papel: 'O que eu levaria' }, econ && { o: econ, papel: 'Mais em conta' }].filter(Boolean) };
  }

  const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '');
  const tem = (t, lista) => lista.some(w => t.includes(w));
  const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, doze: 12, quinze: 15, vinte: 20 };
  const FORA = [['pizza', 'pizza'], ['sushi', 'sushi'], ['japones', 'comida japonesa'], ['temaki', 'temaki'], ['massa', 'massa'], ['macarrao', 'macarrão'], ['lasanha', 'lasanha'], ['churrasco', 'churrasco'], ['picanha', 'picanha'], ['feijoada', 'feijoada'], ['acai', 'açaí'], ['pastel', 'pastel'], ['hot dog', 'hot dog'], ['cachorro quente', 'cachorro-quente'], ['esfiha', 'esfiha'], ['tapioca', 'tapioca'], ['vegano', 'opção vegana'], ['vegetarian', 'opção vegetariana'], ['sorvete', 'sorvete'], ['pao de queijo', 'pão de queijo'], ['cafe', 'café']];
  /* devolve só o que entendeu: { desejo, quem, pessoas, grande, fome, ocasiao, fora } (índices das listas acima) */
  function interpretar(texto) {
    const t = norm(texto), r = {};
    const f = FORA.find(([k]) => t.includes(k)); if (f) r.fora = f[1];
    if (tem(t, ['prato feito', 'marmita', 'parmegiana'])) r.desejo = 3;
    else if (tem(t, ['frango', 'frito', 'crocante', 'asinha', 'coxa', 'bites', 'empanado', 'caixa'])) r.desejo = 0;
    else if (tem(t, ['hamburguer', 'burger', 'lanche', 'sanduiche'])) r.desejo = 1;
    else if (tem(t, ['beliscar', 'petisco', 'porcao', 'batata', 'onion', 'aipim', 'mandioca', 'aperitivo', 'petiscar'])) r.desejo = 2;
    else if (tem(t, ['doce', 'docinho', 'sobremesa', 'brigadeiro', 'churros', 'chocolate'])) r.desejo = 4;
    else if (tem(t, ['surpreend', 'tanto faz', 'qualquer', 'nao sei', 'sei la', 'me indica', 'me ajuda', 'decide'])) r.desejo = 5;
    // companhia e quantidade
    let q = null;
    if (/\b(sozinho|sozinha|so eu|eu mesmo|so pra mim)\b/.test(t)) q = 0;
    else if (tem(t, ['namorad', 'crush', 'date', 'casal', 'esposa', 'marido', 'a dois', 'nos dois', 'meu amor', 'noiv', 'ficante'])) q = 1;
    else if (tem(t, ['trabalho', 'escritorio', 'empresa', 'reuniao', 'colega', 'equipe'])) q = 4;
    else if (tem(t, ['familia', 'filho', 'filha', 'meus pais', 'minha mae', 'meu pai', 'crianca', 'sobrinho', 'irmao', 'irma'])) q = 3;
    else if (tem(t, ['amigo', 'amiga', 'galera', 'parceiro', 'pessoal', 'rapaziada', 'turma'])) q = 2;
    let n = null; const dg = t.match(/(?:pra|para|somos|sao|com|em|de|ate|uns|umas)\s+(\d{1,2})\b(?!\s*(?:h|hr|hrs|horas?|min|minutos?|reais|r\$))/) || t.match(/\b(\d{1,2})\s*(?:pessoas?|amigos?|amigas?|gente|convidados?)/);
    if (dg) n = +dg[1]; else { const w = t.match(/(?:pra|para|somos|sao|com|em|ate|uns|umas)\s+(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|doze|quinze|vinte)\b/); if (w) n = NUM[w[1]]; }
    if (n != null && (n < 1 || n > 60)) n = null;
    if (n == null && q === 0) n = 1; if (n == null && q === 1) n = 2;
    if (q != null) r.quem = q;
    if (n != null) { if (n <= 4) r.pessoas = n - 1; else { r.pessoas = 4; const i = GRANDE.findIndex(x => x.n >= n); r.grande = i < 0 ? GRANDE.length - 1 : i; } if (r.quem == null && n === 1) r.quem = 0; if (r.quem == null && n === 2) r.quem = 1; }
    // fome e ocasião
    if (tem(t, ['morrendo', 'faminto', 'esfomead', 'varad', 'muita fome', 'fome de leao', 'campeao', 'comer muito', 'barriga roncando', 'bastante fome'])) r.fome = 2;
    else if (tem(t, ['pouca fome', 'sem muita fome', 'so beliscar', 'beliscar', 'lanchinho', 'leve', 'so um lanche', 'so um petisco'])) r.fome = 0;
    else if (tem(t, ['fome normal', 'fome media', 'normal'])) r.fome = 1;
    if (tem(t, ['jogo', 'futebol', 'partida', 'campeonato'])) r.ocasiao = 0;
    else if (tem(t, ['serie', 'filme', 'netflix', 'maratona'])) r.ocasiao = 1;
    else if (tem(t, ['almoco', 'almocar'])) r.ocasiao = 2;
    return r;
  }

  const api = { GRUPO, GRANDE, FOME, OCASIAO, DESEJO, QUEM, CAP, plano, interpretar, COCA, COCA_AVULSA, BRIG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.N1Assist = api;
})(typeof window !== 'undefined' ? window : globalThis);
