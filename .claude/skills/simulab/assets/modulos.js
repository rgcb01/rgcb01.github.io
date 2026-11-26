// ---------------------------------------------------------------------------
// Modules from Lab 01 (native coords = KR-01 robot coords): HC-SR04 + bracket,
// L298N + heatsink, battery holder 2x18650 + cells, rocker switch, mini breadboard 170.
// ---------------------------------------------------------------------------
function meshCap(c, sp, flash) {
  c.fillStyle = '#3a3f4b'; pcirc(c, 0, 0, 0.66); c.fill(); sp(1.2);
  c.save(); pcirc(c, 0, 0, 0.62); c.clip();
  c.fillStyle = 'rgba(200,206,220,0.55)';
  for (let x = -0.66; x <= 0.66; x += 0.11) for (let y = -0.66; y <= 0.66; y += 0.11) { prect(c, x - 0.022, y - 0.022, 0.044, 0.044); c.fill(); }
  if (flash > 0) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 0, 0, 0, 0.7); g.addColorStop(0, `rgba(120,255,240,${0.9 * flash})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; pcirc(c, 0, 0, 0.7); c.fill(); }
  c.restore();
  pcirc(c, 0, 0, 0.66); sp(1.3);
}
defineAsset('soporteSensor', {
  name: 'soporte sensor', group: 'top', layer: 0, O: [8.45, 0, 4.7], anchor: [8.6, 0, 4.9], ring: [1.4, 2.4, 4.72],
  draw(G, xf) { drawBox(G, xf, [7.9, -1.6, 4.7], [9.0, 1.6, 4.92], M.blk, { lw: 1.4 }); drawBox(G, xf, [8.72, -1.9, 4.92], [8.94, 1.9, 6.7], M.blk, { lw: 1.4 }); },
});
defineAsset('hcsr04', {
  name: 'HC-SR04', label: 'HC-SR04 · 40 kHz', group: 'top', layer: 1, O: [9.03, 0, 4.95], anchor: [9.7, 0, 6.95], ring: [1.8, 3.0, 4.72], lab: [1.5, -2.6, 2.4],
  // sensor faces +x; TX at local y=+1.3, RX at y=-1.3, mesh face at x=10.4, centre height z=5.9
  pins: {
    VCC: { p: [8.35, -0.381, 5.055], dir: [-1, 0, 0], hl: 0.6 }, TRIG: { p: [8.35, -0.127, 5.055], dir: [-1, 0, 0], hl: 0.6 },
    ECHO: { p: [8.35, 0.127, 5.055], dir: [-1, 0, 0], hl: 0.6 }, GND: { p: [8.35, 0.381, 5.055], dir: [-1, 0, 0], hl: 0.6 },
    TX: { p: [10.4, 1.3, 5.9], dir: [1, 0, 0] }, RX: { p: [10.4, -1.3, 5.9], dir: [1, 0, 0] },
  },
  draw(G, xf, st) {
    for (const y of [-0.381, -0.127, 0.127, 0.381]) drawBox(G, xf, [8.35, y - 0.035, 5.02], [8.95, y + 0.035, 5.09], M.gold, { lw: 0.7 });
    drawBox(G, xf, [8.95, -2.25, 4.95], [9.11, 2.25, 6.95], M.pcbS, {
      lw: 1.6,
      px: (c, sp) => {
        c.fillStyle = rgbCss(hexRgb(M.steel.mid)); prect(c, 1.85, 0.12, 0.8, 0.34, 0.17); c.fill(); sp(1.0);
        ptxt(c, 'T', 0.28, 0.25, 0.26, 'rgba(255,255,255,0.9)'); ptxt(c, 'R', 4.05, 0.25, 0.26, 'rgba(255,255,255,0.9)');
        ptxt(c, 'HC-SR04', 2.25, 1.62, 0.25, 'rgba(255,255,255,0.95)', 700, 'center');
        ptxt(c, 'VCC TRIG ECHO GND', 2.25, 1.86, 0.12, 'rgba(255,255,255,0.85)', 700, 'center');
      },
    });
    for (const [y, fl] of [[1.3, st.txFlash || 0], [-1.3, st.rxFlash || 0]]) drawCyl(G, xf, [9.75, y, 5.9], 'x', 0.8, 1.28, M.steel, { seg: 32, capFx: (c, sp) => meshCap(c, sp, fl) });
  },
  hostShadow: (xf) => [boxCorners(xf, [8.95, -2.25, 4.7], [10.4, 2.25, 6.95])],
});

// ---- L298N ---------------------------------------------------------------------------
function terminal(G, xf, x0, x1, y0, y1, n, alongX, faceDir) {
  const holes = (c, sp) => { for (let k = 0; k < n; k++) { const u = ((k + 0.5) / n) * (alongX ? x1 - x0 : y1 - y0); c.fillStyle = '#123'; prect(c, u - 0.16, 0.38, 0.32, 0.3, 0.04); c.fill(); sp(0.8); } };
  drawBox(G, xf, [x0, y0, 5.36], [x1, y1, 6.36], M.term, {
    lw: 1.4, py: faceDir === 'py' ? holes : null, ny: faceDir === 'ny' ? holes : null, px: faceDir === 'px' ? holes : null,
    top: (c, sp) => {
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, px = alongX ? (x1 - x0) * t : (x1 - x0) / 2, py = alongX ? (y1 - y0) / 2 : (y1 - y0) * t;
        c.fillStyle = rgbCss(hexRgb(M.steel.light)); pcirc(c, px, py, 0.22); c.fill(); sp(1.1);
        c.beginPath(); c.moveTo(px - 0.15, py - 0.05); c.lineTo(px + 0.15, py + 0.05); sp(1.0);
      }
    },
  });
}
const L298_HDR = { ENA: 3.815, IN1: 4.069, IN2: 4.323, IN3: 4.577, IN4: 4.831, ENB: 5.085 };
defineAsset('l298n', {
  name: 'L298N', label: 'L298N · PUENTE H', group: 'top', layer: 0, O: [-7.95, 4.45, 4.7], anchor: [-7.95, 4.45, 5.36], ring: [3.2, 3.2, 4.72], lab: [-0.6, 2.4, 3.2],
  pins: Object.assign(
    Object.fromEntries(Object.entries(L298_HDR).map(([k, y]) => [k, { p: [-6.15, y, 6.2] }])),
    { OUT1: { p: [-8.43, 6.68, 5.75], dir: [0, 1, 0], hl: 0 }, OUT2: { p: [-7.68, 6.68, 5.75], dir: [0, 1, 0], hl: 0 },
      OUT3: { p: [-8.43, 2.22, 5.75], dir: [0, -1, 0], hl: 0 }, OUT4: { p: [-7.68, 2.22, 5.75], dir: [0, -1, 0], hl: 0 },
      V12: { p: [-10.2, 5.17, 5.8], dir: [-1, 0, 0], hl: 0 }, GND: { p: [-10.2, 4.42, 5.8], dir: [-1, 0, 0], hl: 0 }, V5: { p: [-10.2, 3.67, 5.8], dir: [-1, 0, 0], hl: 0 } }),
  draw(G, xf, st, inst) {
    for (const [x, y] of [[-9.8, 2.6], [-6.1, 2.6], [-9.8, 6.3], [-6.1, 6.3]]) drawCyl(G, xf, [x, y, 4.95], 'z', 0.2, 0.5, M.brass, { seg: 6, lw: 1.1 });
    drawPrism(G, xf, rrPlan(-10.1, 2.3, -5.8, 6.6, 0.15, 2), 5.2, 5.36, M.pcbR, {
      lw: 1.5,
      top: (c, sp) => {
        c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.04; prect(c, -9.25, 2.85, 2.6, 3.2); c.stroke();
        ptxt(c, 'L298N', -6.55, 4.45, 0.28, 'rgba(255,255,255,0.92)', 700, 'center', Math.PI / 2);
        ptxt(c, 'ENA  IN1  IN2  IN3  IN4  ENB', -5.98, 4.45, 0.09, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        ptxt(c, '12V GND 5V', -9.25, 4.42, 0.11, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        const on = st.power > 0.5;
        c.fillStyle = on ? '#ff5a4f' : 'rgba(255,255,255,0.7)'; prect(c, -6.65, 2.62, 0.16, 0.24); c.fill(); sp(0.6);
        if (on) glowAt(c, -6.57, 2.74, 0.6, 'rgba(255,90,70,0.9)');
      },
    });
    drawBox(G, xf, [-9.95, 5.75, 5.36], [-9.4, 6.4, 5.66], M.blk, { lw: 1.1 });
    for (const [x, y] of [[-6.45, 6.15], [-6.45, 2.95]]) drawCyl(G, xf, [x, y, 5.76], 'z', 0.33, 0.8, M.blk, { seg: 18, lw: 1.2, cap: M.steel, capFx: (c) => { c.strokeStyle = '#6b7280'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(-0.22, 0); c.lineTo(0.22, 0); c.moveTo(0, -0.22); c.lineTo(0, 0.22); c.stroke(); } });
    terminal(G, xf, -10.1, -9.35, 3.3, 5.55, 3, false, 'nx');
    terminal(G, xf, -8.8, -7.3, 2.3, 3.05, 2, true, 'ny');
    drawBox(G, xf, [-6.32, 3.69, 5.36], [-5.98, 5.21, 5.62], M.blk, { lw: 1.2 });
    for (let k = 0; k < 6; k++) { const y = 3.815 + k * 0.254; drawBox(G, xf, [-6.19, y - 0.035, 5.62], [-6.11, y + 0.035, 6.2], M.gold, { lw: 0.7 }); }
    const hsId = inst.opts.heatsink || 'disipador', hp = st.parts[hsId] ?? 1;
    if (hp > 0) {
      const x2 = xf.lift((1 - easeOut(hp)) * 7);
      drawBox(G, x2, [-9.1, 3.0, 5.36], [-6.8, 5.9, 5.9], M.hs, { lw: 1.4 });
      for (let i = 0; i < 7; i++) { const y = 3.0 + i * ((2.9 - 0.16) / 6); drawBox(G, x2, [-9.1, y, 5.9], [-6.8, y + 0.16, 7.75], M.hs, { lw: 1.2 }); }
    }
    terminal(G, xf, -8.8, -7.3, 5.85, 6.6, 2, true, 'py');
  },
  hostShadow: (xf) => [boxCorners(xf, [-10.1, 2.3, 4.7], [-5.8, 6.6, 5.4]), boxCorners(xf, [-9.1, 3.0, 4.7], [-6.8, 5.9, 7.75])],
});
defineAsset('disipador', { name: 'disipador', label: 'DISIPADOR', group: 'none', O: [-7.95, 4.45, 5.36], anchor: [-7.95, 4.45, 7.75], ring: [1.8, 2.0, 7.77], lab: [0, 1.6, 1.6], draw() {} });

// ---- battery holder 2x18650 + cells -------------------------------------------------------
function drawCell(G, xf, y, m, prog) {
  const x2 = xf.lift((1 - easeOut(prog)) * 6);
  drawCyl(G, x2, [-6.05, y, 5.75], 'x', 0.9, 6.4, m, {
    seg: 32, steps: 8, cap: M.steel,
    sideFx: (GG) => {
      const p1 = GG.cam.p(x2.p([-4.0, y, 6.65])), p2 = GG.cam.p(x2.p([-8.0, y, 6.65]));
      const cx = GG.ctx; cx.save(); cx.lineWidth = Math.max(1, 0.28 * GG.cam.z); cx.strokeStyle = 'rgba(255,255,255,0.35)'; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(p1[0], p1[1]); cx.lineTo(p2[0], p2[1]); cx.stroke(); cx.restore();
    },
    capFx: (c, sp) => { c.fillStyle = rgbCss(hexRgb(M.steel.dark)); pcirc(c, 0, 0, 0.32); c.fill(); sp(0.9); },
  });
}
defineAsset('portapilas2x18650', {
  name: 'portapilas', label: '2× 18650 · 7.4 V', group: 'top', layer: 0, O: [-6.05, -4.65, 4.7], anchor: [-6.05, -4.65, 6.6], ring: [4.4, 2.6, 4.72], lab: [-1.5, -1.4, 1.2],
  pins: { '+': { p: [-9.45, -3.3, 6.5], dir: [0, 0, 1], hl: 0 }, '-': { p: [-9.45, -6.0, 6.5], dir: [0, 0, 1], hl: 0 } },
  draw(G, xf, st, inst) {
    drawBox(G, xf, [-9.6, -6.7, 4.7], [-2.5, -2.6, 6.6], M.blk, {
      topM: M.inner, lw: 1.6,
      top: (c, sp) => { for (const y of [0.95, 3.05]) { c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(0.35 + i * 0.04, y + (i % 2 ? 0.25 : -0.25)); sp(1.1, '#9aa1ad'); } },
    });
    const [c1, c2] = inst.opts.cells || ['pila_1', 'pila_2'];
    const p1 = st.parts[c1] ?? 1, p2 = st.parts[c2] ?? 1;
    if (p1 > 0) drawCell(G, xf, -5.65, M.cellA, p1);
    if (p2 > 0) drawCell(G, xf, -3.65, M.cellB, p2);
    const P = (q) => G.cam.p(xf.p(q));
    if (dot3(xf.n([0, 1, 0]), VC) > 0) fillStroke(G, [[-9.6, -2.75, 6.6], [-2.5, -2.75, 6.6], [-2.5, -2.6, 6.6], [-9.6, -2.6, 6.6]].map(P), rgbCss(hexRgb(M.blk.light)), 1.3);
    if (dot3(xf.n([1, 0, 0]), VC) > 0) fillStroke(G, [[-2.65, -6.7, 6.6], [-2.5, -6.7, 6.6], [-2.5, -2.6, 6.6], [-2.65, -2.6, 6.6]].map(P), rgbCss(hexRgb(M.blk.light)), 1.3);
  },
  hostShadow: (xf) => [boxCorners(xf, [-9.6, -6.7, 4.7], [-2.5, -2.6, 6.6])],
});
defineAsset('pila18650', { name: 'pila 18650', group: 'none', O: [-6.05, -5.65, 4.82], anchor: [-6.05, -5.65, 6.6], ring: [3.6, 1.2, 6.62], draw() {} });

// ---- rocker switch -----------------------------------------------------------------------
defineAsset('interruptor', {
  name: 'interruptor', label: 'ON / OFF', group: 'top', layer: 0, O: [-10.0, -0.9, 4.7], anchor: [-10.0, -0.9, 5.4], ring: [1.2, 1.4, 4.72], lab: [0, -1.4, 1.6],
  pins: { in: { p: [-10.05, -1.45, 5.15], dir: [-1, 0, 0], hl: 0 }, out: { p: [-10.05, -0.35, 5.15], dir: [-1, 0, 0], hl: 0 } },
  draw(G, xf, st) {
    drawBox(G, xf, [-10.4, -1.6, 4.7], [-9.6, -0.2, 5.35], M.blk, { lw: 1.4 });
    const on = st.power > 0.5, zA = on ? 5.62 : 5.48, zB = on ? 5.48 : 5.62;
    const P = (q) => G.cam.p(xf.p(q)), r = M.red;
    fillStroke(G, [[-10.3, -1.5, 5.35], [-9.7, -1.5, 5.35], [-9.7, -1.5, zA], [-10.3, -1.5, zA]].map(P), tone(r, xf.n([0, -1, 0])), 1.2);
    fillStroke(G, [[-9.7, -1.5, 5.35], [-9.7, -0.3, 5.35], [-9.7, -0.3, zB], [-9.7, -1.5, zA]].map(P), tone(r, xf.n([1, 0, 0])), 1.2);
    fillStroke(G, [[-10.3, -1.5, zA], [-9.7, -1.5, zA], [-9.7, -0.3, zB], [-10.3, -0.3, zB]].map(P), tone(r, [0, 0, 1]), 1.2);
    onPlane(G, xf.p([-10.0, on ? -0.6 : -1.2, (zA + zB) / 2 + 0.01]), xf.n([1, 0, 0]), xf.n([0, 1, 0]), (c) => {
      c.fillStyle = 'rgba(255,255,255,0.9)';
      if (on) { prect(c, -0.04, -0.17, 0.08, 0.34); c.fill(); } else { c.beginPath(); c.arc(0, 0, 0.13, 0, Math.PI * 2); c.lineWidth = 0.05; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); }
    });
  },
});

// ---- mini breadboard 170 (holes 'a1'..'j17'; rows a-e / f-j across x, columns along y) -------------
function bb170Hole(name) {
  const m = /^([a-j])(\d{1,2})$/.exec(name); if (!m) return null;
  const row = m[1].charCodeAt(0) - 97, col = Number(m[2]) - 1;
  if (col < 0 || col > 16) return null; // 17 columns
  return { p: [4.0 + (row < 5 ? 0.35 + row * 0.254 : 1.97 + (row - 5) * 0.254), -2.25 + 0.22 + col * 0.254, 5.55] };
}
defineAsset('protoboard170', {
  name: 'protoboard', label: 'PROTO 170', group: 'top', layer: 0, O: [5.75, 0, 4.7], anchor: [5.75, 0, 5.55], ring: [2.6, 3.0, 4.72], lab: [0.6, 2.8, 0.8],
  pinFn: (name) => bb170Hole(name),
  draw(G, xf) {
    drawBox(G, xf, [4.0, -2.25, 4.7], [7.5, 2.25, 5.55], M.bb, {
      lw: 1.5,
      top: (c) => {
        c.fillStyle = '#e5484d'; prect(c, 0.12, 0.25, 0.05, 4.0); c.fill();
        c.fillStyle = '#3d84e6'; prect(c, 3.33, 0.25, 0.05, 4.0); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.12)'; prect(c, 1.66, 0.15, 0.18, 4.2); c.fill();
        c.fillStyle = '#5b5f6b';
        for (let col = 0; col < 17; col++) for (let row = 0; row < 10; row++) { const x = (row < 5 ? 0.35 + row * 0.254 : 1.97 + (row - 5) * 0.254), y = 0.22 + col * 0.254; prect(c, x - 0.05, y - 0.05, 0.1, 0.1); c.fill(); }
      },
    });
  },
});
