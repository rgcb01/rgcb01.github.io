// ---------------------------------------------------------------------------
// Lab 01 · SONAR · KR-01: a robot that hears walls (HC-SR04 + UNO + L298N + 2 TT motors).
// ---------------------------------------------------------------------------
const DEMO = {
  brand: 'KAPRI LAB',
  id: 'KR-01', num: '01', title: 'SONAR', tagline: 'ARMA · ESCUCHA · ESQUIVA', category: 'ROBÓTICA',
  plate: ['KAPRI LAB · SONAR · KR-01', 'Lab 01 · un robot que escucha paredes · 32 piezas desde código'],
  chips: ['UNO R3 · L298N · HC-SR04 · TT 1:48', 'KR-01 · REV A'],
  caption: 'El robot no ve la pared: la escucha.',
  intro: { seconds: 5, lines: ['¿Cómo sabe un robot', 'que tiene una pared enfrente?'], pill: 'LAB 01 · KR-01', src: (TL) => TL.T.burst0 - 0.1, rate: 0.64 },
  params: { umbral: 20 },
  knob: { key: 'umbral', label: 'UMBRAL', min: 10, max: 35, unit: 'cm' },
  major: ['uno', 'l298n', 'hc_sr04', 'motor_der', 'portapilas', 'rueda_der', 'cable_trig', 'cable_echo'],
  keep: ['hc_sr04'],
  timeline: (P) => fig01Timeline(P),
  state: (TL, t) => fig01State(TL, t),
  steps: (TL) => { const T = TL.T; return [['1 · Armar', 0], ['2 · Encender', T.power - 0.2], ['3 · Avanzar', T.reveal1], ['4 · Eco', T.drive1 - 0.4], ['5 · Esquivar', T.math1]]; },
  labelHot: (i, st) => i.id === 'hc_sr04' && st.txFlash > 0.3,

  drawScene(G, st, TL) {
    const um = TL.umbral, B = K.BOX;
    drawTapete(G, st, {
      x0: -30, x1: 124, y0: -28, y1: 96, plate: 'PISTA DE PRUEBAS · KR-01',
      zone: { x0: B.x0 - um, x1: B.x0, y0: -12.5, y1: 12.5, text: `ZONA DE FRENADO · ${um} CM` },
      start: { x: K.SENSOR_X, y0: -12.5, y1: 12.5 },
      ruler: { zero: B.x0, len: 75, y0: -17.8, y1: -14.2, title: 'CM HASTA LA CAJA', hot: um },
    });
    const box = { ...B, stamp: 'OBSTÁCULO', dims: '30 × 22 × 8 CM' };
    if (st.boxIn >= 0.98) { pathPts(G.ctx, cajaShadow(G, box)); G.ctx.fillStyle = SHADOW_FLOOR; G.ctx.fill(); }
    const base = new Xf(st.rx, st.ry, 0, st.yaw), t = st.t, T = TL.T, pk = TL.pk;
    const sound = () => {
      if (st.beam > 0) drawBeam(G, st.beamPing, st.beam * 0.9, K);
      if (t >= T.freeze1 && t < T.math1) {
        drawCone(G, pk, clamp((t - T.freeze1) / 0.4) * (1 - clamp((t - T.math0) / 0.6)), K);
        if (st.slow && st.mu > 0) drawPacket(G, pk, st.mu, K);
      }
    };
    if (depthOf([st.rx, st.ry, 4]) < depthOf([(B.x0 + B.x1) / 2, 0, 5])) { drawAssembly(G, st, TL.insts, base); sound(); drawCaja(G, box, st.boxIn); }
    else { drawCaja(G, box, st.boxIn); drawAssembly(G, st, TL.insts, base); sound(); }
    return base;
  },
  drawFx(G, st, TL, base) {
    const T = TL.T, t = st.t; if (!(st.slow || st.paused)) return;
    const ra = clamp((t - T.freeze1) / 0.3) * (1 - clamp((t - T.cond1) / 0.3));
    for (const [y, col] of [[K.TX_Y, '#27c9bb'], [K.RX_Y, '#ff5c9a']]) {
      const pts = floorEllipse(G, base, [10.0, y, 5.9 - 0.85], 1.1, 1.1, 40), c = G.ctx;
      c.save(); c.globalAlpha = ra; pathPts(c, pts); c.lineWidth = 4; c.strokeStyle = 'rgba(29,32,51,0.35)'; c.stroke(); pathPts(c, pts); c.lineWidth = 2.4; c.strokeStyle = col; c.stroke(); c.restore();
    }
  },
  drawNotes(G, st, TL) {
    const T = TL.T, t = st.t, pk = TL.pk, c = G.ctx, cam = G.cam;
    if (!(st.slow || st.paused)) return;
    const G0 = cam.p([(pk.x + K.BOX.x0) / 2, 0, K.SENSOR_Z]), S0 = cam.p([pk.x, 0, K.SENSOR_Z + 1.2]);
    const a0 = clamp((t - T.trig0) / 0.2) * (1 - clamp((t - T.burst0 - 0.1) / 0.25));
    if (a0 > 0) {
      const b = pill(c, S0[0] + 30, S0[1] - 120, 'D9 → TRIG · 10 µs', { bg: '#ffcf6b', size: 13, padY: 8, alpha: a0 });
      c.save(); c.globalAlpha = a0; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
      const px = b.x - 46, py = b.y + b.h / 2 + 8; c.moveTo(px, py); c.lineTo(px + 10, py); c.lineTo(px + 10, py - 16); c.lineTo(px + 24, py - 16); c.lineTo(px + 24, py); c.lineTo(px + 36, py); c.stroke();
      c.beginPath(); c.moveTo(b.x + 30, b.y + b.h); c.lineTo(S0[0] + 4, S0[1] - 6); c.lineWidth = 1.6; c.stroke(); c.restore();
    }
    const a1 = clamp((t - T.burst0) / 0.3) * (1 - clamp((t - T.math1) / 0.3));
    hand(c, '40 kHz · 8 pulsos', G0[0] - 95, G0[1] - 218, 38, '#119184', -0.05, a1);
    hand(c, 'tú no lo oyes: más de 20 kHz', G0[0] - 80, G0[1] - 184, 26, '#4a4e5e', -0.05, a1);
    const tB = T.burst0 + (pk.dTrue / K.SOUND) * 1e-6 * T.SLOW;
    hand(c, '↩ eco', G0[0] + 30, G0[1] + 92, 44, '#e0457f', 0.03, clamp((t - tB) / 0.3) * (1 - clamp((t - T.math1) / 0.3)));
    const ae = clamp((t - T.burst0) / 0.25) * (1 - clamp((t - T.cond1) / 0.3));
    if (ae > 0) {
      const us = Math.min(pk.echoUs, Math.max(0, Math.round(st.slow ? st.mu : pk.echoUs))), done = t >= T.echoEnd;
      pill(c, G0[0] + 30, G0[1] - 292, (done ? 'ECHO · ' : 'ECHO HIGH · ') + us.toLocaleString('en-US') + ' µs', { align: 'center', bg: done ? '#ff9ec0' : '#7fe6f2', size: 14, padY: 9, alpha: ae, dot: INK });
    }
    hand(c, `ida + vuelta = ${(pk.d * 2).toFixed(1)} cm`, G0[0] - 300, G0[1] + 120, 32, INK, -0.04, clamp((t - T.echoEnd) / 0.3) * (1 - clamp((t - T.cond1) / 0.3)));
    hand(c, `÷ 2 = ${pk.d.toFixed(1)} cm`, G0[0] - 230, G0[1] + 162, 40, '#d2452f', -0.04, clamp((t - T.math0 - 0.4) / 0.3) * (1 - clamp((t - T.cond1) / 0.3)));
  },
  drawOverCard(c, st, TL) {
    const T = TL.T, t = st.t;
    if (t >= T.drive1 && t < T.drive1 + 0.35) { c.save(); rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 26); c.clip(); c.fillStyle = `rgba(255,255,255,${0.55 * (1 - (t - T.drive1) / 0.35)})`; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h); c.restore(); }
  },
  editorFx(c, ed, st, TL) {
    const T = TL.T, t = st.t, pk = TL.pk;
    if (!(t >= T.math0 && t < T.cond1 + 0.3) || ed.tab !== 1) return;
    const fa = clamp((t - T.math0) / 0.25) * (1 - clamp((t - T.cond1) / 0.3));
    const li = ed.items[LN.ret]; if (li) bubble(c, 96, li.y + 26, [`t = ${pk.echoUs.toLocaleString('en-US')} µs`, `${pk.echoUs} × 0.0343 / 2 = ${pk.d.toFixed(2)}`], fa, UIC.amber);
    const lc = ed.items[LN.cond], fb = clamp((t - T.cond0) / 0.25) * (1 - clamp((t - T.cond1) / 0.3));
    if (lc && fb > 0) bubble(c, lc.endX + 14, lc.y - 6, [`${pk.d.toFixed(2)} < ${TL.umbral}  ✓`], fb, UIC.lime);
  },
  speedBadge(TL, st) {
    const T = TL.T, t = st.t;
    if (t < T.buildEnd) return { txt: 'ARMANDO', bg: BAY_BG.amber };
    if (t < T.drive0) return { txt: 'LISTO', bg: BAY_BG.lime };
    if (st.slow) return { txt: 'CÁMARA LENTA ×1/2000', bg: BAY_BG.cyan };
    if (st.paused) return { txt: 'PAUSA · CÁLCULO', bg: BAY_BG.grey };
    return { txt: 'TIEMPO REAL ×1', bg: BAY_BG.lime };
  },
  footer(TL, st) {
    const T = TL.T, t = st.t;
    const state = t < T.buildEnd ? ['ARMANDO', UIC.amber] : t < T.drive0 ? ['LISTO', UIC.lime] : st.slow ? ['×1/2000', UIC.cyan] : st.paused ? ['PAUSA', '#aab0bb'] : ['CORRIENDO', UIC.lime];
    return [{ text: state[0], dot: state[1] }, { text: st.slow && t < T.trig1 ? 'PIN 9 · HIGH' : 'PIN 9 · TRIG' }, { text: `${String(st.placedCount).padStart(2, '0')}/${TL.total} PIEZAS` }];
  },
  drawBays(c, TL, st) {
    const T = TL.T, t = st.t, pk = TL.pk;
    bayPiezas(c, 0, TL, st);
    { // BAY 02 echo
      let status = 'OFF', sbg = BAY_BG.grey, val = '--', sub = 'sin energía', width = 0;
      const lp = st.lastPing;
      if (st.power) { status = 'ESPERA'; sub = 'TRIG 10 µs → ECHO'; }
      if (st.realtime && lp) { status = 'PING'; sbg = st.txFlash > 0 ? BAY_BG.cyan : BAY_BG.grey; val = lp.echoUs ? lp.echoUs.toLocaleString('en-US') : '0'; sub = lp.echoUs ? 'ancho del eco' : 'sin eco (fuera de rango)'; width = lp.echoUs; }
      if (st.slow) {
        if (t < T.burst0) { status = 'TRIG'; sbg = BAY_BG.amber; val = '10'; sub = 'pulso en TRIG (D9)'; }
        else { const us = Math.min(pk.echoUs, Math.max(0, Math.round(st.mu))); status = t >= T.echoEnd ? 'ECO' : 'HIGH'; sbg = t >= T.echoEnd ? BAY_BG.pink : BAY_BG.cyan; val = us.toLocaleString('en-US'); sub = t >= T.echoEnd ? 'ida + vuelta' : 'contando µs…'; width = us; }
      }
      if (st.paused) { status = 'ECO'; sbg = BAY_BG.pink; val = pk.echoUs.toLocaleString('en-US'); sub = 'ida + vuelta'; width = pk.echoUs; }
      const b = bayFrame(c, 1, 'BAY 02 · ECO', status, sbg);
      bigValue(c, b, val, val === '--' ? '' : 'µs', sub);
      c.save(); chartBox(c, b);
      const sx = b.cx, sy = b.cy;
      c.font = `700 9px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.fillText('TRIG', sx + 6, sy + 14); c.fillText('ECHO', sx + 6, sy + 50);
      const x0 = sx + 40, x1 = sx + b.cw - 8, scale = (x1 - x0) / 4500;
      c.lineWidth = 2; c.strokeStyle = '#e0a21a'; c.beginPath(); c.moveTo(x0 - 4, sy + 30); c.lineTo(x0 + 4, sy + 30);
      if (st.power) { c.lineTo(x0 + 4, sy + 18); c.lineTo(x0 + 10, sy + 18); c.lineTo(x0 + 10, sy + 30); } c.lineTo(x1, sy + 30); c.stroke();
      const high = st.slow && t < T.echoEnd && width > 0;
      c.strokeStyle = '#1fae9f'; c.beginPath(); c.moveTo(x0 - 4, sy + 66); c.lineTo(x0 + 14, sy + 66);
      if (width > 0) { c.lineTo(x0 + 14, sy + 54); c.lineTo(x0 + 14 + width * scale, sy + 54); if (!high) c.lineTo(x0 + 14 + width * scale, sy + 66); }
      if (!high) c.lineTo(x1, sy + 66); c.stroke(); c.restore();
    }
    { // BAY 03 distance
      const lp = st.lastPing; let status = '--', sbg = BAY_BG.grey, val = '--', sub = 'sin lectura';
      if (lp) { const d = lp.d; val = d > 0 ? d.toFixed(1) : '--'; sub = d > 0 ? `umbral ${st.umbral} cm` : 'sin eco: fuera de rango'; const near = d > 0 && d < st.umbral; status = near ? `< ${st.umbral}` : 'LIVE'; sbg = near ? BAY_BG.coral : BAY_BG.lime; }
      if (st.slow) { val = '?'; sub = 'esperando el eco…'; status = 'MIDE'; sbg = BAY_BG.cyan; }
      if (st.paused && t < T.math0 + 0.6) { val = '?'; sub = 't × 0.0343 / 2'; }
      const b = bayFrame(c, 2, 'BAY 03 · DISTANCIA', status, sbg);
      bigValue(c, b, val, val === '--' || val === '?' ? '' : 'cm', sub);
      c.save(); chartBox(c, b);
      const sx = b.cx, sy = b.cy, sw = b.cw, sh = b.ch, Y = (d) => sy + sh - 6 - (clamp(d, 0, 80) / 80) * (sh - 12);
      c.setLineDash([4, 3]); c.strokeStyle = '#e5484d'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(sx + 4, Y(st.umbral)); c.lineTo(sx + sw - 4, Y(st.umbral)); c.stroke(); c.setLineDash([]);
      c.font = `700 9px ${FONT_MONO}`; c.fillStyle = '#e5484d'; c.fillText(`${st.umbral}`, sx + sw - 18, Y(st.umbral) - 5);
      const hist = st.serial.length ? TL.serial.filter(sl => sl.t <= t && sl.d > 0) : [];
      if (hist.length) {
        const tl = hist[hist.length - 1].t; c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath();
        hist.forEach((sl, i) => { const x = sx + sw - 8 - ((tl - sl.t) / 3.2) * (sw - 16); if (x < sx + 4) return; if (i === 0 || x < sx + 6) c.moveTo(x, Y(sl.d)); else c.lineTo(x, Y(sl.d)); });
        c.stroke();
        const last = hist[hist.length - 1]; c.fillStyle = last.d < st.umbral ? '#e5484d' : '#ff7a1a'; c.beginPath(); c.arc(sx + sw - 8, Y(last.d), 4, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
      }
      c.restore();
    }
    { // BAY 04 motors
      const L = Math.round(st.cL) * K.PWM, R = Math.round(st.cR) * K.PWM;
      let status = 'OFF', sbg = BAY_BG.grey;
      if (st.power && t >= T.drive0) { if (L > 0 && R > 0) { status = 'AVANZA'; sbg = BAY_BG.lime; } else if (L === 0 && R === 0) { status = 'FRENA'; sbg = BAY_BG.amber; } else if (L < 0 && R < 0) { status = 'REVERSA'; sbg = BAY_BG.coral; } else { status = 'GIRA'; sbg = BAY_BG.cyan; } }
      const b = bayFrame(c, 3, 'BAY 04 · MOTORES', status, sbg), f = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
      bigValue(c, b, st.power && t >= T.drive0 ? `${f(L)}·${f(R)}` : '0·0', '', 'PWM izq · der (0-255)');
      barPair(c, b, [['IZQ', L / 255], ['DER', R / 255]]);
    }
  },
  audioCues(TL) {
    const T = TL.T, cu = [];
    cu.push({ type: 'power', t: T.switchOn }, { type: 'tab', t: T.tab }, { type: 'whoosh', t: T.reveal0, t1: T.reveal1 }, { type: 'thud', t: T.boxDrop + 0.45 });
    TL.sim.pings.forEach((p, i) => { if (i !== TL.dec.ping) cu.push({ type: 'blip', t: TL.videoT(p.t), f: 4600, gain: 0.10 }); });
    cu.push({ type: 'freeze', t: T.drive1 }, { type: 'trig', t: T.trig0 });
    cu.push({ type: 'ping', t: T.burst0, f: 1760, gain: 0.30, burst: 8, teaser: true });
    cu.push({ type: 'ping', t: (T.burst0 + T.echoEnd) / 2, f: 1480, gain: 0.16, teaser: true });
    cu.push({ type: 'ping', t: T.echoEnd, f: 1318, gain: 0.26, teaser: true });
    cu.push({ type: 'blip', t: T.math0 + 0.05, f: 1318.5, gain: 0.08 }, { type: 'blip', t: T.math0 + 0.45, f: 1568, gain: 0.08 });
    cu.push({ type: 'ding', t: T.cond0 }, { type: 'brake', t: T.evade0 }, { type: 'caption', t: T.caption });
    return cu;
  },
  motorEnv(TL) { // 50 Hz, core time
    const out = [];
    for (let tv = 0; tv < TL.T.end; tv += 1 / 50) { const moving = (tv >= TL.T.drive0 && tv < TL.T.drive1) || tv >= TL.T.evade0; const s = sampleAt(TL.sim, TL.modelT(tv)); out.push(moving ? (Math.abs(s.vL) + Math.abs(s.vR)) / (2 * K.V) : 0); }
    return out;
  },
  duck: (TL) => [[TL.T.drive1, TL.T.evade0]],
};
