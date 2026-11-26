// ---------------------------------------------------------------------------------------------
// The Optical Resolution Limit · SimuLab explainer. Six chapters from ORL.ORL_CHAPTERS (the same states
// as the web lab's guided tour), then the viewer drives pitch, NA and tilt. Every number comes from
// ORL (src/labs/optical-resolution-limit/model.js, wrapped into model.gen.js at build time).
// ---------------------------------------------------------------------------------------------
const OR_LEAD = 1.0, OR_HOLD = 3.7;
const OR_CH = ORL.ORL_CHAPTERS;
const orTilt = (p) => (p.illumination === 'dipole' ? p.sigma : 0);
const orParams = (pitch, na, tilt) => ({ wavelength: 193, pitch, na, illumination: tilt > 0.001 ? 'dipole' : 'coherent', sigma: tilt });

// morph between two chapter states: pitch on a log scale, NA and tilt linearly
function orMix(a, b, f) {
  const pitch = Math.exp(lerp(Math.log(a.pitch), Math.log(b.pitch), f));
  return orParams(pitch, lerp(a.na, b.na, f), lerp(orTilt(a), orTilt(b), f));
}
const _orCache = new Map();
function orAnalyze(p) {
  const key = `${p.pitch.toFixed(2)}|${p.na.toFixed(3)}|${p.illumination}|${p.sigma.toFixed(3)}`;
  let r = _orCache.get(key);
  if (!r) {
    r = ORL.orlAnalyze(p, { samples: 121, periods: 1, sourceGrid: 15 });
    if (_orCache.size > 4000) _orCache.clear();
    _orCache.set(key, r);
  }
  return r;
}
const orGood = (r) => r.contrast >= 0.2;

function orInsts() {
  return [
    place('orbLaser', 'laser', { code: "laser(193 /* nm */);" }),
    place('orbIlluminator', 'ill', { code: "illuminator('coherent');" }),
    place('orbMask', 'mask', { code: "mask(lines_and_spaces);" }),
    place('orbStop', 'stop', { code: "aperture_stop(NA);" }),
    place('orbLens', 'lens', { code: "projection_lens();" }),
    place('orbWafer', 'wafer', { code: "wafer(resist);" }),
  ];
}
function orTimeline(params) {
  const insts = orInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const overview = fitCam([[-56, -30, 0], [40, 30, 0], [-56, 30, 0], [40, -30, 0], [0, 0, 26], [-48, 0, 26]], 0.97);
  const base = { insts, byId, overview, live: false, tabs: [], tabAt: () => 0, params: { pitch: params.pitch ?? 120, na: params.na ?? 1.35, tilt: params.tilt ?? 0.6 } };
  if (params.live) return Object.assign(base, { T: { end: 1800, caption: null, labelsOut: 0 }, sched: {}, total: insts.length, CH: [], live: true });
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  let t = end + 0.4;
  const CH = OR_CH.map((c, i) => { const o = Object.assign({}, c, { i, t0: t }); t += OR_LEAD + OR_HOLD; o.t1 = t; return o; });
  const T = { buildEnd: end, caption: t + 0.2, labelsOut: CH[0].t0 + 0.6 }; T.end = T.caption + 4.8;
  return Object.assign(base, { T, sched, total, CH });
}
function orChapter(TL, t) { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; }

function orState(TL, t) {
  const st = { t };
  partsAt(TL, t, st);
  let p, k = -1, ch = null, u = 0, f = 1;
  if (TL.live) {
    const q = TL.params;
    p = orParams(liveVal(LIVE.ev, 'pitch', t, q.pitch), liveVal(LIVE.ev, 'na', t, q.na), liveVal(LIVE.ev, 'tilt', t, q.tilt));
  } else {
    k = orChapter(TL, t); ch = TL.CH[k];
    if (!ch) p = orParams(OR_CH[0].params.pitch, OR_CH[0].params.na, 0);
    else {
      u = t - ch.t0; f = easeInOut(clamp(u / (OR_LEAD * 0.8)));
      const prev = k > 0 ? OR_CH[k - 1].params : ch.params;
      p = orMix(prev, ch.params, f);
    }
  }
  const r = orAnalyze(p);
  Object.assign(st, { k, ch, u, f, p, r, pitch: p.pitch, na: p.na, tilt: orTilt(p), lambda: p.wavelength });
  st.img = r.intensity; st.imgMax = Math.max(1.05, r.max); st.imgOn = 1;
  st.water = clamp((p.na - 0.95) / 0.3);
  st.cam = TL.overview;
  return st;
}

// diffraction orders for one illumination direction (the first pole), and the incident beams
function orDrawRays(G, base, st, a = 1) {
  const p = st.p, h = ORB.h, S = ORB.S, poles = st.tilt > 0.001 ? [-st.tilt * p.na, st.tilt * p.na] : [0];
  const xm = ORB.xMask + 1.3, xs = ORB.xStop - 0.6, xl = ORB.xLens, xw = ORB.xWafer - 0.6;
  // laser -> illuminator, illuminator -> mask (one beam per pole; the second pole is drawn faint)
  orbRay(G, base, [ORB.xLaser + 6, 0, h], [ORB.xIll - 1.5, 0, h], '#ffb547', 0.55, a);
  poles.forEach((fs, i) => orbRay(G, base, [ORB.xIll + 1.5, -fs * S * 0.9, h], [xm - 0.3, 0, h], '#ffb547', 0.45, a * (i ? 0.35 : 1)));
  const fs = poles[0];
  for (let m = -5; m <= 5; m++) {
    const c = ORL.orlOrderAmplitude(m, 0.5); if (Math.abs(c) < 1e-6) continue;
    const fy = fs + ORL.orlOrderShift(m, p.wavelength, p.pitch), y = fy * S, pass = Math.abs(fy) <= p.na + 1e-9;
    const w = 0.22 + 0.5 * Math.abs(c), col = m === 0 ? '#fff6dc' : pass ? '#4fd8ea' : '#ff7a6b';
    if (pass) {
      orbRay(G, base, [xm, 0, h], [xs, y, h], col, w, a);
      orbRay(G, base, [xs, y, h], [xl, y, h], col, w, a);
      orbRay(G, base, [xl, y, h], [xw, 0, h], col, w, a * 0.9);
    } else {
      // stop at the blade, or at the edge of the bench if the order leaves wider than the stop
      const yEnd = clamp(y, -ORB.stopHalfMax + 0.5, ORB.stopHalfMax - 0.5), fx = (yEnd / (y || 1));
      const xEnd = Math.abs(y) <= ORB.stopHalfMax ? xs : lerp(xm, xs, fx);
      orbRay(G, base, [xm, 0, h], [xEnd, yEnd, h], col, w, a * 0.9);
      if (Math.abs(y) <= ORB.stopHalfMax) orbBlockMark(G, base, [xs - 0.4, yEnd, h], a);
    }
  }
}

const orNum = (m) => (m === 0 ? '0' : m > 0 ? `+${m}` : `−${-m}`);
const DEMO = {
  id: 'ORL', num: '01', title: 'OPTICAL RESOLUTION', tagline: 'DIFFRACT · CATCH · PRINT', category: 'OPTICS', brand: 'INTERACTIVE LABS',
  handle: 'rgcb01.github.io/labs',
  plate: ['INTERACTIVE LABS · LAB 01', 'The Optical Resolution Limit · diffraction in lithography'],
  chips: ['ArF 193 nm · LINES & SPACES · SCALAR MODEL', 'LAB 01 · OPTICS'],
  caption: 'A lens can only image what it can catch.',
  intro: { seconds: 5, lines: ['Why can’t a scanner print', 'an arbitrarily small pattern?'], pill: 'LAB 01 · OPTICS' },
  major: ['mask', 'stop', 'wafer'],
  params: { pitch: 120, na: 1.35, tilt: 0.6 },
  knobs: [
    { key: 'pitch', label: 'PITCH', min: 60, max: 400, step: 5, live: true, fmt: (v) => `${v} nm` },
    { key: 'na', label: 'NA', min: 0.5, max: 1.35, step: 0.05, live: true, fmt: (v) => v.toFixed(2) },
    { key: 'tilt', label: 'TILT σ', min: 0, max: 0.9, step: 0.05, live: true, fmt: (v) => (v > 0 ? v.toFixed(2) : 'off') },
  ],
  live: { label: '▶ Try it yourself', controls: [] },
  timeline: (p) => orTimeline(p || {}),
  steps: (TL) => [['0 · Build', 0], ...TL.CH.map((c, i) => [`${i + 1} · ${c.short}`, c.t0 - 0.05])],
  state: (TL, t) => orState(TL, t),
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -58, x1: 42, y0: -32, y1: 32, plate: 'LAB 01 · OPTICAL BENCH' });
    const base = new Xf();
    orbWater(G, base, st.water * (st.parts.wafer ?? 1));   // behind the wafer face, so drawn before it
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawFx(G, st, TL, base) {
    const a = TL.live ? 1 : clamp((st.t - TL.T.buildEnd + 0.2) / 0.5);
    orDrawRays(G, base, st, a);
  },
  labelAlpha(TL, inst, t) { return TL.live ? 0 : labelAlphaDefault(TL, inst, t); },
  drawNotes(G, st, TL) {
    const c = G.ctx, P = (q) => G.cam.p(q), ch = st.ch, r = st.r;
    const cap = !TL.live && st.t >= TL.T.caption - 0.3;
    const hold = ch ? seg(st.u, OR_LEAD * 0.85, OR_LEAD * 0.85 + 0.25) * (1 - seg(st.u, ch.t1 - ch.t0 - 0.25, ch.t1 - ch.t0)) : 0;
    const good = orGood(r), firsts = r.captured.anySource.filter(m => m !== 0);
    if (ch && !cap) {
      tipCard(c, CARD.x + 30, 146, ch.tip, hold, `${ch.i + 1} · ${ch.short.toUpperCase()}`);
      callout(c, P([ORB.xStop, -ORB.stopHalfMax + 3, ORB.h + 10]), 150, -70, firsts.length ? `ORDERS ${firsts.map(orNum).join(' ')} PASS` : '±1 ORDERS BLOCKED', hold, firsts.length ? '#7fe6f2' : '#ff9e93');
      callout(c, P([ORB.xWafer, 4, ORB.h + 6]), 120, -150, good ? `LINES PRINT · C = ${r.contrast.toFixed(2)}` : 'FLAT LIGHT · NO IMAGE', hold, good ? '#c8f04a' : '#ff9e93');
      if (st.water > 0.5) callout(c, P([ORB.xWafer - 2.6, -7.5, ORB.h + 7.5]), 150, 40, 'WATER · n ≈ 1.44', hold * st.water, '#7fe6f2');
    }
    if (TL.live) tipCard(c, CARD.x + 30, 146, good ? ['The ±1 orders reach the wafer:', `the lines print (C = ${r.contrast.toFixed(2)}).`] : ['Only the 0th order passes.', 'Raise NA, tilt the light or widen p.'], 1, 'YOUR TURN');
    if (cap) {
      const a = seg(st.t, TL.T.caption + 0.5, TL.T.caption + 0.9);
      OR_CH.forEach((cc, i) => {
        const rr2 = orAnalyze(orParams(cc.params.pitch, cc.params.na, orTilt(cc.params))), ok = orGood(rr2);
        pill(c, CARD.x + 30, 150 + i * 44, `${i + 1} · ${cc.params.pitch} nm · NA ${cc.params.na} · ${cc.params.illumination === 'dipole' ? 'DIPOLE' : 'ON AXIS'} · ${ok ? 'PRINTS' : 'NO IMAGE'}`, { bg: ok ? '#c8f04a' : '#ff9e93', size: 13, padY: 8, alpha: a * seg(st.t, TL.T.caption + 0.5 + i * 0.12, TL.T.caption + 0.8 + i * 0.12) });
      });
    }
  },
  drawBays(c, TL, st) {
    const p = st.p, r = st.r, lim = r.limits, good = orGood(r), lp = p.wavelength / p.pitch;
    // BAY 01 · pitch: lambda / p against what the lens can catch (NA, or NA (1 + sigma) with tilted light)
    const reach = p.na * (1 + st.tilt), tilted = st.tilt > 0.001;
    let b = bayFrame(c, 0, 'BAY 01 · PITCH', lp <= p.na ? 'λ/p ≤ NA' : tilted && lp <= reach ? 'λ/p ≤ NA(1+σ)' : tilted ? 'λ/p > NA(1+σ)' : 'λ/p > NA', lp <= reach ? BAY_BG.lime : BAY_BG.coral);
    bigValue(c, b, String(Math.round(p.pitch)), 'nm', `λ/p = ${lp.toFixed(2)} · NA = ${p.na.toFixed(2)}${tilted ? ` · σ ${st.tilt.toFixed(2)}` : ''}`);
    c.save();
    const bx = b.x + 14, bw = b.w - 28, by = b.y + 128, X = (v) => bx + clamp(v / 3) * bw;
    c.fillStyle = '#f4f1ea'; rr(c, bx, by, bw, 18, 9); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
    if (tilted) { c.fillStyle = 'rgba(127,230,242,0.45)'; rr(c, bx + 2, by + 2, Math.max(0, X(reach) - bx - 4), 14, 7); c.fill(); }
    c.fillStyle = '#4fc7dc'; rr(c, bx + 2, by + 2, Math.max(0, X(p.na) - bx - 4), 14, 7); c.fill();
    c.fillStyle = INK; c.fillRect(X(lp) - 1.5, by - 6, 3, 30);
    c.font = `700 9.5px ${FONT_MONO}`; c.textAlign = 'left'; c.fillStyle = '#545867';
    c.fillText(tilted ? 'NA · light band: NA(1+σ) with tilt' : 'NA: what the lens catches', bx, by + 36);
    c.textAlign = X(lp) > bx + bw - 50 ? 'right' : 'center'; c.fillStyle = INK; c.fillText(`λ/p ${lp.toFixed(2)}`, X(lp), by + 52);
    c.restore();
    // BAY 02 · pupil: copies of the source at f_s + m lambda / p, the disk is the NA
    b = bayFrame(c, 1, 'BAY 02 · PUPIL', `${r.captured.anySource.length} ORDER${r.captured.anySource.length === 1 ? '' : 'S'} IN`, r.captured.anySource.length > 1 ? BAY_BG.cyan : BAY_BG.coral);
    c.save();
    const pcx = b.x + b.w / 2, pcy = b.y + 116, sc = 30;
    c.beginPath(); c.moveTo(b.x + 14, pcy); c.lineTo(b.x + b.w - 14, pcy); c.lineWidth = 1; c.strokeStyle = 'rgba(29,32,51,0.25)'; c.stroke();
    c.beginPath(); c.arc(pcx, pcy, p.na * sc, 0, Math.PI * 2); c.fillStyle = 'rgba(127,230,242,0.25)'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    const poles = st.tilt > 0.001 ? [-st.tilt * p.na, st.tilt * p.na] : [0];
    for (let m = -4; m <= 4; m++) {
      if (Math.abs(ORL.orlOrderAmplitude(m, 0.5)) < 1e-6) continue;
      for (const fs of poles) {
        const fx = fs + ORL.orlOrderShift(m, p.wavelength, p.pitch), x = pcx + fx * sc;
        if (x < b.x + 10 || x > b.x + b.w - 10) continue;
        const inn = Math.abs(fx) <= p.na + 1e-9;
        c.beginPath(); c.arc(x, pcy, 6, 0, Math.PI * 2); c.fillStyle = inn ? (m === 0 ? '#ffffff' : '#4fd8ea') : '#ff9e93'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
      }
    }
    c.font = `400 10.5px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.textAlign = 'left';
    c.fillText('dots: diffraction orders', b.x + 14, b.y + 52); c.fillText('disk: the lens pupil, radius NA', b.x + 14, b.y + 68);
    c.restore();
    // BAY 03 · aerial image
    b = bayFrame(c, 2, 'BAY 03 · AERIAL IMAGE', good ? (r.contrast >= 0.5 ? 'STRONG' : 'WEAK') : 'FLAT', good ? BAY_BG.lime : BAY_BG.coral);
    bigValue(c, b, r.contrast.toFixed(2), 'contrast', '(Imax − Imin) / (Imax + Imin)');
    chartBox(c, b);
    c.save();
    const I = r.intensity, n = I.length, ym = Math.max(1.05, r.max);
    c.beginPath();
    for (let i = 0; i < n; i++) { const x = b.cx + 6 + (i / (n - 1)) * (b.cw - 12), y = b.cy + b.ch - 6 - (I[i] / ym) * (b.ch - 12); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.lineWidth = 2.4; c.strokeStyle = '#3a46aa'; c.stroke();
    c.restore();
    // BAY 04 · verdict and limits
    b = bayFrame(c, 3, 'BAY 04 · VERDICT', good ? 'PRINTS' : 'NO IMAGE', good ? BAY_BG.lime : BAY_BG.coral);
    c.save(); c.textBaseline = 'middle'; c.fillStyle = INK; c.font = `700 19px ${FONT_MONO}`;
    c.fillText(good ? 'LINES PRINT' : 'NO PATTERN', b.x + 14, b.y + 58);
    c.font = `400 11.5px ${FONT_MONO}`; c.fillStyle = '#545867';
    c.fillText(`k₁ = ${lim.k1.toFixed(2)}  (floor 0.25)`, b.x + 14, b.y + 86);
    c.fillText(`λ/NA        = ${lim.coherentPitch.toFixed(0)} nm`, b.x + 14, b.y + 118);
    c.fillText(`with tilt   = ${lim.currentPitch.toFixed(0)} nm`, b.x + 14, b.y + 140);
    c.fillStyle = '#c8343a'; c.fillText(`λ/(2NA)     = ${lim.absolutePitch.toFixed(1)} nm`, b.x + 14, b.y + 162);
    c.fillStyle = '#6b6f7a'; c.fillText('aerial image only · no resist', b.x + 14, b.y + 188);
    c.restore();
  },
  speedBadge(TL, st) {
    if (TL.live) return { txt: 'YOUR TURN', bg: BAY_BG.lime };
    if (!st.ch) return st.placedCount < TL.total ? { txt: 'BUILDING', bg: BAY_BG.amber } : { txt: 'READY', bg: BAY_BG.lime };
    if (st.t >= TL.T.caption) return { txt: '6 STATES · 1 WALL', bg: BAY_BG.lime };
    return { txt: `${st.ch.i + 1}/6 · ${st.ch.short.toUpperCase()}`, bg: orGood(st.r) ? BAY_BG.lime : BAY_BG.coral };
  },
  audioCues(TL) {
    if (TL.live) return [];
    const cu = buildCues(TL);
    for (const ch of TL.CH) {
      cu.push({ type: 'whoosh', t: ch.t0, t1: ch.t0 + 0.8 });
      const r = orAnalyze(orParams(ch.params.pitch, ch.params.na, orTilt(ch.params)));
      cu.push({ type: orGood(r) ? 'ding' : 'error', t: ch.t0 + OR_LEAD + 0.1 });
    }
    cu.push({ type: 'whoosh', t: TL.T.caption - 0.3, t1: TL.T.caption + 0.9 }, { type: 'caption', t: TL.T.caption });
    return cu;
  },
};
