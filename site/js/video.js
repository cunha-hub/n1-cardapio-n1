/* N1 Chicken - Video de apresentacao horizontal (80 s), feito com a skill brag-motion.
   Musica: faixa instrumental criada no Suno (assets/music/trilha-suno.mp3). Usa o trecho final da faixa (a partir de 1:42,8),
   de modo que o video fecha junto com o final da musica. As cenas caem nos picos do audio:
   49 s "E agora, apresentamos a voces..." · 54,9 s drop: "O novo cardapio da N1" · 69 s segundo drop: resultado · 76,3 s selo final.
   Os efeitos (impactos, whooshes, pops e toques) vem de js/sfx-lancamento.js e sao misturados por cima da musica. */
(() => {
  const W = 1920, H = 1080, END = 80, S0 = 102.81; // S0: onde o trecho usado comeca na faixa do Suno
  const Y = '#FFED00', R = '#FF0000', R2 = '#C80000', INK = '#1A0C05', PAPER = '#FFFCEB', MUTE = '#7A6A5E', O1 = '#E0550F', Y2 = '#FFC928';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const bufA = mk(), bufB = mk(), gA = bufA.getContext('2d'), gB = bufB.getContext('2d');
  let g = gA; // contexto da cena que esta sendo desenhada
  const { IMG } = window.N1;

  /* ---------- utilidades ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const eInOutExpo = t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  const eOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const eOutCubic = t => 1 - Math.pow(1 - t, 3);
  const eInExpo = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, 10 * t - 10);
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
  function pill(str, x, y, o = {}) { g.save(); g.font = F(800, o.s || 20, false, 'Dosis'); if ('letterSpacing' in g) g.letterSpacing = '1.5px'; const w = g.measureText(str.toUpperCase()).width + (o.px || 28); const h = (o.s || 20) * 1.8; const ax = o.a === 'right' ? x - w : o.a === 'center' ? x - w / 2 : x; g.globalAlpha *= o.al == null ? 1 : o.al; if ((o.s || 20) >= 18 && !o.flat) glassPill(ax, y - h / 2, w, h, o.bg || Y); else { rr(g, ax, y - h / 2, w, h, h / 2); g.fillStyle = o.bg || Y; g.fill(); } if (o.bd) { g.strokeStyle = o.bd; g.lineWidth = 2; g.stroke(); } g.fillStyle = o.c || INK; g.textBaseline = 'middle'; g.fillText(str.toUpperCase(), ax + (o.px || 28) / 2, y + 1); g.restore(); return w; }

  /* ---------- liquid glass ---------- */
  let GT = 0; // tempo atual, para o reflexo que desliza pelo vidro
  const rgbOf = c => { let h = String(c).replace('#', ''); if (h.length === 3) h = h.split('').map(z => z + z).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  function txtW(str, w, s, it, f, ls = 0) { g.save(); g.font = F(w, s, it, f); if ('letterSpacing' in g) g.letterSpacing = ls + 'px'; const v = g.measureText(str).width; g.restore(); return v; }
  function fitS(str, maxW, w, f, s) { const m = txtW(str, w, s, false, f); return m > maxW ? s * maxW / m : s; }
  /* vidro: fundo desfocado e levemente ampliado (lente), tinta translucida, brilho no topo, reflexo que desliza e borda de luz */
  function glass(x, y, w, h, r, o = {}) {
    if (w < 4 || h < 4) return;
    const tint = o.tint || '255,255,255', ta = o.ta ?? .2, dark = !!o.dark;
    g.save();
    g.shadowColor = o.sh || 'rgba(26,12,5,.30)'; g.shadowBlur = o.blur ?? 34; g.shadowOffsetY = o.oy ?? 14; rr(g, x, y, w, h, r); g.fillStyle = 'rgba(' + tint + ',' + Math.max(.05, ta * .5) + ')'; g.fill(); g.shadowColor = 'transparent';
    g.save(); rr(g, x, y, w, h, r); g.clip();
    const m = g.getTransform(), pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 28;
    const sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad), ex = Math.min(g.canvas.width, x1 + pad), ey = Math.min(g.canvas.height, y1 + pad);
    if (ex - sx > 2 && ey - sy > 2) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, k = 1.06;
      g.filter = 'blur(' + (o.bl ?? 16) + 'px) saturate(1.6) brightness(' + (dark ? .9 : 1.08) + ')';
      g.drawImage(g.canvas, sx, sy, ex - sx, ey - sy, cx + (sx - cx) * k, cy + (sy - cy) * k, (ex - sx) * k, (ey - sy) * k);
      g.filter = 'none';
    }
    g.restore();
    rr(g, x, y, w, h, r); const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, 'rgba(' + tint + ',' + (ta + .12) + ')'); gr.addColorStop(1, 'rgba(' + tint + ',' + ta + ')'); g.fillStyle = gr; g.fill();
    g.save(); rr(g, x, y, w, h, r); g.clip();
    const gl = g.createLinearGradient(x, y, x, y + h * .55); gl.addColorStop(0, 'rgba(255,255,255,' + (dark ? .22 : .38) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h * .55);
    const sh = g.createLinearGradient(x, y + h * .55, x, y + h); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,' + (dark ? .28 : .12) + ')'); g.fillStyle = sh; g.fillRect(x, y + h * .55, w, h * .45);
    const ph = ((GT * .22 + (o.ph || 0)) % 1.8) - .4, bw = Math.max(40, w * .16);
    g.save(); g.translate(x + ph * w, y + h / 2); g.rotate(-.35); const sg = g.createLinearGradient(-bw, 0, bw, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,' + (dark ? .16 : .28) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(-bw, -h, bw * 2, h * 2); g.restore();
    g.restore();
    rr(g, x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1)); const rg = g.createLinearGradient(x, y, x + w, y + h);
    rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(.3, 'rgba(255,255,255,.22)'); rg.addColorStop(.7, 'rgba(255,255,255,.14)'); rg.addColorStop(1, 'rgba(255,255,255,.7)');
    g.lineWidth = o.lw || 2; g.strokeStyle = rg; g.stroke();
    g.restore();
  }
  function glassPill(x, y, w, h, bgc) { const c = rgbOf(bgc), lum = (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255, white = lum > .93; glass(x, y, w, h, h / 2, { tint: c.join(','), ta: lum < .35 ? .5 : white ? .36 : .52, dark: lum < .35, blur: 22, oy: 10, ph: (x * .001) % 1 }); }
  /* manchas de cor que derivam atras do vidro, para ele ter o que refratar */
  function orbs(lt, cols, a = .22) {
    [[1560, 800, 560, 0], [260, 940, 480, 1.9], [1760, 160, 400, 3.3]].forEach(([ox, oy, r, ph], k) => {
      const cx = ox + Math.sin(lt * .4 + ph) * 130, cy = oy + Math.cos(lt * .31 + ph * 1.3) * 80, gr = g.createRadialGradient(cx, cy, 0, cx, cy, r), c = cols[k % cols.length];
      gr.addColorStop(0, 'rgba(' + c + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
  }

  /* ---------- imagens ---------- */
  const load = src => { const i = new Image(); i.crossOrigin = 'anonymous'; i.src = src; return i; };
  const im = {}; Object.entries(IMG).forEach(([k, v]) => im[k] = load(v));
  const prints = {}; ['03_favoritos_duplicados', '05_modal_combo_m_complementos', '07_sobremesas_sem_foto', '02_super_ofertas', '08_clube_day_week_precos_diferentes', '00_loja_burgers_topo', '01_loja_n1_topo'].forEach(k => prints[k] = load(`assets/prints/${k}.jpg`));
  /* grão de filme pré-gerado */
  const grain = document.createElement('canvas'); grain.width = grain.height = 256; { const gc = grain.getContext('2d'), d = gc.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } gc.putImageData(d, 0, 0); }

  /* ---------- cenas ---------- */
  // rate = velocidade da coreografia original da cena (lt = (t - t0) * rate + off); a cena se ajusta ao trecho entre as batidas
  const S = [
    { id: 'intro', t0: 0, t1: 6, rate: 1, off: 2.0, ch: '' },                            // faixas ja abertas no 1o quadro; o selo bate na 1a pancada da musica (0,6 s)
    { id: 'nums', t0: 6, t1: 15, rate: 9.5 / 9, ch: '01 · Onde estamos' },
    { id: 'funil', t0: 15, t1: 24.5, rate: 10 / 9.5, ch: '02 · Onde o cliente sai' },
    { id: 'hoje', t0: 24.5, t1: 41.5, rate: 14 / 17, ch: '03 · Como é hoje' },
    { id: 'ticket', t0: 41.5, t1: 48.8, rate: .82, ch: '04 · O custo disso' },
    { id: 'revela', t0: 48.8, t1: 56.9, rate: .984, ch: '' },                            // 51 a musica abre o break · 54,9 DROP
    { id: 'ifood', t0: 56.9, t1: 63.9, rate: 1.69, ch: 'O novo cardápio · iFood' },
    { id: 'antes', t0: 63.9, t1: 69.04, rate: 1.7, ch: '' },                             // 5 viradas na subida; a ultima, no 2o drop (69)
    { id: 'fim', t0: 69.04, t1: END, rate: .59, ch: 'O resultado' }                      // numeros, e o selo bate em 76,3
  ];
  S.forEach((s, i) => { s.X = i * 100000; s.D = s.t1 - s.t0; if (s.rate == null) s.rate = s.oD / s.D; s.off = s.off || 0; });
  const tOf = (id, lt) => { const sc = S.find(x => x.id === id); return sc.t0 + (lt - sc.off) / sc.rate; };
  const TRANS = [ // transicao na saida de cada cena (meia-janela em segundos)
    { t: 'iris', h: .5, o: { r0: 240 } },
    { t: 'flaps', h: .5 },
    { t: 'molho', h: .6 },
    { t: 'whip', h: .45, o: { dir: 1 } },
    { t: 'tvoff', h: .35 },
    { t: 'faixas', h: .55 },
    { t: 'mergulho', h: .5, o: { cx: 1195, cy: 560 } },
    { t: 'paineis', h: .55 }
  ];
  // pancadas que tremem e piscam a tela; sao as mesmas do audio (e ganham um impacto sintetizado por cima)
  const BREAK = [48.8, 54.9]; // trecho da virada: a musica muda de cara (abafada) ate o drop
  const HITS = [[.6, .7], [48.8, .9], [51, .6], [54.9, 1.4], [69.04, 1.1], [76.3, 1]];
  const EV = {
    impacts: HITS,
    whooshes: [[6, .1], [15, .1], [24.5, .1], [41.5, .1], [56.9, .14], [63.9, .12]],
    risers: [[50.6, 54.8, .26]], crashes: [[54.3, 54.9, .26]],
    falls: [[48.8, 49.9, .5]],
    pulses: [[50.1, .45], [51.1, .5], [52, .5], [52.8, .55], [53.5, .55], [54.05, .6], [54.4, .6], [54.65, .65], [54.78, .7]],
    pops: [7.55, 8.75, 9.95, 10.5].map(l => tOf('ifood', l)).concat([0, 1, 2, 3, 4].map(i => tOf('antes', 1 + 1.5 * i)), [.4, 1.4, 2.4].map(l => tOf('fim', l)), [1.5, 2.35, 3.2].map(l => tOf('ticket', l)), [3.7, 5.3, 7.3].map(l => tOf('funil', l))),
    taps: [2.2, 3.6].map(l => tOf('ifood', l))
  };

  /* camadas com paralaxe: f<1 fundo, f>1 frente (CX = deriva lenta da camera dentro da cena) */
  let CX = 0;
  function layer(s, f, fn) { g.save(); g.translate((1 - f) * (CX - s.X), 0); fn(); g.restore(); }

  /* ---------- mockups ---------- */
  function phone(x, y, w, h, draw) {
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 60; g.shadowOffsetY = 30;
    rr(g, x, y, w, h, 64); g.fillStyle = '#120806'; g.fill(); g.restore();
    g.save(); rr(g, x + 14, y + 14, w - 28, h - 28, 52); g.clip(); g.translate(x + 14, y + 14); draw(w - 28, h - 28); g.restore();
    g.save(); rr(g, x + w / 2 - 70, y + 26, 140, 38, 19); g.fillStyle = '#120806'; g.fill(); g.restore();
  }
  // a arte do selo vem num quadrado com cantos brancos: amplia (LK) para o vermelho tocar a borda do circulo
  const LK = 1.084;
  function logoCircle(x, y, r) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#E2231A'; g.fill(); g.clip(); if (im.logo.complete) g.drawImage(im.logo, x - r * LK, y - r * LK, r * 2 * LK, r * 2 * LK); g.restore(); }
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
    if (sp > 0) { const e = eOutBack(sp, 1.9); g.save(); g.translate(W / 2, H / 2); g.rotate((1 - eOutExpo(sp)) * -2.2); g.scale(e, e); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 80; g.shadowOffsetY = 30; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fillStyle = '#E2231A'; g.fill(); g.shadowColor = 'transparent'; logoCircle(0, 0, 250); g.restore();
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
    bg(PAPER); orbs(lt, ['255,237,0', '255,0,0'], .2);
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
        const p = seg(lt, .9 + i * .18, 2.8 + i * .18), x = 120 + i * 430, fs = Math.min(...cards.map(k => fitS(k[2] + nf(k[0], k[1]) + k[3], 330, 800, 'Dosis', 104)));
        g.save(); g.globalAlpha *= clamp(p * 4); glass(x - 30, 470, 414, 296, 40, { ta: .28, ph: i * .3 }); g.restore();
        T(c[2] + nf(c[0] * eOutExpo(p), c[1]) + c[3], x, 650, { f: 'Dosis', w: 800, s: fs, al: clamp(p * 3) });
        T(c[4], x, 705, { w: 600, s: 30, c: MUTE, al: clamp(p * 3) });
      });
      g.restore();
    });
    const bp = seg(lt, 5.0, 6.8);
    if (bp > 0) layer(s, 1.15, () => {
      g.save(); g.globalAlpha *= clamp(bp * 3); glass(90, 500, 1740, 560, 44, { ta: .26 }); g.restore();
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
    bg(INK); orbs(lt, ['255,0,0', '255,150,0'], .2);
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
    if (c3 > 0) rise('É aqui que o cardápio perde a venda.', 1800, 1015, c3, { s: 44, c: '#fff', a: 'right' });
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
    bg(PAPER); orbs(lt, ['255,237,0', '255,0,0'], .18);
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
        if (lp > 0) { g.save(); g.globalAlpha = eOutCubic(lp); glass(x - 8, y + SH_H + 34, 76 + txtW(sh[1], 800, 36) + 48, 84, 42, { ta: .34, ph: i * .2 }); g.beginPath(); g.arc(x + 30, y + SH_H + 76, 28, 0, 7); g.fillStyle = R; g.fill(); T(String(i + 1), x + 30, y + SH_H + 87, { f: 'Dosis', w: 800, s: 30, c: '#fff', a: 'center' }); T(sh[1], x + 76, y + SH_H + 88, { w: 800, s: 36 }); g.restore(); }
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
    bg(R); orbs(lt, ['255,237,0', '90,0,0'], .26);
    layer(s, .7, () => { g.fillStyle = R2; for (let k = 0; k < 9; k++) g.fillRect(-600, 140 + k * 110, W + 1200, 2); });
    layer(s, 1, () => {
      g.save(); g.globalAlpha *= seg(lt, 1, 1.6); glass(890, 330, 900, 700, 44, { ta: .2 }); g.restore();
      T('CAMPANHA MAUÁ · JUL → SET/2026', 120, 150, { f: 'Dosis', w: 800, s: 22, ls: 5, c: Y, al: seg(lt, .1, .5) });
      rise('O volume subiu.', 120, 260, seg(lt, .25, 1), { s: 96, c: '#fff' });
      rise('O ticket caiu.', 120, 370, seg(lt, .7, 1.5), { s: 96, c: Y });
      const pts = [[0, 50.01, 'jul'], [1, 42.03, 'ago'], [2, 39.81, 'set']], X = i => 1000 + i * 340, Yv = v => 900 - (v - 30) * 22;
      const dp = seg(lt, 1.4, 3.2);
      g.save(); g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineCap = g.lineJoin = 'round'; g.beginPath();
      const segs = 2 * eInOutCubic(dp); g.moveTo(X(0), Yv(pts[0][1]));
      for (let i = 1; i <= 2; i++) { const f = clamp(segs - (i - 1)); if (f <= 0) break; g.lineTo(lerp(X(i - 1), X(i), f), lerp(Yv(pts[i - 1][1]), Yv(pts[i][1]), f)); }
      g.stroke(); g.restore();
      pts.forEach((p, i) => { const q = seg(lt, 1.4 + i * .85, 1.9 + i * .85); if (q <= 0) return; g.beginPath(); g.arc(X(i), Yv(p[1]), 16 * eOutBack(q), 0, 7); g.fillStyle = Y; g.fill(); T(brl(p[1]), X(i), Yv(p[1]) + (i ? 78 : -40), { f: 'Dosis', w: 800, s: 46, c: '#fff', a: 'center', al: q }); T(p[2].toUpperCase(), X(i), 990, { f: 'Dosis', w: 800, s: 24, ls: 4, c: Y, a: 'center', al: q }); });
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
      T('O NOVO CARDÁPIO · iFOOD', 120, 170, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .1, .5) });
      rise('Feito pra', 120, 285, seg(lt, .25, 1), { s: 100 });
      rise('vender.', 120, 395, seg(lt, .4, 1.15), { s: 100, c: R });
      wrap('Por ocasião, com foto, preço único e complemento em todo combo. Só com as armas do iFood.', 120, 470, 640, 44, { w: 600, s: 32, c: INK, al: eOutCubic(seg(lt, 1, 1.6)) });
      ['Só pra mim', 'Pra dois', 'Pra galera'].forEach((c, i) => { const p = eOutBack(seg(lt, 1.8 + i * .3, 2.3 + i * .3), 2); if (p <= 0) return; g.save(); g.translate(120 + i * 230, 690); g.scale(p, p); pill(c, 0, 0, { s: 26, bg: i === 2 ? INK : '#fff', c: i === 2 ? Y : INK, px: 40 }); g.restore(); });
    });
    layer(s, 1.12, () => { const e = eOutExpo(seg(lt, .4, 1.4)); phone(960, 90 + (1 - e) * 900, 470, 950, (w, h) => ifoodScreen(w, h, lt)); });
    layer(s, 1.3, () => {
      const tags = [['Âncora primeiro, selo no meio', 3.9, 330], ['Complemento = garçom', 7.3, 520], ['Bebida R$ 2 mais barata no combo', 8.5, 620], ['Doce dentro de todo combo', 9.7, 720]];
      tags.forEach(([t, at, y]) => { const p = seg(lt, at, at + .5); if (p > 0) { g.save(); g.translate((1 - eOutExpo(p)) * 60, 0); pill(t, 1448, y, { bg: INK, c: Y, s: 18, al: eOutCubic(p) }); g.restore(); } });
      const fp = seg(lt, 10.4, 11.1); if (fp > 0) { const e = eOutBack(fp, 2); g.save(); g.globalAlpha *= fp; glass(90, 780, 800, 190, 40, { ta: .3 }); g.restore(); T('TICKET DO PEDIDO', 120, 820, { f: 'Dosis', w: 800, s: 22, ls: 4, c: INK, al: fp }); g.save(); g.translate(120, 880); g.scale(e, e); T('R$ 148,90 → R$ 177,60', 0, 0, { f: 'Dosis', w: 800, s: 64, c: R }); g.restore(); T('+19% no pedido · CMV 27,7%', 120, 935, { w: 700, s: 30, c: INK, al: fp }); }
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

  /* ---------- CENA 7 · CMV 28% ---------- */
  const CMVR = [
    ['Coca-Cola lata', 'R$ 7,90 → R$ 13,90 (R$ 11,90 no combo)', 46.1, 26.2],
    ['Super Combo', 'R$ 79,90 → R$ 94,90', 33.1, 27.9],
    ['Combo P', 'R$ 54,90 → R$ 62,90', 31.7, 27.7],
    ['Combo M', 'R$ 79,90 → R$ 87,90', 30.8, 28.0],
    ['Chicken Burger', 'R$ 29,90 → R$ 25,90 · mais barato', 23.5, 27.1],
    ['Chicken Salada', 'R$ 32,90 → R$ 26,90 · mais barato', 22.6, 27.7]
  ];
  const cmvT = i => 1.8 + i * 0.55;
  function sCmv(s, lt) {
    bg(PAPER);
    const X0 = 820, X1 = 1780, xv = v => X0 + (v - 15) / 35 * (X1 - X0), top = 430, step = 84;
    layer(s, 1, () => {
      T('PLANILHA CMV 2026 · NOVA OPERAÇÃO', 120, 150, { f: 'Dosis', w: 800, s: 22, ls: 5, c: R, al: seg(lt, .1, .5) });
      rise('Todo preço com', 120, 255, seg(lt, .25, 1), { s: 90 });
      rise('CMV de até 28%.', 120, 355, seg(lt, .4, 1.15), { s: 90, c: R });
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
    if (q > 0) layer(s, 1.2, () => { const w = pill('CMV do mix real: 28,8% → 27,7%', 120, 1010, { bg: INK, c: Y, s: 24, al: eOutCubic(q) }); pill('Margem sobrando virou preço menor', 120 + w + 16, 1010, { bg: Y, c: INK, s: 24, al: eOutCubic(seg(lt, 5.7, 6.4)) }); });
  }

  /* ---------- CENA 8 · resultado + fecho ---------- */
  function sFim(s, lt) {
    bg(R); orbs(lt, ['255,237,0', '90,0,0'], .26);
    const nums = [['CMV do mix', '28,8% → ', '27,7%', .3], ['Ticket médio', 'R$ 58,96 → ', 'R$ 63,85', 1.3], ['Margem bruta por mês', 'conversão estável · ', '+R$ 255 mil', 2.3]];
    const close = eInOutExpo(seg(lt, 3.9, 4.8));
    layer(s, 1, () => {
      g.save(); g.globalAlpha = 1 - close;
      T('PROJEÇÃO CONSERVADORA · BASE SET/2026', 120, 170, { f: 'Dosis', w: 800, s: 22, ls: 5, c: Y, al: seg(lt, .05, .4) });
      nums.forEach((n, i) => { const p = seg(lt, n[3], n[3] + .6), y = 380 + i * 230; if (p <= 0) return; g.save(); g.globalAlpha *= eOutCubic(p); glass(90, y - 130, 1400, 210, 40, { ta: .2, ph: i * .3 }); g.restore(); T(n[0].toUpperCase(), 120, y - 70, { f: 'Dosis', w: 800, s: 24, ls: 4, c: '#fff', al: eOutCubic(p) }); T(n[1], 120, y + 30, { w: 700, s: 50, c: 'rgba(255,255,255,.75)', al: eOutCubic(p) }); g.font = F(700, 50); const off = n[1] ? g.measureText(n[1]).width : 0; rise(n[2], 120 + off + 10, y + 50, p, { s: i === 2 ? 150 : 110, c: Y, f: 'Dosis', it: false, w: 800 }); });
      g.restore();
    });
    if (close > 0) {
      g.fillStyle = Y; g.fillRect(lerp(-W / 2 - EXT * 2, -EXT * 2, close), 0, W / 2 + EXT * 2 + 2, H);
      const sp = seg(lt, 4.3, 5.1);
      if (sp > 0) { const e = eOutBack(sp, 1.6); g.save(); g.translate(W / 2, H / 2); g.rotate((1 - eOutExpo(sp)) * 2); g.scale(e * .9, e * .9); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 60; g.shadowOffsetY = 24; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fillStyle = '#E2231A'; g.fill(); g.shadowColor = 'transparent'; logoCircle(0, 0, 250); g.restore(); }
      rise('Cardápio', 110, 480, seg(lt, 4.9, 5.7), { s: 110, c: INK });
      rise('Nº1.', 110, 600, seg(lt, 5.05, 5.85), { s: 110, c: INK });
      rise('Number One.', W - 110, 480, seg(lt, 5.3, 6.1), { s: 110, c: '#fff', a: 'right' });
      rise('Sempre.', W - 110, 600, seg(lt, 5.45, 6.25), { s: 110, c: '#fff', a: 'right' });
      const kp = seg(lt, 5.9, 6.5); if (kp > 0) T('N1 CHICKEN · TASTEFY · LABORATÓRIO DE IA · 2026', W / 2, 1000, { f: 'Dosis', w: 800, s: 22, ls: 6, a: 'center', c: INK, al: kp });
    }
  }

  /* ---------- lancamento: texto com volume e letras que pulam ---------- */
  function T3(str, x, y, o = {}) {
    g.save(); g.font = F(o.w || 900, o.s || 120, o.it !== false, o.f); g.textAlign = o.a || 'center'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.ls ?? -2) + 'px';
    g.globalAlpha *= o.al == null ? 1 : o.al;
    const d = o.d ?? Math.round((o.s || 120) * .06);
    g.fillStyle = o.ex || INK; for (let k = d; k > 0; k--) g.fillText(str, x + k * .55, y + k);
    if (o.st) { g.lineWidth = o.stw || 8; g.strokeStyle = o.st; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = o.c || Y; g.fillText(str, x, y); g.restore();
  }
  function pop(str, x0, y, lt, t0, o = {}) {
    if (lt < t0) return 0;
    const sz = o.s || 120, ls = o.ls ?? -2, ch = [...str];
    g.save(); g.font = F(o.w || 900, sz, o.it !== false, o.f); if ('letterSpacing' in g) g.letterSpacing = '0px';
    const ws = ch.map(c => g.measureText(c).width + ls), tw = ws.reduce((a, b) => a + b, 0) - ls; g.restore();
    let x = o.a === 'left' ? x0 : x0 - tw / 2;
    ch.forEach((c, k) => {
      const st = t0 + k * (o.stg ?? .035), p = seg(lt, st, st + (o.dur || .42));
      if (p > 0 && c !== ' ') {
        const e = eOutBack(p, o.back ?? 2.2), sc = lerp(o.from ?? .15, 1, e), cx = x + ws[k] / 2, cy = y - sz * .35, bob = o.bob ? Math.sin((lt - t0) * 3 + k * .7) * o.bob : 0;
        g.save(); g.translate(cx, cy + bob); g.rotate((1 - Math.min(1, e)) * (k % 2 ? .3 : -.3)); g.scale(sc, sc); g.translate(-cx, -cy);
        T3(c, cx, y, Object.assign({}, o, { a: 'center', ls: 0, al: clamp(p * 4) })); g.restore();
      }
      x += ws[k];
    });
    return tw;
  }
  function confete(u, cx, cy, n = 150, sd = 0) {
    for (let k = 0; k < n; k++) {
      const tt = u - rnd(k + sd + 90) * .1; if (tt <= 0) continue;
      const a = rnd(k + sd) * Math.PI * 2, v = 700 + rnd(k + sd + 50) * 1500, d = v * (1 - Math.exp(-tt * 2.4)) / 2.4;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .75 + 380 * tt * tt, al = clamp(2.4 - tt); if (al <= 0) continue;
      g.save(); g.translate(x, y); g.rotate(tt * (4 + rnd(k + 7) * 8) + k); g.scale(1, Math.cos(tt * (5 + rnd(k + 2) * 7)));
      g.globalAlpha = al; g.fillStyle = [Y, R, '#fff', INK, Y2][k % 5]; g.fillRect(-9, -5, 16 + rnd(k + 3) * 12, 10); g.restore();
    }
  }
  function spot(x0, ang, a) {
    g.save(); g.translate(x0, -80); g.rotate(ang); const gr = g.createLinearGradient(0, 0, 0, 1500); gr.addColorStop(0, 'rgba(255,236,170,' + a + ')'); gr.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = gr; g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.lineTo(340, 1500); g.lineTo(-340, 1500); g.closePath(); g.fill(); g.restore();
  }

  /* ---------- CENA · E agora... o novo cardapio ---------- */
  function sRevela(s, lt) {
    if (lt < 6) {
      bg('#080403');
      if (lt >= 5.5) return; // respiro: meio segundo de tela preta antes do drop
      const conv = eInOutCubic(seg(lt, 2, 5.5)), sw = Math.sin(lt * 1.6);
      spot(W * .2, lerp(-.5 + sw * .12, -.16, conv), .14 + .1 * conv);
      spot(W * .8, lerp(.5 - sw * .12, .16, conv), .14 + .1 * conv);
      const rp = seg(lt, 2, 5.5);
      if (rp > 0) { g.save(); g.translate(W / 2, 560); g.rotate(lt * .5); g.globalAlpha = .08 + .3 * rp; for (let k = 0; k < 16; k++) { g.rotate(Math.PI / 8); if (k % 2) continue; g.beginPath(); g.moveTo(0, 0); g.lineTo(1400, -90); g.lineTo(1400, 90); g.closePath(); g.fillStyle = R; g.fill(); } g.restore(); }
      for (let k = 0; k < 90; k++) { const x = (rnd(k) * W + lt * (20 + rnd(k + 1) * 40)) % W, y = (rnd(k + 2) * H - lt * (10 + rnd(k + 3) * 30) + H * 2) % H; g.globalAlpha = .1 + .2 * rnd(k + 4); g.fillStyle = '#ffe9b0'; g.fillRect(x, y, 3, 3); }
      g.globalAlpha = 1;
      const z = 1 + .16 * conv, jit = seg(lt, 3, 5.5) * 8, fr = Math.floor(lt * 30);
      g.save(); g.translate(W / 2 + (rnd(fr) - .5) * jit, H / 2 + (rnd(fr + 5) - .5) * jit); g.scale(z, z); g.translate(-W / 2, -H / 2);
      const p1 = seg(lt, 0, .32), up = eInOutExpo(seg(lt, 1.95, 2.25));
      if (p1 > 0) {
        const y = lerp(620, 340, up), base = lerp(2.4, 1, eOutExpo(p1)) * lerp(1, .58, up);
        for (let gh = 3; gh >= 0; gh--) {
          if (p1 >= 1 && gh) continue; const sc = base * (1 + gh * .12 * (1 - p1));
          g.save(); g.translate(W / 2, y - 80); g.scale(sc, sc); g.translate(-W / 2, -(y - 80)); T3('E AGORA,', W / 2, y, { s: 250, c: '#fff', ex: R2, d: 14, al: gh ? .18 * (1 - p1) : clamp(p1 * 4) }); g.restore();
        }
      }
      pop('APRESENTAMOS', W / 2, 610, lt, 2.12, { s: 170, c: Y, ex: R2, stg: .03, dur: .35 });
      pop('A VOCÊS', W / 2, 810, lt, 2.4, { s: 170, c: '#fff', ex: R2, stg: .04, dur: .35 });
      g.restore();
      return;
    }
    // DROP: o novo cardapio pula da tela
    const u = lt - 6, fx = 520, fy = 340, fw = 880, fh = 520, fc = fy + fh / 2;
    bg(Y);
    const rs = eOutExpo(seg(u, 0, .45));
    g.save(); g.translate(W / 2, fc); g.rotate(u * .22); g.scale(rs, rs); g.fillStyle = R; for (let k = 0; k < 10; k++) { g.rotate(Math.PI / 5); g.beginPath(); g.moveTo(0, 0); g.lineTo(1500, -160); g.lineTo(1500, 160); g.closePath(); g.fill(); } g.restore();
    for (let k = 0; k < 3; k++) { const q = seg(u, k * .1, .9 + k * .1); if (q > 0 && q < 1) { g.save(); g.strokeStyle = k % 2 ? '#fff' : INK; g.globalAlpha = 1 - q; g.lineWidth = 18 * (1 - q); g.beginPath(); g.arc(W / 2, fc, 200 + q * 1100, 0, 7); g.stroke(); g.restore(); } }
    // a tela (moldura) de onde tudo sai
    const fp = eOutBack(seg(u, 0, .3), 1.6);
    g.save(); g.translate(W / 2, fc); g.rotate(-.025); g.scale(fp, fp); g.translate(-W / 2, -fc);
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 60; g.shadowOffsetY = 30; rr(g, fx - 18, fy - 18, fw + 36, fh + 36, 38); g.fillStyle = '#120806'; g.fill(); g.shadowColor = 'transparent';
    g.save(); rr(g, fx, fy, fw, fh, 22); g.clip(); cover(im.comboG, fx, fy, fw, fh); g.fillStyle = 'rgba(26,12,5,.42)'; g.fillRect(fx, fy, fw, fh);
    const gl = g.createRadialGradient(W / 2, fc, 20, W / 2, fc, fw * .7); gl.addColorStop(0, 'rgba(255,237,0,.32)'); gl.addColorStop(1, 'rgba(255,237,0,0)'); g.fillStyle = gl; g.fillRect(fx, fy, fw, fh); g.restore();
    g.restore();
    // estilhaços da tela vindo na direção da câmera
    for (let k = 0; k < 28; k++) {
      const q = seg(u, .02, 1.3); if (q <= 0 || q >= 1) break;
      const side = k % 4, ed = rnd(k + 40), x0 = side < 2 ? fx + ed * fw : side === 2 ? fx : fx + fw, y0 = side === 0 ? fy : side === 1 ? fy + fh : fy + ed * fh;
      const dx = x0 - W / 2, dy = y0 - fc, L = Math.hypot(dx, dy) || 1, sp = 500 + rnd(k + 41) * 900, e = eOutCubic(q), sc = 1 + e * 2.6;
      g.save(); g.translate(x0 + dx / L * sp * e, y0 + dy / L * sp * e + 300 * q * q); g.rotate(q * (3 + rnd(k) * 6)); g.scale(sc, sc); g.globalAlpha = 1 - q;
      g.beginPath(); g.moveTo(0, -14); g.lineTo(11, 9); g.lineTo(-9, 12); g.closePath(); g.fillStyle = 'rgba(255,255,255,.88)'; g.fill(); g.strokeStyle = 'rgba(26,12,5,.4)'; g.lineWidth = 1.5; g.stroke(); g.restore();
    }
    // as palavras saem da tela e passam da moldura
    pop('O NOVO', W / 2, 382, u, .04, { s: 124, c: '#fff', ex: INK, st: INK, stw: 6, stg: .04, dur: .4, from: .05, bob: 5 });
    pop('CARDÁPIO', W / 2, 700, u, .12, { s: 250, c: R, ex: INK, d: 16, st: '#fff', stw: 10, stg: .05, dur: .45, from: .05, bob: 7 });
    pop('DA N1', W / 2, 912, u, .42, { s: 128, c: '#fff', ex: R2, st: INK, stw: 7, stg: .05, dur: .4, from: .05, bob: 5 });
    // o selo pula pelo canto da tela
    const sp = seg(u, .3, .75);
    if (sp > 0) { const e = eOutBack(sp, 2), x = lerp(fx + fw - 160, fx + fw + 30, eOutExpo(sp)), y = lerp(fy + 160, fy - 10, eOutExpo(sp)), r = 155 * lerp(.2, 1, e);
      g.save(); g.translate(x, y + Math.sin(u * 3) * 6); g.rotate((1 - eOutExpo(sp)) * -3 + Math.sin(u * 2) * .05); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = '#E2231A'; g.fill(); g.shadowColor = 'transparent'; logoCircle(0, 0, r); g.restore(); }
    confete(u, W / 2, fc);
  }

  /* ---------- CENA · antes x depois ---------- */
  const AD = [['13 categorias', '7 ocasiões'], ['284 produtos', '32 itens'], ['Combo em 4 preços', '1 preço, sempre'], ['Doce sem foto, escondido', 'Doce em todo combo'], ['Coca avulsa R$ 13,90', 'R$ 11,90 no combo']];
  function sAntes(s, lt) {
    bg(Y);
    const dv = y => lerp(1010, 900, y / H), sp = eOutExpo(seg(lt, 0, .35));
    g.save(); g.translate(lerp(-W * .6, 0, sp), 0); g.beginPath(); g.moveTo(-EXT, 0); g.lineTo(dv(0), 0); g.lineTo(dv(H), H); g.lineTo(-EXT, H); g.closePath(); g.fillStyle = '#1d120c'; g.fill();
    g.save(); g.clip(); g.globalAlpha = .12; cover(prints['00_loja_burgers_topo'], -EXT, 0, 1100, H, .3, 0); g.restore(); g.restore();
    const bh = eOutExpo(seg(lt, .1, .45)) * H;
    if (bh > 0) { g.beginPath(); g.moveTo(dv(0) - 16, 0); g.lineTo(dv(0) + 16, 0); g.lineTo(dv(bh) + 16, bh); g.lineTo(dv(bh) - 16, bh); g.closePath(); g.fillStyle = R; g.fill(); }
    const h1 = seg(lt, .15, .5), h2 = seg(lt, .3, .65);
    if (h1 > 0) { g.save(); g.translate(480, 170); const e = lerp(1.8, 1, eOutExpo(h1)); g.scale(e, e); T('ANTES', 0, 0, { w: 900, it: true, s: 120, c: 'rgba(255,255,255,.3)', a: 'center', al: clamp(h1 * 3) }); g.restore(); }
    if (h2 > 0) { g.save(); g.translate(1440, 170); const e = lerp(1.8, 1, eOutExpo(h2)); g.scale(e, e); T3('DEPOIS', 0, 0, { s: 120, c: R, ex: INK, al: clamp(h2 * 3) }); g.restore(); }
    AD.forEach(([a, b], i) => {
      const ti = 1 + i * 1.5, y = 330 + i * 135, xd = dv(y - 20), pa = seg(lt, ti - .5, ti - .2);
      if (pa <= 0) return;
      const awa = txtW(a, 700, 44); g.save(); g.globalAlpha *= eOutCubic(pa); glass(xd - 70 - awa - 36, y - 56, awa + 72, 84, 42, { tint: '26,12,5', ta: .5, dark: true }); g.restore();
      T(a, xd - 70, y, { w: 700, s: 44, c: 'rgba(255,255,255,.85)', a: 'right', al: eOutCubic(pa) });
      g.save(); g.font = F(700, 44); const aw = g.measureText(a).width; g.restore();
      const sk = eOutExpo(seg(lt, ti - .15, ti + .05)); if (sk > 0) { g.save(); g.translate(xd - 80 - aw, y - 16); g.rotate(-.04); g.fillStyle = R; g.fillRect(0, 0, (aw + 20) * sk, 7); g.restore(); }
      const pb = seg(lt, ti, ti + .3); if (pb <= 0) return;
      g.save(); g.globalAlpha *= clamp(pb * 3); glass(xd + 40, y - 74, 860, 100, 50, { ta: .34, ph: i * .25 }); g.restore();
      const fl = 1 - seg(lt, ti, ti + .25); if (fl > 0 && fl < 1) { g.save(); g.globalAlpha = fl * .75; g.fillStyle = '#fff'; g.fillRect(xd + 40, y - 70, 820, 92); g.restore(); }
      const e = eOutBack(pb, 2.4); g.save(); g.translate(xd, y - 16); g.scale(e, e); g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fillStyle = INK; g.fill(); g.strokeStyle = Y; g.lineWidth = 6; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(-11, 0); g.lineTo(11, 0); g.moveTo(3, -9); g.lineTo(12, 0); g.lineTo(3, 9); g.stroke(); g.restore();
      const sc = lerp(1.7, 1, eOutExpo(pb)); g.save(); g.translate(xd + 70, y - 18); g.scale(sc, sc); g.translate(-(xd + 70), -(y - 18)); T3(b, xd + 70, y, { s: 62, c: INK, ex: R, d: 4, a: 'left', al: clamp(pb * 4) }); g.restore();
    });
    const fp = seg(lt, 8.4, 8.9); if (fp > 0) { const e = eOutBack(fp, 2); g.save(); g.translate(W / 2, 1012); g.scale(e, e); pill('Menos escolha · mais pedido', 0, 0, { bg: R, c: '#fff', s: 30, a: 'center' }); g.restore(); }
  }

  /* ---------- CENA · por que vende mais ---------- */
  const PQ = [
    { n: '1', t: ['Decide em', '3 segundos.'], d: 'Por ocasião, não por categoria. O combo certo para quantas pessoas aparece primeiro.' },
    { n: '2', t: ['O do meio', 'vende mais.'], d: 'Selo de mais pedido no combo do meio e o grande ao lado: o cliente sobe de tamanho sozinho.' },
    { n: '3', t: ['Todo combo', 'pergunta.'], d: 'Bebida, doce e upgrade viram complemento do combo, como um garçom que sugere.' },
    { n: '4', t: ['A IA monta', 'o pedido.'], d: 'No app, o Assistente N1 pergunta quantas pessoas e a fome, e recomenda em 3 toques.' }
  ];
  const pqT = k => 1.5 + k * 2.5;
  function porqueVis(k, u) {
    if (k === 0) {
      ['Só pra mim', 'Pra dois', 'Pra galera'].forEach((o, i) => { const p = eOutBack(seg(u, .2 + i * .12, .55 + i * .12), 2); if (p <= 0) return; g.save(); g.translate(1480, 380 + i * 130); g.scale(p, p); pill(o, 0, 0, { s: 34, bg: i === 2 ? Y : '#fff', c: INK, a: 'center', px: 70 }); g.restore(); });
      const cp = clamp(u / 1.6), a = eOutCubic(seg(u, .3, .7)); g.save(); g.globalAlpha = a; g.translate(1480, 800);
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 84, 0, 7); g.stroke();
      g.strokeStyle = Y; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 84, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp); g.stroke(); g.restore();
      T('3s', 1480, 824, { f: 'Dosis', w: 800, s: 70, c: '#fff', a: 'center', al: a });
    } else if (k === 1) {
      const all = window.N1.categories.flatMap(c => c.items), pr = id => (all.find(i => i.id === id) || {}).price || 0;
      [['comboP', 'Combo P', pr('combo-p'), 1140, 200, 260], ['comboM', 'Combo M', pr('combo-m'), 1360, 250, 330], ['comboG', 'Combo G', pr('combo-g'), 1630, 200, 260]].forEach(([img, nm, p, x, w, h], i) => {
        const mid = i === 1, e = eOutBack(seg(u, .15 + i * .1, .55 + i * .1), 1.8); if (e <= 0) return;
        const pulse = mid ? 1 + .025 * Math.sin(u * 6) : 1, y = 600 - h / 2;
        g.save(); g.translate(x + w / 2, 600); g.scale(e * pulse, e * pulse); g.translate(-(x + w / 2), -600);
        g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.shadowOffsetY = 18; rr(g, x, y, w, h, 22); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent';
        g.save(); rr(g, x + 10, y + 10, w - 20, h * .55, 14); g.clip(); cover(im[img], x + 10, y + 10, w - 20, h * .55); g.restore();
        T(nm, x + w / 2, y + h * .55 + 58, { w: 800, s: mid ? 34 : 28, c: INK, a: 'center' }); T(brl(p), x + w / 2, y + h * .55 + (mid ? 104 : 96), { f: 'Dosis', w: 800, s: mid ? 34 : 28, c: mid ? R : MUTE, a: 'center' });
        if (mid) { g.strokeStyle = R; g.lineWidth = 7; rr(g, x, y, w, h, 22); g.stroke(); pill('Mais pedido', x + w / 2, y, { s: 20, bg: R, c: '#fff', a: 'center' }); }
        g.restore();
      });
    } else if (k === 2) {
      const lines = [['Combo G · serve 3 a 5', 148.9], ['+ Onion Rings', 8.9], ['+ Coca lata no combo', 11.9], ['+ Brigadeiro N1', 7.9]], x = 1180, y = 290, w = 600, h = 580, e = eOutExpo(seg(u, 0, .4));
      g.save(); g.translate(0, (1 - e) * 200); g.globalAlpha = e; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.shadowOffsetY = 18; rr(g, x, y, w, h, 24); g.fillStyle = PAPER; g.fill(); g.shadowColor = 'transparent';
      T('SEU PEDIDO', x + 40, y + 70, { f: 'Dosis', w: 800, s: 24, ls: 4, c: R });
      lines.forEach(([n, v], i) => { const p = eOutCubic(seg(u, .25 + i * .28, .5 + i * .28)); if (p <= 0) return; const yy = y + 140 + i * 78; T(n, x + 40 + (1 - p) * 30, yy, { w: i ? 600 : 800, s: 30, c: INK, al: p }); T(brl(v), x + w - 40, yy, { f: 'Dosis', w: 800, s: 30, c: i ? MUTE : INK, a: 'right', al: p }); });
      const tp = eOutCubic(seg(u, 1.4, 1.7)); if (tp > 0) { g.fillStyle = 'rgba(26,12,5,.15)'; g.fillRect(x + 40, y + 450, w - 80, 2); T('Total', x + 40, y + 520, { w: 800, s: 34, c: INK, al: tp }); T('R$ 177,60', x + w - 40, y + 522, { f: 'Dosis', w: 800, s: 52, c: R, a: 'right', al: tp }); }
      g.restore();
      const bp = seg(u, 1.65, 2); if (bp > 0) { const s2 = eOutBack(bp, 2.6); g.save(); g.translate(x + w - 10, y + 10); g.rotate(.18); g.scale(s2, s2); g.beginPath(); g.arc(0, 0, 92, 0, 7); g.fillStyle = Y; g.fill(); T('+19%', 0, 18, { f: 'Dosis', w: 800, s: 52, c: INK, a: 'center' }); g.restore(); }
    } else {
      const e = eOutExpo(seg(u, -.1, .5)); phone(1250, 60 + (1 - e) * 700, 470, 960, (w, h) => chatScreen(w, h, 6.4 + Math.max(0, u) * 1.3));
    }
  }
  function sPorque(s, lt) {
    bg(INK);
    layer(s, .5, () => { const gr = g.createRadialGradient(1400, 560, 40, 1400, 560, 1000); gr.addColorStop(0, 'rgba(255,0,0,.38)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(-EXT, 0, W + EXT * 2, H); });
    const hp = eInOutExpo(seg(lt, 1.05, 1.45)), hs = lerp(1, .34, hp);
    g.save(); g.translate(120, lerp(470, 118, hp)); g.scale(hs, hs);
    pop('POR QUE ESSE CARDÁPIO', 0, 0, lt, 0, { s: 120, c: '#fff', ex: R2, stg: .02, dur: .35, a: 'left' });
    pop('VENDE MAIS?', 0, 175, lt, .3, { s: 170, c: Y, ex: R2, stg: .03, dur: .35, a: 'left' });
    g.restore();
    PQ.forEach((c, k) => {
      const u = lt - pqT(k); if (u < -.25) return;
      const nx = k < 3 ? pqT(k + 1) : 99, out = eInExpo(seg(lt, nx - .3, nx + .05)); if (out >= 1) return;
      const inn = eOutExpo(seg(u, -.25, .3));
      g.save(); g.translate((1 - inn) * 900 - out * 1500, 0); g.globalAlpha = clamp(inn * 2) * (1 - out);
      const np = seg(u, -.1, .3); g.save(); g.translate(270, 720); const ns = lerp(2, 1, eOutExpo(np)); g.scale(ns, ns); T3(c.n, 0, 0, { s: 420, c: Y, ex: R2, d: 22 }); g.restore();
      rise(c.t[0], 480, 470, seg(u, 0, .45), { s: 96, c: '#fff' });
      rise(c.t[1], 480, 575, seg(u, .1, .55), { s: 96, c: Y });
      wrap(c.d, 480, 660, 620, 44, { w: 600, s: 32, c: 'rgba(255,255,255,.78)', al: eOutCubic(seg(u, .3, .8)) });
      porqueVis(k, u);
      g.restore();
    });
  }

  const DRAW = { intro: sIntro, nums: sNums, funil: sFunil, hoje: sHoje, ticket: sTicket, revela: sRevela, ifood: sIfood, antes: sAntes, porque: sPorque, app: sApp, cmv: sCmv, fim: sFim };

  /* ---------- render ---------- */
  const MT = window.MotionT, IMP = HITS;
  const impAmp = t => { let a = 0; for (const [ti, k] of IMP) { const d = t - ti; if (d >= 0 && d < 1.2) a += k * Math.exp(-d / .22); } return a; };
  const flashAmp = t => { let a = 0; for (const [ti, k] of IMP) { const d = t - ti; if (k >= .8 && d >= 0 && d < .4) a = Math.max(a, Math.min(1, k) * Math.exp(-d / .07)); } return a; };
  function drawScene(i, t, gctx) {
    const s = S[i], lt = (t - s.t0) * s.rate + s.off, prog = clamp((t - s.t0) / s.D);
    g = gctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    CX = s.X + lerp(-26, 26, prog);
    const z = 1 + 0.02 * prog; // empurrao lento de camera
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.beginPath(); g.rect(-EXT, 0, W + EXT * 2, H); g.clip(); DRAW[s.id](s, lt);
    g.restore();
  }
  function render(t) {
    t = clamp(t, 0, END - 0.001); GT = t;
    let i = S.findIndex(s => t >= s.t0 && t < s.t1); if (i < 0) i = S.length - 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // em transicao? (janela centrada na fronteira, alinhada a batida)
    let j = -1, p = 0;
    for (let k = 0; k < S.length - 1; k++) { const tb = S[k].t1, h = TRANS[k].h; if (t >= tb - h && t < tb + h) { j = k; p = (t - (tb - h)) / (2 * h); break; } }
    const amp = impAmp(t), fq = Math.floor(t * 30);
    if (amp > .01) { const sc = 1 + Math.min(.05, amp * .035), dx = (rnd(fq + 3) - .5) * 44 * amp, dy = (rnd(fq + 8) - .5) * 44 * amp; ctx.setTransform(sc, 0, 0, sc, W / 2 * (1 - sc) + dx, H / 2 * (1 - sc) + dy); }
    if (j >= 0) { drawScene(j, t, gA); drawScene(j + 1, t, gB); MT.T[TRANS[j].t](ctx, bufA, bufB, p, Object.assign({ logo: im.logo, cores: [Y, R, INK] }, TRANS[j].o || {})); }
    else { drawScene(i, t, gA); ctx.drawImage(bufA, 0, 0); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fa = flashAmp(t); if (fa > .01) { ctx.fillStyle = 'rgba(255,253,235,' + (.6 * fa).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    g = ctx; // titulos de capitulo e barra por cima da composicao
    const sc = S[i];
    if (sc.ch && j < 0) { const a = clamp(seg(t - sc.t0, .7, 1.2)) * (1 - seg(t, sc.t1 - 1, sc.t1 - .7)) * (sc.id === 'fim' ? 1 - seg(t, 75.6, 76) : 1); const dark = ['funil', 'app', 'porque'].includes(sc.id), red = ['ticket', 'fim'].includes(sc.id); { const lw = txtW(sc.ch.toUpperCase(), 800, 18, false, 'Dosis', 4) + 56; g.save(); g.globalAlpha *= a; glass(W - 120 - lw + 28, 62, lw, 54, 27, { ta: dark ? .22 : .3, dark: dark, blur: 20 }); g.restore(); } T(sc.ch.toUpperCase(), W - 120, 90, { f: 'Dosis', w: 800, s: 18, ls: 4, c: dark ? 'rgba(255,255,255,.95)' : red ? 'rgba(255,255,255,.95)' : 'rgba(26,12,5,.85)', a: 'right', al: a }); }
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, H - 6, W, 6); ctx.fillStyle = Y; ctx.fillRect(0, H - 6, W * t / END, 6); ctx.fillStyle = R; ctx.fillRect(W * t / END - 14, H - 6, 14, 6);
    // brilho quente que respira com a musica (sutil, sem equalizador)
    const lv = music.level(t);
    if (lv > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const gl = ctx.createRadialGradient(W * .5, H * .42, 60, W * .5, H * .42, H * .95); gl.addColorStop(0, 'rgba(255,190,60,' + (0.07 * lv).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,190,60,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // grao + vinheta
    ctx.globalAlpha = .5; const ox = Math.floor(rnd(Math.floor(t * 24)) * 256), oy = Math.floor(rnd(Math.floor(t * 24) + 9) * 256);
    ctx.save(); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(ox, oy, W, H); ctx.restore(); ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.3 - 0.06 * lv).toFixed(3) + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const ff = seg(t, END - 1.2, END); if (ff > 0) { ctx.fillStyle = 'rgba(0,0,0,' + ff + ')'; ctx.fillRect(0, 0, W, H); }
  }
  window.__render = render;

  /* tela cheia fora de 16:9: o que sobraria preto vira a extensão das bordas do próprio quadro, desfocada.
     Os fundos das cenas são quase lisos, então a emenda some. Só roda no player (não entra na exportação). */
  const amb = document.getElementById('amb'), actx = amb ? amb.getContext('2d') : null; let exporting = false;
  function ambient() {
    if (!actx || exporting) return;
    const sw = innerWidth, sh = innerHeight;
    if (Math.abs(sw / sh - W / H) < .012) { if (amb.style.display !== 'none') amb.style.display = 'none'; return; }
    amb.style.display = 'block';
    const aw = 320, ah = Math.max(2, Math.round(aw * sh / sw)); if (amb.width !== aw || amb.height !== ah) { amb.width = aw; amb.height = ah; }
    const k = Math.min(sw / W, sh / H), fw = W * k * aw / sw, fh = H * k * aw / sw, fx = (aw - fw) / 2, fy = (ah - fh) / 2;
    actx.drawImage(cv, 0, 0, W, H, fx, fy, fw, fh); // o meio também é preenchido, para o desfoque não escurecer a emenda
    if (fy > .5) { actx.drawImage(cv, 0, 0, W, 4, 0, 0, aw, fy + 1); actx.drawImage(cv, 0, H - 14, W, 4, 0, fy + fh - 1, aw, ah - fy - fh + 1); }
    if (fx > .5) { actx.drawImage(cv, 0, 0, 4, H, 0, 0, fx + 1, ah); actx.drawImage(cv, W - 4, 0, 4, H, fx + fw - 1, 0, aw - fx - fw + 1, ah); }
  }
  const renderBase = render;
  window.__render = t => { renderBase(t); ambient(); };

  /* =================== MUSICA (Suno) + EFEITOS (js/sfx-lancamento.js) =================== */
  const MUSIC = 'assets/music/trilha-suno.mp3';
  const music = (() => {
    let buf = null, env = null, ac = null, gain = null, dest = null, src = null, t0 = 0, from = 0, on = false; const FPS = 30, SR = 48000;
    const ready = (async () => {
      await new Promise(r => setTimeout(r, 60));
      const [raw, sfx] = await Promise.all([fetch(MUSIC).then(r => r.arrayBuffer()), window.N1Sfx.render(END, EV, SR)]);
      const dec = await new OfflineAudioContext(2, 1, SR).decodeAudioData(raw);
      // normaliza o trecho usado da musica para pico de 0,8
      let pk = 0; for (let c = 0; c < dec.numberOfChannels; c++) { const d = dec.getChannelData(c); for (let i = Math.floor(S0 * SR); i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; } }
      const oc = new OfflineAudioContext(2, Math.ceil(END * SR), SR);
      const lim = oc.createDynamicsCompressor(); lim.threshold.value = -5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .12; lim.connect(oc.destination);
      const ms = oc.createBufferSource(); ms.buffer = dec; const mg = oc.createGain(), K = pk > 0 ? .8 / pk : 1;
      // a virada: "E AGORA" abafa a musica (como se fosse para outra sala), a subida fica fechada, e o drop abre tudo de uma vez
      const fl = oc.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = .8; fl.frequency.setValueAtTime(20000, 0);
      fl.frequency.setValueAtTime(20000, BREAK[0]); fl.frequency.exponentialRampToValueAtTime(650, BREAK[0] + .45); fl.frequency.setValueAtTime(650, BREAK[1] - .6); fl.frequency.exponentialRampToValueAtTime(2200, BREAK[1] - .06); fl.frequency.setValueAtTime(20000, BREAK[1]);
      mg.gain.setValueAtTime(0, 0); mg.gain.linearRampToValueAtTime(K, .12);
      mg.gain.setValueAtTime(K, BREAK[0]); mg.gain.linearRampToValueAtTime(K * .55, BREAK[0] + .45); mg.gain.setValueAtTime(K * .55, BREAK[1] - .6); mg.gain.linearRampToValueAtTime(K * .12, BREAK[1] - .08); mg.gain.setValueAtTime(K * 1.12, BREAK[1]); mg.gain.linearRampToValueAtTime(K, BREAK[1] + .5);
      ms.connect(fl); fl.connect(mg); mg.connect(lim);
      const ss = oc.createBufferSource(); ss.buffer = sfx; const sg = oc.createGain(); sg.gain.value = .6; ss.connect(sg); sg.connect(lim);
      ms.start(0, S0, END); ss.start(0);
      const b = await oc.startRendering();
      let q = 0; for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > q) q = a; } }
      if (q > .95) for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= .95 / q; }
      buf = b; const d = b.getChannelData(0), step = Math.floor(b.sampleRate / FPS), n = Math.floor(d.length / step), v = new Float32Array(n);
      for (let k = 0; k < n; k++) { let z = 0; for (let x = k * step, e = x + step; x < e; x++) z += d[x] * d[x]; v[k] = Math.sqrt(z / step); }
      const sorted = Array.from(v).sort((a, b) => a - b), ref = sorted[Math.floor(n * .95)] || 1, lo = sorted[Math.floor(n * .2)] || 0;
      env = v.map(x => clamp((x - lo) / (ref - lo))); return b;
    })();
    function wire() { if (ac) return; ac = new AudioContext({ sampleRate: 48000 }); gain = ac.createGain(); gain.gain.value = .95; gain.connect(ac.destination); dest = ac.createMediaStreamDestination(); gain.connect(dest); }
    return {
      ready, get buffer() { return buf; },
      play(f) { wire(); ac.resume(); this.stop(); from = f; src = ac.createBufferSource(); src.buffer = buf; src.connect(gain); t0 = ac.currentTime + .03; src.start(t0, f); on = true; },
      stop() { if (src) { try { src.stop(); } catch (e) { } src.disconnect(); src = null; } on = false; },
      now() { return on ? Math.max(from, from + ac.currentTime - t0) : from; },
      stream() { wire(); return dest.stream; },
      vol() { },
      level(t) { if (!env) return 0; const k = Math.floor(t * FPS); let s = 0, c = 0; for (let x = k - 2; x <= k + 2; x++) if (env[x] != null) { s += env[x]; c++; } return c ? s / c : 0; }
    };
  })();
  window.__music = music;
  /* =================== player =================== */
  const paint = t => { render(t); ambient(); };
  addEventListener('resize', () => paint(tNow));
  document.addEventListener('fullscreenchange', () => setTimeout(() => paint(tNow), 60));
  const $ = sel => document.querySelector(sel);
  let playing = false, tNow = 0, raf = 0, recorder = null, chunks = [];
  const seek = $('#seek'), tc = $('#tc');
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function ui() { seek.value = tNow; tc.textContent = `${mmss(tNow)} / ${mmss(END)}`; $('#play').textContent = playing ? '❚❚ Pausar' : '▶ Play'; document.body.classList.toggle('paused', !playing); }
  function loop() {
    if (!playing) return;
    tNow = music.now(); music.vol(tNow);
    if (tNow >= END) { tNow = END; paint(END - .001); stop(); if (recorder) finishRec(); ui(); return; }
    if (tNow >= 0) paint(tNow);
    ui(); raf = requestAnimationFrame(loop);
  }
  if (/[?&]embed=1/.test(location.search)) document.body.classList.add('embed');
  function play(from = tNow) { if (!music.buffer) { music.ready.then(() => play(from)); return; } if (from >= END - .05) from = 0; $('#start').style.display = 'none'; document.body.classList.add('started'); music.play(from); playing = true; tNow = from; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); ui(); }
  function stop() { playing = false; music.stop(); cancelAnimationFrame(raf); ui(); }
  $('#start').onclick = () => play(0);
  $('#play').onclick = () => playing ? stop() : play();
  $('#restart').onclick = () => { stop(); tNow = 0; play(0); };
  seek.oninput = () => { const was = playing; if (was) stop(); tNow = +seek.value; paint(tNow); ui(); seek._resume = was; };
  seek.onchange = () => { if (seek._resume) play(+seek.value); };
  $('#fs').onclick = () => { const el = document.documentElement; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen && el.requestFullscreen(); };
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); } });

  const yieldMC = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  const loadScript = src => new Promise((r, j) => { const sc = document.createElement('script'); sc.src = src; sc.onload = r; sc.onerror = j; document.head.appendChild(sc); });
  async function exportMP4(opts = {}) {
    exporting = true;
    try { return await exportMP4Inner(opts); } finally { exporting = false; }
  }
  async function exportMP4Inner(opts = {}) {
    const buf = await music.ready; await fontsReady;
    if (!window.Mp4Muxer) await loadScript('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js');
    const fps = 30, N = Math.round(END * fps), sr = buf.sampleRate, { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: fps }, audio: { codec: 'aac', numberOfChannels: 2, sampleRate: sr }, fastStart: 'in-memory' });
    let err = null;
    const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
    ve.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: opts.bitrate || 9e6, framerate: fps });
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
    recorder.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'N1_Chicken_Cardapio_N1.webm'; document.body.appendChild(a); a.click(); a.remove(); $('#recTag').classList.remove('on'); recorder = null; };
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
