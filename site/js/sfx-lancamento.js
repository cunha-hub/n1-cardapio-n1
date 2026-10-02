/* Efeitos sonoros do vídeo N1 (sintetizados em código, sem licença de terceiros).
   Só efeitos: impactos, whooshes de transição, risers, pops e toques de interface. A música vem do arquivo do Suno.
   render(END, ev): ev = { impacts:[[t,k]], whooshes:[[t,v]], pops:[t], taps:[t], risers:[[t0,t1,v]], crashes:[[t0,t1,v]] }
   Tudo determinístico (mesmo áudio sempre), roda no navegador e no Bun. */
(function (root) {
  function renderPCM(END, ev, SR = 48000) {
    const N = Math.ceil((END + .5) * SR), PI2 = Math.PI * 2;
    const bus = () => [new Float32Array(N), new Float32Array(N)];
    const FX = bus(), RV = bus();
    let seed = 20261001 >>> 0;
    const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
    const ex = (a, b, t, T) => t <= 0 ? a : t >= T ? b : a * Math.pow(b / a, t / T);
    const sat = k => { const n = Math.tanh(k); return x => Math.tanh(k * x) / n; };
    const noise = () => rnd() * 2 - 1;
    const blep = (t, dt) => t < dt ? (t /= dt, t + t - t * t - 1) : t > 1 - dt ? (t = (t - 1) / dt, t * t + t + t + 1) : 0;
    function saw(cents = 0) { let ph = rnd(); const k = Math.pow(2, cents / 1200); return f => { const dt = f * k / SR; ph += dt; if (ph >= 1) ph -= 1; return 2 * ph - 1 - blep(ph, dt); }; }
    function sine() { let ph = 0; return f => { ph += f / SR; if (ph >= 1) ph -= 1; return Math.sin(PI2 * ph); }; }
    function svf(mode) { // 0 passa-baixa, 1 passa-banda, 2 passa-alta
      let ic1 = 0, ic2 = 0, k = 1, a1 = 0, a2 = 0, a3 = 0, c = 0;
      return (x, fc, q) => {
        if ((c++ & 15) === 0) { const g = Math.tan(Math.PI * Math.min(fc, SR * .45) / SR); k = 1 / q; a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
        const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
        return mode === 0 ? v2 : mode === 1 ? k * v1 : x - k * v1 - v2;
      };
    }
    function play(t0, len, gen, o = {}) {
      const is = Math.round(t0 * SR), i0 = Math.max(0, is), i1 = Math.min(N, Math.round((t0 + len) * SR)), rv = o.rv || 0, pf = o.panF;
      let a = ((o.pan || 0) + 1) * Math.PI / 4, gl = Math.cos(a) * Math.SQRT2, gr = Math.sin(a) * Math.SQRT2; const fade = Math.round(.004 * SR);
      for (let i = i0; i < i1; i++) {
        const t = (i - is) / SR; let v = gen(t); if (i1 - i < fade) v *= (i1 - i) / fade;
        if (pf) { a = (pf(t) + 1) * Math.PI / 4; gl = Math.cos(a) * Math.SQRT2; gr = Math.sin(a) * Math.SQRT2; }
        const l = v * gl, r = v * gr; FX[0][i] += l; FX[1][i] += r; if (rv) { RV[0][i] += l * rv; RV[1][i] += r * rv; }
      }
    }
    const MODE = { lowpass: 0, bandpass: 1, highpass: 2 };
    function nz(t, o) {
      const a = o.a || .001, tau = o.d / 7, f = svf(MODE[o.type || 'bandpass']), fc = o.f || 1000, q = o.q || .7, v = o.v;
      play(t, a + o.d, tt => f(noise(), fc, q) * v * (tt < a ? tt / a : Math.exp(-(tt - a) / tau)), { pan: o.pan, rv: o.verb });
    }
    const satSub = sat(1.6), satBraam = sat(3);
    function impact(t, k) {
      const s = sine(), tau = (1.2 + .6 * k) / 9, A = .9 * Math.min(k, 1.2);
      play(t, 1.3 + .6 * k, tt => satSub(s(ex(78, 31, tt, 1.4)) * (tt < .005 ? tt / .005 : Math.exp(-(tt - .005) / tau)) * A));
      nz(t, { type: 'lowpass', f: 260, q: .8, d: .55, v: .7 * k });
      nz(t, { type: 'bandpass', f: 2200, q: .9, d: .09, v: .42 * k, verb: .4 });
      nz(t, { type: 'highpass', f: 5500, q: .5, d: .3 + 1.5 * Math.min(1, k), v: .15 * k, verb: .5, a: .002 });
      if (k >= .8) { // braam de cinema
        const os = []; [33, 40, 45, 52].forEach(m => [-10, 10].forEach(d => os.push([saw(d), 440 * Math.pow(2, (m - 69) / 12)]))); const f = svf(0);
        play(t, 3, tt => { let x = 0; for (const [o, fr] of os) x += o(fr); return satBraam(f(x, tt < .18 ? ex(160, 1700, tt, .18) : ex(1700, 300, tt - .18, 2.42), 2) * .085 * k * (tt < .03 ? tt / .03 : Math.exp(-(tt - .03) / .33))); }, { rv: .5 });
      }
    }
    function whoosh(tc, v = .12) {
      const f = svf(1);
      play(tc - .45, .85, tt => f(noise(), tt < .45 ? ex(250, 3200, tt, .45) : ex(3200, 500, tt - .45, .4), 1.2) * v * (tt < .45 ? tt / .45 : 1 - (tt - .45) / .4), { rv: .3, panF: tt => -.8 + 1.6 * tt / .85 });
    }
    function riser(t0, t1, v = .3) {
      const len = t1 - t0, f = svf(1), o = saw(), f2 = svf(0);
      play(t0, len, tt => { const q = tt / len; return f(noise(), ex(400, 9000, tt, len), 2.2) * v * q + f2(o(ex(110, 880, tt, len)), ex(600, 5000, tt, len), 3) * v * .2 * q; }, { rv: .3 });
    }
    function crash(t0, t1, v = .35) { const len = t1 - t0, f = svf(2); play(t0, len, tt => f(noise(), 3500, .7) * v * Math.pow(.0001, 1 - tt / len)); }
    function fall(t0, t1, v = .3) { // queda: ruído que fecha e um tom grave que desce (a música "desliga")
      const len = t1 - t0, f = svf(1), s = sine(), o = saw(), f2 = svf(0);
      play(t0, len + .3, tt => { const q = Math.min(1, tt / len), env = (tt < .02 ? tt / .02 : 1) * Math.exp(-Math.max(0, tt - len * .6) / (len * .35));
        return (f(noise(), ex(7000, 180, tt, len), 1.6) * v * .9 + s(ex(520, 38, tt, len)) * v * 1.2 + f2(o(ex(260, 45, tt, len)), ex(2500, 120, tt, len), 2) * v * .25) * env; }, { rv: .35, panF: tt => .6 - 1.2 * Math.min(1, tt / len) });
    }
    function pulse(t, v = .5) { // batida grave de suspense
      const s = sine(); play(t, .4, tt => s(ex(95, 40, tt, .18)) * v * (tt < .004 ? tt / .004 : Math.exp(-tt / .1)), { rv: .1 });
      nz(t, { type: 'lowpass', f: 400, q: .7, d: .12, v: v * .5 });
    }
    function tap(t) {
      nz(t, { type: 'bandpass', f: 3200, q: 1.2, d: .014, v: .16 });
      const o = sine(); play(t, .05, tt => o(ex(1500, 700, tt, .03)) * .05 * Math.exp(-tt / .012));
      const lo = sine(); play(t, .06, tt => lo(150) * .1 * Math.exp(-tt / .018));
    }
    let pk = 0;
    function pop(t) { const o = sine(), f0 = 520 + (pk++ % 4) * 60; play(t, .09, tt => o(ex(f0, f0 * .6, tt, .06)) * .07 * (tt < .004 ? tt / .004 : Math.exp(-tt / .025)), { pan: ((pk % 3) - 1) * .3, rv: .15 }); }

    (ev.crashes || []).forEach(([a, b, v]) => crash(a, b, v));
    (ev.risers || []).forEach(([a, b, v]) => riser(a, b, v));
    (ev.whooshes || []).forEach(([t, v]) => whoosh(t, v));
    (ev.impacts || []).forEach(([t, k]) => impact(t, k));
    (ev.falls || []).forEach(([a, b, v]) => fall(a, b, v));
    (ev.pulses || []).forEach(([t, v]) => pulse(t, v));
    (ev.taps || []).forEach(tap);
    (ev.pops || []).forEach(pop);

    /* reverb (Freeverb) só para os efeitos */
    const L = new Float32Array(N), R = new Float32Array(N);
    { const sc = SR / 44100, CB = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(x => Math.round(x * sc)), AP = [556, 441, 341, 225].map(x => Math.round(x * sc)), SP = Math.round(23 * sc);
      const mk = lens => lens.map(n => ({ b: new Float32Array(n), i: 0, s: 0 }));
      const cL = mk(CB), cR = mk(CB.map(n => n + SP)), aL = mk(AP), aR = mk(AP.map(n => n + SP)), fbk = .84, damp = .28;
      const comb = (c, x) => { const y = c.b[c.i]; c.s = y * (1 - damp) + c.s * damp; c.b[c.i] = x + c.s * fbk; if (++c.i >= c.b.length) c.i = 0; return y; };
      const ap = (c, x) => { const y = c.b[c.i]; c.b[c.i] = x + y * .5; if (++c.i >= c.b.length) c.i = 0; return y - x; };
      for (let i = 0; i < N; i++) {
        const x = (RV[0][i] + RV[1][i]) * .015; let l = 0, r = 0;
        for (let j = 0; j < 8; j++) { l += comb(cL[j], x); r += comb(cR[j], x); }
        for (let j = 0; j < 4; j++) { l = ap(aL[j], l); r = ap(aR[j], r); }
        L[i] = FX[0][i] + l * .5; R[i] = FX[1][i] + r * .5;
      }
    }
    return { L, R, sampleRate: SR, length: N };
  }
  async function render(END, ev, SR = 48000) {
    const p = renderPCM(END, ev, SR), buf = new AudioBuffer({ length: p.length, sampleRate: SR, numberOfChannels: 2 });
    buf.copyToChannel(p.L, 0); buf.copyToChannel(p.R, 1); return buf;
  }
  const api = { render, renderPCM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.N1Sfx = api;
})(typeof window !== 'undefined' ? window : globalThis);
