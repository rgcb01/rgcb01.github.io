// Catálogo: every asset in the library, built one by one, then idle animations.
function catalogInsts() {
  const bb = place('protoboard400', 'bb400', { at: [-13, -3, 0], label: 'protoboard400' });
  const mid = (a, b) => { const p = bb.pin(a).p, q = bb.pin(b).p; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, p[2]]; };
  const d = [26, -20, 0], sh = (o) => [o[0] + d[0], o[1] + d[1], o[2] + d[2]];
  const L = [
    place('uno', 'uno', { at: [-14, 11, 0], group: 'floor', layer: 0, label: 'uno' }),
    place('esp32', 'esp32', { at: [-1, 11, 0], group: 'floor', label: 'esp32', layer: 0 }),
    place('servoSG90', 'servo', { at: [11, 11, 0], angleKey: 'servo', label: 'servoSG90' }),
    bb,
    place('led5', 'led_r', { at: mid('f5', 'f6'), color: 'R', litKey: 'blink', label: 'led5 (R)' }),
    place('led5', 'led_g', { at: mid('f9', 'f10'), color: 'G', litKey: 'blink2', label: null }),
    place('led5', 'led_b', { at: mid('f13', 'f14'), color: 'B', litKey: 'blink', label: null }),
    place('resistencia', 'res', { at: mid('b5', 'b9'), ohm: 220, label: 'resistencia (220 Ω)' }),
    place('boton', 'boton', { at: [bb.pin('e18').p[0] + 0.127, 0 - 3, 0.85], pressKey: 'press', label: 'boton' }),
    place('potenciometro', 'pot', { at: bb.pin('h22').p, angleKey: 'pot', label: 'potenciometro' }),
    place('buzzer', 'buzzer', { at: mid('c26', 'c29'), label: 'buzzer' }),
    place('l298n', 'l298n', { at: [3, -2, 0], label: 'l298n' }),
    place('soporteSensor', 'soporte', { at: [12.5, -2, 0], label: null }),
    place('hcsr04', 'sonar', { at: [13.08, -2, 0.25], label: 'hcsr04' }),
    place('portapilas2x18650', 'bat', { at: [-12, -15, 0], label: 'portapilas2x18650' }),
    place('interruptor', 'sw', { at: [-3, -15, 0], label: 'interruptor' }),
    place('protoboard170', 'bb170', { at: [3, -15, 0], label: 'protoboard170' }),
    place('soporteTT_der', 'sop', { at: sh([-4.5, 6.95, 2.45]), label: null }),
    place('motorTT_der', 'motor', { at: sh([-2.9, 5.85, 2.2]), label: 'motorTT_der' }),
    place('rueda65_der', 'rueda', { at: sh([-4.5, 8.6, 3.25]), spin: 'spin', label: 'rueda65_der' }),
    place('ruedaLoca', 'loca', { at: [24, -9, 0], label: 'ruedaLoca' }),
    place('multimetro', 'dmm', { at: [26, 9, 0], label: 'multimetro' }),
    place('pila9v', 'pila9v', { at: [7, -21, 0], label: 'pila9v' }),
    place('capacitor', 'cap', { at: mid('b15', 'b16'), label: 'capacitor' }),
    place('multicontacto', 'strip', { at: [-6, -28, 0], label: 'multicontacto' }),
    place('taza', 'taza', { at: [12, -28, 0], label: 'taza' }),
    place('estacionSoldar', 'estacion', { at: [43, -6, 0], label: 'estacionSoldar' }),
    place('baseCautin', 'basecautin', { at: [43, 10, 0], label: 'baseCautin' }),
    place('placaPractica', 'placa', { at: [30, -24, 0], label: 'placaPractica' }),
    place('cautin', 'cautinCat', { at: [52, -15, 0], label: 'cautin' }),
    place('tuboSoldadura', 'tuboCat', { at: [50, 2, 0], label: 'tuboSoldadura' }),
    place('fuenteBanco', 'fuenteCat', { at: [70, -6, 0], label: 'fuenteBanco' }),
    place('placaCarga', 'placaCargaCat', { at: [64, 16, 0], tag: 'A', text: 'LED + 220 Ω', res: true, label: 'placaCarga' }),
    place('caiman', 'caimanCat', { at: [86, 10, 0], label: 'caiman' }),
  ];
  L.find(i => i.id === 'bat').opts.cells = ['cell1', 'cell2'];
  L.push(cable('cable_demo', ['uno', 'D9'], ['bb400', 'j3'], AMARILLO, { label: "cable(a, b, color)" }));
  for (const i of L) if (i.group === 'wheel' || i.group === 'under' || i.group === 'host') i.group = 'floor';
  resolveCables(L);
  return L;
}
const DEMO = {
  id: 'CATALOGO', num: '··', title: 'ASSETS', tagline: 'PIEZAS · CABLES · PROTOBOARD', category: 'BIBLIOTECA',
  plate: ['KAPRI LAB · CATÁLOGO', 'cada pieza con su id: place(tipo, id, { at, rot })'],
  chips: ['placas · módulos · componentes · movimiento', 'KAPRI LAB'],
  major: ['uno', 'esp32', 'servo', 'bb400', 'led_r', 'res', 'boton', 'pot', 'buzzer', 'l298n', 'sonar', 'bat', 'sw', 'bb170', 'motor', 'rueda', 'loca', 'cable_demo', 'estacion', 'basecautin', 'placa', 'cautinCat', 'tuboCat', 'fuenteCat', 'placaCargaCat', 'caimanCat'],
  timeline() {
    const insts = catalogInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
    const { sched, end, total } = scheduleBuild(insts, 0.3);
    const T = { buildEnd: end, end: end + 6 };
    const names = Object.fromEntries(insts.map(i => [i.id, i.name]));
    return { T, sched, total, insts, byId, tabs: [armadoTab(autoArmado(insts, 'lab', '// catálogo de KAPRI LAB'), sched, total, names, { __power: end })], tabAt: () => 0 };
  },
  state(TL, t) {
    const st = { t, power: t > TL.T.buildEnd ? 1 : 0, serial: [] };
    partsAt(TL, t, st);
    const u = Math.max(0, t - TL.T.buildEnd);
    st.blink = st.power ? (Math.floor(u * 2) % 2 === 0 ? 1 : 0) : 0; st.blink2 = st.power ? 1 - st.blink : 0;
    st.servo = 0.5 + 0.5 * Math.sin(u * 1.6); st.pot = 0.5 + 0.45 * Math.sin(u * 1.1); st.press = st.power ? (Math.sin(u * 3) > 0.6 ? 1 : 0) : 0;
    st.spin = u * 4; st.gpio2 = st.blink; st.pin13 = st.blink;
    st.estacion = { on: st.power, temp: 340, set: 340, ready: 1 };
    st.U = [{ wet: 0, ball: 2.4, s: 0.1 }, { wet: 2.7, s: 1, res: 0.8, heat: 0.15 * st.power }, { wet: 2.6, s: 1, oxid: 0.9, lift: 1, res: 1, burn: 0.8 }, null];
    st.cam = mixCam([13, 14, -2, 1], [14, 14, -2, 1], smooth(t / TL.T.end));
    return st;
  },
  drawScene(G, st, TL) { drawTapete(G, st, { x0: -24, x1: 62, y0: -34, y1: 22, plate: 'CATÁLOGO · KAPRI LAB' }); const base = new Xf(); drawAssembly(G, st, TL.insts, base); return base; },
  labelAlpha(TL, i, t) { const s = TL.sched[i.id]; return s ? clamp((t - s.t0 - 0.1) / 0.2) : 0; },
};
