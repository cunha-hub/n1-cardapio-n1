/* Cardápio mestre N1 Chicken: estrutura nova, igual para todas as lojas.
   Preços: menor valor ,90 com CMV <= 28% (custo + embalagem), planilha "CMV 2026 - NOVA OPERAÇÃO"
   (aba Precificação N1, corte mais caro). Cálculo em pesquisa/precificar_cmv28.js.
   Fotos: as oficiais já publicadas no iFood da N1 (loja Vitória-ES). */
(function () {
  const CDN = 'https://static.ifood-static.com.br/image/upload/t_high/pratos/';
  const A = CDN + 'af7f7d95-85ad-4e08-a2bb-edbb3555fab1/';
  const B = CDN + '8d71c400-5bf1-4043-a057-e07381825196/';
  const C = CDN + 'cbcf001a-26fb-4e0f-8024-6dce16c569d6/';

  const IMG = {
    comboGG: A + '202605271437_XLYN_i.jpg', comboG: A + '202605271437_DGW5_i.jpg',
    comboM: A + '202605271436_8362_i.jpg', comboP: A + '202605271436_LD12_i.jpg',
    burgersBites: B + '202406171649_1617_i.jpg', burgers3: A + '202412021849_V755_i.jpg',
    combinho: B + '202406172057_X14I_i.jpg', burgers2: A + '202605271457_55BN_i.jpg',
    trio: A + '202605271457_LI58_i.jpg', superCombo: A + '202605271500_66R8_i.jpg',
    caixaP: A + '202605271434_PCVG_i.jpg', caixaM: A + '202605271435_27B3_i.jpg', caixaG: A + '202605271435_TF6C_i.jpg',
    bitesInd: B + '202406171629_115T_i.jpg', bitesP: A + '202605271433_ASHH_i.jpg', bitesM: A + '202605271434_3X4D_i.jpg',
    coca: B + '202304041842_N2PQ_i.jpg', cocaZero: B + '202304041842_6872_i.jpg', guarana: B + '202206081832_K6AY_i.jpg',
    garlic: B + '202501101045_IW77_i.jpg', salada: A + '202605271721_1L8H_i.jpg', classic: A + '202605271723_J6PL_i.jpg',
    bbq: A + '202605271721_B8C0_i.jpg', onion: A + '202605271722_XXR2_i.jpg', bbc: A + '202605271720_3CM6_i.jpg',
    tradicional: A + '202605271440_1356_i.jpg', fritoSalada: A + '202605271441_TFOB_i.jpg', parmegiana: A + '202605271441_5C14_i.jpg',
    maioneses: C + '202603231655_5K21_i.jpg', batata: C + '202603231840_F5G5_i.jpg', rings: C + '202603231912_VGDY_i.jpg',
    aipim: C + '202603231854_3TDK_i.jpg', cheddar: C + '202603231959_2552_i.jpg', pure: C + '202604011518_7UN1_i.jpg',
    arroz: C + '202604011530_7064_i.jpg', saladaSuper: C + '202604011533_7OQP_i.jpg', comboZe: B + '202503281711_D1NH_i.jpg',
    trioCaixaP: C + '202603231119_JUYJ_i.jpg',
    logo: 'https://static.ifood-static.com.br/image/upload/t_high/logosgde/8adf268a-29f7-4b0f-9952-db64720acd56/202607281749_IHL5.jpeg',
    capa: 'https://static.ifood-static.com.br/image/upload//capa/af7f7d95-85ad-4e08-a2bb-edbb3555fab1/202601121058_mSgf_c@2x.png'
  };

  /* Grupos de complementos: só o que o iFood oferece (grupo, mín/máx, preço).
     Cada opção também respeita CMV <= 28% sobre o seu custo incremental. */
  const G = {
    acomp: { id: 'acomp', title: 'Escolha o acompanhamento', hint: 'Obrigatório · escolha 1', min: 1, max: 1, options: [
      { n: 'Batata Frita', p: 0, tag: 'Mais pedida' }, { n: 'Aipim Frito', p: 0 }, { n: 'Purê de Batatas', p: 0 },
      { n: 'Onion Rings', p: 8.9 }, { n: 'Batata Cheddar & Bacon', p: 10.9 }] },
    turbo: { id: 'turbo', title: 'Turbine o combo', hint: 'Opcional · até 2', min: 0, max: 2, options: [
      { n: '+ Batata individual', p: 7.9 }, { n: '+ Chicken Bites individual', p: 11.9, tag: 'Pra beliscar' }] },
    molho: { id: 'molho', title: 'Seu molho incluso', hint: 'Obrigatório · escolha 1', min: 1, max: 1, options: [
      { n: 'Molho Verde (receita secreta)', p: 0, tag: 'A mais pedida' }, { n: 'Maionese de Alho com Queijo', p: 0 },
      { n: 'Maionese de Bacon', p: 0 }, { n: 'Barbecue', p: 0 }, { n: 'Cheddar Catupiry', p: 1.9 }] },
    molhoExtra: { id: 'molhoExtra', title: 'Molho extra pra mergulhar', hint: 'Opcional · até 3', min: 0, max: 3, options: [
      { n: 'Molho Verde', p: 6.9 }, { n: 'Alho com Queijo', p: 6.9 }, { n: 'Bacon', p: 6.9 }, { n: 'Cheddar', p: 8.9 }] },
    bebida: { id: 'bebida', title: 'Bebida gelada com preço de combo', hint: 'Opcional · R$ 2 mais barata que avulsa', min: 0, max: 4, options: [
      { n: 'Coca-Cola lata', p: 11.9, de: 13.9 }, { n: 'Coca-Cola sem açúcar lata', p: 11.9, de: 13.9 }, { n: 'Fanta Guaraná lata', p: 11.9, de: 13.9 }] },
    doce: { id: 'doce', title: 'Fecha com doce?', hint: 'Opcional', min: 0, max: 2, options: [
      { n: 'Brigadeiro N1 de colher', p: 7.9, tag: 'Queridinho' }, { n: 'Churros N1', p: 9.9 }] },
    burger: { id: 'burger', title: 'Escolha seus burgers', hint: 'Obrigatório', min: 2, max: 2, multi: true, options: [
      { n: 'Chicken Burger (clássico)', p: 0 }, { n: 'Chicken Barbecue', p: 0 }, { n: 'Chicken Salada', p: 1.9, tag: 'Mais pedido' },
      { n: 'Chicken Onion', p: 4.9 }, { n: 'Chicken Garlic Bacon', p: 4.9 }, { n: 'BBC (Barbecue, Bacon & Cheddar)', p: 5.9 }] }
  };
  const burgerN = n => Object.assign({}, G.burger, { min: n, max: n, hint: `Obrigatório · escolha ${n}` });
  const burger1 = Object.assign({}, G.burger, { title: 'Escolha seu burger', min: 1, max: 1, hint: 'Obrigatório · escolha 1' });
  const bebidaN = n => Object.assign({}, G.bebida, { max: n });

  /* hoje = preço atual no iFood N1 Vitória (30/09/2026); cmvHoje calculado com o mesmo custo da planilha */
  const categories = [
    { id: 'pra-mim', name: 'Só pra mim', emoji: '1', sub: 'Refeição completa pra 1.', items: [
      { id: 'combo-p', name: 'Combo P · Caixa P + acompanhamento', desc: 'Caixa P de cortes clássicos crocantes, acompanhamento Super e 1 molho da casa.', serve: 1, price: 62.9, de: 65.7, hoje: 54.9, cmv: 27.7, cmvHoje: 31.7, img: IMG.comboP, groups: [G.acomp, G.turbo, G.molho, G.bebida, G.doce] },
      { id: '4-em-n1', name: '4 em N1 · burger + batata + Coca + brigadeiro', desc: 'A refeição inteira em um toque: burger à escolha, batata individual, Coca-Cola lata e brigadeiro de colher.', serve: 1, price: 51.9, de: 55.6, hoje: 39.99, cmv: 27.7, cmvHoje: 36.0, img: IMG.trio, groups: [burger1, G.molhoExtra] },
      { id: 'trio', name: 'Trio Burger N1 · com Coca', desc: 'Burger de frango frito crocante, batata individual e Coca-Cola lata.', serve: 1, price: 44.9, de: 47.7, hoje: 44.9, cmv: 27.5, cmvHoje: 27.5, img: IMG.trio, badge: 'Mais pedido', groups: [burger1, G.molhoExtra, G.doce] },
      { id: 'combinho', name: 'Combinho Chicken Bites + batata + Coca', desc: 'Chicken Bites individual, batata individual e Coca-Cola lata. O lanche da série.', serve: 1, price: 32.9, de: 33.7, hoje: 29.9, cmv: 27.9, cmvHoje: 30.7, img: IMG.combinho, groups: [G.molhoExtra, G.doce] }
    ] },
    { id: 'pra-dois', name: 'Pra dois', emoji: '2', sub: 'Casal, dupla, maratona de série.', items: [
      { id: 'super-combo', name: 'Super Combo · 2 burgers + batata + 2 Cocas', desc: '2 burgers à escolha, batata Super e 2 Coca-Cola lata. Um preço só em todas as lojas.', serve: 2, price: 94.9, de: 105.5, hoje: 79.9, cmv: 27.9, cmvHoje: 33.1, img: IMG.superCombo, groups: [burgerN(2), G.turbo, G.doce] },
      { id: 'combo-m', name: 'Combo M · serve 2 a 3', desc: 'Caixa M de frango frito crocante + acompanhamento Super + 1 molho. O combo que mais fatura na rede.', serve: 3, price: 87.9, de: 90.7, hoje: 79.9, cmv: 28.0, cmvHoje: 30.8, img: IMG.comboM, badge: 'Mais pedido', groups: [G.acomp, G.turbo, G.molho, G.molhoExtra, bebidaN(3), G.doce] },
      { id: 'dupla-bites', name: 'Dupla N1 + Chicken Bites', desc: '2 burgers clássicos + Chicken Bites individual pra beliscar junto.', serve: 2, price: 58.9, de: 63.7, hoje: 52.9, cmv: 27.7, cmvHoje: 30.9, img: IMG.burgersBites, groups: [burgerN(2), G.bebida, G.doce] },
      { id: 'dupla', name: 'Dupla N1 · 2 burgers', desc: 'Dois burgers de frango frito crocante. O campeão de vendas da marca.', serve: 2, price: 47.9, de: 51.8, hoje: 44.9, cmv: 27.7, cmvHoje: 29.5, img: IMG.burgers2, groups: [burgerN(2), G.bebida, G.doce] }
    ] },
    { id: 'galera', name: 'Pra galera', emoji: '3+', sub: 'Jogo, aniversário, família reunida.', items: [
      { id: 'combo-gg', name: 'Combo GG · serve 5 a 7', desc: 'Caixa G + Caixa M de frango crocante, 2 acompanhamentos Super e 3 molhos. Sai por R$ 30,41 por pessoa.', serve: 7, price: 212.9, de: 224.3, hoje: 189.9, cmv: 28.0, cmvHoje: 31.3, img: IMG.comboGG, groups: [G.acomp, G.molho, G.molhoExtra, bebidaN(7), G.doce] },
      { id: 'combo-g', name: 'Combo G · serve 3 a 5', desc: 'Caixa G de frango frito crocante, 2 acompanhamentos e 2 molhos. O queridinho do dia de jogo.', serve: 5, price: 148.9, de: 159.5, hoje: 132.9, cmv: 27.9, cmvHoje: 31.3, img: IMG.comboG, badge: 'Mais pedido pra galera', groups: [G.acomp, G.turbo, G.molho, G.molhoExtra, bebidaN(5), G.doce] },
      { id: '3-burgers', name: 'Trinca N1 · 3 burgers', desc: 'Três burgers à escolha por preço de amigo.', serve: 3, price: 70.9, de: 77.7, hoje: 64.9, cmv: 27.8, cmvHoje: 30.4, img: IMG.burgers3, groups: [burgerN(3), bebidaN(3), G.doce] }
    ] },
    { id: 'frango', name: 'Frango & Bites', emoji: 'F', sub: 'O frango frito crocante, avulso.', items: [
      { id: 'caixa-g', name: 'Caixa G · Cortes clássicos', desc: 'Peito, coxa, sobrecoxa e drumet crocantes. Serve 3.', serve: 3, price: 93.9, hoje: 84.9, cmv: 27.9, cmvHoje: 30.9, img: IMG.caixaG, groups: [G.molho, G.molhoExtra, bebidaN(3)] },
      { id: 'caixa-m', name: 'Caixa M · Cortes clássicos', desc: 'Serve 2. A caixa mais gostosa desse mundo.', serve: 2, price: 57.9, hoje: 54.9, cmv: 27.9, cmvHoje: 29.4, img: IMG.caixaM, groups: [G.molho, G.molhoExtra, G.bebida] },
      { id: 'bites-m', name: 'Chicken Bites M', desc: 'Dezenas de cubinhos de peito crocante. Serve 3.', serve: 3, price: 54.9, hoje: 49.9, cmv: 27.6, cmvHoje: 30.3, img: IMG.bitesM, badge: 'Top 3 da rede', groups: [G.molho, G.molhoExtra, G.bebida] },
      { id: 'caixa-p', name: 'Caixa P · Cortes clássicos', desc: 'Serve 1. Crocância que estala no delivery.', serve: 1, price: 32.9, hoje: 29.9, cmv: 27.2, cmvHoje: 29.9, img: IMG.caixaP, groups: [G.molho, G.bebida] },
      { id: 'bites-p', name: 'Chicken Bites P', desc: 'Serve 2. Pra beliscar vendo o jogo.', serve: 2, price: 30.9, hoje: 26.9, cmv: 27.3, cmvHoje: 31.3, img: IMG.bitesP, groups: [G.molho, G.bebida] }
    ] },
    { id: 'burgers', name: 'Burgers', emoji: 'B', sub: 'Mais baratos: a margem que sobrava virou preço.', items: [
      { id: 'bbc', name: 'BBC · Barbecue, Bacon & Cheddar', desc: 'O lendário: barbecue, bacon e cheddar com frango frito crocante.', serve: 1, price: 30.9, hoje: 36.9, cmv: 27.5, cmvHoje: 23.0, img: IMG.bbc, groups: [G.bebida, G.doce] },
      { id: 'garlic', name: 'Chicken Garlic Bacon', desc: 'Maionese de alho com queijo, bacon, picles, alface e tomate.', serve: 1, price: 29.9, hoje: 32.9, cmv: 28.0, cmvHoje: 25.4, img: IMG.garlic, groups: [G.bebida, G.doce] },
      { id: 'onion', name: 'Chicken Onion Burger', desc: 'Anéis de cebola crocantes e maionese de bacon.', serve: 1, price: 29.9, hoje: 32.9, cmv: 27.6, cmvHoje: 25.1, img: IMG.onion, groups: [G.bebida, G.doce] },
      { id: 'salada', name: 'Chicken Salada', desc: 'Peito crocante, maionese verde, cheddar, picles, alface, tomate e cebola.', serve: 1, price: 26.9, hoje: 32.9, cmv: 27.7, cmvHoje: 22.6, img: IMG.salada, badge: 'Mais pedido', groups: [G.bebida, G.doce] },
      { id: 'classic', name: 'Chicken Burger', desc: 'O clássico: brioche, frango crocante e a inconfundível maionese verde.', serve: 1, price: 25.9, hoje: 29.9, cmv: 27.1, cmvHoje: 23.5, img: IMG.classic, groups: [G.bebida, G.doce] },
      { id: 'bbq', name: 'Chicken Barbecue', desc: 'Frango frito crocante e barbecue defumado.', serve: 1, price: 24.9, hoje: 29.9, cmv: 27.1, cmvHoje: 22.6, img: IMG.bbq, groups: [G.bebida, G.doce] }
    ] },
    { id: 'almoco', name: 'Almoço N1', emoji: 'A', sub: 'Prato feito com frango crocante, das 11h às 15h.', items: [
      { id: 'tradicional', name: 'Tradicional N1', desc: 'Frango frito dourado, arroz soltinho e acompanhamento à escolha.', serve: 1, price: 31.9, hoje: 34.9, cmv: 27.3, cmvHoje: 24.9, img: IMG.tradicional, badge: 'Mais pedido no almoço', groups: [G.acomp, G.bebida, G.doce] },
      { id: 'parmegiana', name: 'Frango à Parmegiana N1', desc: 'Peito crocante, molho de tomate caseiro e queijo gratinado. Com arroz.', serve: 1, price: 30.9, hoje: 39.9, cmv: 27.2, cmvHoje: 21.1, img: IMG.parmegiana, groups: [G.bebida, G.doce] },
      { id: 'frito-salada', name: 'Frango Frito com Salada N1', desc: 'Frango crocante, purê e salada com picles da casa.', serve: 1, price: 30.9, hoje: 34.9, cmv: 27.2, cmvHoje: 24.1, img: IMG.fritoSalada, groups: [G.bebida, G.doce] }
    ] },
    { id: 'complete', name: 'Complete seu pedido', emoji: '+', sub: 'Doce, bebida e acompanhamento.', items: [
      { id: 'brigadeiro', name: 'Brigadeiro N1 de colher', desc: 'Cremoso, de colher. Agora com foto e no lugar certo.', serve: 1, price: 7.9, hoje: 7.9, cmv: 25.6, cmvHoje: 25.6, img: null, emojiArt: 'brigadeiro', groups: [] },
      { id: 'churros', name: 'Churros N1', desc: 'Açúcar e canela, o doce final perfeito.', serve: 1, price: 9.9, hoje: 10.9, cmv: 26.6, cmvHoje: 24.1, img: null, emojiArt: 'churros', groups: [] },
      { id: 'batata', name: 'Batata Frita individual', desc: 'Crocante mesmo no delivery.', serve: 1, price: 7.9, hoje: 11.9, cmv: 25.6, cmvHoje: 17.0, img: IMG.batata, groups: [] },
      { id: 'rings', name: 'Onion Rings individual', desc: 'Anéis de cebola empanados.', serve: 1, price: 9.9, hoje: 12.9, cmv: 26.5, cmvHoje: 20.3, img: IMG.rings, groups: [] },
      { id: 'aipim', name: 'Aipim Frito individual', desc: 'Mandioca, aipim ou macaxeira: irresistível.', serve: 1, price: 6.9, hoje: 12.9, cmv: 24.8, cmvHoje: 13.3, img: IMG.aipim, groups: [] },
      { id: 'maioneses', name: 'Maionese exclusiva do N1', desc: 'Verde, alho com queijo ou bacon.', serve: 1, price: 6.9, hoje: 6.49, cmv: 27.1, cmvHoje: 28.8, img: IMG.maioneses, groups: [] },
      { id: 'coca', name: 'Coca-Cola lata', desc: 'Dentro de qualquer combo sai R$ 11,90.', serve: 1, price: 13.9, hoje: 7.9, cmv: 26.2, cmvHoje: 46.1, img: IMG.coca, groups: [] }
    ] }
  ];

  /* Diagnóstico (BI Tastefy + iFood Vitória, set/2026) e projeção (pesquisa/projecao.js). */
  const diag = {
    visitas: 517910, pedidos: 60850, gmv: 3587464, conv: 11.75, ticket: 58.96,
    produtos: 284, produtosCauda: 199, gruposDuplicados: 29, categoriasHoje: 13, categoriasNovo: 7,
    cmvMixHoje: 28.8, cmvMixNovo: 27.7, itensAcima: 17, itensTotal: 32,
    funil: [
      { k: 'Visitas na loja', v: 100 }, { k: 'Clicam em um item', v: 50.9 }, { k: 'Adicionam à sacola', v: 20.3 },
      { k: 'Vão ao checkout', v: 19.4 }, { k: 'Fazem o pedido', v: 11.2 }],
    projecao: { ticket: 63.85, gmv: 3885273, deltaGmv: 297809, deltaPct: 8.3, margemHoje: 2554274, margemNova: 2809052, deltaMargem: 254778, upsideDelta: 562658 },
    ticketPontes: [
      { k: 'Novos preços no mix real (CMV 28%)', v: 2.42, how: 'mesmo mix de jul–set, preços novos' },
      { k: 'Molho extra', v: 0.83, how: '12% dos pedidos × R$ 6,90' },
      { k: 'Bebida com preço de combo', v: 0.71, how: '+6 p.p. dos pedidos × R$ 11,90' },
      { k: 'Troca premium (Onion/Cheddar)', v: 0.53, how: '6% dos pedidos × R$ 8,90' },
      { k: 'Doce no fim do pedido', v: 0.40, how: '+5 p.p. dos pedidos × R$ 7,90' }]
  };

  window.N1 = { IMG, categories, groups: G, diag };
})();
