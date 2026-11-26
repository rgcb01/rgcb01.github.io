// ---------------------------------------------------------------------------
// Soldering bench (from Lab 03). Native origin = centre of the footprint on the mat (z=0).
//  estacionSoldar   soldering station: LED display and knob from st.estacion {on, temp, set, ready};
//                   pin 'cable' (mouth of the iron socket, dir +y)
//  baseCautin       iron stand: cast base, spring holder and brass wool; pins 'funda' (tip rest inside the
//                   spring, dir = spring axis) and 'viruta' (top of the brass wool). drawBaseFrente() draws
//                   the front turns of the spring over a parked iron.
//  placaPractica    practice PCB, solder side up, on 4 standoffs: 4 pads with resistor leads 'j1'..'j4'.
//                   Joint k reads st.U[k] {wet, ball, s, liquid, oxid, lift, heat, res, burn}: fillet or ball,
//                   heat glow, rosin residue, lifted pad (model in demos/lab03-cautin/model.js)
//  cautin, tuboSoldadura   build markers for the iron and the solder tube ({ghost: true} draws nothing:
//                   they move, so the demo draws them with drawCautin / drawTuboSoldadura / drawCableCautin)
// Effects: drawHumo (flux smoke from a history). 2D: corteUnion (cross-section of a joint), perfilUnion
// (verdict icon), tecla (keycap), seg7 (LED digits).
// ---------------------------------------------------------------------------
Object.assign(M, {
  teal: { light: '#62d9c9', mid: '#2fb8a7', dark: '#1e8c7f' },       // station body
  cobre: { light: '#f9c29b', mid: '#e39a66', dark: '#b06a3c' },      // copper pads
  estano: { light: '#ffffff', mid: '#d3d8e1', dark: '#939bab' },      // shiny tin-lead solder
  estanoMate: { light: '#c4c7ce', mid: '#a1a6b0', dark: '#767b86' },  // dull / oxidised solder
  punta: { light: '#9aa0ac', mid: '#6b717e', dark: '#454a55' },       // iron-plated tip
  tubo: { light: '#d2f6ff', mid: '#96dcf0', dark: '#5fb0cb' },        // solder tube
});
const mixMat = (a, b, t) => { t = Math.round(clamp(t) * 20) / 20; const f = (k) => '#' + mixRgb(hexRgb(a[k]), hexRgb(b[k]), clamp(t)).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); return { light: f('light'), mid: f('mid'), dark: f('dark') }; };

// practice board geometry (cm). Tm: Sn63Pb37 melts at 183 °C (eutectic, datasheets). Pads 2 mm, holes 1 mm,
// leads 0.64 mm, 2.54 mm grid (resistor leads 4 holes apart).
const SOLD = { Tm: 183, Z0: 1.1, ZB: 1.26, RP: 0.1, RH: 0.05, RL: 0.032, LEAD: 0.22, J: [-1.905, -0.889, 0.889, 1.905], X0: -3.2, X1: 3.2, Y0: -2.1, Y1: 2.1 };
// fillet profile [[dz, r], ...] in cm around the lead. wet = mm of 0.8 mm wire melted into the joint, s = spread 0..1
function filetePerfil(wet, s) {
  const rb = SOLD.RL + (SOLD.RP - SOLD.RL) * (0.25 + 0.75 * clamp(s)), hf = clamp(0.035 + 0.026 * wet, 0.035, 0.21);
  const kappa = clamp((wet - 4.2) / 2.5), out = [];          // past ~4 mm of wire the fillet turns convex (too much)
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, f = lerp((1 - u) ** 2, Math.sqrt(Math.max(0, 1 - u * u)), kappa);
    out.push([u * hf, SOLD.RL + (rb * (1 + 0.3 * kappa) - SOLD.RL) * f]);
  }
  return out;
}
// radius (cm) of a ball of solder from mm of 0.8 mm wire (0.503 mm³ per mm)
const bolaR = (mm) => 0.1 * Math.cbrt((3 * 0.503 * Math.max(0, mm)) / (4 * Math.PI));
function solderTop(U) {
  let z = 0;
  if (U.wet > 0.05) z = Math.max(z, filetePerfil(U.wet, U.s).at(-1)[0]);
  if (U.ball > 0.05) z = Math.max(z, 1.643 * bolaR(U.ball));
  return z;
}

// ---- 7-segment LED digits (face units): x, y = top-left, h = digit height -----------------------------
const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
function seg7(c, x, y, h, str, on, off) {
  const w = h * 0.55, t = h * 0.12, gap = h * 0.22;
  [...str].forEach((ch, i) => {
    const ox = x + i * (w + gap), lit = SEG7[ch] ?? '';
    const S = { a: [ox + t, y, w - 2 * t, t], d: [ox + t, y + h - t, w - 2 * t, t], g: [ox + t, y + h / 2 - t / 2, w - 2 * t, t],
      f: [ox, y + t, t, h / 2 - t * 1.4], b: [ox + w - t, y + t, t, h / 2 - t * 1.4], e: [ox, y + h / 2 + t * 0.4, t, h / 2 - t * 1.4], c: [ox + w - t, y + h / 2 + t * 0.4, t, h / 2 - t * 1.4] };
    for (const [k, r] of Object.entries(S)) { c.fillStyle = lit.includes(k) ? on : off; prect(c, r[0], r[1], r[2], r[3], t * 0.4); c.fill(); }
  });
}

// ---- estación de soldadura ----------------------------------------------------------------------------
// front panel on the +y face: u along +x (0..9), v down from the top (0..8.5)
const EST = { knob: [6.7, 6.25], sock: [2.1, 6.5], sw: [4.35, 6.4] };
const estKnobAng = (set) => ((clamp((set - 200) / 250) * 270 - 135) * Math.PI) / 180;  // 200..450 °C -> -135..135°
function estPanel(c, E, on, t) {
  c.fillStyle = '#20232b'; prect(c, 0.55, 0.6, 7.9, 4.0, 0.45); c.fill();
  c.fillStyle = '#0d0e12'; prect(c, 0.85, 0.9, 7.3, 3.4, 0.3); c.fill();
  const red = '#ff5a3c', dim = 'rgba(255,90,60,0.1)';
  seg7(c, 1.45, 1.3, 2.2, on ? String(Math.round(E.temp)).padStart(3, ' ') : '   ', red, dim);
  ptxt(c, '°C', 6.3, 1.85, 0.66, on ? red : dim, 700);
  if (on) ptxt(c, `SET ${Math.round(E.set)}`, 6.3, 3.2, 0.34, '#ffb39f', 700);
  const led = !on ? '#3a2a2a' : E.ready ? '#c8f04a' : (Math.floor((t || 0) * 4) % 2 ? '#ff9a3c' : '#7a3a1a');
  c.fillStyle = led; pcirc(c, 7.9, 4.95, 0.2); c.fill();
  ptxt(c, 'KAPRI LAB · ESTACIÓN · ST 03', 0.7, 4.95, 0.3, 'rgba(255,255,255,0.82)', 700);
  // knob scale
  const [kx, ky] = EST.knob;
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.07; c.lineCap = 'round';
  for (let T = 200; T <= 450; T += 50) {
    const a = estKnobAng(T), s = Math.sin(a), co = Math.cos(a);
    c.beginPath(); c.moveTo(kx + s * 1.42, ky - co * 1.42); c.lineTo(kx + s * 1.68, ky - co * 1.68); c.stroke();
    if (T % 100 === 0 || T === 450) ptxt(c, String(T), kx + s * 2.05, ky - co * 2.05, 0.3, 'rgba(255,255,255,0.8)', 700, 'center');
  }
  // power rocker + label
  const [sx, sy] = EST.sw;
  c.fillStyle = '#16181e'; prect(c, sx - 0.5, sy - 0.62, 1.0, 1.24, 0.15); c.fill();
  c.fillStyle = on ? '#e5484d' : '#5a2a2c'; prect(c, sx - 0.36, sy - 0.48, 0.72, 0.5, 0.08); c.fill();
  ptxt(c, 'I', sx, sy - 0.23, 0.3, on ? '#fff' : '#bbb', 700, 'center');
  ptxt(c, 'O', sx, sy + 0.25, 0.28, '#9aa0ab', 700, 'center');
}
defineAsset('estacionSoldar', {
  name: 'estación', label: 'ESTACIÓN', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 5.5, 6.5], ring: [6.4, 7.6, 0.02], lab: [-2.2, 3.2, 3.6],
  pins: { cable: { p: [-4.5 + EST.sock[0], 5.5 + 1.25, 8.5 - EST.sock[1]], dir: [0, 1, 0] } },
  floorShadow: (xf) => [boxCorners(xf, [-4.5, -5.5, 0], [4.5, 5.5, 8.5])],
  draw(G, xf, st) {
    const E = st.estacion || { on: 0, temp: 25, set: 340, ready: 0 }, on = E.on > 0.5;
    drawBox(G, xf, [-4.5, -5.5, 0], [4.5, 5.5, 8.5], M.teal, {
      lw: 1.9,
      top: (c) => {
        c.strokeStyle = 'rgba(16,48,44,0.35)'; c.lineWidth = 0.13; c.lineCap = 'round';
        for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(1.5, 1.6 + i * 0.62); c.lineTo(5.6, 1.6 + i * 0.62); c.stroke(); }
        ptxt(c, '200-450 °C', 1.5, 7.2, 0.42, 'rgba(255,255,255,0.75)', 700);
        ptxt(c, 'Sn63Pb37 · 340 °C', 1.5, 8.0, 0.32, 'rgba(255,255,255,0.6)', 700);
      },
      py: (c) => estPanel(c, E, on, st.t),
    });
    const P = (u, v, dy = 0) => [-4.5 + u, 5.5 + dy, 8.5 - v];
    // iron socket + strain relief
    drawCyl(G, xf, P(EST.sock[0], EST.sock[1], 0.15), 'y', 0.8, 0.3, M.steel, {
      seg: 28, lw: 1.3, capFx: (c) => { c.fillStyle = '#1a1c22'; pcirc(c, 0, 0, 0.5); c.fill(); c.fillStyle = '#c9ced8'; for (let i = 0; i < 5; i++) { pcirc(c, 0.26 * Math.cos(i * 1.257), 0.26 * Math.sin(i * 1.257), 0.06); c.fill(); } },
    });
    drawFrustum(G, xf, P(EST.sock[0], EST.sock[1], 0.75), 'y', 0.42, 0.24, 0.9, M.blk, { seg: 20, lw: 1.2 });
    // knob with a lime pointer
    const ang = estKnobAng(E.set ?? 340);
    drawCyl(G, xf, P(EST.knob[0], EST.knob[1], 0.45), 'y', 1.15, 0.9, M.knob, {
      seg: 36, lw: 1.5, capFx: (c) => {
        c.strokeStyle = '#c8f04a'; c.lineWidth = 0.2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(Math.cos(ang) * 0.25, Math.sin(ang) * 0.25); c.lineTo(Math.cos(ang) * 0.92, Math.sin(ang) * 0.92); c.stroke();
      },
    });
  },
});

// ---- base del cautín --------------------------------------------------------------------------------
const BASE = { A: (() => { const v = [0.3, -0.72, 0.62], l = Math.hypot(...v); return v.map(x => x / l); })(), S0: [-0.4, -1.3, 2.25], R: 1.0, L: 5.4, turns: 7, wool: [0, 2.5, 3.3] };
function baseResorte(G, xf, front) {
  const [A, E1, E2] = cylBasis(BASE.A), N = 220, c = G.ctx, pts = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * BASE.L, ph = (i / N) * BASE.turns * Math.PI * 2, rad = add3(mul3(E1, Math.cos(ph)), mul3(E2, Math.sin(ph)));
    pts.push({ q: G.cam.p(xf.p(add3(add3(BASE.S0, mul3(A, s)), mul3(rad, BASE.R + 0.04 * s)))), f: dot3(xf.n(rad), VC) > 0 });
  }
  const w = Math.max(1.6, 0.17 * G.cam.z);
  c.save(); c.lineCap = 'round';
  for (const [lw, col] of [[w + 2.4 * LWS, INK], [w, '#d8dde6']]) {
    c.lineWidth = lw; c.strokeStyle = col; c.beginPath();
    for (let i = 1; i <= N; i++) { if (pts[i].f !== front || pts[i - 1].f !== front) continue; c.moveTo(pts[i - 1].q[0], pts[i - 1].q[1]); c.lineTo(pts[i].q[0], pts[i].q[1]); }
    c.stroke();
  }
  c.restore();
}
function drawBaseFrente(G, xf) { baseResorte(G, xf, true); }
defineAsset('baseCautin', {
  name: 'base del cautín', label: 'BASE + VIRUTA', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 2.5, 3.3], ring: [4.4, 6.4, 0.02], lab: [-2.2, 2.6, 3.4],
  pins: { funda: { p: add3(BASE.S0, mul3(BASE.A, 0.8)), dir: BASE.A }, viruta: { p: BASE.wool } },
  floorShadow: (xf) => [boxCorners(xf, [-3.4, -5.2, 0], [3.4, 5.2, 1.1]), cylCorners(xf, [0, 2.5, 2.2], 'z', 2.05, 2.2), cylCorners(xf, add3(BASE.S0, mul3(BASE.A, BASE.L / 2)), BASE.A, BASE.R, BASE.L)],
  draw(G, xf) {
    drawPrism(G, xf, rrPlan(-3.4, -5.2, 3.4, 5.2, 1.3), 0, 1.1, M.blk, { lw: 1.8 });
    drawCyl(G, xf, [0, 2.5, 2.2], 'z', 2.05, 2.2, M.steel, {
      seg: 40, lw: 1.6, capFx: (c) => {
        c.fillStyle = '#5a4520'; pcirc(c, 0, 0, 1.92); c.fill();
        c.save(); pcirc(c, 0, 0, 1.92); c.clip();
        const rnd = mulberry32(31), cols = [M.brass.light, M.brass.mid, M.brass.dark, '#fff1b8'];
        for (let i = 0; i < 70; i++) {
          const x = (rnd() * 2 - 1) * 1.8, y = (rnd() * 2 - 1) * 1.8, r = 0.18 + rnd() * 0.42, a0 = rnd() * 6.3;
          c.strokeStyle = cols[i % 4]; c.lineWidth = 0.05 + rnd() * 0.05; c.beginPath(); c.arc(x, y, r, a0, a0 + 2.2 + rnd() * 2.5); c.stroke();
        }
        c.restore();
      },
    });
    drawCyl(G, xf, [BASE.S0[0], BASE.S0[1], 1.65], 'z', 0.45, 1.1, M.steel, { seg: 20, lw: 1.3 });
    baseResorte(G, xf, false);
  },
});

// ---- placa de práctica ------------------------------------------------------------------------------
function padRing(c, x, y, ro, ri, col = '#e8a06d') { c.fillStyle = col; pcirc(c, x, y, ro); c.fill(); c.fillStyle = '#16181e'; pcirc(c, x, y, ri); c.fill(); }
function placaTop(c, U) {
  c.save(); c.translate(-SOLD.X0, -SOLD.Y0);
  for (const y of [-1.65, -1.396, 1.396, 1.65]) for (let i = -10; i <= 10; i++) padRing(c, (i + 0.5) * 0.254, y, 0.07, 0.033);
  for (const [x, y] of [[-2.85, -1.8], [2.85, -1.8], [-2.85, 1.8], [2.85, 1.8]]) { c.fillStyle = '#d5dae2'; pcirc(c, x, y, 0.2); c.fill(); c.strokeStyle = '#8d94a3'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(x - 0.12, y); c.lineTo(x + 0.12, y); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,0.88)'; c.lineWidth = 0.028;
  for (const [a, b, name] of [[0, 1, 'R1'], [2, 3, 'R2']]) {
    const xa = SOLD.J[a], xb = SOLD.J[b]; prect(c, xa + 0.19, -0.16, xb - xa - 0.38, 0.32, 0.06); c.stroke();
    ptxt(c, name, (xa + xb) / 2, 0.01, 0.17, 'rgba(255,255,255,0.92)', 700, 'center');
  }
  SOLD.J.forEach((x, k) => ptxt(c, String(k + 1), x, 0.33, 0.2, 'rgba(255,255,255,0.95)', 700, 'center'));
  ptxt(c, 'KAPRI LAB · PRÁCTICA DE SOLDADURA', 0, 1.93, 0.17, 'rgba(255,255,255,0.85)', 700, 'center');
  ptxt(c, 'lado de soldadura', 0, -1.93, 0.15, 'rgba(255,255,255,0.7)', 700, 'center');
  SOLD.J.forEach((x, k) => {
    const u = U[k];
    if (u && u.res > 0.01) {                                    // rosin residue: amber, darker when burnt
      const b = clamp(u.burn || 0), g = c.createRadialGradient(x, 0, 0.06, x, 0, 0.27);
      g.addColorStop(0, `rgba(${lerp(226, 96, b) | 0},${lerp(162, 52, b) | 0},${lerp(52, 20, b) | 0},${0.55 * u.res})`); g.addColorStop(1, 'rgba(226,162,52,0)');
      c.fillStyle = g; pcirc(c, x, 0, 0.27); c.fill();
    }
    if (u && u.heat > 0.01) { const g = c.createRadialGradient(x, 0, 0, x, 0, 0.6); g.addColorStop(0, `rgba(255,120,40,${0.5 * u.heat})`); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; pcirc(c, x, 0, 0.6); c.fill(); }
    if (u && u.lift > 0.02) { c.fillStyle = '#c9c39a'; pcirc(c, x, 0, 0.115); c.fill(); c.strokeStyle = '#3a2a1a'; c.lineWidth = 0.02; c.beginPath(); c.arc(x, 0, 0.13, 0.4, 2.6); c.stroke(); }
    else padRing(c, x, 0, SOLD.RP, SOLD.RH);
  });
  c.restore();
}
// solder ball resting on the pad around the lead (contact angle ~130°): sphere clipped above the pad plane
function drawBola(G, xf, p, r, m, shine) {
  const C = xf.p(add3(p, [0, 0, 0.643 * r])), rc = 0.766 * r, cx = G.ctx, P0 = xf.p(p);
  const ell = []; for (let i = 0; i <= 24; i++) { const a = (3 * Math.PI) / 4 - (i / 24) * Math.PI; ell.push(G.cam.p([P0[0] + rc * Math.cos(a), P0[1] + rc * Math.sin(a), P0[2]])); }
  const L = ell[0], R = ell[ell.length - 1];
  cx.save(); cx.beginPath(); cx.moveTo(L[0] - 1e4, L[1]); for (const q of ell) cx.lineTo(q[0], q[1]); cx.lineTo(R[0] + 1e4, R[1]); cx.lineTo(R[0] + 1e4, -1e5); cx.lineTo(L[0] - 1e4, -1e5); cx.closePath(); cx.clip();
  drawSphere(G, new Xf(), C, r, m, { lw: 1.1 });
  if (shine > 0.05) { const S = G.cam.p(C), Rp = r * G.cam.z; cx.fillStyle = `rgba(255,255,255,${0.8 * shine})`; cx.beginPath(); cx.ellipse(S[0] - Rp * 0.38, S[1] - Rp * 0.42, Rp * 0.18, Rp * 0.12, -0.6, 0, Math.PI * 2); cx.fill(); }
  cx.restore();
  cx.save(); cx.beginPath(); ell.forEach((q, i) => (i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]))); cx.lineWidth = 1.1 * LWS; cx.strokeStyle = INK; cx.stroke(); cx.restore();
}
// one joint: lifted pad, lead, fillet or ball. U = st.U[k] or null (bare pad)
function drawUnion3D(G, xf, p, U, t) {
  const lift = U ? clamp(U.lift || 0) : 0, dz = 0.085 * lift, Z = (z) => add3(p, [0, 0, z + dz]);
  if (lift > 0.02) {
    const pts = [], C = Z(0), tilt = 0.9 * lift;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, x = Math.cos(a) * SOLD.RP, y = Math.sin(a) * SOLD.RP; pts.push(G.cam.p(xf.p([C[0] + x, C[1] + y, C[2] + Math.max(0, x) * tilt]))); }
    const under = pts.map(q => [q[0], q[1] + dz * G.cam.z * 0.9]);
    fillStroke(G, under, '#2a2016', 0.8); fillStroke(G, pts, rgbCss(hexRgb(M.cobre.mid)), 1.1);
  }
  drawCyl(G, xf, Z(SOLD.LEAD / 2), 'z', SOLD.RL, SOLD.LEAD, M.steel, { seg: 12, lw: 0.9 });
  if (!U) return;
  const top = solderTop(U), mat = mixMat(M.estano, M.estanoMate, U.oxid || 0), shine = (1 - clamp(U.oxid || 0)) * (U.liquid ? 1 : 0.75);
  if (U.wet > 0.05) drawRevol(G, xf, Z(0), filetePerfil(U.wet, U.s), mat, { shine, glint: U.liquid ? t * 9 : 0, lw: 1.1 });
  if (U.ball > 0.05) drawBola(G, xf, Z(0), bolaR(U.ball), mixMat(M.estano, M.estanoMate, 0.55), 0.35);
  if (top > 0.005 && top < SOLD.LEAD - 0.01) drawCyl(G, xf, Z((top + SOLD.LEAD) / 2), 'z', SOLD.RL, SOLD.LEAD - top, M.steel, { seg: 12, lw: 0.9 });
}
defineAsset('placaPractica', {
  name: 'placa de práctica', label: 'PLACA DE PRÁCTICA', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, SOLD.ZB], ring: [4.0, 3.0, 0.02], lab: [-2.6, 2.6, 2.6],
  pins: Object.fromEntries(SOLD.J.map((x, i) => [`j${i + 1}`, { p: [x, 0, SOLD.ZB] }])),
  floorShadow: (xf) => [boxCorners(xf, [SOLD.X0, SOLD.Y0, SOLD.Z0], [SOLD.X1, SOLD.Y1, SOLD.ZB])],
  draw(G, xf, st) {
    const U = st.U || [], hex = [0, 1, 2, 3, 4, 5].map(i => [0.24 * Math.cos(i * Math.PI / 3 + 0.5), 0.24 * Math.sin(i * Math.PI / 3 + 0.5)]);
    for (const [x, y] of [[-2.85, -1.8], [2.85, -1.8], [-2.85, 1.8], [2.85, 1.8]]) drawPrism(G, compose(xf, [x, y, 0]), hex, 0, SOLD.Z0, M.brass, { lw: 1.1 });
    drawBox(G, xf, [SOLD.X0, SOLD.Y0, SOLD.Z0], [SOLD.X1, SOLD.Y1, SOLD.ZB], M.pcbG, { lw: 1.6, top: (c) => placaTop(c, U) });
    SOLD.J.forEach((x, k) => drawUnion3D(G, xf, [x, 0, SOLD.ZB], U[k] || null, st.t || 0));
  },
});

// ---- build markers for the moving tools (the demo draws them) -------------------------------------------
defineAsset('cautin', {
  name: 'cautín', label: 'CAUTÍN', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0], ring: null, lab: [-1.8, 1.8, 3.2],
  draw(G, xf, st, inst) { if (!inst.opts.ghost) drawCautin(G, xf.p([-7.8, 0, 0.88]), [1, 0, 0], { shine: 1 }); },
});
defineAsset('tuboSoldadura', {
  name: 'soldadura 63/37', label: 'SOLDADURA 63/37', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0], ring: null, lab: [-1.8, 1.8, 2.6],
  draw(G, xf, st, inst) { if (!inst.opts.ghost) drawTuboSoldadura(G, xf.p([-5.8, 0, 0.66]), [1, 0, 0], 2.2); },
});

// ---- the iron (moves) -------------------------------------------------------------------------------
// tip = world point of the tip end; ax = unit axis from the tip towards the handle.
// o: {alpha, shine (0..1 tinned tip), drop (mm of wire as a bead on the tip)}
const CAUTIN = [[0, 0.42, 0.03, 0.12, 'tin'], [0.42, 1.45, 0.12, 0.3, 'punta'], [1.45, 4.6, 0.3, 0.3, 'steel'], [4.6, 5.7, 0.52, 0.52, 'steel'],
  [5.7, 6.3, 0.8, 0.8, 'nine'], [6.3, 13.3, 0.88, 0.88, 'blk'], [13.3, 15.6, 0.7, 0.36, 'blk']];
const CAUTIN_L = 15.6;
function drawCautin(G, tip, ax, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  const xf = new Xf(), at = (d) => add3(tip, mul3(ax, d)), c = G.ctx, far = dot3(ax, VC) < 0 ? 1 : -1;
  const segs = CAUTIN.map(([d0, d1, r0, r1, m]) => ({ d0, d1, r0, r1, m: m === 'tin' ? mixMat(M.punta, M.estano, o.shine ?? 1) : M[m] })).sort((p, q) => far * (q.d0 - p.d0));
  c.save(); c.globalAlpha = a;
  for (const s of segs) {
    const L = s.d1 - s.d0, cc = at((s.d0 + s.d1) / 2);
    if (s.r0 === s.r1) drawCyl(G, xf, cc, ax, s.r0, L, s.m, { seg: 26, lw: 1.3 });
    else drawFrustum(G, xf, cc, ax, s.r0, s.r1, L, s.m, { seg: 26, lw: 1.2 });
  }
  if ((o.drop || 0) > 0.05) drawSphere(G, xf, add3(at(0.14), [0, 0, -0.03]), Math.max(0.035, bolaR(o.drop)), M.estano, { lw: 1.1 });
  c.restore();
}
// iron cable: from the rear of the iron (tip + ax * CAUTIN_L) to the station socket, resting on the mat in the middle
function drawCableCautin(G, tip, ax, sock, dir, alpha = 1) {
  if (alpha <= 0.01) return;
  const a = add3(tip, mul3(ax, CAUTIN_L)), a2 = add3(a, mul3(ax, 2.2)), b2 = add3(sock, mul3(dir, 2.2));
  const m1 = lerp3(a2, b2, 0.35), m2 = lerp3(a2, b2, 0.68); m1[2] = 0.36; m2[2] = 0.36;
  G.ctx.save(); G.ctx.globalAlpha = alpha;
  drawWire(G, new Xf(), [a, a2, m1, m2, b2, sock], '#2b2c33', { w: 0.34, n: 16 });
  G.ctx.restore();
}
// ---- solder tube dispenser (moves): wire = world point of the wire end; ax = axis towards the tube; L = wire out (cm)
function drawTuboSoldadura(G, wire, ax, L = 2.2, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  const xf = new Xf(), at = (d) => add3(wire, mul3(ax, d)), c = G.ctx, far = dot3(ax, VC) < 0 ? 1 : -1;
  const parts = [[0, L, 0.04, 0.04, M.estano], [L, L + 0.9, 0.08, 0.36, M.white], [L + 0.9, L + 1.4, 0.5, 0.5, M.white], [L + 1.4, L + 8.6, 0.6, 0.6, M.tubo], [L + 8.6, L + 9.4, 0.66, 0.66, M.white]]
    .sort((p, q) => far * (q[0] - p[0]));
  c.save(); c.globalAlpha = a;
  for (const [d0, d1, r0, r1, m] of parts) {
    const cc = at((d0 + d1) / 2);
    if (r0 === r1) drawCyl(G, xf, cc, ax, r0, d1 - d0, m, { seg: r0 < 0.1 ? 10 : 24, lw: r0 < 0.1 ? 0.8 : 1.3 });
    else drawFrustum(G, xf, cc, ax, r0, r1, d1 - d0, m, { seg: 22, lw: 1.2 });
  }
  drawCyl(G, xf, at(L + 5.2), ax, 0.62, 2.0, M.nine, { seg: 24, lw: 1.2, noCap: true });
  c.restore();
}

// ---- flux smoke: three strands rising from p (world); amt(te) = intensity 0..1 emitted at time te ------------
function drawHumo(G, p, amt, t, o = {}) {
  const c = G.ctx, life = o.life ?? 1.5, sc = o.scale ?? 1;
  c.save(); c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    let prev = null;
    for (let i = 0; i <= 22; i++) {
      const age = (i / 22) * life, te = t - age, I = clamp(amt(te)), ph = te * 2.6 + k * 2.1;
      const q = G.cam.p(add3(p, [Math.sin(ph) * 0.07 * sc * (0.3 + age), (k - 1) * 0.05 * sc * (0.4 + age) + Math.cos(ph * 0.7) * 0.05 * sc * age, (0.04 + age * 0.85) * sc]));
      if (prev && I > 0.02) {
        const al = 0.42 * I * (1 - age / life), w = Math.max(1.4, (0.025 + 0.06 * age) * sc * G.cam.z);
        c.lineWidth = w + 2; c.strokeStyle = `rgba(29,32,51,${0.1 * al})`; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke();
        c.lineWidth = w; c.strokeStyle = o.burnt ? `rgba(150,146,150,${al})` : `rgba(252,252,255,${al})`; c.stroke();
      }
      prev = q;
    }
  }
  c.restore();
}

// ---- 2D: cross-section of a joint inside a circle (screen px) --------------------------------------------
// J = {U (joint state), iron (0..1 contact), drop (mm on the tip), wire (0..1 at the joint), wireTip (0..1 on the tip),
//      shine (tinned tip), smoke (0..1), t}. Scale: the 2 mm pad spans ~0.85 R.
function corteUnion(c, cx, cy, R, J, a = 1) {
  if (a <= 0.01) return;
  const U = J.U || { wet: 0, ball: 0, s: 0, oxid: 0, lift: 0, heat: 0 }, k = R / 2.35, t = J.t || 0;
  const X = (x) => cx + x * k, Y = (y) => cy + 0.5 * R - y * k, H = clamp(U.heat || 0);
  const warm = (base, f) => rgbCss(mixRgb(hexRgb(base), [255, 122, 40], 0.55 * f));
  c.save(); c.globalAlpha = a;
  c.fillStyle = 'rgba(29,32,51,0.22)'; c.beginPath(); c.arc(cx + 5, cy + 6, R, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fbf8f1'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.arc(cx, cy, R - 1.5, 0, Math.PI * 2); c.clip();
  c.strokeStyle = 'rgba(60,64,110,0.08)'; c.lineWidth = 1;
  for (let x = -3; x <= 3; x += 0.5) { c.beginPath(); c.moveTo(X(x), cy - R); c.lineTo(X(x), cy + R); c.stroke(); }
  // board in section (hatched), with the hole
  const lift = clamp(U.lift || 0), gz = 0.16 * lift;
  for (const [x0, x1] of [[-3.2, -0.5], [0.5, 3.2]]) {
    c.fillStyle = warm('#2a9c63', H * 0.35); c.fillRect(X(x0), Y(0), (x1 - x0) * k, 1.6 * k);
    c.save(); c.beginPath(); c.rect(X(x0), Y(0), (x1 - x0) * k, 1.6 * k); c.clip(); c.strokeStyle = 'rgba(16,60,36,0.45)'; c.lineWidth = 1.2;
    for (let s = -4; s < 8; s += 0.32) { c.beginPath(); c.moveTo(X(x0 + s), Y(0)); c.lineTo(X(x0 + s + 1.6), Y(-1.6)); c.stroke(); }
    c.restore(); c.lineWidth = 2; c.strokeStyle = INK; c.strokeRect(X(x0), Y(0), (x1 - x0) * k, 1.6 * k);
  }
  // solder: fillet (wet) or ball; heat shows on pad and lead
  const prof = U.wet > 0.05 ? filetePerfil(U.wet, U.s).map(([z, r]) => [z * 10, r * 10]) : null;
  const sMat = mixMat(M.estano, M.estanoMate, U.oxid || 0);
  if (prof) {
    const fill = clamp(U.s) * clamp(U.wet / 2);
    c.beginPath(); c.moveTo(X(-prof[0][1]), Y(gz));
    for (const [z, r] of prof) c.lineTo(X(-r), Y(z + gz));
    for (const [z, r] of prof.slice().reverse()) c.lineTo(X(r), Y(z + gz));
    c.lineTo(X(0.5), Y(gz)); c.lineTo(X(0.5), Y(-1.6 * fill)); c.lineTo(X(-0.5), Y(-1.6 * fill)); c.lineTo(X(-0.5), Y(gz)); c.closePath();
    const g = c.createLinearGradient(X(-1.2), 0, X(1.2), 0); g.addColorStop(0, sMat.light); g.addColorStop(0.5, sMat.mid); g.addColorStop(1, sMat.dark);
    c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    const sh = (1 - clamp(U.oxid || 0)) * (U.liquid ? 1 : 0.7);
    if (sh > 0.05) { c.save(); c.strokeStyle = `rgba(255,255,255,${0.85 * sh})`; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); prof.slice(2, 10).forEach(([z, r], i) => { const yy = Y(z + gz + 0.08 + (U.liquid ? 0.03 * Math.sin(t * 9 + i) : 0)); i ? c.lineTo(X(-r - 0.02), yy) : c.moveTo(X(-r - 0.02), yy); }); c.stroke(); c.restore(); }
    if ((U.oxid || 0) > 0.3) { const rnd = mulberry32(5); c.fillStyle = `rgba(70,70,80,${0.5 * U.oxid})`; for (let i = 0; i < 40; i++) { const r = prof[0][1] * rnd(), z = prof.at(-1)[0] * rnd(); c.fillRect(X((rnd() < 0.5 ? -1 : 1) * Math.max(0.32, r)), Y(z * (1 - r / prof[0][1]) + gz), 2.2, 2.2); } }
  }
  const rb = U.ball > 0.05 ? bolaR(U.ball) * 10 : 0;
  if (rb > 0) {
    c.save(); c.beginPath(); c.rect(cx - R, cy - R, 2 * R, Y(0) - (cy - R)); c.clip();
    const bm = mixMat(M.estano, M.estanoMate, 0.55), g = c.createRadialGradient(X(-rb * 0.35), Y(0.643 * rb + rb * 0.35), rb * k * 0.1, X(0), Y(0.643 * rb), rb * k);
    g.addColorStop(0, bm.light); g.addColorStop(0.6, bm.mid); g.addColorStop(1, bm.dark);
    c.fillStyle = g; c.beginPath(); c.arc(X(0), Y(0.643 * rb), rb * k, 0, Math.PI * 2); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.restore();
  }
  // copper pad (raised when lifted) and the lead
  for (const s of [-1, 1]) {
    c.fillStyle = warm('#e39a66', H); const x0 = s < 0 ? -1.0 : 0.5;
    c.save(); c.translate(X(s < 0 ? -1.0 : 1.0), Y(0)); c.rotate(s * 0.18 * lift); c.translate(-X(s < 0 ? -1.0 : 1.0), -Y(0));
    c.fillRect(X(x0), Y(0.09 + gz), 0.5 * k, 0.09 * k); c.lineWidth = 1.6; c.strokeStyle = INK; c.strokeRect(X(x0), Y(0.09 + gz), 0.5 * k, 0.09 * k); c.restore();
  }
  if (lift > 0.05) { c.strokeStyle = '#1d2033'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(X(-1.1), Y(0.02)); c.lineTo(X(1.1), Y(0.02)); c.stroke(); c.setLineDash([]); }
  const lg = c.createLinearGradient(X(-0.32), 0, X(0.32), 0); lg.addColorStop(0, warm('#eef1f5', H)); lg.addColorStop(1, warm('#9aa1ae', H));
  c.fillStyle = lg; c.fillRect(X(-0.32), Y(2.2 + gz), 0.64 * k, (2.2 + 1.8) * k); c.lineWidth = 2; c.strokeStyle = INK; c.strokeRect(X(-0.32), Y(2.2 + gz), 0.64 * k, (2.2 + 1.8) * k);
  // iron tip from the upper right: tip end at the corner of pad and lead; slides back along its axis when lifted
  const ti = clamp(J.iron ?? 0), back = (1 - ti) * 1.6, ang = -0.9;            // screen angle of the axis (up-right)
  const ux = Math.cos(ang), uy = Math.sin(ang), tx = X(0.42) + ux * back * k, ty = Y(0.16 + gz) + uy * back * k;
  if ((J.ironA ?? 1) > 0.01) {
    c.save(); c.globalAlpha = a * (J.ironA ?? 1); c.translate(tx, ty); c.rotate(ang);
    const tip = mixMat(M.punta, M.estano, J.shine ?? 1);
    c.beginPath(); c.moveTo(0, -0.14 * k); c.lineTo(3.6 * k, -0.95 * k); c.lineTo(3.6 * k, 0.95 * k); c.lineTo(0, 0.14 * k); c.arc(0, 0, 0.14 * k, Math.PI / 2, -Math.PI / 2); c.closePath();
    const g = c.createLinearGradient(0, -0.95 * k, 0, 0.95 * k); g.addColorStop(0, '#9aa0ac'); g.addColorStop(1, '#3f444f'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.fillStyle = tip.mid; c.fillRect(-0.2 * k, -k, 0.75 * k, 2 * k); c.restore();
    c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    if (H > 0.05 && ti > 0.9) for (let i = 0; i < 3; i++) { const f = ((t * 1.6 + i / 3) % 1); c.strokeStyle = `rgba(255,122,40,${0.9 * H * (1 - f)})`; c.lineWidth = 3; c.beginPath(); c.moveTo((1.4 - 1.2 * f) * k, -0.25 * k); c.lineTo((1.15 - 1.2 * f) * k, 0); c.lineTo((1.4 - 1.2 * f) * k, 0.25 * k); c.stroke(); }
    c.restore();
    if ((J.drop || 0) > 0.05) { const r = bolaR(J.drop) * 10 * k; c.fillStyle = '#e6e9ef'; c.beginPath(); c.arc(tx + 0.05 * k, ty + r * 0.6, r, 0, Math.PI * 2); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
  }
  // solder wire from the upper left, to the joint or to the tip
  const w = clamp(J.wire ?? 0), wt = clamp(J.wireTip ?? 0), wa = -2.3, wx = Math.cos(wa), wy = Math.sin(wa);
  const ex = wt > 0.01 ? lerp(X(-0.4), tx - 0.1 * k, wt) : X(-0.4), ey = wt > 0.01 ? lerp(Y(0.18 + gz), ty - 0.3 * k, wt) : Y(0.18 + gz);
  const wb = (1 - Math.max(w, wt)) * 1.8;
  if ((J.wireA ?? 1) > 0.01) {
    c.save(); c.globalAlpha = a * (J.wireA ?? 1); c.translate(ex + wx * wb * k, ey + wy * wb * k); c.rotate(wa);
    c.beginPath(); c.moveTo(0, -0.4 * k); c.lineTo(4 * k, -0.4 * k); c.lineTo(4 * k, 0.4 * k); c.lineTo(0, 0.4 * k); c.arc(0, 0, 0.4 * k, Math.PI / 2, -Math.PI / 2, false); c.closePath();
    const g = c.createLinearGradient(0, -0.4 * k, 0, 0.4 * k); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a3aab7'); c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#e8a43a'; c.fillRect(0.4 * k, -0.12 * k, 3.6 * k, 0.24 * k);  // rosin core
    c.restore();
  }
  // flux bubbles
  if ((J.smoke || 0) > 0.05) for (let i = 0; i < 6; i++) { const f = (t * 1.3 + i / 6) % 1, x = X(-0.7 + (i % 3) * 0.45 + 0.1 * Math.sin(i + t * 3)), y = Y(0.3 + gz) - f * 1.4 * k; c.strokeStyle = `rgba(29,32,51,${0.5 * J.smoke * (1 - f)})`; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, (0.06 + 0.08 * f) * k, 0, Math.PI * 2); c.stroke(); }
  c.restore();
  // contact angle: θ < 90° wets (IPC-A-610); θ > 90° does not
  const good = prof && U.s > 0.6 && !(rb > 0 && U.ball > U.wet);
  if (lift > 0.3) pill(c, X(0), Y(-0.85), 'PAD DESPEGADO', { align: 'center', valign: 'middle', bg: '#ff9e93', size: 11, padY: 5, alpha: a * clamp((lift - 0.3) / 0.2) });
  if ((prof || rb > 0) && (J.angle ?? 1) > 0.01 && lift < 0.3) {
    let px, py, th;
    if (good) { px = X(-prof[0][1]); py = Y(gz); const q = prof[3]; th = Math.atan2(Y(q[0] + gz) - py, X(-q[1]) - px); }
    else { const r = rb > 0 ? rb : prof[0][1]; px = X(-0.766 * r); py = Y(0); th = -(130 * Math.PI) / 180; }
    c.save(); c.globalAlpha = a * (J.angle ?? 1); c.strokeStyle = good ? '#5f8f12' : '#d4380d'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(px, py, 26, th, 0); c.stroke(); c.restore();
    pill(c, px - 18, py - 50, good ? 'θ < 90° ✓' : 'θ > 90° ✗', { align: 'right', bg: good ? '#c8f04a' : '#ff9e93', size: 11, padY: 5, alpha: a * (J.angle ?? 1) });
  }
  c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
  c.restore();
}

// ---- 2D: verdict icon (tiny cross-section). kind: buena fria poca mucha quemada nada --------------------------
function perfilUnion(c, x, y, s, kind, col = INK) {
  const X = (u) => x + u * s, Y = (v) => y - v * s;
  c.save(); c.lineWidth = Math.max(1.2, s * 0.06); c.strokeStyle = col; c.lineJoin = 'round';
  const lift = kind === 'quemada' ? 0.12 : 0;
  c.fillStyle = '#2a9c63'; c.fillRect(X(-1), Y(0), s * 0.8, s * 0.5); c.fillRect(X(0.2), Y(0), s * 0.8, s * 0.5); c.strokeRect(X(-1), Y(0), s * 0.8, s * 0.5); c.strokeRect(X(0.2), Y(0), s * 0.8, s * 0.5);
  c.fillStyle = '#e39a66'; c.fillRect(X(-0.6), Y(0.08 + lift), s * 0.4, s * 0.08); c.fillRect(X(0.2), Y(0.08 + lift), s * 0.4, s * 0.08);
  const sol = kind === 'quemada' ? '#a1a6b0' : '#d3d8e1';
  c.fillStyle = sol; c.beginPath();
  if (kind === 'buena' || kind === 'quemada') { c.moveTo(X(-0.6), Y(lift)); c.quadraticCurveTo(X(-0.15), Y(0.05 + lift), X(-0.1), Y(0.55 + lift)); c.lineTo(X(0.1), Y(0.55 + lift)); c.quadraticCurveTo(X(0.15), Y(0.05 + lift), X(0.6), Y(lift)); c.closePath(); c.fill(); c.stroke(); }
  else if (kind === 'poca') { c.moveTo(X(-0.25), Y(0)); c.quadraticCurveTo(X(-0.12), Y(0.04), X(-0.1), Y(0.22)); c.lineTo(X(0.1), Y(0.22)); c.quadraticCurveTo(X(0.12), Y(0.04), X(0.25), Y(0)); c.closePath(); c.fill(); c.stroke(); }
  else if (kind === 'mucha') { c.ellipse(X(0), Y(0.42), s * 0.62, s * 0.45, 0, Math.PI, 0); c.lineTo(X(0.62), Y(0)); c.lineTo(X(-0.62), Y(0)); c.closePath(); c.fill(); c.stroke(); }
  else if (kind === 'fria') { c.arc(X(0), Y(0.33), s * 0.32, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.fillStyle = '#c9ced8'; c.fillRect(X(-0.1), Y(0.95), s * 0.2, s * 1.45); c.strokeRect(X(-0.1), Y(0.95), s * 0.2, s * 1.45);
  c.restore();
}
// keycap with a label to its right; on = pressed
function tecla(c, x, y, key, label, on, col = '#c8f04a') {
  const w = 34, h = 32, d = on ? 2 : 0;
  c.save();
  c.fillStyle = INK; rr(c, x, y + 4, w, h, 7); c.fill();
  c.fillStyle = on ? col : '#fffdf8'; rr(c, x, y + d, w, h - 2, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.font = `700 15px ${FONT_MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(key, x + w / 2, y + d + h / 2 - 1);
  c.textAlign = 'left'; c.font = `700 12.5px ${FONT_MONO}`; c.letterSpacing = '0.6px'; c.fillStyle = on ? INK : '#6b6f7a'; c.fillText(label, x + w + 10, y + h / 2);
  c.restore();
}
