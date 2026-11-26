// ---------------------------------------------------------------------------
// Boards: Arduino UNO R3 (from Lab 01) and ESP32 DevKit V1 (30 pins).
// UNO native coords = KR-01 robot coords (O = PCB bottom centre at [0.665, 0, 5.7]).
// ---------------------------------------------------------------------------
const UNO_HOLES = [[14.0, 2.5], [15.3, 50.7], [66.1, 7.6], [66.1, 35.5]].map(([ux, uy]) => [-2.0 + uy / 10, -3.43 + ux / 10]);
const UNO_PLAN = rrPlan(-2.0, -3.43, 3.33, 3.43, 0.22, 3);
const UNO_TOP = 6.71;
const UNO_DIG1 = ['SCL', 'SDA', 'AREF', 'GND2', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'];
const UNO_DIG2 = ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];
const UNO_PWR = ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND3', 'VIN'];
const UNO_ANA = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
function unoPin(name) {
  let k;
  if ((k = UNO_DIG1.indexOf(name)) >= 0) return { p: [2.955, -1.573 + k * 0.254, UNO_TOP] };
  if ((k = UNO_DIG2.indexOf(name)) >= 0) return { p: [2.955, 1.157 + k * 0.254, UNO_TOP] };
  if ((k = UNO_PWR.indexOf(name)) >= 0) return { p: [-1.625, -0.633 + k * 0.254, UNO_TOP] };
  if ((k = UNO_ANA.indexOf(name)) >= 0) return { p: [-1.625, 1.777 + k * 0.253, UNO_TOP] };
  return null;
}
function drawHeader(G, xf, x0, x1, y0, y1, z0, z1, n, alongY = true) {
  drawBox(G, xf, [x0, y0, z0], [x1, y1, z1], M.blk, {
    lw: 1.3,
    top: (c) => {
      c.fillStyle = '#0d0e12';
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const px = alongY ? (x1 - x0) / 2 : (x1 - x0) * t, py = alongY ? (y1 - y0) * t : (y1 - y0) / 2;
        prect(c, px - 0.055, py - 0.055, 0.11, 0.11); c.fill();
      }
    },
  });
}
defineAsset('uno', {
  name: 'UNO R3', label: 'UNO R3', group: 'top', layer: 1, O: [0.665, 0, 5.7], anchor: [0.66, 0, 5.86], ring: [4.4, 4.4, 5.75], lab: [-1.4, 3.0, 1.2],
  pinFn: (name) => unoPin(name),
  draw(G, xf, st, inst) {
    const ledOn = st.power > 0.5;
    drawPrism(G, xf, UNO_PLAN, 5.7, 5.86, M.pcbB, {
      lw: 1.6,
      top: (c, sp) => {
        c.strokeStyle = 'rgba(120,175,255,0.55)'; c.lineWidth = 0.05;
        for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-1.6 + i * 0.12, -2.6); c.lineTo(-1.6 + i * 0.12, -0.6 - i * 0.05); c.lineTo(0.2 + i * 0.12, 0.6); c.stroke(); }
        for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0.9, 0.5 + i * 0.2); c.lineTo(2.5, 0.8 + i * 0.2); c.stroke(); }
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.04;
        prect(c, -0.42, -0.35, 1.08, 3.8); c.stroke();
        ptxt(c, 'UNO', -0.95, 1.2, 0.78, 'rgba(255,255,255,0.92)', 700, 'center', Math.PI / 2);
        ptxt(c, 'R3', -0.25, 2.95, 0.3, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        ptxt(c, 'DIGITAL (PWM~)', 2.55, 0.6, 0.2, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        ptxt(c, 'POWER', -1.25, 0.25, 0.2, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        ptxt(c, 'ANALOG IN', -1.25, 2.4, 0.2, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        ['13', '12', '11', '10', '9', '8'].forEach((p, i) => ptxt(c, p, 2.62, -0.56 + i * 0.255, 0.13, 'rgba(255,255,255,0.9)', 700, 'center', Math.PI / 2));
        ['7', '6', '5', '4', '3', '2', '1', '0'].forEach((p, i) => ptxt(c, p, 2.62, 1.16 + i * 0.254, 0.13, 'rgba(255,255,255,0.9)', 700, 'center', Math.PI / 2));
        for (const [x, y] of UNO_HOLES) { c.fillStyle = rgbCss(hexRgb(M.steel.light)); pcirc(c, x, y, 0.24); c.fill(); sp(1.1); c.beginPath(); c.moveTo(x - 0.14, y - 0.06); c.lineTo(x + 0.14, y + 0.06); sp(0.8); }
        const led = (x, y, on, col) => { c.fillStyle = on ? col : 'rgba(255,255,255,0.75)'; prect(c, x - 0.07, y - 0.12, 0.14, 0.24); c.fill(); sp(0.6); if (on) glowAt(c, x, y, 0.55, col); };
        led(0.95, 2.35, ledOn, '#7dff6a');
        led(2.2, -1.0, (st.pin13 || 0) > 0.5, '#ffb547');
        led(2.2, -1.35, st.tx > 0, '#ffd166');
        led(2.2, -1.6, false, '#ffd166');
      },
    });
    const z = 5.86;
    drawBox(G, xf, [-1.67, -3.61, z], [-0.78, -2.26, 6.96], M.blk, { lw: 1.4 });
    drawBox(G, xf, [-1.45, -2.35, z], [-0.95, -1.7, 6.02], M.blk, { lw: 1.2 });
    for (const y of [-1.43, -0.73]) drawCyl(G, xf, [-1.25, y, z + 0.28], 'z', 0.3, 0.56, M.blk, { seg: 16, lw: 1.2, cap: M.steel, capFx: (c) => { c.strokeStyle = '#6b7280'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(0.2, 0); c.moveTo(0, -0.2); c.lineTo(0, 0.2); c.stroke(); } });
    drawHeader(G, xf, -1.75, -1.5, -0.76, 1.27, z, UNO_TOP, 8);
    drawHeader(G, xf, -1.75, -1.5, 1.65, 3.17, z, UNO_TOP, 6);
    drawBox(G, xf, [-0.3, -0.23, z], [0.56, 3.33, 6.08], M.blk, { lw: 1.2 });
    drawBox(G, xf, [-0.22, -0.18, 6.08], [0.48, 3.28, 6.42], M.blk, {
      lw: 1.4, top: (c) => {
        c.fillStyle = '#1b1c22'; c.beginPath(); c.arc(0.35, 0.0, 0.14, 0, Math.PI); c.fill();
        ptxt(c, 'ATMEGA328P', 0.35, 1.75, 0.2, 'rgba(220,224,235,0.85)', 700, 'center', Math.PI / 2);
        ptxt(c, '-PU', 0.12, 1.75, 0.14, 'rgba(220,224,235,0.6)', 700, 'center', Math.PI / 2);
      },
    });
    for (let k = 0; k < 14; k++) { const y = -0.05 + k * 0.254; for (const x of [-0.32, 0.5]) drawBox(G, xf, [x, y - 0.04, 6.05], [x + 0.1, y + 0.04, 6.2], M.steel, { lw: 0.8 }); }
    drawPrism(G, xf, rrPlan(1.08, -1.1, 1.52, 0.0, 0.2, 3), z, 6.2, M.steel, { lw: 1.2 });
    drawBox(G, xf, [1.55, -2.18, z], [2.05, -1.68, 5.98], M.blk, { lw: 1.1 });
    drawBox(G, xf, [2.68, -3.15, z], [3.28, -2.55, 6.15], M.steel, { lw: 1.2, top: (c) => { c.fillStyle = '#2b2c33'; pcirc(c, 0.3, 0.3, 0.17); c.fill(); } });
    drawBox(G, xf, [1.2, -4.05, z], [2.4, -2.44, 6.95], M.steel, { lw: 1.5, top: (c) => { c.strokeStyle = 'rgba(120,128,140,0.8)'; c.lineWidth = 0.05; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(0.1, i * 0.32); c.lineTo(1.1, i * 0.32); c.stroke(); } } });
    drawHeader(G, xf, 2.83, 3.08, -1.7, 0.84, z, UNO_TOP, 10);
    drawHeader(G, xf, 2.83, 3.08, 1.03, 3.06, z, UNO_TOP, 8);
  },
  floorShadow: (xf) => [boxCorners(xf, [-2.0, -3.43, 5.7], [3.33, 3.43, 6.9])],
  hostShadow: (xf) => [boxCorners(xf, [-2.0, -3.43, 5.7], [3.33, 3.43, 6.9])],
});
defineAsset('separador', {
  name: 'separador', group: 'top', layer: 0, O: [0, 0, 4.7], anchor: [0, 0, 4.7], ring: [0.7, 0.7, 4.72],
  draw(G, xf) { drawCyl(G, xf, [0, 0, 5.2], 'z', 0.3, 1.0, M.brass, { seg: 6, lw: 1.3, capFx: (c) => { c.fillStyle = '#5a4210'; pcirc(c, 0, 0, 0.14); c.fill(); } }); },
});
// UNO standoffs in robot coords (use with place('separador', id, {at: UNO_STANDOFFS[i]}))
const UNO_STANDOFFS = UNO_HOLES.map(([x, y]) => [x, y, 4.7]);

// ---- ESP32 DevKit V1 (30 pins). Native: centre of the board footprint, z=0 = breadboard top.
const ESP_ROW_A = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const ESP_ROW_B = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND2', '3V3'];
function espPin(name) {
  let k;
  if ((k = ESP_ROW_A.indexOf(name)) >= 0) return { p: [1.778 - k * 0.254, 1.27, 0.41] };
  if ((k = ESP_ROW_B.indexOf(name)) >= 0) return { p: [1.778 - k * 0.254, -1.27, 0.41] };
  return null;
}
defineAsset('esp32', {
  name: 'ESP32 DevKit', label: 'ESP32 · WIFI + BT', group: 'top', layer: 1, O: [0, 0, 0], anchor: [0, 0, 0.41], ring: [3.0, 1.8, 0.05], lab: [0, 2.2, 1.2],
  pinFn: (name) => espPin(name),
  draw(G, xf, st, inst) {
    for (const s of [1, -1]) drawBox(G, xf, [-1.92, s > 0 ? 1.13 : -1.41, 0], [1.92, s > 0 ? 1.41 : -1.13, 0.25], M.blk, { lw: 1.1 });
    drawPrism(G, xf, rrPlan(-2.575, -1.4, 2.575, 1.4, 0.12, 2), 0.25, 0.41, M.pcbK, {
      lw: 1.6,
      top: (c, sp) => {
        for (const [row, y] of [[ESP_ROW_A, 1.27], [ESP_ROW_B, -1.27]]) row.forEach((nm, k) => {
          const x = 1.778 - k * 0.254;
          c.fillStyle = rgbCss(hexRgb(M.gold.mid)); pcirc(c, x, y, 0.085); c.fill(); c.fillStyle = '#111'; pcirc(c, x, y, 0.035); c.fill();
          ptxt(c, nm.replace(/^D/, ''), x, y - Math.sign(y) * 0.22, 0.075, 'rgba(255,255,255,0.85)', 700, 'center', Math.PI / 2);
        });
        ptxt(c, 'ESP32 DEVKIT V1', -0.9, 0.0, 0.17, 'rgba(255,255,255,0.75)', 700, 'center');
        const on = st.power > 0.5;
        c.fillStyle = on ? '#ff5a4f' : 'rgba(255,255,255,0.5)'; prect(c, -0.42, 0.55, 0.12, 0.2); c.fill(); if (on) glowAt(c, -0.36, 0.65, 0.4, 'rgba(255,90,70,0.85)');
        const blue = (st.gpio2 || 0) > 0.5;
        c.fillStyle = blue ? '#5fa8ff' : 'rgba(255,255,255,0.5)'; prect(c, -0.42, -0.75, 0.12, 0.2); c.fill(); if (blue) glowAt(c, -0.36, -0.65, 0.5, 'rgba(90,160,255,0.9)');
      },
    });
    // module + shield + antenna
    drawBox(G, xf, [0.4, -0.9, 0.41], [2.56, 0.9, 0.49], M.pcbK, {
      lw: 1.2, top: (c) => {
        c.strokeStyle = rgbCss(hexRgb(M.gold.mid)); c.lineWidth = 0.05; c.beginPath();
        let x = 1.68, y = 0.15; c.moveTo(x, y);
        for (let i = 0; i < 5; i++) { y = i % 2 ? 0.15 : 1.65; c.lineTo(x, y); x += 0.08; c.lineTo(x, y); }
        c.stroke();
      },
    });
    drawBox(G, xf, [0.55, -0.8, 0.49], [2.0, 0.8, 0.8], M.steel, {
      lw: 1.4, top: (c) => {
        ptxt(c, 'ESP-WROOM-32', 0.72, 0.8, 0.16, 'rgba(70,76,90,0.9)', 700, 'center', Math.PI / 2);
        ptxt(c, 'WiFi · BT', 0.98, 0.8, 0.12, 'rgba(70,76,90,0.8)', 700, 'center', Math.PI / 2);
        c.strokeStyle = 'rgba(90,96,110,0.5)'; c.lineWidth = 0.03; prect(c, 0.08, 0.08, 1.29, 1.44, 0.06); c.stroke();
      },
    });
    drawBox(G, xf, [-1.2, -0.35, 0.41], [-0.65, 0.35, 0.55], M.blk, { lw: 1.1 });
    drawBox(G, xf, [-1.95, -0.25, 0.41], [-1.45, 0.25, 0.5], M.blk, { lw: 1.0 });
    for (const y of [-0.95, 0.95]) { drawBox(G, xf, [-2.0, y - 0.18, 0.41], [-1.64, y + 0.18, 0.52], M.steel, { lw: 1.0, top: (c) => { c.fillStyle = '#2b2c33'; pcirc(c, 0.18, 0.18, 0.1); c.fill(); } }); }
    drawBox(G, xf, [-2.72, -0.4, 0.41], [-2.18, 0.4, 0.7], M.steel, { lw: 1.3 });
  },
  floorShadow: (xf) => [boxCorners(xf, [-2.575, -1.4, 0], [2.575, 1.4, 0.8])],
});
