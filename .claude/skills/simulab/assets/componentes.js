// ---------------------------------------------------------------------------
// Breadboard parts. Native origin = point on the breadboard top (z=0) under the part,
// so place(type, id, {at: bb.pin('a12').p}) drops it into that hole.
//  protoboard400  (holes 'a1'..'j30', rails 't+1'..'t+25', 't-', 'b+', 'b-')
//  led5 {color:'R'|'G'|'B'|'Y'|'W', litKey, burnKey}  legs: 'anodo' (+x), 'catodo'; burnKey = burnt look (Lab 04)
//  resistencia {ohm: 220, span: 4}             legs 'a', 'b' span*0.254 apart along x
//  boton {cap: '#e5484d', pressKey}           legs '1a','1b','2a','2b' (straddles the channel)
//  potenciometro {angleKey}                   legs '1','w','3'
//  buzzer {onKey}                             legs '+', '-'
//  servoSG90 {angleKey}                       sits on the mat; connector pins 'GND','VCC','SIG'
//  placaCarga {tag, text, res}                test load board on the mat (Lab 04): loops '+', '-', spots 'led', 'res'
// ---------------------------------------------------------------------------
const P254 = 0.254;
function bb400Hole(name) {
  let m = /^([a-j])(\d{1,2})$/.exec(name);
  if (m) {
    const r = m[1].charCodeAt(0) - 97, col = Number(m[2]);
    if (col < 1 || col > 30) return null;
    const y = r < 5 ? -1.524 + r * P254 : 0.508 + (r - 5) * P254;
    return { p: [(col - 15.5) * P254, y, 0.85] };
  }
  m = /^([tb])([+-])(\d{1,2})$/.exec(name);
  if (m) {
    const n = Number(m[3]) - 1, g = Math.floor(n / 5), idx = n % 5;
    if (n < 0 || n > 24) return null; // 25 holes per rail
    const x = -3.556 + g * 1.524 + idx * P254;
    const y = m[1] === 't' ? (m[2] === '+' ? 2.33 : 2.076) : (m[2] === '+' ? -2.33 : -2.076);
    return { p: [x, y, 0.85] };
  }
  return null;
}
defineAsset('protoboard400', {
  name: 'protoboard 400', label: 'PROTOBOARD 400', group: 'floor', layer: 0, O: [0, 0, 0], anchor: [0, 0, 0.85], ring: [4.6, 3.2, 0.05], lab: [-3.0, 3.6, 1.2],
  pinFn: (name) => bb400Hole(name),
  draw(G, xf) {
    drawPrism(G, xf, rrPlan(-4.125, -2.75, 4.125, 2.75, 0.18, 2), 0, 0.85, M.bb, {
      lw: 1.8,
      top: (c, sp) => {
        c.fillStyle = 'rgba(0,0,0,0.1)'; prect(c, -4.0, -0.3, 8.0, 0.6, 0.1); c.fill();
        for (const [y, col] of [[2.55, '#e5484d'], [1.86, '#3d84e6'], [-1.86, '#3d84e6'], [-2.55, '#e5484d']]) { c.fillStyle = col; prect(c, -3.7, y - 0.025, 7.4, 0.05); c.fill(); }
        c.fillStyle = '#5b5f6b';
        for (let col = 1; col <= 30; col++) for (let r = 0; r < 10; r++) { const h = bb400Hole(String.fromCharCode(97 + r) + col).p; prect(c, h[0] - 0.05, h[1] - 0.05, 0.1, 0.1); c.fill(); }
        for (const side of ['t+', 't-', 'b+', 'b-']) for (let n = 1; n <= 25; n++) { const h = bb400Hole(side + n).p; prect(c, h[0] - 0.05, h[1] - 0.05, 0.1, 0.1); c.fill(); }
        for (let col = 5; col <= 30; col += 5) for (const y of [-1.78, 1.78]) ptxt(c, String(col), (col - 15.5) * P254, y, 0.12, 'rgba(60,64,80,0.7)', 700, 'center');
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].forEach((l, r) => { const y = r < 5 ? -1.524 + r * P254 : 0.508 + (r - 5) * P254; for (const x of [-3.95, 3.95]) ptxt(c, l, x, y, 0.12, 'rgba(60,64,80,0.7)', 700, 'center'); });
        for (const [x, y] of [[-3.85, 2.45], [3.85, -2.45]]) { ptxt(c, '+', x, y, 0.2, '#e5484d', 700, 'center'); }
      },
    });
  },
  floorShadow: (xf) => [boxCorners(xf, [-4.125, -2.75, 0], [4.125, 2.75, 0.85])],
});

// LED 5 mm ---------------------------------------------------------------------------
defineAsset('led5', {
  name: 'LED 5 mm', label: 'LED', group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.9], ring: [0.5, 0.5, 0.02], lab: [0.6, 0.9, 1.0],
  pins: { anodo: { p: [P254 / 2, 0, 0] }, catodo: { p: [-P254 / 2, 0, 0] } },
  draw(G, xf, st, inst) {
    // burnKey (from Lab 04): st[burnKey] 0..1 darkens the lens, blackens the top and cracks it (burnt LED)
    const burn = inst.opts.burnKey ? clamp(st[inst.opts.burnKey] ?? 0) : 0;
    const col0 = M['led' + (inst.opts.color || 'R')] || M.ledR, col = burn > 0 ? ledQuemado(col0, burn) : col0;
    const lit = clamp(st[inst.opts.litKey] ?? 0) * (1 - burn);
    const P = (q) => G.cam.p(xf.p(q)), c = G.ctx;
    for (const [x, top] of [[-P254 / 2, 0.16], [P254 / 2, 0.16]]) { const a = P([x, 0, 0]), b = P([x, 0, top]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = 3.2 * LWS; c.strokeStyle = INK; c.stroke(); c.lineWidth = 1.6 * LWS; c.strokeStyle = '#c9cdd6'; c.stroke(); }
    drawCyl(G, xf, [0, 0, 0.2], 'z', 0.29, 0.08, col, { seg: 24, lw: 1.2, alpha: 0.95 });
    drawCyl(G, xf, [0, 0, 0.47], 'z', 0.25, 0.46, col, { seg: 24, lw: 1.3, alpha: 0.93, noCap: true });
    drawSphere(G, xf, [0, 0, 0.7], 0.25, col, { lw: 1.3 });
    if (lit > 0) {
      const p = P([0, 0, 0.62]), r = 0.9 * G.cam.z;
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      const rgb = hexRgb(col.light); g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.95 * lit})`); g.addColorStop(0.35, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.35 * lit})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, Math.PI * 2); c.fill(); c.restore();
    }
    if (burn > 0.5) {
      const a = (burn - 0.5) * 2, t = P([0, 0, 0.95]), R = 0.17 * G.cam.z;
      c.save(); c.globalAlpha = a; c.fillStyle = '#1b1414'; c.beginPath(); c.ellipse(t[0], t[1] + R * 0.1, R, R * 0.62, 0, 0, Math.PI * 2); c.fill();
      const q = [[-0.2, 0.05, 0.86], [-0.05, 0.02, 0.72], [-0.12, -0.04, 0.55], [0.02, -0.02, 0.42]].map(P);
      c.strokeStyle = 'rgba(255,240,230,0.85)'; c.lineWidth = Math.max(1.2, 0.035 * G.cam.z); c.lineJoin = 'round'; c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.restore();
    }
  },
});
// burnt LED lens: the colour goes to a dark brown-grey
function ledQuemado(m, k) {
  const to = { light: '#8a6a5e', mid: '#5a4640', dark: '#2e2426' }, f = (key) => '#' + mixRgb(hexRgb(m[key]), hexRgb(to[key]), clamp(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  return { light: f('light'), mid: f('mid'), dark: f('dark') };
}

// resistor with colour bands from its value ----------------------------------------------------
const BAND = ['#1d1e25', '#8a4b22', '#e5484d', '#ff8a3d', '#ffd23f', '#33b866', '#3d7fff', '#9b6be0', '#9aa0ab', '#ffffff'];
function resistorBands(ohm) {
  const e = Math.floor(Math.log10(ohm)) - 1, d = Math.round(ohm / Math.pow(10, e));
  return [BAND[Math.floor(d / 10) % 10], BAND[d % 10], BAND[Math.max(0, e)], '#d4a72c'];
}
defineAsset('resistencia', {
  name: 'resistencia', label: null, group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.35], ring: [0.8, 0.4, 0.02], lab: [0, 0.9, 0.9],
  pinFn: (name, inst) => { const h = ((inst.opts.span || 4) * P254) / 2; return name === 'a' ? { p: [-h, 0, 0] } : name === 'b' ? { p: [h, 0, 0] } : null; },
  draw(G, xf, st, inst) {
    const h = ((inst.opts.span || 4) * P254) / 2, z = 0.32, L = 0.62, c = G.ctx, P = (q) => G.cam.p(xf.p(q));
    for (const s of [-1, 1]) { const pts = [[s * h, 0, 0], [s * h, 0, z], [s * L / 2, 0, z]].map(P); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => c.lineTo(q[0], q[1])); c.lineWidth = 3 * LWS; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.lineWidth = 1.5 * LWS; c.strokeStyle = '#c9cdd6'; c.stroke(); }
    drawCyl(G, xf, [0, 0, z], 'x', 0.12, L, M.beige, { seg: 20, lw: 1.3 });
    resistorBands(inst.opts.ohm || 220).forEach((col, i) => {
      const x = -0.2 + i * 0.11 + (i === 3 ? 0.07 : 0);
      drawCyl(G, xf, [x, 0, z], 'x', 0.124, 0.05, { light: col, mid: col, dark: shadeHex(col, 0.35) }, { seg: 20, lw: 0, noCap: true });
    });
  },
});

// tactile push button 6x6 ------------------------------------------------------------------
defineAsset('boton', {
  name: 'botón', label: 'BOTÓN', group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.5], ring: [0.7, 0.7, 0.02], lab: [0.6, 1.0, 1.0],
  pins: { '1a': { p: [-0.381, -0.381, 0] }, '1b': { p: [-0.381, 0.381, 0] }, '2a': { p: [0.381, -0.381, 0] }, '2b': { p: [0.381, 0.381, 0] } },
  draw(G, xf, st, inst) {
    const press = clamp(st[inst.opts.pressKey] ?? 0) * 0.05;
    drawBox(G, xf, [-0.3, -0.3, 0], [0.3, 0.3, 0.32], M.blk, { lw: 1.3 });
    drawBox(G, xf, [-0.3, -0.3, 0.32], [0.3, 0.3, 0.35], M.steel, { lw: 1.1 });
    const cap = inst.opts.cap || '#e5484d';
    drawCyl(G, xf, [0, 0, 0.42 - press], 'z', 0.17, 0.14, { light: cap, mid: cap, dark: shadeHex(cap, 0.45) }, { seg: 20, lw: 1.2 });
  },
});

// rotary potentiometer (trimmer) -----------------------------------------------------------
defineAsset('potenciometro', {
  name: 'potenciómetro', label: 'POT 10 kΩ', group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.6], ring: [0.8, 0.8, 0.02], lab: [0.6, 1.0, 1.0],
  pins: { '1': { p: [-P254, 0, 0] }, w: { p: [0, 0, 0] }, '3': { p: [P254, 0, 0] } },
  draw(G, xf, st, inst) {
    const a = (st[inst.opts.angleKey] ?? 0.5) * Math.PI * 1.5 - Math.PI * 0.75;
    drawBox(G, xf, [-0.48, -0.15, 0.05], [0.48, 0.8, 0.5], M.term, { lw: 1.4 });
    drawCyl(G, xf, [0, 0.33, 0.62], 'z', 0.36, 0.24, M.white, {
      seg: 28, lw: 1.3, capFx: (c, sp) => { c.save(); c.rotate(a); prect(c, -0.05, -0.3, 0.1, 0.6); c.fillStyle = INK; c.fill(); c.restore(); },
    });
  },
});

// passive buzzer ---------------------------------------------------------------------------
defineAsset('buzzer', {
  name: 'buzzer', label: 'BUZZER', group: 'top', layer: 2, O: [0, 0, 0], anchor: [0, 0, 0.95], ring: [0.8, 0.8, 0.02], lab: [0.7, 1.0, 1.0],
  pins: { '+': { p: [0.381, 0, 0] }, '-': { p: [-0.381, 0, 0] } },
  draw(G, xf, st, inst) {
    drawCyl(G, xf, [0, 0, 0.5], 'z', 0.6, 0.9, M.blk, {
      seg: 32, lw: 1.5, capFx: (c, sp) => { c.fillStyle = '#15161b'; pcirc(c, 0, 0, 0.12); c.fill(); sp(0.9); ptxt(c, '+', 0.32, -0.25, 0.2, 'rgba(255,255,255,0.8)'); pcirc(c, 0, 0, 0.42); sp(0.6, 'rgba(255,255,255,0.15)'); },
    });
  },
});

// micro servo SG90 (sits on the floor; horn on top) ------------------------------------------------
defineAsset('servoSG90', {
  name: 'servo SG90', label: 'SERVO SG90', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, 2.3], ring: [1.9, 1.2, 0.05], lab: [0, 1.6, 1.6],
  pins: { GND: { p: [-3.4, 0.1, 0.35], dir: [-1, 0, 0], hl: 0.4 }, VCC: { p: [-3.4, 0, 0.35], dir: [-1, 0, 0], hl: 0.4 }, SIG: { p: [-3.4, -0.1, 0.35], dir: [-1, 0, 0], hl: 0.4 } },
  draw(G, xf, st, inst) {
    const ang = (st[inst.opts.angleKey] ?? 0.5) * Math.PI - Math.PI / 2;
    drawBox(G, xf, [-1.15, -0.61, 0], [1.15, 0.61, 1.6], M.servo, { lw: 1.6, alpha: 0.96, px: (c) => ptxt(c, 'SG90', 0.61, 0.8, 0.28, 'rgba(255,255,255,0.85)', 700, 'center') });
    drawBox(G, xf, [-1.6, -0.61, 1.6], [1.6, 0.61, 1.85], M.servo, { lw: 1.4, alpha: 0.96, top: (c) => { for (const x of [0.22, 2.98]) { c.fillStyle = 'rgba(20,40,90,0.6)'; pcirc(c, x, 0.61, 0.1); c.fill(); } } });
    drawBox(G, xf, [-1.15, -0.61, 1.85], [1.15, 0.61, 2.25], M.servo, { lw: 1.4, alpha: 0.96 });
    drawCyl(G, xf, [0.55, 0, 2.42], 'z', 0.45, 0.34, M.servo, { seg: 24, lw: 1.3 });
    drawCyl(G, xf, [0.55, 0, 2.66], 'z', 0.18, 0.16, M.white, { seg: 16, lw: 1.1 });
    // horn: rotated plan around the shaft
    const hp = [[-0.12, 0.25], [1.5, 0.12], [1.5, -0.12], [-0.12, -0.25], [-0.32, 0]].map(([x, y]) => [0.55 + x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang)]);
    drawPrism(G, xf, hp, 2.74, 2.86, M.white, { lw: 1.4 });
    // cable bundle to the connector
    const cps = (dy) => [[-1.15, dy, 0.6], [-1.9, dy, 0.55], [-2.8, dy * 1.5, 0.4], [-3.4, dy, 0.35]];
    [[0.1, '#8a4b22'], [0, WIRE.red], [-0.1, WIRE.org]].forEach(([dy, col]) => drawWire(G, xf, cps(dy), col, { w: 0.09 }));
    drawBox(G, xf, [-3.75, -0.2, 0.22], [-3.4, 0.2, 0.48], M.blk, { lw: 1.1 });
  },
  floorShadow: (xf) => [boxCorners(xf, [-1.6, -0.61, 0], [1.6, 0.61, 2.3])],
});

// ---- placa de carga (from Lab 04) ----------------------------------------------------------------------
// Small test board lying on the mat (origin = centre of the footprint, z = 0): two bare test loops for the
// alligator clips ('+' and '-' at the loop tops, -x end), a spot for an LED ('led', anode towards +x) and, with
// {res: true}, for a resistor ('res', 4 holes). Copper traces join loop + -> (resistor) -> LED -> loop -.
// Silkscreen: big {tag} ('A') and {text} ('LED + 220 Ω'). Place the LED and the resistor as their own instances.
const PLC = { x0: -3.0, x1: 3.0, y0: -1.8, y1: 1.8, z: 0.5, loopX: -2.15, loopY: 1.0, loopH: 1.05, led: 1.15, res: -0.55 };
defineAsset('placaCarga', {
  name: 'placa de carga', label: 'PLACA', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [0, 0, 1.4], ring: [3.6, 2.5, 0.02], lab: [-1.2, 2.2, 2.0],
  pins: { '+': { p: [PLC.loopX, PLC.loopY, PLC.z + PLC.loopH] }, '-': { p: [PLC.loopX, -PLC.loopY, PLC.z + PLC.loopH] }, led: { p: [PLC.led, 0, PLC.z] }, res: { p: [PLC.res, 0, PLC.z] } },
  floorShadow: (xf) => [boxCorners(xf, [PLC.x0, PLC.y0, 0], [PLC.x1, PLC.y1, PLC.z])],
  draw(G, xf, st, inst) {
    const o = inst.opts, an = PLC.led + P254 / 2, ca = PLC.led - P254 / 2, ra = PLC.res - 2 * P254, rb = PLC.res + 2 * P254, L = PLC.loopX, Y = PLC.loopY;
    for (const [x, y] of [[-2.6, -1.4], [-2.6, 1.4], [2.6, -1.4], [2.6, 1.4]]) drawCyl(G, xf, [x, y, 0.16], 'z', 0.22, 0.32, M.brass, { seg: 14, lw: 1 });
    drawPrism(G, xf, rrPlan(PLC.x0, PLC.y0, PLC.x1, PLC.y1, 0.35), 0.32, PLC.z, M.pcbK, {
      lw: 1.5, top: (c) => {
        const tr = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = '#d99a5e'; c.lineWidth = 0.13; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
        if (o.res) { tr([[L, Y], [ra, Y], [ra, 0]]); tr([[rb, 0], [rb, 0.62], [an, 0.62], [an, 0]]); }
        else tr([[L, Y], [an, Y], [an, 0]]);
        tr([[ca, 0], [ca, -Y], [L, -Y]]);
        c.fillStyle = '#e8a06d'; for (const [x, y] of [[L, Y - 0.28], [L, Y + 0.28], [L, -Y - 0.28], [L, -Y + 0.28], [an, 0], [ca, 0], ...(o.res ? [[ra, 0], [rb, 0]] : [])]) { pcirc(c, x, y, 0.12); c.fill(); }
        ptxt(c, '+', L + 0.62, Y, 0.42, '#ff9e93', 700, 'center'); ptxt(c, '−', L + 0.62, -Y, 0.46, '#e9ecf2', 700, 'center');
        ptxt(c, o.tag || '', 2.35, -1.05, 0.72, '#c8f04a', 700, 'center');
        ptxt(c, o.text || '', 0, 1.42, 0.27, 'rgba(255,255,255,0.75)', 700, 'center');
      },
    });
    // the two test loops (bare wire)
    for (const s of [1, -1]) {
      const y = s * Y, z = PLC.z, h = PLC.loopH;
      drawWire(G, xf, [[L, y - 0.28, z], [L, y - 0.28, z + h * 0.7], [L, y - 0.14, z + h * 0.97], [L, y + 0.14, z + h * 0.97], [L, y + 0.28, z + h * 0.7], [L, y + 0.28, z]], '#d4d8df', { w: 0.08, n: 8 });
    }
  },
});
