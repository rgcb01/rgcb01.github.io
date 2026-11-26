// ---------------------------------------------------------------------------
// Lab 02 · Multímetro: the bench, one chapter per function, camera and per-frame state.
// ---------------------------------------------------------------------------
const MM_LEAN_L = mul3([-0.42, 0.1, 1], 1 / Math.hypot(0.42, 0.1, 1)), MM_LEAN_R = mul3([0.1, -0.42, 1], 1 / Math.hypot(0.1, 0.42, 1));
const MM_IDX = Object.fromEntries(DIAL_POS.map((d, i) => [d.id, i]));

function mmInsts() {
  const bb = place('protoboard400', 'bb', { at: [10, 21, 0], label: 'PROTOBOARD' });
  const mid = (a, b) => { const p = bb.pin(a).p, q = bb.pin(b).p; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, p[2]]; };
  const L = [
    place('multimetro', 'dmm', { at: [0, 0, 0] }),
    place('pila9v', 'pila', { at: [-12, 9, 0] }),
    place('multicontacto', 'strip', { at: [-7, 23, 0] }),
    bb,
    place('resistencia', 'res', { at: mid('g10', 'g14'), ohm: 220, span: 4, label: '220 Ω' }),
    place('led5', 'led', { at: mid('f9', 'f10'), color: 'R', litKey: 'led', label: 'LED ROJO' }),
    place('capacitor', 'cap', { at: mid('b4', 'b5'), label: '100 µF' }),
    place('boton', 'btn', { at: [(bb.pin('e22').p[0] + bb.pin('e25').p[0]) / 2, (bb.pin('e22').p[1] + bb.pin('f22').p[1]) / 2, 0.85], pressKey: 'btn', label: 'BOTÓN' }),
    place('uno', 'uno', { at: [23, 13, 0], group: 'floor', layer: 0, label: 'UNO R3' }),
    place('taza', 'taza', { at: [13, -12, 0] }),
    cable('j_d13', ['uno', 'D13'], ['bb', 'j17'], NARANJA, { label: null, name: 'cable D13' }),
    cable('j_gnd', ['uno', 'GND2'], ['bb', 'j9'], NEGRO, { label: null, name: 'cable GND' }),
  ];
  resolveCables(L);
  return L;
}
const MM_METER = (() => { const o = []; for (const x of [-4.7, 4.7]) for (const y of [-9.4, 9.4]) for (const z of [0, 3.8]) o.push([x, y, z]); return o; })();

function mmTimeline() {
  const insts = mmInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  const pin = (id, name) => byId[id].pin(name).p;
  const T = { buildEnd: end };
  const overview = fitCam([...MM_METER, ...insts.filter(i => !i.wire).map(i => i.anchorL), [-16, 25, 0], [26, 16, 0]], 1.0);
  let t = end + 0.45, prev = null;
  const CH = MM_CH.map((c) => { const o = Object.assign({}, c, { t0: t }); t += c.dur; o.t1 = t; return o; });
  const by = Object.fromEntries(CH.map(c => [c.id, c]));
  for (const c of CH) {
    if (c.red) {
      c.tipR = add3(pin(...c.red), [0, 0, 0.05]); c.tipB = add3(pin(...c.black), [0, 0, 0.05]);
      const left = dot3(c.tipR, VR) <= dot3(c.tipB, VR);
      c.axR = left ? MM_LEAN_L : MM_LEAN_R; c.axB = left ? MM_LEAN_R : MM_LEAN_L;
    } else if (prev) { c.tipR = prev.endR; c.tipB = prev.endB; c.axR = prev.endAxR; c.axB = prev.endAxB; }
    // where the probes end the chapter (Fig. vdc swaps them)
    const sw = c.id === 'vdc';
    c.endR = sw ? c.tipB : c.tipR; c.endB = sw ? c.tipR : c.tipB; c.endAxR = sw ? c.axB : c.axR; c.endAxB = sw ? c.axR : c.axB;
    const pts = [...MM_METER];
    if (c.red) pts.push(c.tipR, c.tipB, probeTop(c.tipR, c.axR), probeTop(c.tipB, c.axB));
    if (c.id === 'temp') pts.push(pin('taza', 'cafe'), [9.2, -15.8, 0], [16.8, -8.2, 0], [13, -12, 15]);
    c.cam = c.id === 'big' ? prev.cam : fitCam(pts, c.id === 'anat' ? 0.92 : 1.0);
    prev = c;
  }
  // first probe position: hovering over the battery
  by.anat.endR = add3(by.vdc.tipR, [0, 0, 15]); by.anat.endB = add3(by.vdc.tipB, [0, 0, 15]); by.anat.endAxR = by.vdc.axR; by.anat.endAxB = by.vdc.axB;
  T.caption = t + 0.3; T.end = t + 4.0; T.labelsOut = CH[0].t0 + 0.4;
  // events (absolute times)
  const presses = [['SELECT', by.cont.t0 + 0.95], ['SELECT', by.diode.t0 + 0.95], ['HOLD', by.vac.t0 + 4.0], ['HOLD', by.vac.t0 + 6.3], ['SELECT', by.hz.t0 + 3.6]];
  const settle = { vdc: by.vdc.t0 + 1.95, vac: by.vac.t0 + 1.95, ohm: by.ohm.t0 + 1.95, cont: by.cont.t0 + 3.05, diode: by.diode.t0 + 1.95,
    cap: by.cap.t0 + 2.7, hz: by.hz.t0 + 1.95, pct: by.hz.t0 + 3.75, temp: by.temp.t0 + 2.2, ma: by.ma.t0 + 2.3 };
  const unoOn = by.hz.t0 - 0.3;
  return { T, sched, total, insts, byId, CH, by, overview, presses, settle, unoOn, tabs: [], tabAt: () => 0 };
}

// ---- transitions ----------------------------------------------------------------------------------
// leaving a live source for an unpowered test (127 V -> Ω), the tips come out before the dial turns
function mmDialWin(c, pc) {
  const live = pc && (pc.conn === 'paralelo' || pc.conn === 'serie');
  return live && c.conn === 'apagado' && c.dial !== pc.dial ? [0.95, 1.5] : [0.15, 0.8];
}
// u at which the meter really changes function: the dial passes the middle of its turn, or SELECT
function mmSwitchAt(TL, c, pc) {
  if (c.dial !== pc.dial) { const [a, b] = mmDialWin(c, pc); return (a + b) / 2; }
  const p = TL.presses.find(([n, at]) => n === 'SELECT' && at >= c.t0 && at < c.t1);
  return p ? p[1] - c.t0 : 0;
}
// are the tips still on the previous chapter's points? (they lift from u = 0.5, see mmProbes; slots are deeper)
function mmOnPrev(c, pc, u, st) {
  if (c.id === 'temp') return u < 0.3;
  if (!c.red) return st.touch;
  const lift = 5.5 * Math.sin(Math.PI * easeInOut(seg(u, 0.5, 1.6)));
  return lift < (pc.lab === 'strip' ? 1.0 : 0.25);
}

// ---- per-frame state ------------------------------------------------------------------------------
function mmChapter(TL, t) { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; }
function mmPin13(TL, t) { return t >= TL.unoOn && Math.floor((t - TL.unoOn) / 1.0) % 2 === 0 ? 1 : 0; }

function mmState(TL, t) {
  const T = TL.T, CH = TL.CH, by = TL.by, st = { t, steam: 1, mains: 1 };
  partsAt(TL, t, st);
  const k = mmChapter(TL, t), c = CH[k], pc = CH[k - 1], u = c ? t - c.t0 : 0;
  st.k = k; st.ch = c; st.u = u;
  // camera
  if (!c) st.cam = TL.overview;
  else if (t >= T.caption - 0.3) st.cam = mixCam(CH[CH.length - 1].cam, TL.overview, easeInOut(seg(t, T.caption - 0.3, T.caption + 0.9)));
  else st.cam = mixCam(pc ? pc.cam : TL.overview, c.cam, easeInOut(seg(u, 0, 0.95)));
  // dial
  const dPrev = pc ? pc.dial : 'OFF', dCur = c ? c.dial : 'OFF';
  let ang = dialAngle('OFF'), pos = 'OFF';
  if (c) { const [da, db] = mmDialWin(c, pc), f = easeInOut(seg(u, da, db)); ang = lerp(dialAngle(dPrev), dialAngle(dCur), f); pos = f > 0.5 ? dCur : dPrev; }
  if (t >= T.caption + 0.6) { const f = easeInOut(seg(t, T.caption + 0.6, T.caption + 1.2)); ang = lerp(dialAngle(dCur), dialAngle('OFF'), f); if (f > 0.5) pos = 'OFF'; }
  st.dial = ang; st.dialPos = pos;
  st.press = {};
  for (const [name, at] of TL.presses) { const p = pulse(t, at); if (p > 0) st.press = { name, k: p }; }
  // probes
  mmProbes(TL, t, k, c, pc, u, st);
  // plugs: black in COM, red in V or mA (moves in 'ma' and back in 'big'); thermocouple adapter in 'temp'
  mmPlugs(TL, t, c, u, st);
  // the bench
  st.power = t >= TL.unoOn ? 1 : 0; st.pin13 = mmPin13(TL, t); st.tx = 0;
  st.btn = c && c.id === 'cont' ? clamp((u - 3.0) / 0.12) * (1 - clamp((u - 4.4) / 0.12)) : 0;
  st.led = 0;
  if (c && c.id === 'diode' && st.touch) st.led = 0.32;
  if (c && pc && pc.id === 'diode' && u < mmSwitchAt(TL, c, pc) && mmOnPrev(c, pc, u, st)) st.led = 0.32; // still on diode test
  if (c && (c.id === 'ma' || c.id === 'big') && st.touch && st.redJack === 'mA') st.led = st.pin13;
  st.lcd = mmLCD(TL, t, c, u, st);
  st.done = new Set(Object.entries(TL.settle).filter(([, at]) => t >= at).map(([id]) => id));
  st.fn = c ? (c.id === 'hz' && u >= 3.7 ? 'pct' : c.fn) : null;
  return st;
}

function mmProbes(TL, t, k, c, pc, u, st) {
  const by = TL.by;
  let r = by.anat.endR, b = by.anat.endB, aR = by.anat.endAxR, aB = by.anat.endAxB, alpha = 0, touch = false;
  if (c && c.id === 'anat') alpha = seg(u, 3.6, 4.2);
  else if (c) {
    alpha = 1;
    const fr = pc.endR, fb = pc.endB, f = easeInOut(seg(u, 0.5, 1.6)), lift = 5.5 * Math.sin(Math.PI * f);
    const moves = !!c.red;
    if (moves) {
      r = add3(lerp3(fr, c.tipR, f), [0, 0, lift]); b = add3(lerp3(fb, c.tipB, f), [0, 0, lift]);
      aR = norm3(lerp3(pc.endAxR, c.axR, f)); aB = norm3(lerp3(pc.endAxB, c.axB, f));
      touch = u >= 1.6;
      if (c.id === 'vdc' && u >= 3.6) {
        const g = easeInOut(seg(u, 3.6, 4.4)), l2 = 3.2 * Math.sin(Math.PI * g);
        r = add3(lerp3(c.tipR, c.tipB, g), [0, 0, l2]); b = add3(lerp3(c.tipB, c.tipR, g), [0, 0, l2]);
        aR = norm3(lerp3(c.axR, c.axB, g)); aB = norm3(lerp3(c.axB, c.axR, g));
        touch = u >= 4.4;
      }
    } else { r = c.tipR; b = c.tipB; aR = c.axR; aB = c.axB; touch = true; }
    if (c.id === 'temp') { alpha = 1 - seg(u, 0.2, 0.7) + seg(u, 5.0, 5.6); touch = false; }
  }
  st.probe = { r, b, aR, aB, alpha };
  st.touch = touch;
}

function mmPlugs(TL, t, c, u, st) {
  const dmm = TL.byId.dmm, J = (n) => dmm.pin(n).p;
  let blk = { p: J('COM'), dz: 0, a: 1 }, red = { p: J('V'), dz: 0, a: 1 }, redJack = 'V', tc = { a: 0, dz: 3, prog: 0 };
  const k = c ? TL.CH.indexOf(c) : -1, iMa = TL.CH.indexOf(TL.by.ma), iBig = TL.CH.indexOf(TL.by.big);
  if (!c) { blk.a = red.a = 0; }
  else if (c.id === 'anat') {
    blk.dz = 3 * (1 - easeOut(seg(u, 3.5, 3.85))); blk.a = seg(u, 3.5, 3.7);
    red.dz = 3 * (1 - easeOut(seg(u, 3.9, 4.25))); red.a = seg(u, 3.9, 4.1);
  } else if (c.id === 'temp') {
    const out = 3 * easeInOut(seg(u, 0.25, 0.75)) * (1 - seg(u, 5.2, 5.6)), a = 1 - seg(u, 0.45, 0.75) + seg(u, 5.2, 5.4);
    blk.dz = red.dz = out; blk.a = red.a = clamp(a);
    tc = { a: clamp(seg(u, 0.8, 1.0) - seg(u, 5.0, 5.3)), dz: 3 * (1 - easeOut(seg(u, 0.8, 1.25))) + 3 * easeInOut(seg(u, 4.9, 5.3)), prog: easeInOut(seg(u, 1.0, 1.8)) * (1 - seg(u, 4.5, 4.95)) };
  }
  if (k >= iMa) {
    const a = k === iMa ? u : 99, bk = k === iBig ? u : (k > iBig ? 99 : -1);
    const go = (x, x0) => ({ lift: 2.5 * easeOut(seg(x, x0, x0 + 0.3)) * (1 - smooth(seg(x, x0 + 0.7, x0 + 1.05))), f: easeInOut(seg(x, x0 + 0.3, x0 + 0.7)) });
    const where = (g, a0, a1) => (g.lift < 0.01 && g.f <= 0 ? a0 : g.lift < 0.01 && g.f >= 1 ? a1 : 'moving');
    const g1 = go(a, 0.3); red.p = lerp3(J('V'), J('mA'), g1.f); red.dz = g1.lift; redJack = where(g1, 'V', 'mA');
    if (bk >= 0) { const g2 = go(bk, 2.0); red.p = lerp3(J('mA'), J('V'), g2.f); red.dz = Math.max(red.dz, g2.lift); redJack = where(g2, 'mA', 'V'); }
  }
  st.plugs = { blk, red }; st.redJack = redJack; st.tc = tc;
}

function mmFmt(v, d) { return v.toFixed(d); }
function mmLCD(TL, t, c, u, st) {
  if (c && c.id === 'vdc' && u > 0.48 && u < 0.8) return { v: '8.8.8.8', unit: 'mV', mode: 'DC', auto: true, hold: true, rel: true, beep: true, diode: true };
  if (!c || st.dialPos === 'OFF') return { blank: true };
  // until the function really changes, the meter keeps reading the previous one
  const pc = TL.CH[TL.CH.indexOf(c) - 1];
  if (pc && pc.fn && u < mmSwitchAt(TL, c, pc)) {
    return mmLCD(TL, t, pc, pc.dur + u, Object.assign({}, st, { touch: mmOnPrev(c, pc, u, st) }));
  }
  const L = { auto: true, mode: '', v: '0.00', unit: '' }, id = c.id, tch = st.touch, sett = u >= 1.95;
  const flick = (v) => (sett ? v : tch ? (Math.floor(t * 12) % 2 ? v.slice(0, -1) : '0.0') : null);
  if (t >= TL.T.caption + 0.6) return { blank: true };
  if (id === 'vdc' || (id === 'anat')) { L.mode = 'DC'; L.unit = 'V'; if (id === 'vdc') { const sw = u >= 3.6; L.v = sw ? (u >= 4.4 ? mmFmt(MM.bat9, 2) : '0.00') : (flick(mmFmt(MM.bat9, 2)) || '0.00'); L.neg = sw && u >= 4.4; } }
  else if (id === 'vac') {
    L.mode = 'AC'; L.unit = 'V';
    const hold = u >= 4.0 && u < 6.3, tq = hold ? c.t0 + 4.0 : t, jit = Math.sin(Math.floor(tq * 4) * 12.9898) * 0.25;
    L.v = tch ? (sett ? mmFmt(MM.mains + jit, 1) : flick(mmFmt(MM.mains, 1))) : '0.0'; L.hold = hold;
  } else if (id === 'ohm') { L.unit = 'Ω'; L.v = tch ? (sett ? mmFmt(MM.r, 1) : flick(mmFmt(MM.r, 1))) : 'OL'; }
  else if (id === 'cont') { L.unit = 'Ω'; L.beep = u >= 1.0; L.v = tch && st.btn > 0.5 ? '0.3' : 'OL'; }
  else if (id === 'diode') { L.unit = 'V'; L.diode = u >= 1.0; L.auto = false; L.v = tch ? (sett ? mmFmt(MM.ledVf, 2) : flick(mmFmt(MM.ledVf, 2))) : 'OL'; }
  else if (id === 'cap') {
    L.unit = tch && u >= 2.0 ? 'µF' : 'nF';
    const steps = ['12.5', '61.0', '93.2'];
    L.v = !tch ? '0.00' : u >= 2.7 ? mmFmt(MM.cap, 1) : u >= 2.0 ? steps[Math.min(2, Math.floor((u - 2.0) / 0.24))] : '0.00';
  } else if (id === 'hz') {
    const pct = u >= 3.7; L.unit = pct ? '%' : 'Hz';
    L.v = !tch ? '0.00' : pct ? mmFmt(MM.duty, 1) : sett ? mmFmt(MM.pwmHz, 1) : flick(mmFmt(MM.pwmHz, 1));
  } else if (id === 'temp') {
    L.unit = '°C'; L.auto = false;
    const T0 = TL.by.temp.t0 + 1.8, x = Math.max(0, t - T0), on = u >= 1.25 && st.tc.a > 0.5;
    L.v = on ? mmFmt(MM.tRoom + (MM.tCoffee - MM.tRoom) * (1 - Math.exp(-x / 0.6)), 1) : '---';
  } else if (id === 'ma' || id === 'big') {
    L.mode = 'DC'; L.unit = 'mA';
    const ok = tch && st.redJack === 'mA';
    L.v = ok && st.pin13 ? mmFmt(MM.iLed, 1) : '0.00';
  }
  return L;
}
