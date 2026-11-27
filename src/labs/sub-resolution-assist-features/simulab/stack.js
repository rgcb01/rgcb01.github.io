// ---------------------------------------------------------------------------------------------
// Exploded lithography stack for Lab 003 (own design, schematic). Three floating plates share one axis, focus:
//   photomask (top): dark glass, the white 90 nm line and the purple assist bars, all running along the focus axis
//   aerial image through focus (middle): blurred intensity I(x, z) as a terrain, cut by the resist threshold sheet
//   process window (bottom): focus x dose, the CD window, where assists print, and the 5 % EL block (its length = DOF)
// World cm, z up. Focus: 1 cm = 50 nm (-400..400 nm along x). Position across the line: 1 cm = 35 nm (-450..450 nm
// along y). The middle plate is drawn as 1 - I (resist that remains stands up), so anything that prints pokes up
// through the threshold sheet. Dose on the window plate: 1.1..3.5 along y. Everything drawn reads SRFD (precomputed by prepare.mjs from
// model.js); between two exact 5 nm width steps only the drawing is interpolated.
// ---------------------------------------------------------------------------------------------
const SRK = { nm: 50, nmY: 35, hT: 8, hBlock: 1.3, X0: -8, X1: 8, Y0: -SRFD.terrain.xs / 35, Y1: SRFD.terrain.xs / 35, E0: 1.1, E1: 3.5, L: { win: [0, 0, 0], terrain: [19, -19, 19], mask: [38, -38, 38] } };
const SR_COL = { target: '#2f6fe0', mask: '#ffffff', assist: '#9b5cff', base: '#ff8a1f', good: '#1fae5c', bad: '#e5303f', dense: '#6f7ea3', glass: '#283149' };
const srY = (x) => x / SRK.nmY, srX = (z) => z / SRK.nm, srVd = (E) => SRK.Y0 + (E - SRK.E0) / (SRK.E1 - SRK.E0) * (SRK.Y1 - SRK.Y0);   // nm / dose -> plate cm
const srL = (layer, X, Y, h = 0) => { const o = SRK.L[layer]; return [o[0] + X, o[1] + Y, o[2] + h]; };

// ---- decode the precomputed states ------------------------------------------------------------------
function srB64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
const SRS = SRFD.states.map(s => { const u = srB64(s.terrain), T = new Float32Array(u.length); for (let i = 0; i < u.length; i++) T[i] = u[i] / 255 * SRFD.terrain.scale; return { ...s, T }; });
const SRN = SRS.length - 1, SR_STEP = SRFD.widths[1] - SRFD.widths[0];
const srExact = (w) => SRS[Math.max(0, Math.min(SRN, Math.round(w / SR_STEP)))];        // numbers: nearest exact state
function srPair(w) { const f = Math.max(0, Math.min(SRN, w / SR_STEP)), a = Math.floor(f), b = Math.min(SRN, a + 1); return [SRS[a], SRS[b], f - a]; }
const srLerp = (a, b, f) => a + (b - a) * f;
function srTerrain(w) { const [A, B, f] = srPair(w); if (f < 1e-6) return A.T; const o = new Float32Array(A.T.length); for (let i = 0; i < o.length; i++) o[i] = A.T[i] + (B.T[i] - A.T[i]) * f; return o; }
const srThr = (w) => { const [A, B, f] = srPair(w); return srLerp(A.t0, B.t0, f); };
function srRows(w) { const [A, B, f] = srPair(w); return A.rows.map((r, i) => { const q = B.rows[i]; return [r[0], r[1] && q[1], srLerp(r[2], q[2], f), srLerp(r[3], q[3], f), srLerp(r[4], q[4], f)]; }); }
function srRect(w, key = 'defectFree') {        // visual interpolation of the DOF rectangle; a 0 nm window shrinks to its neighbour's centre
  const [A, B, f] = srPair(w), a = A.windows[key], b = B.windows[key];
  const c = (r, o) => (r.dof > 0 ? r : { dof: 0, z0: 0, z1: 0, e0: (o.e0 + o.e1) / 2, e1: (o.e0 + o.e1) / 2 });
  const p = c(a, b.dof > 0 ? b : a), q = c(b, a.dof > 0 ? a : b);
  return { dof: srLerp(p.dof, q.dof, f), z0: srLerp(p.z0, q.z0, f), z1: srLerp(p.z1, q.z1, f), e0: srLerp(p.e0, q.e0, f), e1: srLerp(p.e1, q.e1, f) };
}
const srBars = (w) => { const h = SRFD.params.cd / 2, s = 110, p = 200; return w <= 0 ? [] : [[h + s, h + s + w], [h + s + p, h + s + p + w]].flatMap(([a, b]) => [[a, b], [-b, -a]]); };

// ---- assets ------------------------------------------------------------------------------------------
const SR_WIN_M = { light: '#f7f3ea', mid: '#e6dfcf', dark: '#c4bba8' }, SR_BASE_M = { light: '#eef0f4', mid: '#c9ced8', dark: '#9aa1b0' }, SR_GLASS_M = { light: '#3a4563', mid: '#2a3248', dark: '#1c2233' };
const SR_GOOD_M = { light: '#8fe8b0', mid: '#3ddc84', dark: '#1f9e57' }, SR_BASE_BLOCK_M = { light: '#ffc58f', mid: '#ff9f43', dark: '#d27321' };

function srBand(c, rows, lo, hi, fill) {         // filled polygon between two dose curves over the rows where both exist
  let seg = [];
  const flush = () => { if (seg.length > 1) { c.beginPath(); seg.forEach((r, i) => (i ? c.lineTo : c.moveTo).call(c, srX(r[0]) - SRK.X0, srVd(hi(r)) - SRK.Y0)); for (let i = seg.length - 1; i >= 0; i--) c.lineTo(srX(seg[i][0]) - SRK.X0, srVd(lo(seg[i])) - SRK.Y0); c.closePath(); c.fillStyle = fill; c.fill(); } seg = []; };
  for (const r of rows) { if (r[1] && hi(r) > lo(r)) seg.push(r); else flush(); }
  flush();
}
function srEdge(c, sp, rows, f, color, w, dash) {
  c.save(); c.beginPath(); let on = false;
  for (const r of rows) { if (!r[1]) { on = false; continue; } const u = srX(r[0]) - SRK.X0, v = srVd(f(r)) - SRK.Y0; on ? c.lineTo(u, v) : c.moveTo(u, v); on = true; }
  if (dash) c.setLineDash(dash); sp(w, color); c.restore();
}
function srRectPath(c, r) { c.beginPath(); c.rect(srX(r.z0) - SRK.X0, srVd(r.e0) - SRK.Y0, srX(r.z1) - srX(r.z0), srVd(r.e1) - srVd(r.e0)); }

defineAsset('srafWindow', {
  name: 'process window', label: 'PROCESS WINDOW · FOCUS × DOSE', group: 'floor', layer: 0, O: [0, 0, 0], anchor: [SRK.X0, SRK.Y1, 0], ring: null, lab: [-4, 6, 4],
  draw(G, xf, st) {
    const on = st.winOn ?? 0, w = st.ww ?? 0, rows = srRows(w), base = SRS[0], cur = srExact(w);
    drawBox(G, xf, [SRK.X0, SRK.Y0, -1.0], [SRK.X1, SRK.Y1, 0], SR_WIN_M, {
      lw: 2,
      top: (c, sp) => {
        c.beginPath(); c.rect(0, 0, SRK.X1 - SRK.X0, SRK.Y1 - SRK.Y0); c.clip();     // keep every curve on the plate
        c.save(); c.beginPath();      // focus grid every 200 nm, dose grid every 0.5
        for (const z of [-400, -200, 0, 200, 400]) { c.moveTo(srX(z) - SRK.X0, 0); c.lineTo(srX(z) - SRK.X0, SRK.Y1 - SRK.Y0); }
        for (let E = 1.5; E < SRK.E1; E += 0.5) { c.moveTo(0, srVd(E) - SRK.Y0); c.lineTo(SRK.X1 - SRK.X0, srVd(E) - SRK.Y0); }
        sp(0.8, 'rgba(29,32,51,0.18)'); c.restore();
        if (on <= 0.01) return;
        c.save(); c.globalAlpha = on;
        const none = w < 0.5;
        srBand(c, rows, r => r[2], r => r[3], 'rgba(160,166,186,0.40)');                                                       // CD-only window
        srBand(c, rows, r => Math.max(r[2], r[4]), r => r[3], none ? 'rgba(255,138,31,0.55)' : 'rgba(31,174,92,0.55)');         // defect-free
        srBand(c, rows, r => r[2], r => Math.min(r[3], r[4]), 'rgba(229,48,63,0.70)');                                         // an assist prints
        srEdge(c, sp, rows, r => r[3], '#545867', 1.2); srEdge(c, sp, rows, r => r[2], '#545867', 1.2);
        if (!none) srEdge(c, sp, rows, r => r[4] * (1 + SRFD.params.safeMargin), SR_COL.assist, 1.6, [0.35, 0.25]);            // 10 % safe floor
        if ((st.denseOn ?? 0) > 0.01) { c.globalAlpha = on * st.denseOn; const d = SRFD.dense.rows; srEdge(c, sp, d, r => r[3], SR_COL.dense, 2, [0.45, 0.3]); srEdge(c, sp, d, r => r[2], SR_COL.dense, 2, [0.45, 0.3]); srRectPath(c, SRFD.dense.windows.cdOnly); c.setLineDash([0.45, 0.3]); sp(2.4, SR_COL.dense); c.setLineDash([]); c.globalAlpha = on; }
        if (!none && (st.baseOn ?? 1) > 0.01) { c.globalAlpha = on * (st.baseOn ?? 1); srRectPath(c, base.windows.defectFree); c.setLineDash([0.4, 0.28]); sp(2.4, SR_COL.base); c.setLineDash([]); c.globalAlpha = on; }
        if (cur.verdict === 'prints' && w > 32) { const g = srRect(w, 'cdOnly'); srRectPath(c, g); c.setLineDash([0.4, 0.28]); sp(2.2, '#1d2033'); c.setLineDash([]); }
        c.restore();
      },
    });
    const bl = (st.blockOn ?? 0) * on; if (bl <= 0.01) return;
    const r = srRect(w); if (r.dof < 3) return;
    drawBox(G, xf, [srX(r.z0), srVd(r.e0), 0], [srX(r.z1), srVd(r.e1), SRK.hBlock * bl], w < 0.5 ? SR_BASE_BLOCK_M : SR_GOOD_M, { lw: 1.6 });
  },
});

defineAsset('srafTerrain', {
  name: 'aerial image', label: 'RESIST THROUGH FOCUS · 1 − INTENSITY', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [SRK.X0, SRK.Y1, 0], ring: null, lab: [-4, 6, 4],
  draw(G, xf, st) {
    drawBox(G, xf, [SRK.X0, SRK.Y0, -1.0], [SRK.X1, SRK.Y1, 0], SR_BASE_M, { lw: 1.8 });
    const on = st.terrainOn ?? 0; if (on <= 0.001) return;
    const w = st.w ?? 0, T = srTerrain(w), thr = srThr(w), nx = SRFD.terrain.nx, nz = SRFD.terrain.nz, H = SRK.hT * on, c = G.ctx, bars = srBars(w);
    const xs = SRFD.terrain.xs, zs = SRFD.terrain.zs, dx = 2 * xs / (nx - 1), dz = 2 * zs / (nz - 1);
    const P = (a, b, v) => G.cam.p(xf.p([srX(-zs + a * dz), srY(-xs + b * dx), 0.05 + H * (1 - v)]));
    const goodCol = w < 0.5 ? [[196, 106, 35], [247, 186, 130]] : [[36, 140, 82], [143, 220, 170]];
    // back to front: the viewer sits at +x +y, so small a + b is farthest
    for (let s = 0; s <= nz + nx - 4; s++) for (let a = Math.max(0, s - (nx - 2)); a <= Math.min(nz - 2, s); a++) {
      const b = s - a, v00 = T[a * nx + b], v10 = T[(a + 1) * nx + b], v11 = T[(a + 1) * nx + b + 1], v01 = T[a * nx + b + 1];
      const v = (v00 + v10 + v11 + v01) / 4, dzx = (v10 + v11 - v00 - v01) / 2, dzy = (v01 + v11 - v00 - v10) / 2, x = -xs + (b + 0.5) * dx;
      const shade = clamp(0.62 + 2.2 * (dzx * 0.4 - dzy * 0.6), 0.25, 1);
      let col;
      if (v < thr) col = Math.abs(x) < 80 ? mixRgb(goodCol[0], goodCol[1], 0.4 + 0.6 * shade) : mixRgb([170, 22, 40], [255, 110, 120], 0.4 + 0.6 * shade);   // prints
      else {
        const k = clamp((v - thr) / (1.15 - thr)), nearBar = bars.some(([p, q]) => x > p - 20 && x < q + 20);
        col = mixRgb(nearBar ? mixRgb([176, 124, 255], [214, 196, 250], k) : mixRgb([204, 200, 222], [250, 246, 236], k), [110, 106, 140], 1 - shade);
      }
      const pts = [P(a, b, v00), P(a + 1, b, v10), P(a + 1, b + 1, v11), P(a, b + 1, v01)];
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q < 4; q++) c.lineTo(pts[q][0], pts[q][1]); c.closePath();
      c.fillStyle = rgbCss(col); c.fill(); c.lineWidth = 0.6; c.strokeStyle = rgbCss(col); c.stroke();
    }
    const sh = st.sheetOn ?? 0;
    if (sh > 0.01) {       // resist threshold sheet at the design's dose-to-size
      const z = 0.05 + H * (1 - thr), corner = [[SRK.X0, SRK.Y0], [SRK.X1, SRK.Y0], [SRK.X1, SRK.Y1], [SRK.X0, SRK.Y1]].map(q => G.cam.p(xf.p([q[0], q[1], z])));
      c.save(); c.globalAlpha = sh; c.beginPath(); corner.forEach((q, k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath();
      c.fillStyle = 'rgba(58,70,170,0.16)'; c.fill(); c.setLineDash([7, 5]); c.lineWidth = 1.8; c.strokeStyle = '#3a46aa'; c.stroke(); c.setLineDash([]); c.restore();
    }
  },
});

defineAsset('srafMask', {
  name: 'photomask', label: 'PHOTOMASK · LINE + ASSIST BARS', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [SRK.X0, SRK.Y1, 0], ring: null, lab: [-4, 6, 4],
  draw(G, xf, st) {
    drawBox(G, xf, [SRK.X0, SRK.Y0, -1.0], [SRK.X1, SRK.Y1, 0], SR_GLASS_M, {
      lw: 2,
      top: (c, sp) => {
        const h = SRFD.params.cd / 2, W = SRK.X1 - SRK.X0, V = (x) => srY(x) - SRK.Y0;
        c.fillStyle = '#eef1f7'; c.fillRect(0, V(-h), W, V(h) - V(-h));
        const bars = srBars(st.w ?? 0), glow = st.barGlow ?? 0;
        if (bars.length) {
          c.save(); c.fillStyle = (st.w ?? 0) > 42 && (st.k === 3 || st.live) ? '#c08bff' : '#b07cff';
          if (glow > 0.01) { c.shadowColor = `rgba(176,124,255,${0.9 * glow})`; c.shadowBlur = 16; }
          for (const [p, q] of bars) c.fillRect(0, V(p), W, Math.max(0.02, V(q) - V(p))); c.restore();
        }
      },
    });
  },
});

// light: short beams above the mask, and faint guides tying the same corner through the stack
function srDrawLight(G, base, a) {
  if (a <= 0.01) return;
  const c = G.ctx; c.save(); c.globalAlpha = a;
  for (const [X, Y] of [[SRK.X0 + 2, SRK.Y0 + 3], [SRK.X1 - 2, SRK.Y0 + 3], [SRK.X0 + 2, SRK.Y1 - 3], [SRK.X1 - 2, SRK.Y1 - 3], [0, SRK.Y0 + 5], [0, SRK.Y1 - 5]]) {
    const A = G.cam.p(base.p(srL('mask', X, Y, 9))), B = G.cam.p(base.p(srL('mask', X, Y, 1.5)));
    c.strokeStyle = '#ffb547'; c.lineWidth = 3; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
    c.fillStyle = '#ffb547'; c.beginPath(); c.moveTo(B[0], B[1] + 6); c.lineTo(B[0] - 5, B[1] - 3); c.lineTo(B[0] + 5, B[1] - 3); c.closePath(); c.fill();
  }
  c.restore();
}
function srDrawGuides(G, base, a) {
  if (a <= 0.01) return;
  const c = G.ctx; c.save(); c.globalAlpha = a; c.setLineDash([4, 6]); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.38)';
  for (const [X, Y] of [[SRK.X0, SRK.Y1], [SRK.X1, SRK.Y0], [SRK.X1, SRK.Y1], [SRK.X0, SRK.Y0]]) {
    const pts = ['win', 'terrain', 'mask'].map(l => G.cam.p(base.p(srL(l, X, Y, 0))));
    c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke();
  }
  c.restore();
}
// small 2D inset: |M(f)|^2 without and with the recommended assists, and the band annular light images focus-tolerantly
function srDrawSpectrum(c, x, y, w, h, a) {
  if (a <= 0.01) return;
  const S = SRFD.spectrum, p = SRFD.params, max = Math.max(...S.none, ...S.recommended) * 1.08, X = (f) => x + 16 + (f + 2) / 4 * (w - 32), Y = (v) => y + h - 30 - v / max * (h - 62);
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(29,32,51,0.18)'; rr(c, x + 4, y + 5, w, h, 14); c.fill();
  c.fillStyle = '#fffdf8'; rr(c, x, y, w, h, 14); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
  c.fillStyle = 'rgba(155,92,255,0.16)'; for (const s of [-1, 1]) { const f0 = s * 2 * p.sigmaIn, f1 = s * 2 * p.sigmaOut; c.fillRect(Math.min(X(f0), X(f1)), y + 30, Math.abs(X(f1) - X(f0)), h - 60); }
  const line = (arr, col, lw, dash) => { c.beginPath(); S.f.forEach((f, i) => (i ? c.lineTo(X(f), Y(arr[i])) : c.moveTo(X(f), Y(arr[i])))); c.setLineDash(dash || []); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); c.setLineDash([]); };
  line(S.none, SR_COL.base, 2, [6, 4]); line(S.recommended, SR_COL.good, 2.6);
  c.font = `700 10.5px ${FONT_MONO}`; c.fillStyle = '#2a2d3a'; c.textBaseline = 'middle'; c.fillText('MASK SPECTRUM |M(f)|²', x + 16, y + 17);
  c.font = `400 10px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.fillText('frequency × λ/NA', x + 16, y + h - 13);
  c.fillStyle = '#7b45d6'; c.textAlign = 'right'; c.fillText('purple: focus-tolerant band', x + w - 16, y + h - 13);
  c.restore();
}
