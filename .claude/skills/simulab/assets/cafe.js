// ---------------------------------------------------------------------------
// Café: espresso machine, portafilter, scale and espresso cup (Lab E1 · Espresso).
// World cm, x toward the viewer's right-front, z up. Machine origin at the floor, body behind x = -2.
// Measurements are of a generic home machine of our own design (no real brand).
// ---------------------------------------------------------------------------
const MC = {
  body: { light: '#f4efe4', mid: '#e2d7c3', dark: '#bcae94' },
  red: { light: '#ff7a6b', mid: '#e5484d', dark: '#b3343a' },
  wood: { light: '#e0a868', mid: '#bd8146', dark: '#8c5a2c' },
  tray: { light: '#5b5f6b', mid: '#3e414b', dark: '#2a2c34' },
  cup: { light: '#ffffff', mid: '#eef0f3', dark: '#c9cdd6' },
};
// coffee colour by flow (g/s): fast = pale, slow = dark
function cafeColor(q) { const f = clamp((q - 0.6) / 2.6); return rgbCss(mixRgb(hexRgb('#2e1a0e'), hexRgb('#c98a4a'), f)); }
const ES_GEO = { group: [3, 0, 22.5], basket: [3, 0, 19.6], spoutZ: 16.9, spoutY: 1.1, scaleTop: 3.4, cupBase: 3.4, cupH: 5.0, cupR0: 2.0, cupR1: 2.9 };

defineAsset('maquinaEspresso', {
  name: 'máquina de espresso', label: 'MÁQUINA · 9 BAR', group: 'floor', layer: 0, O: [0, 0, 0], anchor: [-9, 0, 31], ring: [14, 14, 0.02], lab: [-4, 4, 3],
  pins: { grupo: { p: [3, 0, 21] } },
  floorShadow: (xf) => [boxCorners(xf, [-16, -12, 0], [-2, 12, 30]), boxCorners(xf, [-2, -10, 0], [10, 10, 1.6])],
  draw(G, xf, st) {
    // body
    drawBox(G, xf, [-16, -12, 0], [-2, 12, 30], MC.body, {
      lw: 2,
      py: (c) => {
        ptxt(c, 'ES-01', 2.2, 4.2, 1.5, INK, 700, 'left');
        ptxt(c, 'DISEÑO PROPIO · NO ES UNA MARCA REAL', 2.2, 6.4, 0.5, 'rgba(29,32,51,0.55)', 700, 'left');
        c.fillStyle = (st.pump || 0) > 0 ? '#c8f04a' : '#7c8190'; pcirc(c, 3.0, 10.5, 0.75); c.fill(); c.lineWidth = 0.1; c.strokeStyle = INK; c.stroke();
        ptxt(c, 'BOMBA', 4.3, 10.5, 0.6, 'rgba(29,32,51,0.7)', 700, 'left');
      },
    });
    // drip tray with grid
    drawBox(G, xf, [-2, -10, 0], [10, 10, 1.6], MC.tray, {
      lw: 1.8, top: (c) => { c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 0.12; for (let x = 0.8; x < 12; x += 1.2) { c.beginPath(); c.moveTo(x, 0.8); c.lineTo(x, 19.2); c.stroke(); } },
    });
    // group head
    drawCyl(G, xf, ES_GEO.group, 'z', 3.8, 3, M.steel, { seg: 36, lw: 1.6 });
  },
});

defineAsset('cabezalEspresso', {
  name: 'cabezal y manómetro', label: 'MANÓMETRO', group: 'floor', layer: 4, O: [0, 0, 0], anchor: [8, 4.8, 27], ring: [6, 9, 24], lab: [5, 3, 4.5], dropH: 5,
  floorShadow: (xf) => [boxCorners(xf, [-2, -9, 24], [8, 9, 30])],
  draw(G, xf, st) {
    const bar = st.bar || 0;
    // head housing with the pressure gauge on its front face
    drawBox(G, xf, [-2, -9, 24], [8, 9, 30], MC.body, {
      lw: 2,
      px: (c) => {
        const cx = 4.2, cy = 3.0, R = 2.3;
        c.fillStyle = '#fffdf8'; pcirc(c, cx, cy, R); c.fill(); c.lineWidth = 0.16; c.strokeStyle = INK; c.stroke();
        // 0..15 bar over 270°, green band 8-10 bar
        const ang = (b) => Math.PI * 0.75 + (clamp(b, 0, 15) / 15) * Math.PI * 1.5;
        c.lineWidth = 0.32; c.strokeStyle = '#9be15d'; c.beginPath(); c.arc(cx, cy, R - 0.45, ang(8), ang(10)); c.stroke();
        c.lineWidth = 0.08; c.strokeStyle = INK;
        for (let b = 0; b <= 15; b += 3) { const a = ang(b); c.beginPath(); c.moveTo(cx + Math.cos(a) * (R - 0.25), cy + Math.sin(a) * (R - 0.25)); c.lineTo(cx + Math.cos(a) * (R - 0.65), cy + Math.sin(a) * (R - 0.65)); c.stroke(); }
        const a = ang(bar); c.lineWidth = 0.16; c.strokeStyle = '#e5484d'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 0.5), cy + Math.sin(a) * (R - 0.5)); c.stroke();
        c.fillStyle = INK; pcirc(c, cx, cy, 0.22); c.fill();
        ptxt(c, 'BAR', cx, cy + 1.15, 0.45, 'rgba(29,32,51,0.6)', 700, 'center');
        ptxt(c, 'SIMULAB · ES-01', 8.2, 2.4, 0.75, INK, 700, 'left');
        ptxt(c, `${bar.toFixed(1)} bar`, 8.2, 3.9, 0.7, bar >= 8 ? '#2f8a2f' : 'rgba(29,32,51,0.6)', 700, 'left');
      },
    });
    // steam wand on the right side
    drawWire(G, xf, [[5, 8.6, 24.2], [6.6, 9.8, 22.6], [7.4, 10.4, 19.5], [7.6, 10.6, 16.5]], '#e3e7ee', { w: 0.7, n: 14 });
    drawCyl(G, xf, [7.6, 10.6, 16.1], 'z', 0.42, 0.8, M.steel, { seg: 14, lw: 1.2 });
  },
});

defineAsset('portafiltro', {
  name: 'portafiltro', label: 'PORTAFILTRO · 18 g', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [3, 0, 21], ring: [4.5, 4.5, 18.2], lab: [9, -9, -2], dropH: 5,
  draw(G, xf, st) {
    for (const s of [-1, 1]) drawCyl(G, xf, [3, s * ES_GEO.spoutY, 17.55], 'z', 0.45, 1.3, M.steel, { seg: 14, lw: 1.2 });
    drawCyl(G, xf, ES_GEO.basket, 'z', 3.6, 2.8, M.steel, { seg: 36, lw: 1.7 });
    drawBox(G, xf, [6.4, -0.8, 19.0], [9.6, 0.8, 20.2], M.steel, { lw: 1.4 });
    drawBox(G, xf, [9.6, -0.95, 18.9], [16.0, 0.95, 20.4], MC.wood, { lw: 1.6 });
  },
});

defineAsset('bascula', {
  name: 'báscula', label: 'BÁSCULA · 0.1 g', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [3, 0, 3.4], ring: [4.4, 4.4, 1.62], lab: [6, -3, -1.5], dropH: 6,
  draw(G, xf, st) {
    const g = st.grams || 0, tm = st.shotT || 0;
    drawBox(G, xf, [-0.8, -3.9, 1.6], [6.8, 3.9, 3.4], M.blk, {
      lw: 1.6,
      px: (c) => {
        c.fillStyle = '#0d1a10'; prect(c, 0.6, 0.25, 6.6, 1.3, 0.2); c.fill();
        ptxt(c, `${g.toFixed(1)} g`, 1.0, 0.92, 0.95, '#9be15d', 700, 'left');
        ptxt(c, `${tm.toFixed(0)} s`, 6.9, 0.92, 0.8, '#ffcf6b', 700, 'right');
      },
    });
  },
});

defineAsset('tazaEspresso', {
  name: 'taza de espresso', label: 'TAZA', group: 'floor', layer: 3, O: [0, 0, 0], anchor: [3, 0, 8.4], ring: [3.4, 3.4, 3.42], lab: [-1, 7, 2.5], dropH: 6,
  draw(G, xf, st) {
    const g = ES_GEO, fill = clamp((st.grams || 0) / 40), q = st.flowCol ?? 1.6;
    drawWire(G, xf, [[3, 2.6, 7.6], [3, 4.1, 7.2], [3, 4.2, 5.4], [3, 2.3, 5.0]], '#f4f6f9', { w: 0.7, n: 14 });
    drawFrustum(G, xf, [3, 0, g.cupBase + g.cupH / 2], 'z', g.cupR0, g.cupR1, g.cupH, MC.cup, { seg: 40, lw: 1.7 });
    onPlane(G, xf.p([3, 0, g.cupBase + g.cupH]), xf.n([1, 0, 0]), xf.n([0, 1, 0]), (c) => {
      {
        c.fillStyle = '#e9e2d4'; pcirc(c, 0, 0, g.cupR1 - 0.25); c.fill();
        if (fill > 0.01) {
          c.globalAlpha = clamp(fill * 3); c.fillStyle = cafeColor(q); pcirc(c, 0, 0, (g.cupR1 - 0.3) * (0.55 + 0.45 * fill)); c.fill();
          c.fillStyle = 'rgba(214,160,96,0.55)'; pcirc(c, -0.3, -0.3, (g.cupR1 - 0.6) * (0.4 + 0.4 * fill)); c.fill(); c.globalAlpha = 1;
        }
      }
    });
  },
});

// the two streams from the spouts into the cup (drawn by the demo while the shot runs)
function drawChorros(G, base, q, on, t) {
  if (on <= 0.01 || q <= 0) return;
  const g = ES_GEO, col = cafeColor(q), w = clamp(0.12 + q * 0.09, 0.14, 0.42) * on;
  for (const s of [-1, 1]) {
    const top = [3, s * g.spoutY, g.spoutZ], bot = [3, s * g.spoutY * 0.55, g.cupBase + g.cupH - 0.3];
    if (q < 1.0) {   // choked puck: it drips instead of pouring
      const c = G.ctx; c.save(); c.fillStyle = col; c.globalAlpha = on;
      for (let k = 0; k < 3; k++) { const f = ((t * (0.9 + q) + k / 3 + (s > 0 ? 0.17 : 0)) % 1 + 1) % 1, P = G.cam.p(base.p(lerp3(top, bot, f * f))); c.beginPath(); c.ellipse(P[0], P[1], 0.16 * G.cam.z, 0.24 * G.cam.z, 0, 0, Math.PI * 2); c.fill(); }
      c.restore(); continue;
    }
    const wob = Math.sin(t * 9 + s) * 0.06;
    drawWire(G, base, [top, [3 + wob, s * g.spoutY * 0.85, (top[2] + bot[2]) / 2], bot], col, { w, n: 10 });
  }
}
