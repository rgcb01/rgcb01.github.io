// ---------------------------------------------------------------------------
// Lab 00 · BLINK. Template demo: UNO + protoboard 400 + LED + 220 Ω + 2 auto-routed cables.
// Copy this folder to start a new demo (tools/new-demo.mjs does it).
// ---------------------------------------------------------------------------
const VF = 2.0, R_OHM = 220, I_MA = ((5 - VF) / R_OHM) * 1000; // typical red LED drop
function blinkInsts() {
  const bb = place('protoboard400', 'bb', { at: [5.5, 0, 0] });
  const mid = (a, b) => { const p = bb.pin(a).p, q = bb.pin(b).p; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, p[2]]; };
  const L = [
    place('uno', 'uno', { at: [-4.5, 0, 0], group: 'floor', layer: 0, label: 'UNO R3', code: "uno('R3');" }),
    Object.assign(bb, { code: 'protoboard(400);' }),
    place('led5', 'led', { at: mid('f9', 'f10'), color: 'R', litKey: 'pin13', label: 'LED ROJO', code: "led('f9', 'f10', ROJO);" }),
    place('resistencia', 'res', { at: mid('g10', 'g14'), ohm: R_OHM, span: 4, label: '220 Ω', code: "resistencia(220, 'g10', 'g14');" }),
    cable('cable_d13', ['uno', 'D13'], ['bb', 'j14'], NARANJA, { label: 'D13', name: 'cable D13', code: "cable(uno.D13, 'j14', NARANJA);" }),
    cable('cable_gnd', ['uno', 'GND2'], ['bb', 'j9'], NEGRO, { label: 'GND', name: 'cable GND', code: "cable(uno.GND, 'j9', NEGRO);" }),
  ];
  resolveCables(L);
  return L;
}
function blinkTimeline() {
  const insts = blinkInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  const T = {}; T.buildEnd = end; T.power = end + 0.3; T.switchOn = T.power + 0.2; T.tab = T.switchOn + 0.4; T.setup = T.tab + 0.25; T.loop0 = T.setup + 0.5;
  T.cycles = 4; T.end = T.loop0 + T.cycles * 2 + 0.4; T.caption = T.loop0 + 2 * 2 + 0.2; T.labelsOut = T.loop0 + 0.5;
  const ev = {}; const E = (l, t) => (ev[l] = ev[l] || []).push(t);
  E(LNB.setup, T.setup);
  const edges = [[0, 0]];
  for (let k = 0; k < T.cycles; k++) { const t0 = T.loop0 + k * 2; E(LNB.high, t0); E(LNB.d1, t0 + 0.02); E(LNB.low, t0 + 1); E(LNB.d2, t0 + 1.02); edges.push([t0, 1], [t0 + 1, 0]); }
  const names = Object.fromEntries(insts.map(i => [i.id, i.name]));
  const tabs = [armadoTab(autoArmado(insts, 'lab', '// Lab 00 · cada línea coloca una pieza'), sched, total, names, { __power: T.power }), codeTab('blink.ino', BLINK, ev)];
  return { T, sched, total, insts, byId, edges, tabs, tabAt: (t) => t >= T.tab ? 1 : 0 };
}
const DEMO = {
  brand: 'KAPRI LAB',
  id: 'BLINK', num: '00', title: 'BLINK', tagline: 'PRENDE · ESPERA · APAGA', category: 'ARDUINO',
  plate: ['KAPRI LAB · BLINK · LAB 00', 'Lab 00 · tu primer programa · 6 piezas desde código'],
  chips: ['UNO R3 · LED 5 MM · 220 Ω · PROTO 400', 'LAB 00 · PLANTILLA'],
  caption: 'Prender un LED es poner 5 V en un pin.',
  intro: { seconds: 5, lines: ['¿Cómo prende y apaga', 'un LED tu Arduino?'], pill: 'LAB 00 · BLINK', src: (TL) => TL.T.loop0 - 0.2, rate: 0.8 },
  major: ['uno', 'led', 'res'],
  timeline: () => blinkTimeline(),
  steps: (TL) => [['1 · Armar', 0], ['2 · Encender', TL.T.power - 0.2], ['3 · Parpadear', TL.T.loop0]],
  state(TL, t) {
    const T = TL.T, st = { t };
    partsAt(TL, t, st);
    st.power = t >= T.switchOn ? 1 : 0;
    let v = 0; for (const [te, val] of TL.edges) if (te <= t) v = val;
    st.pin13 = st.power ? v : 0;
    st.cycle = t >= T.loop0 ? Math.min(T.cycles, Math.floor((t - T.loop0) / 2) + 1) : 0;
    st.serial = [];
    st.cam = mixCam([58, 1.0, -0.4, 1.0], [64, 1.6, 0.2, 1.0], smooth(t / T.end));
    return st;
  },
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -16, x1: 18, y0: -12, y1: 14, plate: 'BANCO · LAB 00' });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  speedBadge(TL, st) { return st.placedCount < TL.total ? { txt: 'ARMANDO', bg: BAY_BG.amber } : st.pin13 ? { txt: 'PIN 13 · HIGH', bg: BAY_BG.lime } : { txt: st.power ? 'PIN 13 · LOW' : 'LISTO', bg: BAY_BG.grey }; },
  footer(TL, st) { return [{ text: st.placedCount < TL.total ? 'ARMANDO' : st.power ? 'CORRIENDO' : 'LISTO', dot: st.power ? UIC.lime : UIC.amber }, { text: `PIN 13 · ${st.pin13 ? 'HIGH' : 'LOW'}` }, { text: `${String(st.placedCount).padStart(2, '0')}/${TL.total} PIEZAS` }]; },
  drawBays(c, TL, st) {
    const t = st.t;
    bayPiezas(c, 0, TL, st);
    let b = bayFrame(c, 1, 'BAY 02 · PIN 13', st.pin13 ? 'HIGH' : 'LOW', st.pin13 ? BAY_BG.lime : BAY_BG.grey);
    bigValue(c, b, st.pin13 ? '5.0' : '0.0', 'V', 'digitalWrite(13, …)');
    digitalTrace(c, b, TL.edges.map(([te, v]) => [te, v]), t, 4, 'D13');
    b = bayFrame(c, 2, 'BAY 03 · CORRIENTE', st.pin13 ? 'ON' : 'OFF', st.pin13 ? BAY_BG.amber : BAY_BG.grey);
    bigValue(c, b, (st.pin13 ? I_MA : 0).toFixed(1), 'mA', `(5 − ${VF.toFixed(1)}) / ${R_OHM} Ω`);
    barPair(c, b, [['LED', st.pin13 ? I_MA / 20 : 0]]);
    b = bayFrame(c, 3, 'BAY 04 · CICLOS', st.cycle ? `#${st.cycle}` : '--', st.cycle ? BAY_BG.cyan : BAY_BG.grey);
    bigValue(c, b, String(st.cycle), '', 'cada ciclo dura 2 s');
  },
  audioCues(TL) {
    const cu = [{ type: 'power', t: TL.T.switchOn }, { type: 'tab', t: TL.T.tab }, { type: 'caption', t: TL.T.caption }];
    for (const [te, v] of TL.edges) if (te > 0) cu.push({ type: 'blip', t: te, f: v ? 1568 : 1046.5, gain: 0.12, teaser: true });
    return cu;
  },
};
