// ---------------------------------------------------------------------------
// Lab 02 · MULTÍMETRO. Guided lab: one chapter per function of an autoranging multimeter.
// ---------------------------------------------------------------------------
const MM_DIAL_NAME = { OFF: 'OFF', VAC: 'V~', VDC: 'V DC', mV: 'mV', OHM: 'Ω', CAP: 'CAP', HZ: 'Hz %', TEMP: '°C', uA: 'µA', mA: 'mA', A: '10A' };
const MM_COMP = { vdc: 'PILA 9V', vac: 'CONTACTO', ohm: 'R 220', cont: 'BOTÓN', diode: 'LED', cap: 'C 100µ', hz: 'PIN 9', temp: 'CAFÉ', ma: 'LED', big: 'MOTOR' };
const MM_CONN = { paralelo: ['EN PARALELO', 'V'], serie: ['EN SERIE', 'A'], apagado: ['SIN ENERGÍA', 'Ω'], descargado: ['DESCARGADO', 'F'], termopar: ['TERMOPAR K', '°C'] };

const MM_TC_WIRE = [[2.0, 8.4, 4.1], [4.0, 11.5, 0.8], [12.0, 6.0, 0.4], [16.5, -6.0, 0.4], [16.2, -8.4, 5.0], [15.3, -9.6, 10.1], [13.9, -11.0, 10.4], [13.3, -11.7, 9.45]];

const DEMO = {
  brand: 'KAPRI LAB',
  id: 'MULTIMETRO', num: '02', title: 'MULTÍMETRO', tagline: 'MIDE · PRUEBA · ENTIENDE', category: 'INSTRUMENTOS',
  plate: ['KAPRI LAB · MULTÍMETRO · LAB 02', 'Lab 02 · las 10 funciones de un multímetro autorango'],
  chips: ['MULTÍMETRO · PILA 9V · CONTACTO · PROTO · UNO · CAFÉ', 'LAB 02'],
  caption: 'Voltaje en paralelo, corriente en serie, resistencia sin energía.',
  intro: { seconds: 5, lines: ['Tu multímetro mide', '10 cosas. ¿Las conoces?'], pill: 'LAB 02 · MULTÍMETRO', src: (TL) => TL.by.cont.t0 + 2.4, rate: 0.8 },
  major: [],
  timeline: () => mmTimeline(),
  steps: (TL) => [['0 · Armar', 0], ...TL.CH.map((c, i) => [`${i + 1} · ${c.btn}`, c.t0 - 0.05])],
  state: (TL, t) => mmState(TL, t),
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -22, x1: 32, y0: -18, y1: 31, plate: 'BANCO · LAB 02' });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawFx(G, st, TL, base) {
    const P = st.probe, pl = st.plugs;
    if (st.tc.a > 0.01) drawThermocouple(G, TL.byId.dmm.xf(base), st.tc, MM_TC_WIRE.map((p, i) => (i ? p : add3(p, [0, 0, st.tc.dz]))));
    drawPlug(G, pl.blk.p, M.blk, pl.blk.dz, pl.blk.a);
    drawPlug(G, pl.red.p, M.red, pl.red.dz, pl.red.a);
    drawLead(G, pl.blk.p, pl.blk.dz, probeTop(P.b, P.aB), P.aB, NEGRO, Math.min(P.alpha, pl.blk.a));
    drawLead(G, pl.red.p, pl.red.dz, probeTop(P.r, P.aR), P.aR, ROJO, Math.min(P.alpha, pl.red.a));
    const pr = [[P.r, P.aR, M.red], [P.b, P.aB, M.blk]].sort((a, b) => dot3(a[0], VC) - dot3(b[0], VC));
    for (const [tip, ax, col] of pr) drawProbe(G, base, tip, ax, col, P.alpha);
  },
  labelAlpha(TL, inst, t) {
    const c = TL.CH[mmChapter(TL, t)];
    if (!c) return labelAlphaDefault(TL, inst, t);
    if (inst.id !== c.lab) return 0;
    const u = t - c.t0; return seg(u, 1.9, 2.25) * (1 - seg(u, c.dur - 0.3, c.dur));
  },
  drawNotes(G, st, TL, base) {
    const c = G.ctx, ch = st.ch, u = st.u, S = (p) => G.cam.p(base.p(p)), dmm = TL.byId.dmm, J = (n) => S(dmm.pin(n).p);
    if (!ch || st.t >= TL.T.caption - 0.2) return;
    const fade = (a, b) => seg(u, a, a + 0.25) * (1 - seg(u, b - 0.25, b));
    if (ch.id === 'anat') {
      const out = ch.dur - 0.3;
      callout(c, S([0, -6.3, 3.3]), 170, -70, 'PANTALLA: la lectura', fade(0.5, out));
      callout(c, S([2.85, -3.3, 3.5]), 190, -12, 'HOLD · SELECT · RANGE · REL', fade(1.0, out));
      callout(c, S([3.0, 1.1, 3.9]), 170, 46, 'PERILLA: qué vas a medir', fade(1.5, out));
      callout(c, J('10A'), -200, -76, '10A: corriente grande', fade(2.1, out));
      callout(c, J('mA'), -230, -8, 'µA mA: corriente chica', fade(2.4, out));
      callout(c, J('COM'), -150, 96, 'COM: negro, siempre', fade(2.7, out), '#c8f04a');
      callout(c, J('V'), 130, 110, 'VΩ Hz: rojo, casi todo', fade(3.0, out), '#c8f04a');
    } else if (ch.id === 'ma') {
      callout(c, J('mA'), -220, -40, 'MUEVE EL ROJO AL JACK mA', fade(0.3, 2.6), '#ffcf6b');
    } else if (ch.id === 'big') {
      callout(c, J('10A'), -150, -95, 'MÁS CORRIENTE: JACK 10A', fade(0.3, ch.dur), '#ff9e93');
      callout(c, S([3.42, 1.1, 3.3]), 150, -50, 'µA: corriente muy chica', fade(0.7, ch.dur));
      callout(c, J('V'), 130, 110, 'AL TERMINAR: ROJO A VΩ', fade(2.0, ch.dur), '#c8f04a');
    }
    // tip card under the plate
    const a = ch.id === 'anat' ? fade(3.4, ch.dur) : fade(2.0, ch.dur - 0.1);
    if (ch.tip) tipCard(c, CARD.x + 30, 146, ch.tip, a);
  },
  drawBays(c, TL, st) {
    const ch = st.ch, on = st.lcd && !st.lcd.blank, pos = st.dialPos;
    let b = bayFrame(c, 0, 'BAY 01 · PANTALLA', on ? (st.lcd.hold ? 'HOLD' : 'EN VIVO') : 'APAGADO', on ? BAY_BG.lime : BAY_BG.grey);
    c.save(); c.fillStyle = '#16181e'; rr(c, b.x + 12, b.y + 40, b.w - 24, b.h - 52, 12); c.fill(); c.restore();
    drawLCD(c, b.x + 20, b.y + 48, b.w - 40, b.h - 68, st.lcd || { blank: true });
    // perilla y puntas
    const fnName = st.fn ? MM_FN.find(f => f[0] === st.fn)[1] : ch && ch.id === 'big' ? 'CORRIENTE GRANDE' : pos === 'OFF' ? 'APAGADO' : 'LISTO';
    b = bayFrame(c, 1, 'BAY 02 · PERILLA Y PUNTAS', MM_DIAL_NAME[pos], pos === 'OFF' ? BAY_BG.grey : BAY_BG.cyan);
    c.save(); c.fillStyle = '#1d2033'; rr(c, b.x + 14, b.y + 42, 64, 64, 12); c.fill(); c.restore();
    dmmFnIcon(c, st.fn || (ch && ch.id === 'big' ? 'big' : 'off'), b.x + 46, b.y + 74, 30, '#c8f04a');
    c.save(); c.fillStyle = INK; c.font = `700 15px ${FONT_MONO}`; c.letterSpacing = '0.5px'; c.textBaseline = 'middle'; c.fillText(fnName, b.x + 92, b.y + 64);
    c.fillStyle = '#6b6f7a'; c.font = `400 11.5px ${FONT_MONO}`; c.fillText(`perilla en ${MM_DIAL_NAME[pos]}`, b.x + 92, b.y + 88); c.restore();
    const row = (y, col, who, jack, hl) => {
      if (hl) { c.save(); c.fillStyle = '#ffcf6b'; rr(c, b.x + 12, y - 13, b.w - 24, 26, 8); c.fill(); c.restore(); }
      c.save(); c.fillStyle = col; c.beginPath(); c.arc(b.x + 26, y, 6.5, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; c.font = `700 12.5px ${FONT_MONO}`; c.letterSpacing = '0.5px'; c.textBaseline = 'middle'; c.fillText(`${who}  →  ${jack}`, b.x + 42, y + 0.5); c.restore();
    };
    const tcOn = st.tc.a > 0.5;
    row(b.y + 140, NEGRO, 'NEGRO', tcOn ? 'COM (termopar -)' : 'COM', false);
    row(b.y + 172, ROJO, 'ROJO ', tcOn ? 'VΩ (termopar +)' : st.redJack === 'mA' ? 'µA mA' : st.redJack === 'moving' ? 'cambiando...' : 'VΩ Hz', st.redJack !== 'V');
    // cómo se conecta
    const conn = ch && ch.conn;
    b = bayFrame(c, 2, 'BAY 03 · CÓMO SE CONECTA', conn ? MM_CONN[conn][0] : '--', conn === 'serie' ? BAY_BG.amber : conn ? BAY_BG.cyan : BAY_BG.grey);
    if (conn) {
      c.save(); c.fillStyle = INK; c.font = `700 19px ${FONT_MONO}`; c.letterSpacing = '0.5px'; c.textBaseline = 'middle'; c.fillText(MM_CONN[conn][0], b.x + 16, b.y + 66); c.restore();
      if (conn === 'termopar') {
        c.save(); c.fillStyle = '#545867'; c.font = `400 12px ${FONT_MONO}`; c.fillText('un sensor que convierte calor', b.x + 16, b.y + 116); c.fillText('en milivolts; el multímetro', b.x + 16, b.y + 136); c.fillText('los traduce a °C', b.x + 16, b.y + 156); c.restore();
      } else connDiagram(c, b, conn, MM_COMP[ch.fn || ch.id] || '', MM_CONN[conn][1]);
    } else { c.save(); c.fillStyle = '#6b6f7a'; c.font = `400 12px ${FONT_MONO}`; c.fillText('elige una función', b.x + 16, b.y + 70); c.restore(); }
    // funciones
    const n = st.done.size;
    b = bayFrame(c, 3, 'BAY 04 · FUNCIONES', `${n}/10`, n >= 10 ? BAY_BG.lime : n ? BAY_BG.amber : BAY_BG.grey);
    const cw = (b.w - 28 - 4 * 8) / 5, chh = 50;
    MM_FN.forEach(([id], i) => {
      const x = b.x + 14 + (i % 5) * (cw + 8), y = b.y + 42 + Math.floor(i / 5) * (chh + 8), done = st.done.has(id), cur = st.fn === id;
      c.save(); c.fillStyle = done ? '#c8f04a' : '#fffdf8'; rr(c, x, y, cw, chh, 9); c.fill(); c.lineWidth = cur ? 3.2 : 1.4; c.strokeStyle = cur ? '#ff7a1a' : INK; c.stroke(); c.restore();
      dmmFnIcon(c, id, x + cw / 2, y + chh / 2, 22, done || cur ? INK : '#9aa0ab');
    });
    c.save(); c.fillStyle = INK; c.font = `700 12px ${FONT_MONO}`; c.letterSpacing = '0.8px'; c.textBaseline = 'middle';
    c.fillText(n >= 10 ? 'LAS 10, DOMINADAS' : st.fn ? `AHORA: ${MM_FN.find(f => f[0] === st.fn)[1]}` : 'PRÓXIMA: VOLTAJE DC', b.x + 16, b.y + 184); c.restore();
  },
  speedBadge(TL, st) {
    const ch = st.ch;
    if (!ch) return { txt: 'ARMANDO', bg: BAY_BG.amber };
    if (st.t >= TL.T.caption) return { txt: '10/10 · LISTO', bg: BAY_BG.lime };
    if (ch.id === 'anat') return { txt: 'CONOCE TU MULTÍMETRO', bg: BAY_BG.cyan };
    if (ch.id === 'big') return { txt: '10A · µA', bg: BAY_BG.coral };
    const i = MM_FN.findIndex(f => f[0] === st.fn);
    return { txt: `${i + 1}/10 · ${MM_FN[i][1]}`, bg: BAY_BG.lime };
  },
  audioCues(TL) {
    const cu = [], CH = TL.CH, by = TL.by;
    let prev = 'OFF', pc = null;
    for (const c of CH) {
      cu.push({ type: 'whoosh', t: c.t0, t1: c.t0 + 0.95 });
      const n = Math.abs(MM_IDX[c.dial] - MM_IDX[prev]), [da, db] = mmDialWin(c, pc);
      for (let i = 0; i < n; i++) cu.push({ type: 'detent', t: c.t0 + da + ((db - da) * (i + 0.5)) / n });
      prev = c.dial; pc = c;
    }
    cu.push({ type: 'power', t: by.vdc.t0 + 0.5 });
    for (const [, at] of TL.presses) cu.push({ type: 'detent', t: at, gain: 0.32 });
    for (const at of [by.anat.t0 + 3.85, by.anat.t0 + 4.25, by.temp.t0 + 1.25, by.temp.t0 + 5.6, by.ma.t0 + 1.35, by.big.t0 + 3.05]) cu.push({ type: 'plug', t: at });
    for (const at of Object.values(TL.settle)) cu.push({ type: 'blip', t: at, f: 2093, gain: 0.05 });
    cu.push({ type: 'beep', t: by.cont.t0 + 3.0, t1: by.cont.t0 + 4.4, f: 2700, gain: 0.05, teaser: true });
    for (let n = 0; ; n++) { const te = TL.unoOn + 2 * n; if (te > by.big.t0 + 2.0) break; if (te >= by.ma.t0 + 1.6) cu.push({ type: 'blip', t: te, f: 1318.5, gain: 0.04 }); }
    const nOff = MM_IDX[CH[CH.length - 1].dial];
    for (let i = 0; i < nOff; i++) cu.push({ type: 'detent', t: TL.T.caption + 0.6 + (0.6 * (i + 0.5)) / nOff });
    cu.push({ type: 'whoosh', t: TL.T.caption - 0.3, t1: TL.T.caption + 0.9 }, { type: 'caption', t: TL.T.caption });
    return cu;
  },
};
