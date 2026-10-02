/* N1 Chicken · vídeo de apresentação vertical (9:16, 70 s), feito com a skill brag-motion.
   Linguagem do vídeo de referência (promo de app): telas em card com sombra, mão que toca, contadores
   subindo, itens que pulam, título curto em dois pesos e cartela final. Conteúdo e marca da N1:
   0–28 informação (BI, funil, como é hoje, o custo) · 28–36 "E agora, apresentamos a vocês…"
   36–64 lançamento (por ocasião, combo, IA, antes × depois, por que vende mais, resultado) · 64–70 fecho.
   Trilha original em js/trilha-lancamento.js, com a mesma linha do tempo de impactos, toques e pops.
   A versão horizontal anterior está em pesquisa/video_16x9_v2.js. */
(() => {
  const W = 1080, H = 1920, END = 70;
  const Y = '#FFED00', R = '#FF0000', R2 = '#C80000', INK = '#1A0C05', PAPER = '#FFFCEB', MUTE = '#7A6A5E', Y2 = '#FFC928', SEAL = '#E2231A';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const bufA = mk(), bufB = mk(), gA = bufA.getContext('2d'), gB = bufB.getContext('2d');
  let g = gA; // contexto da cena que está sendo desenhada
  const { IMG } = window.N1;
  const ALL = window.N1.categories.flatMap(c => c.items), item = id => ALL.find(i => i.id === id) || {};
  const TR = window.N1Trilha, TAPS = TR.TAPS;

  /* ---------- utilidades ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const eInOutExpo = t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  const eOutBack = (t, s = 1.7) => t <= 0 ? 0 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const eOutCubic = t => 1 - Math.pow(1 - t, 3);
  const eInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const nf = (v, d = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const F = (w, s, it = false, fam = 'Fira Sans') => `${it ? 'italic ' : ''}${w} ${s}px "${fam}"`;
  function T(str, x, y, o = {}) {
    g.save(); g.font = F(o.w || 800, o.s || 40, o.it, o.f); g.fillStyle = o.c || INK; g.textAlign = o.a || 'left'; g.textBaseline = o.b || 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.ls || 0) + 'px';
    g.globalAlpha *= o.al == null ? 1 : o.al; g.fillText(str, x, y); g.restore();
  }
  function tw(str, w, s, it, f, ls = 0) { g.save(); g.font = F(w, s, it, f); if ('letterSpacing' in g) g.letterSpacing = ls + 'px'; const v = g.measureText(str).width; g.restore(); return v; }
  /* texto que sobe de dentro de uma máscara */
  function rise(str, x, y, p, o = {}) {
    if (p <= 0) return; const s = o.s || 80; const e = eOutExpo(clamp(p));
    g.save(); g.font = F(o.w || 900, s, o.it !== false, o.f); if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? -2) + 'px';
    const w = g.measureText(str).width; const ax = o.a === 'right' ? x - w : o.a === 'center' ? x - w / 2 : x;
    g.beginPath(); g.rect(ax - 30, y - s * 1.05, w + 80, s * 1.45); g.clip();
    g.fillStyle = o.c || INK; g.textAlign = 'left'; g.fillText(str, ax, y + (1 - e) * s * 1.2); g.restore();
  }
  /* título em dois pesos, como na referência ("Make it / yours.") */
  function head(l1, l2, y1, y2, lt, o = {}) {
    const t0 = o.t ?? .05, a = o.a || 'left', x = a === 'center' ? W / 2 : 90;
    rise(l1, x, y1, seg(lt, t0, t0 + .6), { s: o.s1 || 88, w: 700, it: false, c: o.c1 || INK, a, ls: -1 });
    rise(l2, x, y2, seg(lt, t0 + .12, t0 + .75), { s: o.s2 || 170, w: 900, c: o.c2 || R, a });
  }
  const EXT = 60;
  const bg = c => { g.fillStyle = c; g.fillRect(-EXT, -EXT, W + EXT * 2, H + EXT * 2); };
  function rr(c, x, y, w, h, r, keep) { r = Math.min(r, w / 2, h / 2); if (!keep) c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function cover(im, x, y, w, h, fx = .5, fy = .5) { if (!im || !im.complete || !im.naturalWidth) { g.fillStyle = Y2; g.fillRect(x, y, w, h); return; } const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; g.drawImage(im, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih); }
  function wrap(str, x, y, maxW, lh, o) { g.save(); g.font = F(o.w || 400, o.s || 24, o.it, o.f); const words = str.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { T(line, x, yy, o); line = w; yy += lh; } else line = t; } if (line) T(line, x, yy, o); g.restore(); return yy; }
  function pillW(str, s = 20, px = 28) { return tw(str.toUpperCase(), 800, s, false, 'Dosis', 1.5) + px; }
  function pill(str, x, y, o = {}) { const s = o.s || 20, px = o.px || 28, w = pillW(str, s, px), h = s * 1.8; const ax = o.a === 'right' ? x - w : o.a === 'center' ? x - w / 2 : x; g.save(); g.font = F(800, s, false, 'Dosis'); if ('letterSpacing' in g) g.letterSpacing = '1.5px'; rr(g, ax, y - h / 2, w, h, h / 2); g.fillStyle = o.bg || Y; g.globalAlpha *= o.al == null ? 1 : o.al; g.fill(); if (o.bd) { g.strokeStyle = o.bd; g.lineWidth = 3; g.stroke(); } g.fillStyle = o.c || INK; g.textBaseline = 'middle'; g.fillText(str.toUpperCase(), ax + px / 2, y + 1); g.restore(); return w; }
  function card(x, y, w, h, o = {}) { g.save(); g.shadowColor = o.sh || 'rgba(26,12,5,.28)'; g.shadowBlur = o.blur ?? 60; g.shadowOffsetY = o.oy ?? 26; rr(g, x, y, w, h, o.r ?? 44); g.fillStyle = o.bg || '#fff'; g.fill(); g.restore(); }
  function T3(str, x, y, o = {}) {
    g.save(); g.font = F(o.w || 900, o.s || 120, o.it !== false, o.f); g.textAlign = o.a || 'center'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? -2) + 'px';
    g.globalAlpha *= o.al == null ? 1 : o.al;
    const d = o.d ?? Math.round((o.s || 120) * .06);
    g.fillStyle = o.ex || INK; for (let k = d; k > 0; k--) g.fillText(str, x + k * .55, y + k);
    if (o.st) { g.lineWidth = o.stw || 8; g.strokeStyle = o.st; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = o.c || Y; g.fillText(str, x, y); g.restore();
  }
  /* letras que pulam da tela: cada letra vem do fundo, passa do tamanho e assenta */
  function pop(str, x0, y, lt, t0, o = {}) {
    if (lt < t0) return 0;
    const sz = o.s || 120, ls = o.ls ?? -2, ch = [...str];
    g.save(); g.font = F(o.w || 900, sz, o.it !== false, o.f); if ('letterSpacing' in g) g.letterSpacing = '0px';
    const ws = ch.map(c => g.measureText(c).width + ls), tw2 = ws.reduce((a, b) => a + b, 0) - ls; g.restore();
    let x = o.a === 'left' ? x0 : x0 - tw2 / 2;
    ch.forEach((c, k) => {
      const st = t0 + k * (o.stg ?? .035), p = seg(lt, st, st + (o.dur || .42));
      if (p > 0 && c !== ' ') {
        const e = eOutBack(p, o.back ?? 2.2), sc = lerp(o.from ?? .15, 1, e), cx = x + ws[k] / 2, cy = y - sz * .35, bob = o.bob ? Math.sin((lt - t0) * 3 + k * .7) * o.bob : 0;
        g.save(); g.translate(cx, cy + bob); g.rotate((1 - Math.min(1, e)) * (k % 2 ? .3 : -.3)); g.scale(sc, sc); g.translate(-cx, -cy);
        T3(c, cx, y, Object.assign({}, o, { a: 'center', ls: 0, al: clamp(p * 4) })); g.restore();
      }
      x += ws[k];
    });
    return tw2;
  }
  function confete(u, cx, cy, n = 150, sd = 0) {
    for (let k = 0; k < n; k++) {
      const tt = u - rnd(k + sd + 90) * .1; if (tt <= 0) continue;
      const a = rnd(k + sd) * Math.PI * 2, v = 700 + rnd(k + sd + 50) * 1400, d = v * (1 - Math.exp(-tt * 2.4)) / 2.4;
      const x = cx + Math.cos(a) * d * .8, y = cy + Math.sin(a) * d + 420 * tt * tt, al = clamp(2.4 - tt); if (al <= 0) continue;
      g.save(); g.translate(x, y); g.rotate(tt * (4 + rnd(k + 7) * 8) + k); g.scale(1, Math.cos(tt * (5 + rnd(k + 2) * 7)));
      g.globalAlpha = al; g.fillStyle = [Y, R, '#fff', INK, Y2][k % 5]; g.fillRect(-9, -5, 16 + rnd(k + 3) * 12, 10); g.restore();
    }
  }
  function rays(cx, cy, rot, n, col, len = 2200, half = 140) { g.save(); g.translate(cx, cy); g.rotate(rot); g.fillStyle = col; for (let k = 0; k < n; k++) { g.rotate(Math.PI * 2 / n); g.beginPath(); g.moveTo(0, 0); g.lineTo(len, -half); g.lineTo(len, half); g.closePath(); g.fill(); } g.restore(); }
  function check(x, y, p, c = R, r = 22) { if (p <= 0) return; g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = c; g.globalAlpha = clamp(p * 3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = r * .26; g.lineCap = g.lineJoin = 'round'; g.beginPath(); const e = clamp(p * 1.6), k = r / 18; g.moveTo(x - 8 * k, y); if (e > 0) g.lineTo(x - 8 * k + 6 * k * clamp(e * 2), y + 6 * k * clamp(e * 2)); if (e > .5) g.lineTo(x - 2 * k + 12 * k * clamp((e - .5) * 2), y + 6 * k - 13 * k * clamp((e - .5) * 2)); g.stroke(); g.restore(); }
  function star(x, y, r, rot, al = 1) { g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= al; g.shadowColor = 'rgba(255,237,0,.9)'; g.shadowBlur = r * 1.4; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * .45 : r; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.closePath(); g.fillStyle = Y; g.fill(); g.restore(); }

  /* ---------- imagens ---------- */
  const load = src => { const i = new Image(); i.crossOrigin = 'anonymous'; i.src = src; return i; };
  const im = {}; Object.entries(IMG).forEach(([k, v]) => im[k] = load(v));
  const imOf = id => { const u = item(id).img; const k = Object.keys(IMG).find(k => IMG[k] === u); return k ? im[k] : null; };
  const prints = {}; ['03_favoritos_duplicados', '05_modal_combo_m_complementos', '07_sobremesas_sem_foto', '00_loja_burgers_topo'].forEach(k => prints[k] = load(`assets/prints/${k}.jpg`));
  const grain = document.createElement('canvas'); grain.width = grain.height = 256; { const gc = grain.getContext('2d'), d = gc.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; } gc.putImageData(d, 0, 0); }
  // a arte do selo vem num quadrado com cantos brancos: amplia (LK) para o vermelho tocar a borda do círculo
  const LK = 1.084;
  function logoCircle(x, y, r) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = SEAL; g.fill(); g.clip(); if (im.logo.complete) g.drawImage(im.logo, x - r * LK, y - r * LK, r * 2 * LK, r * 2 * LK); g.restore(); }
  function seal(x, y, r, rot = 0, sc = 1) { if (sc <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = r * .3; g.shadowOffsetY = r * .1; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = SEAL; g.fill(); g.shadowColor = 'transparent'; logoCircle(0, 0, r); g.restore(); }

  /* ---------- a mão que toca (como na referência) ---------- */
  const pressAt = t => { let p = 0; for (const tp of TAPS) p = Math.max(p, 1 - Math.abs(t - tp) / .11); return clamp(p); };
  function track(t, keys) { // keys: [t, x, y]
    if (t <= keys[0][0]) return keys[0]; for (let k = 1; k < keys.length; k++) if (t <= keys[k][0]) { const a = keys[k - 1], b = keys[k], e = eInOutCubic(seg(t, a[0], b[0])); return [t, lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
    return keys[keys.length - 1];
  }
  function hand(t, keys) {
    const [, x, y] = track(t, keys), pr = pressAt(t);
    for (const tp of TAPS) { const q = seg(t, tp, tp + .45); if (q > 0 && q < 1) { g.save(); g.strokeStyle = 'rgba(255,255,255,' + (.9 * (1 - q)) + ')'; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.arc(x, y, 18 + q * 70, 0, 7); g.stroke(); g.restore(); } }
    g.save(); g.translate(x, y); g.rotate(-.2); const s = 1.15 * (1 - .12 * pr); g.scale(s, s);
    g.lineWidth = 4.5; g.strokeStyle = INK; g.lineJoin = 'round'; g.fillStyle = '#fff';
    const part = (px, py, w, h, r) => { rr(g, px, py, w, h, r); g.fill(); g.stroke(); };
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 18; g.shadowOffsetY = 10; rr(g, -16, 0, 90, 150, 30); g.fillStyle = 'rgba(0,0,0,.001)'; g.fill(); g.shadowColor = 'transparent'; g.fillStyle = '#fff';
    part(52, 58, 22, 50, 11); part(33, 50, 23, 58, 11); part(13, 44, 24, 62, 12);
    part(-16, 74, 90, 74, 28);
    part(-15, 0, 30, 96, 15);
    g.save(); g.translate(-12, 112); g.rotate(-.8); part(-44, -13, 52, 27, 13); g.restore();
    g.restore();
  }

  /* ---------- CENA 1 · abertura (0–4) ---------- */
  function sAbre(lt) {
    if (lt < 2) {
      bg(R);
      rays(W / 2, 800, lt * .3, 12, 'rgba(255,237,0,.09)');
      const sp = seg(lt, .02, .55);
      seal(W / 2, 800, 260, (1 - eOutExpo(sp)) * -2.4, eOutBack(sp, 1.9));
      for (let k = 0; k < 3; k++) { const q = seg(lt, .15 + k * .1, .95 + k * .1); if (q > 0 && q < 1) { g.save(); g.strokeStyle = k % 2 ? Y : '#fff'; g.globalAlpha = 1 - q; g.lineWidth = 12 * (1 - q); g.beginPath(); g.arc(W / 2, 800, 280 + q * 520, 0, 7); g.stroke(); g.restore(); } }
      T('N1 CHICKEN · A MAIOR DA REDE', W / 2, 300, { f: 'Dosis', w: 800, s: 30, ls: 7, c: 'rgba(255,255,255,.88)', a: 'center', al: seg(lt, .3, .7) });
      rise('A número', W / 2, 1250, seg(lt, .45, 1.05), { s: 100, w: 700, it: false, c: '#fff', a: 'center', ls: -1 });
      pop('UM.', W / 2, 1520, lt, .7, { s: 290, c: Y, ex: R2, d: 16 });
      return;
    }
    const u = lt - 2, z = 1 + .07 * (1 - eOutExpo(seg(u, 0, .3)));
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    bg(PAPER);
    g.fillStyle = Y; g.globalAlpha = .6; g.beginPath(); g.arc(1000, 230, 280, 0, 7); g.fill(); g.globalAlpha = 1;
    rise('O cardápio', 90, 500, seg(u, .02, .55), { s: 112, w: 700, it: false, c: INK, ls: -1 });
    rise('ainda não.', 90, 700, seg(u, .12, .7), { s: 196, c: R });
    const e = eOutExpo(seg(u, .2, .9));
    g.save(); g.translate(W / 2, 1180 + (1 - e) * 900); g.rotate(-.035 + (1 - e) * .1);
    card(-450, -330, 900, 660, { r: 40 }); g.save(); rr(g, -450, -330, 900, 660, 40); g.clip(); cover(prints['00_loja_burgers_topo'], -450, -330, 900, 660, .25, 0); g.restore();
    g.restore();
    let x = 90; ['13 categorias', '284 produtos', '29 duplicados'].forEach((c, i) => { const q = eOutBack(seg(u, .9 + i * .12, 1.25 + i * .12), 2); if (q <= 0) return; g.save(); g.translate(x, 1660); g.scale(q, q); pill(c, 0, 0, { s: 30, bg: i === 2 ? R : INK, c: i === 2 ? '#fff' : Y }); g.restore(); x += pillW(c, 30) + 16; });
    g.restore();
  }

  /* ---------- CENA 2 · BI (4–10) ---------- */
  function sBi(lt) {
    bg(PAPER);
    g.fillStyle = Y; g.globalAlpha = .55; g.beginPath(); g.arc(1010, 200, 300, 0, 7); g.fill(); g.globalAlpha = 1;
    T('BI TASTEFY · SET/2026 · TODAS AS LOJAS N1', 90, 210, { f: 'Dosis', w: 800, s: 28, ls: 5, c: R, al: seg(lt, .05, .4) });
    if (lt < 3) {
      head('Onde', 'estamos.', 360, 540, lt, { c1: INK, c2: R });
      const cards = [[517910, 0, '', '', 'visitas por mês na loja'], [60850, 0, '', '', 'pedidos em setembro'], [3.59, 2, 'R$ ', ' mi', 'de GMV no mês']];
      const out = eInOutExpo(seg(lt, 2.7, 3));
      cards.forEach(([v, d, pre, suf, lb], k) => {
        const e = eOutExpo(seg(lt, .45 + k * .35, 1.2 + k * .35)); if (e <= 0) return;
        const x = 90 + (1 - e) * 1100 - out * 1300, y = 680 + k * 300;
        g.save(); g.translate(x + 450, y + 125); g.rotate((1 - e) * .08); g.translate(-(x + 450), -(y + 125));
        card(x, y, 900, 250, { r: 40 });
        T(pre + nf(v * eOutExpo(seg(lt, .6 + k * .35, 1.7 + k * .35)), d) + suf, x + 60, y + 150, { f: 'Dosis', w: 800, s: 118, c: INK });
        T(lb, x + 60, y + 212, { w: 600, s: 34, c: MUTE });
        g.beginPath(); g.arc(x + 800, y + 125, 52, 0, 7); g.fillStyle = k === 2 ? R : Y; g.fill(); T(String(k + 1), x + 800, y + 146, { f: 'Dosis', w: 800, s: 58, c: k === 2 ? '#fff' : INK, a: 'center' });
        g.restore();
      });
      return;
    }
    const u = lt - 3, z = 1 + .07 * (1 - eOutExpo(seg(u, 0, .3)));
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    head('Muita visita.', 'Pouco pedido.', 360, 520, u, { c1: INK, c2: R, s1: 84, s2: 140 });
    const cx = 540, cy = 990, r = 270, pr = eOutCubic(seg(u, .25, 1.6)), N1c = 11.75, TOP = 14.93;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(26,12,5,.08)'; g.lineWidth = 46; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(26,12,5,.22)'; g.lineWidth = 10; g.setLineDash([4, 14]); g.beginPath(); g.arc(cx, cy, r + 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .999); g.stroke(); g.setLineDash([]);
    g.strokeStyle = R; g.lineWidth = 46; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (N1c / TOP) * pr); g.stroke();
    const ex = cx + Math.cos(-Math.PI / 2 + Math.PI * 2 * (N1c / TOP) * pr) * r, ey = cy + Math.sin(-Math.PI / 2 + Math.PI * 2 * (N1c / TOP) * pr) * r; g.beginPath(); g.arc(ex, ey, 16, 0, 7); g.fillStyle = Y; g.fill();
    g.restore();
    T(nf(N1c * pr, 2) + '%', cx, cy + 40, { f: 'Dosis', w: 800, s: 150, c: INK, a: 'center' });
    T('conversão N1 no iFood', cx, cy + 110, { w: 600, s: 36, c: MUTE, a: 'center', al: seg(u, .3, .7) });
    T('anel cheio = 14,93% da líder', cx, cy - 120, { f: 'Dosis', w: 700, s: 26, ls: 2, c: MUTE, a: 'center', al: seg(u, .5, .9) });
    [['Marmita Top', 14.93, INK], ['Brasileirinho', 13.99, INK], ['N1 Chicken', 11.75, R]].forEach(([n, v, c], i) => {
      const p = eOutExpo(seg(u, 1 + i * .2, 1.8 + i * .2)), y = 1430 + i * 120; if (p <= 0) return;
      T(n, 90, y + 40, { w: 800, s: 34, c: INK, al: clamp(p * 2) });
      rr(g, 380, y, 480 * (v / 15) * p, 54, 27); g.fillStyle = c; g.fill();
      T(nf(v * p, 2) + '%', 395 + 480 * (v / 15) * p, y + 42, { f: 'Dosis', w: 800, s: 40, c, al: clamp(p * 2) });
    });
    g.restore();
  }

  /* ---------- CENA 3 · funil (10–16) ---------- */
  const FUN = [100, 50.9, 20.3, 19.4, 11.2], FUNK = ['Visitas', 'Clicam num item', 'Põem na sacola', 'Checkout', 'Pedem'], FUNC = [Y, Y2, '#FF9A1F', '#FF5A1F', R];
  function sFunil(lt) {
    bg(INK);
    head('De cada 100,', 'só 11 pedem.', 330, 500, lt, { c1: '#fff', c2: Y, s2: 150 });
    FUN.forEach((v, i) => {
      const e = eOutExpo(seg(lt, .4 + i * .3, 1.1 + i * .3)); if (e <= 0) return;
      const w = lerp(330, 900, v / 100) * e, h = 150, y = 650 + i * 200, x = (W - w) / 2;
      rr(g, x, y, w, h, 34); g.fillStyle = FUNC[i]; g.fill();
      const tc = i === 4 ? '#fff' : INK;
      T(nf(v * e, v % 1 ? 1 : 0), x + 40, y + 98, { f: 'Dosis', w: 800, s: 76, c: tc, al: clamp(e * 2) });
      T(FUNK[i].toUpperCase(), x + w - 36, y + 90, { f: 'Dosis', w: 800, s: 26, ls: 2, c: tc, a: 'right', al: clamp(e * 2) });
      if (i) T('−' + nf(100 - v / FUN[i - 1] * 100, 0) + '%', W - 40, y - 20, { f: 'Dosis', w: 800, s: 32, c: '#ff6a5a', a: 'right', al: clamp(e * 2) });
      // quem sai do funil cai pelas bordas
      for (let k = 0; k < 6; k++) { const id = i * 10 + k, q = ((lt - .8 - i * .3) * .9 + rnd(id)) % 1; if (lt < 1 + i * .3 || i === 0) continue; const side = k % 2 ? 1 : -1, px = W / 2 + side * (w / 2 + 20 + rnd(id + 3) * 40), py = y - 60 + q * q * 260; g.globalAlpha = (1 - q) * .8; g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.globalAlpha = 1; }
    });
    const c1 = seg(lt, 3.6, 4.1), c2 = seg(lt, 4.2, 4.7);
    if (c1 > 0) { g.save(); g.translate(W / 2, 1720); g.scale(eOutBack(c1, 2), eOutBack(c1, 2)); pill('49% não clicam em nada', 0, 0, { s: 32, bg: '#fff', c: INK, a: 'center' }); g.restore(); }
    if (c2 > 0) { g.save(); g.translate(W / 2, 1810); g.scale(eOutBack(c2, 2), eOutBack(c2, 2)); pill('60% abrem o item e desistem', 0, 0, { s: 32, bg: R, c: '#fff', a: 'center' }); g.restore(); }
  }

  /* ---------- CENA 4 · como é hoje (16–22) ---------- */
  const SH = [['03_favoritos_duplicados', 'Super Combo em', '4 preços diferentes', [50.4, 45.4, 33.2, 22.2]], ['07_sobremesas_sem_foto', 'Doce sem foto,', 'na 12ª de 13 categorias', [15.6, 19.5, 68, 22.6]], ['05_modal_combo_m_complementos', 'Combo sem bebida,', 'sem doce, sem upgrade', [49.6, 52.6, 30.8, 20]]];
  const CW = 920, CH2 = 720, CX0 = 540, CY0 = 1000;
  function shotGeo(k) { // recorte do print centrado na marcação
    const imx = prints[SH[k][0]], iw = (imx && imx.naturalWidth) || 1568, ih = (imx && imx.naturalHeight) || 744, m = SH[k][3];
    const z = Math.max(CW / iw, Math.min(Math.max(CH2 / ih, .58 * CW / (m[2] / 100 * iw)), .88 * CW / (m[2] / 100 * iw))), mx = (m[0] + m[2] / 2) / 100 * iw, my = (m[1] + m[3] / 2) / 100 * ih;
    const ox = clamp(CW / 2 - mx * z, CW - iw * z, 0), oy = ih * z < CH2 ? (CH2 - ih * z) / 2 : clamp(CH2 / 2 - my * z, CH2 - ih * z, 0);
    return { z, ox, oy, rx: ox + m[0] / 100 * iw * z, ry: oy + m[1] / 100 * ih * z, rw: m[2] / 100 * iw * z, rh: m[3] / 100 * ih * z, iw, ih };
  }
  function sHoje(lt, t) {
    bg(PAPER); g.fillStyle = Y; g.fillRect(-EXT, 1520, W + EXT * 2, 460);
    T('iFOOD · N1 CHICKEN VITÓRIA-ES · 30/09/2026', 90, 210, { f: 'Dosis', w: 800, s: 26, ls: 4, c: R, al: seg(lt, .05, .4) });
    head('Como é', 'hoje.', 340, 520, lt, { c1: INK, c2: R });
    const ent = k => eOutExpo(seg(lt, k * 2, k * 2 + .45));
    SH.forEach((sh, k) => {
      const e = ent(k); if (e <= 0) return;
      let d = 0; for (let j = k + 1; j < SH.length; j++) d += ent(j);
      const s = 1 - d * .07, geo = shotGeo(k);
      g.save(); g.translate(CX0 + (1 - e) * 1150 - d * 30, CY0 - d * 70); g.rotate((k % 2 ? .035 : -.035) * (1 - e) + (k - 1) * .015); g.scale(s, s);
      card(-CW / 2, -CH2 / 2, CW, CH2, { r: 38 });
      g.save(); rr(g, -CW / 2, -CH2 / 2, CW, CH2, 38); g.clip(); g.translate(-CW / 2, -CH2 / 2);
      const imx = prints[sh[0]]; if (imx.complete && imx.naturalWidth) g.drawImage(imx, geo.ox, geo.oy, geo.iw * geo.z, geo.ih * geo.z);
      const tp = 17 + k * 2, mp = seg(t, tp - .1, tp + .35);
      if (mp > 0) {
        g.fillStyle = 'rgba(26,12,5,' + (.38 * eOutCubic(mp)) + ')'; g.beginPath(); g.rect(0, 0, CW, CH2); rr(g, geo.rx - 10, geo.ry - 10, geo.rw + 20, geo.rh + 20, 16, true); g.fill('evenodd');
        const per = 2 * (geo.rw + geo.rh + 40); g.strokeStyle = R; g.lineWidth = 9; g.setLineDash([per * eOutCubic(mp), per]); rr(g, geo.rx - 10, geo.ry - 10, geo.rw + 20, geo.rh + 20, 16); g.stroke(); g.setLineDash([]);
      }
      if (d > 0) { g.fillStyle = 'rgba(26,12,5,' + (.25 * Math.min(1, d)) + ')'; g.fillRect(0, 0, CW, CH2); }
      g.restore();
      if (mp > 0) { const bs = eOutBack(clamp(mp * 1.5), 2); g.save(); g.translate(-CW / 2 + geo.rx + geo.rw + 10, -CH2 / 2 + geo.ry - 10); g.scale(bs, bs); g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fillStyle = R; g.fill(); T(String(k + 1), 0, 13, { f: 'Dosis', w: 800, s: 40, c: '#fff', a: 'center' }); g.restore(); }
      g.restore();
    });
    const k = clamp(Math.floor(lt / 2), 0, 2), cp = seg(lt, k * 2 + .25, k * 2 + .85);
    rise(SH[k][1], 90, 1620, cp, { s: 76, c: INK });
    rise(SH[k][2], 90, 1720, seg(lt, k * 2 + .35, k * 2 + .95), { s: 56, w: 800, c: R });
    const tg = SH.map((s2, j) => { const geo = shotGeo(j); return [CX0 - CW / 2 + geo.rx + geo.rw * .6, CY0 - CH2 / 2 + geo.ry + geo.rh * .7]; });
    hand(t, [[16.5, 1180, 2000], [16.9, ...tg[0]], [18.6, ...tg[0]], [18.9, ...tg[1]], [20.6, ...tg[1]], [20.9, ...tg[2]], [21.6, ...tg[2]], [22, 1200, 2100]]);
  }

  /* ---------- CENA 5 · o custo (22–28) ---------- */
  function sCusto(lt) {
    bg(R);
    g.fillStyle = R2; for (let k = 0; k < 14; k++) g.fillRect(-EXT, 640 + k * 90, W + EXT * 2, 2);
    T('CAMPANHA MAUÁ · JUL → SET/2026', 90, 210, { f: 'Dosis', w: 800, s: 28, ls: 5, c: Y, al: seg(lt, .05, .4) });
    rise('O volume subiu.', 90, 380, seg(lt, .1, .75), { s: 112, c: '#fff' });
    rise('O ticket caiu.', 90, 510, seg(lt, .45, 1.1), { s: 112, c: Y });
    const pts = [[0, 50.01, 'JUL'], [1, 42.03, 'AGO'], [2, 39.81, 'SET']], X = i => 190 + i * 350, Yv = v => 1220 - (v - 35) * 28;
    const dp = seg(lt, 1, 2.4);
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = g.lineJoin = 'round'; g.beginPath(); const sg = 2 * eInOutCubic(dp); g.moveTo(X(0), Yv(pts[0][1]));
    for (let i = 1; i <= 2; i++) { const f = clamp(sg - (i - 1)); if (f <= 0) break; g.lineTo(lerp(X(i - 1), X(i), f), lerp(Yv(pts[i - 1][1]), Yv(pts[i][1]), f)); } g.stroke(); g.restore();
    pts.forEach((p, i) => { const q = seg(lt, 1 + i * .65, 1.4 + i * .65); if (q <= 0) return; g.beginPath(); g.arc(X(i), Yv(p[1]), 20 * eOutBack(q), 0, 7); g.fillStyle = Y; g.fill(); T(brl(p[1]), X(i), Yv(p[1]) - 44, { f: 'Dosis', w: 800, s: 52, c: '#fff', a: 'center', al: q }); T(p[2], X(i), 1330, { f: 'Dosis', w: 800, s: 30, ls: 4, c: Y, a: 'center', al: q }); });
    const b1 = seg(lt, 2.6, 3), b2 = seg(lt, 2.9, 3.3);
    if (b1 > 0) pill('+28,6% em pedidos', 90, 1450, { bg: '#fff', s: 34, al: eOutCubic(b1) });
    if (b2 > 0) pill('−20,4% no ticket', 90, 1540, { bg: INK, c: Y, s: 34, al: eOutCubic(b2) });
    const fp = seg(lt, 3.5, 4.1); if (fp > 0) wrap('O novo cardápio recupera o ticket sem perder o volume.', 90, 1700, 900, 68, { w: 800, s: 58, it: true, c: '#fff', al: eOutCubic(fp) });
  }

  /* ---------- CENA 6 · E agora… o novo cardápio (28–36) ---------- */
  function spot(x0, ang, a) {
    g.save(); g.translate(x0, -80); g.rotate(ang); const gr = g.createLinearGradient(0, 0, 0, 2300); gr.addColorStop(0, 'rgba(255,236,170,' + a + ')'); gr.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = gr; g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.lineTo(380, 2300); g.lineTo(-380, 2300); g.closePath(); g.fill(); g.restore();
  }
  const PH = { x: 220, y: 430, w: 640, h: 1170 };
  function sRevela(lt) {
    if (lt < 6) {
      bg('#080403');
      if (lt >= 5.5) return; // respiro: meio segundo de tela preta antes do drop
      const conv = eInOutCubic(seg(lt, 2, 5.5)), sw = Math.sin(lt * 1.6);
      spot(W * .12, lerp(-.42 + sw * .1, -.12, conv), .14 + .1 * conv);
      spot(W * .88, lerp(.42 - sw * .1, .12, conv), .14 + .1 * conv);
      const rp = seg(lt, 2, 5.5); if (rp > 0) { g.save(); g.globalAlpha = .08 + .3 * rp; rays(W / 2, 960, lt * .5, 8, R, 2000, 110); g.restore(); }
      for (let k = 0; k < 110; k++) { const x = (rnd(k) * W + lt * (20 + rnd(k + 1) * 40)) % W, y = (rnd(k + 2) * H - lt * (10 + rnd(k + 3) * 30) + H * 2) % H; g.globalAlpha = .1 + .2 * rnd(k + 4); g.fillStyle = '#ffe9b0'; g.fillRect(x, y, 3, 3); }
      g.globalAlpha = 1;
      const z = 1 + .16 * conv, jit = seg(lt, 3, 5.5) * 8, fr = Math.floor(lt * 30);
      g.save(); g.translate(W / 2 + (rnd(fr) - .5) * jit, H / 2 + (rnd(fr + 5) - .5) * jit); g.scale(z, z); g.translate(-W / 2, -H / 2);
      const p1 = seg(lt, 0, .32), up = eInOutExpo(seg(lt, 1.95, 2.25));
      if (p1 > 0) {
        const y = lerp(1020, 760, up), base = lerp(2.4, 1, eOutExpo(p1)) * lerp(1, .7, up);
        for (let gh = 3; gh >= 0; gh--) {
          if (p1 >= 1 && gh) continue; const sc = base * (1 + gh * .12 * (1 - p1));
          g.save(); g.translate(W / 2, y - 70); g.scale(sc, sc); g.translate(-W / 2, -(y - 70)); T3('E AGORA,', W / 2, y, { s: 190, c: '#fff', ex: R2, d: 12, al: gh ? .18 * (1 - p1) : clamp(p1 * 4) }); g.restore();
        }
      }
      pop('APRESENTAMOS', W / 2, 1080, lt, 2.12, { s: 116, c: Y, ex: R2, stg: .03, dur: .35 });
      pop('A VOCÊS', W / 2, 1260, lt, 2.4, { s: 150, c: '#fff', ex: R2, stg: .04, dur: .35 });
      g.restore();
      return;
    }
    // DROP: o novo cardápio pula para fora do celular
    const u = lt - 6, { x: fx, y: fy, w: fw, h: fh } = PH, fc = fy + fh / 2;
    bg(Y);
    const rs = eOutExpo(seg(u, 0, .45)); g.save(); g.translate(W / 2, fc); g.scale(rs, rs); g.translate(-W / 2, -fc); rays(W / 2, fc, u * .22, 10, R, 2400, 190); g.restore();
    for (let k = 0; k < 3; k++) { const q = seg(u, k * .1, .9 + k * .1); if (q > 0 && q < 1) { g.save(); g.strokeStyle = k % 2 ? '#fff' : INK; g.globalAlpha = 1 - q; g.lineWidth = 18 * (1 - q); g.beginPath(); g.arc(W / 2, fc, 200 + q * 1300, 0, 7); g.stroke(); g.restore(); } }
    const fp = eOutBack(seg(u, 0, .3), 1.6);
    g.save(); g.translate(W / 2, fc); g.rotate(-.03); g.scale(fp, fp); g.translate(-W / 2, -fc);
    card(fx - 20, fy - 20, fw + 40, fh + 40, { r: 92, bg: '#120806', sh: 'rgba(0,0,0,.45)', blur: 70, oy: 34 });
    g.save(); rr(g, fx, fy, fw, fh, 74); g.clip(); cover(im.comboG, fx, fy, fw, fh); g.fillStyle = 'rgba(26,12,5,.42)'; g.fillRect(fx, fy, fw, fh);
    const gl = g.createRadialGradient(W / 2, fc, 20, W / 2, fc, fh * .6); gl.addColorStop(0, 'rgba(255,237,0,.32)'); gl.addColorStop(1, 'rgba(255,237,0,0)'); g.fillStyle = gl; g.fillRect(fx, fy, fw, fh); g.restore();
    rr(g, W / 2 - 90, fy + 22, 180, 44, 22); g.fillStyle = '#120806'; g.fill();
    g.restore();
    for (let k = 0; k < 30; k++) {
      const q = seg(u, .02, 1.3); if (q <= 0 || q >= 1) break;
      const side = k % 4, ed = rnd(k + 40), x0 = side < 2 ? fx + ed * fw : side === 2 ? fx : fx + fw, y0 = side === 0 ? fy : side === 1 ? fy + fh : fy + ed * fh;
      const dx = x0 - W / 2, dy = y0 - fc, L = Math.hypot(dx, dy) || 1, sp = 500 + rnd(k + 41) * 900, e = eOutCubic(q), sc = 1 + e * 2.6;
      g.save(); g.translate(x0 + dx / L * sp * e, y0 + dy / L * sp * e + 300 * q * q); g.rotate(q * (3 + rnd(k) * 6)); g.scale(sc, sc); g.globalAlpha = 1 - q;
      g.beginPath(); g.moveTo(0, -14); g.lineTo(11, 9); g.lineTo(-9, 12); g.closePath(); g.fillStyle = 'rgba(255,255,255,.88)'; g.fill(); g.strokeStyle = 'rgba(26,12,5,.4)'; g.lineWidth = 1.5; g.stroke(); g.restore();
    }
    pop('O NOVO', W / 2, 490, u, .04, { s: 132, c: '#fff', ex: INK, st: INK, stw: 6, stg: .04, dur: .4, from: .05, bob: 5 });
    pop('CARDÁPIO', W / 2, 1090, u, .12, { s: 194, c: R, ex: INK, d: 14, st: '#fff', stw: 10, stg: .05, dur: .45, from: .05, bob: 7 });
    pop('DA N1', W / 2, 1680, u, .42, { s: 140, c: '#fff', ex: R2, st: INK, stw: 7, stg: .05, dur: .4, from: .05, bob: 5 });
    const sp = seg(u, .3, .75);
    if (sp > 0) { const e = eOutBack(sp, 2), x = lerp(fx + fw - 120, fx + fw + 70, eOutExpo(sp)), y = lerp(fy + 160, fy - 100, eOutExpo(sp)); seal(x, y + Math.sin(u * 3) * 6, 120, (1 - eOutExpo(sp)) * -3 + Math.sin(u * 2) * .05, lerp(.2, 1, e)); }
    confete(u, W / 2, fc);
  }

  /* ---------- CENA 7 · por ocasião (36–42) ---------- */
  const OC = { x: 70, y: 500, w: 940, h: 1260 };
  const SET_A = [['combo-p', 'Combo P'], ['trio', 'Trio Burger'], ['4-em-n1', '4 em N1'], ['combinho', 'Combinho'], ['classic', 'Chicken Burger'], ['bbc', 'BBC']];
  const SET_B = [['combo-g', 'Combo G'], ['combo-gg', 'Combo GG'], ['3-burgers', 'Trinca N1'], ['caixa-g', 'Caixa G'], ['bites-m', 'Bites M'], ['combo-m', 'Combo M']];
  const TILE = (k) => ({ x: 60 + (k % 2) * 425, y: 330 + Math.floor(k / 2) * 304, w: 395, h: 280 });
  function chipsLayout(opts, s = 26, px = 44, gap = 14) { let x = 60; return opts.map(o => { const w = pillW(o, s, px), r = { x, w, o }; x += w + gap; return r; }); }
  function tileDraw(it, nm, x, y, w, h, sc, hl) {
    if (sc <= 0) return;
    g.save(); g.translate(x + w / 2, y + h / 2); g.scale(sc, sc); g.translate(-(x + w / 2), -(y + h / 2));
    rr(g, x, y, w, h, 28); g.fillStyle = '#faf6ea'; g.fill(); if (hl) { g.strokeStyle = R; g.lineWidth = 7; g.stroke(); }
    g.save(); rr(g, x + 12, y + 12, w - 24, 160, 20); g.clip(); cover(imOf(it), x + 12, y + 12, w - 24, 160); g.restore();
    T(nm, x + 22, y + 212, { w: 800, s: 30, c: INK });
    T(brl(item(it).price || 0), x + 22, y + 256, { f: 'Dosis', w: 800, s: 32, c: hl ? R : MUTE });
    g.beginPath(); g.arc(x + w - 44, y + 238, 26, 0, 7); g.fillStyle = R; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w - 56, y + 238); g.lineTo(x + w - 32, y + 238); g.moveTo(x + w - 44, y + 226); g.lineTo(x + w - 44, y + 250); g.stroke();
    if (item(it).badge && hl !== undefined) pill('Mais pedido', x + 22, y + 34, { s: 18, bg: Y, c: INK, px: 22 });
    g.restore();
  }
  function sOcasiao(lt, t) {
    bg(R);
    rays(W / 2, 1100, lt * .12, 14, 'rgba(255,237,0,.06)');
    head('Por', 'ocasião.', 250, 420, lt, { c1: '#fff', c2: Y, s1: 92, s2: 170 });
    const dy = Math.sin(lt * 1.4) * 6, { x: ox, w } = OC, oy = OC.y + dy;
    const ce = eOutExpo(seg(lt, 0, .35));
    g.save(); g.translate(0, (1 - ce) * 900);
    card(ox, oy, w, OC.h, { r: 54, sh: 'rgba(0,0,0,.35)' });
    g.save(); rr(g, ox, oy, w, OC.h, 54); g.clip(); g.translate(ox, oy);
    T('Boa noite!', 60, 90, { f: 'Dosis', w: 700, s: 32, c: MUTE }); T('Bateu a fome?', 60, 160, { w: 900, it: true, s: 64, c: INK });
    logoCircle(w - 90, 110, 50);
    const sel = t < 38.55 ? 0 : 2, chips = chipsLayout(['Só pra mim', 'Pra dois', 'Pra galera']);
    chips.forEach((c, i) => pill(c.o, c.x, 250, { s: 26, px: 44, bg: i === sel ? INK : '#f3efe2', c: i === sel ? Y : INK }));
    const swap = t >= 38.55;
    (swap ? SET_B : SET_A).forEach(([id, nm], k) => {
      const tl = TILE(k), t0 = swap ? 38.7 + k * .1 : 36.3 + k * .12;
      let sc = eOutBack(seg(t, t0, t0 + .32), 2);
      if (!swap) sc *= 1 - eInOutCubic(seg(t, 38.4, 38.55));
      const pulse = swap && k === 0 && t >= 40.5 ? 1 + .04 * Math.sin(seg(t, 40.5, 40.9) * Math.PI) : 1;
      tileDraw(id, nm, tl.x, tl.y, tl.w, tl.h, sc * pulse, swap && k === 0 ? t >= 40.5 : undefined);
    });
    g.restore(); g.restore();
    T('O combo certo aparece primeiro.', W / 2, 1855, { w: 700, s: 42, c: 'rgba(255,255,255,.92)', a: 'center', al: seg(lt, 1, 1.5) });
    const gal = chips[2], t0 = TILE(0);
    hand(t, [[37.3, 1180, 2000], [38.3, ox + gal.x + gal.w * .55, OC.y + 262], [39.9, ox + gal.x + gal.w * .55, OC.y + 262], [40.35, ox + t0.x + t0.w * .55, OC.y + t0.y + t0.h * .6], [42, ox + t0.x + t0.w * .55, OC.y + t0.y + t0.h * .6]]);
  }

  /* ---------- CENA 8 · todo combo pergunta (42–46) ---------- */
  const CB = { x: 70, y: 500, w: 940, h: 1300 };
  const CROWS = [['Troca premium · Onion Rings', '+ R$ 8,90', 8.9, 43], ['Coca lata no combo (avulsa R$ 13,90)', '+ R$ 11,90', 11.9, 43.7], ['Fecha com doce? · Brigadeiro N1', '+ R$ 7,90', 7.9, 44.4]];
  function sCombo(lt, t) {
    bg(PAPER);
    g.fillStyle = Y; g.globalAlpha = .55; g.beginPath(); g.arc(80, 1750, 300, 0, 7); g.fill(); g.globalAlpha = 1;
    head('Todo combo', 'pergunta.', 250, 420, lt, { c1: INK, c2: R, s1: 88, s2: 170 });
    const { x, y, w, h } = CB, z = 1 + .06 * (1 - eOutExpo(seg(lt, 0, .3)));
    g.save(); g.translate(W / 2, y + h / 2); g.scale(z, z); g.translate(-W / 2, -(y + h / 2));
    card(x, y, w, h, { r: 54 });
    g.save(); rr(g, x, y, w, h, 54); g.clip(); g.translate(x, y);
    g.save(); g.beginPath(); g.rect(0, 0, w, 440); g.clip(); cover(im.comboG, 0, 0, w, 440); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, w, 440); g.restore();
    T('Combo G · serve 3 a 5', 50, 520, { w: 900, it: true, s: 54, c: INK }); T('R$ 148,90', 50, 580, { f: 'Dosis', w: 800, s: 40, c: MUTE });
    let tot = 148.9;
    CROWS.forEach(([n, pr, v, tp], k) => {
      const yy = 630 + k * 170; rr(g, 40, yy, w - 80, 150, 24); g.fillStyle = '#f6f3e6'; g.fill();
      T(n, 76, yy + 64, { w: 700, s: 32, c: INK }); T(pr, 76, yy + 112, { f: 'Dosis', w: 800, s: 30, c: MUTE });
      const q = seg(t, tp, tp + .35);
      if (q <= 0) { g.beginPath(); g.arc(w - 100, yy + 75, 34, 0, 7); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(w - 114, yy + 75); g.lineTo(w - 86, yy + 75); g.moveTo(w - 100, yy + 61); g.lineTo(w - 100, yy + 89); g.stroke(); }
      else check(w - 100, yy + 75, q, R, 34);
      tot += v * eOutCubic(seg(t, tp, tp + .4));
    });
    const by = 1150, ap = pressAt(t) * (t > 45 ? 1 : 0);
    g.save(); g.translate(w / 2, by + 55); g.scale(1 - .03 * ap, 1 - .03 * ap); g.translate(-w / 2, -(by + 55));
    rr(g, 40, by, w - 80, 110, 30); g.fillStyle = R; g.fill();
    T('Adicionar', 86, by + 70, { w: 800, s: 38, c: '#fff' }); T(brl(tot), w - 86, by + 72, { f: 'Dosis', w: 800, s: 46, c: '#fff', a: 'right' });
    if (t > 45.3) { g.globalAlpha = .5 * (1 - seg(t, 45.3, 45.7)); rr(g, 40, by, w - 80, 110, 30); g.fillStyle = '#fff'; g.fill(); }
    g.restore();
    g.restore();
    const bp = seg(t, 45.4, 45.75); if (bp > 0) { const s2 = eOutBack(bp, 2.4); g.save(); g.translate(x + w - 40, y + 40); g.rotate(.2); g.scale(s2, s2); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 30; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.fillStyle = Y; g.fill(); g.shadowColor = 'transparent'; T('+19%', 0, 14, { f: 'Dosis', w: 800, s: 74, c: INK, a: 'center' }); T('NO PEDIDO', 0, 58, { f: 'Dosis', w: 800, s: 24, ls: 3, c: INK, a: 'center' }); g.restore(); }
    g.restore();
    const bx = x + w - 100, rowY = k => y + 630 + k * 170 + 75;
    hand(t, [[42.3, 1180, 2000], [42.85, bx + 10, rowY(0) + 14], [43.5, bx + 10, rowY(1) + 14], [44.2, bx + 10, rowY(2) + 14], [45.05, x + w / 2 + 160, y + 1150 + 64], [45.6, x + w / 2 + 160, y + 1150 + 64], [46, 1200, 2100]]);
  }

  /* ---------- CENA 9 · a IA monta o pedido (46–50) ---------- */
  const IA = { x: 70, y: 480, w: 940, h: 1340 };
  const REC = [['comboGG', 'Completão · Combo GG', 'serve 5 a 7', 212.9], ['comboG', 'Recomendado · Combo G', 'serve 3 a 5 · R$ 29,78/pessoa', 148.9], ['comboM', 'Econômico · Combo M', 'serve 2 a 3', 87.9]];
  function bubble(str, y, me, a) {
    if (a <= 0) return; const s = 34, w = tw(str, me ? 700 : 500, s) + 56, h = 76, x = me ? IA.w - 40 - w : 40;
    g.save(); const e = eOutBack(clamp(a), 1.6); g.globalAlpha = clamp(a * 3); g.translate(me ? x + w : x, y + h); g.scale(e, e); g.translate(-(me ? x + w : x), -(y + h));
    rr(g, x, y, w, h, 30); g.fillStyle = me ? R : '#f4efe0'; g.fill(); T(str, x + 28, y + 51, { w: me ? 700 : 500, s, c: me ? '#fff' : INK }); g.restore();
  }
  function sIa(lt, t) {
    bg(INK);
    const gr = g.createRadialGradient(540, 1100, 40, 540, 1100, 1100); gr.addColorStop(0, 'rgba(255,0,0,.4)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(-EXT, -EXT, W + EXT * 2, H + EXT * 2);
    head('A IA', 'monta o pedido.', 250, 400, lt, { c1: '#fff', c2: Y, s1: 92, s2: 112 });
    const { x, y, w, h } = IA, ce = eOutExpo(seg(lt, 0, .35));
    g.save(); g.translate(0, (1 - ce) * 900);
    card(x, y, w, h, { r: 54, bg: PAPER, sh: 'rgba(0,0,0,.4)' });
    g.save(); rr(g, x, y, w, h, 54); g.clip(); g.translate(x, y);
    g.fillStyle = Y; g.fillRect(0, 0, w, 110); logoCircle(66, 55, 36); T('Assistente N1', 122, 70, { w: 800, s: 38, c: INK });
    const ap = (t0) => seg(t, t0, t0 + .3);
    bubble('Quantas pessoas vão comer?', 150, false, ap(46.15));
    const c1 = chipsLayout(['Só eu', '2', '3 a 4', '5+'], 32, 56); if (t > 46.3) c1.forEach((c, i) => pill(c.o, c.x - 20, 290, { s: 32, px: 56, bg: t >= 47 && i === 2 ? Y : '#fff', c: INK, bd: t >= 47 && i === 2 ? Y : INK, al: clamp((t - 46.3) * 4) }));
    bubble('Somos 3 a 4', 350, true, ap(47.15));
    bubble('E o tamanho da fome?', 460, false, ap(47.3));
    const c2 = chipsLayout(['Beliscar', 'Normal', 'De campeão'], 32, 56); if (t > 47.4) c2.forEach((c, i) => pill(c.o, c.x - 20, 600, { s: 32, px: 56, bg: t >= 47.8 && i === 2 ? Y : '#fff', c: INK, bd: t >= 47.8 && i === 2 ? Y : INK, al: clamp((t - 47.4) * 4) }));
    bubble('Fome de campeão', 660, true, ap(47.95));
    if (t > 48.15) T('Pra 3 a 4 com fome de campeão, a galera leva:', 40, 800, { w: 500, s: 28, c: MUTE, al: clamp((t - 48.15) * 4) });
    REC.forEach(([img, nm, sub, pr], k) => {
      const p = eOutBack(seg(t, 48.3 + k * .15, 48.6 + k * .15), 1.8); if (p <= 0) return; const yy = 830 + k * 140, best = k === 1, picked = best && t >= 49.3;
      g.save(); g.translate(w / 2, yy + 60); g.scale(p, p); g.translate(-w / 2, -(yy + 60));
      rr(g, 40, yy, w - 80, 120, 24); g.fillStyle = best ? '#fff5f5' : '#fff'; g.fill(); g.strokeStyle = best ? R : '#e8e0d0'; g.lineWidth = best ? 6 : 3; g.stroke();
      g.save(); rr(g, 54, yy + 14, 92, 92, 16); g.clip(); cover(im[img], 54, yy + 14, 92, 92); g.restore();
      T(nm, 168, yy + 54, { w: 800, s: 30, c: INK }); T(sub, 168, yy + 94, { w: 500, s: 24, c: MUTE }); T(brl(pr), w - 64, yy + 74, { f: 'Dosis', w: 800, s: 34, c: INK, a: 'right' });
      if (best) pill('Recomendado', 64, yy - 2, { s: 18, bg: R, c: '#fff', px: 22 });
      if (picked) check(w - 64 - 170, yy + 62, seg(t, 49.3, 49.6), R, 24);
      g.restore();
    });
    bubble('Fechado! Combo G no carrinho.', 1250, false, ap(49.55));
    g.restore(); g.restore();
    const c1x = x + c1[2].x - 20 + c1[2].w * .5, c2x = x + c2[2].x - 20 + c2[2].w * .5;
    hand(t, [[46.4, 1180, 2000], [46.85, c1x, y + 304], [47.6, c2x, y + 614], [49.05, x + w / 2 + 60, y + 970 + 70], [49.6, x + w / 2 + 60, y + 970 + 70], [50, 1200, 2100]]);
  }

  /* ---------- CENA 10 · antes × depois (50–56) ---------- */
  const AD = [['13 categorias', '7 ocasiões'], ['284 produtos', '32 itens'], ['Combo em 4 preços', '1 preço, sempre'], ['Doce sem foto, escondido', 'Doce em todo combo'], ['Coca avulsa R$ 13,90', 'R$ 11,90 no combo']];
  function sAntes(lt) {
    bg(Y);
    head('Antes', '× depois.', 250, 420, lt, { c1: INK, c2: R, s1: 92, s2: 160 });
    AD.forEach(([a, b], i) => {
      const ap = eOutExpo(seg(lt, .1 + i * .08, .6 + i * .08)); if (ap <= 0) return;
      const y = 520 + i * 250, ft = 1 + i, p = seg(lt, ft - .18, ft + .18), dep = p >= .5, sx = Math.max(.02, Math.abs(Math.cos(p * Math.PI)));
      g.save(); g.translate(W / 2 + (1 - ap) * -1100, y + 110); g.scale(sx * (1 + .06 * Math.sin(p * Math.PI)), 1); g.translate(-W / 2, -(y + 110));
      if (!dep) {
        card(90, y, 900, 220, { r: 36, bg: '#1d120c' });
        T('ANTES', 140, y + 66, { f: 'Dosis', w: 800, s: 24, ls: 5, c: 'rgba(255,255,255,.45)' });
        T(a, 140, y + 160, { w: 700, s: 56, c: 'rgba(255,255,255,.78)' });
        const sk = eOutExpo(seg(lt, ft - .55, ft - .25)), aw = tw(a, 700, 56); if (sk > 0) { g.fillStyle = R; g.save(); g.translate(130, y + 140); g.rotate(-.03); g.fillRect(0, 0, (aw + 20) * sk, 8); g.restore(); }
      } else {
        card(90, y, 900, 220, { r: 36 }); g.fillStyle = R; g.save(); rr(g, 90, y, 900, 220, 36); g.clip(); g.fillRect(90, y, 18, 220); g.restore();
        T('DEPOIS', 140, y + 66, { f: 'Dosis', w: 800, s: 24, ls: 5, c: R });
        T3(b, 140, y + 166, { s: 70, c: INK, ex: R, d: 4, a: 'left' });
        check(920, y + 110, seg(lt, ft + .1, ft + .45), R, 30);
      }
      g.restore();
    });
    const fp = seg(lt, 5.25, 5.6); if (fp > 0) { const e = eOutBack(fp, 2); g.save(); g.translate(W / 2, 1830); g.scale(e, e); pill('Menos escolha · mais pedido', 0, 0, { bg: R, c: '#fff', s: 34, a: 'center' }); g.restore(); }
  }

  /* ---------- CENA 11 · por que vende mais (56–60) ---------- */
  const PQ = [['1', 'Decide em 3 segundos', 'por ocasião, não por categoria'], ['2', 'O do meio vende mais', 'selo de mais pedido + âncora ao lado'], ['3', 'Todo combo pergunta', 'bebida, doce e upgrade: +19% no pedido'], ['4', 'A IA monta o pedido', 'no app, em 3 toques']];
  function sPorque(lt) {
    bg(R);
    rays(W / 2, 1100, lt * .15, 14, 'rgba(255,237,0,.06)');
    head('Por que', 'vende mais?', 250, 420, lt, { c1: '#fff', c2: Y, s1: 92, s2: 150 });
    PQ.forEach(([n, t1, t2], k) => {
      const tk = .4 + k * .8, p = seg(lt, tk - .12, tk + .3); if (p <= 0) return;
      const e = eOutBack(p, 1.8), y = 540 + k * 290, rot = (k % 2 ? .025 : -.025) * (1 + (1 - Math.min(1, e)) * 3);
      g.save(); g.translate(W / 2, y + 125 + (1 - eOutExpo(p)) * 400); g.rotate(rot); g.scale(e, e); g.translate(-W / 2, -(y + 125));
      card(90, y, 900, 250, { r: 40, sh: 'rgba(0,0,0,.3)' });
      g.beginPath(); g.arc(200, y + 125, 66, 0, 7); g.fillStyle = Y; g.fill(); T(n, 200, y + 152, { f: 'Dosis', w: 800, s: 80, c: INK, a: 'center' });
      T(t1, 300, y + 118, { w: 900, it: true, s: 54, c: INK }); T(t2, 300, y + 172, { w: 600, s: 30, c: MUTE });
      g.restore();
    });
    const sp = seg(lt, 3.3, 3.95); if (sp > 0 && sp < 1) { const e = eInOutCubic(sp), x = lerp(120, 980, e), y = lerp(1700, 520, e) - Math.sin(e * Math.PI) * 160; for (let k = 0; k < 6; k++) { const q = clamp(e - k * .04); star(lerp(120, 980, q), lerp(1700, 520, q) - Math.sin(q * Math.PI) * 160, 18 - k * 2.5, q * 6, .25); } star(x, y, 46, e * 6); }
  }

  /* ---------- CENA 12 · resultado (60–64) ---------- */
  function sResultado(lt) {
    bg(PAPER);
    g.fillStyle = Y; g.globalAlpha = .55; g.beginPath(); g.arc(1010, 220, 300, 0, 7); g.fill(); g.globalAlpha = 1;
    T('PROJEÇÃO CONSERVADORA · BASE SET/2026', 90, 210, { f: 'Dosis', w: 800, s: 28, ls: 5, c: R, al: seg(lt, .05, .4) });
    head('Ticket', 'maior.', 340, 520, lt, { c1: INK, c2: R });
    const cx = 540, cy = 960, r = 260, pr = eOutCubic(seg(lt, .3, 1.6));
    g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(26,12,5,.08)'; g.lineWidth = 40; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = R; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .92 * pr); g.stroke(); g.restore();
    T('era R$ 58,96', cx, cy - 90, { f: 'Dosis', w: 700, s: 34, c: MUTE, a: 'center', al: seg(lt, .3, .6) });
    T(brl(lerp(58.96, 63.85, pr)), cx, cy + 36, { f: 'Dosis', w: 800, s: 112, c: INK, a: 'center' });
    T('ticket médio', cx, cy + 104, { w: 600, s: 36, c: MUTE, a: 'center', al: seg(lt, .3, .6) });
    const c1 = seg(lt, 1.7, 2.1), c2 = seg(lt, 2.2, 2.6);
    if (c1 > 0) { const e = eOutBack(c1, 1.8); g.save(); g.translate(W / 2, 1420); g.scale(e, e); g.translate(-W / 2, -1420); card(90, 1320, 900, 200, { r: 40, bg: INK }); T('+R$ 255 mil', 140, 1430, { f: 'Dosis', w: 800, s: 100, c: Y }); T('de margem bruta por mês', 140, 1488, { w: 600, s: 32, c: 'rgba(255,255,255,.8)' }); g.restore(); }
    if (c2 > 0) { const e = eOutBack(c2, 1.8); g.save(); g.translate(W / 2, 1640); g.scale(e, e); g.translate(-W / 2, -1640); card(90, 1555, 900, 170, { r: 40 }); T('CMV do mix 28,8% → 27,7%', 140, 1630, { w: 800, s: 46, c: INK }); T('conversão estável · +R$ 298 mil de GMV/mês', 140, 1684, { w: 600, s: 28, c: MUTE }); g.restore(); }
  }

  /* ---------- CENA 13 · fecho (64–70) ---------- */
  function sFim(lt) {
    bg(R);
    rays(W / 2, 860, lt * .25, 12, 'rgba(255,237,0,.1)');
    const sp = seg(lt, 0, .5); seal(W / 2, 860, 270, (1 - eOutExpo(sp)) * 2, eOutBack(sp, 1.6));
    for (let k = 0; k < 3; k++) { const q = seg(lt, .1 + k * .1, .9 + k * .1); if (q > 0 && q < 1) { g.save(); g.strokeStyle = k % 2 ? Y : '#fff'; g.globalAlpha = 1 - q; g.lineWidth = 12 * (1 - q); g.beginPath(); g.arc(W / 2, 860, 290 + q * 520, 0, 7); g.stroke(); g.restore(); } }
    rise('Cardápio Nº1.', W / 2, 1330, seg(lt, .5, 1.1), { s: 132, c: Y, a: 'center' });
    rise('Number One. Sempre.', W / 2, 1450, seg(lt, .75, 1.35), { s: 70, w: 700, it: false, c: '#fff', a: 'center', ls: -1 });
    const bp = seg(lt, 1.5, 1.9);
    if (bp > 0) {
      const e = eOutBack(bp, 1.8), b1 = 'Peça no iFood', b2 = 'Baixe o App N1', w1 = tw(b1, 800, 36) + 90, w2 = tw(b2, 800, 36) + 90, x0 = (W - w1 - w2 - 24) / 2;
      g.save(); g.translate(W / 2, 1620); g.scale(e, e); g.translate(-W / 2, -1620);
      rr(g, x0, 1580, w1, 84, 42); g.fillStyle = '#fff'; g.fill(); T(b1, x0 + w1 / 2, 1636, { w: 800, s: 36, c: R, a: 'center' });
      rr(g, x0 + w1 + 24, 1580, w2, 84, 42); g.fillStyle = INK; g.fill(); T(b2, x0 + w1 + 24 + w2 / 2, 1636, { w: 800, s: 36, c: Y, a: 'center' });
      g.restore();
    }
    T('N1 CHICKEN · TASTEFY · LABORATÓRIO DE IA · 2026', W / 2, 1840, { f: 'Dosis', w: 800, s: 24, ls: 5, c: 'rgba(255,255,255,.75)', a: 'center', al: seg(lt, 2, 2.4) });
  }

  /* ---------- linha do tempo ---------- */
  const S = [
    { id: 'abre', t0: 0, t1: 4, f: sAbre }, { id: 'bi', t0: 4, t1: 10, f: sBi }, { id: 'funil', t0: 10, t1: 16, f: sFunil },
    { id: 'hoje', t0: 16, t1: 22, f: sHoje }, { id: 'custo', t0: 22, t1: 28, f: sCusto }, { id: 'revela', t0: 28, t1: 36, f: sRevela },
    { id: 'ocasiao', t0: 36, t1: 42, f: sOcasiao }, { id: 'combo', t0: 42, t1: 46, f: sCombo }, { id: 'ia', t0: 46, t1: 50, f: sIa },
    { id: 'antes', t0: 50, t1: 56, f: sAntes }, { id: 'porque', t0: 56, t1: 60, f: sPorque }, { id: 'resultado', t0: 60, t1: 64, f: sResultado },
    { id: 'fim', t0: 64, t1: END, f: sFim }
  ];
  const TRANS = [ // transição na saída de cada cena (meia-janela em segundos)
    { t: 'encolhe', h: .45 }, { t: 'desliza', h: .4 }, { t: 'punch', h: .12 }, { t: 'encolhe', h: .45 }, { t: 'tvoff', h: .35 },
    { t: 'mergulho', h: .45, o: { cx: 540, cy: PH.y + PH.h / 2 } }, { t: 'mergulho', h: .4, o: { cx: OC.x + 60 + 197, cy: OC.y + 330 + 140 } },
    { t: 'desliza', h: .4 }, { t: 'punch', h: .12 }, { t: 'carta', h: .4 }, { t: 'encolhe', h: .45 }, { t: 'paineis', h: .5 }
  ];

  /* ---------- render ---------- */
  const MT = window.MotionT, IMP = TR.IMPACTOS;
  const impAmp = t => { let a = 0; for (const [ti, k] of IMP) { const d = t - ti; if (d >= 0 && d < 1.2) a += k * Math.exp(-d / .22); } return a; };
  const flashAmp = t => { let a = 0; for (const [ti, k] of IMP) { const d = t - ti; if (k >= .8 && d >= 0 && d < .4) a = Math.max(a, Math.min(1, k) * Math.exp(-d / .07)); } return a; };
  function drawScene(i, t, gctx) {
    const s = S[i], lt = t - s.t0, prog = clamp(lt / (s.t1 - s.t0));
    g = gctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const z = 1 + .025 * prog; g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    s.f(lt, t); g.restore();
  }
  function render(t) {
    t = clamp(t, 0, END - .001);
    let i = S.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = S.length - 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    let j = -1, p = 0;
    for (let k = 0; k < S.length - 1; k++) { const tb = S[k].t1, h = TRANS[k].h; if (t >= tb - h && t < tb + h) { j = k; p = (t - (tb - h)) / (2 * h); break; } }
    const amp = impAmp(t), fq = Math.floor(t * 30);
    if (amp > .01) { const sc = 1 + Math.min(.05, amp * .035), dx = (rnd(fq + 3) - .5) * 40 * amp, dy = (rnd(fq + 8) - .5) * 40 * amp; ctx.setTransform(sc, 0, 0, sc, W / 2 * (1 - sc) + dx, H / 2 * (1 - sc) + dy); }
    if (j >= 0) { drawScene(j, t, gA); drawScene(j + 1, t, gB); MT.T[TRANS[j].t](ctx, bufA, bufB, p, Object.assign({ logo: im.logo, cores: [Y, R, INK] }, TRANS[j].o || {})); }
    else { drawScene(i, t, gA); ctx.drawImage(bufA, 0, 0); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fa = flashAmp(t); if (fa > .01) { ctx.fillStyle = 'rgba(255,253,235,' + (.6 * fa).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    const lv = music.level(t);
    if (lv > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const gl = ctx.createRadialGradient(W * .5, H * .45, 60, W * .5, H * .45, H * .8); gl.addColorStop(0, 'rgba(255,190,60,' + (.06 * lv).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,190,60,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    ctx.globalAlpha = .5; const ox = Math.floor(rnd(Math.floor(t * 24)) * 256), oy = Math.floor(rnd(Math.floor(t * 24) + 9) * 256);
    ctx.save(); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(ox, oy, W, H); ctx.restore(); ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * .85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (.24 - .05 * lv).toFixed(3) + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const ff = seg(t, END - 1.2, END); if (ff > 0) { ctx.fillStyle = 'rgba(0,0,0,' + ff + ')'; ctx.fillRect(0, 0, W, H); }
  }
  window.__render = render;

  /* =================== TRILHA original (js/trilha-lancamento.js) =================== */
  const music = (() => {
    let buf = null, env = null, ac = null, gain = null, dest = null, src = null, t0 = 0, from = 0, on = false; const FPS = 30;
    const ready = new Promise(r => setTimeout(r, 60)).then(() => TR.render(END)).then(b => {
      buf = b; const d = b.getChannelData(0), step = Math.floor(b.sampleRate / FPS), n = Math.floor(d.length / step), v = new Float32Array(n);
      for (let k = 0; k < n; k++) { let q = 0; for (let x = k * step, e = x + step; x < e; x++) q += d[x] * d[x]; v[k] = Math.sqrt(q / step); }
      const sorted = Array.from(v).sort((a, b) => a - b), ref = sorted[Math.floor(n * .95)] || 1, lo = sorted[Math.floor(n * .2)] || 0;
      env = v.map(x => clamp((x - lo) / (ref - lo))); return b;
    });
    function wire() { if (ac) return; ac = new AudioContext({ sampleRate: 48000 }); gain = ac.createGain(); gain.gain.value = .95; gain.connect(ac.destination); dest = ac.createMediaStreamDestination(); gain.connect(dest); }
    return {
      ready, get buffer() { return buf; },
      play(f) { wire(); ac.resume(); this.stop(); from = f; src = ac.createBufferSource(); src.buffer = buf; src.connect(gain); t0 = ac.currentTime + .03; src.start(t0, f); on = true; },
      stop() { if (src) { try { src.stop(); } catch (e) { } src.disconnect(); src = null; } on = false; },
      now() { return on ? Math.max(from, from + ac.currentTime - t0) : from; },
      stream() { wire(); return dest.stream; },
      level(t) { if (!env) return 0; const k = Math.floor(t * FPS); let s = 0, c = 0; for (let x = k - 2; x <= k + 2; x++) if (env[x] != null) { s += env[x]; c++; } return c ? s / c : 0; }
    };
  })();
  window.__music = music;

  /* =================== player =================== */
  const $ = sel => document.querySelector(sel);
  let playing = false, tNow = 0, raf = 0, recorder = null, chunks = [];
  const seek = $('#seek'), tc = $('#tc');
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function ui() { seek.value = tNow; tc.textContent = `${mmss(tNow)} / ${mmss(END)}`; $('#play').textContent = playing ? '❚❚ Pausar' : '▶ Play'; document.body.classList.toggle('paused', !playing); }
  function loop() {
    if (!playing) return;
    tNow = music.now();
    if (tNow >= END) { tNow = END; render(END - .001); stop(); if (recorder) finishRec(); ui(); return; }
    render(tNow); ui(); raf = requestAnimationFrame(loop);
  }
  if (/[?&]embed=1/.test(location.search)) document.body.classList.add('embed');
  function play(from = tNow) { if (!music.buffer) { music.ready.then(() => play(from)); return; } if (from >= END - .05) from = 0; $('#start').style.display = 'none'; document.body.classList.add('started'); music.play(from); playing = true; tNow = from; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); ui(); }
  function stop() { playing = false; music.stop(); cancelAnimationFrame(raf); ui(); }
  $('#start').onclick = () => play(0);
  $('#play').onclick = () => playing ? stop() : play();
  $('#restart').onclick = () => { stop(); tNow = 0; play(0); };
  seek.oninput = () => { const was = playing; if (was) stop(); tNow = +seek.value; render(tNow); ui(); seek._resume = was; };
  seek.onchange = () => { if (seek._resume) play(+seek.value); };
  $('#fs').onclick = () => { const el = document.documentElement; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen && el.requestFullscreen(); };
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); } });

  /* exportar MP4 quadro a quadro (mais rápido que tempo real; não depende da aba visível) */
  const yieldMC = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  const loadScript = src => new Promise((r, j) => { const sc = document.createElement('script'); sc.src = src; sc.onload = r; sc.onerror = j; document.head.appendChild(sc); });
  async function exportMP4(opts = {}) {
    const buf = await music.ready; await fontsReady;
    if (!window.Mp4Muxer) await loadScript('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js');
    const fps = 30, N = Math.round(END * fps), sr = buf.sampleRate, { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, audio: { codec: 'aac', numberOfChannels: 2, sampleRate: sr }, fastStart: 'in-memory' });
    let err = null;
    const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
    ve.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: opts.bitrate || 8e6, framerate: fps });
    for (let i = 0; i < N; i++) {
      if (err) throw err;
      render(i / fps);
      const fr = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      ve.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close();
      while (ve.encodeQueueSize > 4) await yieldMC();
      if (i % 15 === 0) { opts.onProgress && opts.onProgress(i / N); await yieldMC(); }
    }
    await ve.flush();
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
    ae.configure({ codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: 2, bitrate: 192000 });
    const L = buf.getChannelData(0), Rr = buf.getChannelData(1), total = Math.min(buf.length, Math.round(END * sr)), step = 4800;
    for (let s0 = 0; s0 < total; s0 += step) {
      const n = Math.min(step, total - s0), d = new Float32Array(n * 2); d.set(L.subarray(s0, s0 + n), 0); d.set(Rr.subarray(s0, s0 + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(s0 * 1e6 / sr), data: d }); ae.encode(ad); ad.close();
    }
    await ae.flush(); if (err) throw err; muxer.finalize();
    render(tNow);
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  }
  window.__exportMP4 = exportMP4;
  $('#export').onclick = () => {
    if (window.VideoEncoder && window.AudioEncoder) {
      stop(); const tag = $('#recTag'), tagTxt = tag.textContent; tag.classList.add('on');
      exportMP4({ onProgress: p => tag.textContent = 'Exportando ' + Math.round(p * 100) + '%' })
        .then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'N1_Chicken_Novo_Cardapio.mp4'; document.body.appendChild(a); a.click(); a.remove(); })
        .catch(e => alert('Não deu para exportar: ' + e.message)).finally(() => { tag.classList.remove('on'); tag.textContent = tagTxt; });
      return;
    }
    stop();
    const vs = cv.captureStream(30); const mix = new MediaStream([...vs.getVideoTracks(), ...music.stream().getAudioTracks()]);
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const type = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) { alert('Este navegador não suporta gravação de vídeo. Use o Chrome.'); return; }
    chunks = []; recorder = new MediaRecorder(mix, { mimeType: type, videoBitsPerSecond: 12e6, audioBitsPerSecond: 192e3 });
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'N1_Chicken_Novo_Cardapio.webm'; document.body.appendChild(a); a.click(); a.remove(); $('#recTag').classList.remove('on'); recorder = null; };
    recorder.start(250); $('#recTag').classList.add('on'); tNow = 0; play(0);
  };
  function finishRec() { setTimeout(() => recorder && recorder.state !== 'inactive' && recorder.stop(), 300); }

  /* primeiro quadro (pôster) quando as fontes e imagens carregarem */
  const FONTS = ['400', '500', '600', '700', '800', '900', 'italic 800', 'italic 900'].map(w => `${w} 40px "Fira Sans"`).concat(['600 40px "Dosis"', '700 40px "Dosis"', '800 40px "Dosis"']);
  const fontsReady = Promise.all([...FONTS.map(f => document.fonts.load(f).catch(() => null)), new Promise(r => { if (im.logo.complete) r(); else { im.logo.onload = r; im.logo.onerror = r; } })]);
  fontsReady.then(() => { render(1.4); ui(); });
  { const lb = $('#start small'); if (lb) { const txt = lb.textContent; lb.textContent = 'Preparando a trilha…'; music.ready.then(() => { lb.textContent = txt; }); } }
  render(0);
  if (/[?&]t=([\d.]+)/.test(location.search)) { tNow = +RegExp.$1; setTimeout(() => render(tNow), 800); }
})();
