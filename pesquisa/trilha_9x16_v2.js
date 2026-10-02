/* Trilha original do vídeo N1 (composta em código, sem licença de terceiros). Versão vertical 9:16, 70 s.
   120 BPM, Lá maior (A · E · F#m · D): pop alegre de lançamento, na linha do vídeo de referência.
   0–28 s: groove leve e informativo · 28–34 s: virada (braams, riser, silêncio) · 34 s: DROP
   34–64 s: lançamento (4 no chão, metais, hook) · 64–70 s: fecho. Toques e pops suaves de interface
   acompanham a mão que toca na tela. Síntese em DSP puro: determinística, roda no navegador e no Bun. */
(function (root) {
  const B = .5, BAR = 2;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [
    { pad: [57, 61, 64], bass: 33, arp: [69, 73, 76, 81] },  // A
    { pad: [56, 59, 64], bass: 28, arp: [68, 71, 76, 80] },  // E
    { pad: [57, 61, 66], bass: 30, arp: [69, 73, 78, 81] },  // F#m
    { pad: [57, 62, 66], bass: 38, arp: [69, 74, 78, 81] }   // D
  ];
  const HOOK = [ // [tempo no compasso, nota, duração em tempos]
    [[0, 76, .5], [.5, 78, .5], [1, 81, 1], [2, 80, .5], [2.5, 78, .5], [3, 76, 1]],
    [[0, 80, .5], [.5, 78, .5], [1, 76, 1], [2, 71, .5], [2.5, 73, .5], [3, 76, 1]],
    [[0, 78, .5], [.5, 76, .5], [1, 73, 1], [2, 76, .5], [2.5, 78, .5], [3, 81, 1]],
    [[0, 81, .5], [.5, 78, .5], [1, 74, 1], [2, 76, .5], [2.5, 78, .5], [3, 76, 1]]
  ];
  // Linha do tempo compartilhada com o vídeo (tremor, clarão, mão e itens que aparecem)
  const IMPACTOS = [[.05, .6], [2, .35], [28, 1], [30, .8], [34, 1.4], [51, .45], [52, .45], [53, .45], [54, .45], [55, .45], [56.4, .5], [57.2, .5], [58, .5], [58.8, .5], [64, 1.1]];
  const WHOOSH = [[4, .12], [10, .12], [16, .1], [22, .12], [36, .16], [42, .14], [46, .14], [50, .14], [56, .14], [60, .14], [16.3, .06], [18.3, .06], [20.3, .06]];
  const TAPS = [17, 19, 21, 38.5, 40.5, 43, 43.7, 44.4, 45.3, 47, 47.8, 49.3];
  const POPS = [0, 1, 2, 3, 4, 5].map(k => 36.3 + k * .12).concat([0, 1, 2, 3, 4, 5].map(k => 38.7 + k * .1), [48.3, 48.45, 48.6]);

  function renderPCM(END = 70, SR = 48000) {
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
    function tap(t) { // toque de dedo na tela: clique curto e macio
      nz(t, { type: 'bandpass', f: 3200, q: 1.2, d: .014, v: .16, bus: FX });
      const o = sine(); play(t, .05, tt => o(ex(1500, 700, tt, .03)) * .05 * Math.exp(-tt / .012), { bus: FX });
      const lo = sine(); play(t, .06, tt => lo(150) * .1 * Math.exp(-tt / .018), { bus: FX });
    }
    function popS(t, k = 0) { // item que aparece: bolha suave
      const o = sine(), f0 = 520 + (k % 4) * 60; play(t, .09, tt => o(ex(f0, f0 * .6, tt, .06)) * .055 * (tt < .004 ? tt / .004 : Math.exp(-tt / .025)), { bus: FX, pan: ((k % 3) - 1) * .3, rv: .15 });
    }
    function roll(t0, t1, i0, i1, v0, v1) { for (let t = t0; t < t1 - .01;) { const q = (t - t0) / (t1 - t0); snare(t, v0 + (v1 - v0) * q); t += i0 * Math.pow(i1 / i0, q); } }

    /* ---------- arranjo ---------- */
    const at = (bar, beat = 0) => bar * BAR + beat * B;
    // 0–4 s: abertura (selo) com brilho e palmas leves
    pad(0, CH[0].pad, 2, .05, 1400); pad(2, CH[1].pad, 2, .05, 1600);
    [64, 69, 73, 76, 81, 85, 88].forEach((m, i) => pluck(.1 + i * B / 4, m, .05 + i * .006, 3000, i % 2 ? .5 : -.5, .3));
    for (let bar = 0; bar <= 1; bar++) { const t = at(bar), c = CH[bar]; kick(t, .7, .8); clap(t + B, .32); clap(t + 3 * B, .32); bass808(t, c.bass, B * 1.6, .32); for (let i = 0; i < 16; i++) pluck(t + i * B / 4, c.arp[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]] + 12, .04, 2200, i % 2 ? .7 : -.7, .16); }
    // 4–22 s: groove informativo
    for (let bar = 2; bar <= 10; bar++) {
      const t = at(bar), c = CH[bar % 4], full = bar >= 5;
      pad(t, c.pad, BAR, .055, full ? 2600 : 2000);
      [[0, 1], [1.5, .5], [2.5, 1]].forEach(([b, d]) => bass808(t + b * B, c.bass, d * B, .38));
      [0, 1.75, 2].forEach(b => kick(t + b * B, .82, .7));
      clap(t + B, .42); clap(t + 3 * B, .42);
      for (let i = 0; i < 8; i++) hat(t + i * B / 2 + (i % 2 ? .02 : 0), i % 2 ? .07 : .12, false, i % 2 ? .25 : -.1);
      if (full) { hat(t + 1.5 * B, .06, true); hat(t + 3.5 * B, .06, true); for (let i = 0; i < 16; i++) nz(t + i * B / 4, { type: 'bandpass', f: 7000, q: 1.5, d: .04, v: i % 4 === 2 ? .035 : .018, pan: -.3 }); }
      for (let i = 0; i < 16; i++) pluck(t + i * B / 4, c.arp[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]] + 12, .04, 2200, i % 2 ? .7 : -.7, .16);
      HOOK[bar % 4].forEach(([b, m, d]) => pluck(t + b * B, m, .24, full ? 3800 : 3000, 0, Math.max(.3, d * B)));
    }
    // 22–28 s: o custo disso (respira e tensiona)
    [[11, 30, [57, 61, 66]], [12, 38, [57, 62, 66]], [13, 28, [56, 59, 64]]].forEach(([bar, bm, pn]) => { const t = at(bar); pad(t, pn, BAR, .065, 1100); bass808(t, bm, BAR * .9, .42); kick(t, .75, .8); kick(t + 2 * B, .55, .85); hat(t + B, .05); hat(t + 3 * B, .05); clap(t + 3 * B, .25); });
    drone(22, 28, [33], .03, 160, 300);
    riser(25.5, 28, .22); reverseCrash(27, 28, .3);
    // 28–34 s: "E agora… apresentamos a vocês…" e o DROP em 34
    impact(28, 1); drone(28, 33.5, [33, 40], .08, 180, 750);
    kick(29, .5, 1); kick(29.25, .35, 1);
    impact(30, .8);
    for (let t = 30.5; t < 32; t += B) kick(t, .5 + (t - 30.5) * .1, 1);
    for (let t = 32; t < 33.5; t += B / 2) kick(t, .65 + (t - 32) * .1, 1);
    roll(30.5, 33.5, .25, .035, .06, .32);
    riser(30, 33.5, .34);
    reverseCrash(33.45, 34, .45);
    impact(34, 1.4);
    // 34–64 s: lançamento
    for (let bar = 17; bar <= 31; bar++) {
      const t = at(bar), c = CH[(bar - 17) % 4], sec = bar >= 25 && bar <= 27 ? 'ad' : 'full', lastBar = bar === 31;
      for (let b = 0; b < 4; b++) { kick(t + b * B, .95, .38); hat(t + (b + .5) * B, .085, true, .2); bassMid(t + (b + .5) * B, c.bass + 12, B * .45, .3); }
      clap(t + B, .55); clap(t + 3 * B, .55);
      for (let i = 0; i < 16; i++) hat(t + i * B / 4, [.1, .035, .065, .035][i % 4], false, i % 2 ? .3 : -.2);
      if (bar % 4 === 0) for (let i = 0; i < 6; i++) hat(t + 3.25 * B + i * B / 12, .04 + i * .008);
      bass808(t, c.bass, B * .9, .38);
      pad(t, c.pad, BAR, .05, 3400);
      if (sec === 'ad') stab(t, c.pad.map(m => m + 12), .085);
      else [0, 1.5, 3].forEach(b => stab(t + b * B, c.pad.map(m => m + 12), .07));
      if (sec !== 'ad') HOOK[(bar - 17) % 4].forEach(([b, m, d]) => { if (lastBar && b >= 2) return; lead(t + b * B, m, d * B * .9, .13); pluck(t + b * B, m + 12, .055, 4000, .3, .25); });
      if (lastBar) { riser(62, 64, .28); roll(63, 64, .125, .04, .08, .3); reverseCrash(63.4, 64, .35); }
    }
    // 64–70 s: fecho
    stab(64, [57, 61, 64, 69, 73, 76], .065, 1.6); pad(64, [57, 61, 64, 69], 4.4, .07, 2400); bass808(64, 33, 3, .45);
    [[64.5, 81], [65, 85], [65.5, 88], [66, 93]].forEach(([t, m], i) => pluck(t, m, .06 - i * .006, 3200, i % 2 ? .4 : -.4, .7));
    // transições, revelações e interface
    WHOOSH.forEach(([t, v]) => whoosh(t, v));
    IMPACTOS.forEach(([t, k]) => { if (![28, 30, 34].includes(t)) { if (t > 56 && t < 60) whoosh(t - .05, .1); impact(t, k); } });
    TAPS.forEach(tap); POPS.forEach((t, k) => popS(t, k));

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
      const iS0 = Math.round(33.45 * SR), iS1 = Math.round(33.55 * SR), iS2 = Math.round(33.98 * SR);
      for (let i = 0; i < N; i++) {
        const x = (RV[0][i] + RV[1][i]) * .015; let l = 0, r = 0;
        for (let j = 0; j < 8; j++) { l += comb(cL[j], x); r += comb(cR[j], x); }
        for (let j = 0; j < 4; j++) { l = ap(aL[j], l); r = ap(aR[j], r); }
        const ret = i < iS0 || i >= iS2 ? .5 : i < iS1 ? .5 * (1 - (i - iS0) / (iS1 - iS0)) : 0;
        L[i] += l * ret; R[i] += r * ret;
      }
    }
    // dinâmica por seção: 1ª metade contida, lançamento mais forte
    const SEC = [[0, .82], [22, .78], [28, .9], [34, 1.18], [64, 1.05]];
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
  async function render(END = 70, SR = 48000) {
    const p = renderPCM(END, SR);
    const buf = new AudioBuffer({ length: p.length, sampleRate: SR, numberOfChannels: 2 });
    buf.copyToChannel(p.L, 0); buf.copyToChannel(p.R, 1); buf.peakAntes = p.peakAntes; return buf;
  }
  const api = { render, renderPCM, IMPACTOS, WHOOSH, TAPS, POPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.N1Trilha = api;
})(typeof window !== 'undefined' ? window : globalThis);
