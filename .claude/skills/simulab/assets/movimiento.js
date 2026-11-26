// ---------------------------------------------------------------------------
// 2WD robot base (native coords = KR-01 robot frame: x forward, z up, cm). The camera draws the world
// mirrored, so +y reads as the robot's RIGHT: side names follow the screen ('der' = +y, 'izq' = -y).
// acrylic chassis (host), TT motor brackets, TT motors 1:48, 65 mm wheels, ball caster.
// kit2WD() returns the standard instances in build order.
// ---------------------------------------------------------------------------
const PLATE_PLAN = rrPlan(-10.5, -7, 10.5, 7, [3.0, 3.0, 1.6, 1.6], 6);
defineAsset('chasis2wd', {
  name: 'chasis', label: 'CHASIS ACRÍLICO · 3 MM', group: 'host', O: [0, 0, 4.4], anchor: [8.6, -5.6, 4.7], ring: [11.5, 8.2, 4.4],
  hostTop: { z: 4.7, poly: PLATE_PLAN },
  draw(G, xf, st, inst) {
    const txt = inst.opts.engrave || ['KR-01', 'KAPRI LAB'];
    drawPrism(G, xf, PLATE_PLAN, 4.4, 4.7, M.acr, {
      alpha: 0.9,
      top: (c, sp) => {
        c.fillStyle = 'rgba(120,48,6,0.55)';
        for (let x = -9.2; x <= 9.3; x += 1.55) for (const y of [-6.25, 6.25]) {
          if (y > 0 && x > -10.2 && x < -5.6) continue;
          if (y < 0 && x > -9.8 && x < -2.3) continue;
          pcirc(c, x, y, 0.17); c.fill(); sp(0.9);
        }
        for (const y of [-4.6, -3.0, 3.0, 4.6]) { pcirc(c, 9.6, y, 0.17); c.fill(); sp(0.9); }
        for (const s of [1, -1]) { prect(c, 0.9, s > 0 ? 5.35 : -5.95, 1.0, 0.6, 0.3); c.fill(); sp(1.0); }
        prect(c, -1.4, -6.3, 0.7, 1.6, 0.3); c.fill(); sp(1.0);
        ptxt(c, txt[0], 6.9, 5.25, 0.62, 'rgba(140,60,10,0.75)', 700);
        ptxt(c, txt[1], 6.95, 4.45, 0.34, 'rgba(140,60,10,0.6)', 700);
        c.beginPath(); c.moveTo(-8.5, 6.72); c.lineTo(7.2, 6.72); c.arc(7.5, 4.0, 2.72, Math.PI / 2, 0.15, true);
        sp(1.4, 'rgba(255,240,220,0.7)');
      },
    });
  },
  floorShadow: (xf) => [PLATE_PLAN.flatMap(([x, y]) => [xf.p([x, y, 4.4]), xf.p([x, y, 4.7])])],
});

function drawTT(G, xf, s) {
  const y0 = s > 0 ? 4.9 : -6.8, y1 = s > 0 ? 6.8 : -4.9, yc = (y0 + y1) / 2;
  drawCyl(G, xf, [-0.72, yc, 3.3], 'x', 0.97, 2.56, M.can, {
    capFx: (c, sp) => {
      c.fillStyle = rgbCss(hexRgb(M.can.dark)); pcirc(c, 0, 0, 0.5); c.fill(); sp(1);
      c.fillStyle = rgbCss(hexRgb(M.brass.mid));
      prect(c, 0.42, -0.12, 0.3, 0.24); c.fill(); sp(0.9); prect(c, -0.72, -0.12, 0.3, 0.24); c.fill(); sp(0.9);
      c.fillStyle = INK; pcirc(c, 0, 0, 0.12); c.fill();
    },
  });
  const sideFace = (c, sp) => {
    c.fillStyle = rgbCss(hexRgb(M.yel.dark)); pcirc(c, 1.9, 1.15, 0.55); c.fill(); sp(1.1);
    c.fillStyle = rgbCss(hexRgb(M.yel.light)); pcirc(c, 1.9, 1.15, 0.28); c.fill(); sp(1);
    ptxt(c, '1:48', 3.3, 1.5, 0.42, 'rgba(120,80,10,0.8)');
  };
  drawBox(G, xf, [-6.4, y0, 2.2], [-2.0, y1, 4.4], M.yel, {
    px: (c, sp) => { for (const u of [0.45, 1.45]) { c.beginPath(); c.moveTo(u, 0.3); c.lineTo(u, 1.9); sp(1, 'rgba(130,85,10,0.6)'); } },
    py: s > 0 ? sideFace : null, ny: s < 0 ? sideFace : null,
  });
}
function drawWheel(G, xf, s, theta) {
  const c0 = [-4.5, 8.6 * s, 3.25], R = 3.25, L = 2.6;
  drawCyl(G, xf, c0, 'y', R, L, M.tire, {
    seg: 48, steps: 9,
    sideFx: (GG) => {
      const cx = GG.ctx; cx.lineWidth = 1; cx.strokeStyle = 'rgba(150,154,170,0.55)';
      for (let k = 0; k < 28; k++) {
        const ph = theta + (k / 28) * Math.PI * 2, nl = [Math.sin(ph), 0, Math.cos(ph)];
        if (dot3(xf.n(nl), VC) < 0.12) continue;
        const pA = GG.cam.p(xf.p([c0[0] + R * Math.sin(ph), c0[1] - L / 2 + 0.25, c0[2] + R * Math.cos(ph)]));
        const pB = GG.cam.p(xf.p([c0[0] + R * Math.sin(ph), c0[1] + L / 2 - 0.25, c0[2] + R * Math.cos(ph)]));
        cx.beginPath(); cx.moveTo(pA[0], pA[1]); cx.lineTo(pB[0], pB[1]); cx.stroke();
      }
    },
    capFx: (c, sp, capVis) => {
      const n = xf.n([0, capVis * s > 0 ? 1 : -1, 0]), base = toneRgb(M.hub, shadeOf(n));
      pcirc(c, 0, 0, 2.92); sp(0.9, 'rgba(110,114,130,0.75)');
      for (let k = 0; k < 24; k++) { const a = theta * capVis + (k / 24) * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 2.98, Math.sin(a) * 2.98); c.lineTo(Math.cos(a) * 3.18, Math.sin(a) * 3.18); sp(0.9, 'rgba(120,124,140,0.6)'); }
      c.fillStyle = rgbCss(base); pcirc(c, 0, 0, 2.5); c.fill(); sp(1.4);
      c.fillStyle = rgbCss(mixRgb(base, [255, 255, 255], 0.25)); pcirc(c, 0, 0, 2.15); c.fill();
      for (let k = 0; k < 6; k++) { const a = theta * capVis + (k / 6) * Math.PI * 2; c.beginPath(); c.arc(0, 0, 2.0, a - 0.36, a + 0.36); c.arc(0, 0, 1.0, a + 0.25, a - 0.25, true); c.closePath(); c.fillStyle = '#2a2b33'; c.fill(); sp(1.1); }
      c.fillStyle = rgbCss(mixRgb(base, [255, 255, 255], 0.4)); pcirc(c, 0, 0, 0.78); c.fill(); sp(1.2);
      c.fillStyle = '#2a2b33'; c.beginPath(); c.arc(0, 0, 0.3, 0.6 + theta * capVis, Math.PI * 2 - 0.6 + theta * capVis); c.closePath(); c.fill();
    },
  });
}
for (const s of [1, -1]) {
  const side = s > 0 ? 'der' : 'izq';
  defineAsset('soporteTT_' + side, {
    name: 'soporte ' + side, group: 'under', O: [-4.5, 6.95 * s, 2.45], anchor: [-4.5, 6.95 * s, 3.4], ring: [2.0, 1.2, 2.5],
    draw(G, xf) {
      const bolt = (c, sp) => { for (const u of [0.55, 2.05]) { c.fillStyle = rgbCss(hexRgb(M.steel.mid)); pcirc(c, u, 1.05, 0.26); c.fill(); sp(1.1); c.beginPath(); c.moveTo(u - 0.16, 1.05); c.lineTo(u + 0.16, 1.05); sp(0.9); } };
      drawBox(G, xf, [-5.8, s > 0 ? 6.8 : -7.1, 2.45], [-3.2, s > 0 ? 7.1 : -6.8, 4.4], M.acr, { alpha: 0.95, py: s > 0 ? bolt : null, ny: s < 0 ? bolt : null });
    },
  });
  defineAsset('motorTT_' + side, {
    name: 'motor ' + side, label: 'MOTOR TT · 1:48', group: 'under', O: [-2.9, 5.85 * s, 2.2], anchor: [-2.6, 5.85 * s, 2.2], ring: [4.2, 1.6, 2.2], lab: [0, 1.4 * s, -4.5],
    pins: { '+': { p: [0.66, 5.85 * s - 0.4 * s, 3.45], dir: [1, 0, 0], hl: 0 }, '-': { p: [0.66, 5.85 * s + 0.4 * s, 3.45], dir: [1, 0, 0], hl: 0 } },
    draw(G, xf) { drawTT(G, xf, s); },
    floorShadow: (xf) => [boxCorners(xf, [-6.4, s > 0 ? 4.9 : -6.8, 2.2], [0.6, s > 0 ? 6.8 : -4.9, 4.4])],
  });
  defineAsset('rueda65_' + side, {
    name: 'rueda ' + side, label: 'RUEDA 65 MM', group: 'wheel', O: [-4.5, 8.6 * s, 3.25], anchor: [-4.5, 8.6 * s, 0], ring: [3.6, 1.8, 0.05], lab: [0, 1.0 * s, 6.6],
    draw(G, xf, st, inst) { drawWheel(G, xf, s, st[inst.opts.spin || (s > 0 ? 'thR' : 'thL')] || 0); },
    floorShadow: (xf) => [cylCorners(xf, [-4.5, 8.6 * s, 3.25], 'y', 3.25, 2.6, 20)],
  });
}
defineAsset('ruedaLoca', {
  name: 'rueda loca', label: 'RUEDA LOCA', group: 'under', O: [7.6, 0, 0], anchor: [7.6, 0, 0], ring: [1.6, 1.6, 0.05], lab: [1.2, -1.2, 0],
  draw(G, xf) {
    drawSphere(G, xf, [7.6, 0, 0.8], 0.78, M.steel);
    drawCyl(G, xf, [7.6, 0, 1.3], 'z', 0.95, 0.9, M.steel, { seg: 24, noCap: true });
    drawBox(G, xf, [6.85, -1.5, 1.75], [8.35, 1.5, 1.95], M.steel);
    for (const y of [-1.05, 1.05]) drawCyl(G, xf, [7.6, y, 3.175], 'z', 0.22, 2.45, M.brass, { seg: 6, lw: 1.3 });
  },
  floorShadow: (xf) => [boxCorners(xf, [6.85, -1.5, 0], [8.35, 1.5, 4.4])],
});
// standard 2WD base in build order (ids are fixed so stories can refer to them)
function kit2WD(o = {}) {
  return [
    place('chasis2wd', 'chasis', { engrave: o.engrave }),
    place('soporteTT_der', 'soporte_der'), place('soporteTT_izq', 'soporte_izq'),
    place('motorTT_der', 'motor_der'), place('motorTT_izq', 'motor_izq', { label: null }),
    place('rueda65_der', 'rueda_der'), place('rueda65_izq', 'rueda_izq', { label: null }),
    place('ruedaLoca', 'rueda_loca'),
  ];
}
