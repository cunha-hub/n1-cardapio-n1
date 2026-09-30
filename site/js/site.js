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
    $('#funnelList').innerHTML = F.map((s, i) => '<li><span class="t">' + s.k + '</span><span class="v">' + fmt(s.v, s.v % 1 ? 1 : 0) + '</span><span class="b"><i style="width:' + s.v + '%"></i></span>' + (i ? '<span class="dr">\u2212' + fmt(100 - s.v / F[i - 1].v * 100, 0) + '% saem nesta etapa</span>' : '') + '</li>').join('');
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

  /* ---------------- ANTES \u00D7 DEPOIS: corre\u00E7\u00F5es objetivas ---------------- */
  const fixes = [
    ['03_favoritos_duplicados.jpg', 'Super Combo com 4 pre\u00E7os diferentes', '1 an\u00FAncio e 1 pre\u00E7o nas 72 lojas'],
    ['05_modal_combo_m_complementos.jpg', 'Combo sem bebida, doce ou troca', 'Complementos que vendem, todos com CMV \u2264 28%'],
    ['07_sobremesas_sem_foto.jpg', 'Doce sem foto, na 12\u00AA categoria', 'Doce dentro de todo combo'],
    ['02_super_ofertas.jpg', '13 categorias e "Tags:" na descri\u00E7\u00E3o', '7 categorias por ocasi\u00E3o, texto curto']
  ];
  $('#fixes').innerHTML = fixes.map(f => '<button class="fix" data-rv data-src="assets/prints/' + f[0] + '"><span class="th" style="background-image:url(\'assets/prints/' + f[0] + '\')"></span><span><s>' + f[1] + '</s><b>' + f[2] + '</b></span></button>').join('');
  $$('#fixes [data-rv]').forEach(el => rvEls.push(el));
  const lb = $('#lightbox');
  $('#fixes').addEventListener('click', e => { const b = e.target.closest('.fix'); if (!b) return; $('img', lb).src = b.dataset.src; lb.classList.add('on'); });
  lb.addEventListener('click', () => lb.classList.remove('on'));

  /* ---------------- ANTES × DEPOIS ---------------- */
  const mockItem = (n, d, pr, de, img, cls = '', extra = '') => `<div class="it ${cls}"><div><h5>${n}</h5><p>${d}</p>${extra}<div class="pr">${pr}${de ? `<s>${de}</s>` : ''}</div></div><div class="ph" style="background-image:url('${img || ''}')"></div></div>`;
  $('#paneBefore').innerHTML = `<div class="mock"><div class="top" style="background-image:url('${IMG.capa}')"></div>
    <div class="store"><img src="${IMG.logo}" alt=""><div><b>N1 Chicken - Frango Frito Crocante</b><br><span>★ 4.8</span></div></div>
    <div class="tabs"><b>Destaques</b><span>Receba Cupons…</span><span>Super Ofertas N1</span><span>Os favoritos…</span><span>Frango Frito…</span></div>
    <div class="sec">Receba Cupons Exclusivos</div>
    ${mockItem('Cupom Exclusivo', 'Favorite o melhor Frango Frito do Brasil e receba Cupons Exclusivos! (item apenas informativo, favor não efetuar a compra)', 'R$ 0,01', '', '', 'bad')}
    <div class="sec">Super Ofertas N1</div>
    ${mockItem('2 Burguers + Chicken Bites Individual', '2 Burguers à sua escolha + Chicken Bites Individual. Tags: hambúrguer, burguer, burger, lanche, salada…', 'R$ 52,90', 'R$ 67,99', IMG.burgersBites, 'bad')}
    ${mockItem('Kit 4 Maioneses 40%off', 'Leve 4 Maioneses caseiras do N1 de sua preferência com um desconto especial.', 'R$ 14,90', 'R$ 24,99', IMG.maioneses)}
    ${mockItem('Super Combo', 'Delicie-se com essa oferta especial: escolha dois burgers de sua preferência…', 'A partir de R$ 79,90', 'R$ 102,99', IMG.superCombo, 'bad')}
    <div class="sec">Os favoritos do N1</div>
    ${mockItem('Trio Burguer N1', 'Escolha seu burger… tags: promoção, oferta, desconto, batata frita, aipim…', 'A partir de R$ 44,90', 'R$ 51,99', IMG.trio, 'bad')}
    ${mockItem('Super Combo', 'Delicie-se com essa oferta especial…', 'A partir de R$ 79,90', 'R$ 102,99', IMG.superCombo, 'bad')}
    ${mockItem('Combo M - indicamos para 2 a 3 pessoas', 'Ideal para compartilhar… Tags: combo, promoção, jantar, maionese, peito de frango…', 'A partir de R$ 79,90', 'R$ 91,49', IMG.comboM)}</div>`;
  const aft = (id, cls) => { const i = byId(id); return mockItem(i.name, `Serve ${i.serve} ${i.serve > 1 ? 'pessoas' : 'pessoa'} · ${i.desc}`, brl(i.price), i.de ? brl(i.de) : '', i.img, cls, (i.badge ? `<span class="tag">${i.badge}</span>` : '') + (i.de ? `<span class="save">economize ${brl(i.de - i.price)}</span>` : '')); };
  $('#paneAfter').innerHTML = `<div class="mock"><div class="top" style="background-image:url('${IMG.capa}')"></div>
    <div class="store"><img src="${IMG.logo}" alt=""><div><b>N1 Chicken - Frango Frito Crocante</b><br><span>★ 4.8</span></div></div>
    <div class="tabs"><b>Só pra mim</b><span>Pra dois</span><span>Pra galera</span><span>Frango & Bites</span><span>Burgers</span></div>
    <div class="sec">Só pra mim</div>${aft('combo-p')}${aft('4-em-n1')}${aft('trio')}
    <div class="sec">Pra dois</div>${aft('super-combo')}${aft('combo-m')}${aft('dupla')}
    <div class="sec">Pra galera</div>${aft('combo-gg')}${aft('combo-g')}</div>`;
  (() => {
    const sl = $('#baSlider'), after = $('#paneAfter'), h = $('#baHandle');
    const set = pct => { pct = Math.max(0, Math.min(100, pct)); after.style.clipPath = `inset(0 0 0 ${pct}%)`; h.style.left = pct + '%'; h.setAttribute('aria-valuenow', Math.round(pct)); };
    let drag = false;
    const mv = e => { if (!drag) return; const r = sl.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    sl.addEventListener('pointerdown', e => { drag = true; sl.setPointerCapture(e.pointerId); mv(e); });
    sl.addEventListener('pointermove', mv);
    sl.addEventListener('pointerup', () => drag = false);
    h.addEventListener('keydown', e => { const v = parseFloat(h.style.left) || 50; if (e.key === 'ArrowLeft') set(v - 5); if (e.key === 'ArrowRight') set(v + 5); });
    ScrollTrigger.create({ trigger: sl, start: 'top 70%', once: true, onEnter: () => { const o = { v: 90 }; gsap.to(o, { v: 50, duration: 1.6, ease: 'expo.inOut', onUpdate: () => set(o.v) }); } });
    set(90);
  })();

  /* ---------------- CARDÁPIO ---------------- */
  const nav = $('#catNav'), list = $('#menuList');
  nav.innerHTML = categories.map((c, i) => `<button data-cat="${c.id}" class="${i ? '' : 'on'}"><span class="e">${c.emoji}</span><span>${c.name}</span></button>`).join('') +
    `<p class="note"><b>${categories.reduce((s, c) => s + c.items.length, 0)} itens</b> em ${categories.length} categorias, contra 13 categorias e 284 produtos hoje. O maior vem primeiro (âncora) e o selo fica no do meio.</p>`;
  list.innerHTML = categories.map(c => `
    <div class="cat-block" id="cat-${c.id}"><header><h3>${c.name}</h3><p>${c.sub}</p></header>
      <div class="items">${c.items.map((it, k) => card(it, k === 0 && ['pra-dois', 'galera'].includes(c.id))).join('')}</div></div>`).join('');
  function card(it, anchor) {
    const ph = it.img ? `style="background-image:url('${it.img}')"` : '';
    const art = !it.img ? ` art ${it.emojiArt || ''}` : '';
    return `<button class="card${anchor ? ' anchor' : ''}${it.badge ? ' hl' : ''}" data-id="${it.id}">
      <div class="ph${art}" ${ph}>${it.badge ? `<span class="badge pill red">${it.badge}</span>` : ''}${it.serve > 1 ? `<span class="serve pill">Serve ${it.serve}</span>` : it.cat !== 'complete' ? '<span class="serve pill">Serve 1</span>' : ''}</div>
      <div class="body"><h4>${it.name}</h4><p>${it.desc}</p><div class="meta"><span class="c">CMV ${fmt(it.cmv, 1)}%</span>${it.hoje && Math.abs(it.hoje - it.price) > .05 ? `<span class="h">hoje ${brl(it.hoje)}</span>` : ""}</div>
      <div class="foot"><div><div class="price">${brl(it.price)}${it.de ? `<s>${brl(it.de)}</s>` : ''}</div>${it.de ? `<span class="save">economize ${brl(it.de - it.price)}</span>` : it.serve > 1 ? `<span class="save">${brl(it.price / it.serve)}/pessoa</span>` : ''}</div><span class="add">+</span></div></div></button>`;
  }
  $$('.cat-nav button').forEach(b => b.addEventListener('click', () => { const t = $('#cat-' + b.dataset.cat); lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.2 }) : t.scrollIntoView({ behavior: 'smooth' }); }));
  const catIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.cat-nav button').forEach(b => b.classList.toggle('on', 'cat-' + b.dataset.cat === e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  $$('.cat-block').forEach(b => catIO.observe(b));
  list.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openSheet(byId(c.dataset.id)); });

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
    renderSheet(); sheet.classList.add('on'); sheetBg.classList.add('on'); lenis && lenis.stop();
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
    const up = !hasSweet ? byId('brigadeiro') : !hasDrink ? byId('coca') : null;
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
  const openBag = () => { updateBag(); bagEl.classList.add('on'); lenis && lenis.stop(); };
  function closeBag() { bagEl.classList.remove('on'); lenis && lenis.start(); }
  bagBtn.onclick = openBag;

  /* ---------------- ASSISTENTE N1 (IA) ---------------- */
  const REC = {
    1: { b: ['combinho', '4-em-n1', 'combo-p'], n: ['trio', '4-em-n1', 'combo-p'], c: ['4-em-n1', 'combo-p', 'combo-m'] },
    2: { b: ['dupla', 'dupla-bites', 'combo-m'], n: ['dupla-bites', 'combo-m', 'super-combo'], c: ['combo-m', 'super-combo', 'combo-g'] },
    3: { b: ['3-burgers', 'combo-m', 'combo-g'], n: ['combo-m', 'combo-g', 'combo-gg'], c: ['combo-m', 'combo-g', 'combo-gg'] },
    5: { b: ['combo-g', 'combo-gg', 'combo-gg'], n: ['combo-g', 'combo-gg', 'combo-gg'], c: ['combo-g', 'combo-gg', 'combo-gg'] }
  };
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
      await bot('E aí! Sou o <b>N1</b> 🍗 Me fala duas coisinhas que eu monto o pedido perfeito em 10 segundos.', 500);
      await bot('Quantas pessoas vão comer?', 500);
      const p = [1, 2, 3, 5][await ask(['Só eu', '2', '3 a 4', '5 ou mais'], pick[0])];
      await bot('E o tamanho da fome? 😅');
      const f = ['b', 'n', 'c'][await ask(['Beliscar', 'Fome normal', 'Fome de campeão'], pick[1])];
      await bot('É pra quê?');
      const oc = await ask(['Jogo 🏆', 'Série/filme', 'Almoço', 'Pular'], pick[2]);
      const ids = (oc === 2 && p === 1) ? ['tradicional', 'parmegiana', 'combo-p'] : REC[p][f];
      const [e, r, t] = ids.map(byId);
      const same = ids[1] === ids[2];
      await bot(`${p === 1 ? 'Pra você' : `Pra ${p === 5 ? '5 ou mais' : p === 3 ? '3 a 4' : 'dois'}`}${f === 'c' ? ' com fome de campeão' : ''}, quem pede comigo costuma levar isto:`, 700);
      const rec = document.createElement('div'); rec.className = 'rec msg';
      const opt = (i, cls, lab) => `<div class="o ${cls}"><div class="ph" style="background-image:url('${i.img}')"></div><div><b>${i.name.split(' · ')[0]}</b><small>${lab} · serve ${i.serve}${i.serve > 1 ? ` · ${brl(i.price / i.serve)}/pessoa` : ''}</small></div><span class="pz">${brl(i.price)}</span></div>`;
      rec.innerHTML = (same ? '' : opt(t, '', 'Completão')) + opt(r, 'best', 'O que eu levaria') + opt(e, '', 'Econômico');
      body.appendChild(rec); scroll();
      const c = await ask(['Quero o recomendado', 'Ver outro'], 0);
      const chosen = c === 0 ? r : e;
      const nDrinks = Math.min(p, 4), extra = oc === 0 ? 'Dia de jogo pede Coca gelada. Incluo ' + nDrinks + (nDrinks > 1 ? ' latas' : ' lata') + ' por <b>+ ' + brl(nDrinks * 11.9) + '</b>?' : 'Um brigadeiro de colher pra fechar? Dentro do combo sai <b>+ R$ 7,90</b>.';
      await bot(extra);
      const up = await ask(['Bora!', 'Não, valeu'], 0);
      const extraName = oc === 0 ? nDrinks + '× Coca-Cola lata' : 'Brigadeiro N1 de colher';
      const price = chosen.price + (up === 0 ? (oc === 0 ? nDrinks * 11.9 : 7.9) : 0);
      if (!auto && opts.onAdd) opts.onAdd(chosen, price, ['Montado pelo Assistente N1'].concat(up === 0 ? [extraName] : []));
      await bot(`Fechado! <b>${chosen.name.split(' · ')[0]}</b>${up === 0 ? ' + ' + extraName : ''} = <b>${brl(price)}</b>. ${auto ? 'Chega em 35–45 min. Te aviso: empanando → fritando → saiu 🛵' : 'Já coloquei na sua sacola 😉'}`, 800);
      if (auto) { await wait(3200); return run([[3, 1, 0], [1, 2, 1], [2, 2, 0]][Math.floor(Math.random() * 3)]); }
      const again = document.createElement('div'); again.className = 'qr';
      again.innerHTML = '<button>Montar outro</button><button>Ver sacola</button>';
      again.children[0].onclick = () => run(); again.children[1].onclick = () => { closeAI(); openBag(); };
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

  // demo automática dentro do celular
  const pc = makeChat($('#phoneChatBody'), { auto: true });
  $('#apCard1').style.backgroundImage = `url('${IMG.comboM}')`; $('#apCard2').style.backgroundImage = `url('${IMG.comboG}')`;
  ScrollTrigger.create({ trigger: '.phone', start: 'top 70%', once: true, onEnter: () => setTimeout(() => { $('#phoneChat').classList.add('on'); pc.run([3, 1, 0]); }, 900) });
  $('#phoneFab').onclick = () => $('#phoneChat').classList.toggle('on');
  (() => { let s = 1 * 3600 + 42 * 60 + 10; setInterval(() => { s = s > 0 ? s - 1 : 7200; const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor(s % 3600 / 60)).padStart(2, '0'), x = String(s % 60).padStart(2, '0'); $('#gameClock').textContent = `${h}:${m}:${x}`; }, 1000); })();

  /* ---------------- CMV 28%: dumbbell + tabela ---------------- */
  (() => {
    const rows = ['coca', '4-em-n1', 'super-combo', 'combo-p', 'combo-g', 'combo-m', 'bites-m', 'dupla', 'classic', 'salada', 'parmegiana'].map(byId);
    const X0 = 15, X1 = 50, c01 = v => Math.max(0, Math.min(1, v)), px = v => (c01((v - X0) / (X1 - X0)) * 100).toFixed(2) + '%';
    const short = n => n.split(' \u00B7 ')[0];
    $('#dumbRows').innerHTML = rows.map(r => {
      const a = Math.min(r.cmvHoje, r.cmv), b = Math.max(r.cmvHoje, r.cmv);
      const dir = r.price < r.hoje ? 'pre\u00E7o \u2193' : r.price > r.hoje ? 'pre\u00E7o \u2191' : 'igual';
      const tipTxt = '<b>' + short(r.name) + '</b><br>Hoje: ' + brl(r.hoje) + ' \u00B7 CMV ' + fmt(r.cmvHoje, 1) + '%<br>Novo: ' + brl(r.price) + ' \u00B7 CMV ' + fmt(r.cmv, 1) + '%';
      return '<div class="drow" tabindex="0" data-tip="' + tipTxt.replace(/"/g, '&quot;') + '">' +
        '<div class="nm">' + short(r.name) + '<small>' + brl(r.hoje) + ' \u2192 ' + brl(r.price) + ' \u00B7 ' + dir + '</small></div>' +
        '<div class="track"><span class="ref" style="left:' + px(28) + '"></span><span class="bar" style="left:' + px(a) + ';width:calc(' + px(b) + ' - ' + px(a) + ')"></span><span class="d o" style="left:' + px(r.cmvHoje) + '"></span><span class="d f" style="left:' + px(r.cmv) + '"></span></div>' +
        '<div class="val">' + fmt(r.cmvHoje, 1) + '% \u2192 <b>' + fmt(r.cmv, 1) + '%</b></div></div>';
    }).join('');
    $('#dumbAxis').innerHTML = [15, 20, 25, 28, 35, 40, 45, 50].map(v => '<span style="left:' + px(v) + ';' + (v === 28 ? 'color:var(--r);font-weight:800' : '') + '">' + v + '%</span>').join('');
    const tip = $('#dumbTip'), fig = $('.dumb');
    const show = (row, x, y) => { tip.innerHTML = row.dataset.tip; tip.classList.add('on'); const fr = fig.getBoundingClientRect(); tip.style.left = Math.min(fr.width - 250, Math.max(8, x - fr.left + 14)) + 'px'; tip.style.top = (y - fr.top + 14) + 'px'; };
    $$('.drow').forEach(r => { r.addEventListener('pointermove', e => show(r, e.clientX, e.clientY)); r.addEventListener('pointerleave', () => tip.classList.remove('on')); r.addEventListener('focus', () => { const bb = r.getBoundingClientRect(); show(r, bb.left + bb.width / 2, bb.bottom - 10); }); r.addEventListener('blur', () => tip.classList.remove('on')); });
    const all = categories.flatMap(c => c.items);
    $('#cmvTable').innerHTML = '<thead><tr><th>Item</th><th>Hoje</th><th>CMV hoje</th><th>Novo</th><th>CMV novo</th></tr></thead><tbody>' +
      all.map(i => '<tr><td>' + short(i.name) + '</td><td>' + (i.hoje ? brl(i.hoje) : '\u2014') + '</td><td class="' + (i.cmvHoje > 28 ? 'hi' : '') + '">' + (i.cmvHoje ? fmt(i.cmvHoje, 1) + '%' : '\u2014') + '</td><td>' + brl(i.price) + '</td><td class="ok">' + fmt(i.cmv, 1) + '%</td></tr>').join('') + '</tbody>';
  })();

  /* ---------------- ponte do ticket ---------------- */
  const maxv = Math.max(...diag.ticketPontes.map(x => x.v));
  $('#bridgeRows').innerHTML = diag.ticketPontes.map(x => `<div class="brow"><div><b>${x.k}</b><small>${x.how}</small></div><div class="t"><i data-w="${x.v / maxv * 100}"></i></div><div class="v">+${brl(x.v)}</div></div>`).join('');
  ScrollTrigger.create({ trigger: '#bridgeRows', start: 'top 80%', once: true, onEnter: () => $$('#bridgeRows i').forEach((i, k) => setTimeout(() => i.style.width = i.dataset.w + '%', k * 150)) });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
