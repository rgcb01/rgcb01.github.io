// ---------------------------------------------------------------------------
// Instruments and bench items (from Lab 02). Native origin = centre of the footprint on the mat (z=0).
//  multimetro      autoranging DMM lying face up: LCD (st.lcd), dial (st.dial rad, st.dialPos id),
//                  buttons HOLD SELECT RANGE REL (st.press {name, k}); jacks '10A','mA','COM','V'
//  pila9v          9 V battery standing; snaps '+', '-'
//  capacitor       electrolytic {uf}; legs '+' (+x), '-' (-x) one hole apart (z=0 = breadboard top)
//  multicontacto   power strip, 3 outlets on top; slots 'F1'..'F3' (fase, narrow) 'N1'..'N3' (neutro)
//  taza            mug of coffee {steamKey}; pin 'cafe' (coffee surface centre)
//  fuenteBanco     bench DC supply 0-30 V / 0-5 A (Lab 04): displays, knobs V and A, OUTPUT, CV/CC, POWER from
//                  st.fuente; binding posts '+', 'GND', '-' (dir +x). fuPanelAt(inst, u, v) = point on the front panel
//  caiman          build marker for an alligator clip ({ghost: true}); demos draw the moving clips
// Probes, leads and the thermocouple move, so the demo draws them (drawProbe, drawLead, drawPlug).
// Clip leads (Lab 04): drawCaiman, drawBanana, drawCableCaiman, caimanEnd. Effect: drawChispa (spark).
// ---------------------------------------------------------------------------
Object.assign(M, {
  dmm: { light: '#ff8a64', mid: '#ef6a43', dark: '#c04d2b' },    // coral holster
  face: { light: '#4a4f5e', mid: '#323642', dark: '#20232b' },
  knob: { light: '#5b6070', mid: '#3c404c', dark: '#262932' },
  nine: { light: '#dcf27e', mid: '#c2e04c', dark: '#94b42b' },   // lime battery wrap
  capB: { light: '#5574bd', mid: '#344f94', dark: '#22376c' },
  coffee: { light: '#8a5a3c', mid: '#5b3a26', dark: '#3a2418' },
  mug: { light: '#ffffff', mid: '#eceff3', dark: '#c4cad4' },
});
const LCD_BG = ['#d6e2c4', '#bccaa6'], LCD_INK = '#1b241d';

// dial positions, angle clockwise from "up" (towards the LCD), degrees
const DIAL_POS = [
  { id: 'OFF', a: -150 }, { id: 'VAC', a: -120 }, { id: 'VDC', a: -90 }, { id: 'mV', a: -60 }, { id: 'OHM', a: -30 },
  { id: 'CAP', a: 0 }, { id: 'HZ', a: 30 }, { id: 'TEMP', a: 60 }, { id: 'uA', a: 90 }, { id: 'mA', a: 120 }, { id: 'A', a: 150 },
];
const dialAngle = (id) => (DIAL_POS.find(d => d.id === id).a * Math.PI) / 180;
const DMM_DIAL = [0, 1.1], DMM_JACKS = { '10A': -3.0, mA: -1.0, COM: 1.0, V: 3.0 }, DMM_JACK_Y = 7.55, DMM_FACE = 3.25;

// ---- symbols drawn as paths (no font fallback needed) --------------------------------------
function dcMark(c, x, y, w, col) {
  c.save(); c.strokeStyle = col; c.lineWidth = w * 0.13; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke();
  for (let i = 0; i < 3; i++) { const a = x - w / 2 + (i * w) / 3; c.beginPath(); c.moveTo(a, y + w * 0.32); c.lineTo(a + w * 0.2, y + w * 0.32); c.stroke(); }
  c.restore();
}
function beepIcon(c, x, y, s, col) {
  c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round';
  c.beginPath(); c.arc(x - s * 0.35, y, s * 0.13, 0, Math.PI * 2); c.fill();
  for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(x - s * 0.35, y, s * (0.12 + i * 0.2), -0.75, 0.75); c.stroke(); }
  c.restore();
}
function diodeIcon(c, x, y, s, col) {
  c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - s * 0.4, y - s * 0.32); c.lineTo(x + s * 0.18, y); c.lineTo(x - s * 0.4, y + s * 0.32); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x + s * 0.22, y - s * 0.34); c.lineTo(x + s * 0.22, y + s * 0.34); c.moveTo(x - s * 0.7, y); c.lineTo(x + s * 0.55, y); c.stroke();
  c.restore();
}
function capIcon(c, x, y, s, col) {
  c.save(); c.strokeStyle = col; c.lineWidth = s * 0.13;
  c.beginPath(); c.moveTo(x - s * 0.7, y); c.lineTo(x - s * 0.12, y); c.moveTo(x + s * 0.12, y); c.lineTo(x + s * 0.7, y);
  c.moveTo(x - s * 0.12, y - s * 0.38); c.lineTo(x - s * 0.12, y + s * 0.38); c.moveTo(x + s * 0.12, y - s * 0.38); c.lineTo(x + s * 0.12, y + s * 0.38); c.stroke();
  c.restore();
}
// dial label for one position, centred at (x, y), size s
function dmmSym(c, id, x, y, s, col) {
  const T = (t, dx = 0, k = 1) => ptxt(c, t, x + dx * s, y, s * k, col, 700, 'center');
  if (id === 'OFF') T('OFF', 0, 0.6);
  else if (id === 'VAC') T('V~', 0, 0.9);
  else if (id === 'VDC') { T('V', -0.3, 0.9); dcMark(c, x + s * 0.32, y - s * 0.12, s * 0.5, col); }
  else if (id === 'mV') { T('mV', -0.15, 0.7); dcMark(c, x + s * 0.62, y - s * 0.1, s * 0.34, col); }
  else if (id === 'OHM') { T('Ω', -0.55, 0.85); beepIcon(c, x + s * 0.22, y, s * 0.52, col); diodeIcon(c, x + s * 0.88, y, s * 0.42, col); }
  else if (id === 'CAP') capIcon(c, x, y, s * 0.8, col);
  else if (id === 'HZ') T('Hz%', 0, 0.6);
  else if (id === 'TEMP') T('°C', 0, 0.75);
  else if (id === 'uA') T('µA', 0, 0.7);
  else if (id === 'mA') T('mA', 0, 0.7);
  else if (id === 'A') T('A', 0, 0.85);
}

// LCD in canvas units. L = {v, unit, mode: 'DC'|'AC'|'', auto, hold, rel, beep, diode, neg, blank}
function drawLCD(c, x, y, w, h, L) {
  c.save();
  const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, LCD_BG[0]); g.addColorStop(1, LCD_BG[1]);
  c.fillStyle = g; prect(c, x, y, w, h, h * 0.07); c.fill();
  if (L && !L.blank) {
    const on = (b) => (b ? LCD_INK : 'rgba(27,36,29,0.08)'), fs = h * 0.15, fy = y + h * 0.16;
    ptxt(c, 'AUTO', x + w * 0.05, fy, fs, on(L.auto), 700);
    ptxt(c, 'DC', x + w * 0.27, fy, fs, on(L.mode === 'DC'), 700);
    ptxt(c, 'AC', x + w * 0.39, fy, fs, on(L.mode === 'AC'), 700);
    ptxt(c, 'HOLD', x + w * 0.51, fy, fs, on(L.hold), 700);
    ptxt(c, 'REL', x + w * 0.73, fy, fs, on(L.rel), 700);
    beepIcon(c, x + w * 0.9, fy, fs * 1.4, on(L.beep));
    diodeIcon(c, x + w * 0.9, y + h * 0.5, fs * 1.2, on(L.diode));
    const dy = y + h * 0.6, ds = h * 0.5, right = x + w * 0.74;
    ptxt(c, (L.neg ? '-' : '') + L.v, right, dy, ds, LCD_INK, 700, 'right');
    ptxt(c, L.unit || '', x + w * 0.77, y + h * 0.7, h * 0.22, LCD_INK, 700);
  }
  c.restore();
}

// ---- multímetro --------------------------------------------------------------------------------
defineAsset('multimetro', {
  name: 'multímetro', label: 'MULTÍMETRO', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, -6.3, 3.4], ring: [5.8, 10.6, 0.02], lab: [2.2, -4.0, 3.5],
  pins: Object.fromEntries(Object.entries(DMM_JACKS).map(([k, x]) => [k, { p: [x, DMM_JACK_Y, DMM_FACE + 0.25] }])),
  floorShadow: (xf) => [boxCorners(xf, [-4.7, -9.4, 0], [4.7, 9.4, 3.0])],
  draw(G, xf, st, inst) {
    const H = 3.0, F = DMM_FACE, pos = st.dialPos || 'OFF';
    drawPrism(G, xf, rrPlan(-4.7, -9.4, 4.7, 9.4, 1.5), 0, H, M.dmm, { lw: 1.9 });
    drawPrism(G, xf, rrPlan(-4.15, -8.85, 4.15, 8.85, 1.0), H, F, M.face, {
      lw: 1.5, top: (c, sp) => {
        c.fillStyle = '#16181e'; prect(c, -3.75, -8.45, 7.5, 4.35, 0.45); c.fill();
        drawLCD(c, -3.45, -8.15, 6.9, 3.75, st.lcd);
        ptxt(c, 'KAPRI LAB · MM-02', 0, 5.3, 0.36, 'rgba(255,255,255,0.55)', 700, 'center');
        // dial ring + labels
        const [dx, dy] = DMM_DIAL;
        c.beginPath(); c.arc(dx, dy, 2.62, 0, Math.PI * 2); c.fillStyle = '#272a33'; c.fill();
        for (const d of DIAL_POS) {
          const a = (d.a * Math.PI) / 180, on = d.id === pos, r = 3.42;
          const lx = dx + Math.sin(a) * r, ly = dy - Math.cos(a) * r;
          c.beginPath(); c.moveTo(dx + Math.sin(a) * 2.68, dy - Math.cos(a) * 2.68); c.lineTo(dx + Math.sin(a) * 2.9, dy - Math.cos(a) * 2.9);
          c.lineWidth = 0.09; c.strokeStyle = on ? '#c8f04a' : 'rgba(255,255,255,0.5)'; c.stroke();
          dmmSym(c, d.id, lx, ly, 0.62, on ? '#c8f04a' : (['uA', 'mA', 'A'].includes(d.id) ? '#ff9e93' : '#e9ecf2'));
        }
        // jacks: labels + warnings
        for (const [k, x] of Object.entries(DMM_JACKS)) {
          ptxt(c, { '10A': '10A', mA: 'µA mA', COM: 'COM', V: 'VΩ Hz' }[k], x, DMM_JACK_Y + 0.98, 0.34, k === 'COM' ? '#e9ecf2' : '#ff9e93', 700, 'center');
        }
        ptxt(c, 'FUSED', -2.0, DMM_JACK_Y - 0.95, 0.26, '#ff9e93', 700, 'center');
        ptxt(c, 'CAT III 600V', 2.0, DMM_JACK_Y - 0.95, 0.26, 'rgba(255,255,255,0.6)', 700, 'center');
        c.beginPath(); c.moveTo(-3.7, DMM_JACK_Y - 1.25); c.lineTo(-0.3, DMM_JACK_Y - 1.25); c.lineWidth = 0.05; c.strokeStyle = '#ff9e93'; c.stroke();
      },
    });
    // buttons
    const pr = st.press || {};
    ['HOLD', 'SELECT', 'RANGE', 'REL'].forEach((b, i) => {
      const x = -2.85 + i * 1.9, dz = pr.name === b ? -0.12 * (pr.k ?? 1) : 0, on = pr.name === b && (pr.k ?? 1) > 0.3;
      drawBox(G, xf, [x - 0.78, -3.62, F], [x + 0.78, -2.92, F + 0.22 + dz], on ? M.nine : M.knob, {
        lw: 1.1, top: (c) => ptxt(c, b, 0.78, 0.35, 0.3, on ? INK : '#dfe3ea', 700, 'center'),
      });
    });
    // dial knob + grip bar (rotates)
    const [dx, dy] = DMM_DIAL;
    drawCyl(G, xf, [dx, dy, F + 0.3], 'z', 2.38, 0.6, M.knob, { seg: 40, lw: 1.5 });
    const gx = compose(xf, [dx, dy, F + 0.6], st.dial ?? dialAngle('OFF'));
    drawBox(G, gx, [-0.55, -2.25, 0], [0.55, 2.25, 0.62], M.face, {
      lw: 1.4, top: (c) => { c.fillStyle = '#c8f04a'; c.beginPath(); c.moveTo(0.55, 0.12); c.lineTo(0.95, 0.75); c.lineTo(0.15, 0.75); c.closePath(); c.fill(); },
    });
    // jacks
    for (const [k, x] of Object.entries(DMM_JACKS)) {
      drawCyl(G, xf, [x, DMM_JACK_Y, F + 0.12], 'z', 0.55, 0.26, k === 'COM' ? M.blk : M.red, {
        seg: 24, lw: 1.2, capFx: (c) => { c.fillStyle = '#0d0e12'; pcirc(c, 0, 0, 0.28); c.fill(); },
      });
    }
  },
});

// ---- pila 9V (standing) -------------------------------------------------------------------------
defineAsset('pila9v', {
  name: 'pila 9V', label: 'PILA 9V', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, 5.2], ring: [1.8, 2.2, 0.02], lab: [-1.5, 1.5, 2.6],
  pins: { '+': { p: [0, -0.62, 5.2] }, '-': { p: [0, 0.62, 5.2] } },
  floorShadow: (xf) => [boxCorners(xf, [-0.88, -1.33, 0], [0.88, 1.33, 4.85])],
  draw(G, xf) {
    drawBox(G, xf, [-0.88, -1.33, 0], [0.88, 1.33, 3.5], M.nine, {
      lw: 1.6, noTop: true, px: (c) => { ptxt(c, '9V', 1.33, 1.6, 1.25, INK, 700, 'center'); ptxt(c, 'KAPRI', 1.33, 2.85, 0.32, 'rgba(29,32,51,0.6)', 700, 'center'); },
    });
    drawBox(G, xf, [-0.88, -1.33, 3.5], [0.88, 1.33, 4.85], M.blk, { lw: 1.6, top: (c) => { ptxt(c, '+', 0.45, 0.35, 0.38, '#ff9e93', 700, 'center'); ptxt(c, '-', 0.45, 2.3, 0.42, '#e9ecf2', 700, 'center'); } });
    drawCyl(G, xf, [0, -0.62, 5.03], 'z', 0.27, 0.36, M.steel, { seg: 20, lw: 1.2 });
    drawPrism(G, xf, [0, 1, 2, 3, 4, 5].map(i => [0.4 * Math.cos(i * Math.PI / 3), 0.62 + 0.4 * Math.sin(i * Math.PI / 3)]), 4.85, 5.2, M.steel, { lw: 1.2 });
  },
});

// ---- capacitor electrolítico ---------------------------------------------------------------------
defineAsset('capacitor', {
  name: 'capacitor', label: 'CAPACITOR', group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 1.4], ring: [0.5, 0.5, 0.02], lab: [-0.8, 0.8, 1.2],
  pins: { '+': { p: [P254 / 2, 0, 0] }, '-': { p: [-P254 / 2, 0, 0] } },
  draw(G, xf, st, inst) {
    const P = (q) => G.cam.p(xf.p(q)), c = G.ctx;
    for (const x of [-P254 / 2, P254 / 2]) { const a = P([x, 0, 0]), b = P([x, 0, 0.3]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 2.6 * LWS; c.strokeStyle = INK; c.stroke(); }
    drawCyl(G, xf, [0, 0, 0.88], 'z', 0.32, 1.15, M.capB, {
      seg: 28, lw: 1.3, capFx: (cc) => { cc.strokeStyle = 'rgba(255,255,255,0.55)'; cc.lineWidth = 0.035; cc.beginPath(); cc.moveTo(-0.16, 0); cc.lineTo(0.16, 0); cc.moveTo(0, -0.16); cc.lineTo(0, 0.16); cc.stroke(); },
    });
    // stripe on the '-' side, facing the camera
    const s0 = P([-0.24, 0.2, 0.34]), s1 = P([-0.24, 0.2, 1.42]);
    c.beginPath(); c.moveTo(s0[0], s0[1]); c.lineTo(s1[0], s1[1]); c.lineWidth = Math.max(2, 0.12 * G.cam.z); c.strokeStyle = 'rgba(230,234,242,0.85)'; c.stroke();
  },
});

// ---- multicontacto (power strip) ------------------------------------------------------------------
const STRIP_OUT = [-5.2, 0, 5.2];
defineAsset('multicontacto', {
  name: 'multicontacto', label: 'CONTACTO 127 V', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [5.2, 0, 3.3], ring: [10, 3.2, 0.02], lab: [-2.5, 2.5, 3.0],
  pins: Object.fromEntries(STRIP_OUT.flatMap((x, i) => [[`F${i + 1}`, { p: [x - 0.62, -0.1, 2.95] }], [`N${i + 1}`, { p: [x + 0.62, -0.1, 2.95] }]])),
  floorShadow: (xf) => [boxCorners(xf, [-9.2, -2.4, 0], [9.2, 2.4, 3.2])],
  draw(G, xf, st) {
    drawPrism(G, xf, rrPlan(-9.2, -2.4, 9.2, 2.4, 0.9), 0, 3.2, M.mug, {
      lw: 1.7, top: (c) => {
        for (const x of STRIP_OUT) {
          c.fillStyle = '#e1e5ec'; prect(c, x - 1.7, -1.75, 3.4, 3.5, 0.5); c.fill(); c.lineWidth = 0.05; c.strokeStyle = 'rgba(29,32,51,0.35)'; c.stroke();
          c.fillStyle = '#22252d'; prect(c, x - 0.74, -0.55, 0.24, 0.9, 0.05); c.fill(); prect(c, x + 0.46, -0.55, 0.32, 0.9, 0.05); c.fill();
          c.beginPath(); c.arc(x, 1.0, 0.24, Math.PI, 0, false); c.lineTo(x + 0.24, 1.25); c.lineTo(x - 0.24, 1.25); c.closePath(); c.fill();
        }
        ptxt(c, 'F', -5.2 - 0.62, -1.15, 0.32, '#e5484d', 700, 'center'); ptxt(c, 'N', -5.2 + 0.62, -1.15, 0.32, '#545867', 700, 'center');
        c.fillStyle = st.mains === 0 ? '#7a2b2b' : '#ff5a5a'; prect(c, 7.4, -0.9, 1.1, 1.8, 0.2); c.fill(); c.lineWidth = 0.06; c.strokeStyle = INK; c.stroke();
        ptxt(c, '127 V~ · 60 Hz', -1.0 + 4.3, 2.0, 0.3, '#545867', 700, 'center');
      },
    });
    drawWire(G, xf, [[-9.2, 0, 1.4], [-11.5, 0, 0.6], [-14, 0.8, 0.3], [-20, 1.5, 0.3]], '#f2f2ee', { w: 0.55 });
  },
});

// ---- taza (mug of coffee) --------------------------------------------------------------------------
defineAsset('taza', {
  name: 'taza', label: 'CAFÉ', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, 9.6], ring: [4.6, 4.6, 0.02], lab: [-2.5, 2.5, 3.2],
  pins: { cafe: { p: [0, 0, 9.4] } },
  floorShadow: (xf) => [cylCorners(xf, [0, 0, 4.75], 'z', 3.8, 9.5)],
  draw(G, xf, st, inst) {
    drawCyl(G, xf, [0, 0, 4.75], 'z', 3.8, 9.5, M.mug, {
      seg: 44, lw: 1.8, capFx: (c) => {
        c.fillStyle = '#4a2f1f'; pcirc(c, 0, 0, 3.35); c.fill();
        c.fillStyle = 'rgba(255,214,170,0.18)'; pcirc(c, -0.9, -0.9, 1.4); c.fill();
      },
    });
    drawWire(G, xf, [[-0.2, 3.6, 7.4], [0.0, 5.6, 7.0], [0.0, 6.0, 4.8], [0.0, 5.4, 2.6], [-0.2, 3.6, 2.4]], '#f4f6f9', { w: 0.95, n: 16 });
    const c = G.ctx;
    const s = clamp(st[(inst.opts && inst.opts.steamKey) || 'steam'] ?? 1), t = st.t || 0;
    if (s > 0.01) {
      c.save(); c.globalAlpha = 0.55 * s; c.lineWidth = Math.max(1.5, 0.12 * G.cam.z); c.strokeStyle = '#ffffff'; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        for (let i = 0; i <= 14; i++) { const z = 9.8 + i * 0.4, ph = t * 2.2 + k * 2.1 + i * 0.5; const p = G.cam.p(xf.p([(k - 1) * 1.1 + Math.sin(ph) * 0.35, (k - 1) * -0.6, z])); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        c.stroke();
      }
      c.restore();
    }
  },
});

// ---- probes, leads, plugs (drawn by demos; they move) ------------------------------------------
const PROBE_L = 8.2;
// tip: world point; ax: unit axis from tip towards the handle; col: M.red | M.blk
function drawProbe(G, base, tip, ax, col, alpha = 1) {
  if (alpha <= 0.01) return;
  const xf = new Xf(), at = (d) => add3(tip, mul3(ax, d));
  const o = { seg: 22, lw: 1.3 };
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawCyl(G, xf, at(0.55), ax, 0.07, 1.1, M.steel, o);
  drawCyl(G, xf, at(1.35), ax, 0.2, 0.7, col, o);
  drawCyl(G, xf, at(1.85), ax, 0.48, 0.18, col, o);           // finger guard
  drawCyl(G, xf, at(4.6), ax, 0.34, 5.2, col, Object.assign({}, o, { lw: 1.5 }));
  drawCyl(G, xf, at(7.6), ax, 0.22, 0.9, M.blk, o);           // strain relief
  G.ctx.restore();
}
function probeTop(tip, ax) { return add3(tip, mul3(ax, PROBE_L)); }
// banana plug standing in a jack (world point p at jack top), lifted by dz
function drawPlug(G, p, col, dz = 0, alpha = 1) {
  if (alpha <= 0.01) return;
  const xf = new Xf(), o = { seg: 20, lw: 1.3 };
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawCyl(G, xf, add3(p, [0, 0, 0.25 + dz]), 'z', 0.36, 0.5, col, o);
  drawCyl(G, xf, add3(p, [0, 0, 1.15 + dz]), 'z', 0.3, 1.3, col, o);
  G.ctx.restore();
}
// lead from the plug top to the probe top
function drawLead(G, jackP, dz, top, ax, color, alpha = 1, prog = 1) {
  if (alpha <= 0.01) return;
  const a = add3(jackP, [0, 0, 1.8 + dz]), b = top;
  const mid = add3(mul3(add3(a, b), 0.5), [0, 0, -1.2 + 0.18 * Math.hypot(b[0] - a[0], b[1] - a[1])]);
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawWire(G, new Xf(), [a, add3(a, [0, 0, 2.2]), mid, add3(b, mul3(ax, 2.2)), b], color, { w: 0.42, n: 18, prog });
  G.ctx.restore();
}

// ---- meter UI helpers shared by demos (from Lab 02) ------------------------------------------
// icon of a meter function (vdc vac ohm cont diode cap hz pct temp ma big off), centred at x,y
function dmmFnIcon(c, fn, x, y, s, col) {
  const T = (t, k = 0.8) => ptxt(c, t, x, y, s * k, col, 700, 'center');
  if (fn === 'vdc') dmmSym(c, 'VDC', x, y, s, col);
  else if (fn === 'vac') dmmSym(c, 'VAC', x, y, s, col);
  else if (fn === 'ohm') T('Ω', 0.95);
  else if (fn === 'cont') beepIcon(c, x + s * 0.15, y, s * 0.9, col);
  else if (fn === 'diode') diodeIcon(c, x, y, s * 0.85, col);
  else if (fn === 'cap') capIcon(c, x, y, s * 0.75, col);
  else if (fn === 'hz') T('Hz', 0.62);
  else if (fn === 'pct') T('%', 0.85);
  else if (fn === 'temp') T('°C', 0.7);
  else if (fn === 'ma') T('mA', 0.62);
  else if (fn === 'big') T('10A', 0.5);
  else T('OFF', 0.48);
}
// K thermocouple: yellow adapter in the meter jacks COM+V (meter xf) and a wire along world cps ending in a bead.
// tc = {a (alpha), dz (lift of the adapter), prog (0..1 of the wire)}
function drawThermocouple(G, mxf, tc, cps) {
  const xf = new Xf(), dz = tc.dz;
  G.ctx.save(); G.ctx.globalAlpha = tc.a;
  drawBox(G, mxf, [0.4, 7.0, 3.45 + dz], [3.6, 8.15, 4.75 + dz], M.yel, {
    lw: 1.4, top: (c) => { ptxt(c, 'K', 1.6, 0.58, 0.62, INK, 700, 'center'); ptxt(c, '-', 0.6, 0.58, 0.45, INK, 700, 'center'); ptxt(c, '+', 2.6, 0.58, 0.45, INK, 700, 'center'); },
  });
  if (tc.prog > 0) {
    drawWire(G, xf, cps, '#ffc928', { w: 0.28, n: 14, prog: tc.prog });
    if (tc.prog > 0.98) drawSphere(G, xf, cps[cps.length - 1], 0.32, M.brass, {});
  }
  G.ctx.restore();
}
// mini diagram inside a bay b: how the meter connects. conn: paralelo | serie | apagado | descargado
function connDiagram(c, b, conn, comp, letter) {
  const L = b.x + 22, R = b.x + b.w - 22, y1 = b.y + 116, ym = b.y + 166, cx = (L + R) / 2;
  c.save(); c.lineWidth = 2; c.strokeStyle = INK; c.fillStyle = '#fffdf8'; c.font = `700 11px ${FONT_MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const box = (x, y, w, txt) => { rr(c, x - w / 2, y - 12, w, 24, 6); c.fill(); c.stroke(); c.fillStyle = INK; c.fillText(txt, x, y + 0.5); c.fillStyle = '#fffdf8'; };
  const meter = (x, y) => { c.beginPath(); c.arc(x, y, 19, 0, Math.PI * 2); c.fillStyle = '#c8f04a'; c.fill(); c.stroke(); c.fillStyle = INK; c.font = `700 13px ${FONT_MONO}`; c.fillText(letter, x, y + 0.5); c.font = `700 11px ${FONT_MONO}`; c.fillStyle = '#fffdf8'; };
  if (conn === 'serie') {
    c.beginPath(); c.moveTo(L, ym - 25); c.lineTo(R, ym - 25); c.stroke();
    box(L + (R - L) * 0.3, ym - 25, 86, comp); meter(L + (R - L) * 0.72, ym - 25);
    c.beginPath(); c.moveTo(L + 8, ym + 8); c.lineTo(R - 8, ym + 8); c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(R - 8, ym + 8); c.lineTo(R - 18, ym + 2); c.lineTo(R - 18, ym + 14); c.closePath(); c.fill();
    c.fillStyle = '#545867'; c.fillText('la corriente pasa POR el multímetro', cx, ym + 26);
  } else {
    const n1 = L + 34, n2 = R - 34;
    c.beginPath(); c.moveTo(n1, y1); c.lineTo(n2, y1); c.moveTo(n1, y1); c.lineTo(n1, ym); c.lineTo(cx - 19, ym); c.moveTo(n2, y1); c.lineTo(n2, ym); c.lineTo(cx + 19, ym); c.stroke();
    box(cx, y1, 96, comp); meter(cx, ym);
    for (const x of [n1, n2]) { c.fillStyle = INK; c.beginPath(); c.arc(x, y1, 3.5, 0, Math.PI * 2); c.fill(); }
    if (conn === 'apagado' || conn === 'descargado') {
      const x = R - 6, y = b.y + 64; c.strokeStyle = '#e5484d'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x - 4, y - 14); c.lineTo(x - 11, y + 1); c.lineTo(x - 3, y + 1); c.lineTo(x - 9, y + 15); c.stroke();
      c.beginPath(); c.moveTo(x - 20, y - 14); c.lineTo(x + 6, y + 14); c.stroke();
    }
  }
  c.restore();
}


// ---- fuente de poder de banco (from Lab 04) ------------------------------------------------------
// Bench DC supply 0-30 V / 0-5 A of our own design (not a real brand). Body 20 x 16 x 12 cm, origin = centre of
// the footprint. Front panel on the +x face: u along -y (0..15.2, left to right on screen), v down from the top
// (0..10.6). Reads st.fuente = {pwr, out, vs, il, vTxt: '05.00', aTxt: '0.020', cv, cc, press (OUTPUT 0..1)}.
// Pins '+', 'GND', '-': tip of each binding post (dir +x). fuPanelAt(inst, u, v, dx) -> world point on the panel.
Object.assign(M, {
  psu: { light: '#ffd97a', mid: '#f5b93c', dark: '#c48a1d' },   // yellow body
  gnd: { light: '#5fd68f', mid: '#2fb86a', dark: '#1f8a4c' },   // green ground post
});
const FU = { X1: 10, Y1: 7.6, Z1: 11.6, kv: [3.0, 7.15], ki: [12.2, 7.15], out: [7.6, 7.3], pwr: [1.3, 9.45], postV: 9.45,
  post: { '+': 8.9, GND: 11.1, '-': 13.3 }, vmax: 30, imax: 5, disp: { v: [1.15, 1.3], a: [7.85, 1.3], h: 1.9 } };
const fuP = (u, v, dx = 0) => [FU.X1 + dx, FU.Y1 - u, FU.Z1 - v];
const fuAng = (f) => ((clamp(f) * 270 - 135) * Math.PI) / 180;       // knob 0..1 -> -135..135° (clockwise from up)
function fuPanelAt(inst, u, v, dx = 0) { return inst.local(fuP(u, v, dx)); }
// 7-segment number with decimal point ('05.00'), x, y = top-left, h = digit height (face units)
function fuDigits(c, x, y, h, txt, on, off) {
  const w = h * 0.55, gap = h * 0.22; let i = 0;
  for (const ch of txt) {
    if (ch === '.') { c.fillStyle = on; pcirc(c, x + i * (w + gap) - gap * 0.5, y + h - h * 0.07, h * 0.075); c.fill(); continue; }
    seg7(c, x + i * (w + gap), y, h, ch, on, off); i++;
  }
}
function fuPanel(c, F) {
  const on = F.pwr > 0.5, out = on && F.out > 0.5;
  ptxt(c, 'KAPRI LAB · FUENTE DC · PS-04', 0.55, 0.36, 0.3, 'rgba(255,255,255,0.72)', 700);
  ptxt(c, '0-30 V · 0-5 A', 14.65, 0.36, 0.3, 'rgba(255,255,255,0.55)', 700, 'right');
  // displays
  c.fillStyle = '#16181e'; prect(c, 0.5, 0.68, 14.2, 3.62, 0.35); c.fill();
  c.fillStyle = '#0b0c10'; prect(c, 0.72, 0.9, 13.76, 3.18, 0.25); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.08)'; prect(c, 7.45, 1.05, 0.05, 2.9, 0); c.fill();
  const red = '#ff5a3c', redOff = 'rgba(255,90,60,0.09)', grn = '#86ff6e', grnOff = 'rgba(134,255,110,0.08)', h = FU.disp.h;
  fuDigits(c, FU.disp.v[0], FU.disp.v[1], h, on ? F.vTxt : '    ', red, redOff);
  ptxt(c, 'V', 6.78, 2.3, 0.85, on ? red : redOff, 700);
  fuDigits(c, FU.disp.a[0], FU.disp.a[1], h, on ? F.aTxt : '    ', grn, grnOff);
  ptxt(c, 'A', 13.5, 2.3, 0.85, on ? grn : grnOff, 700);
  if (on && !out) ptxt(c, 'SALIDA OFF', 7.6, 3.72, 0.26, 'rgba(255,255,255,0.45)', 700, 'center');
  // CV / CC
  const led = (u, col, lit, lab) => {
    c.fillStyle = lit ? col : 'rgba(255,255,255,0.13)'; pcirc(c, u, 4.88, 0.2); c.fill();
    if (lit) { c.fillStyle = col.replace(')', ',0.25)').replace('rgb', 'rgba'); pcirc(c, u, 4.88, 0.42); c.fill(); }
    ptxt(c, lab, u + 0.36, 4.9, 0.38, lit ? '#ffffff' : 'rgba(255,255,255,0.6)', 700);
  };
  led(6.25, 'rgb(134,255,110)', out && F.cv, 'CV'); led(8.25, 'rgb(255,90,60)', out && F.cc, 'CC');
  // knob scales and labels
  const scale = (k, lab, n, ends) => {
    const [ku, kv] = k;
    ptxt(c, lab, ku, 4.9, 0.36, '#ffffff', 700, 'center');
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.06; c.lineCap = 'round';
    for (let i = 0; i <= n; i++) { const a = fuAng(i / n), s = Math.sin(a), co = Math.cos(a), r0 = i % (n / 2) === 0 ? 1.38 : 1.45; c.beginPath(); c.moveTo(ku + s * r0, kv - co * r0); c.lineTo(ku + s * 1.66, kv - co * 1.66); c.stroke(); }
    ptxt(c, ends[0], ku + Math.sin(fuAng(0)) * 1.95, kv - Math.cos(fuAng(0)) * 1.95 + 0.1, 0.3, 'rgba(255,255,255,0.75)', 700, 'center');
    ptxt(c, ends[1], ku + Math.sin(fuAng(1)) * 1.95, kv - Math.cos(fuAng(1)) * 1.95 + 0.1, 0.3, 'rgba(255,255,255,0.75)', 700, 'center');
  };
  scale(FU.kv, 'VOLTAJE', 6, ['0', '30']); scale(FU.ki, 'CORRIENTE', 10, ['0', '5']);
  ptxt(c, 'OUTPUT', FU.out[0], 6.2, 0.34, '#ffffff', 700, 'center');
  // power rocker
  const [sx, sy] = FU.pwr;
  ptxt(c, 'POWER', sx, sy - 1.05, 0.3, 'rgba(255,255,255,0.75)', 700, 'center');
  c.fillStyle = '#0d0e12'; prect(c, sx - 0.55, sy - 0.65, 1.1, 1.3, 0.15); c.fill();
  c.fillStyle = on ? '#e5484d' : '#5a2a2c'; prect(c, sx - 0.4, on ? sy - 0.5 : sy - 0.02, 0.8, 0.52, 0.08); c.fill();
  ptxt(c, on ? 'I' : 'O', sx, on ? sy - 0.24 : sy + 0.24, 0.28, '#ffffff', 700, 'center');
  // output posts
  const [pu, pg, pm] = [FU.post['+'], FU.post.GND, FU.post['-']], pv = FU.postV;
  c.fillStyle = 'rgba(255,255,255,0.07)'; prect(c, pu - 1.0, pv - 1.45, pm - pu + 2.0, 2.55, 0.3); c.fill();
  ptxt(c, '+', pu, pv - 1.05, 0.5, '#ff8a8a', 700, 'center'); ptxt(c, 'GND', pg, pv - 1.05, 0.3, '#7fe3a5', 700, 'center'); ptxt(c, '−', pm, pv - 1.05, 0.5, '#e9ecf2', 700, 'center');
  ptxt(c, 'SALIDA DC', (pu + pm) / 2, pv + 0.92, 0.26, 'rgba(255,255,255,0.55)', 700, 'center');
}
defineAsset('fuenteBanco', {
  name: 'fuente de poder', label: 'FUENTE DC 30 V · 5 A', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, 12.2], ring: [11.5, 9.6, 0.02], lab: [-3, 3, 2.5],
  pins: Object.fromEntries(Object.entries(FU.post).map(([k, u]) => [k, { p: fuP(u, FU.postV, 1.3), dir: [1, 0, 0] }])),
  floorShadow: (xf) => [boxCorners(xf, [-10, -8, 0], [10, 8, 12.2])],
  draw(G, xf, st) {
    const F = st.fuente || { pwr: 0, out: 0, vs: 0, il: 0.5, vTxt: '00.00', aTxt: '0.000', cv: 0, cc: 0, press: 0 };
    for (const [x, y] of [[-8.6, -6.6], [-8.6, 6.6], [8.4, -6.6], [8.4, 6.6]]) drawCyl(G, xf, [x, y, 0.35], 'z', 0.7, 0.7, M.blk, { seg: 18, lw: 1.1 });
    drawBox(G, xf, [-10, -8, 0.7], [9.4, 8, 12.2], M.psu, {
      lw: 1.9,
      top: (c) => {
        c.strokeStyle = 'rgba(90,60,10,0.35)'; c.lineWidth = 0.16; c.lineCap = 'round';
        for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(3 + i * 1.25, 3.2); c.lineTo(3 + i * 1.25, 12.8); c.stroke(); }
        ptxt(c, 'PS-04', 1.2, 1.4, 0.8, 'rgba(90,60,10,0.45)', 700);
      },
      py: (c) => { c.strokeStyle = 'rgba(90,60,10,0.3)'; c.lineWidth = 0.14; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(2 + i * 0.9, 3.5); c.lineTo(2 + i * 0.9, 8.5); c.stroke(); } },
    });
    drawBox(G, xf, [9.4, -7.6, 1.0], [FU.X1, FU.Y1, FU.Z1], M.face, { lw: 1.6, px: (c) => fuPanel(c, F) });
    // OUTPUT button (pressed in by F.press) with its lime LED
    const on = F.pwr > 0.5 && F.out > 0.5, [ou, ov] = FU.out, dz = 0.42 - 0.22 * clamp(F.press || 0);
    drawBox(G, xf, [FU.X1, FU.Y1 - ou - 1.05, FU.Z1 - ov - 0.6], [FU.X1 + dz, FU.Y1 - ou + 1.05, FU.Z1 - ov + 0.6], M.knob, {
      lw: 1.2, px: (c) => { c.fillStyle = on ? '#c8f04a' : '#2b2f37'; prect(c, 0.5, 0.42, 1.1, 0.36, 0.1); c.fill(); ptxt(c, on ? 'ON' : 'OFF', 1.05, 0.95, 0.24, on ? '#e9f7b9' : '#9aa0ab', 700, 'center'); },
    });
    // knobs with a lime pointer
    const knob = ([ku, kv], f) => {
      drawCyl(G, xf, fuP(ku, kv, 0.08), 'x', 1.34, 0.16, M.face, { seg: 36, lw: 1.1 });
      drawCyl(G, xf, fuP(ku, kv, 0.6), 'x', 1.12, 0.9, M.knob, { seg: 36, lw: 1.5 });
      const a = fuAng(f), A = G.cam.p(xf.p(fuP(ku + Math.sin(a) * 0.25, kv - Math.cos(a) * 0.25, 1.06))), B = G.cam.p(xf.p(fuP(ku + Math.sin(a) * 0.95, kv - Math.cos(a) * 0.95, 1.06)));
      const c = G.ctx; c.save(); c.lineCap = 'round'; c.strokeStyle = '#c8f04a'; c.lineWidth = Math.max(2, 0.2 * G.cam.z); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.restore();
    };
    knob(FU.kv, (F.vs ?? 0) / FU.vmax); knob(FU.ki, (F.il ?? 0) / FU.imax);
    // binding posts
    for (const [k, u] of Object.entries(FU.post)) {
      const m = k === '+' ? M.red : k === 'GND' ? M.gnd : M.blk;
      drawCyl(G, xf, fuP(u, FU.postV, 0.24), 'x', 0.66, 0.48, m, { seg: 6, lw: 1.2 });
      drawCyl(G, xf, fuP(u, FU.postV, 0.88), 'x', 0.5, 0.84, m, { seg: 24, lw: 1.3, capFx: (c) => { c.fillStyle = '#0d0e12'; pcirc(c, 0, 0, 0.2); c.fill(); } });
    }
  },
});

// ---- caimanes: test leads with alligator clips (from Lab 04) ---------------------------------------
// They move, so demos draw them: drawCaiman(G, tip, ax, col, {open, alpha}) where tip = world point the jaws bite and
// ax = unit axis from the tip towards the lead; drawBanana(G, post, col) = plug in a binding post (post = inst.pin());
// drawCableCaiman(G, post, tip, ax, color) = the lead between them. 'caiman' is a build marker ({ghost: true}).
const CAI = { jaw: 1.4, boot: 2.3 };
const caimanEnd = (tip, ax) => add3(tip, mul3(ax, CAI.jaw + CAI.boot));
function drawCaiman(G, tip, ax, col, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  const xf = new Xf(), op = clamp(o.open ?? 0), at = (d) => add3(tip, mul3(ax, d));
  let up = sub3([0, 0, 1], mul3(ax, ax[2])); up = Math.hypot(...up) < 0.1 ? [1, 0, 0] : norm3(up);
  G.ctx.save(); G.ctx.globalAlpha = a;
  const pivot = at(CAI.jaw);
  for (const s of [-1, 1]) {
    const t2 = add3(tip, mul3(up, s * (0.06 + 0.42 * op))), d = norm3(sub3(pivot, t2)), L = Math.hypot(...sub3(pivot, t2));
    drawFrustum(G, xf, add3(t2, mul3(d, L / 2)), d, 0.07, 0.22, L, M.steel, { seg: 12, lw: 1.1 });
  }
  drawFrustum(G, xf, at(CAI.jaw + CAI.boot / 2), ax, 0.3, 0.42, CAI.boot, col, { seg: 18, lw: 1.3 });
  G.ctx.restore();
}
function drawBanana(G, post, col, alpha = 1) {
  if (alpha <= 0.01) return;
  const xf = new Xf(), o = { seg: 20, lw: 1.2 };
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawCyl(G, xf, add3(post.p, mul3(post.dir, 0.25)), post.dir, 0.4, 0.5, col, o);
  drawCyl(G, xf, add3(post.p, mul3(post.dir, 1.15)), post.dir, 0.31, 1.3, col, o);
  G.ctx.restore();
}
function drawCableCaiman(G, post, tip, ax, color, alpha = 1, sag = 1.4) {
  if (alpha <= 0.01) return;
  const p0 = add3(post.p, mul3(post.dir, 1.8)), p1 = add3(p0, mul3(post.dir, 0.8)), e = caimanEnd(tip, ax), e1 = add3(e, mul3(ax, 0.5));
  const mid = mul3(add3(p1, e1), 0.5); mid[2] = Math.max(0.3, mid[2] - Math.min(sag, 0.25 * Math.hypot(...sub3(p1, e1))));
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawWire(G, new Xf(), [p0, p1, mid, e1, e], color, { w: 0.3, n: 18 });
  G.ctx.restore();
}
defineAsset('caiman', {
  name: 'caimán', label: 'CAIMÁN', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.6], ring: null, lab: [-1.6, 1.6, 2.4],
  draw(G, xf, st, inst) { if (!inst.opts.ghost) drawCaiman(G, xf.p([0, 0, 0.4]), [-1, 0, 0], inst.opts.color === 'K' ? M.blk : M.red); },
});
// spark at world point p, k = 0..1 (from Lab 04: connecting with the output on)
function drawChispa(G, p, k, seed = 7) {
  if (k <= 0.01) return;
  const c = G.ctx, P = G.cam.p(p), z = G.cam.z, rnd = mulberry32(seed);
  glowAt(c, P[0], P[1], z * 1.7 * k, `rgba(255,214,110,${0.9 * k})`);
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, L = z * (0.45 + rnd() * 1.2) * (0.5 + 0.5 * k), r0 = z * 0.1;
    c.strokeStyle = i % 3 ? `rgba(255,232,140,${k})` : `rgba(255,255,255,${k})`; c.lineWidth = Math.max(1.4, z * 0.055);
    c.beginPath(); c.moveTo(P[0] + Math.cos(a) * r0, P[1] + Math.sin(a) * r0); c.lineTo(P[0] + Math.cos(a) * L, P[1] + Math.sin(a) * L); c.stroke();
  }
  c.restore();
}
