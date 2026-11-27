// ---------------------------------------------------------------------------------------------
// Lab 003 · How can features that never print help us print better? Hook, four chapters, a two-line caption; then
// the viewer drives the assist width. Every number on screen comes from SRFD (model.js, run by prepare.mjs): the
// bare line is SRS[0], 2 x 30 nm assists the state at 30 nm, 2 x 60 nm the last state.
// ---------------------------------------------------------------------------------------------
const SR0 = srExact(0), SR30 = srExact(30), SR60 = srExact(60), SRD = SRFD.dense.windows.cdOnly;
const srN = (v) => `${Math.round(v)}`, srPct = (v) => (v == null ? '—' : `${v >= 0 ? '+' : '−'}${(Math.abs(v) * 100).toFixed(1)}`);
const SR_VERDICT = { none: ['NO ASSISTS', '#e6e2d8', '#545867'], safe: ['SAFE', '#c8f04a', SR_COL.good], marginal: ['MARGINAL', '#ffcf6b', '#b07a12'], prints: ['PRINTS', '#ff9e93', SR_COL.bad] };

function srInsts() { return [place('srafWindow', 'win', { at: SRK.L.win, code: 'process_window();' }), place('srafTerrain', 'terrain', { at: SRK.L.terrain, code: 'aerial_image();' }), place('srafMask', 'mask', { at: SRK.L.mask, code: 'photomask();' })]; }
function srPlate(layer, h = 0) { return [[SRK.X0, SRK.Y0], [SRK.X1, SRK.Y0], [SRK.X0, SRK.Y1], [SRK.X1, SRK.Y1]].map(q => srL(layer, q[0], q[1], h)); }
function srTimeline(params) {
  const insts = srInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const cams = {
    overview: fitCam([...srPlate('win', -1.2), ...srPlate('mask', 9), ...srPlate('terrain', SRK.hT)], 0.95),
    lower: fitCam([...srPlate('win', -1.2), ...srPlate('terrain', SRK.hT + 1)], 0.95),
    upper: fitCam([...srPlate('terrain', -1), ...srPlate('mask', 2)], 0.96),
    terrain: fitCam([...srPlate('terrain', -1), ...srPlate('terrain', SRK.hT)], 0.98),
    win: fitCam(srPlate('win', 0), 0.98),
  };
  const base = { insts, byId, cams, tabs: [], tabAt: () => 0, w: params.width ?? 30 };
  if (params.live) return Object.assign(base, { T: { end: 1800, caption: null, labelsOut: 0 }, sched: {}, total: insts.length, live: true });
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  const T = { buildEnd: end }; T.ch1 = end + 0.3; T.ch2 = T.ch1 + 10.5; T.ch3 = T.ch2 + 11.0; T.ch4 = T.ch3 + 9.5; T.caption = T.ch4 + 11.0; T.end = T.caption + 6.0; T.labelsOut = T.ch1 + 9.6;
  return Object.assign(base, { T, sched, total, live: false });
}
const SR_CH = [['ch1', '1 · The isolated feature'], ['ch2', '2 · Invisible helpers'], ['ch3', '3 · A wider window'], ['ch4', '4 · Helpers become defects']];
function srChapter(TL, t) { let k = -1; SR_CH.forEach(([id], i) => { if (t >= TL.T[id]) k = i; }); return k; }
const srFly = (t, a, b, t0, d = 1.4) => mixCam(a, b, easeInOut(seg(t, t0, t0 + d)));

function srState(TL, t) {
  const st = { t }; partsAt(TL, t, st);
  const C = TL.cams;
  if (TL.live) {
    const w = liveVal(LIVE.ev, 'width', t, TL.w);
    Object.assign(st, { w, ww: w, live: true, terrainOn: 1, sheetOn: 1, winOn: 1, blockOn: 1, baseOn: 1, denseOn: 0, light: 1, cam: C.overview, k: -1 });
    st.S = srExact(w); return st;
  }
  const T = TL.T, k = srChapter(TL, t);
  Object.assign(st, { k, w: 0, ww: 0, terrainOn: 0, sheetOn: 0, winOn: 0, blockOn: 0, baseOn: 1, denseOn: 0, specOn: 0, barGlow: 0, light: 0, cam: C.overview });
  if (k === 0) {   // light on: the through-focus terrain rises, the sheet cuts it, the window plate fills, dense lines for scale
    const u = t - T.ch1;
    Object.assign(st, { light: seg(u, 0, 0.6), terrainOn: easeOut(seg(u, 0.4, 2.2)), sheetOn: seg(u, 2.2, 3.0), winOn: seg(u, 4.4, 5.2), blockOn: easeOut(seg(u, 5.0, 6.0)), denseOn: seg(u, 7.2, 8.0) });
    st.cam = u < 4.0 ? srFly(t, C.overview, C.terrain, T.ch1, 1.6) : srFly(t, C.terrain, C.lower, T.ch1 + 4.0, 1.4);
  }
  if (k === 1) {   // the assist bars grow 0 -> 30 nm on the mask; the terrain answers, the dips stay above the sheet
    const u = t - T.ch2;
    Object.assign(st, { light: 1, terrainOn: 1, sheetOn: 1, winOn: 1, blockOn: 1, denseOn: 1 - seg(u, 0, 0.6), barGlow: seg(u, 1.6, 2.2) * (1 - seg(u, 8.0, 9.0)), specOn: seg(u, 6.6, 7.2) });
    st.w = 30 * easeInOut(seg(u, 1.8, 5.6));
    st.cam = u < 6.4 ? srFly(t, C.lower, C.upper, T.ch2, 1.6) : srFly(t, C.upper, C.terrain, T.ch2 + 6.4, 1.3);
  }
  if (k === 2) {   // same assists on the window plate: the 5 % EL block grows from the bare line's length
    const u = t - T.ch3;
    Object.assign(st, { light: 1 - seg(u, 0, 0.6), terrainOn: 1, sheetOn: 1, winOn: 1, blockOn: 1, w: 30, specOn: 1 - seg(u, 0, 0.5) });
    st.ww = 30 * easeInOut(seg(u, 1.8, 5.6));
    st.cam = srFly(t, C.terrain, C.win, T.ch3, 1.6);
  }
  if (k === 3) {   // the helpers get fatter: CD-only window grows, but they print and the defect-free block collapses
    const u = t - T.ch4, g = 30 + 30 * easeInOut(seg(u, 1.6, 6.8));
    Object.assign(st, { light: 0, terrainOn: 1, sheetOn: 1, winOn: 1, blockOn: 1, w: g, ww: g });
    st.cam = srFly(t, C.win, C.lower, T.ch4, 1.5);
  }
  if (t >= T.caption - 0.4) {   // back to the safe design for the big idea
    const g = 60 - 30 * easeInOut(seg(t, T.caption, T.caption + 1.6));
    Object.assign(st, { w: g, ww: g, light: seg(t, T.caption + 0.8, T.caption + 1.4) });
    st.cam = srFly(t, C.lower, camShift(C.overview, 0, -90), T.caption - 0.4, 1.4);
  }
  st.S = srExact(st.ww);
  return st;
}

function srBigNum(c, b, txt, unit, color, sub) {
  c.save(); c.textBaseline = 'alphabetic'; c.font = `700 32px ${FONT_MONO}`; c.fillStyle = color; c.fillText(txt, b.x + 14, b.y + 76);
  const w = c.measureText(txt).width; if (unit) { c.font = `700 14px ${FONT_MONO}`; c.fillStyle = '#545867'; c.fillText(unit, b.x + 20 + w, b.y + 76); }
  if (sub) { c.font = `400 11.5px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.fillText(sub, b.x + 14, b.y + 98); }
  c.restore();
}
function srBar(c, b, v0, v1, scale, col1) {
  const bx = b.x + 14, bw = b.w - 28, by = b.y + 126;
  c.save(); c.fillStyle = '#f4f1ea'; rr(c, bx, by, bw, 12, 6); c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.35)'; c.stroke();
  c.fillStyle = SR_COL.base; rr(c, bx + 2, by + 2, Math.max(2, (bw - 4) * Math.min(1, v0 / scale)), 8, 4); c.fill();
  if (v1 != null) { c.fillStyle = col1; rr(c, bx + 2, by + 20, Math.max(2, (bw - 4) * Math.min(1, v1 / scale)), 8, 4); c.fill(); }
  c.restore();
}

const DEMO = {
  id: 'SRAF', num: '03', title: 'INVISIBLE HELPERS', tagline: 'ASSIST · WIDEN · NEVER PRINT', category: 'SEMICONDUCTORS', brand: 'INTERACTIVE LABS',
  handle: 'rgcb01.github.io/labs',
  plate: ['INTERACTIVE LABS · LAB 03', 'How can features that never print help us print better?'],
  chips: ['ArF 193 nm · NA 0.85 · ANNULAR · SIMULATED', 'LAB 03 · SEMICONDUCTORS'],
  caption: null,
  intro: { seconds: 5, lines: ['The most useful features on a mask', 'are the ones we never want to print.'], pill: 'LAB 03 · SUB-RESOLUTION ASSIST FEATURES' },
  major: ['mask', 'terrain', 'win'],
  params: { width: 30 },
  knob: { key: 'width', label: 'ASSIST WIDTH', min: 0, max: 60, step: 10, live: true, fmt: (v) => (v ? `2 × ${v} nm` : 'none') },
  live: { label: '▶ Try it yourself', controls: [] },
  timeline: (p) => srTimeline(p || {}),
  steps: (TL) => [['0 · Build', 0], ...SR_CH.map(([id, name]) => [name, TL.T[id] - 0.05])],
  state: (TL, t) => srState(TL, t),
  drawScene(G, st, TL) { const base = new Xf(); drawAssembly(G, st, TL.insts, base); return base; },
  drawFx(G, st, TL, base) { srDrawGuides(G, base, 1); srDrawLight(G, base, st.light || 0); },
  labelAlpha(TL, inst, t) { return TL.live ? 0 : labelAlphaDefault(TL, inst, t); },
  drawNotes(G, st, TL) {
    const c = G.ctx, P = (layer, X, Y, h = 0) => G.cam.p(srL(layer, X, Y, h)), T = TL.T, k = st.k, S = st.S;
    const winPt = (z, E) => P('win', srX(z), srVd(E), 0.2);
    if (TL.live) {
      const [name] = SR_VERDICT[S.verdict];
      tipCard(c, CARD.x + 30, 146, [S.w ? `2 × ${S.w} nm assists: ${name}.` : 'No assists.', `Defect-free DOF ${srN(S.windows.defectFree.dof)} nm.`], 1, 'YOUR TURN');
      return;
    }
    const hold = (id, a, b) => { const u = st.t - T[id]; return seg(u, a, a + 0.3) * (1 - seg(u, b - 0.3, b)); };
    if (k === 0) {
      const u = st.t - T.ch1;
      tipCard(c, CARD.x + 30, 146, u < 4.2 ? ['One isolated 90 nm line,', 'imaged from −400 to +400 nm focus.'] : ['Its CD window is narrow:', 'it loses focus quickly.'], hold('ch1', 0.4, 10.5), '1 · THE ISOLATED FEATURE');
      callout(c, P('terrain', srX(-400), 0, SRK.hT * (1 - SR0.t0) + 0.5), -120, -60, 'THE LINE PRINTS: ABOVE THE SHEET', hold('ch1', 2.6, 4.2), '#ffffff');
      callout(c, P('terrain', srX(400), SRK.Y0, SRK.hT * (1 - SR0.t0)), 120, 50, 'RESIST THRESHOLD', hold('ch1', 2.8, 4.2), '#c9cdf0');
      const r = SR0.windows.defectFree;
      callout(c, winPt(r.z1, r.e1), 130, -70, `ISOLATED LINE: ${srN(r.dof)} nm DOF`, hold('ch1', 5.8, 10.5), '#ffcf6b');
      callout(c, winPt(SRD.z0, SRD.e1), -150, -60, `DENSE LINES: ${srN(SRD.dof)} nm`, hold('ch1', 7.8, 10.5), '#dfe6f6');
      callout(c, winPt(0, 1.25), -80, 70, 'FOCUS →', hold('ch1', 5.8, 10.5), '#ffffff');
      callout(c, winPt(400, 2.0), 100, 60, 'DOSE →', hold('ch1', 5.8, 10.5), '#ffffff');
    }
    if (k === 1) {
      const u = st.t - T.ch2;
      tipCard(c, CARD.x + 30, 146, u < 6.4 ? ['Add thin bars beside the line,', 'below the size that prints.'] : ['They reshape the light', 'but never reach the sheet.'], hold('ch2', 0.4, 11.0), '2 · INVISIBLE HELPERS');
      callout(c, P('mask', SRK.X1, srY(170), 0), 140, 40, '2 × 30 nm ASSIST BARS', hold('ch2', 2.2, 6.4), '#e6d6ff');
      callout(c, P('terrain', SRK.X1, srY(-170), SRK.hT * 0.3), 150, 80, `BUMPS STAY ≥ ${(SR30.margin * 100).toFixed(1)} % BELOW THE SHEET`, hold('ch2', 7.4, 11.0), '#e6d6ff');
      srDrawSpectrum(c, CARD.x + 30, 640, 400, 200, st.specOn ?? 0);
    }
    if (k === 2) {
      tipCard(c, CARD.x + 30, 146, ['Same line, same optics,', 'a wider defect-free window.'], hold('ch3', 0.4, 9.5), '3 · A WIDER WINDOW');
      const r = srRect(st.ww), a = hold('ch3', 5.8, 9.5);
      callout(c, winPt(r.z1, r.e1), 130, -80, `DEFECT-FREE DOF ${srN(SR0.windows.defectFree.dof)} → ${srN(SR30.windows.defectFree.dof)} nm`, a, '#c8f04a');
      callout(c, winPt(SR0.windows.defectFree.z0, SR0.windows.defectFree.e0), -120, 80, '- - WITHOUT ASSISTS', a, '#ffcf6b');
      pill(c, CARD.x + CARD.w - 28, 112, '5 % EXPOSURE LATITUDE · CD ±10 %', { align: 'right', bg: '#7fe6f2', size: 10.5, padY: 5, alpha: hold('ch3', 1.0, 9.5) });
    }
    if (k === 3) {
      const u = st.t - T.ch4;
      tipCard(c, CARD.x + 30, 146, u < 6.8 ? ['Make the helpers bigger', 'to push the window further?'] : ['They print. The CD window grows,', 'the defect-free window collapses.'], hold('ch4', 0.4, 11.0), '4 · HELPERS BECOME DEFECTS');
      pill(c, CARD.x + CARD.w - 28, 112, `ASSISTS 2 × ${srExact(st.ww).w} nm`, { align: 'right', bg: '#e6d6ff', size: 11, padY: 6, alpha: hold('ch4', 1.2, 11.0) });
      const a = hold('ch4', 7.0, 11.0), g = SR60.windows.cdOnly;
      callout(c, P('terrain', SRK.X0, srY(-185), SRK.hT * (1 - SR60.t0)), -140, 70, 'ASSISTS POKE THROUGH: THEY PRINT', a, '#ff9e93');
      callout(c, winPt(g.z1, g.e1), 120, -90, `CD-ONLY ${srN(g.dof)} nm · DEFECT-FREE ${srN(SR60.windows.defectFree.dof)} nm`, a, '#ff9e93');
    }
    if (st.t >= T.caption - 0.2) {
      const a = seg(st.t, T.caption + 1.8, T.caption + 2.2);
      [[`DEFECT-FREE DOF ${srN(SR0.windows.defectFree.dof)} → ${srN(SR30.windows.defectFree.dof)} nm WITH SAFE ASSISTS`, '#c8f04a'], [`OVERSIZED ASSISTS PRINT: ${srN(SR60.windows.defectFree.dof)} nm`, '#ff9e93']].forEach(([txt, bg], i) =>
        pill(c, CARD.x + 30, 150 + i * 44, txt, { bg, size: 13, padY: 8, alpha: a * seg(st.t, T.caption + 1.8 + i * 0.15, T.caption + 2.1 + i * 0.15) }));
    }
  },
  // two-line caption (the kit's caption is one line): the central message of the lab
  drawOverCard(c, st, TL) {
    if (TL.live || st.t < TL.T.caption) return;
    const f = easeOut(clamp((st.t - TL.T.caption) / 0.45)), l1 = 'Better lithography is not just about printing the right shape.', l2 = 'It is about printing it reliably.';
    c.save(); c.globalAlpha = f; c.font = `700 22px ${FONT_MONO}`; c.letterSpacing = '0px';
    const y = 880 + (1 - f) * 18, x = VIEW.cx, w = Math.max(c.measureText(l1).width, c.measureText(l2).width) + 56, h = 92;
    c.fillStyle = 'rgba(29,32,51,0.22)'; rr(c, x - w / 2 + 4, y - h / 2 + 5, w, h, 16); c.fill();
    c.fillStyle = '#fffdf8'; rr(c, x - w / 2, y - h / 2, w, h, 16); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(l1, x, y - 17); c.fillStyle = '#e8590c'; c.fillText(l2, x, y + 19);
    c.restore();
    pill(c, x - w / 2 + 22, y - h / 2 - 14, 'THE BIG IDEA', { bg: '#ff7a1a', fg: '#fff', size: 11, padY: 5, ls: 2, alpha: f });
  },
  drawBays(c, TL, st) {
    const k = st.k, live = TL.live, S = st.S, B = SR0, show = live || k >= 0, has = S.w > 0;
    const [vName, vBg, vCol] = SR_VERDICT[S.verdict], status = !show ? ['NOT YET', BAY_BG.grey] : [vName, vBg];
    const rows = [['BAY 01 · DEFECT-FREE DOF', 'defectFree'], ['BAY 02 · CD-ONLY DOF', 'cdOnly']];
    rows.forEach(([title, key], i) => {
      const b = bayFrame(c, i, title, status[0], status[1]);
      if (!show || (k === 0 && (st.winOn ?? 0) < 0.5)) { srBigNum(c, b, '—', '', '#9a9eaa'); return; }
      const v = S.windows[key].dof, col = !has ? SR_COL.base : key === 'defectFree' && S.verdict === 'prints' ? SR_COL.bad : SR_COL.good;
      srBigNum(c, b, srN(v), 'nm', col, has ? `no assists ${srN(B.windows[key].dof)} nm` : 'bare isolated line');
      srBar(c, b, B.windows[key].dof, has ? v : null, 450, col);
      c.save(); c.font = `400 11px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.textBaseline = 'alphabetic'; c.fillText(key === 'defectFree' ? '5 % EL · CD ±10 % · nothing else prints' : '5 % EL · CD ±10 % · ignores defects', b.x + 14, b.y + 190); c.restore();
    });
    const b3 = bayFrame(c, 2, 'BAY 03 · ASSIST MARGIN', status[0], status[1]);
    if (show && has) srBigNum(c, b3, srPct(S.margin), '%', vCol, 'worst assist, above threshold'); else srBigNum(c, b3, '—', '', '#9a9eaa', show ? 'no assists yet' : '');
    c.save(); c.font = `400 11px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.textBaseline = 'alphabetic'; c.fillText('≥ 10 % = safe (heuristic)', b3.x + 14, b3.y + 190); c.restore();
    const b4 = bayFrame(c, 3, 'BAY 04 · ASSISTS', status[0], status[1]);
    if (show) { srBigNum(c, b4, has ? `2 × ${S.w}` : 'none', has ? 'nm' : '', has ? '#7b45d6' : '#9a9eaa', has ? '110 nm from the line' : ''); }
    else srBigNum(c, b4, '—', '', '#9a9eaa');
    c.save(); c.font = `400 11px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.textBaseline = 'alphabetic'; c.fillText('per side · 200 nm bar pitch', b4.x + 14, b4.y + 190); c.restore();
  },
  speedBadge(TL, st) {
    if (TL.live) return { txt: 'YOUR TURN', bg: BAY_BG.lime };
    if (st.k < 0) return st.placedCount < TL.total ? { txt: 'BUILDING THE STACK', bg: BAY_BG.amber } : { txt: 'READY', bg: BAY_BG.lime };
    if (st.t >= TL.T.caption) return { txt: 'SIMULATED · SAME OPTICS', bg: BAY_BG.lime };
    return { txt: SR_CH[st.k][1].toUpperCase(), bg: st.k === 3 ? BAY_BG.coral : st.k === 2 ? BAY_BG.lime : BAY_BG.cyan };
  },
  audioCues(TL) {
    if (TL.live) return [];
    const T = TL.T, cu = buildCues(TL);
    cu.push({ type: 'whoosh', t: T.ch1, t1: T.ch1 + 0.8 }, { type: 'power', t: T.ch1 + 0.2 }, { type: 'ding', t: T.ch1 + 5.0 });
    cu.push({ type: 'whoosh', t: T.ch2, t1: T.ch2 + 0.9 }, { type: 'whir', t: T.ch2 + 1.8, t1: T.ch2 + 5.6, f: 120, gain: 0.04 }, { type: 'ding', t: T.ch2 + 7.4 });
    cu.push({ type: 'whoosh', t: T.ch3, t1: T.ch3 + 0.9 }, { type: 'whir', t: T.ch3 + 1.8, t1: T.ch3 + 5.6, f: 150, gain: 0.04 }, { type: 'ding', t: T.ch3 + 5.8 });
    cu.push({ type: 'whoosh', t: T.ch4, t1: T.ch4 + 0.9 }, { type: 'whir', t: T.ch4 + 1.6, t1: T.ch4 + 6.8, f: 90, gain: 0.04 }, { type: 'error', t: T.ch4 + 7.0 });
    cu.push({ type: 'whoosh', t: T.caption - 0.3, t1: T.caption + 0.9 }, { type: 'caption', t: T.caption });
    return cu;
  },
};
