// ---------------------------------------------------------------------------
// Lab 03 · CAUTÍN. How to make a good solder joint: heat pad and lead, feed the solder to the joint,
// not too long. Guided chapters for the video + live practice (C = cautín, S = soldadura, knob = tip °C).
// ---------------------------------------------------------------------------
const CA_SHORT = { buena: 'BUENA', fria: 'FRÍA', poca: 'POCA', mucha: 'DEMASIADA', pad: 'PAD LEVANTADO', quemada: 'QUEMADA', nada: 'VACÍA' };
const caOk = (r) => r === 'buena';

const DEMO = {
  brand: 'KAPRI LAB',
  id: 'CAUTIN', num: '03', title: 'CAUTÍN', tagline: 'CALIENTA · ALIMENTA · RETIRA', category: 'HERRAMIENTAS',
  plate: ['KAPRI LAB · CAUTÍN · LAB 03', 'Lab 03 · cómo soldar: calor, tiempo y cantidad'],
  chips: ['ESTACIÓN · CAUTÍN · SOLDADURA 63/37 · PLACA', 'LAB 03'],
  caption: 'Calienta pad y pata: ellos derriten la soldadura.',
  intro: { seconds: 5, lines: ['¿Por qué tu soldadura', 'no queda bien?'], pill: 'LAB 03 · CAUTÍN', src: (TL) => TL.T.caption, rate: 0.8 },
  major: ['placa', 'est', 'base', 'cautin', 'tubo'],
  params: { tset: 340 },
  knob: { key: 'tset', label: 'PUNTA', min: 200, max: 450, step: 5, unit: '°C' },
  live: { label: '▶ Practica tú', controls: [{ key: 'iron', label: 'CAUTÍN', keys: ['KeyC'], kbd: 'C' }, { key: 'solder', label: 'SOLDADURA', keys: ['KeyS'], kbd: 'S' }] },
  timeline: (p) => caTimeline(p || {}),
  steps: (TL) => [['0 · Armar', 0], ...TL.CH.map((c, i) => [`${i + 1} · ${c.btn}`, c.t0 - 0.05])],
  state: (TL, t) => caState(TL, t),
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -17, x1: 15, y0: -19, y1: 19, plate: 'BANCO · LAB 03' });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawFx(G, st, TL, base) {
    const I = st.iron, W = st.tube, sim = TL.sim, S = st.S, tm = st.tm;
    drawCableCautin(G, I.tip, I.ax, TL.sock.p, TL.sock.dir, I.alpha);
    const tools = [() => drawCautin(G, I.tip, I.ax, { alpha: I.alpha, shine: I.shine, drop: st.drop }), () => drawTuboSoldadura(G, W.tip, W.ax, st.wireL, { alpha: W.alpha })];
    const dI = depthOf(add3(I.tip, mul3(I.ax, 3))), dW = depthOf(add3(W.tip, mul3(W.ax, 3)));
    (dI <= dW ? tools : tools.reverse()).forEach(f => f());
    drawBaseFrente(G, TL.byId.base.xf(base));
    TL.J.forEach((J, j) => drawHumo(G, add3(J, [0, 0, 0.1]), (te) => sim.hist(sim.H.E[j], te), tm, { burnt: S.U[j].flux < 0.15 && S.U[j].burn > 0.3 }));
    drawHumo(G, add3(I.tip, [0, 0, 0.08]), (te) => sim.hist(sim.H.tip, te), tm, { scale: 0.8 });
  },
  labelAlpha(TL, inst, t) { return TL.live ? 0 : labelAlphaDefault(TL, inst, t); },
  drawNotes(G, st, TL) {
    const c = G.ctx, S = st.S, ch = st.ch, u = st.u, P = (p) => G.cam.p(p), T = TL.T;
    const fade = (a, b) => seg(u, a, a + 0.25) * (1 - seg(u, b - 0.25, b));
    const cap = !TL.live && st.t >= T.caption - 0.3;
    // chapter callouts
    if (ch && !cap) {
      const J = TL.J[ch.k ?? 0], est = TL.byId.est, wool = TL.byId.base.pin('viruta').p;
      if (ch.id === 'prep') {
        callout(c, P(add3(est.at, [0, 5.5, 5.9])), -190, -70, `ESTACIÓN · ${Math.round(TL.tset)} °C`, fade(0.6, 3.9));
        callout(c, P(add3(est.at, [2.2, 6.4, 2.2])), -170, 60, 'PERILLA: TEMPERATURA', fade(0.6, 2.4));
        callout(c, P(wool), 170, 70, 'VIRUTA: LIMPIA LA PUNTA', fade(3.1, 4.7), '#ffcf6b');
      } else if (ch.id === 'mal') {
        callout(c, P(st.iron.tip), -230, -60, 'GOTA EN LA PUNTA', fade(1.4, 2.7), '#ffcf6b');
        callout(c, P(J), -220, 40, 'EL PAD SIGUE FRÍO', fade(2.8, 3.6));
        callout(c, P(add3(J, [0, 0, 0.12])), -230, -90, 'NO MOJÓ EL PAD', fade(3.9, ch.dur), '#ff9e93');
      } else if (ch.id === 'bien') {
        callout(c, P(J), -250, -40, '1 · CALIENTA PAD Y PATA', fade(1.3, 2.45), '#c8f04a');
        callout(c, P(caWire(J)), -250, 60, '2 · SOLDADURA A LA UNIÓN', fade(2.4, 3.4), '#c8f04a');
        callout(c, P(caWire(J)), -250, 60, '3 · RETIRA LA SOLDADURA', fade(3.35, 3.95));
        callout(c, P(add3(st.iron.tip, mul3(st.iron.ax, 0.8))), 120, -40, '4 · LUEGO EL CAUTÍN', fade(3.8, 4.8));
      } else if (ch.id === 'mucho') {
        const lu = TL.liftT - ch.t0;
        callout(c, P(add3(st.iron.tip, mul3(st.iron.ax, 0.8))), 120, -40, 'EL CAUTÍN SIGUE AHÍ…', fade(3.4, 6.5), '#ffcf6b');
        callout(c, P(add3(J, [0, 0, 0.5])), -240, -70, 'SE ACABA EL FLUX', fade(4.3, lu - 0.1));
        callout(c, P(J), -240, 50, 'EL PAD SE DESPEGA', fade(lu, lu + 1.4), '#ff9e93');
      }
    }
    // verdicts on the joints
    S.U.forEach((v, k) => {
      if (!v.done) return;
      const a = seg(st.tm, v.tDone, v.tDone + 0.25) * (TL.live ? (k === st.kd ? 1 : 0) : ch && ch.k === k ? 1 - seg(u, ch.dur - 0.35, ch.dur) : 0);
      if (a <= 0.01) return;
      const [name, , mark] = CT_RES[v.result];
      callout(c, P(add3(TL.J[k], [0, 0, 0.18])), 160, -150, `${name} ${mark}`, a, caOk(v.result) ? '#c8f04a' : '#ff9e93');
    });
    // final comparison: one label per joint
    if (cap) {
      const a = seg(st.t, T.caption + 0.6, T.caption + 1.0);
      S.U.forEach((v, k) => {
        const txt = v.done ? `${k + 1} · ${CA_SHORT[v.result]} ${caOk(v.result) ? '✓' : '✗'}` : `${k + 1} · TE TOCA`;
        const bg = v.done ? (caOk(v.result) ? '#c8f04a' : '#ff9e93') : '#7fe6f2';
        callout(c, P(add3(TL.J[k], [0, 0, 0.05])), -150, 105, txt, a * seg(st.t, T.caption + 0.6 + k * 0.15, T.caption + 0.9 + k * 0.15), bg);
      });
    }
    // cross-section of the joint being worked
    const kd = st.kd, inA = TL.live ? 1 : ch && ch.k != null ? (ch.id === 'mal' ? seg(u, 0.4, 0.9) : seg(u, 0.05, 0.4)) * (1 - seg(u, ch.dur - 0.4, ch.dur)) : 0;
    if (kd >= 0 && inA > 0.01) {
      const U = st.U[kd], v = S.U[kd], X = CA_INSET, here = S.cur === kd || v.done, on = (p) => (here ? p : 0);
      const A = P(TL.J[kd]), d = Math.hypot(X.x - A[0], X.y - A[1]), e = [X.x + ((A[0] - X.x) / d) * X.R, X.y + ((A[1] - X.y) / d) * X.R];
      c.save(); c.globalAlpha = inA; c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(e[0], e[1]); c.stroke(); c.setLineDash([]);
      c.fillStyle = INK; c.beginPath(); c.arc(A[0], A[1], 4, 0, Math.PI * 2); c.fill(); c.restore();
      corteUnion(c, X.x, X.y, X.R, { U, iron: on(st.press.pIron), drop: st.drop, wire: on(st.press.pSol), wireTip: st.press.pTip,
        shine: st.iron.shine, smoke: v.E, t: st.tm, angle: seg(v.wet + v.ball, 0.3, 0.6) }, inA);
      pill(c, X.x - X.R + 10, X.y - X.R - 6, `CORTE · UNIÓN ${kd + 1}`, { bg: '#c8f04a', size: 11, padY: 5, ls: 2, alpha: inA });
      const hot = v.Tj >= CT.Tm;
      pill(c, X.x, X.y + X.R + 18, `pad y pata · ${Math.round(v.Tj)} °C`, { align: 'center', bg: hot ? '#ffcf6b' : '#fffdf8', size: 12, padY: 6, alpha: inA });
      pill(c, X.x + X.R - 8, X.y - X.R - 6, 'no a escala', { align: 'right', bg: '#fffdf8', size: 9.5, padY: 4, alpha: inA * 0.9, shadow: false, lw: 1.2 });
    }
    // tip card
    if (TL.live) tipCard(c, CARD.x + 30, 146, ['Mantén C: calienta pad y pata.', 'Arriba de 183 °C mantén S y suelta.'], 1, 'TU TURNO');
    else if (ch && !cap) { const from = { prep: 2.2, mal: 4.0, bien: 5.0, mucho: 7.6 }[ch.id]; tipCard(c, CARD.x + 30, 146, ch.tip, fade(from, ch.dur - 0.05)); }
    // live hint: wire on a cold joint does not melt
    if (TL.live && S.inp.sol && !S.inp.iron && S.U[S.cur].Tj < CT.Tm && st.press.pSol > 0.9) callout(c, P(caWire(TL.J[S.cur])), -230, 70, 'FRÍO: NO SE DERRITE', 1, '#7fe6f2');
  },
  drawBays(c, TL, st) {
    const S = st.S, kd = st.kd, v = kd >= 0 ? S.U[kd] : null, live = TL.live;
    // BAY 01 · temperature of the joint + trace
    const Tj = v ? v.Tj : CT.Tamb, hot = Tj >= CT.Tm;
    let b = bayFrame(c, 0, 'BAY 01 · TEMPERATURA', !v ? '--' : Tj > 400 ? 'MUY CALIENTE' : hot ? 'DERRITE' : 'FRÍA', !v ? BAY_BG.grey : Tj > 400 ? BAY_BG.coral : hot ? BAY_BG.lime : BAY_BG.cyan);
    bigValue(c, b, v ? String(Math.round(Tj)) : '--', '°C', `punta ${Math.round(S.tset)} °C · funde a 183 °C`);
    chartBox(c, b);
    const tmax = Math.max(400, S.tset + 30), win = 6, Y = (T) => b.cy + b.ch - 6 - (T / tmax) * (b.ch - 12), X = (te) => b.cx + b.cw - 6 - ((st.tm - te) / win) * (b.cw - 12);
    c.save(); c.setLineDash([4, 3]); c.lineWidth = 1.2;
    c.strokeStyle = '#e8590c'; c.beginPath(); c.moveTo(b.cx + 4, Y(CT.Tm)); c.lineTo(b.cx + b.cw - 4, Y(CT.Tm)); c.stroke();
    c.strokeStyle = '#8a8e99'; c.beginPath(); c.moveTo(b.cx + 4, Y(S.tset)); c.lineTo(b.cx + b.cw - 4, Y(S.tset)); c.stroke(); c.setLineDash([]);
    c.font = `700 9px ${FONT_MONO}`; c.fillStyle = '#e8590c'; c.fillText('183', b.cx + 6, Y(CT.Tm) - 4); c.fillStyle = '#8a8e99'; c.fillText('PUNTA', b.cx + 6, Y(S.tset) - 4);
    c.strokeStyle = '#ff7a1a'; c.lineWidth = 2.2; c.beginPath();
    for (let i = 0; i <= 120; i++) { const te = st.tm - win + (i / 120) * win; if (te < 0) continue; const T = TL.sim.hist(TL.sim.H.T, te) || CT.Tamb; i ? c.lineTo(X(te), Y(T)) : c.moveTo(X(te), Y(T)); }
    c.stroke(); c.restore();
    // BAY 02 · contact time with the zones from the guides
    const dw = v ? v.dwell : 0, z = dw <= 0 ? ['--', BAY_BG.grey] : dw < CT.ideal[0] ? ['CALENTANDO', BAY_BG.amber] : dw <= CT.ideal[1] ? ['IDEAL', BAY_BG.lime] : dw <= CT.ok ? ['BIEN', BAY_BG.lime] : dw <= CT.max ? ['LARGO', BAY_BG.amber] : ['DAÑO', BAY_BG.coral];
    b = bayFrame(c, 1, 'BAY 02 · TIEMPO DE CONTACTO', z[0], z[1]);
    bigValue(c, b, dw.toFixed(1), 's', 'ideal 2-3 s · máx 10 s');
    const bx = b.x + 14, bw = b.w - 28, by = b.y + 128, XS = (s) => bx + (clamp(s, 0, 12) / 12) * bw;
    c.save();
    for (const [s0, s1, col] of [[0, 2, '#fde7b0'], [2, 3, '#c8f04a'], [3, 5, '#e4f6a8'], [5, 10, '#ffcf6b'], [10, 12, '#ff9e93']]) { c.fillStyle = col; c.fillRect(XS(s0), by, XS(s1) - XS(s0), 18); }
    c.lineWidth = 1.5; c.strokeStyle = INK; c.strokeRect(bx, by, bw, 18);
    c.font = `700 9.5px ${FONT_MONO}`; c.fillStyle = '#545867'; c.textAlign = 'center';
    for (const s of [0, 2, 3, 5, 10]) c.fillText(String(s), XS(s), by + 32);
    const mx = XS(dw); c.fillStyle = INK; c.beginPath(); c.moveTo(mx, by - 2); c.lineTo(mx - 7, by - 12); c.lineTo(mx + 7, by - 12); c.closePath(); c.fill();
    c.fillRect(mx - 1.5, by - 2, 3, 22);
    c.textAlign = 'left'; c.font = `400 10.5px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.fillText(st.ch && st.ch.id === 'mucho' && st.t >= TL.wa && st.t < TL.wb ? 'adelantado ×4' : 'segundos con el cautín', bx, b.y + 186);
    c.restore();
    // BAY 03 · controls (what you press in the lab)
    b = bayFrame(c, 2, 'BAY 03 · CONTROLES', live ? 'EN VIVO' : 'DEMO', live ? BAY_BG.lime : BAY_BG.cyan);
    tecla(c, b.x + 16, b.y + 40, 'C', 'CAUTÍN', S.inp.iron === 1);
    tecla(c, b.x + 16, b.y + 82, 'S', 'SOLDADURA', S.inp.sol === 1 || S.inp.tip === 1);
    c.save(); c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '0.6px'; c.fillStyle = '#545867'; c.textBaseline = 'middle';
    c.fillText(`PERILLA · ${Math.round(S.tset)} °C`, b.x + 196, b.y + 58);
    const fed = v ? v.wet + v.ball : 0, gx = b.x + 14, gw = b.w - 28, gy = b.y + 152, XG = (m) => gx + (clamp(m, 0, 7) / 7) * gw;
    c.fillText(`ALAMBRE · ${fed.toFixed(1)} mm`, b.x + 196, b.y + 100);
    for (const [m0, m1, col] of [[0, CT.good[0], '#ece6da'], [CT.good[0], CT.good[1], '#c8f04a'], [CT.good[1], 7, '#ffcf6b']]) { c.fillStyle = col; c.fillRect(XG(m0), gy, XG(m1) - XG(m0), 14); }
    c.lineWidth = 1.4; c.strokeStyle = INK; c.strokeRect(gx, gy, gw, 14);
    c.fillStyle = '#ff7a1a'; c.fillRect(gx + 2, gy + 3, Math.max(0, XG(fed) - gx - 4), 8);
    c.font = `700 9px ${FONT_MONO}`; c.fillStyle = '#545867'; c.textAlign = 'center';
    c.fillText('POCA', (XG(0) + XG(CT.good[0])) / 2, gy + 26); c.fillText('JUSTA', (XG(CT.good[0]) + XG(CT.good[1])) / 2, gy + 26); c.fillText('MUCHA', (XG(CT.good[1]) + XG(7)) / 2, gy + 26);
    c.restore();
    // BAY 04 · result of the joint + tally of the 4 joints
    const r = v && v.done ? v.result : null, inProg = v && !v.done && v.fed > 0.05;
    b = bayFrame(c, 3, 'BAY 04 · RESULTADO', r ? `${CT_RES[r][2]} ${CA_SHORT[r]}` : inProg ? 'EN PROCESO' : '--', r ? (caOk(r) ? BAY_BG.lime : BAY_BG.coral) : inProg ? BAY_BG.amber : BAY_BG.grey);
    c.save(); c.fillStyle = '#f4f1ea'; rr(c, b.x + 14, b.y + 40, 76, 76, 10); c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.3)'; c.stroke(); c.restore();
    if (r || inProg) perfilUnion(c, b.x + 52, b.y + 92, 30, r || (v.ball > v.wet ? 'fria' : v.wet < CT.good[0] ? 'poca' : 'buena'));
    c.save(); c.textBaseline = 'middle'; c.fillStyle = INK; c.font = `700 17px ${FONT_MONO}`;
    c.fillText(r ? CT_RES[r][0] : inProg ? 'SOLDANDO…' : 'ESPERANDO', b.x + 104, b.y + 60);
    c.font = `400 11.5px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.fillText(r ? CT_RES[r][1] : 'calienta, alimenta, retira', b.x + 104, b.y + 84);
    // tally
    S.U.forEach((w, k) => {
      const x = b.x + 14 + k * 84, y = b.y + 132, ok = w.done && caOk(w.result), cur = !w.done && k === S.cur;
      c.fillStyle = w.done ? (ok ? '#c8f04a' : '#ff9e93') : '#fffdf8'; rr(c, x, y, 76, 54, 9); c.fill(); c.lineWidth = cur ? 3 : 1.4; c.strokeStyle = cur ? '#ff7a1a' : INK; c.stroke();
      c.fillStyle = INK; c.font = `700 12px ${FONT_MONO}`; c.textAlign = 'center'; c.fillText(`UNIÓN ${k + 1}`, x + 38, y + 17);
      c.font = `700 15px ${FONT_MONO}`; c.fillText(w.done ? (ok ? '✓' : '✗') : cur ? '›' : '·', x + 38, y + 38); c.textAlign = 'left';
    });
    c.restore();
  },
  speedBadge(TL, st) {
    if (TL.live) return { txt: 'TU TURNO · EN VIVO', bg: BAY_BG.lime };
    const ch = st.ch;
    if (!ch) return st.placedCount < TL.total ? { txt: 'ARMANDO', bg: BAY_BG.amber } : { txt: 'LISTO', bg: BAY_BG.lime };
    if (st.t >= TL.T.caption) { const d = st.S.U.filter(w => w.done), g = d.filter(w => caOk(w.result)).length; return { txt: `${d.length} UNIONES · ${g} ${g === 1 ? 'BUENA' : 'BUENAS'}`, bg: BAY_BG.lime }; }
    if (ch.id === 'prep') return { txt: st.estacion.ready ? `LISTA · ${Math.round(TL.tset)} °C` : 'CALENTANDO (acelerado)', bg: st.estacion.ready ? BAY_BG.lime : BAY_BG.amber };
    if (ch.id === 'mucho' && st.t >= TL.wa && st.t < TL.wb) return { txt: '×4 · ADELANTADO', bg: BAY_BG.coral };
    return { txt: { mal: 'ASÍ NO', bien: 'ASÍ SÍ', mucho: 'NI DE MÁS' }[ch.id], bg: ch.id === 'bien' ? BAY_BG.lime : BAY_BG.coral };
  },
  audioCues(TL) {
    if (TL.live) return [];
    const cu = [], by = TL.by, P0 = by.prep.t0, M0 = by.mal.t0, B0 = by.bien.t0, C0 = by.mucho.t0;
    for (const c of TL.CH) cu.push({ type: 'whoosh', t: c.t0, t1: c.t0 + 0.9 });
    cu.push({ type: 'power', t: P0 + 0.3 });
    const n = Math.max(1, Math.round((TL.tset - 200) / 10)); for (let i = 0; i < n; i++) cu.push({ type: 'detent', t: P0 + 0.6 + (0.9 * (i + 0.5)) / n, gain: 0.18 });
    cu.push({ type: 'beep', t: P0 + 3.6, t1: P0 + 3.72, f: 2400, gain: 0.04 });
    for (const dt of [3.25, 3.55, 3.85]) cu.push({ type: 'brake', t: P0 + dt });
    cu.push({ type: 'sizzle', t: M0 + 1.4, t1: M0 + 2.1, gain: 0.06, teaser: true });
    for (const X0 of [B0, C0]) { cu.push({ type: 'blip', t: X0 + 1.3, f: 1568, gain: 0.04 }); cu.push({ type: 'sizzle', t: X0 + 2.4, t1: X0 + 3.3, gain: 0.08 }); }
    cu.push({ type: 'blip', t: M0 + 2.8, f: 1568, gain: 0.04 });
    cu.push({ type: 'sizzle', t: C0 + 3.3, t1: TL.liftT, gain: 0.03 }, { type: 'riser', t: TL.wa, t1: TL.wb });
    const end = TL.sim.at(TL.warp(TL.T.end));
    end.U.forEach((v, k) => { if (v.done) cu.push({ type: caOk(v.result) ? 'ding' : 'error', t: TL.unwarp(v.tDone) + 0.05 }); });
    cu.push({ type: 'thud', t: TL.liftT }, { type: 'brake', t: TL.liftT + 0.02 });
    cu.push({ type: 'whoosh', t: TL.T.caption - 0.3, t1: TL.T.caption + 0.9 }, { type: 'caption', t: TL.T.caption });
    return cu;
  },
};
