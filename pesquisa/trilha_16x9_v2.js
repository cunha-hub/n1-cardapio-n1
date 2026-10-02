/* Trilha original do vídeo N1 (composta em código, sem licença de terceiros).
   120 BPM, Lá menor (Am · F · Dm · E). 1 tempo = 0,5 s, 1 compasso = 2 s.
   1ª metade (0–40 s): groove criativo em meio-tempo, informativo.
   Virada (40–46 s): braams, riser, rufo, um respiro de silêncio e o DROP em 46 s.
   2ª metade (46–90 s): batida de lançamento (4 no chão), metais, hook e impactos nas revelações.
   Síntese em DSP puro (osciladores com polyBLEP, filtro SVF, reverb Freeverb, delay ping-pong,
   sidechain, compressor e limitador): determinística, roda no navegador e no Bun. */
(function (root) {
  const B = .5, BAR = 2;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [
    { pad: [57, 60, 64], bass: 33, arp: [69, 72, 76, 81] },  // Am
    { pad: [57, 60, 65], bass: 29, arp: [69, 72, 77, 81] },  // F
    { pad: [57, 62, 65], bass: 38, arp: [69, 74, 77, 81] },  // Dm
    { pad: [56, 59, 64], bass: 28, arp: [68, 71, 76, 80] }   // E
  ];
  const HOOK = [ // [tempo no compasso, nota, duração em tempos]
    [[0, 76, 1], [1, 81, .5], [1.5, 79, .5], [2, 76, 1], [3, 72, .5], [3.5, 74, .5]],
    [[0, 72, 1], [1, 77, .5], [1.5, 76, .5], [2, 72, 1], [3, 69, .5], [3.5, 72, .5]],
    [[0, 74, 1], [1, 77, .5], [1.5, 81, .5], [2, 79, .5], [2.5, 77, .5], [3, 76, .5], [3.5, 74, .5]],
    [[0, 76, 1], [1, 80, 1], [2, 83, 1], [3, 80, .5], [3.5, 76, .5]]
  ];
  // Impactos: o vídeo usa a mesma lista para tremer e piscar a tela no mesmo instante.
  const IMPACTOS = [[2, .6], [40, 1], [42, .8], [46, 1.4], [59, .45], [60.5, .45], [62, .45], [63.5, .45], [65, .45], [69.5, .55], [72, .55], [74.5, .55], [77, .55], [86, 1.1]];
  const WHOOSH = [[6, .1], [14, .1], [22, .1], [34, .1], [48, .16], [58, .16], [68, .16], [80, .16]];

  function renderPCM(END = 90, SR = 48000) {
    const N = Math.ceil((END + .5) * SR), PI2 = Math.PI * 2;
    const bus = () => [new Float32Array(N), new Float32Array(N)];
    const DR = bus(), MU = bus(), FX = bus(), RV = bus(), DL = bus();
    let seed = 20261001 >>> 0;
    const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
    const ex = (a, b, t, T) => t <= 0 ? a : t >= T ? b : a * Math.pow(b / a, t / T);
    const sat = k => { const n = Math.tanh(k); return x => Math.tanh(k * x) / n; };

    /* osciladores */
    const blep = (t, dt) => t < dt ? (t /= dt, t + t - t * t - 1) : t > 1 - dt ? (t = (t - 1) / dt, t * t + t + t + 1) : 0;
    function saw(cents = 0) { let ph = rnd(); const k = Math.pow(2, cents / 1200); return f => { const dt = f * k / SR; ph += dt; if (ph >= 1) ph -= 1; return 2 * ph - 1 - blep(ph, dt); }; }
    function sqr(cents = 0) { let ph = rnd(); const k = Math.pow(2, cents / 1200); return f => { const dt = f * k / SR; ph += dt; if (ph >= 1) ph -= 1; let v = ph < .5 ? 1 : -1; v += blep(ph, dt); v -= blep((ph + .5) % 1, dt); return v; }; }
    function sine() { let ph = 0; return f => { ph += f / SR; if (ph >= 1) ph -= 1; return Math.sin(PI2 * ph); }; }
    function tri() { let ph = rnd(); return f => { ph += f / SR; if (ph >= 1) ph -= 1; return 4 * Math.abs(ph - .5) - 1; }; }
    /* filtro de estado variável (TPT); modo 0 passa-baixa, 1 passa-banda, 2 passa-alta */
    function svf(mode) {
      let ic1 = 0, ic2 = 0, k = 1, a1 = 0, a2 = 0, a3 = 0, c = 0;
      return (x, fc, q) => {
        if ((c++ & 15) === 0) { const g = Math.tan(Math.PI * Math.min(fc, SR * .45) / SR); k = 1 / q; a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
        const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
        return mode === 0 ? v2 : mode === 1 ? k * v1 : x - k * v1 - v2;
      };
    }
    const noise = () => rnd() * 2 - 1;

    /* toca uma voz: gen(t) devolve a amostra; vai para o bus com pan e envios de reverb/delay */
    function play(t0, len, gen, o = {}) {
      const is = Math.round(t0 * SR), i0 = Math.max(0, is), i1 = Math.min(N, Math.round((t0 + len) * SR));
      const b = o.bus || DR, bL = b[0], bR = b[1], rv = o.rv || 0, dl = o.dl || 0, pf = o.panF;
      let a = ((o.pan || 0) + 1) * Math.PI / 4, gl = Math.cos(a) * Math.SQRT2, gr = Math.sin(a) * Math.SQRT2;
      const fade = Math.round(.004 * SR);
      for (let i = i0; i < i1; i++) {
        const t = (i - is) / SR; let v = gen(t); if (i1 - i < fade) v *= (i1 - i) / fade;
        if (pf) { a = (pf(t) + 1) * Math.PI / 4; gl = Math.cos(a) * Math.SQRT2; gr = Math.sin(a) * Math.SQRT2; }
        const l = v * gl, r = v * gr; bL[i] += l; bR[i] += r;
        if (rv) { RV[0][i] += l * rv; RV[1][i] += r * rv; }
        if (dl) { DL[0][i] += l * dl; DL[1][i] += r * dl; }
      }
    }
    const MODE = { lowpass: 0, bandpass: 1, highpass: 2 };
    function nz(t, o) {
      const a = o.a || .001, tau = o.d / 7, f = svf(MODE[o.type || 'bandpass']), fc = o.f || 1000, q = o.q || .7, v = o.v;
      play(t, a + o.d, tt => f(noise(), fc, q) * v * (tt < a ? tt / a : Math.exp(-(tt - a) / tau)), { bus: o.bus || DR, pan: o.pan, rv: o.verb });
    }

    /* ---------- instrumentos ---------- */
    const kicks = [];
    const satK = sat(1.4), sat808 = sat(2.2), satSub = sat(1.6), satBraam = sat(3), satDrone = sat(1.8);
    function kick(t, v = .9, depth = .5) {
      const s = sine(); let px = 0;
      play(t, .5, tt => { const f = tt < .08 ? ex(160, 50, tt, .08) : ex(50, 42, tt - .08, .32); const amp = tt < .003 ? tt / .003 : Math.exp(-(tt - .003) / .16); return satK(s(f) * amp) * v; });
      play(t, .016, tt => { const x = noise(), h = x - px; px = x; return h * .16 * v * Math.exp(-tt / .004); });
      if (depth < 1) kicks.push([t, depth]);
    }
    function clap(t, v = .5) { v *= 1.25;
      [0, .011, .023].forEach(d => nz(t + d, { type: 'bandpass', f: 1450, q: 1.1, d: .018, v: v * .8 }));
      nz(t + .03, { type: 'bandpass', f: 1250, q: .9, d: .17, v: v * .65, verb: .28 });
    }
    function snare(t, v = .3) {
      nz(t, { type: 'bandpass', f: 1900, q: .8, d: .13, v, verb: .15 });
      const o = tri(); play(t, .13, tt => o(ex(200, 150, tt, .1)) * v * .7 * Math.exp(-tt / .03));
    }
    const hat = (t, v = .1, open = false, pan = .15) => nz(t, { type: 'highpass', f: open ? 6500 : 8000, q: .6, d: open ? .2 : .032, v: v * (open ? 1.8 : 1.6), pan });
    function bass808(t, m, dur, v = .5) {
      const s = sine(), o2 = tri(), f0 = mtof(m); let lp = 0; const c = 1 - Math.exp(-PI2 * 700 / SR);
      play(t, dur + .3, tt => {
        const f = tt < .05 ? ex(mtof(m + 7), f0, tt, .05) : f0;
        let amp = tt < .006 ? tt / .006 : .75 + .25 * Math.exp(-(tt - .006) / .3); if (tt > dur) amp *= Math.exp(-(tt - dur) / .05);
        lp += c * (o2(f * 2) - lp);
        return (sat808(s(f)) + lp * .28) * amp * v;
      }, { bus: MU });
    }
    function bassMid(t, m, dur, v = .3) {
      const o = saw(), f = svf(0), fr = mtof(m);
      play(t, dur + .15, tt => { let amp = tt < .004 ? tt / .004 : 1; if (tt > dur * .8) amp *= Math.exp(-(tt - dur * .8) / .03); return f(o(fr), ex(1100, 320, tt, dur), 2) * amp * v; }, { bus: MU });
    }
    function pad(t, notes, dur, v = .06, cut = 1600) {
      [-1, 1].forEach(side => {
        const os = notes.map(m => [saw(side * 9), mtof(m)]), f = svf(0);
        play(t, dur + .55, tt => {
          let x = 0; for (let j = 0; j < os.length; j++) x += os[j][0](os[j][1]);
          const amp = tt < .35 ? tt / .35 : tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / .5);
          return f(x, cut, .6) * amp * v;
        }, { bus: MU, pan: side * .75, rv: .4 });
      });
    }
    function pluck(t, m, v = .12, cut = 2000, pan = 0, dur = .32) {
      const o1 = saw(), o2 = sqr(7), f = svf(0), fr = mtof(m), lo = Math.max(250, cut * .35), tau = dur / 9;
      play(t, dur, tt => f(o1(fr) + .45 * o2(fr), ex(cut * 3, lo, tt, .2), 1.5) * v * (tt < .004 ? tt / .004 : Math.exp(-(tt - .004) / tau)), { bus: MU, pan, dl: .35, rv: .2 });
    }
    function lead(t, m, dur, v = .09) {
      const a = saw(-10), b = saw(10), sub = tri(), f = svf(0), fr = mtof(m);
      play(t, dur + .14, tt => {
        const vib = Math.pow(2, Math.min(1, tt / .3) * 7 * Math.sin(PI2 * 5.5 * tt) / 1200), ff = fr * vib;
        const fc = tt < .03 ? 1800 + 2400 * tt / .03 : ex(4200, 2600, tt - .03, .22);
        const amp = tt < .008 ? tt / .008 : tt < dur ? .85 + .15 * Math.exp(-(tt - .008) / .1) : Math.max(0, .85 * (1 - (tt - dur) / .12));
        return f(a(ff) + b(ff) + .5 * sub(ff / 2), fc, 1.2) * amp * v;
      }, { bus: MU, dl: .25, rv: .22 });
    }
    function stab(t, notes, v = .05, dur = .28) {
      notes.forEach((m, i) => {
        const a = saw(-12), b = saw(12), f = svf(0), fr = mtof(m), tau = (dur + .12) / 9;
        play(t, dur + .15, tt => f(a(fr) + b(fr), tt < .015 ? ex(500, 5200, tt, .015) : ex(5200, 900, tt - .015, dur), 2) * v * (tt < .005 ? tt / .005 : Math.exp(-(tt - .005) / tau)),
          { bus: MU, pan: (i - (notes.length - 1) / 2) * .45, rv: .3 });
      });
    }
    function drone(t0, t1, notes, v, c0, c1) {
      const os = []; notes.forEach(m => [-8, 8].forEach(d => os.push([saw(d), mtof(m)]))); const f = svf(0), len = t1 - t0;
      play(t0, len, tt => { let x = 0; for (const [o, fr] of os) x += o(fr); return satDrone(f(x, c0 + (c1 - c0) * tt / len + 60 * Math.sin(PI2 * .35 * tt), 1.5) * (tt < .4 ? tt / .4 : 1) * v); }, { bus: FX, rv: .3 });
    }
    function riser(t0, t1, v = .3) {
      const len = t1 - t0, f = svf(1), o = saw(), f2 = svf(0);
      play(t0, len, tt => { const q = tt / len; return f(noise(), ex(400, 9000, tt, len), 2.2) * v * q + f2(o(ex(110, 880, tt, len)), ex(600, 5000, tt, len), 3) * v * .2 * q; }, { bus: FX, rv: .3 });
    }
    function reverseCrash(t0, t1, v = .35) {
      const len = t1 - t0, f = svf(2);
      play(t0, len, tt => f(noise(), 3500, .7) * v * Math.pow(.0001, 1 - tt / len), { bus: FX });
    }
    function whoosh(tc, v = .12) {
      const f = svf(1);
      play(tc - .45, .85, tt => f(noise(), tt < .45 ? ex(250, 3200, tt, .45) : ex(3200, 500, tt - .45, .4), 1.2) * v * (tt < .45 ? tt / .45 : 1 - (tt - .45) / .4),
        { bus: FX, rv: .3, panF: tt => -.8 + 1.6 * tt / .85 });
    }
    function impact(t, k) {
      const s = sine(), tau = (1.2 + .6 * k) / 9, A = .9 * Math.min(k, 1.2);
      play(t, 1.3 + .6 * k, tt => satSub(s(ex(78, 31, tt, 1.4)) * (tt < .005 ? tt / .005 : Math.exp(-(tt - .005) / tau)) * A), { bus: FX });
      nz(t, { type: 'lowpass', f: 260, q: .8, d: .55, v: .7 * k, bus: FX });
      nz(t, { type: 'bandpass', f: 2200, q: .9, d: .09, v: .42 * k, bus: FX, verb: .4 });
      nz(t, { type: 'highpass', f: 5500, q: .5, d: .3 + 1.5 * Math.min(1, k), v: .15 * k, bus: FX, verb: .5, a: .002 });
      if (k >= .8) { // braam de cinema
        const os = []; [33, 40, 45, 52].forEach(m => [-10, 10].forEach(d => os.push([saw(d), mtof(m)]))); const f = svf(0);
        play(t, 3, tt => { let x = 0; for (const [o, fr] of os) x += o(fr); return satBraam(f(x, tt < .18 ? ex(160, 1700, tt, .18) : ex(1700, 300, tt - .18, 2.42), 2) * .085 * k * (tt < .03 ? tt / .03 : Math.exp(-(tt - .03) / .33))); }, { bus: FX, rv: .5 });
      }
    }
    function roll(t0, t1, i0, i1, v0, v1) { for (let t = t0; t < t1 - .01;) { const q = (t - t0) / (t1 - t0); snare(t, v0 + (v1 - v0) * q); t += i0 * Math.pow(i1 / i0, q); } }

    /* ---------- arranjo ---------- */
    const at = (bar, beat = 0) => bar * BAR + beat * B;
    // 0–2 s: entrada (brilho subindo) + impacto do selo em 2 s
    pad(0, [56, 59, 64], 2, .045, 900);
    reverseCrash(.4, 2, .3);
    [64, 68, 71, 76, 80, 83, 88, 92].forEach((m, i) => pluck(1 + i * B / 4, m, .05 + i * .008, 2600, i % 2 ? .4 : -.4, .25));
    // 2–34 s: groove criativo (meio-tempo)
    for (let bar = 1; bar <= 16; bar++) {
      const t = at(bar), c = CH[(bar - 1) % 4], full = bar >= 7;
      pad(t, c.pad, BAR, .06, bar < 3 ? 1200 : full ? 2800 : 2000);
      [[0, 1.2], [1.5, .4], [2.5, 1.2]].forEach(([b, d]) => bass808(t + b * B, c.bass, d * B, .4));
      [0, .75, 2.5].forEach(b => kick(t + b * B, .85, .72));
      if (bar >= 3) { clap(t + 2 * B, .5); snare(t + 3.75 * B, .06); for (let i = 0; i < 8; i++) hat(t + i * B / 2, i % 2 ? .08 : .14, false, i % 2 ? .25 : -.1); hat(t + 3.75 * B, .045); }
      if (full) { hat(t + 1.5 * B, .06, true); hat(t + 3.5 * B, .06, true); for (let i = 0; i < 16; i++) nz(t + i * B / 4, { type: 'bandpass', f: 7000, q: 1.5, d: .04, v: i % 4 === 2 ? .035 : .018, pan: -.3 }); }
      if (bar < 3 || full) for (let i = 0; i < 16; i++) pluck(t + i * B / 4, c.arp[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]] + 12, .05, 2000, i % 2 ? .7 : -.7, .18);
      if (bar >= 3) HOOK[(bar - 1) % 4].forEach(([b, m, d]) => pluck(t + b * B, m, .26, full ? 3800 : 2800, 0, Math.max(.3, d * B)));
      if (bar === 16) { for (let i = 0; i < 8; i++) hat(t + 3 * B + i * B / 8, .03 + i * .01); for (let i = 0; i < 4; i++) snare(t + 3 * B + i * B / 4, .08 + i * .05); }
    }
    // 34–40 s: o custo disso (tensão)
    [[17, 33, [57, 60, 64]], [18, 29, [57, 60, 65]], [19, 28, [56, 59, 64]]].forEach(([bar, bm, pn]) => { const t = at(bar); pad(t, pn, BAR, .07, 700); bass808(t, bm, BAR * .9, .5); kick(t, .8, .8); hat(t + 2 * B, .05); });
    drone(34, 40, [33], .035, 150, 260);
    riser(37, 40, .2); reverseCrash(39, 40, .3);
    // 40–46 s: "E agora… apresentamos a vocês… o novo cardápio da N1"
    impact(40, 1); drone(40, 45.5, [33, 40], .08, 180, 750);
    kick(41, .5, 1); kick(41.25, .35, 1);
    impact(42, .8);
    for (let t = 42.5; t < 44; t += B) kick(t, .5 + (t - 42.5) * .1, 1);
    for (let t = 44; t < 45.5; t += B / 2) kick(t, .65 + (t - 44) * .1, 1);
    roll(42.5, 45.5, .25, .035, .06, .32);
    riser(42, 45.5, .34);
    reverseCrash(45.45, 46, .45);
    impact(46, 1.4);
    // 46–80 s: lançamento
    for (let bar = 23; bar <= 39; bar++) {
      const t = at(bar), c = CH[(bar - 23) % 4], sec = bar < 29 ? 'drop' : bar < 34 ? 'ad' : 'pq', lastBar = bar === 39;
      for (let b = 0; b < 4; b++) { kick(t + b * B, .95, .38); hat(t + (b + .5) * B, .085, true, .2); bassMid(t + (b + .5) * B, c.bass + 12, B * .45, .3); }
      clap(t + B, .55); clap(t + 3 * B, .55);
      for (let i = 0; i < 16; i++) hat(t + i * B / 4, [.1, .035, .065, .035][i % 4], false, i % 2 ? .3 : -.2);
      if (bar % 4 === 2) for (let i = 0; i < 6; i++) hat(t + 3.25 * B + i * B / 12, .04 + i * .008);
      bass808(t, c.bass, B * .9, .38);
      pad(t, c.pad, BAR, .05, 3400);
      if (sec === 'ad') stab(t, c.pad.map(m => m + 12), .085);
      else [0, 1.5, 3].forEach(b => stab(t + b * B, c.pad.map(m => m + 12), .07));
      if (sec !== 'ad') HOOK[(bar - 23) % 4].forEach(([b, m, d]) => { if (lastBar && b >= 2) return; lead(t + b * B, m, d * B * .9, .13); pluck(t + b * B, m + 12, .055, 4000, .3, .25); });
      if (lastBar) { riser(78, 80, .28); roll(79, 80, .125, .04, .08, .3); reverseCrash(79.4, 80, .3); }
    }
    // 80–90 s: resultado e fecho
    [[40, CH[1]], [41, CH[2]]].forEach(([bar, c]) => { const t = at(bar); for (let b = 0; b < 4; b++) kick(t + b * B, .8, .5); for (let i = 0; i < 8; i++) hat(t + i * B / 2, i % 2 ? .08 : .04); clap(t + B, .4); clap(t + 3 * B, .4); bass808(t, c.bass, B * 1.8, .45); bass808(t + 2 * B, c.bass, B * 1.8, .4); pad(t, c.pad, BAR, .06, 1800); stab(t, c.pad.map(m => m + 12), .045); });
    { const t = at(42), c = CH[3]; pad(t, c.pad, BAR, .065, 1600); bass808(t, c.bass, BAR * .95, .45); for (let i = 0; i < 8; i++) kick(t + i * B / 2, .55 + i * .04, 1); roll(84, 86, .25, .04, .06, .3); riser(84, 86, .26); reverseCrash(85.4, 86, .4); }
    impact(86, 1.1);
    stab(86, [57, 60, 64, 69, 72, 76], .06, 1.4); pad(86, [57, 60, 64, 69], 3.4, .07, 2200); bass808(86, 33, 2.6, .5);
    pluck(86.5, 81, .06, 3000, -.4, .6); pluck(87, 84, .05, 3000, .4, .6); pluck(87.5, 88, .045, 3000, 0, .9);
    // transições e revelações
    WHOOSH.forEach(([t, v]) => whoosh(t, v));
    IMPACTOS.forEach(([t, k]) => { if (![40, 42, 46, 86].includes(t)) { if (t > 69) whoosh(t - .05, .1); impact(t, k); } });

    /* ---------- mix ---------- */
    const L = new Float32Array(N), R = new Float32Array(N);
    // delay ping-pong (3/16) com passa-alta no retorno
    { const d = Math.round(.375 * SR), bl = new Float32Array(N), br = new Float32Array(N); let hl = 0, hr = 0, pl = 0, pr = 0; const c = Math.exp(-PI2 * 500 / SR);
      for (let i = 0; i < N; i++) { const wl = i >= d ? bl[i - d] : 0, wr = i >= d ? br[i - d] : 0; bl[i] = (DL[0][i] + DL[1][i]) * .5 + .32 * wr; br[i] = .32 * wl;
        hl = c * (hl + wl - pl); pl = wl; hr = c * (hr + wr - pr); pr = wr; MU[0][i] += hl * .3; MU[1][i] += hr * .3; } }
    // sidechain: a música respira em cada bumbo
    const duck = new Float32Array(N).fill(1);
    kicks.forEach(([t, dp]) => { const i0 = Math.round(t * SR), n = Math.round(.2 * SR); for (let j = 0; j < n && i0 + j < N; j++) { const v = dp + (1 - dp) * j / n; if (v < duck[i0 + j]) duck[i0 + j] = v; } });
    // reverb (Freeverb)
    { const sc = SR / 44100, CB = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(x => Math.round(x * sc)), AP = [556, 441, 341, 225].map(x => Math.round(x * sc)), SP = Math.round(23 * sc);
      const mk = (lens) => lens.map(n => ({ b: new Float32Array(n), i: 0, s: 0 }));
      const cL = mk(CB), cR = mk(CB.map(n => n + SP)), aL = mk(AP), aR = mk(AP.map(n => n + SP)), fbk = .84, damp = .28;
      const comb = (c, x) => { const y = c.b[c.i]; c.s = y * (1 - damp) + c.s * damp; c.b[c.i] = x + c.s * fbk; if (++c.i >= c.b.length) c.i = 0; return y; };
      const ap = (c, x) => { const y = c.b[c.i]; c.b[c.i] = x + y * .5; if (++c.i >= c.b.length) c.i = 0; return y - x; };
      const iS0 = Math.round(45.45 * SR), iS1 = Math.round(45.55 * SR), iS2 = Math.round(45.98 * SR);
      for (let i = 0; i < N; i++) {
        const x = (RV[0][i] + RV[1][i]) * .015; let l = 0, r = 0;
        for (let j = 0; j < 8; j++) { l += comb(cL[j], x); r += comb(cR[j], x); }
        for (let j = 0; j < 4; j++) { l = ap(aL[j], l); r = ap(aR[j], r); }
        const ret = i < iS0 || i >= iS2 ? .5 : i < iS1 ? .5 * (1 - (i - iS0) / (iS1 - iS0)) : 0;
        L[i] += l * ret; R[i] += r * ret;
      }
    }
    // dinâmica por seção: 1ª metade contida, lançamento mais forte
    const SEC = [[0, .8], [6, .82], [34, .78], [40, .9], [46, 1.18], [80, 1], [86, 1.05]];
    const secG = t => { let g = SEC[0][1]; for (let j = 0; j < SEC.length; j++) { const [ts, v] = SEC[j]; if (t >= ts) { const pv = j ? SEC[j - 1][1] : v; g = pv + (v - pv) * Math.min(1, (t - ts) / .06); } } return g; };
    for (let i = 0; i < N; i++) { const sg = secG(i / SR); L[i] = (L[i] + (DR[0][i] + MU[0][i] * duck[i]) * sg + FX[0][i]) * .8; R[i] = (R[i] + (DR[1][i] + MU[1][i] * duck[i]) * sg + FX[1][i]) * .8; }
    // compressor + limitador
    function dyn(thr, ratio, att, rel, knee) {
      const ca = Math.exp(-1 / (att * SR)), cr = Math.exp(-1 / (rel * SR)); let env = 0;
      for (let i = 0; i < N; i++) {
        const x = Math.max(Math.abs(L[i]), Math.abs(R[i])); env = x > env ? ca * env + (1 - ca) * x : cr * env + (1 - cr) * x;
        const over = 20 * Math.log10(env + 1e-9) - thr; let gr = 0;
        if (knee > 0 && over > -knee / 2 && over < knee / 2) gr = (1 / ratio - 1) * Math.pow(over + knee / 2, 2) / (2 * knee); else if (over >= knee / 2) gr = (1 / ratio - 1) * over;
        if (gr < 0) { const g = Math.pow(10, gr / 20); L[i] *= g; R[i] *= g; }
      }
    }
    { const c = 1 - Math.exp(-PI2 * 1000 / SR); let yl = 0, yr = 0; for (let i = 0; i < N; i++) { yl += c * (L[i] - yl); yr += c * (R[i] - yr); L[i] += .4 * (L[i] - yl); R[i] += .4 * (R[i] - yr); } }
    dyn(-12, 2.6, .006, .2, 8); dyn(-2.5, 20, .0008, .06, 0);
    // fade final e normalização
    const f0 = Math.round((END - 2) * SR), f1 = Math.round(END * SR);
    for (let i = f0; i < N; i++) { const g = i >= f1 ? 0 : 1 - (i - f0) / (f1 - f0); L[i] *= g; R[i] *= g; }
    let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const k = peak > 0 ? .94 / peak : 1; for (let i = 0; i < N; i++) { L[i] *= k; R[i] *= k; }
    return { L, R, sampleRate: SR, length: N, peakAntes: peak };
  }
  async function render(END = 90, SR = 48000) {
    const p = renderPCM(END, SR);
    const buf = new AudioBuffer({ length: p.length, sampleRate: SR, numberOfChannels: 2 });
    buf.copyToChannel(p.L, 0); buf.copyToChannel(p.R, 1); buf.peakAntes = p.peakAntes; return buf;
  }
  const api = { render, renderPCM, IMPACTOS, WHOOSH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.N1Trilha = api;
})(typeof window !== 'undefined' ? window : globalThis);
