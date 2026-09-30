/* N1 Chicken · Vídeo de apresentação (88,5 s)
   Motion horizontal contínuo em canvas + trilha original em Web Audio.
   A câmera percorre um "mundo" horizontal; as cenas ficam lado a lado e a
   transição é o próprio movimento (chicote com rastro e faixas da marca). */
(() => {
  const W = 1920, H = 1080, END = 88.5, GAP = 520, SW = W + GAP;
  const Y = '#FFED00', R = '#FF0000', R2 = '#C80000', INK = '#1A0C05', PAPER = '#FFFCEB', MUTE = '#7A6A5E', O1 = '#E0550F', Y2 = '#FFC928';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const buf = document.createElement('canvas'); buf.width = W; buf.height = H; const g = buf.getContext('2d');
  const { IMG } = window.N1;

  /* ---------- utilidades ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const eInOutExpo = t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  const eOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
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
  /* texto que "sobe" de dentro de uma máscara */
  function rise(str, x, y, p, o = {}) {
    if (p <= 0) return; const s = o.s || 80; const e = eOutExpo(clamp(p));
    g.save(); g.font = F(o.w || 900, s, o.it !== false, o.f); if ('letterSpacing' in g) g.letterSpacing = (o.ls || -2) + 'px';
    const w = g.measureText(str).width; const ax = o.a === 'right' ? x - w : o.a === 'center' ? x - w / 2 : x;
    g.beginPath(); g.rect(ax - 20, y - s * 1.05, w + 60, s * 1.45); g.clip();
    g.fillStyle = o.c || INK; g.textAlign = 'left'; g.fillText(str, ax, y + (1 - e) * s * 1.2); g.restore();
  }
  const EXT = 90; // cada cena pinta além das bordas para o drift da câmera não mostrar frestas
  const bg = c => { g.fillStyle = c; g.fillRect(-EXT, 0, W + EXT * 2, H); };
  function rr(c, x, y, w, h, r, keep) { r = Math.min(r, w / 2, h / 2); if (!keep) c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function cover(im, x, y, w, h, fx = .5, fy = .5) { if (!im || !im.complete || !im.naturalWidth) { g.fillStyle = Y2; g.fillRect(x, y, w, h); return; } const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s; g.drawImage(im, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih); }
  function wrap(str, x, y, maxW, lh, o) { g.save(); g.font = F(o.w || 400, o.s || 24, o.it, o.f); const words = str.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { T(line, x, yy, o); line = w; yy += lh; } else line = t; } if (line) T(line, x, yy, o); g.restore(); return yy; }
  function pill(str, x, y, o = {}) { g.save(); g.font = F(800, o.s || 20, false, 'Dosis'); if ('letterSpacing' in g) g.letterSpacing = '1.5px'; const w = g.measureText(str.toUpperCase()).width + (o.px || 28); const h = (o.s || 20) * 1.8; const ax = o.a === 'right' ? x - w : o.a === 'center' ? x - w / 2 : x; rr(g, ax, y - h / 2, w, h, h / 2); g.fillStyle = o.bg || Y; g.globalAlpha *= o.al == null ? 1 : o.al; g.fill(); if (o.bd) { g.strokeStyle = o.bd; g.lineWidth = 2; g.stroke(); } g.fillStyle = o.c || INK; g.textBaseline = 'middle'; g.fillText(str.toUpperCase(), ax + (o.px || 28) / 2, y + 1); g.restore(); return w; }

  /* ---------- imagens ---------- */
  const load = src => { const i = new Image(); i.crossOrigin = 'anonymous'; i.src = src; return i; };
  const im = {}; Object.entries(IMG).forEach(([k, v]) => im[k] = load(v));
  const prints = {}; ['03_favoritos_duplicados', '05_modal_combo_m_complementos', '07_sobremesas_sem_foto', '02_super_ofertas', '08_clube_day_week_precos_diferentes', '00_loja_burgers_topo', '01_loja_n1_topo'].forEach(k => prints[k] = load(`assets/prints/${k}.jpg`));
  /* grão de filme pré-gerado */
  const grain = document.createElement('canvas'); grain.width = grain.height = 256; { const gc = grain.getContext('2d'), d = gc.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } gc.putImageData(d, 0, 0); }

  /* ---------- cenas ---------- */
  const S = [
    { id: 'intro', t0: 0, t1: 7.5, ch: '' },
    { id: 'nums', t0: 7.5, t1: 17, ch: '01 · Onde estamos' },
    { id: 'funil', t0: 17, t1: 27, ch: '02 · Onde o cliente sai' },
    { id: 'hoje', t0: 27, t1: 41, ch: '03 · Como é hoje' },
    { id: 'ticket', t0: 41, t1: 47, ch: '04 · O custo disso' },
    { id: 'ifood', t0: 47, t1: 61, ch: '05 · Como vai ficar · iFood' },
    { id: 'app', t0: 61, t1: 73, ch: '06 · Como vai ficar · App N1' },
    { id: 'cmv', t0: 73, t1: 81, ch: '07 · CMV 28%' },
    { id: 'fim', t0: 81, t1: END, ch: '08 · O resultado' }
  ];
  S.forEach((s, i) => { s.X = i * SW; s.D = s.t1 - s.t0; });
  const TR = 0.55; // meia-janela do chicote
  function camX(t) {
    for (let j = 0; j < S.length - 1; j++) { const tb = S[j].t1; if (t >= tb - TR && t <= tb + TR) { const k = eInOutExpo((t - (tb - TR)) / (2 * TR)); return lerp(S[j].X + 50, S[j + 1].X - 50, k); } }
    const s = S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1];
    const a = s.t0 + (s.t0 ? TR : 0), b = s.t1 - (s === S[S.length - 1] ? 0 : TR);
    return s.X + lerp(s.t0 ? -50 : 0, s === S[S.length - 1] ? 0 : 50, clamp((t - a) / (b - a)));
  }

  /* camadas com paralaxe: f<1 fundo, f>1 frente */
  let CX = 0;
  function layer(s, f, fn) { g.save(); g.translate((1 - f) * (CX - s.X), 0); fn(); g.restore(); }

  /* faixas da marca no vão entre cenas (o chicote passa por elas) */
  function ribbon(j) {
    const x0 = S[j].X + W + EXT, GW = GAP - EXT * 2; g.save(); g.beginPath(); g.rect(x0, 0, GW, H); g.clip();
    const cols = [Y, R, INK, Y, R];
    for (let k = -6; k < 12; k++) { g.fillStyle = cols[(k + 60 + j) % cols.length]; g.beginPath(); const x = x0 + k * 110; g.moveTo(x, 0); g.lineTo(x + 110, 0); g.lineTo(x + 110 - 420, H); g.lineTo(x - 420, H); g.fill(); }
    if (im.logo.complete) { g.globalAlpha = .9; g.save(); g.translate(x0 + GW / 2, H / 2); g.rotate(-.3 + j); g.beginPath(); g.arc(0, 0, 150, 0, 7); g.clip(); g.drawImage(im.logo, -150, -150, 300, 300); g.restore(); }
    g.restore();
  }

  /* ---------- mockups ---------- */
  function phone(x, y, w, h, draw) {
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 60; g.shadowOffsetY = 30;
    rr(g, x, y, w, h, 64); g.fillStyle = '#120806'; g.fill(); g.restore();
    g.save(); rr(g, x + 14, y + 14, w - 28, h - 28, 52); g.clip(); g.translate(x + 14, y + 14); draw(w - 28, h - 28); g.restore();
    g.save(); rr(g, x + w / 2 - 70, y + 26, 140, 38, 19); g.fillStyle = '#120806'; g.fill(); g.restore();
  }
  function logoCircle(x, y, r) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); if (im.logo.complete) g.drawImage(im.logo, x - r, y - r, r * 2, r * 2); else { g.fillStyle = R; g.fill(); } g.restore(); }
  function check(x, y, p, c = R) { if (p <= 0) return; g.save(); g.beginPath(); g.arc(x, y, 18, 0, 7); g.fillStyle = c; g.globalAlpha = clamp(p * 3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = g.lineJoin = 'round'; g.beginPath(); const e = clamp(p * 1.6); g.moveTo(x - 8, y); if (e > 0) g.lineTo(x - 8 + 6 * clamp(e * 2), y + 6 * clamp(e * 2)); if (e > .5) g.lineTo(x - 2 + 12 * clamp((e - .5) * 2), y + 6 - 13 * clamp((e - .5) * 2)); g.stroke(); g.restore(); }

  /* ---------- CENA 0 · abertura ---------- */
  function sIntro(s, lt) {
    bg(INK);
    // linha que desenha o horizonte
    const lp = eInOutCubic(seg(lt, .25, 1.1)); if (lt < 1.6) { g.fillStyle = '#fff'; g.globalAlpha = 1 - seg(lt, 1.2, 1.6); g.fillRect(W / 2 - lp * W / 2, H / 2 - 2, lp * W, 4); g.globalAlpha = 1; }
    const pp = eOutExpo(seg(lt, 1.15, 2.2));
    layer(s, .8, () => {
      g.fillStyle = Y; g.fillRect(lerp(-W / 2 - EXT * 2, -EXT * 2, pp), 0, W / 2 + EXT * 2, H);
      g.fillStyle = R; g.fillRect(lerp(W + EXT * 2, W / 2, pp), 0, W / 2 + EXT * 2, H);
      // marca d'água girando
      if (im.logo.complete && pp > 0) { g.save(); g.globalAlpha = .07 * pp; g.translate(W / 2, H / 2); g.rotate(lt * .05); g.beginPath(); g.arc(0, 0, 900, 0, 7); g.clip(); g.drawImage(im.logo, -900, -900, 1800, 1800); g.restore(); }
    });
    // selo
    const sp = seg(lt, 2.05, 2.95);
    if (sp > 0) { const e = eOutBack(sp, 1.9); g.save(); g.translate(W / 2, H / 2); g.rotate((1 - eOutExpo(sp)) * -2.2); g.scale(e, e); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 80; g.shadowOffsetY = 30; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent'; logoCircle(0, 0, 238); g.restore();
      // anéis de impacto
      for (let k = 0; k < 3; k++) { const q = seg(lt, 2.2 + k * .12, 3.2 + k * .12); if (q > 0 && q < 1) { g.save(); g.strokeStyle = k % 2 ? Y : '#fff'; g.globalAlpha = 1 - q; g.lineWidth = 10 * (1 - q); g.beginPath(); g.arc(W / 2, H / 2, 260 + q * 520, 0, 7); g.stroke(); g.restore(); } }
    }
    layer(s, 1.25, () => {
      rise('O maior frango', 100, 480, seg(lt, 3.0, 3.9), { s: 86, c: INK });
      rise('da rede.', 100, 580, seg(lt, 3.15, 4.05), { s: 86, c: INK });
      rise('ganhou o', W - 100, 480, seg(lt, 3.55, 4.45), { s: 86, c: '#fff', a: 'right' });
      rise('cardápio Nº1.', W - 100, 580, seg(lt, 3.7, 4.6), { s: 86, c: '#fff', a: 'right' });
    });
    const kp = seg(lt, 4.4, 5.2); if (kp > 0) { T('NOVA ESTRUTURA DE CARDÁPIO · iFOOD + APP PRÓPRIO', W / 2, 1000, { f: 'Dosis', w: 800, s: 22, ls: 6, a: 'center', c: INK, al: eOutCubic(kp) }); }
  }

  /* ---------- CENA 1 · números ---------- */
  function sNums(s, lt) {
    bg(PAPER);
    layer(s, .6, () => { g.fillStyle = Y; g.globalAlpha = .55; g.beginPath(); g.arc(1650, 180, 330, 0, 7); g.fill(); g.globalAlpha = 1; });
    layer(s, 1, () => {
      T('BI TASTEFY · SETEMBRO/2026 · TODAS AS LOJAS N1', 120, 150, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .2, .6) });
      rise('A N1 já é a número um.', 120, 270, seg(lt, .35, 1.2), { s: 96 });
      rise('O cardápio ainda não.', 120, 380, seg(lt, .6, 1.45), { s: 96, c: R });
    });
    const out = eInOutExpo(seg(lt, 4.6, 5.4));
    layer(s, 1.3, () => {
      g.save(); g.translate(-out * 900, 0); g.globalAlpha = 1 - out;
      const cards = [[517910, 0, '', '', 'visitas/mês na loja'], [60850, 0, '', '', 'pedidos em setembro'], [3.59, 2, 'R$ ', ' mi', 'de GMV no mês'], [34, 0, '', '%', 'dos pedidos da rede']];
      cards.forEach((c, i) => {
        const p = seg(lt, .9 + i * .18, 2.8 + i * .18), x = 120 + i * 430;
        g.fillStyle = INK; g.globalAlpha = (1 - out) * clamp(p * 4); g.fillRect(x, 520, 390, 4); g.globalAlpha = 1 - out;
        T(c[2] + nf(c[0] * eOutExpo(p), c[1]) + c[3], x, 650, { f: 'Dosis', w: 800, s: 104, al: clamp(p * 3) });
        T(c[4], x, 705, { w: 600, s: 30, c: MUTE, al: clamp(p * 3) });
      });
      g.restore();
    });
    const bp = seg(lt, 5.0, 6.8);
    if (bp > 0) layer(s, 1.15, () => {
      T('CONVERSÃO NO iFOOD · SET/26', 120, 540, { f: 'Dosis', w: 800, s: 22, ls: 5, c: MUTE, al: clamp(bp * 3) });
      const bars = [['Marmita Top', 14.93, INK], ['Brasileirinho', 13.99, INK], ['N1 Chicken', 11.75, R]];
      bars.forEach((b, i) => {
        const p = eOutExpo(seg(lt, 5.2 + i * .25, 6.6 + i * .25)), y = 600 + i * 120;
        T(b[0], 120, y + 48, { w: 800, s: 38, al: clamp(p * 2) });
        rr(g, 520, y, 1100 * (b[1] / 15) * p, 64, 32); g.fillStyle = b[2]; g.fill();
        T(nf(b[1] * p, 2) + '%', 540 + 1100 * (b[1] / 15) * p, y + 48, { f: 'Dosis', w: 800, s: 44, c: b[2] });
      });
      rise('Mais tráfego da rede. Conversão abaixo das irmãs.', 120, 1000, seg(lt, 7.1, 7.9), { s: 44, it: true, w: 800, c: INK });
    });
  }

  /* ---------- CENA 2 · funil ---------- */
  const FUN = [100, 50.9, 20.3, 19.4, 11.2], FUNK = ['Visitas', 'Clicam num item', 'Põem na sacola', 'Checkout', 'Pedem'];
  function sFunil(s, lt) {
    bg(INK);
    layer(s, 1, () => {
      rise('De cada 100 que entram,', 120, 190, seg(lt, .3, 1.1), { s: 88, c: '#fff' });
      rise('só 11 pedem.', 120, 290, seg(lt, .5, 1.3), { s: 88, c: Y });
    });
    const x0 = 120, x1 = 1800, cw = (x1 - x0) / 5, cy = 660, bh = v => 420 * v / 100;
    const band = x => { const col = (x - x0) / cw, i = clamp(Math.floor(col), 0, 4), j = Math.min(4, i + 1), f = col - i; return bh(FUN[i] + (FUN[j] - FUN[i]) * clamp((f - .6) / .4)); };
    layer(s, 1, () => {
      const op = seg(lt, .8, 1.6);
      g.globalAlpha = op; g.beginPath(); g.moveTo(x0, cy - band(x0) / 2);
      for (let x = x0; x <= x1; x += 10) g.lineTo(x, cy - band(x) / 2);
      for (let x = x1; x >= x0; x -= 10) g.lineTo(x, cy + band(x) / 2);
      const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,237,0,.22)'); gr.addColorStop(1, 'rgba(255,0,0,.3)'); g.fillStyle = gr; g.fill(); g.globalAlpha = 1;
      // partículas determinísticas
      const rate = 150;
      const n1 = Math.floor(lt * rate), n0 = Math.max(0, n1 - rate * 6);
      for (let k = n0; k < n1; k++) {
        const born = k / rate, age = lt - born; if (age < 0 || born < .9) continue;
        const v = 330 + rnd(k) * 260, r = rnd(k + 7) * 100; let exit = 5; for (let i = 1; i < 5; i++) if (r > FUN[i]) { exit = i; break; }
        const exX = x0 + cw * exit - cw * .12; let x = x0 + age * v; const yb = (rnd(k + 3) - .5) * .9;
        let y = cy + yb * band(Math.min(x, exX)); let a = 1, col = Y;
        if (exit < 5 && x > exX) { const tf = (x - exX) / v; x = exX + (x - exX) * .5; y += 900 * tf * tf - 60 * tf; a = clamp(1 - tf * 1.3); col = '#ff5a4a'; }
        if (x > x1 + 40 || a <= 0) continue;
        g.globalAlpha = a * op; g.fillStyle = col; g.beginPath(); g.arc(x, y, 3 + rnd(k + 11) * 3, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      FUN.forEach((v, i) => {
        const p = seg(lt, 1 + i * .3, 1.8 + i * .3), x = x0 + i * cw;
        g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x, 380, 2, 560 * p);
        T(nf(v, v % 1 ? 1 : 0), x + 22, 440, { f: 'Dosis', w: 800, s: 70, c: Y, al: p });
        T(FUNK[i].toUpperCase(), x + 22, 960, { f: 'Dosis', w: 800, s: 22, ls: 3, c: '#fff', al: p * .85 });
        if (i) T('−' + nf(100 - v / FUN[i - 1] * 100, 0) + '%', x + 22, 480, { f: 'Dosis', w: 800, s: 26, c: '#ff6a5a', al: p });
      });
    });
    // chamadas
    const c1 = seg(lt, 3.6, 4.2), c2 = seg(lt, 5.2, 5.8), c3 = seg(lt, 7.2, 8);
    layer(s, 1.2, () => {
      if (c1 > 0) { pill('49% não clicam em nada', x0 + cw * .95, 330, { bg: '#fff', s: 22, al: eOutCubic(c1) }); }
      if (c2 > 0) { const pulse = 1 + Math.sin(lt * 8) * .03; g.save(); g.translate(x0 + cw * 1.95, 330); g.scale(pulse, pulse); pill('60% abrem o item e desistem', 0, 0, { bg: R, c: '#fff', s: 22, al: eOutCubic(c2) }); g.restore(); }
    });
    if (c3 > 0) rise('É aqui que o cardápio perde a venda.', 1800, 1040, c3, { s: 44, c: '#fff', a: 'right' });
  }

  /* ---------- CENA 3 · como é hoje (tira de filme) ---------- */
  const SHOTS = [
    ['03_favoritos_duplicados', 'Super Combo em 4 preços diferentes', [50.4, 45.4, 33.2, 22.2]],
    ['05_modal_combo_m_complementos', 'Combo sem bebida, doce ou upgrade · +R$ 48,03', [49.6, 52.6, 30.8, 20]],
    ['07_sobremesas_sem_foto', 'Doce sem foto · na 12ª de 13 categorias', [15.6, 19.5, 68, 22.6]],
    ['02_super_ofertas', '"Tags:" aparecendo para o cliente', [16, 25, 23, 5.5]],
    ['08_clube_day_week_precos_diferentes', 'Clube Day/Week: o cardápio duplicado', [50.4, 45.4, 33.2, 22.4]],
    ['00_loja_burgers_topo', '284 produtos · 29 duplicados na rede', [37.3, 70.6, 21, 29]]
  ];
  const SH_W = 1000, SH_H = SH_W * 744 / 1568, SH_G = 70, SH_SP = 440;
  const shotT = i => (300 + (SH_W + SH_G) * i) / SH_SP;
  function sHoje(s, lt) {
    bg(PAPER);
    layer(s, .7, () => { g.fillStyle = Y; g.fillRect(-600, 700, W + 1200, 380); });
    layer(s, 1, () => {
      T('iFOOD · N1 CHICKEN VITÓRIA-ES · PRINTS DE 30/09/2026', 120, 130, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .1, .5) });
      rise('Como é hoje.', 120, 235, seg(lt, .2, 1), { s: 100 });
    });
    layer(s, 1, () => {
      const base = 760 - lt * SH_SP;
      SHOTS.forEach((sh, i) => {
        const x = base + i * (SH_W + SH_G), y = 310; if (x > W + 50 || x + SH_W < -50) return;
        const tilt = Math.sin((x + SH_W / 2 - W / 2) / 1400) * .04;
        g.save(); g.translate(x + SH_W / 2, y + SH_H / 2); g.rotate(tilt); g.translate(-SH_W / 2, -SH_H / 2);
        g.shadowColor = 'rgba(26,12,5,.28)'; g.shadowBlur = 50; g.shadowOffsetY = 24; rr(g, 0, 0, SH_W, SH_H, 22); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
        g.save(); rr(g, 0, 0, SH_W, SH_H, 22); g.clip(); cover(prints[sh[0]], 0, 0, SH_W, SH_H, .5, 0); g.restore();
        const mp = seg(lt, shotT(i) - .7, shotT(i) + .2), m = sh[2];
        if (mp > 0) {
          const mx = m[0] / 100 * SH_W, my = m[1] / 100 * SH_H, mw = m[2] / 100 * SH_W, mh = m[3] / 100 * SH_H;
          g.save(); g.fillStyle = 'rgba(26,12,5,.35)'; g.globalAlpha = eOutCubic(mp); g.beginPath(); g.rect(0, 0, SH_W, SH_H); rr(g, mx - 8, my - 8, mw + 16, mh + 16, 14, true); g.fill('evenodd'); g.restore();
          const per = 2 * (mw + mh + 32); g.save(); g.strokeStyle = R; g.lineWidth = 7; g.setLineDash([per * eOutCubic(mp), per]); rr(g, mx - 8, my - 8, mw + 16, mh + 16, 14); g.stroke(); g.restore();
          const sc = eOutBack(clamp(mp * 1.4)); g.save(); g.translate(mx + mw + 8, my - 8); g.scale(sc, sc); g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fillStyle = R; g.fill(); T(String(i + 1), 0, 10, { f: 'Dosis', w: 800, s: 30, c: '#fff', a: 'center' }); g.restore();
        }
        g.restore();
        const lp = seg(lt, shotT(i) - .4, shotT(i) + .4);
        if (lp > 0) { g.save(); g.globalAlpha = eOutCubic(lp); g.beginPath(); g.arc(x + 30, y + SH_H + 76, 28, 0, 7); g.fillStyle = R; g.fill(); T(String(i + 1), x + 30, y + SH_H + 87, { f: 'Dosis', w: 800, s: 30, c: '#fff', a: 'center' }); T(sh[1], x + 76, y + SH_H + 88, { w: 800, s: 36 }); g.restore(); }
      });
    });
    const cp = seg(lt, 1.2, 2);
    if (cp > 0) layer(s, 1.25, () => {
      const items = ['13 categorias', '284 produtos', '29 duplicados', '4 preços no mesmo combo'];
      let x = 120; items.forEach((t, i) => { const q = seg(lt, 1.2 + i * .2, 2 + i * .2); x += pill(t, x, 1010, { bg: i === 3 ? R : INK, c: i === 3 ? '#fff' : Y, s: 22, al: eOutCubic(q) }) + 14; });
    });
  }

  /* ---------- CENA 4 · ticket ---------- */
  function sTicket(s, lt) {
    bg(R);
    layer(s, .7, () => { g.fillStyle = R2; for (let k = 0; k < 9; k++) g.fillRect(-600, 140 + k * 110, W + 1200, 2); });
    layer(s, 1, () => {
      T('CAMPANHA MAUÁ · JUL → SET/2026', 120, 150, { f: 'Dosis', w: 800, s: 22, ls: 5, c: Y, al: seg(lt, .1, .5) });
      rise('O volume subiu.', 120, 260, seg(lt, .25, 1), { s: 96, c: '#fff' });
      rise('O ticket caiu.', 120, 370, seg(lt, .7, 1.5), { s: 96, c: Y });
      const pts = [[0, 50.01, 'jul'], [1, 42.03, 'ago'], [2, 39.81, 'set']], X = i => 1000 + i * 340, Yv = v => 900 - (v - 30) * 22;
      const dp = seg(lt, 1.4, 3.2);
      g.save(); g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineCap = g.lineJoin = 'round'; g.beginPath();
      const segs = 2 * eInOutCubic(dp); g.moveTo(X(0), Yv(pts[0][1]));
      for (let i = 1; i <= 2; i++) { const f = clamp(segs - (i - 1)); if (f <= 0) break; g.lineTo(lerp(X(i - 1), X(i), f), lerp(Yv(pts[i - 1][1]), Yv(pts[i][1]), f)); }
      g.stroke(); g.restore();
      pts.forEach((p, i) => { const q = seg(lt, 1.4 + i * .85, 1.9 + i * .85); if (q <= 0) return; g.beginPath(); g.arc(X(i), Yv(p[1]), 16 * eOutBack(q), 0, 7); g.fillStyle = Y; g.fill(); T(brl(p[1]), X(i), Yv(p[1]) - 40, { f: 'Dosis', w: 800, s: 46, c: '#fff', a: 'center', al: q }); T(p[2].toUpperCase(), X(i), 990, { f: 'Dosis', w: 800, s: 24, ls: 4, c: Y, a: 'center', al: q }); });
      const bp = seg(lt, 3.3, 4.1); if (bp > 0) { pill('+28,6% em pedidos', 120, 520, { bg: '#fff', s: 26, al: eOutCubic(bp) }); pill('−20,4% no ticket', 120, 600, { bg: INK, c: Y, s: 26, al: eOutCubic(seg(lt, 3.6, 4.3)) }); }
      const fp = seg(lt, 4.3, 5.1); if (fp > 0) wrap('O novo cardápio recupera o ticket sem perder o volume.', 120, 760, 760, 56, { w: 800, s: 46, it: true, c: '#fff', al: eOutCubic(fp) });
    });
  }

  /* ---------- CENA 5 · novo iFood ---------- */
  function ifoodScreen(w, h, lt) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    cover(im.capa, 0, 0, w, 170); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, 0, w, 170);
    g.save(); g.beginPath(); g.arc(56, 186, 40, 0, 7); g.fillStyle = '#fff'; g.fill(); g.restore(); logoCircle(56, 186, 36);
    T('N1 Chicken - Frango Frito Crocante', 108, 212, { w: 700, s: 22, c: '#3e3e3e' }); T('★ 4.8', 108, 240, { w: 700, s: 18, c: '#e7a74e' });
    const tabs = ['Só pra mim', 'Pra dois', 'Pra galera', 'Frango & Bites', 'Burgers'];
    const ti = lt < 2.2 ? 0 : lt < 3.6 ? 1 : 2;
    let tx = 20; const tpos = []; tabs.forEach((t, i) => { g.font = F(700, 18); const tw = g.measureText(t).width; tpos.push([tx, tw]); T(t, tx, 296, { w: 700, s: 18, c: i === ti ? '#ea1d2c' : '#717171' }); tx += tw + 30; });
    g.fillStyle = '#ea1d2c'; g.fillRect(tpos[ti][0], 306, tpos[ti][1], 3); g.fillStyle = '#eee'; g.fillRect(0, 312, w, 1);
    const sets = [['combo-p', '4-em-n1', 'trio'], ['super-combo', 'combo-m', 'dupla'], ['combo-gg', 'combo-g', '3-burgers']];
    const all = window.N1.categories.flatMap(c => c.items);
    const list = sets[ti].map(id => all.find(i => i.id === id));
    const sw = seg(lt, ti === 0 ? 0 : ti === 1 ? 2.2 : 3.6, (ti === 0 ? 0 : ti === 1 ? 2.2 : 3.6) + .5);
    T(['Só pra mim', 'Pra dois', 'Pra galera'][ti], 20, 356, { w: 800, s: 24, c: '#3e3e3e' });
    list.forEach((it, k) => {
      const y = 380 + k * 170, a = eOutCubic(clamp(sw * 1.5 - k * .2));
      g.save(); g.globalAlpha = a; g.translate((1 - a) * 60, 0);
      T(it.name.split(' · ')[0], 20, y + 30, { w: 700, s: 20, c: '#3e3e3e' });
      T(`Serve ${it.serve} · ${it.desc.slice(0, 34)}…`, 20, y + 58, { w: 400, s: 15, c: '#999' });
      if (it.badge) pill(it.badge, 20, y + 90, { s: 13, bg: '#fff4bf', c: '#6b5200', px: 18 });
      T(brl(it.price), 20, y + 134, { w: 700, s: 20, c: '#50a773' }); if (it.de) T(brl(it.de), 130, y + 134, { w: 400, s: 15, c: '#aaa' });
      if (it.de) pill('economize ' + brl(it.de - it.price), 225, y + 128, { s: 12, bg: '#e8f6ee', c: '#1f7a45', px: 16 });
      g.save(); rr(g, w - 170, y + 14, 150, 118, 12); g.clip(); cover(im[({ 'combo-p': 'comboP', '4-em-n1': 'trio', trio: 'trio', 'combo-m': 'comboM', 'super-combo': 'superCombo', dupla: 'burgers2', 'combo-gg': 'comboGG', 'combo-g': 'comboG', '3-burgers': 'burgers3' })[it.id]], w - 170, y + 14, 150, 118); g.restore();
      g.fillStyle = '#f3f3f3'; g.fillRect(20, y + 156, w - 40, 1);
      if (it.badge && ti === 2) { g.strokeStyle = R; g.lineWidth = 3; rr(g, 8, y + 2, w - 16, 150, 14); g.stroke(); }
      g.restore();
    });
    // sheet de complementos
    const sp = eOutExpo(seg(lt, 6, 6.8));
    if (sp > 0) {
      g.fillStyle = `rgba(0,0,0,${.45 * sp})`; g.fillRect(0, 0, w, h);
      const top = lerp(h, 210, sp); g.save(); rr(g, 0, top, w, h - top + 40, 28); g.fillStyle = '#fff'; g.fill(); g.clip();
      g.save(); rr(g, 20, top + 20, w - 40, 170, 18); g.clip(); cover(im.comboG, 20, top + 20, w - 40, 170); g.restore();
      T('Combo G · serve 3 a 5 · R$ 148,90', 24, top + 232, { w: 900, s: 28, it: true, c: INK });
      const grp = [['Troca premium · Onion Rings', '+ R$ 8,90', 7.4], ['Coca lata no combo (avulsa R$ 13,90)', '+ R$ 11,90', 8.6], ['Fecha com doce? · Brigadeiro N1', '+ R$ 7,90', 9.8]];
      grp.forEach((gp, k) => {
        const y = top + 270 + k * 96; g.fillStyle = '#f6f3e6'; rr(g, 20, y, w - 40, 88, 14); g.fill();
        T(gp[0], 40, y + 38, { w: 700, s: 18, c: INK }); T(gp[1], 40, y + 68, { f: 'Dosis', w: 800, s: 20, c: MUTE });
        check(w - 60, y + 44, seg(lt, gp[2], gp[2] + .45)); if (lt < gp[2]) { g.strokeStyle = '#cfc6b8'; g.lineWidth = 3; g.beginPath(); g.arc(w - 60, y + 44, 16, 0, 7); g.stroke(); }
      });
      const tot = 148.9 + (lt > 7.5 ? 8.9 : 0) + (lt > 8.7 ? 11.9 : 0) + (lt > 9.9 ? 7.9 : 0);
      const by = top + 580; rr(g, 20, by, w - 40, 76, 16); g.fillStyle = R; g.fill();
      T('Adicionar', 44, by + 48, { w: 800, s: 22, c: '#fff' }); T(brl(tot), w - 44, by + 48, { f: 'Dosis', w: 800, s: 26, c: '#fff', a: 'right' });
      g.restore();
    }
  }
  function sIfood(s, lt) {
    bg(Y);
    layer(s, .6, () => { if (im.logo.complete) { g.save(); g.globalAlpha = .08; g.translate(1450, 540); g.rotate(lt * .04); g.beginPath(); g.arc(0, 0, 640, 0, 7); g.clip(); g.drawImage(im.logo, -640, -640, 1280, 1280); g.restore(); } });
    layer(s, 1, () => {
      T('COMO VAI FICAR · iFOOD', 120, 170, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .1, .5) });
      rise('Com as armas', 120, 285, seg(lt, .25, 1), { s: 100 });
      rise('da plataforma.', 120, 395, seg(lt, .4, 1.15), { s: 100 });
      wrap('Categorias, itens e complementos. Nada que o iFood não tenha.', 120, 470, 640, 44, { w: 600, s: 32, c: INK, al: eOutCubic(seg(lt, 1, 1.6)) });
      const rows = [['13 → 7', 'categorias por ocasião'], ['284 → 32', 'itens no cardápio mestre'], ['≤ 28%', 'de CMV em todo item']];
      rows.forEach((r, i) => { const p = seg(lt, 1.8 + i * .5, 2.5 + i * .5); T(r[0], 120, 660 + i * 130, { f: 'Dosis', w: 800, s: 76, c: i === 1 ? R : INK, al: eOutCubic(p) }); T(r[1], 520, 650 + i * 130, { w: 700, s: 30, c: INK, al: eOutCubic(p) }); });
    });
    layer(s, 1.12, () => { const e = eOutExpo(seg(lt, .4, 1.4)); phone(960, 90 + (1 - e) * 900, 470, 950, (w, h) => ifoodScreen(w, h, lt)); });
    layer(s, 1.3, () => {
      const tags = [['Âncora primeiro, selo no meio', 3.9, 330], ['Complemento = garçom', 7.3, 520], ['Bebida R$ 2 mais barata no combo', 8.5, 620], ['Doce dentro de todo combo', 9.7, 720]];
      tags.forEach(([t, at, y]) => { const p = seg(lt, at, at + .5); if (p > 0) { g.save(); g.translate((1 - eOutExpo(p)) * 60, 0); pill(t, 1470, y, { bg: INK, c: Y, s: 19, al: eOutCubic(p) }); g.restore(); } });
      const fp = seg(lt, 11, 11.8); if (fp > 0) { T('TICKET DO PEDIDO', 1470, 850, { f: 'Dosis', w: 800, s: 20, ls: 4, c: INK, al: fp }); T('R$ 148,90 → R$ 177,60', 1470, 910, { f: 'Dosis', w: 800, s: 50, c: R, al: eOutCubic(fp) }); T('+19% no pedido · CMV 27,7%', 1470, 955, { w: 700, s: 26, c: INK, al: fp }); }
    });
  }

  /* ---------- CENA 6 · app + IA ---------- */
  const CHAT = [
    [1.4, 'bot', 'E aí! Sou o N1 🍗 Me fala duas coisinhas que eu monto seu pedido.'],
    [2.4, 'bot', 'Quantas pessoas vão comer?', ['Só eu', '2', '3 a 4', '5+'], 2],
    [3.2, 'me', '3 a 4'],
    [3.8, 'bot', 'E o tamanho da fome? 😅', ['Beliscar', 'Normal', 'De campeão'], 2],
    [4.6, 'me', 'Fome de campeão 🔥'],
    [5.2, 'bot', 'É pra quê?', ['Jogo 🏆', 'Série', 'Almoço'], 0],
    [5.9, 'me', 'Jogo 🏆'],
    [6.6, 'rec'],
    [8.0, 'bot', 'Dia de jogo pede Coca gelada. Incluo 2 latas por + R$ 23,80?'],
    [8.8, 'me', 'Bora!'],
    [9.4, 'bot', 'Fechado! Combo G + 2 Cocas = R$ 172,70. Chega em 35–45 min 🛵']
  ];
  function chatScreen(w, h, lt) {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    g.fillStyle = R; g.fillRect(0, 0, w, 210);
    T('Boa noite! 👋', 30, 110, { f: 'Dosis', w: 700, s: 20, c: '#fff' }); T('Bateu a fome?', 30, 160, { w: 900, it: true, s: 30, c: '#fff' });
    g.save(); rr(g, w - 130, 80, 104, 64, 14); g.fillStyle = Y; g.fill(); T('N1 POINTS', w - 78, 106, { f: 'Dosis', w: 800, s: 14, c: INK, a: 'center' }); T('2/10 ★', w - 78, 132, { f: 'Dosis', w: 800, s: 20, c: INK, a: 'center' }); g.restore();
    // chips de fundo
    ['Pra galera', 'Pra dois', 'Só pra mim'].forEach((c, i) => pill(c, 30 + i * 150, 250, { s: 15, bg: i ? '#fff' : INK, c: i ? INK : Y, px: 22 }));
    const op = eOutExpo(seg(lt, 1, 1.5));
    // bolinha
    const fx = w - 70, fy = h - 80, pulse = (lt * 1.2) % 1;
    g.save(); g.strokeStyle = Y; g.globalAlpha = 1 - pulse; g.lineWidth = 4; g.beginPath(); g.arc(fx, fy, 40 + pulse * 26, 0, 7); g.stroke(); g.restore();
    g.beginPath(); g.arc(fx, fy, 40, 0, 7); g.fillStyle = Y; g.fill(); logoCircle(fx, fy, 30);
    if (op <= 0) return;
    const top = 300, bot = h - 140;
    g.save(); g.globalAlpha = op; rr(g, 16, top + (1 - op) * 40, w - 32, bot - top, 26); g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 40; g.fill(); g.restore();
    g.save(); rr(g, 16, top, w - 32, bot - top, 26); g.clip();
    // mensagens (rolam para cima)
    let y = top + 100; const items = [];
    CHAT.forEach(m => { if (lt < m[0]) return; items.push(m); });
    const lines = [];
    items.forEach(m => {
      const age = lt - m[0], a = eOutBack(clamp(age / .35), 1.4);
      if (m[1] === 'rec') { lines.push({ h: 280, draw: yy => recCards(yy, w, a, lt) }); return; }
      g.font = F(m[1] === 'me' ? 700 : 500, 19); const maxW = w - 130; const words = m[2].split(' '); const ls = []; let l = '';
      words.forEach(wd => { const t = l ? l + ' ' + wd : wd; if (g.measureText(t).width > maxW && l) { ls.push(l); l = wd; } else l = t; }); if (l) ls.push(l);
      const bh = ls.length * 26 + 22, bw = Math.max(...ls.map(q => g.measureText(q).width)) + 30;
      lines.push({ h: bh + (m[3] ? 52 : 0) + 12, draw: yy => {
        const me = m[1] === 'me', bx = me ? w - 40 - bw : 36;
        g.save(); g.globalAlpha = clamp(a); g.translate(bx + (me ? bw : 0), yy); g.scale(clamp(a, .2, 1.2), clamp(a, .2, 1.2)); g.translate(-(bx + (me ? bw : 0)), -yy);
        rr(g, bx, yy, bw, bh, 18); g.fillStyle = me ? R : '#f4efe0'; g.fill();
        ls.forEach((q, i) => T(q, bx + 15, yy + 34 + i * 26, { w: me ? 700 : 500, s: 19, c: me ? '#fff' : INK }));
        if (m[3]) { let cx = 36; m[3].forEach((c, ci) => { const picked = lt > (CHAT[CHAT.indexOf(m) + 1] || [99])[0] - .35 && ci === m[4]; cx += pill(c, cx, yy + bh + 30, { s: 15, bg: picked ? Y : '#fff', c: INK, px: 22, bd: picked ? Y : '#1A0C05' }) + 8; g.strokeStyle = INK; g.lineWidth = 2; }); }
        g.restore(); } });
    });
    const totalH = lines.reduce((s, l) => s + l.h, 0), avail = bot - top - 110;
    y = top + 90 - Math.max(0, totalH - avail);
    lines.forEach(l => { l.draw(y); y += l.h; });
    g.fillStyle = Y; g.fillRect(16, top, w - 32, 66); logoCircle(56, top + 33, 20); T('Assistente N1', 88, top + 42, { w: 800, s: 22, c: INK });
    g.restore();
  }
  function recCards(y, w, a, lt) {
    const opts = [['comboGG', 'Completão · Combo GG', 'serve 5 a 7', 212.9], ['comboG', 'Combo G', 'serve 3 a 5 · R$ 29,78/pessoa', 148.9], ['comboM', 'Econômico · Combo M', 'serve 2 a 3', 87.9]];
    T('Pra 3 a 4 com fome de campeão, a galera leva:', 36, y + 20, { w: 500, s: 17, c: MUTE, al: clamp(a) });
    opts.forEach((o, i) => {
      const yy = y + 40 + i * 78, best = i === 1, p = eOutCubic(clamp((a - i * .15) * 1.3));
      g.save(); g.globalAlpha = p; g.translate((1 - p) * 40, 0);
      rr(g, 36, yy, w - 72, 68, 14); g.fillStyle = best ? '#fff5f5' : '#fff'; g.fill(); g.strokeStyle = best ? R : '#e8e0d0'; g.lineWidth = best ? 4 : 2; g.stroke();
      g.save(); rr(g, 44, yy + 8, 52, 52, 10); g.clip(); cover(im[o[0]], 44, yy + 8, 52, 52); g.restore();
      T(o[1], 108, yy + 30, { w: 800, s: 17, c: INK }); T(o[2], 108, yy + 54, { w: 500, s: 14, c: MUTE }); T(brl(o[3]), w - 50, yy + 42, { f: 'Dosis', w: 800, s: 20, c: INK, a: 'right' });
      if (best) pill('Recomendado', 56, yy - 2, { s: 11, bg: R, c: '#fff', px: 14 });
      g.restore();
    });
  }
  function sApp(s, lt) {
    bg(INK);
    layer(s, .5, () => { const gr = g.createRadialGradient(1300, 540, 50, 1300, 540, 900); gr.addColorStop(0, 'rgba(255,0,0,.35)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(-600, 0, W + 1200, H); });
    layer(s, 1, () => {
      T('COMO VAI FICAR · APP PRÓPRIO', 120, 170, { f: 'Dosis', w: 800, s: 22, ls: 5, c: Y, al: seg(lt, .1, .5) });
      rise('"Não sei o que', 120, 285, seg(lt, .25, 1), { s: 92, c: '#fff' });
      rise('comer." Agora sabe.', 120, 390, seg(lt, .4, 1.15), { s: 92, c: Y });
      const feats = [['1', '3 perguntas de 1 toque', 'pessoas · fome · ocasião', 2.5], ['2', '3 opções, a do meio em destaque', 'âncora vende o do meio (Nagle)', 6.8], ['3', '1 sugestão extra, e só uma', 'venda sugestiva (NRAEF)', 8.2], ['4', 'N1 Points · Modo Jogo · Repetir', 'o app fideliza (Sandland)', 9.8]];
      feats.forEach(([n, a, b, at], i) => { const p = eOutCubic(seg(lt, at, at + .6)); if (p <= 0) return; const y = 520 + i * 120; g.save(); g.globalAlpha = p; g.translate((1 - p) * -40, 0); g.beginPath(); g.arc(150, y - 12, 30, 0, 7); g.fillStyle = Y; g.fill(); T(n, 150, y - 1, { f: 'Dosis', w: 800, s: 30, c: INK, a: 'center' }); T(a, 205, y - 8, { w: 800, s: 34, c: '#fff' }); T(b, 205, y + 28, { f: 'Dosis', w: 700, s: 22, c: 'rgba(255,255,255,.6)' }); g.restore(); });
    });
    layer(s, 1.12, () => { const e = eOutExpo(seg(lt, .3, 1.3)); phone(1080, 60 + (1 - e) * 900, 490, 980, (w, h) => chatScreen(w, h, lt)); });
  }

  /* ---------- CENA 7 \u00B7 CMV 28% ---------- */
  const CMVR = [
    ['Coca-Cola lata', 'R$ 7,90 \u2192 R$ 13,90 (R$ 11,90 no combo)', 46.1, 26.2],
    ['Super Combo', 'R$ 79,90 \u2192 R$ 94,90', 33.1, 27.9],
    ['Combo P', 'R$ 54,90 \u2192 R$ 62,90', 31.7, 27.7],
    ['Combo M', 'R$ 79,90 \u2192 R$ 87,90', 30.8, 28.0],
    ['Chicken Burger', 'R$ 29,90 \u2192 R$ 25,90 \u00B7 mais barato', 23.5, 27.1],
    ['Chicken Salada', 'R$ 32,90 \u2192 R$ 26,90 \u00B7 mais barato', 22.6, 27.7]
  ];
  const cmvT = i => 1.8 + i * 0.55;
  function sCmv(s, lt) {
    bg(PAPER);
    const X0 = 820, X1 = 1780, xv = v => X0 + (v - 15) / 35 * (X1 - X0), top = 430, step = 84;
    layer(s, 1, () => {
      T('PLANILHA CMV 2026 \u00B7 NOVA OPERA\u00C7\u00C3O', 120, 150, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .1, .5) });
      rise('Todo pre\u00E7o com', 120, 255, seg(lt, .25, 1), { s: 90 });
      rise('CMV de at\u00E9 28%.', 120, 355, seg(lt, .4, 1.15), { s: 90, c: R });
    });
    layer(s, 1.08, () => {
      const ap = eOutCubic(seg(lt, .8, 1.4));
      // teto 28%
      g.save(); g.globalAlpha = ap; g.strokeStyle = R; g.lineWidth = 3; g.setLineDash([10, 9]); g.beginPath(); g.moveTo(xv(28), top - 30); g.lineTo(xv(28), top + step * 6 - 20); g.stroke(); g.restore();
      pill('Teto 28%', xv(28), top - 52, { bg: R, c: '#fff', s: 17, a: 'center', al: ap });
      [15, 20, 25, 35, 40, 45, 50].forEach(v => T(v + '%', xv(v), top + step * 6 + 16, { f: 'Dosis', w: 700, s: 20, c: MUTE, a: 'center', al: ap }));
      g.fillStyle = 'rgba(26,12,5,.12)'; g.globalAlpha = ap; g.fillRect(X0, top + step * 6 - 14, X1 - X0, 2); g.globalAlpha = 1;
      CMVR.forEach((r, i) => {
        const y = top + i * step + 20, rp = eOutCubic(seg(lt, 1 + i * .12, 1.5 + i * .12));
        if (rp <= 0) return;
        g.save(); g.globalAlpha = rp;
        T(r[0], 120, y - 4, { w: 800, s: 34, c: INK });
        T(r[1], 120, y + 26, { f: 'Dosis', w: 700, s: 21, c: MUTE });
        const mv = eInOutCubic(seg(lt, cmvT(i), cmvT(i) + .6)), xh = xv(r[2]), xn = lerp(xh, xv(r[3]), mv);
        g.fillStyle = '#C9BFB4'; g.fillRect(Math.min(xh, xn), y - 1, Math.abs(xn - xh), 3);
        g.beginPath(); g.arc(xh, y, 12, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#8E847B'; g.stroke();
        T(nf(r[2], 1) + '%', xh, y - 22, { f: 'Dosis', w: 700, s: 20, c: MUTE, a: 'center' });
        if (mv > 0) { g.beginPath(); g.arc(xn, y, 13, 0, 7); g.fillStyle = '#E00000'; g.fill(); g.lineWidth = 3; g.strokeStyle = PAPER; g.stroke();
          T(nf(lerp(r[2], r[3], mv), 1) + '%', xn, y + 42, { f: 'Dosis', w: 800, s: 24, c: INK, a: 'center' }); }
        g.restore();
      });
    });
    const q = seg(lt, 5.4, 6.1);
    if (q > 0) layer(s, 1.2, () => { const w = pill('CMV do mix real: 28,8% \u2192 27,7%', 120, 1010, { bg: INK, c: Y, s: 24, al: eOutCubic(q) }); pill('Margem sobrando virou pre\u00E7o menor', 120 + w + 16, 1010, { bg: Y, c: INK, s: 24, al: eOutCubic(seg(lt, 5.7, 6.4)) }); });
  }

  /* ---------- CENA 8 · resultado + fecho ---------- */
  function sFim(s, lt) {
    bg(R);
    const nums = [['CMV do mix', '28,8% → ', '27,7%', .3], ['Ticket médio', 'R$ 58,96 → ', 'R$ 63,85', 1.3], ['Margem bruta por mês', 'conversão estável · ', '+R$ 255 mil', 2.3]];
    const close = eInOutExpo(seg(lt, 3.9, 4.8));
    layer(s, 1, () => {
      g.save(); g.globalAlpha = 1 - close;
      T('PROJEÇÃO CONSERVADORA · BASE SET/2026', 120, 170, { f: 'Dosis', w: 800, s: 22, ls: 5, c: Y, al: seg(lt, .05, .4) });
      nums.forEach((n, i) => { const p = seg(lt, n[3], n[3] + .6), y = 380 + i * 230; if (p <= 0) return; T(n[0].toUpperCase(), 120, y - 70, { f: 'Dosis', w: 800, s: 24, ls: 4, c: '#fff', al: eOutCubic(p) }); T(n[1], 120, y + 30, { w: 700, s: 50, c: 'rgba(255,255,255,.75)', al: eOutCubic(p) }); g.font = F(700, 50); const off = n[1] ? g.measureText(n[1]).width : 0; rise(n[2], 120 + off + 10, y + 50, p, { s: i === 2 ? 150 : 110, c: Y, f: 'Dosis', it: false, w: 800 }); });
      g.restore();
    });
    if (close > 0) {
      g.fillStyle = Y; g.fillRect(lerp(-W / 2 - EXT * 2, -EXT * 2, close), 0, W / 2 + EXT * 2 + 2, H);
      const sp = seg(lt, 4.3, 5.1);
      if (sp > 0) { const e = eOutBack(sp, 1.6); g.save(); g.translate(W / 2, H / 2); g.rotate((1 - eOutExpo(sp)) * 2); g.scale(e * .9, e * .9); g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fillStyle = '#fff'; g.fill(); logoCircle(0, 0, 238); g.restore(); }
      rise('Cardápio', 110, 480, seg(lt, 4.9, 5.7), { s: 110, c: INK });
      rise('Nº1.', 110, 600, seg(lt, 5.05, 5.85), { s: 110, c: INK });
      rise('Number One.', W - 110, 480, seg(lt, 5.3, 6.1), { s: 110, c: '#fff', a: 'right' });
      rise('Sempre.', W - 110, 600, seg(lt, 5.45, 6.25), { s: 110, c: '#fff', a: 'right' });
      const kp = seg(lt, 5.9, 6.5); if (kp > 0) T('N1 CHICKEN · TASTEFY · LABORATÓRIO DE IA · 2026', W / 2, 1000, { f: 'Dosis', w: 800, s: 22, ls: 6, a: 'center', c: INK, al: kp });
    }
  }

  const DRAW = { intro: sIntro, nums: sNums, funil: sFunil, hoje: sHoje, ticket: sTicket, ifood: sIfood, app: sApp, cmv: sCmv, fim: sFim };

  /* ---------- render ---------- */
  let lastCam = 0, lastT = 0;
  function render(t) {
    CX = camX(t);
    const vel = (CX - camX(Math.max(0, t - 1 / 60))) * 60;
    g.setTransform(1, 0, 0, 1, 0, 0); bg(INK);
    g.save(); g.translate(-CX, 0);
    S.forEach((s, i) => {
      if (s.X - EXT < CX + W && s.X + W + EXT > CX) { g.save(); g.translate(s.X, 0); g.beginPath(); g.rect(-EXT, 0, W + EXT * 2, H); g.clip(); DRAW[s.id](s, t - s.t0); g.restore(); }
      if (i < S.length - 1 && s.X + W + EXT < CX + W && s.X + SW - EXT > CX) ribbon(i);
    });
    g.restore();
    // capítulo
    const sc = S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1];
    if (sc.ch) { const a = clamp(seg(t - sc.t0, .5, 1)) * (1 - seg(t, sc.t1 - .7, sc.t1 - .4)); const dark = ['funil', 'app'].includes(sc.id), red = ['ticket', 'fim'].includes(sc.id); T(sc.ch.toUpperCase(), W - 120, 90, { f: 'Dosis', w: 800, s: 18, ls: 4, c: dark ? 'rgba(255,255,255,.6)' : red ? 'rgba(255,255,255,.8)' : 'rgba(26,12,5,.5)', a: 'right', al: a }); }
    // barra de progresso da marca
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, H - 6, W, 6); g.fillStyle = Y; g.fillRect(0, H - 6, W * t / END, 6); g.fillStyle = R; g.fillRect(W * t / END - 14, H - 6, 14, 6);

    // composição: rastro de movimento no chicote
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sm = Math.min(340, Math.abs(vel) * .028);
    if (sm > 4) {
      const N = 9; ctx.globalAlpha = 1; ctx.drawImage(buf, 0, 0);
      for (let k = 1; k < N; k++) { ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(buf, -Math.sign(vel) * sm * k / (N - 1), 0); }
      ctx.globalAlpha = 1;
      // riscos cromáticos
      const n = Math.floor(sm / 6); for (let k = 0; k < n; k++) { const y = rnd(k + Math.floor(t * 30) * 13) * H, len = sm * (2 + rnd(k + 5) * 6); ctx.fillStyle = k % 3 ? 'rgba(255,237,0,.5)' : 'rgba(255,0,0,.55)'; ctx.fillRect(rnd(k * 3 + Math.floor(t * 30)) * W, y, len, 2 + rnd(k) * 3); }
    } else ctx.drawImage(buf, 0, 0);
    // grão + vinheta
    ctx.globalAlpha = .55; const ox = Math.floor(rnd(Math.floor(t * 24)) * 256), oy = Math.floor(rnd(Math.floor(t * 24) + 9) * 256);
    ctx.save(); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(ox, oy, W, H); ctx.restore(); ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // fade final
    const ff = seg(t, END - 1.2, END); if (ff > 0) { ctx.fillStyle = `rgba(0,0,0,${ff})`; ctx.fillRect(0, 0, W, H); }
    audio.vel(vel);
    lastCam = CX; lastT = t;
  }
  window.__render = render;

  /* =================== TRILHA (Web Audio) =================== */
  const BPM = 116, BEAT = 60 / BPM, STEP = BEAT / 4;
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  // tom de Lá maior; acordes por compasso (4 tempos)
  const CH = { A: [57, 61, 64, 68], E: [52, 56, 59, 63], Fm: [54, 57, 61, 64], D: [50, 54, 57, 61], Bm: [47, 50, 54, 57], Cm: [49, 52, 56, 59] };
  const PENTA = [69, 71, 73, 76, 78, 81, 83, 85, 88];
  function section(t) {
    if (t < 7.5) return 'intro'; if (t < 17) return 'A'; if (t < 27) return 'tense'; if (t < 41) return 'half'; if (t < 47) return 'break';
    if (t < 61) return 'lift'; if (t < 73) return 'B'; if (t < 81) return 'A'; return 'end';
  }
  function chordAt(t) {
    const bar = Math.floor(t / (BEAT * 4)), sec = section(t);
    const prog = sec === 'tense' ? ['Fm', 'D', 'Bm', 'Cm'] : sec === 'half' ? ['Fm', 'D', 'E', 'Cm'] : ['A', 'E', 'Fm', 'D'];
    return CH[prog[bar % 4]];
  }
  const EV = [ // eventos pontuais
    [0.25, 'swell'], [1.15, 'swish'], [2.05, 'crunch'], [2.1, 'boom'], [3.0, 'pluck', 76], [3.55, 'pluck', 81], [4.4, 'pluck', 85], [4.6, 'riser', 2.9],
    [9.0, 'blip', 76], [9.2, 'blip', 78], [9.4, 'blip', 81], [9.6, 'blip', 83], [12.7, 'bars'], [14.6, 'riser', 2.4],
    [20.6, 'zap'], [22.2, 'zap'], [24.2, 'riser', 2.8],
    ...SHOTS.map((_, i) => [27 + shotT(i) - .15, 'zap']),
    [39.5, 'riser', 1.5], [42.5, 'down'], [43.4, 'down'], [44.3, 'tick'], [45, 'riser', 2],
    [47, 'boom'], [54.4, 'ok', 0], [55.6, 'ok', 1], [56.8, 'ok', 2], [58, 'pluck', 88], [59.7, 'riser', 1.3],
    ...CHAT.map((m, i) => [61 + m[0], m[1] === 'me' ? 'tap' : 'bubble', i]),
    [71.8, 'riser', 1.2],
    ...CMVR.map((_, i) => [73 + cmvT(i) + .55, 'ok', i % 3]), [78.4, 'boom'], [79.6, 'riser', 1.4],
    [81.3, 'hit', 0], [82.3, 'hit', 1], [83.3, 'hit', 2], [84.9, 'swish'], [85.3, 'crunch'], [85.35, 'final']
  ];
  const audio = (() => {
    let ac = null, master, comp, drums, drumLP, duck, rev, revIn, whoosh, whF, whG, dest, noiseBuf, startAt = 0, offset = 0, playing = false, timer = null, cursor = 0;
    function init(off) {
      if (ac && !off) return;
      ac = off || new (window.AudioContext || window.webkitAudioContext)();
      comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .2;
      const lim = ac.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .08;
      const out = ac.createGain(); out.gain.value = .92;
      master = ac.createGain(); master.gain.value = .8; master.connect(comp); comp.connect(lim); lim.connect(out); out.connect(ac.destination);
      if (!off) { dest = ac.createMediaStreamDestination(); out.connect(dest); }
      rev = ac.createConvolver(); const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      rev.buffer = ir; revIn = ac.createGain(); revIn.gain.value = .32; revIn.connect(rev); const rg = ac.createGain(); rg.gain.value = .6; rev.connect(rg); rg.connect(master);
      drumLP = ac.createBiquadFilter(); drumLP.type = 'lowpass'; drumLP.frequency.value = 18000; drums = ac.createGain(); drums.gain.value = .95; drums.connect(drumLP); drumLP.connect(master);
      duck = ac.createGain(); duck.connect(master); duck.connect(revIn);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const wn = ac.createBufferSource(); wn.buffer = noiseBuf; wn.loop = true; whF = ac.createBiquadFilter(); whF.type = 'bandpass'; whF.Q.value = 1.2; whF.frequency.value = 400; whG = ac.createGain(); whG.gain.value = 0;
      wn.connect(whF); whF.connect(whG); whG.connect(master); whG.connect(revIn); wn.start();
    }
    const env = (gn, t, a, peak, d, sus = 0.0001) => { gn.gain.cancelScheduledValues(t); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d); };
    const noise = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.start(t, Math.random() * 1.5); s.stop(t + dur + .05); return s; };
    function kick(t, v = 1) { const o = ac.createOscillator(), gn = ac.createGain(); o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + .13); env(gn, t, .002, v, .38); o.connect(gn); gn.connect(drums); o.start(t); o.stop(t + .45);
      const c = ac.createOscillator(), cg = ac.createGain(); c.type = 'square'; c.frequency.value = 1800; env(cg, t, .001, .08 * v, .012); c.connect(cg); cg.connect(drums); c.start(t); c.stop(t + .03);
      duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(.35, t); duck.gain.linearRampToValueAtTime(1, t + .26); }
    function clap(t, v = .5) { [0, .011, .023].forEach((d, i) => { const n = noise(t + d, .2), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = .9; env(gn, t + d, .001, v * (i === 2 ? 1 : .6), i === 2 ? .18 : .02); n.connect(f); f.connect(gn); gn.connect(drums); gn.connect(revIn); }); }
    function hat(t, v = .12, open = false) { const n = noise(t, .2), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'highpass'; f.frequency.value = 7200; env(gn, t, .001, v, open ? .16 : .035); n.connect(f); f.connect(gn); gn.connect(drums); }
    function shaker(t, v = .07) { const n = noise(t, .1), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 1.4; env(gn, t, .012, v, .05); n.connect(f); f.connect(gn); gn.connect(drums); }
    function conga(t, n, v = .25) { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(NOTE(n) * 1.5, t); o.frequency.exponentialRampToValueAtTime(NOTE(n), t + .04); env(gn, t, .002, v, .16); o.connect(gn); gn.connect(drums); o.start(t); o.stop(t + .2); }
    function bass(t, n, dur, v = .38) { const o = ac.createOscillator(), s = ac.createOscillator(), f = ac.createBiquadFilter(), gn = ac.createGain(); o.type = 'sawtooth'; s.type = 'sine'; o.frequency.value = NOTE(n); s.frequency.value = NOTE(n - 12); f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + dur * .9);
      env(gn, t, .006, v, dur, .0001); o.connect(f); s.connect(f); f.connect(gn); gn.connect(duck); o.start(t); s.start(t); o.stop(t + dur + .05); s.stop(t + dur + .05); }
    function pad(t, notes, dur, v = .045, bright = 1400) { notes.forEach(n => [-7, 0, 7].forEach(dt => { const o = ac.createOscillator(), f = ac.createBiquadFilter(), gn = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = NOTE(n + 12); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = bright; gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(v, t + dur * .3); gn.gain.linearRampToValueAtTime(.0001, t + dur); o.connect(f); f.connect(gn); gn.connect(duck); o.start(t); o.stop(t + dur + .05); })); }
    function pluck(t, n, v = .16, rv = true) { const o = ac.createOscillator(), o2 = ac.createOscillator(), gn = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = NOTE(n); o2.frequency.value = NOTE(n) * 4.01; f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(900, t + .25);
      const g2 = ac.createGain(); env(g2, t, .001, v * .25, .06); env(gn, t, .002, v, .42); o.connect(f); f.connect(gn); o2.connect(g2); g2.connect(gn); gn.connect(master); if (rv) gn.connect(revIn); o.start(t); o2.start(t); o.stop(t + .5); o2.stop(t + .5); }
    function blip(t, n, v = .12) { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(NOTE(n) * .98, t); o.frequency.exponentialRampToValueAtTime(NOTE(n) * 1.01, t + .05); env(gn, t, .003, v, .14); o.connect(gn); gn.connect(master); gn.connect(revIn); o.start(t); o.stop(t + .2); }
    function zap(t) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), gn = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(NOTE(76), t); o.frequency.exponentialRampToValueAtTime(NOTE(52), t + .22); f.type = 'lowpass'; f.frequency.setValueAtTime(3500, t); f.frequency.exponentialRampToValueAtTime(400, t + .25); env(gn, t, .004, .09, .26); o.connect(f); f.connect(gn); gn.connect(master); gn.connect(revIn); o.start(t); o.stop(t + .32);
      const n = noise(t, .08), hf = ac.createBiquadFilter(), hg = ac.createGain(); hf.type = 'highpass'; hf.frequency.value = 3000; env(hg, t, .001, .12, .05); n.connect(hf); hf.connect(hg); hg.connect(master); }
    function crunch(t) { for (let k = 0; k < 18; k++) { const tt = t + k * .018 + Math.random() * .01, n = noise(tt, .03), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 4200; f.Q.value = 2.5; env(gn, tt, .001, .22 * (1 - k / 20), .012 + Math.random() * .014); n.connect(f); f.connect(gn); gn.connect(master); gn.connect(revIn); } }
    function riser(t, dur) { const n = noise(t, dur), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur); gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(.2, t + dur * .95); gn.gain.linearRampToValueAtTime(.0001, t + dur + .02); n.connect(f); f.connect(gn); gn.connect(master); gn.connect(revIn);
      const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(NOTE(45), t); o.frequency.exponentialRampToValueAtTime(NOTE(69), t + dur); og.gain.setValueAtTime(.0001, t); og.gain.exponentialRampToValueAtTime(.035, t + dur); og.gain.linearRampToValueAtTime(.0001, t + dur + .02); const of = ac.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 2000; o.connect(of); of.connect(og); og.connect(master); o.start(t); o.stop(t + dur + .05); }
    function boom(t) { const o = ac.createOscillator(), gn = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2); env(gn, t, .005, .7, 1.6); o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 1.8); pad(t, [57, 64, 69, 73], 3, .03, 2600); }
    function swish(t) { const n = noise(t, .6), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'bandpass'; f.Q.value = 1; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(5000, t + .35); gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(.25, t + .2); gn.gain.exponentialRampToValueAtTime(.0001, t + .55); n.connect(f); f.connect(gn); gn.connect(master); gn.connect(revIn); }
    function one(t, type, arg) {
      if (type === 'swell') pad(t, [57, 64, 68, 71], 7, .03, 900);
      else if (type === 'swish') swish(t);
      else if (type === 'crunch') crunch(t);
      else if (type === 'boom') boom(t);
      else if (type === 'pluck') pluck(t, arg, .2);
      else if (type === 'riser') riser(t, arg);
      else if (type === 'blip') blip(t, arg);
      else if (type === 'bars') [0, .25, .5].forEach((d, i) => pluck(t + d, [73, 71, 69][i], .12));
      else if (type === 'zap') zap(t);
      else if (type === 'down') { pluck(t, 64, .18); pluck(t + .12, 61, .14); }
      else if (type === 'tick') for (let k = 0; k < 6; k++) hat(t + k * BEAT / 2, .1);
      else if (type === 'ok') { [0, .07].forEach((d, i) => blip(t + d, [76, 81, 85][arg] + i * 7, .14)); }
      else if (type === 'bubble') blip(t, PENTA[(arg * 3) % PENTA.length], .1);
      else if (type === 'tap') { blip(t, PENTA[(arg * 2 + 4) % PENTA.length] - 12, .12); conga(t, 60, .15); }
      else if (type === 'flip') { const n = noise(t, .12), f = ac.createBiquadFilter(), gn = ac.createGain(); f.type = 'highpass'; f.frequency.value = 2500; env(gn, t, .02, .1, .08); n.connect(f); f.connect(gn); gn.connect(master); pluck(t, PENTA[arg % PENTA.length], .07); }
      else if (type === 'hit') { kick(t, 1); pad(t, chordAt(56 + arg * 2.1).map(n => n + 12), 1.4, .05, 3000); pluck(t, [81, 85, 88][arg], .2); clap(t, .5); }
      else if (type === 'final') { pad(t, [45, 57, 64, 69, 73, 76], 4.5, .05, 2400); boom(t); [0, .12, .24, .36].forEach((d, i) => pluck(t + d, [69, 73, 76, 81][i], .16)); }
    }
    function step(n, t) { // n = índice de semicolcheia na música; t = tempo de áudio
      const s = n * STEP, sec = section(s), i16 = n % 16, bar = Math.floor(n / 16);
      if (sec === 'intro') { if (s > 4.6 && i16 % 4 === 0) hat(t, .05); return; }
      if (sec === 'break') { if (i16 === 0 && bar % 2 === 0) bass(t, 42, BEAT * 7, .3); return; }
      if (sec === 'end') { if (s > 84.9) return; if (i16 % 4 === 0) hat(t, .06); return; }
      const ch = chordAt(s), root = ch[0] - 12;
      const full = sec === 'A' || sec === 'lift' || sec === 'B';
      // bateria: tresillo brasileiro (1 . . 1 . . 1 .) + palmas no 2 e 4
      if (sec === 'half') { if (i16 === 0 || i16 === 10) kick(t, .9); if (i16 === 8) clap(t, .45); if (i16 % 2 === 0) shaker(t, .05); }
      else { if (i16 === 0 || i16 === 6 || i16 === 12 || (sec === 'lift' && i16 === 10)) kick(t, sec === 'tense' ? .7 : 1); if (i16 === 4 || i16 === 12) clap(t, sec === 'tense' ? .3 : .5); if (i16 % 2 === 1) hat(t, .07 + (i16 === 7 ? .05 : 0)); shaker(t, i16 % 4 === 2 ? .08 : .04); if (full && (i16 === 3 || i16 === 11 || i16 === 14)) conga(t, i16 === 14 ? 57 : 62, .16); }
      // baixo
      const bp = sec === 'half' ? [0, 10] : [0, 3, 6, 10, 12, 14];
      if (bp.includes(i16)) bass(t, root + (i16 === 14 ? 7 : i16 === 10 ? 12 : 0), STEP * (i16 === 0 ? 2.6 : 1.6), sec === 'tense' ? .3 : .38);
      // harmonia
      if (i16 === 0) pad(t, ch, BEAT * 4, sec === 'tense' || sec === 'half' ? .04 : .03, sec === 'lift' ? 2200 : 1300);
      // arpejo de marimba no refrão
      if ((sec === 'lift' || sec === 'B') && i16 % 2 === 0) { const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 24, ch[1] + 12, ch[3] + 12, ch[0] + 24]; pluck(t, arp[(i16 / 2) % 8], sec === 'lift' ? .085 : .06, false); }
      if (sec === 'A' && (i16 === 2 || i16 === 9)) pluck(t, ch[(i16 + bar) % 4] + 24, .05, false);
      if (sec === 'tense' && i16 === 8) pluck(t, ch[2] + 12, .06);
    }
    function schedule() {
      const now = ac.currentTime, horizon = now + .25; // agenda à frente
      while (true) {
        const s = cursor * STEP; const at = startAt + (s - offset); if (at > horizon || s > END) break;
        if (at >= now - .01) step(cursor, Math.max(at, now));
        cursor++;
      }
      EV.forEach(e => { if (e._done) return; const at = startAt + (e[0] - offset); if (e[0] < offset - .01) { e._done = 1; return; } if (at <= horizon) { e._done = 1; one(Math.max(at, ac.currentTime), e[1], e[2]); } });
    }
    return {
      init, get ctx() { return ac; }, get stream() { return dest && dest.stream; },
      play(from) { init(); if (ac.state === 'suspended') ac.resume(); offset = from; startAt = ac.currentTime + .08; cursor = Math.ceil(from / STEP); EV.forEach(e => e._done = 0); playing = true; clearInterval(timer); timer = setInterval(schedule, 40); schedule(); master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(.8, ac.currentTime); },
      stop() { // fecha o contexto: corta também as caudas de pad já agendadas
        playing = false; clearInterval(timer);
        if (ac) { const old = ac; master.gain.setTargetAtTime(0, old.currentTime, .02); ac = null; setTimeout(() => old.close(), 120); }
      },
      now() { return ac ? offset + (ac.currentTime - startAt) : 0; },
      vel(v) { if (!ac || !playing) return; const a = Math.min(1, Math.abs(v) / 9000); whG.gain.setTargetAtTime(a * .32, ac.currentTime, .03); whF.frequency.setTargetAtTime(300 + a * 3200, ac.currentTime, .05); },
      fadeOut(t) { if (ac) master.gain.setTargetAtTime(0, ac.currentTime + t, .25); },
      async test(from, dur) { // renderiza um trecho offline e mede níveis (diagnóstico)
        const prev = ac; const off = new OfflineAudioContext(2, 44100 * dur, 44100); init(off);
        offset = from; startAt = 0; cursor = Math.ceil(from / STEP); EV.forEach(e => e._done = 0);
        const horizonEnd = dur; while (cursor * STEP - from < horizonEnd && cursor * STEP <= END) { const at = cursor * STEP - from; if (at >= 0) step(cursor, at); cursor++; }
        EV.forEach(e => { const at = e[0] - from; if (at >= 0 && at < dur) one(at, e[1], e[2]); });
        const buf = await off.startRendering(); ac = prev;
        const d = buf.getChannelData(0); const win = 44100 / 2, out = [];
        for (let i = 0; i < d.length; i += win) { let s = 0, pk = 0; for (let j = i; j < Math.min(d.length, i + win); j++) { s += d[j] * d[j]; pk = Math.max(pk, Math.abs(d[j])); } out.push([(from + i / 44100).toFixed(1), (20 * Math.log10(Math.sqrt(s / win) + 1e-9)).toFixed(1), pk.toFixed(2)]); }
        return out;
      }
    };
  })();

  window.__audio = audio;
  /* =================== player =================== */
  const $ = sel => document.querySelector(sel);
  let playing = false, tNow = 0, raf = 0, recorder = null, chunks = [];
  const seek = $('#seek'), tc = $('#tc');
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function ui() { seek.value = tNow; tc.textContent = `${mmss(tNow)} / ${mmss(END)}`; $('#play').textContent = playing ? '❚❚ Pausar' : '▶ Play'; document.body.classList.toggle('paused', !playing); }
  function loop() {
    if (!playing) return;
    tNow = audio.now();
    if (tNow >= END) { tNow = END; render(END - .001); stop(); if (recorder) finishRec(); ui(); return; }
    if (tNow >= 0) render(tNow);
    ui(); raf = requestAnimationFrame(loop);
  }
  if (/[?&]embed=1/.test(location.search)) document.body.classList.add('embed');
  function play(from = tNow) { if (from >= END - .05) from = 0; $('#start').style.display = 'none'; document.body.classList.add('started'); audio.play(from); playing = true; tNow = from; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); ui(); }
  function stop() { playing = false; audio.stop(); cancelAnimationFrame(raf); ui(); }
  $('#start').onclick = () => play(0);
  $('#play').onclick = () => playing ? stop() : play();
  $('#restart').onclick = () => { stop(); tNow = 0; play(0); };
  seek.oninput = () => { const was = playing; if (was) stop(); tNow = +seek.value; render(tNow); ui(); seek._resume = was; };
  seek.onchange = () => { if (seek._resume) play(+seek.value); };
  $('#fs').onclick = () => { const el = document.documentElement; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen && el.requestFullscreen(); };
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); } });

  $('#export').onclick = () => {
    stop(); audio.init();
    const vs = cv.captureStream(30); const mix = new MediaStream([...vs.getVideoTracks(), ...audio.stream.getAudioTracks()]);
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const type = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) { alert('Este navegador não suporta gravação de vídeo. Use o Chrome.'); return; }
    chunks = []; recorder = new MediaRecorder(mix, { mimeType: type, videoBitsPerSecond: 12e6, audioBitsPerSecond: 192e3 });
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'N1_Chicken_Cardapio_N1.webm'; document.body.appendChild(a); a.click(); a.remove(); $('#recTag').classList.remove('on'); recorder = null; };
    recorder.start(250); $('#recTag').classList.add('on'); tNow = 0; play(0);
  };
  function finishRec() { setTimeout(() => recorder && recorder.state !== 'inactive' && recorder.stop(), 300); }

  /* primeiro quadro (pôster) quando as fontes e imagens carregarem */
  const FONTS = ['400', '500', '600', '700', '800', '900', 'italic 800', 'italic 900'].map(w => `${w} 40px "Fira Sans"`).concat(['600 40px "Dosis"', '700 40px "Dosis"', '800 40px "Dosis"']);
  Promise.all([...FONTS.map(f => document.fonts.load(f).catch(() => null)), new Promise(r => { if (im.logo.complete) r(); else { im.logo.onload = r; im.logo.onerror = r; } })])
    .then(() => { render(3.9); ui(); });
  render(0);
  if (/[?&]t=([\d.]+)/.test(location.search)) { tNow = +RegExp.$1; setTimeout(() => render(tNow), 800); }
})();
