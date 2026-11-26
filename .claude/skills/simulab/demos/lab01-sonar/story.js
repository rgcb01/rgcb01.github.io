// ---------------------------------------------------------------------------
// Lab 01 story: build -> power -> wide reveal -> real-time drive -> slow-motion echo
// (x1/2000) -> math -> evade. Pure function of t.
// ---------------------------------------------------------------------------
function fig01Insts() {
  const L = [
    ...kit2WD(),
    ...UNO_STANDOFFS.map((at, i) => place('separador', 'separador_' + (i + 1), { at, name: 'separador ' + (i + 1) })),
    place('uno', 'uno'), place('portapilas2x18650', 'portapilas'),
    place('pila18650', 'pila_1', { name: 'pila 1' }), place('pila18650', 'pila_2', { name: 'pila 2', at: [-6.05, -3.65, 4.82] }),
    place('interruptor', 'interruptor'), place('l298n', 'l298n'), place('disipador', 'disipador'),
    place('protoboard170', 'protoboard'), place('soporteSensor', 'soporte_sensor'), place('hcsr04', 'hc_sr04'),
  ];
  for (const s of L.filter(i => i.id.startsWith('separador'))) s.quick = true;
  for (const [id, wires] of Object.entries(FIG01_WIRES)) wires.forEach((w, k) => {
    const meta = FIG01_WIRE_META[id];
    const cb = cable(k === 0 ? id : `${id}#${k}`, null, null, w.c, { points: w.p, label: k === 0 ? meta.label : null, lab: meta.lab, labOff: meta.off, name: id.replace(/_/g, ' '), glowKey: meta.glowKey, glowColor: meta.glowColor });
    if (k > 0) cb.noBuild = true, cb.follow = id;
    L.push(cb);
  });
  resolveCables(L);
  return L;
}
const UP_ = (k, dz = 0) => { const q = unoPin(k).p; return [q[0], q[1], q[2] + dz]; };
const FIG01_WIRES = {
  cables_bateria: [
    { c: WIRE.red, p: [[-9.45, -3.3, 6.5], [-9.9, -2.7, 6.95], [-10.25, -1.9, 5.9], [-10.05, -1.45, 5.15]] },
    { c: WIRE.blk, p: [[-9.45, -6.0, 6.5], [-10.3, -5.0, 7.3], [-10.75, -1.0, 7.1], [-10.7, 3.0, 6.4], [-10.2, 4.42, 5.8]] },
  ],
  cable_interruptor: [{ c: WIRE.red, p: [[-10.05, -0.35, 5.15], [-10.55, 0.6, 5.9], [-10.7, 3.6, 6.2], [-10.2, 5.17, 5.8]] }],
  cables_motor_der: [
    { c: WIRE.red, p: [[-8.43, 6.68, 5.75], [-8.25, 6.95, 6.3], [-5.5, 6.85, 5.4], [-2.4, 6.7, 5.05], [0.6, 6.0, 4.95], [1.3, 5.72, 4.75], [1.3, 5.65, 4.25], [0.66, 5.45, 3.45]] },
    { c: WIRE.blk, p: [[-7.68, 6.68, 5.75], [-7.45, 6.98, 6.2], [-4.6, 6.95, 5.35], [-1.6, 6.8, 5.0], [0.9, 6.2, 4.95], [1.55, 5.85, 4.75], [1.55, 5.9, 4.25], [0.66, 6.25, 3.45]] },
  ],
  cables_motor_izq: [
    { c: WIRE.red, p: [[-8.43, 2.22, 5.75], [-8.3, 1.6, 6.7], [-6.0, -1.0, 7.7], [-3.0, -4.0, 7.3], [0.2, -5.3, 5.7], [1.3, -5.62, 4.8], [1.3, -5.65, 4.25], [0.66, -5.45, 3.45]] },
    { c: WIRE.blk, p: [[-7.68, 2.22, 5.75], [-7.5, 1.5, 6.6], [-5.2, -1.3, 7.55], [-2.3, -4.3, 7.1], [0.6, -5.55, 5.6], [1.55, -5.85, 4.8], [1.55, -5.9, 4.25], [0.66, -6.25, 3.45]] },
  ],
  puente_5v: [
    { c: WIRE.red, p: [[-10.2, 3.67, 5.8], [-10.8, 3.2, 6.7], [-8.0, 1.4, 7.7], [-1.0, 0.0, 7.9], [3.7, -1.0, 7.1], [4.6, -1.27, 6.3], [4.6, -1.27, 5.55]] },
    { c: WIRE.blk, p: [[-10.2, 4.42, 5.8], [-10.85, 4.0, 6.9], [-8.0, 2.2, 8.1], [-1.0, 1.4, 8.2], [3.8, 1.1, 7.3], [4.6, 1.27, 6.3], [4.6, 1.27, 5.55]] },
  ],
  rieles_uno: [
    { c: WIRE.red, p: [[4.85, -1.27, 5.55], [4.85, -1.27, 6.4], [2.0, -0.6, 7.8], [-1.2, 0.3, 7.6], [-1.625, 0.38, 7.0], [-1.625, 0.38, 6.71]] },
    { c: WIRE.blk, p: [[4.85, 1.27, 5.55], [4.85, 1.27, 6.5], [2.0, 1.1, 7.95], [-1.2, 0.75, 7.7], [-1.625, 0.63, 7.0], [-1.625, 0.63, 6.71]] },
  ],
  alim_sensor: [
    { c: WIRE.red, p: [[7.8, -0.381, 5.055], [7.2, -0.65, 5.25], [5.6, -1.25, 6.05], [5.1, -1.27, 6.0], [5.1, -1.27, 5.55]] },
    { c: WIRE.blk, p: [[7.8, 0.381, 5.055], [7.2, 0.65, 5.25], [5.6, 1.25, 6.05], [5.1, 1.27, 6.0], [5.1, 1.27, 5.55]] },
  ],
  cable_trig: [{ c: WIRE.yel, p: [[7.8, -0.127, 5.055], [7.0, -0.2, 5.5], [5.5, 0.1, 7.3], [3.6, 0.4, 7.8], [2.955, 0.46, 7.3], UP_('D9')] }],
  cable_echo: [{ c: WIRE.grn, p: [[7.8, 0.127, 5.055], [7.0, 0.25, 5.6], [5.4, 0.3, 7.6], [3.5, 0.24, 8.0], [2.955, 0.21, 7.35], UP_('D10')] }],
  bus_motores: [['D5', 'ENA', WIRE.org], ['D6', 'ENB', WIRE.blu], ['D7', 'IN1', WIRE.pur], ['D8', 'IN2', WIRE.gry], ['D11', 'IN3', WIRE.wht], ['D12', 'IN4', WIRE.brn]].map(([d, h, c], i) => ({
    c, p: [UP_(d), UP_(d, 0.7), [1.2, unoPin(d).p[1] + 1.5, 8.6 - i * 0.1], [-3.6, L298_HDR[h] - 0.3, 8.3 - i * 0.08], [-6.15, L298_HDR[h], 6.95], [-6.15, L298_HDR[h], 6.2]],
  })),
};
const FIG01_WIRE_META = {
  cables_bateria: { lab: [-9.8, -3.2, 7.0] }, cable_interruptor: { lab: [-10.6, 2.0, 6.3] },
  cables_motor_der: { lab: [-4.5, 6.9, 5.4] }, cables_motor_izq: { lab: [-3.0, -4.0, 7.3] },
  puente_5v: { lab: [-4.0, 0.8, 7.6] }, rieles_uno: { lab: [1.5, 0.0, 7.9] }, alim_sensor: { lab: [6.0, -1.2, 6.0] },
  cable_trig: { label: 'TRIG → D9', lab: [5.6, -0.1, 7.2], off: [1.0, -3.6, 1.6], glowKey: 'trigGlow', glowColor: 'rgba(255,220,80,A)' },
  cable_echo: { label: 'ECHO → D10', lab: [4.4, 0.3, 7.9], off: [-0.6, 3.0, 2.2], glowKey: 'echoGlow', glowColor: 'rgba(80,255,170,A)' },
  bus_motores: { label: 'BUS → L298N', lab: [-1.5, 3.0, 8.4] },
};

function fig01Timeline(P) {
  const umbral = P.umbral ?? K.UMBRAL;
  const sim = simulate(umbral);
  const dec = sim.decision, pk = sim.pings[dec.ping];
  const insts = fig01Insts();
  // wire siblings follow their first wire's schedule
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  for (const i of insts) if (i.follow) sched[i.id] = sched[i.follow];
  const T = { SLOW: 2000 };
  T.buildEnd = end; T.power = T.buildEnd + 0.3; T.switchOn = T.power + 0.25; T.tab = T.switchOn + 0.55; T.setup0 = T.tab + 0.12;
  T.reveal0 = T.setup0 + 0.75; T.reveal1 = T.reveal0 + 1.3; T.boxDrop = T.reveal0 + 0.85; T.drive0 = T.reveal1 + 0.55;
  T.drive1 = T.drive0 + pk.t; T.freeze1 = T.drive1 + 0.6; T.trig0 = T.freeze1; T.trig1 = T.trig0 + 0.8; T.burst0 = T.trig1;
  T.echoEnd = T.burst0 + pk.echoUs * 1e-6 * T.SLOW; T.slow1 = T.echoEnd + (K.BURST / K.FREQ) * T.SLOW + 0.3;
  T.math0 = T.slow1; T.math1 = T.math0 + 1.5; T.cond0 = T.math1; T.cond1 = T.cond0 + 1.2; T.evade0 = T.cond1 + 0.3;
  T.caption = T.evade0 + 1.35; T.end = T.evade0 + 3.55; T.labelsOut = T.reveal0; T.keepOut = T.freeze1;
  const modelT = (v) => v < T.drive0 ? 0 : v < T.drive1 ? v - T.drive0 : v < T.evade0 ? pk.t : dec.t + (v - T.evade0);
  const videoT = (m) => m <= pk.t ? T.drive0 + m : T.evade0 + (m - dec.t);
  const names = Object.fromEntries(insts.map(i => [i.id, i.name]));
  const armado = armadoTab(ARMADO, sched, total, names, { __power: T.power });
  const ev = {}; const E = (l, t) => (ev[l] = ev[l] || []).push(t);
  for (let i = 0; i <= 5; i++) E(LN.setup0 + i < 13 ? LN.setup0 + i : 12, T.setup0 + i * 0.1);
  const serial = [];
  sim.pings.forEach((p, i) => {
    if (i === dec.ping) return;
    const v = videoT(p.t);
    [LN.loopMeasure, LN.trigLow, LN.trigHigh, LN.trigOff, LN.pulse, LN.ret, LN.println, LN.cond].forEach((l, j) => E(l, v + j * 0.004));
    if (p.d > 0 && p.d < umbral) return;
    E(LN.fwd, v + 0.034); E(LN.motorFn, v + 0.035); E(LN.delay, v + 0.036);
    serial.push({ t: videoT(p.tReturn), text: p.d.toFixed(2), d: p.d });
  });
  E(LN.loopMeasure, T.drive1); E(LN.trigLow, T.trig0); E(LN.trigHigh, T.trig0 + 0.2); E(LN.trigOff, T.trig1 - 0.08);
  E(LN.pulse, T.burst0); E(LN.ret, T.math0 + 0.05); E(LN.println, T.math1 - 0.25); E(LN.cond, T.cond0);
  serial.push({ t: T.math1 - 0.2, text: pk.d.toFixed(2), d: pk.d, hot: true, note: `← menos de ${umbral} cm` });
  E(LN.stop, T.evade0); E(LN.motorFn, T.evade0 + 0.01);
  E(LN.back, videoT(dec.t + K.T_STOP)); E(LN.turn, videoT(dec.t + K.T_STOP + K.T_BACK)); E(LN.delay, videoT(dec.t + K.T_STOP + K.T_BACK + K.T_TURN));
  serial.sort((a, b) => a.t - b.t);
  const sonar = codeTab('sonar.ino', SONAR, ev, (t) => lerp(0, 12, easeInOut(seg(t, T.reveal0, T.reveal0 + 0.8))));
  const byId = Object.fromEntries(insts.map(i => [i.id, i]));
  return { sim, dec, pk, T, sched, total, insts, byId, modelT, videoT, serial, umbral, tabs: [armado, sonar], tabAt: (t) => t >= T.tab ? 1 : 0 };
}

function fig01Camera(TL, t, pose) {
  const T = TL.T, pk = TL.pk;
  const build = [lerp(26.5, 28.0, smooth(t / T.reveal0)), 0.0, 0.2, 4.6];
  const wide = [8.7, 45, 1.5, 5], track = [12.6, pose.x + 15, pose.y * 0.5 + 0.5, 4.5];
  const gapX = (pk.x + K.BOX.x0) / 2, slow = [29.0, gapX - 0.5, -0.5, 7.5], follow = [14.0, pose.x + 2, pose.y * 0.75 + 2, 4.5];
  if (t < T.reveal0) return build;
  if (t < T.reveal1) return mixCam([28.0, 0.0, 0.2, 4.6], wide, easeInOut(seg(t, T.reveal0, T.reveal1)));
  if (t < T.drive0 - 0.2) return wide;
  if (t < T.drive1) return mixCam(wide, track, easeInOut(seg(t, T.drive0 - 0.2, T.drive0 + 0.75)));
  if (t < T.math1 + 0.6) return mixCam(track, slow, easeInOut(seg(t, T.drive1 + 0.05, T.freeze1)));
  return mixCam(slow, follow, easeInOut(seg(t, T.math1 + 0.6, T.evade0 + 0.7)));
}

function fig01State(TL, t) {
  const T = TL.T, sim = TL.sim, pk = TL.pk;
  const st = { t, umbral: TL.umbral };
  partsAt(TL, t, st);
  st.power = t >= T.switchOn ? 1 : 0;
  st.boxIn = seg(t, T.boxDrop, T.boxDrop + 0.45);
  const m = TL.modelT(t), s = sampleAt(sim, m);
  st.rx = s.x; st.ry = s.y; st.yaw = s.yaw; st.thL = s.thL; st.thR = s.thR;
  const frozen = t >= T.drive1 && t < T.evade0;
  st.cL = t >= T.drive0 ? (frozen ? 1 : s.cL) : 0; st.cR = t >= T.drive0 ? (frozen ? 1 : s.cR) : 0;
  st.realtime = (t >= T.drive0 && t < T.drive1) || t >= T.evade0;
  st.slow = t >= T.freeze1 && t < T.math0;
  st.paused = t >= T.math0 && t < T.evade0;
  st.mu = st.slow ? Math.max(-1, (t - T.burst0) / T.SLOW * 1e6) : 0;
  let lp = null;
  if (t >= T.drive0) for (let i = 0; i < sim.pings.length; i++) {
    const p = sim.pings[i];
    if (i === TL.dec.ping) { if (t >= T.math0) lp = p; continue; }
    if (TL.videoT(p.tReturn) <= t) lp = p; else if (TL.videoT(p.t) > t) break;
  }
  st.lastPing = lp;
  st.txFlash = 0; st.rxFlash = 0; st.beam = 0; st.beamPing = null; st.tx = 0;
  if (st.realtime) for (const p of sim.pings) {
    const v0 = TL.videoT(p.t); if (v0 > t) break;
    const age = t - v0;
    if (age < 0.06) { st.txFlash = Math.max(st.txFlash, 1 - age / 0.06); st.beam = Math.max(st.beam, 1 - age / 0.06); st.beamPing = p; st.tx = 1; }
    const vr = TL.videoT(p.tReturn); if (p.echoUs && t >= vr && t - vr < 0.05) st.rxFlash = 1 - (t - vr) / 0.05;
  }
  if (st.slow) {
    const mu = st.mu;
    if (mu >= 0 && mu < 200) st.txFlash = 0.6 + 0.4 * Math.sin(mu / 25 * Math.PI * 2);
    const er = t - T.echoEnd;
    if (er >= 0 && er < 0.6) st.rxFlash = 1 - er / 0.6;
    st.trigGlow = t < T.trig1 ? Math.sin(seg(t, T.trig0, T.trig1) * Math.PI) : 0;
    st.echoGlow = er >= 0 && er < 0.7 ? 1 - er / 0.7 : 0;
  }
  const lines = []; for (const sl of TL.serial) { if (sl.t <= t) lines.push(sl); else break; }
  st.serial = lines.slice(-4);
  if (t >= T.drive0 && TL.serial.find(sl => sl.t <= t && t - sl.t < 0.03)) st.tx = 1;
  if (t >= T.reveal1) { const sx = st.rx + Math.cos(st.yaw) * K.SENSOR_X; st.rulerMark = Math.abs(st.yaw) < 0.25 ? sx : null; }
  st.cam = fig01Camera(TL, t, { x: st.rx, y: st.ry });
  return st;
}
