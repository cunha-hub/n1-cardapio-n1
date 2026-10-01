/* N1 Chicken · O Cardápio Nº1: interações do site */
(() => {
  const { IMG, categories, diag } = window.N1;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const fmt = (v, dec = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const allItems = categories.flatMap(c => c.items.map(i => Object.assign(i, { cat: c.id })));
  const byId = id => allItems.find(i => i.id === id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroProgress = 0;
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawCover(c, im, x, y, w, h) { const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; c.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }

  /* ---------------- loader ---------------- */
  const preload = [IMG.logo, IMG.comboM, IMG.comboG, IMG.superCombo, IMG.caixaM, IMG.bitesM, IMG.capa];
  let loaded = 0;
  const bar = $('#loader .bar i');
  const tick = () => { loaded++; bar.style.width = (loaded / (preload.length + 1)) * 100 + '%'; };
  Promise.all([
    document.fonts.ready.then(tick),
    ...preload.map(src => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => { tick(); r(); }; i.src = src; }))
  ]).then(() => setTimeout(() => { $('#loader').classList.add('out'); startHeroIntro(); }, 250));
  setTimeout(() => $('#loader').classList.add('out'), 6000);

  /* ---------------- smooth scroll + GSAP ---------------- */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -10, duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------------- HERO ---------------- */
  const title = $('#heroTitle');
  title.innerHTML = [...title.textContent].map(c => `<span class="ch">${c}</span>`).join('');
  const video = $('#heroVideo'), canvas = $('#heroCanvas');
  let useVideo = false, vTarget = 0, vCur = 0;

  function startHeroIntro() {
    gsap.from('#heroTitle .ch', { yPercent: 110, rotate: 8, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 });
    gsap.from('#heroSub', { opacity: 0, y: 20, duration: 1, delay: 0.5, ease: 'power3.out' });
  }

  video.addEventListener('loadedmetadata', () => { useVideo = true; video.pause(); });
  video.addEventListener('error', startCanvasFallback);
  setTimeout(() => { if (!useVideo) startCanvasFallback(); }, 2500);
  (function vloop() { // scrub suave
    if (useVideo && video.duration) {
      vCur += (vTarget - vCur) * 0.12;
      if (Math.abs(video.currentTime - vCur) > 0.03) video.currentTime = vCur;
    }
    requestAnimationFrame(vloop);
  })();

  let fallbackOn = false;
  function startCanvasFallback() {
    if (fallbackOn || useVideo) return; fallbackOn = true;
    video.hidden = true; canvas.hidden = false; $('#heroNote').hidden = false;
    const ctx = canvas.getContext('2d');
    const srcs = [IMG.comboM, IMG.caixaG, IMG.superCombo, IMG.bitesM, IMG.comboGG, IMG.bbc, IMG.burgers2, IMG.comboP, IMG.salada, IMG.rings, IMG.caixaM, IMG.garlic, IMG.comboG, IMG.batata, IMG.trio];
    const imgs = srcs.map(s => { const i = new Image(); i.crossOrigin = 'anonymous'; i.src = s; return i; });
    let W, H, dpr;
    const size = () => { dpr = Math.min(devicePixelRatio, 2); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; };
    size(); addEventListener('resize', size);
    const rows = [{ y: -0.08, h: 0.42, sp: 26, off: 0 }, { y: 0.36, h: 0.36, sp: -38, off: 5 }, { y: 0.74, h: 0.4, sp: 30, off: 9 }];
    const t0 = performance.now();
    (function draw(now) {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#1A0C05'; ctx.fillRect(0, 0, W, H);
      const p = heroProgress;
      const zoom = 1.08 + p * 0.25;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.06 + p * 0.05); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
      rows.forEach((r, ri) => {
        const h = H * r.h, w = h * 1.33, gap = 18;
        const span = (w + gap) * imgs.length;
        let x0 = ((t * r.sp + p * 900 * (ri % 2 ? -1 : 1)) % span + span) % span - span;
        for (let x = x0, k = r.off; x < W + w; x += w + gap, k++) {
          const im = imgs[k % imgs.length];
          ctx.save();
          roundRect(ctx, x, H * r.y, w, h, 22); ctx.clip();
          if (im.complete && im.naturalWidth) drawCover(ctx, im, x, H * r.y, w, h);
          else { ctx.fillStyle = ri % 2 ? '#FF0000' : '#FFED00'; ctx.fillRect(x, H * r.y, w, h); }
          ctx.restore();
        }
      });
      ctx.restore();
      // tom quente da marca
      ctx.globalCompositeOperation = 'soft-light';
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,237,0,.7)'); g.addColorStop(1, 'rgba(255,0,0,.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(26,12,5,.22)'; ctx.fillRect(0, 0, W, H);
      requestAnimationFrame(draw);
    })(t0);
  }

  const mobileHero = matchMedia('(max-width: 760px)').matches;
  gsap.set('#panelL', mobileHero ? { yPercent: -101, xPercent: 0 } : { xPercent: -101 });
  gsap.set('#panelR', mobileHero ? { yPercent: 101, xPercent: 0 } : { xPercent: 101 });
  const heroTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
    trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6,
    onUpdate: s => { heroProgress = s.progress; if (useVideo && video.duration) vTarget = Math.min(1, s.progress / 0.62) * (video.duration - 0.05); }
  } });
  heroTl
    .to('#cue', { opacity: 0, duration: 0.05 }, 0)
    .to('#heroTitle .ch', { yPercent: -120, opacity: 0, stagger: 0.03, duration: 0.18 }, 0.14)
    .to('#heroSub', { opacity: 0, y: -30, duration: 0.12 }, 0.12)
    .to('#heroMedia', { scale: 0.6, borderRadius: 40, rotate: -3, duration: 0.3 }, 0.3)
    .to('#panelL', { xPercent: 0, duration: 0.22, ease: 'power2.inOut' }, 0.5)
    .to('#panelR', { xPercent: 0, duration: 0.22, ease: 'power2.inOut' }, 0.5)
    .to('#heroMedia', { scale: 0.3, opacity: 0, duration: 0.15 }, 0.62)
    .fromTo('#heroSeal', { scale: 0, rotate: -200 }, { scale: 1, rotate: 0, duration: 0.2, ease: 'back.out(1.6)' }, 0.62)
    .fromTo('#finL', { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.14 }, 0.78)
    .fromTo('#finR', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.14 }, 0.8)
    .to('#heroSeal', { scale: 0.62, duration: 0.14 }, 0.78)
    .to({}, { duration: 0.06 });
  if (mobileHero) {
    heroTl.scrollTrigger.kill(); heroTl.kill();
    // a timeline do desktop já aplicou o estado inicial (rotação do selo, deslocamento dos textos): limpa antes de montar a do celular
    gsap.set(['#heroSeal', '#heroTitle .ch', '#heroSub', '#heroMedia', '#cue', '#finL', '#finR'], { clearProps: 'transform,opacity,borderRadius,rotate,scale,x,y' });
    const mt = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6,
      onUpdate: s => { heroProgress = s.progress; if (useVideo && video.duration) vTarget = Math.min(1, s.progress / 0.62) * (video.duration - 0.05); } } });
    mt.to('#heroTitle .ch', { yPercent: -120, opacity: 0, stagger: 0.03, duration: 0.18 }, 0.14)
      .to('#heroSub', { opacity: 0, duration: 0.1 }, 0.12)
      .to('#heroMedia', { scale: 0.7, borderRadius: 30, duration: 0.3 }, 0.3)
      .to('#panelL', { yPercent: 0, duration: 0.22 }, 0.5).to('#panelR', { yPercent: 0, duration: 0.22 }, 0.5)
      .fromTo('#heroSeal', { scale: 0 }, { scale: 0.7, duration: 0.2 }, 0.62)
      .fromTo('#finL', { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0.78).fromTo('#finR', { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0.8);
  }

  /* ---------------- reveal + contadores ---------------- */
  const rvEls = $$('[data-rv]');
  rvEls.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
  function reveal() {
    const vh = innerHeight;
    for (const el of rvEls) {
      if (el._rv) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > -40) { el._rv = 1; el.classList.add('rv-in'); $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(countUp); }
    }
  }
  addEventListener('scroll', reveal, { passive: true }); addEventListener('resize', reveal);
  if (lenis) lenis.on('scroll', reveal);
  setInterval(reveal, 400); reveal();
  function countUp(el) {
    if (el._done) return; el._done = 1;
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const o = { v: 0 }, final = pre + fmt(to, dec) + suf;
    gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: () => el.textContent = pre + fmt(o.v, dec) + suf, onComplete: () => el.textContent = final });
    setTimeout(() => el.textContent = final, 2600);
  }

  /* ---------------- FUNIL ---------------- */
  (() => {
    const wrap = $('#funnelViz'), cv = $('#funnelCanvas'), ctx = cv.getContext('2d'), steps = $('#funnelSteps');
    const F = diag.funil;
    steps.innerHTML = F.map((s, i) => `<div class="fstep"><div><div class="p num">${fmt(s.v, s.v % 1 ? 1 : 0)}</div>${i ? `<div class="drop">−${fmt(100 - s.v / F[i - 1].v * 100, 0)}% saem</div>` : '<div class="drop" style="color:#9fe0b5">entram</div>'}</div><div class="n">${s.k}</div></div>`).join('');
    $('#funnelList').innerHTML = F.map((s, i) => '<li><span class="t">' + s.k + '</span><span class="v">' + fmt(s.v, s.v % 1 ? 1 : 0) + '</span><span class="b"><i style="width:' + s.v + '%"></i></span>' + (i ? '<span class="dr">−' + fmt(100 - s.v / F[i - 1].v * 100, 0) + '% saem nesta etapa</span>' : '') + '</li>').join('');
    let W, H, dpr, parts = [], on = false;
    const size = () => { dpr = Math.min(devicePixelRatio, 2); W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
    size(); addEventListener('resize', size);
    new IntersectionObserver(([e]) => on = e.isIntersecting, { threshold: 0.1 }).observe(wrap);
    const bandH = x => { const col = x / (W / F.length); const i = Math.min(F.length - 1, Math.floor(col)); const j = Math.min(F.length - 1, i + 1); const f = col - i; const v = F[i].v + (F[j].v - F[i].v) * Math.max(0, f - 0.6) / 0.4; return (H * 0.62) * v / 100; };
    (function loop() {
      requestAnimationFrame(loop);
      if (!on) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const cy = H * 0.52;
      // corpo do funil
      ctx.beginPath(); ctx.moveTo(0, cy - bandH(0) / 2);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, cy - bandH(x) / 2);
      for (let x = W; x >= 0; x -= 8) ctx.lineTo(x, cy + bandH(x) / 2);
      const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,237,0,.20)'); g.addColorStop(1, 'rgba(255,0,0,.25)');
      ctx.fillStyle = g; ctx.fill();
      // partículas
      for (let k = 0; k < 4; k++) {
        const r = Math.random() * 100; let exit = F.length; // em qual etapa sai
        for (let i = 1; i < F.length; i++) if (r > F[i].v) { exit = i; break; }
        parts.push({ x: 0, y: cy + (Math.random() - 0.5) * bandH(0) * 0.9, vx: 1.6 + Math.random() * 1.4, vy: 0, exit, fall: false, a: 1, s: 1.4 + Math.random() * 1.8 });
      }
      const colW = W / F.length;
      parts = parts.filter(p => p.a > 0.02 && p.x < W + 10);
      for (const p of parts) {
        if (!p.fall && p.exit < F.length && p.x > colW * p.exit - colW * 0.15) { p.fall = true; p.vy = (Math.random() - 0.3) * 1.5; }
        if (p.fall) { p.vy += 0.16; p.vx *= 0.97; p.a *= 0.965; }
        else { const hb = bandH(p.x) / 2 * 0.9; p.y += ((Math.max(cy - hb, Math.min(cy + hb, p.y))) - p.y) * 0.08; }
        p.x += p.vx; p.y += p.vy;
        ctx.globalAlpha = p.a; ctx.fillStyle = p.fall ? '#ff5a4a' : '#FFED00';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    })();
  })();

  /* ---------------- ANTES × DEPOIS: cartas que viram ---------------- */
  (() => {
    const HI = 744 / 1568, HB = 0.75; // altura do print e da janela, em frações da largura
    // frente: print real com zoom no problema [recorte %, marca %]; verso: como fica
    const cards = [
      { f: '03_favoritos_duplicados.jpg', crop: [50.5, 46.5, 22, 19], mk: [51.2, 47.5, 20.5, 18.2],
        a: ['4 preços no mesmo combo', 'Super Combo por R$ 69,99, R$ 71,99, R$ 79,90 e R$ 79,99 nas lojas N1.', 'CMV de até 33%'],
        d: ['1 anúncio, 1 preço', 'Mesmo preço nas 72 lojas, calculado para CMV de até 28%.', 'CMV 27,9%'],
        back: '<div class="bk-card"><div class="ph" style="background-image:url(\'' + IMG.superCombo + '\')"></div><div class="b"><b>Super Combo · 2 burgers + batata + 2 Cocas</b><span class="p">R$ 94,90</span><span class="c">CMV 27,9% · igual nas 72 lojas</span></div></div>' },
      { f: '05_modal_combo_m_complementos.jpg', crop: [51, 55, 28, 25], mk: [51.6, 61.5, 28, 11.8],
        a: ['Combo sem venda sugerida', 'O Combo M só pede acompanhamento e molho. Não oferece bebida, doce nem troca.', 'Passo de 1 opção · +R$ 48,03'],
        d: ['Complementos que vendem', 'Troca premium, bebida R$ 2 mais barata no combo e doce, todos com CMV de até 28%.', '+33% no pedido · CMV 27,6%'],
        back: '<div class="bk-list"><div class="r">Troca premium · Onion Rings<span>+ R$ 8,90</span><i></i></div><div class="r">Coca lata no combo<span>+ R$ 11,90</span><i></i></div><div class="r">Brigadeiro N1<span>+ R$ 7,90</span><i></i></div><div class="tot"><span>Combo M</span><span><s>R$ 87,90</s>R$ 116,60</span></div></div>' },
      { f: '07_sobremesas_sem_foto.jpg', crop: [15.4, 19.2, 25, 22], mk: [15.9, 19.8, 24, 21],
        a: ['Doce sem foto, no fim', 'Churros e brigadeiro aparecem sem foto, na 12ª de 13 categorias.', '0,4% dos pedidos levam doce'],
        d: ['Doce dentro de todo combo', 'Com foto, oferecido na hora de fechar o pedido.', '+5 p.p. de pedidos com doce'],
        back: '<div class="bk-doce"><div class="art brigadeiro"></div><div class="chip">Fecha com doce? · Brigadeiro <b>+ R$ 7,90</b></div></div>' },
      { f: '02_super_ofertas.jpg', crop: [15.6, 21, 23, 13], mk: [16.1, 25.6, 22.2, 5],
        a: ['13 categorias e "Tags:"', 'Palavras-chave de busca aparecem na descrição, para o cliente ler.', '284 produtos na rede'],
        d: ['7 categorias por ocasião', 'O cliente escolhe por quantas pessoas vão comer. A descrição fica curta.', '13 → 7 categorias · 32 itens'],
        back: '<div class="bk-cats">' + ['Só pra mim', 'Pra dois', 'Pra galera', 'Frango & Bites', 'Burgers', 'Almoço N1', 'Complete'].map(c => '<span>' + c + '</span>').join('') + '</div>' }
    ];
    const fronts = [
      '<div class="rep"><div class="rh">Super Combo · na mesma marca</div>' + [['Os favoritos do N1', 'R$ 79,90'], ['Clube Day', 'R$ 71,99'], ['Clube Week', 'R$ 79,99'], ['Loja N1 Burgers', 'R$ 69,99']].map(r => '<div class="rr"><span><b>Super Combo</b><small>' + r[0] + '</small></span><em class="bad">' + r[1] + '</em></div>').join('') + '</div>',
      '<div class="rep"><div class="rh">Combo M · 2 a 3 pessoas</div><div class="rg">Escolha o corte · <b>1 opção</b></div><div class="rr"><span>Peito de Frango Crocante</span><em class="bad">+ R$ 48,03</em></div><div class="rg">Acompanhamento</div><div class="rr"><span>Batata Frita Super</span><em>+ R$ 26,20</em></div><div class="rr"><span>Molho Verde</span><em>+ R$ 5,67</em></div><div class="rr ghost"><span>Bebida ou doce?</span><em>não oferece</em></div></div>',
      '<div class="rep"><div class="rh">Sobremesas · <b class="bad-t">12ª de 13 categorias</b></div>' + [['Churros N1', 'A partir de R$ 10,90'], ['Brigadeiro N1', 'R$ 7,90']].map(r => '<div class="rr ph"><span><b>' + r[0] + '</b><small>' + r[1] + '</small></span><i class="nophoto">sem foto</i></div>').join('') + '</div>',
      '<div class="rep"><div class="tabs-strip">' + ['Destaques', 'Receba Cupons', 'Super Ofertas', 'Os favoritos', 'Frango Frito', 'Burgers', 'N1&Zé', 'Refeições', 'Acomp.', 'Sobremesas', 'Bebidas', 'Clube Day', 'Clube Week'].map(t => '<span>' + t + '</span>').join('') + '</div><div class="rg"><b class="bad-t">13 categorias</b> antes do primeiro item</div><div class="rr txt-only"><span><b>2 Burguers + Chicken Bites Individual</b><small>2 Burguers à sua escolha + Chicken Bites Individual. <mark>Tags: hambúrguer, burguer, burger, lanche, salada, jantar, frango frito…</mark></small></span></div></div>'
    ];
    const crop = c => {
      const [x, y, w, h] = c.crop.map(v => v / 100), [mx, my, mw, mh] = c.mk.map(v => v / 100);
      const sc = Math.max(HB / HI, Math.min(1 / (w * 1.08), HB * 0.92 / (h * HI)));
      let tx = 0.5 - (x + w / 2) * sc, ty = HB / (2 * HI) - (y + h / 2) * sc;          // frações da largura / da altura do print
      tx = Math.min(0, Math.max(1 - sc, tx)); ty = Math.min(0, Math.max(HB / HI - sc, ty)); // sem bordas vazias
      const L = (tx + sc * mx) * 100, T = (ty + sc * my) * HI / HB * 100, Wd = sc * mw * 100, Ht = sc * mh * HI / HB * 100;
      return '<div class="vis crop"><img loading="lazy" alt="Print do iFood" src="assets/prints/' + c.f + '" style="transform:translate(' + (tx * 100).toFixed(2) + '%,' + (ty * 100).toFixed(2) + '%) scale(' + sc.toFixed(3) + ')"><span class="mk" style="left:' + L.toFixed(2) + '%;top:' + T.toFixed(2) + '%;width:' + Wd.toFixed(2) + '%;height:' + Ht.toFixed(2) + '%"></span></div>';
    };
    const txt = (t, kind) => '<div class="txt"><span class="tag pill ' + (kind === 'a' ? 'red' : '') + '">' + (kind === 'a' ? 'Antes' : 'Depois') + '</span><h4>' + t[0] + '</h4><p>' + t[1] + '</p><div class="m">' + t[2] + '</div></div>';
    const box = $('#flips');
    box.innerHTML = cards.map((c, i) => '<article class="flip" tabindex="0" role="button" aria-pressed="false" aria-label="Carta ' + (i + 1) + ': ' + c.a[0] + '. Toque para ver como fica."><div class="inner">' +
      '<div class="face front"><span class="n">' + (i + 1) + '</span><span class="hint">Toque ↻</span><div class="vis">' + fronts[i] + '<button class="proof" data-src="assets/prints/' + c.f + '">Ver print ↗</button></div>' + txt(c.a, 'a') + '</div>' +
      '<div class="face back"><span class="n">' + (i + 1) + '</span><div class="vis">' + c.back + '</div>' + txt(c.d, 'd') + '</div></div></article>').join('');
    const flips = $$('.flip', box), seg = $('.seg'), segBtns = $$('button', seg);
    const syncSeg = () => { const all = flips.every(f => f.classList.contains('on')); seg.classList.toggle('depois', all); segBtns.forEach(b => { const on = (b.dataset.v === 'depois') === all; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); };
    const setCard = (f, on) => { f.classList.toggle('on', on); f.setAttribute('aria-pressed', on); };
    const lb = $('#lightbox');
    box.addEventListener('click', e => { const p = e.target.closest('.proof'); if (!p) return; e.stopPropagation(); $('img', lb).src = p.dataset.src; lb.classList.add('on'); }, true);
    lb.addEventListener('click', () => lb.classList.remove('on'));
    flips.forEach(f => {
      f.addEventListener('click', e => { if (e.target.closest('.proof')) return; setCard(f, !f.classList.contains('on')); syncSeg(); });
      f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } });
    });
    segBtns.forEach(b => b.addEventListener('click', () => { const on = b.dataset.v === 'depois'; flips.forEach((f, i) => setTimeout(() => setCard(f, on), i * 110)); setTimeout(syncSeg, flips.length * 110); }));
    // pontos do carrossel (celular)
    const dots = $('#flipDots'); dots.innerHTML = flips.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('');
    box.addEventListener('scroll', () => { const i = Math.round(box.scrollLeft / (flips[0].offsetWidth + 14)); $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
  })();

  /* ---------------- CARDÁPIO (dentro do celular) ---------------- */
  const nav = $('#catNav'), list = $('#menuList'), scroller = $('#menuScroll');
  const inPhone = () => matchMedia('(min-width: 761px)').matches; // no computador o cardápio rola dentro do celular
  $('#mpCover').style.backgroundImage = "url('" + IMG.capa + "')"; $('#mpLogo').src = IMG.logo;
  nav.innerHTML = categories.map((c, i) => '<button data-cat="' + c.id + '" class="' + (i ? '' : 'on') + '">' + c.name + '</button>').join('');
  list.innerHTML = categories.map(c => '<div class="mp-cat" id="cat-' + c.id + '"><h3>' + c.name + '</h3><p>' + c.sub + '</p>' + c.items.map(row).join('') + '</div>').join('');
  function row(it) {
    const serve = it.cat === 'complete' ? '' : '<span>Serve ' + it.serve + '</span>';
    return '<button class="mi" data-id="' + it.id + '"><div><h4>' + it.name + '</h4><p>' + it.desc + '</p>' +
      '<div class="tags">' + (it.badge ? '<span class="b">' + it.badge + '</span>' : '') + serve + '<span class="c">CMV ' + fmt(it.cmv, 1) + '%</span></div>' +
      '<div class="pr">' + brl(it.price) + (it.de ? '<s>' + brl(it.de) + '</s><small>economize ' + brl(it.de - it.price) + '</small>' : (it.serve > 1 ? '<small>' + brl(it.price / it.serve) + '/pessoa</small>' : '')) + '</div></div>' +
      '<div class="ph' + (it.img ? '' : ' art ' + (it.emojiArt || '')) + '" style="' + (it.img ? "background-image:url('" + it.img + "')" : '') + '"><span class="add">+</span></div></button>';
  }
  const blocks = $$('.mp-cat', list);
  function syncCat() {
    const ref = inPhone() ? scroller.getBoundingClientRect().top + nav.offsetHeight + 12 : 64 + nav.offsetHeight + 16;
    let cur = blocks[0];
    for (const b of blocks) if (b.getBoundingClientRect().top <= ref) cur = b;
    $$('button', nav).forEach(btn => { const on = 'cat-' + btn.dataset.cat === cur.id; if (on && !btn.classList.contains('on')) btn.scrollIntoView({ block: 'nearest', inline: 'center' }); btn.classList.toggle('on', on); });
  }
  scroller.addEventListener('scroll', syncCat, { passive: true }); addEventListener('scroll', syncCat, { passive: true });
  $$('button', nav).forEach(btn => btn.addEventListener('click', () => {
    const t = $('#cat-' + btn.dataset.cat);
    if (inPhone()) scroller.scrollTo({ top: t.offsetTop - nav.offsetHeight - 4, behavior: 'smooth' });
    else lenis ? lenis.scrollTo(t, { offset: -64 - nav.offsetHeight - 8, duration: 1 }) : t.scrollIntoView({ behavior: 'smooth' });
  }));
  list.addEventListener('click', e => { const c = e.target.closest('.mi'); if (c) openSheet(byId(c.dataset.id)); });
  // QR code para abrir no celular
  (() => { const url = 'https://cunha-hub.github.io/n1-cardapio-n1/site/#cardapio'; if (window.QRCode) new QRCode($('#qr'), { text: url, width: 208, height: 208, colorDark: '#1A0C05', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); })();

  /* ---------------- modal com complementos ---------------- */
  const sheet = $('#sheet'), sheetBg = $('#sheetBg');
  let cur = null, sel = {};
  const whyText = it => {
    if (it.cat === 'complete') return '<b>Por que aqui</b>Doce e bebida também aparecem dentro de todo combo, com preço de combo. Avulsos, ficam juntos numa única categoria no fim (Traster: o cardápio enxuto vende mais).';
    if (it.groups.some(g => g.id === 'bebida')) return '<b>Por que assim</b>Os complementos fazem o papel do garçom: oferecem escolhas ("qual bebida?") em vez de perguntas de sim ou não (NRAEF; Traster p. 169). Dentro do combo, a bebida sai R$ 2,00 mais barata que avulsa (Nagle: mostrar cada ganho separado, com um preço só).';
    return '<b>Por que assim</b>Só entram passos com escolha real, com mínimo e máximo claros (Metters: à prova de erro). Todos os preços terminam em ,90.';
  };
  function openSheet(it) {
    cur = it; sel = {};
    it.groups.forEach(g => { sel[g.id] = g.min === 1 && g.max === 1 && !g.multi ? [0] : (g.multi ? [] : []); });
    renderSheet(); sheet.classList.add('on'); sheetBg.classList.add('on'); if (!inPhone()) lenis && lenis.stop();
  }
  function closeSheet() { sheet.classList.remove('on'); sheetBg.classList.remove('on'); lenis && lenis.start(); }
  sheetBg.addEventListener('click', closeSheet);
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); closeBag(); closeAI(); } });
  const total = () => cur.price + cur.groups.reduce((s, g) => s + (sel[g.id] || []).reduce((a, i) => a + g.options[i].p, 0), 0);
  const valid = () => cur.groups.every(g => (sel[g.id] || []).length >= g.min);
  function renderSheet() {
    const it = cur;
    sheet.innerHTML = `<button class="x" aria-label="Fechar">×</button>
      <div class="ph${it.img ? '' : ' art ' + (it.emojiArt || '')}" style="${it.img ? `background-image:url('${it.img}')` : ''}"></div>
      <div class="side"><div class="scroll">
        <h3 id="sheetTitle">${it.name}</h3><p class="d">${it.desc}</p>
        <p style="margin-top:10px"><span class="pill">Serve ${it.serve}</span> ${it.de ? `<span class="pill red">economize ${brl(it.de - it.price)}</span>` : ''}</p>
        ${it.groups.map(g => {
          const n = (sel[g.id] || []).length, ok = n >= g.min;
          return `<div class="grp" data-g="${g.id}"><header><div><b>${g.title}</b><br><small>${g.hint}</small></div>${g.min ? `<small class="req ${ok ? 'ok' : ''}">${ok ? '✓ ok' : 'obrigatório'}</small>` : `<small>${n}/${g.max}</small>`}</header>
            ${g.options.map((o, i) => `<div class="opt ${g.max > 1 ? 'multi' : ''} ${(sel[g.id] || []).includes(i) ? 'on' : ''}" data-i="${i}"><span class="t">${o.n}${o.tag ? `<small>${o.tag}</small>` : ''}</span><span class="pp">${o.de ? `<s>${brl(o.de)}</s>` : ''}${o.p ? '+ ' + brl(o.p) : 'incluso'}</span><span class="ck"></span></div>`).join('')}</div>`;
        }).join('')}
        <div class="why">${whyText(it)}</div>
      </div><div class="bar"><button class="go" ${valid() ? '' : 'disabled'}><span>Adicionar</span><span>${brl(total())}</span></button></div></div>`;
    $('.x', sheet).onclick = closeSheet;
    $$('.grp', sheet).forEach(gel => gel.addEventListener('click', e => {
      const o = e.target.closest('.opt'); if (!o) return;
      const g = cur.groups.find(x => x.id === gel.dataset.g), i = +o.dataset.i, s = sel[g.id];
      if (g.max === 1) sel[g.id] = s[0] === i && g.min === 0 ? [] : [i];
      else if (s.includes(i)) s.splice(s.indexOf(i), 1);
      else if (s.length < g.max) s.push(i);
      else if (g.multi) { s.shift(); s.push(i); }
      const st = $('.scroll', sheet).scrollTop; renderSheet(); $('.scroll', sheet).scrollTop = st;
    }));
    $('.go', sheet).onclick = () => {
      if (!valid()) return;
      const extras = cur.groups.flatMap(g => (sel[g.id] || []).map(i => g.options[i].n));
      addToBag(cur, total(), extras); closeSheet();
    };
  }

  /* ---------------- sacola ---------------- */
  const bag = [];
  const bagEl = $('#bag'), bagBtn = $('#bagBtn');
  function addToBag(it, price, extras) {
    bag.push({ it, price, extras }); updateBag();
    gsap.fromTo(bagBtn, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  }
  function updateBag() {
    const tot = bag.reduce((s, b) => s + b.price, 0);
    $('#bagCount').textContent = bag.length; $('#bagTotal').textContent = brl(tot);
    bagBtn.classList.toggle('on', bag.length > 0);
    const hasDrink = bag.some(b => b.extras.some(x => /Coca|Guaran|Fanta/.test(x)) || /coca|guarana|trio|4-em|super|combinho/.test(b.it.id));
    const hasSweet = bag.some(b => b.extras.some(x => /Brigadeiro|Churros/.test(x)) || /brigadeiro|churros|4-em/.test(b.it.id));
    const doAssistente = bag.some(b => b.extras.includes('Montado pelo Assistente N1'));
    const up = doAssistente ? null : !hasSweet ? byId('brigadeiro') : !hasDrink ? byId('coca') : null;
    const goal = 99, pct = Math.min(100, tot / goal * 100);
    bagEl.innerHTML = `<header><h3>Sacola</h3><button aria-label="Fechar" style="font-size:26px" id="bagX">×</button></header>
      <div class="prog">${tot >= goal ? '🎉 <b>Frete grátis liberado</b> (benefício do app)' : `Faltam <b>${brl(goal - tot)}</b> pro frete grátis <small>(no app)</small>`}<div class="t"><i style="width:${pct}%"></i></div></div>
      ${up && bag.length ? `<div class="up"><div class="ph ${up.img ? '' : 'art ' + up.emojiArt}" style="${up.img ? `background-image:url('${up.img}')` : ''}"></div><div><b style="font-size:14px">${up.id === 'brigadeiro' ? 'Fecha com um doce?' : 'Faltou a bebida gelada'}</b><br><small style="color:var(--mute)">${up.name} · ${brl(up.price)}</small></div><button id="upAdd">Adicionar</button></div>` : ''}
      <div class="list">${bag.length ? bag.map((b, i) => `<div class="li"><div><b>${b.it.name}</b><small>${b.extras.join(' · ') || '—'}</small><button class="rm" data-i="${i}">Remover</button></div><b>${brl(b.price)}</b></div>`).join('') : '<p class="empty">Sua sacola está vazia.</p>'}</div>
      <footer><div class="tot"><span>Total</span><span>${brl(tot)}</span></div><button class="pay" id="payBtn">Ir para o pagamento</button></footer>`;
    $('#bagX').onclick = closeBag;
    $$('.rm', bagEl).forEach(b => b.onclick = () => { bag.splice(+b.dataset.i, 1); updateBag(); });
    const ua = $('#upAdd'); if (ua) ua.onclick = () => { bag.push({ it: up, price: up.price, extras: [] }); updateBag(); };
    $('#payBtn').onclick = () => { $('#payBtn').textContent = 'Protótipo: aqui entra o checkout do iFood ou do app'; };
  }
  const openBag = () => { updateBag(); bagEl.classList.add('on'); if (!inPhone()) lenis && lenis.stop(); };
  function closeBag() { bagEl.classList.remove('on'); lenis && lenis.start(); }
  bagBtn.onclick = openBag;

  /* ---------------- ASSISTENTE N1 (IA) ---------------- */
  const AS = window.N1Assist;
  function makeChat(body, opts = {}) {
    const auto = !!opts.auto;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const scroll = () => body.scrollTop = body.scrollHeight;
    async function bot(html, d = 650) {
      const t = document.createElement('div'); t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); scroll();
      await wait(auto ? d : d * 0.8); t.className = 'msg bot'; t.innerHTML = html; scroll();
    }
    const me = txt => { const m = document.createElement('div'); m.className = 'msg me'; m.textContent = txt; body.appendChild(m); scroll(); };
    function ask(options, autoPick) {
      return new Promise(res => {
        const w = document.createElement('div'); w.className = 'qr';
        options.forEach((o, i) => { const b = document.createElement('button'); b.textContent = o; b.onclick = () => { w.remove(); me(o); res(i); }; w.appendChild(b); });
        body.appendChild(w); scroll();
        if (auto) setTimeout(() => { const b = w.children[autoPick]; if (b) { b.style.background = 'var(--y)'; setTimeout(() => b.click(), 380); } }, 1100);
      });
    }
    async function run(pick = [2, 2, 0]) {
      body.innerHTML = '';
      await bot('E aí! Sou o <b>N1</b> \u{1f357} Me fala três coisinhas que eu monto o pedido perfeito em 10 segundos.', 500);
      await bot('Quantas pessoas vão comer?', 500);
      const pessoas = await ask(AS.GRUPO.map(g => g.label), pick[0]);
      let grande = null;
      if (AS.GRUPO[pessoas].grande) { await bot('Opa, galera! Quantas pessoas?', 450); grande = await ask(AS.GRANDE.map(g => g.label), pick[3] || 0); }
      await bot('E o tamanho da fome? \u{1f605}');
      const fome = await ask(AS.FOME.map(f => f.label), pick[1]);
      await bot('É pra quê?');
      const ocasiao = await ask(AS.OCASIAO.map(o => o.label), pick[2]);
      const pl = AS.plano({ pessoas, grande, fome, ocasiao, hora: new Date().getHours() }, allItems);
      await bot(pl.intro, 700);
      const rec = document.createElement('div'); rec.className = 'rec msg';
      rec.innerHTML = pl.opcoes.map(x => '<div class="o ' + (x.o === pl.rec ? 'best' : '') + '"><div class="ph" style="background-image:url(\'' + x.o.img + '\')"></div><div><b>' + x.o.nome + '</b><small>' + x.papel + ' · ' + 'alimenta ~' + pl.alimenta(x.o) + (pl.justo(x.o) ? ' (fica justo)' : '') + ' - ' + brl(pl.porPessoa(x.o)) + '/pessoa</small></div><span class="pz">' + brl(x.o.price) + '</span></div>').join('');
      body.appendChild(rec); scroll();
      // um botão para cada opção (recomendado primeiro)
      const escolhas = [pl.rec, pl.top, pl.econ].filter(Boolean);
      const rotulo = o => o === pl.rec ? (escolhas.length > 1 ? 'Quero o recomendado' : 'Quero esse') : o === pl.top ? 'Quero o completão' : 'Quero o mais em conta';
      const chosen = escolhas[await ask(escolhas.map(rotulo), pick[4] || 0)];
      const ex = pl.extra(chosen);
      await bot(ex.texto);
      const b = ex.botoes[await ask(ex.botoes.map(x => x.label), 0)];
      const aceitou = b.qtd > 0;
      const final = aceitou && ex.tipo === 'troca' ? ex.troca : chosen;
      const somaExtra = aceitou && ex.tipo !== 'troca' ? b.total : 0;
      const nomeExtra = somaExtra ? b.nome : '';
      const total = Math.round((final.price + somaExtra) * 100) / 100;
      if (!auto && opts.onAdd) { // agrupa itens iguais numa linha só (ex.: "4× Prato feito N1")
        const cont = {}; final.ids.forEach(id => cont[id] = (cont[id] || 0) + 1);
        Object.keys(cont).forEach((id, k) => {
          const it = byId(id), q = cont[id], prato = final.prato && id === 'tradicional';
          const nome = (q > 1 ? q + '× ' : '') + (prato ? 'Prato feito N1' : it.name);
          const notas = ['Montado pelo Assistente N1'].concat(prato ? ['Cada um escolhe: Tradicional, Parmegiana ou Frito com Salada (esses dois saem R$ 1,00 a menos)'] : [], k === 0 && nomeExtra ? [nomeExtra] : []);
          opts.onAdd(Object.assign({}, it, { name: nome }), Math.round((it.price * q + (k === 0 ? somaExtra : 0)) * 100) / 100, notas);
        });
      }
      await bot('Fechado! <b>' + final.nome + '</b>' + (nomeExtra ? ' + ' + nomeExtra : '') + ' = <b>' + brl(total) + '</b>. ' + (auto ? 'Chega em 35–45 min. Te aviso: empanando → fritando → saiu \u{1f6f5}' : 'Já coloquei na sua sacola \u{1f609}'), 800);
      if (auto) { await wait(3200); return run([[3, 2, 0], [0, 1, 1], [1, 0, 1], [4, 1, 0, 3]][Math.floor(Math.random() * 4)]); }
      const again = document.createElement('div'); again.className = 'qr';
      again.innerHTML = '<button>Montar outro</button><button>Ver sacola</button>';
      again.children[0].onclick = () => run();
      again.children[1].onclick = () => { closeAI(); const t = $('#cardapio'); if (inPhone()) { lenis ? lenis.scrollTo(t, { duration: 1 }) : t.scrollIntoView(); setTimeout(openBag, 700); } else openBag(); };
      body.appendChild(again); scroll();
    }
    return { run };
  }
  const aiFab = $('#aiFab'), aiPanel = $('#aiPanel');
  const chat = makeChat($('#aiBody'), { onAdd: (it, price, extras) => addToBag(it, price, extras) });
  let aiStarted = false;
  aiFab.onclick = () => { aiPanel.classList.toggle('on'); aiFab.classList.remove('hint'); if (!aiStarted) { aiStarted = true; chat.run(); } };
  function closeAI() { aiPanel.classList.remove('on'); }
  $('#aiClose').onclick = closeAI;
  setTimeout(() => aiFab.classList.remove('hint'), 9000);

  // (a seção App + IA saiu do site; o Assistente N1 continua na bolinha do canto)

  /* ---------------- CMV 28%: dumbbell + tabela ---------------- */
  (() => {
    const rows = ['coca', '4-em-n1', 'super-combo', 'combo-p', 'combo-g', 'combo-m', 'bites-m', 'dupla', 'classic', 'salada', 'parmegiana'].map(byId);
    const X0 = 15, X1 = 50, c01 = v => Math.max(0, Math.min(1, v)), px = v => (c01((v - X0) / (X1 - X0)) * 100).toFixed(2) + '%';
    const short = n => n.split(' · ')[0];
    $('#dumbRows').innerHTML = rows.map(r => {
      const a = Math.min(r.cmvHoje, r.cmv), b = Math.max(r.cmvHoje, r.cmv);
      const dir = r.price < r.hoje ? 'preço ↓' : r.price > r.hoje ? 'preço ↑' : 'igual';
      const tipTxt = '<b>' + short(r.name) + '</b><br>Hoje: ' + brl(r.hoje) + ' · CMV ' + fmt(r.cmvHoje, 1) + '%<br>Novo: ' + brl(r.price) + ' · CMV ' + fmt(r.cmv, 1) + '%';
      return '<div class="drow" tabindex="0" data-tip="' + tipTxt.replace(/"/g, '&quot;') + '">' +
        '<div class="nm">' + short(r.name) + '<small>' + brl(r.hoje) + ' → ' + brl(r.price) + ' · ' + dir + '</small></div>' +
        '<div class="track"><span class="ref" style="left:' + px(28) + '"></span><span class="bar" style="left:' + px(a) + ';width:calc(' + px(b) + ' - ' + px(a) + ')"></span><span class="d o" style="left:' + px(r.cmvHoje) + '"></span><span class="d f" style="left:' + px(r.cmv) + '"></span></div>' +
        '<div class="val">' + fmt(r.cmvHoje, 1) + '% → <b>' + fmt(r.cmv, 1) + '%</b></div></div>';
    }).join('');
    $('#dumbAxis').innerHTML = [15, 20, 25, 28, 35, 40, 45, 50].map(v => '<span style="left:' + px(v) + ';' + (v === 28 ? 'color:var(--r);font-weight:800' : '') + '">' + v + '%</span>').join('');
    const tip = $('#dumbTip'), fig = $('.dumb');
    const show = (row, x, y) => { tip.innerHTML = row.dataset.tip; tip.classList.add('on'); const fr = fig.getBoundingClientRect(); tip.style.left = Math.min(fr.width - 250, Math.max(8, x - fr.left + 14)) + 'px'; tip.style.top = (y - fr.top + 14) + 'px'; };
    $$('.drow').forEach(r => { r.addEventListener('pointermove', e => show(r, e.clientX, e.clientY)); r.addEventListener('pointerleave', () => tip.classList.remove('on')); r.addEventListener('focus', () => { const bb = r.getBoundingClientRect(); show(r, bb.left + bb.width / 2, bb.bottom - 10); }); r.addEventListener('blur', () => tip.classList.remove('on')); });
    const all = categories.flatMap(c => c.items);
    $('#cmvTable').innerHTML = '<thead><tr><th>Item</th><th>Hoje</th><th>CMV hoje</th><th>Novo</th><th>CMV novo</th></tr></thead><tbody>' +
      all.map(i => '<tr><td>' + short(i.name) + '</td><td>' + (i.hoje ? brl(i.hoje) : '—') + '</td><td class="' + (i.cmvHoje > 28 ? 'hi' : '') + '">' + (i.cmvHoje ? fmt(i.cmvHoje, 1) + '%' : '—') + '</td><td>' + brl(i.price) + '</td><td class="ok">' + fmt(i.cmv, 1) + '%</td></tr>').join('') + '</tbody>';
  })();

  /* ---------------- ponte do ticket ---------------- */
  const maxv = Math.max(...diag.ticketPontes.map(x => x.v));
  $('#bridgeRows').innerHTML = diag.ticketPontes.map(x => `<div class="brow"><div><b>${x.k}</b><small>${x.how}</small></div><div class="t"><i data-w="${x.v / maxv * 100}"></i></div><div class="v">+${brl(x.v)}</div></div>`).join('');
  ScrollTrigger.create({ trigger: '#bridgeRows', start: 'top 80%', once: true, onEnter: () => $$('#bridgeRows i').forEach((i, k) => setTimeout(() => i.style.width = i.dataset.w + '%', k * 150)) });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
