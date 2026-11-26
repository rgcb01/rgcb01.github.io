// ---------------------------------------------------------------------------------------------
// Exploded lithography stack for Lab 002 (own design, schematic). Three floating layers, same clip on each:
//   mask (top): dark glass with white chrome, the geometry the model corrects
//   aerial image (middle): intensity as a terrain, cut by the resist threshold sheet
//   wafer (bottom): blue target, orange / green printed contours, red edge placement errors
// World cm, z up; 1 cm = 50 nm of the layout. Everything drawn reads OPCD (precomputed by prepare.mjs from
// model.js) through the decoded states in OPS.
// ---------------------------------------------------------------------------------------------
// layers on a diagonal staircase (world offsets, cm): rising to the right so the stack fills a wide frame
const OPK = { nm: 50, hTerrain: 8.5, L: { wafer: [0, 0, 0], terrain: [21, -21, 22], mask: [42, -42, 46] } };
const OPC_COL = { target: '#2f6fe0', targetFill: 'rgba(77,140,255,0.22)', mask: '#ffffff', unc: '#ff8a1f', cor: '#1fae5c', err: '#e5303f', glass: '#283149' };

const OPW = (() => { const w = OPCD.win; return { x0: w[0] / OPK.nm, y0: w[1] / OPK.nm, x1: w[2] / OPK.nm, y1: w[3] / OPK.nm, nx0: w[0], ny0: w[1] }; })();
const opU = (x) => (x - OPCD.win[0]) / OPK.nm, opV = (y) => (y - OPCD.win[1]) / OPK.nm;           // nm -> plane cm
const opL = (layer, x, y, h = 0) => { const o = OPK.L[layer]; return [o[0] + x / OPK.nm, o[1] + y / OPK.nm, o[2] + h]; };  // layout nm -> world cm on a layer

// ---- decode the precomputed states ------------------------------------------------------------------
function opB64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function opI16(s, k) { const u = opB64(s), a = new Int16Array(u.buffer, 0, u.length >> 1); const out = new Float64Array(a.length); for (let i = 0; i < a.length; i++) out[i] = a[i] / k; return out; }
const OP_TARGET = OPCD.polys.flatMap(p => OPCM.opcPolyRects(p.pts));
const OPS = OPCD.states.map((s) => {
  const m = opI16(s.mask, 10), mask = []; for (let i = 0; i < m.length; i += 4) mask.push([m[i], m[i + 1], m[i + 2], m[i + 3]]);
  const c = opI16(s.contours, 1), lines = []; for (let i = 0; i < c.length;) { const n = c[i++], l = []; for (let k = 0; k < n; k++, i += 2) l.push([c[i] / 10, c[i + 1] / 10]); lines.push(l); }
  const t = opB64(s.terrain), terrain = new Float32Array(t.length); for (let i = 0; i < t.length; i++) terrain[i] = t[i] / 255 * 1.4;
  return { g: s.g, mask, outline: OPCM.opcRectOutline(mask), added: s.g > 0 ? OPCM.opcRectBoolean(mask, OP_TARGET) : [], lines, terrain, epe: opI16(s.epe, 20), m: s.metrics };
});
const OPN = OPS.length - 1;
const opStateAt = (g) => OPS[Math.max(0, Math.min(OPN, Math.round(g * OPN)))];
function opTerrainAt(g) {   // linear interpolation between the two neighbouring exact 5 % states (visual only)
  const f = Math.max(0, Math.min(OPN, g * OPN)), a = Math.floor(f), b = Math.min(OPN, a + 1), t = f - a, A = OPS[a].terrain, B = OPS[b].terrain;
  if (t < 1e-6) return A; const out = new Float32Array(A.length); for (let i = 0; i < A.length; i++) out[i] = A[i] + (B[i] - A[i]) * t; return out;
}

// ---- plane drawing helpers (inside onPlane: units are cm, origin at the window corner) ---------------
function opPolyPath(c, pts) { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(opU(q[0]), opV(q[1])) : c.moveTo(opU(q[0]), opV(q[1])))); c.closePath(); }
function opDrawTarget(c, sp, a, fill = true) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha = a;
  for (const p of OPCD.polys) { opPolyPath(c, p.pts); if (fill) { c.fillStyle = OPC_COL.targetFill; c.fill(); } c.setLineDash([0.32, 0.22]); sp(2, OPC_COL.target); c.setLineDash([]); }
  c.restore();
}
function opDrawLines(c, sp, lines, color, w, a = 1) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha = a; c.beginPath();
  for (const l of lines) l.forEach((q, i) => (i ? c.lineTo(opU(q[0]), opV(q[1])) : c.moveTo(opU(q[0]), opV(q[1]))));
  sp(w + 2.2, 'rgba(255,255,255,0.85)'); sp(w, color); c.restore();
}
function opDrawEpe(c, sp, S, gain, a) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha = a; c.beginPath();
  OPCD.sites.forEach((s, i) => { const e = S.epe[i]; if (Math.abs(e) < 0.8 || (s[4] !== 'edge' && s[4] !== 'lineEnd') || (s[4] === 'edge' && i % 3)) return; c.moveTo(opU(s[0]), opV(s[1])); c.lineTo(opU(s[0] + s[2] * e * gain), opV(s[1] + s[3] * e * gain)); });
  sp(2.2, OPC_COL.err); c.restore();
}

// ---- assets ------------------------------------------------------------------------------------------
const OP_WAFER_M = { light: '#eef0f4', mid: '#c9ced8', dark: '#9aa1b0' }, OP_BASE_M = { light: '#f7f3ea', mid: '#e6dfcf', dark: '#c4bba8' }, OP_GLASS_M = { light: '#3a4563', mid: '#2a3248', dark: '#1c2233' };

defineAsset('opcWafer', {
  name: 'wafer', label: 'WAFER · PRINTED RESIST', group: 'floor', layer: 0, O: [0, 0, 0], anchor: [OPW.x0, OPW.y1, 0], ring: null, lab: [-4, 6, 4],
  
  draw(G, xf, st) {
    drawBox(G, xf, [OPW.x0, OPW.y0, -1.2], [OPW.x1, OPW.y1, 0], OP_WAFER_M, {
      lw: 2,
      top: (c, sp) => {
        opDrawTarget(c, sp, st.targetOn ?? 1);
        const B = OPS[0], A = opStateAt(st.g ?? 0);
        opDrawLines(c, sp, B.lines, OPC_COL.unc, 2.6, st.uncOn ?? 0);
        opDrawLines(c, sp, A.lines, OPC_COL.cor, 2.6, st.corOn ?? 0);
        opDrawEpe(c, sp, st.epeState === 'after' ? A : B, st.epeGain ?? 2, st.epeOn ?? 0);
      },
    });
  },
});

defineAsset('opcTerrain', {
  name: 'aerial image', label: 'AERIAL IMAGE · RESIST THRESHOLD', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [OPW.x0, OPW.y1, 0], ring: null, lab: [-4, 6, 4],
  draw(G, xf, st) {
    drawBox(G, xf, [OPW.x0, OPW.y0, -1.0], [OPW.x1, OPW.y1, 0], OP_BASE_M, { lw: 1.8 });
    const on = st.terrainOn ?? 0; if (on <= 0.001) return;
    const T = opTerrainAt(st.g ?? 0), nx = OPCD.terrain.nx, ny = OPCD.terrain.ny, thr = OPCD.thr, H = OPK.hTerrain * on, c = G.ctx;
    const P = (i, j, v) => G.cam.p(xf.p([OPW.x0 + (OPW.x1 - OPW.x0) * i / (nx - 1), OPW.y0 + (OPW.y1 - OPW.y0) * j / (ny - 1), 0.05 + H * v]));
    const pal = st.terrainCol || 'unc', low = pal === 'cor' ? [143, 220, 170] : [247, 186, 130], lowD = pal === 'cor' ? [36, 140, 82] : [196, 106, 35];
    // back to front: the viewer sits at +x +y, so small i + j is farthest
    for (let s = 0; s <= nx + ny - 4; s++) for (let i = Math.max(0, s - (ny - 2)); i <= Math.min(nx - 2, s); i++) {
      const j = s - i, v00 = T[j * nx + i], v10 = T[j * nx + i + 1], v11 = T[(j + 1) * nx + i + 1], v01 = T[(j + 1) * nx + i];
      const v = (v00 + v10 + v11 + v01) / 4, dzx = (v10 + v11 - v00 - v01) / 2, dzy = (v01 + v11 - v00 - v10) / 2;
      const shade = clamp(0.62 - 2.2 * (dzx * 0.7 - dzy * 0.15), 0.25, 1);       // light from -x, slightly +y
      let col;
      if (v < thr) { const k = clamp(v / thr); col = mixRgb(lowD, low, k * 0.6 + 0.4 * shade); }          // resist remains: printed
      else { const k = clamp((v - thr) / (1.25 - thr)); col = mixRgb(mixRgb([226, 221, 236], [255, 247, 214], k), [120, 116, 150], 1 - shade); }
      const pts = [P(i, j, v00), P(i + 1, j, v10), P(i + 1, j + 1, v11), P(i, j + 1, v01)];
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q < 4; q++) c.lineTo(pts[q][0], pts[q][1]); c.closePath();
      c.fillStyle = rgbCss(col); c.fill(); c.lineWidth = 0.6; c.strokeStyle = rgbCss(col); c.stroke();
    }
    // threshold sheet edge and the printed contour lying on it
    const sh = st.sheetOn ?? 0;
    if (sh > 0.01) {
      const z = 0.05 + H * thr, corner = [[OPW.x0, OPW.y0], [OPW.x1, OPW.y0], [OPW.x1, OPW.y1], [OPW.x0, OPW.y1]].map(q => G.cam.p(xf.p([q[0], q[1], z])));
      c.save(); c.globalAlpha = sh; c.beginPath(); corner.forEach((q, k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath();
      c.fillStyle = 'rgba(58,70,170,0.10)'; c.fill(); c.setLineDash([7, 5]); c.lineWidth = 1.8; c.strokeStyle = '#3a46aa'; c.stroke(); c.setLineDash([]); c.restore();
      const S = opStateAt(st.g ?? 0), col = pal === 'cor' ? OPC_COL.cor : OPC_COL.unc;
      c.save(); c.globalAlpha = sh; c.beginPath();
      for (const l of S.lines) l.forEach((q, k) => { const p = G.cam.p(xf.p([q[0] / OPK.nm, q[1] / OPK.nm, z])); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.lineWidth = 2.4; c.strokeStyle = col; c.stroke(); c.restore();
    }
  },
});

defineAsset('opcMask', {
  name: 'photomask', label: 'PHOTOMASK · CHROME ON GLASS', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [OPW.x0, OPW.y1, 0], ring: null, lab: [-4, 6, 4],
  draw(G, xf, st) {
    drawBox(G, xf, [OPW.x0, OPW.y0, -1.0], [OPW.x1, OPW.y1, 0], OP_GLASS_M, {
      lw: 2,
      top: (c, sp) => {
        const S = opStateAt(st.g ?? 0), glow = st.glow ?? 0;
        c.fillStyle = '#eef1f7'; c.beginPath(); for (const r of S.mask) c.rect(opU(r[0]) - 0.005, opV(r[1]) - 0.005, (r[2] - r[0]) / OPK.nm + 0.01, (r[3] - r[1]) / OPK.nm + 0.01); c.fill();
        if (glow > 0.01 && S.added.length) {           // what OPC added, outside the target: the emergent shapes
          c.save(); c.globalAlpha = glow; c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(127,230,242,0.95)'; c.shadowBlur = 14;
          c.beginPath(); for (const r of S.added) c.rect(opU(r[0]), opV(r[1]), (r[2] - r[0]) / OPK.nm, (r[3] - r[1]) / OPK.nm); c.fill(); c.restore();
        }
        c.beginPath(); for (const e of S.outline) { c.moveTo(opU(e[0]), opV(e[1])); c.lineTo(opU(e[2]), opV(e[3])); } sp(1.3, '#ffffff');
        opDrawTarget(c, sp, st.maskTargetOn ?? 0, false);
      },
    });
  },
});

// light: short beams above the mask and faint guides tying the same corner of the clip through the stack
function opDrawLight(G, base, a) {
  if (a <= 0.01) return;
  const c = G.ctx; c.save(); c.globalAlpha = a;
  for (const [x, y] of [[OPW.x0 + 5, OPW.y0 + 3], [OPW.x0 + 17, OPW.y0 + 3], [OPW.x0 + 29, OPW.y0 + 3], [OPW.x1 - 5, OPW.y1 - 3], [OPW.x0 + 5, OPW.y1 - 3], [OPW.x1 - 5, OPW.y0 + 3]]) {
    const A = G.cam.p(base.p(opL('mask', x * OPK.nm, y * OPK.nm, 9))), B = G.cam.p(base.p(opL('mask', x * OPK.nm, y * OPK.nm, 1.5)));
    c.strokeStyle = '#ffb547'; c.lineWidth = 3; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
    c.fillStyle = '#ffb547'; c.beginPath(); c.moveTo(B[0], B[1] + 6); c.lineTo(B[0] - 5, B[1] - 3); c.lineTo(B[0] + 5, B[1] - 3); c.closePath(); c.fill();
  }
  c.restore();
}
// faint guides joining the same corner of the clip on the three layers ("same clip, three stages")
function opDrawGuides(G, base, a) {
  if (a <= 0.01) return;
  const c = G.ctx; c.save(); c.globalAlpha = a; c.setLineDash([4, 6]); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.38)';
  for (const [x, y] of [[OPCD.win[0], OPCD.win[3]], [OPCD.win[2], OPCD.win[1]], [OPCD.win[2], OPCD.win[3]], [OPCD.win[0], OPCD.win[1]]]) {
    const pts = ['wafer', 'terrain', 'mask'].map(l => G.cam.p(base.p(opL(l, x, y, 0))));
    c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke();
  }
  c.restore();
}
