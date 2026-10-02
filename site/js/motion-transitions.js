/* Biblioteca de transições para vídeos em canvas (skill brag-motion).
   Cada transição desenha no contexto `c` a passagem da cena A (canvas) para a B (canvas),
   com p de 0 a 1. Tudo é função pura do tempo: dá para buscar qualquer quadro.
   Regra do brag: nada de dupla exposição lamacenta. A sai e depois B entra, ou passa por uma cor da marca.
   Opções comuns: { cores: [amarelo, vermelho, escuro], logo: Image, cx, cy } */
(function (root) {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eIn = t => t * t * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const eExpo = t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  const eBack = (t, s = 1.6) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const COR = o => o.cores || ['#FFED00', '#FF0000', '#1A0C05'];
  const rrect = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  // a arte do selo vem num quadrado com cantos brancos: amplia (logoK) para o vermelho tocar a borda do círculo
  function selo(c, o, x, y, r, rot = 0) {
    if (!o.logo || !o.logo.complete || r <= 1) return;
    const k = o.logoK || 1.084;
    c.save(); c.translate(x, y); c.rotate(rot);
    c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = r * .25; c.shadowOffsetY = r * .08;
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = '#E2231A'; c.fill(); c.shadowColor = 'transparent';
    c.clip(); c.drawImage(o.logo, -r * k, -r * k, r * 2 * k, r * 2 * k); c.restore();
  }

  const T = {
    /* Íris: B nasce de dentro de um círculo (o selo) que cresce até cobrir a tela. */
    iris(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, r0 = o.r0 ?? 250;
      const e = eExpo(p), R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20, r = lerp(r0 * .9, R, e);
      c.drawImage(A, 0, 0);
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.clip(); c.drawImage(B, 0, 0); c.restore();
      c.save(); c.strokeStyle = COR(o)[0]; c.lineWidth = 28 * (1 - e) + 2; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.restore();
    },
    /* Tampas da caixa: duas abas fecham sobre A (com o selo no encontro) e abrem revelando B. */
    flaps(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, [Y, R] = COR(o);
      const fecha = p < .5, k = fecha ? eIn(seg(p, 0, .5)) : 1 - eOut(seg(p, .5, 1));
      c.drawImage(fecha ? A : B, 0, 0);
      const h = H / 2 * k;
      c.fillStyle = Y; c.fillRect(0, 0, W, h);
      c.fillStyle = R; c.fillRect(0, H - h, W, h);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, h - 10, W, 10); c.fillRect(0, H - h, W, 10);
      const sp = seg(p, .38, .62), s = Math.sin(sp * Math.PI);
      if (s > 0) selo(c, o, W / 2, H / 2, 150 * eBack(Math.min(1, s * 1.15)), (p - .5) * 1.4);
    },
    /* Onda de molho: uma borda líquida desce cobrindo A e deixa B por cima; a crista é da cor da marca. */
    molho(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, cor = COR(o)[1], e = eInOut(p);
      const base = lerp(-160, H + 160, e), onda = x => base + Math.sin(x * .011 + p * 9) * 46 + Math.sin(x * .027 + 1.7) * 20;
      c.drawImage(A, 0, 0);
      c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0);
      for (let x = W; x >= 0; x -= 16) c.lineTo(x, onda(x)); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
      c.save(); c.beginPath(); for (let x = 0; x <= W; x += 16) c.lineTo(x, onda(x)); for (let x = W; x >= 0; x -= 16) c.lineTo(x, onda(x) + 34 + Math.sin(x * .05) * 10); c.closePath(); c.fillStyle = cor; c.fill(); c.restore();
      for (let k = 0; k < 7; k++) { const x = (k * 293 + 140) % W, d = clamp((e - .1 - k * .05) * 3); if (d <= 0 || d >= 1) continue; c.beginPath(); c.ellipse(x, onda(x) + 34 + d * 60, 9, 14, 0, 0, 7); c.fillStyle = cor; c.fill(); }
    },
    /* Chicote: A sai e B entra na horizontal, com rastro de movimento e riscos nas cores da marca. */
    whip(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, e = eExpo(p), dir = o.dir || 1, [Y, R] = COR(o);
      const v = Math.sin(p * Math.PI), sm = 300 * v, N = 7, xa = -dir * W * e, xb = dir * W * (1 - e);
      for (let k = 0; k < N; k++) { c.globalAlpha = k ? 1 / (k + 1) : 1; c.drawImage(A, xa - dir * sm * k / N, 0); c.drawImage(B, xb - dir * sm * k / N, 0); }
      c.globalAlpha = 1;
      const n = Math.floor(30 * v); for (let k = 0; k < n; k++) { const y = ((k * 137.5) % 1) * H || (k * 97) % H; c.fillStyle = k % 3 ? 'rgba(255,237,0,.45)' : 'rgba(255,0,0,.5)'; c.fillRect(((k * 389 + p * 4000) % (W + 600)) - 300, (k * 211) % H, 200 + sm * 2, 3 + (k % 3)); }
    },
    /* Faixas diagonais: listras amarelas e vermelhas varrem a tela e recolhem do outro lado. */
    faixas(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, [Y, R, K] = COR(o), n = 9, sk = H * .45, bw = (W + sk) / n + 2;
      c.drawImage(p < .5 ? A : B, 0, 0);
      for (let i = 0; i < n; i++) {
        const d = i * .035, ent = eInOut(seg(p, d, .5 + d * .3)), sai = eInOut(seg(p, .5 + d * .3, 1 - (n - 1 - i) * .02));
        if (ent <= 0 || sai >= 1) continue;
        // cada listra sobe de baixo (frente) e depois recolhe para cima (cauda); x inclina com a altura
        const x0 = i * bw - sk, top = lerp(H + 40, -40, ent), bot = lerp(H + 40, -40, sai), xs = y => x0 + sk * (1 - y / H);
        c.beginPath(); c.moveTo(xs(top), top); c.lineTo(xs(top) + bw, top); c.lineTo(xs(bot) + bw, bot); c.lineTo(xs(bot), bot); c.closePath();
        c.fillStyle = [Y, R, K][i % 3]; c.fill();
      }
    },
    /* Mergulho: a câmera entra num ponto de A (ex.: a tela do celular) e B nasce de dentro dele. */
    mergulho(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
      if (p < .5) { const k = eIn(seg(p, 0, .5)), s = lerp(1, 4.2, k); c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); c.drawImage(A, 0, 0); c.restore(); c.fillStyle = `rgba(255,255,255,${k * .9})`; c.fillRect(0, 0, W, H); }
      else { const k = eOut(seg(p, .5, 1)), s = lerp(.82, 1, k); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.save(); c.globalAlpha = k; c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(B, 0, 0); c.restore(); }
    },
    /* Virada de carta: A gira de lado até sumir, B aparece girando do outro lado (como as cartas do site). */
    carta(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, K = COR(o)[2], fr = p < .5, k = fr ? eIn(seg(p, 0, .5)) : eOut(seg(p, .5, 1));
      const sx = fr ? Math.cos(k * Math.PI / 2) : Math.sin(k * Math.PI / 2), sy = 1 - .08 * Math.sin(p * Math.PI);
      c.fillStyle = K; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2); c.scale(Math.max(.001, sx), sy); c.translate(-W / 2, -H / 2); c.drawImage(fr ? A : B, 0, 0);
      c.fillStyle = `rgba(0,0,0,${.45 * (1 - sx)})`; c.fillRect(0, 0, W, H); c.restore();
    },
    /* TV desligando: A achata numa linha de luz, vira um ponto e apaga; B entra no escuro. */
    tvoff(c, A, B, p, o = {}) {
      const W = A.width, H = A.height;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      if (p >= .5) { c.drawImage(B, 0, 0); return; }
      const q = seg(p, 0, .5), sy = Math.max(.003, 1 - eIn(seg(q, 0, .55))), sx = Math.max(.002, 1 - eIn(seg(q, .55, 1)));
      c.save(); c.translate(W / 2, H / 2); c.scale(sx, sy); c.translate(-W / 2, -H / 2); c.drawImage(A, 0, 0);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${seg(q, .25, .6)})`; c.fillRect(0, 0, W, H); c.restore();
      const gl = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 260 * sx + 40); gl.addColorStop(0, `rgba(255,250,220,${.9 * seg(q, .4, .7)})`); gl.addColorStop(1, 'rgba(255,250,220,0)');
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
    },
    /* Corte seco com soco de câmera: B entra 8% maior e assenta (corte na batida, como nos vídeos de app). */
    punch(c, A, B, p, o = {}) {
      const W = A.width, H = A.height;
      if (p < .5) { c.drawImage(A, 0, 0); return; }
      const q = seg(p, .5, 1), s = 1 + .08 * (1 - eOut(q));
      c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(B, 0, 0); c.restore();
      c.fillStyle = `rgba(255,255,255,${.3 * (1 - q)})`; c.fillRect(0, 0, W, H);
    },
    /* Encolhe em card: a cena A vira um card com cantos e sombra e voa para cima, revelando B. */
    encolhe(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, k = eInOut(seg(p, 0, .55)), f = eIn(seg(p, .45, 1)), s = lerp(1, .62, k), r = lerp(0, 70, k), bs = lerp(1.06, 1, eOut(seg(p, .3, 1)));
      c.save(); c.translate(W / 2, H / 2); c.scale(bs, bs); c.translate(-W / 2, -H / 2); c.drawImage(B, 0, 0); c.restore();
      c.save(); c.translate(W / 2, H / 2 - f * H * 1.15); c.rotate(-.12 * f); c.scale(s, s);
      c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 80; c.shadowOffsetY = 40; rrect(c, -W / 2, -H / 2, W, H, r / s); c.fillStyle = '#000'; c.fill(); c.shadowColor = 'transparent';
      c.clip(); c.drawImage(A, -W / 2, -H / 2); c.restore();
    },
    /* Desliza: B empurra A para o lado, com rastro de movimento. */
    desliza(c, A, B, p, o = {}) {
      const W = A.width, e = eExpo(p), dir = o.dir || 1, v = Math.sin(p * Math.PI);
      for (let k = 3; k >= 0; k--) { const off = dir * k * 60 * v; c.globalAlpha = k ? .22 * v : 1; c.drawImage(A, -dir * W * e + off, 0); c.drawImage(B, dir * W * (1 - e) + off, 0); }
      c.globalAlpha = 1;
    },
    /* Painéis do manual: amarelo pela esquerda e vermelho pela direita fecham sobre A e abrem em B. */
    paineis(c, A, B, p, o = {}) {
      const W = A.width, H = A.height, [Y, R] = COR(o), fecha = p < .5, k = fecha ? eExpo(seg(p, 0, .5)) : 1 - eExpo(seg(p, .5, 1));
      c.drawImage(fecha ? A : B, 0, 0);
      c.fillStyle = Y; c.fillRect(lerp(-W / 2, 0, k), 0, W / 2 + 1, H);
      c.fillStyle = R; c.fillRect(lerp(W, W / 2, k), 0, W / 2 + 1, H);
      const s = Math.sin(seg(p, .35, .65) * Math.PI); if (s > 0) selo(c, o, W / 2, H / 2, 170 * eBack(Math.min(1, s * 1.1)), (p - .5) * -1.2);
    }
  };
  T.lista = Object.keys(T);
  const api = { T, clamp, lerp, seg, eIn, eOut, eInOut, eExpo, eBack };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MotionT = api;
})(typeof window !== 'undefined' ? window : globalThis);
