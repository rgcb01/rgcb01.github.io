// ---------------------------------------------------------------------------
// Lab 03 · Cautín: the bench, the scripted chapters (with a ×4 time warp) and the live practice timeline.
// Model time (tm) drives the joints; video time (t) drives camera, tools and notes.
// ---------------------------------------------------------------------------
const CA_IRON_AX = norm3([-0.22, -0.78, 0.6]), CA_WIRE_AX = norm3([0.3, 0.78, 0.55]), CA_TUBO_AX = norm3([0.35, 0.94, 0]);
const CA_DIP = 0.9, CA_DIPW = 1.1, CA_INSET = { x: 1300, y: 650, R: 205 }, CA_JX = 690, CA_JY = 610;
const CA_CH = [
  { id: 'prep', btn: 'Prepara', dur: 6.2, tip: ['Limpia la punta en la viruta:', 'brillante, el calor pasa mejor.'] },
  { id: 'mal', btn: 'Así no', dur: 7.4, k: 0, tip: ['Gota en la punta: se enfría en el pad', 'y no lo moja. Queda una bolita.'] },
  { id: 'bien', btn: 'Así sí', dur: 8.8, k: 1, tip: ['Calienta pad y pata 1-2 s;', 'la soldadura va a la unión.'] },
  { id: 'mucho', btn: 'Ni de más', dur: 9.6, k: 2, warp: [3.4, 6.35, 4], tip: ['Más de 10 s: el flux se acaba', 'y el pad se puede despegar.'] },
];
const caTip = (J) => add3(J, [0.03, -0.075, 0.035]);            // iron tip touching pad and lead (-y side)
const caWire = (J) => add3(J, [-0.02, 0.085, 0.04]);            // solder wire touching pad and lead (+y side)
const caHoverTip = (J) => add3(caTip(J), mul3(CA_IRON_AX, CA_DIP));
const caHoverWire = (J) => add3(caWire(J), mul3(CA_WIRE_AX, CA_DIPW));

function caInsts() {
  const base = place('baseCautin', 'base', { at: [9, -6, 0] }), f = base.pin('funda');
  const L = [
    place('placaPractica', 'placa', { at: [0, 0, 0] }),
    place('estacionSoldar', 'est', { at: [-10, -10, 0] }),
    base,
    place('cautin', 'cautin', { at: add3(f.p, mul3(f.dir, 9.6)), ghost: true }),
    place('tuboSoldadura', 'tubo', { at: add3([3.6, 6.2, 0.66], mul3(CA_TUBO_AX, 6.5)), ghost: true }),
  ];
  return L;
}
// camera on joint J: tip and wire around it, joint placed left of centre (the cross-section goes on the right)
function caCloseCam(J) { return camPut([340, J[0], J[1], 0], J, CA_JX, CA_JY); }

// pose keyframes: [{t0, t1, a: {tip, ax}, b: {tip, ax}, lift}] -> pose at t (rest before the first)
function caPose(keys, t, rest) {
  let p = rest;
  for (const k of keys) {
    if (t < k.t0) break;
    if (t >= k.t1) { p = k.b; continue; }
    const f = easeInOut(seg(t, k.t0, k.t1));
    return { tip: arcMove(k.a.tip, k.b.tip, f, k.lift || 0), ax: norm3(lerp3(k.a.ax, k.b.ax, f)) };
  }
  return p;
}
// time warp video t -> model tm: inside [wa, wb] the speed ramps 1 -> wk -> 1 (smoothstep ramps of r s)
function caMakeWarp(wa, wb, wk, r = 0.45) {
  const h = 0.002, N = Math.ceil((wb - wa) / h), cum = new Float64Array(N + 1);
  const s = (t) => smooth(seg(t, wa, wa + r)) * (1 - smooth(seg(t, wb - r, wb)));
  for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + (wk - 1) * 0.5 * (s(wa + (i - 1) * h) + s(wa + i * h)) * h;
  const extra = (t) => { if (t <= wa) return 0; if (t >= wb) return cum[N]; const x = (t - wa) / h, i = Math.floor(x); return lerp(cum[i], cum[Math.min(N, i + 1)], x - i); };
  const warp = (t) => t + extra(t);
  const unwarp = (tm) => { let lo = tm - cum[N] - 1, hi = tm + 1; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (warp(m) < tm) lo = m; else hi = m; } return (lo + hi) / 2; };
  return { warp, unwarp };
}
const caPress = (held, T0, T1, tm, travel) => (held ? easeInOut(clamp((tm - T0) / travel)) : easeInOut(1 - clamp((tm - T1) / travel)));

function caTimeline(params) {
  const insts = caInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const J = [1, 2, 3, 4].map(n => byId.placa.pin('j' + n).p), base = byId.base, wool = base.pin('viruta').p;
  const park = { tip: base.pin('funda').p, ax: base.pin('funda').dir }, tubePark = { tip: [3.6, 6.2, 0.66], ax: CA_TUBO_AX };
  const est = byId.est, sock = est.pin('cable');
  const overview = fitCam([[-14.5, -4.5, 0], [-5.5, -15.5, 0], [-14.5, -15.5, 8.5], [-5.5, -4.5, 8.5], [12.4, -11.2, 0], [12.4, -0.8, 0], [5.6, -0.8, 3.3], [-3.2, -2.1, 0], [3.2, 2.1, 0], add3(tubePark.tip, mul3(CA_TUBO_AX, 3)), add3(park.tip, mul3(park.ax, 7))], 1.0);
  const tset = params.tset ?? 340;
  if (params.live) return caLiveTimeline({ insts, byId, J, park, tubePark, sock, overview, tset });
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  let t = end + 0.4;
  const CH = CA_CH.map(c => { const o = Object.assign({}, c, { t0: t }); t += c.dur; o.t1 = t; return o; });
  const by = Object.fromEntries(CH.map(c => [c.id, c]));
  const T = { buildEnd: end, caption: t + 0.2 }; T.end = T.caption + 4.8; T.labelsOut = CH[0].t0 + 0.3;
  // time warp (×4 in 'mucho'): video t -> model tm
  const [wa, wb, wk] = by.mucho.warp.map((v, i) => (i < 2 ? by.mucho.t0 + v : v));
  const { warp, unwarp } = caMakeWarp(wa, wb, wk);
  const ev = [], E = (tv, key, v) => ev.push([warp(tv), key, v]);
  const M0 = by.mal.t0, B0 = by.bien.t0, C0 = by.mucho.t0, P0 = by.prep.t0, F0 = T.caption;
  E(M0 + 1.1, 'solderTip', 1); E(M0 + 2.1, 'solderTip', 0); E(M0 + 2.5, 'iron', 1); E(M0 + 3.3, 'iron', 0);
  for (const X0 of [B0, C0]) { E(X0 + 1.0, 'iron', 1); E(X0 + 2.1, 'solder', 1); E(X0 + 3.3, 'solder', 0); }
  E(B0 + 3.8, 'iron', 0); E(C0 + 6.55, 'iron', 0);
  ev.sort((a, b) => a[0] - b[0]);
  const sim = new CtSim(tset, 0.3); sim.reset(ev);
  // iron path: out of the stand, brass wool, then hovering over each joint
  const up = { tip: add3(wool, [0, 0, 1.6]), ax: CA_IRON_AX }, inW = (dy) => ({ tip: add3(wool, [0, dy, -0.05]), ax: CA_IRON_AX }), H = (k) => ({ tip: caHoverTip(J[k]), ax: CA_IRON_AX });
  const ironKeys = [
    { t0: P0 + 2.0, t1: P0 + 2.9, a: park, b: up, lift: 3 }, { t0: P0 + 3.0, t1: P0 + 3.25, a: up, b: inW(-0.45) },
    { t0: P0 + 3.25, t1: P0 + 3.55, a: inW(-0.45), b: inW(0.45) }, { t0: P0 + 3.55, t1: P0 + 3.85, a: inW(0.45), b: inW(-0.45) },
    { t0: P0 + 3.85, t1: P0 + 4.1, a: inW(-0.45), b: inW(0.3) }, { t0: P0 + 4.1, t1: P0 + 4.35, a: inW(0.3), b: up },
    { t0: P0 + 4.5, t1: P0 + 5.7, a: up, b: H(0), lift: 2.5 },
    { t0: B0 + 0.2, t1: B0 + 0.9, a: H(0), b: H(1), lift: 0.8 }, { t0: C0 + 0.2, t1: C0 + 0.9, a: H(1), b: H(2), lift: 0.8 },
    { t0: F0 + 0.2, t1: F0 + 1.7, a: H(2), b: park, lift: 3 },
  ];
  const tipAt = add3(caHoverTip(J[0]), [0, 0.11, 0.06]), W = (k, far = 0) => ({ tip: add3(caHoverWire(J[k]), mul3(CA_WIRE_AX, far)), ax: CA_WIRE_AX });
  const tubeKeys = [
    { t0: P0 + 4.6, t1: P0 + 5.9, a: tubePark, b: W(0, 1.4), lift: 2 },
    { t0: M0 + 0.35, t1: M0 + 1.05, a: W(0, 1.4), b: { tip: add3(tipAt, mul3(CA_WIRE_AX, 0.8)), ax: CA_WIRE_AX }, lift: 0.3 },
    { t0: M0 + 2.2, t1: M0 + 2.7, a: { tip: add3(tipAt, mul3(CA_WIRE_AX, 0.8)), ax: CA_WIRE_AX }, b: W(0, 1.4), lift: 0.3 },
    { t0: B0 + 0.4, t1: B0 + 1.2, a: W(0, 1.4), b: W(1), lift: 0.8 }, { t0: C0 + 0.4, t1: C0 + 1.2, a: W(1), b: W(2), lift: 0.8 },
    { t0: F0 + 0.3, t1: F0 + 1.5, a: W(2), b: tubePark, lift: 2 },
  ];
  // cameras
  const prepCam = fitCam([[-14.5, -15.5, 0], [-5.5, -4.5, 8.5], [-14.5, -4.5, 0], add3(wool, [3, 3, 0]), add3(wool, [-3, -3, 4]), add3(base.pin('funda').p, [0, -3, 6])], 1.0);
  const close = J.map(caCloseCam), board = camPut([230, 0, 0, 0], lerp3(J[0], J[3], 0.5), 860, 440);
  const station = (tv) => {
    const u = tv - P0, on = u >= 0.3 ? 1 : 0, set = lerp(200, tset, easeInOut(seg(u, 0.6, 1.5)));
    return { on, set: u < 0.6 ? 200 : set, temp: lerp(CT.Tamb, tset, easeInOut(seg(u, 1.5, 3.6))), ready: u >= 3.6 ? 1 : 0 };
  };
  // video time when the pad of joint 3 starts to lift (callout and sound)
  let liftT = by.mucho.t1; for (let tv = C0 + 3; tv < by.mucho.t1; tv += 0.02) if (sim.at(warp(tv)).U[2].lift > 0.25) { liftT = tv; break; }
  return { T, sched, total, insts, byId, J, CH, by, sim, ev, warp, unwarp, liftT, wa, wb, wk, ironKeys, tubeKeys, park, tubePark, sock, overview, prepCam, close, board, station, tset, tabs: [], tabAt: () => 0, live: false };
}

// live practice: the iron and the wire hover over the joint in turn; the viewer presses C and S
function caLiveTimeline(o) {
  const sim = new CtSim(o.tset, 0.12);
  const T = { buildEnd: 0, end: 1800, caption: null, labelsOut: 0 };
  return Object.assign(o, { T, sched: {}, total: o.insts.length, CH: [], by: {}, sim, live: true, close: o.J.map(caCloseCam), tabs: [], tabAt: () => 0 });
}
function caChapter(TL, t) { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; }

// ---- per-frame state ---------------------------------------------------------------------------------
function caState(TL, t) {
  const st = { t };
  partsAt(TL, t, st);
  if (TL.live) TL.sim.sync(LIVE.ev, LIVE.v);
  const tm = TL.live ? t : TL.warp(t), S = TL.sim.at(tm);
  st.tm = tm; st.S = S;
  const k = caChapter(TL, t), c = TL.CH[k], pc = TL.CH[k - 1], u = c ? t - c.t0 : 0;
  st.k = k; st.ch = c; st.u = u;
  st.U = S.U.map(v => ({ wet: v.wet, ball: v.ball, s: v.s, liquid: v.Tj >= CT.Tm, oxid: v.oxid, lift: v.lift, heat: clamp((v.Tj - CT.Tamb) / 330), res: v.res, burn: v.burn }));
  const I = S.inp, tr = TL.sim.travel;
  const pIron = caPress(I.iron, I.ironT0, I.ironT1, tm, tr), pSol = caPress(I.sol, I.solT0, I.solT1, tm, tr), pTip = caPress(I.tip, I.tipT0, I.tipT1, tm, tr);
  st.press = { iron: I.iron, sol: I.sol || I.tip, pIron, pSol, pTip };
  if (TL.live) {
    const f = easeInOut(seg(tm, S.curT, S.curT + 0.4)), a = TL.J[S.prev], b = TL.J[S.cur];
    const hov = arcMove(caHoverTip(a), caHoverTip(b), f, 0.6), wHov = arcMove(caHoverWire(a), caHoverWire(b), f, 0.6);
    st.iron = { tip: add3(hov, mul3(CA_IRON_AX, -CA_DIP * pIron)), ax: CA_IRON_AX, alpha: 1, shine: 1 };
    st.tube = { tip: add3(wHov, mul3(CA_WIRE_AX, -CA_DIPW * pSol)), ax: CA_WIRE_AX, alpha: 1 };
    st.cam = mixCam(TL.close[S.prev], TL.close[S.cur], f);
    st.estacion = { on: 1, set: S.tset, temp: S.tset, ready: 1 };
    st.kd = S.act;
  } else {
    // iron: keyframes + dip from the model's press state
    const ip = caPose(TL.ironKeys, t, TL.park);
    const wipe = c && c.id === 'prep' ? seg(u, 3.1, 4.3) : c ? 1 : 0;
    st.iron = { tip: add3(ip.tip, mul3(ip.ax, -CA_DIP * pIron)), ax: ip.ax, alpha: st.parts.cautin ?? 1, shine: lerp(0.3, 1, wipe) };
    const tp = caPose(TL.tubeKeys, t, TL.tubePark);
    let wt = add3(tp.tip, mul3(tp.ax, -CA_DIPW * pSol));
    if (pTip > 0.001) wt = lerp3(tp.tip, add3(st.iron.tip, [0, 0.1, 0.05]), pTip);
    st.tube = { tip: wt, ax: tp.ax, alpha: st.parts.tubo ?? 1 };
    st.estacion = c || t >= TL.T.buildEnd ? TL.station(t) : { on: 0, set: 200, temp: CT.Tamb, ready: 0 };
    // camera
    const T = TL.T;
    let cam = TL.overview;
    if (c) {
      if (c.id === 'prep') cam = u < 4.6 ? mixCam(TL.overview, TL.prepCam, easeInOut(seg(u, 0, 1.0))) : camFly(TL.prepCam, TL.close[0], TL.prepCam.slice(1), TL.J[0], [VIEW.cx, VIEW.cy], [CA_JX, CA_JY], seg(u, 4.6, 6.0));
      else cam = pc && pc.k != null && pc.k !== c.k ? mixCam(TL.close[pc.k], TL.close[c.k], easeInOut(seg(u, 0.1, 1.0))) : TL.close[c.k];
    }
    if (t >= T.caption - 0.2) cam = camFly(TL.close[2], TL.board, TL.J[2], lerp3(TL.J[0], TL.J[3], 0.5), [CA_JX, CA_JY], [860, 440], seg(t, T.caption - 0.2, T.caption + 1.3));
    st.cam = cam;
    st.kd = c && c.k != null ? c.k : t >= T.caption ? 2 : -1;
  }
  st.drop = S.drop;
  st.wireL = 3.4 - 0.1 * (S.fedTotal % 12);
  return st;
}
