// ---------------------------------------------------------------------------------------------
// Lab 002 · Why We Intentionally Distort Photomasks. Hook, four chapters, caption; then the viewer drives
// OPC strength. Every number on screen comes from OPCD (model.js, run by prepare.mjs): the uncorrected state is
// OPS[0], the full model-based correction OPS[OPN], and the morph walks the exact 5 % states in between.
// ---------------------------------------------------------------------------------------------
const OP0 = OPS[0].m, OP1 = OPS[OPN].m;
const opIso = OPCD.polys.find(p => p.id === 'iso'), opElbow = OPCD.polys.find(p => p.id === 'elbow'), opDense = OPCD.polys.find(p => p.id === 'dense1');
const opXs = (p) => p.pts.map(q => q[0]), opYs = (p) => p.pts.map(q => q[1]);
const OP_ISO_TIP = [(Math.min(...opXs(opIso)) + Math.max(...opXs(opIso))) / 2, Math.max(...opYs(opIso))];
const OP_CORNER = opElbow.pts[5], OP_DENSE_TOP = [(Math.min(...opXs(opDense)) + Math.max(...opXs(opDense))) / 2, Math.max(...opYs(opDense))];
const opF = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;

function opInsts() { return [place('opcWafer', 'wafer', { at: OPK.L.wafer, code: 'wafer();' }), place('opcTerrain', 'terrain', { at: OPK.L.terrain, code: 'aerial_image();' }), place('opcMask', 'mask', { at: OPK.L.mask, code: 'photomask();' })]; }
function opPlate(layer, h = 0) { const w = OPCD.win; return [[w[0], w[1]], [w[2], w[1]], [w[0], w[3]], [w[2], w[3]]].map(q => opL(layer, q[0], q[1], h)); }
function opTimeline(params) {
  const insts = opInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const cams = {
    overview: fitCam([...opPlate('wafer', -1.2), ...opPlate('mask', 9), ...opPlate('terrain', OPK.hTerrain)], 0.95),
    lower: fitCam([...opPlate('wafer', -1.2), ...opPlate('terrain', OPK.hTerrain + 1)], 0.95),
    upper: fitCam([...opPlate('terrain', -1), ...opPlate('mask', 2)], 0.96),
    mask: fitCam(opPlate('mask', 0), 0.98),
    wafer: fitCam(opPlate('wafer', 0), 0.98),
    // close-up on the wafer: isolated line end and the elbow's outer corner
    waferZoom: fitCam([opL('wafer', OP_ISO_TIP[0] - 260, OP_ISO_TIP[1] - 260), opL('wafer', OP_ISO_TIP[0] - 260, OP_ISO_TIP[1] + 110), opL('wafer', OP_CORNER[0] + 380, OP_CORNER[1] - 320), opL('wafer', OP_CORNER[0] + 380, OP_CORNER[1] + 120)], 1.0),
    maskZoom: fitCam([opL('mask', OP_ISO_TIP[0] - 260, OP_ISO_TIP[1] - 300), opL('mask', OP_ISO_TIP[0] - 260, OP_ISO_TIP[1] + 120), opL('mask', OP_CORNER[0] + 400, OP_CORNER[1] - 340), opL('mask', OP_CORNER[0] + 400, OP_CORNER[1] + 120)], 1.0),
  };
  const base = { insts, byId, cams, tabs: [], tabAt: () => 0, g: params.strength ?? 1 };
  if (params.live) return Object.assign(base, { T: { end: 1800, caption: null, labelsOut: 0 }, sched: {}, total: insts.length, live: true });
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  const T = { buildEnd: end }; T.ch1 = end + 0.3; T.ch2 = T.ch1 + 8.0; T.ch3 = T.ch2 + 12.5; T.ch4 = T.ch3 + 12.5; T.caption = T.ch4 + 10.5; T.end = T.caption + 5.2; T.labelsOut = T.ch1 + 7.4;
  return Object.assign(base, { T, sched, total, live: false });
}
const OP_CH = [['ch1', '1 · The ideal pattern'], ['ch2', '2 · Reality is different'], ['ch3', '3 · Distort the mask'], ['ch4', '4 · A better print']];
function opChapter(TL, t) { let k = -1; OP_CH.forEach(([id], i) => { if (t >= TL.T[id]) k = i; }); return k; }
const fly = (t, a, b, t0, d = 1.4) => mixCam(a, b, easeInOut(seg(t, t0, t0 + d)));

function opState(TL, t) {
  const st = { t }; partsAt(TL, t, st);
  const C = TL.cams;
  if (TL.live) {
    const g = liveVal(LIVE.ev, 'strength', t, TL.g);
    Object.assign(st, { g, terrainOn: 1, sheetOn: 1, targetOn: 1, uncOn: 0.9, corOn: 1, epeOn: 1, epeState: 'after', epeGain: 2, terrainCol: 'cor', glow: 0.8, light: 1, cam: C.overview, k: -1 });
    st.m = opStateAt(g).m; return st;
  }
  const T = TL.T, k = opChapter(TL, t);
  Object.assign(st, { k, g: 0, terrainOn: 0, sheetOn: 0, targetOn: 1, uncOn: 0, corOn: 0, epeOn: 0, epeState: 'before', epeGain: 2, terrainCol: 'unc', glow: 0, maskTargetOn: 0, light: 0, cam: C.overview });
  if (k === 0) { st.maskTargetOn = 0; st.cam = C.overview; }
  if (k === 1) {   // light on: the terrain rises, the threshold sheet slides in, the print appears; then close-up
    const u = t - T.ch2;
    st.light = seg(u, 0, 0.6); st.terrainOn = easeOut(seg(u, 0.3, 2.0)); st.sheetOn = seg(u, 2.0, 2.8); st.uncOn = seg(u, 2.8, 3.4); st.epeOn = seg(u, 5.6, 6.2);
    st.cam = u < 5 ? fly(t, C.overview, C.lower, T.ch2, 1.6) : fly(t, C.lower, C.waferZoom, T.ch2 + 5, 1.4);
  }
  if (k === 2) {   // the mask bends: model-based OPC from 0 to 100 %
    const u = t - T.ch3;
    Object.assign(st, { light: 1 - seg(u, 9.0, 9.6), terrainOn: 1, sheetOn: 1, uncOn: 1, epeOn: 1 - seg(u, 0, 0.6) });
    st.g = easeInOut(seg(u, 2.2, 8.2)); st.glow = seg(u, 2.2, 3.0); st.maskTargetOn = seg(u, 1.2, 2.0); st.terrainCol = st.g > 0.5 ? 'cor' : 'unc';
    st.cam = u < 9.0 ? fly(t, C.waferZoom, C.upper, T.ch3, 1.6) : fly(t, C.upper, C.maskZoom, T.ch3 + 9.0, 1.3);
  }
  if (k === 3) {   // same optics, both prints on the wafer
    const u = t - T.ch4;
    Object.assign(st, { light: 0, terrainOn: 1, sheetOn: 1, g: 1, glow: 0.8, terrainCol: 'cor', uncOn: 1, corOn: seg(u, 0.8, 1.6), epeOn: seg(u, 3.2, 3.8), epeState: 'after' });
    st.cam = u < 4.2 ? fly(t, C.maskZoom, C.wafer, T.ch4, 1.6) : fly(t, C.wafer, C.waferZoom, T.ch4 + 4.2, 1.4);
  }
  if (t >= T.caption - 0.4) { st.cam = fly(t, C.waferZoom, C.overview, T.caption - 0.4, 1.4); st.light = seg(t, T.caption + 0.8, T.caption + 1.4); }
  st.m = opStateAt(st.g).m;
  return st;
}

function opBayVal(c, b, before, after, unit, mode, d = 1) {
  c.save(); c.textBaseline = 'alphabetic';
  if (mode === 'none') { c.font = `700 30px ${FONT_MONO}`; c.fillStyle = '#9a9eaa'; c.fillText('—', b.x + 14, b.y + 76); c.restore(); return; }
  c.font = `700 32px ${FONT_MONO}`; c.fillStyle = mode === 'after' ? OPC_COL.cor : OPC_COL.unc;
  const v = mode === 'after' ? after : before; const txt = unit === '%' ? `${Math.round(v * 100)}` : opF(v, d).replace('+', unit === 'nmAbs' ? '' : '+');
  c.fillText(txt, b.x + 14, b.y + 76); const w = c.measureText(txt).width;
  c.font = `700 14px ${FONT_MONO}`; c.fillStyle = '#545867'; c.fillText(unit === '%' ? '%' : 'nm', b.x + 20 + w, b.y + 76);
  if (mode === 'after') { c.font = `400 11.5px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; const was = unit === '%' ? `${Math.round(before * 100)} %` : `${opF(before, d).replace('+', unit === 'nmAbs' ? '' : '+')} nm`; c.fillText(`was ${was} · uncorrected`, b.x + 14, b.y + 98); }
  c.restore();
}

const DEMO = {
  id: 'OPC', num: '02', title: 'DISTORTED MASKS', tagline: 'DIFFRACT · CORRECT · PRINT', category: 'SEMICONDUCTORS', brand: 'INTERACTIVE LABS',
  handle: 'rgcb01.github.io/labs',
  plate: ['INTERACTIVE LABS · LAB 02', 'Why we intentionally distort photomasks · OPC'],
  chips: ['ArF 193 nm · NA 0.93 · σ 0.5 · SIMULATED', 'LAB 02 · SEMICONDUCTORS'],
  caption: 'To print the right shape, draw the wrong one.',
  intro: { seconds: 5, lines: ['Sometimes, printing the correct shape', 'requires designing the wrong one.'], pill: 'LAB 02 · OPTICAL PROXIMITY CORRECTION' },
  major: ['mask', 'terrain', 'wafer'],
  params: { strength: 1 },
  knob: { key: 'strength', label: 'OPC STRENGTH', min: 0, max: 1, step: 0.05, live: true, fmt: (v) => `${Math.round(v * 100)} %` },
  live: { label: '▶ Try it yourself', controls: [] },
  timeline: (p) => opTimeline(p || {}),
  steps: (TL) => [['0 · Build', 0], ...OP_CH.map(([id, name]) => [name, TL.T[id] - 0.05])],
  state: (TL, t) => opState(TL, t),
  drawScene(G, st, TL) {
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawFx(G, st, TL, base) { opDrawGuides(G, base, st.guides ?? 1); opDrawLight(G, base, st.light || 0); },
  labelAlpha(TL, inst, t) { return TL.live ? 0 : labelAlphaDefault(TL, inst, t); },
  drawNotes(G, st, TL) {
    const c = G.ctx, P = (layer, x, y, h = 0) => G.cam.p(opL(layer, x, y, h)), T = TL.T, k = st.k;
    if (TL.live) { tipCard(c, CARD.x + 30, 146, [`OPC strength ${Math.round(st.g * 100)} %:`, `RMS edge error ${st.m.rms.toFixed(1)} nm.`], 1, 'YOUR TURN'); return; }
    const hold = (id, a, b) => { const u = st.t - T[id]; return seg(u, a, a + 0.3) * (1 - seg(u, b - 0.3, b)); };
    if (k === 0) {
      tipCard(c, CARD.x + 30, 146, ['The mask is drawn exactly', 'like the pattern the chip needs.'], hold('ch1', 0.4, 8.0), '1 · THE IDEAL PATTERN');
      const a = hold('ch1', 1.2, 7.8), z = 'wafer';
      callout(c, P(z, OP_DENSE_TOP[0], OP_DENSE_TOP[1] - 200), -150, 70, 'DENSE LINES', a, '#ffffff');
      callout(c, P(z, OP_ISO_TIP[0], OP_ISO_TIP[1] - 300), -60, 120, 'ISOLATED LINE', a, '#ffffff');
      callout(c, P(z, OP_ISO_TIP[0], OP_ISO_TIP[1]), -170, -40, 'LINE END', a, '#ffffff');
      callout(c, P(z, OP_CORNER[0], OP_CORNER[1]), 120, -60, 'RIGHT-ANGLE CORNER', a, '#ffffff');
      callout(c, P('mask', OPCD.win[2] - 300, OPCD.win[1]), 150, 50, 'MASK = TARGET', a, '#ffffff');
    }
    if (k === 1) {
      tipCard(c, CARD.x + 30, 146, ['Light diffracts. The resist keeps', 'only what stays below the line.'], hold('ch2', 0.4, 5.0), '2 · REALITY IS DIFFERENT');
      callout(c, P('terrain', OPCD.win[2], OPCD.win[1], OPK.hTerrain * OPCD.thr), 120, 40, 'RESIST THRESHOLD', hold('ch2', 2.4, 5.0), '#c9cdf0');
      const a = hold('ch2', 6.2, 12.5), z = 'wafer';
      callout(c, P(z, OP_ISO_TIP[0], OP_ISO_TIP[1]), -230, -60, `LINE END ${opF(OP0.lineEnd)} nm`, a, '#ffcf6b');
      callout(c, P(z, OP_CORNER[0], OP_CORNER[1]), 150, -90, `CORNER ${opF(OP0.outerCorner)} nm`, a, '#ffcf6b');
      callout(c, P(z, OP_ISO_TIP[0] + 50, 0), 160, 70, `ISO LINE ${opF(OP0.isoDense)} nm WIDER THAN DENSE`, hold('ch2', 9.4, 12.5), '#ffffff');
      pill(c, CARD.x + CARD.w - 28, 112, 'ERRORS DRAWN 2× LONGER', { align: 'right', bg: '#ff9e93', size: 10.5, padY: 5, alpha: hold('ch2', 6.2, 12.5) });
    }
    if (k === 2) {
      const u = st.t - T.ch3;
      tipCard(c, CARD.x + 30, 146, u < 8.4 ? ['Move every mask edge', 'against its own error.'] : ['Nobody drew these shapes.', 'The model grew them.'], hold('ch3', 0.4, 12.5), '3 · DISTORT THE MASK');
      pill(c, CARD.x + CARD.w - 28, 112, `OPC STRENGTH ${Math.round(st.g * 100)} %`, { align: 'right', bg: '#7fe6f2', size: 11, padY: 6, alpha: seg(u, 1.8, 2.3) });
      const a = hold('ch3', 9.6, 12.5), z = 'mask';
      callout(c, P(z, OP_ISO_TIP[0], OP_ISO_TIP[1] + 20), -200, -70, 'HAMMERHEAD', a, '#ffffff');
      callout(c, P(z, OP_CORNER[0] - 25, OP_CORNER[1] + 25), 170, -80, 'SERIF', a, '#ffffff');
      callout(c, P(z, OP_ISO_TIP[0] - 55, 0), -230, 60, 'EDGE BIAS', a, '#ffffff');
    }
    if (k === 3) {
      tipCard(c, CARD.x + 30, 146, ['Same light, same resist.', 'The print lands on the target.'], hold('ch4', 0.4, 10.5), '4 · A BETTER PRINT');
      const z = 'wafer';
      callout(c, P(z, OP_CORNER[0], OP_CORNER[1]), 150, -90, `CORNER STILL ROUND: ${opF(OP1.outerCorner)} nm`, hold('ch4', 5.8, 10.5), '#ffffff');
      callout(c, P(z, OP_ISO_TIP[0], OP_ISO_TIP[1]), -110, -110, `LINE END ${opF(OP0.lineEnd)} → ${opF(OP1.lineEnd)} nm`, hold('ch4', 5.8, 10.5), '#c8f04a');
      pill(c, CARD.x + CARD.w - 28, 112, 'ERRORS DRAWN 2× LONGER', { align: 'right', bg: '#ff9e93', size: 10.5, padY: 5, alpha: hold('ch4', 3.2, 10.5) });
      const la = seg(st.t - T.ch4, 1.4, 2.0) * (1 - seg(st.t, T.caption - 0.6, T.caption - 0.2));
      pill(c, CARD.x + 30, 236, '— ORIGINAL MASK', { bg: '#ffffff', fg: OPC_COL.unc, size: 12, padY: 6, alpha: la });
      pill(c, CARD.x + 30, 272, '— CORRECTED MASK', { bg: '#ffffff', fg: OPC_COL.cor, size: 12, padY: 6, alpha: la });
      pill(c, CARD.x + 30, 308, '- - TARGET', { bg: '#ffffff', fg: OPC_COL.target, size: 12, padY: 6, alpha: la });
    }
    if (!TL.live && st.t >= T.caption - 0.2) {
      const a = seg(st.t, T.caption + 0.5, T.caption + 0.9);
      [[`RMS EDGE ERROR ${OP0.rms.toFixed(1)} → ${OP1.rms.toFixed(1)} nm`, '#c8f04a'], [`SITES WITHIN ±5 nm ${Math.round(OP0.within * 100)} → ${Math.round(OP1.within * 100)} %`, '#c8f04a'], [`OUTER CORNER ${opF(OP0.outerCorner)} → ${opF(OP1.outerCorner)} nm · STILL ROUND`, '#ffcf6b']].forEach(([txt, bg], i) =>
        pill(c, CARD.x + 30, 150 + i * 44, txt, { bg, size: 13, padY: 8, alpha: a * seg(st.t, T.caption + 0.5 + i * 0.15, T.caption + 0.8 + i * 0.15) }));
    }
  },
  drawBays(c, TL, st) {
    const k = st.k, live = TL.live, mode = live ? 'after' : k <= 0 ? 'none' : k === 1 ? 'before' : k === 2 ? (st.g < 0.98 ? 'live' : 'after') : 'after';
    const M = st.m, cur = (key) => (mode === 'live' ? M[key] : null);
    const status = mode === 'none' ? ['NO PRINT YET', BAY_BG.grey] : mode === 'before' ? ['ORIGINAL MASK', BAY_BG.amber] : mode === 'live' ? [`OPC ${Math.round(st.g * 100)} %`, BAY_BG.cyan] : ['CORRECTED', BAY_BG.lime];
    const rows = [['BAY 01 · RMS EDGE ERROR', 'rms', 'nmAbs', 'over 644 edge sites'], ['BAY 02 · LINE-END TIP', 'lineEnd', 'nm', 'EPE at tip · − = short'], ['BAY 03 · OUTER CORNER', 'outerCorner', 'nm', 'diagonal · − = rounded'], ['BAY 04 · WITHIN ±5 nm', 'within', '%', 'share of edge sites']];
    rows.forEach(([title, key, unit, sub], i) => {
      const b = bayFrame(c, i, title, status[0], status[1]);
      if (mode === 'live') {
        c.save(); c.textBaseline = 'alphabetic'; c.font = `700 32px ${FONT_MONO}`; c.fillStyle = '#1d2033';
        const v = cur(key), txt = unit === '%' ? `${Math.round(v * 100)}` : unit === 'nmAbs' ? v.toFixed(1) : opF(v); c.fillText(txt, b.x + 14, b.y + 76);
        const w = c.measureText(txt).width; c.font = `700 14px ${FONT_MONO}`; c.fillStyle = '#545867'; c.fillText(unit === '%' ? '%' : 'nm', b.x + 20 + w, b.y + 76); c.restore();
      } else opBayVal(c, b, OP0[key], live ? M[key] : OP1[key], unit, mode);
      c.save(); c.font = `400 11px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.textBaseline = 'alphabetic'; c.fillText(sub, b.x + 14, b.y + 190); c.restore();
      // small bar: uncorrected vs current
      if (mode !== 'none') {
        const scale = key === 'within' ? 1 : key === 'rms' ? 12 : 30, v0 = Math.abs(OP0[key]) / scale, v1 = Math.abs((mode === 'before' ? OP0 : M)[key]) / scale;
        const bx = b.x + 14, bw = b.w - 28, by = b.y + 126;
        c.save(); c.fillStyle = '#f4f1ea'; rr(c, bx, by, bw, 12, 6); c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.35)'; c.stroke();
        c.fillStyle = OPC_COL.unc; rr(c, bx + 2, by + 2, Math.max(2, (bw - 4) * Math.min(1, v0)), 8, 4); c.fill();
        if (mode !== 'before') { c.fillStyle = OPC_COL.cor; rr(c, bx + 2, by + 20, Math.max(2, (bw - 4) * Math.min(1, v1)), 8, 4); c.fill(); }
        c.restore();
      }
    });
  },
  speedBadge(TL, st) {
    if (TL.live) return { txt: 'YOUR TURN', bg: BAY_BG.lime };
    if (st.k < 0) return st.placedCount < TL.total ? { txt: 'BUILDING THE STACK', bg: BAY_BG.amber } : { txt: 'READY', bg: BAY_BG.lime };
    if (st.t >= TL.T.caption) return { txt: 'SIMULATED · SAME OPTICS', bg: BAY_BG.lime };
    return { txt: OP_CH[st.k][1].toUpperCase(), bg: st.k === 1 ? BAY_BG.coral : st.k === 3 ? BAY_BG.lime : BAY_BG.cyan };
  },
  audioCues(TL) {
    if (TL.live) return [];
    const T = TL.T, cu = buildCues(TL);
    cu.push({ type: 'whoosh', t: T.ch1, t1: T.ch1 + 0.8 }, { type: 'whoosh', t: T.ch2, t1: T.ch2 + 0.9 }, { type: 'power', t: T.ch2 + 0.2 }, { type: 'error', t: T.ch2 + 6.2 });
    cu.push({ type: 'whoosh', t: T.ch3, t1: T.ch3 + 0.9 }, { type: 'whir', t: T.ch3 + 2.2, t1: T.ch3 + 8.2, f: 110, gain: 0.04 }, { type: 'ding', t: T.ch3 + 8.3 });
    cu.push({ type: 'whoosh', t: T.ch4, t1: T.ch4 + 0.9 }, { type: 'ding', t: T.ch4 + 1.6 }, { type: 'whoosh', t: T.caption - 0.3, t1: T.caption + 0.9 }, { type: 'caption', t: T.caption });
    return cu;
  },
};
