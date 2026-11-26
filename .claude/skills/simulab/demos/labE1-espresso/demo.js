// ---------------------------------------------------------------------------
// Lab E1 · ESPRESSO. Same coffee, same 9 bar, three grind settings: too coarse (sour), too fine (bitter),
// right (balanced). Then the viewer pulls their own shot: knob = grind, P = pull.
// ---------------------------------------------------------------------------
const EC_CH = [
  { id: 'grueso', btn: 'Muy grueso', g: 9, rate: 2, tip: ['Molienda gruesa: el agua pasa rápido', 'y saca poco sabor. Sale agrio.'] },
  { id: 'fino', btn: 'Muy fino', g: 2, rate: 5, tip: ['Molienda fina: el agua casi no pasa', 'y saca de más. Sale amargo.'] },
  { id: 'justo', btn: 'Justo', g: 5, rate: 2.5, tip: ['36 g en 25-30 s:', 'dulce y balanceado.'] },
];
const EC_LEAD = 1.0, EC_HOLD = 2.8, EC_LIVE_RATE = 2;

function ecInsts() {
  return [
    place('maquinaEspresso', 'maq', { code: "maquina('ES-01', 9 /* bar */);" }),
    place('cabezalEspresso', 'cab', { code: 'manometro(15 /* bar */);' }),
    place('bascula', 'bas', { code: 'bascula(0.1 /* g */);' }),
    place('tazaEspresso', 'taza', { code: 'taza();' }),
    place('portafiltro', 'pf', { code: 'portafiltro(18 /* g */);' }),
  ];
}
function ecTimeline(params) {
  const insts = ecInsts(), byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const overview = fitCam([[-16, -12, 0], [10, 10, 0], [-16, 12, 30], [8, -9, 30], [16, 0, 20], [-2, -12, 30]], 0.95);
  const close = fitCam([[-1, -5, 1.6], [8, 5, 1.6], [8, -9, 30], [16, 0, 20], [-2, 9, 30]], 1.0);
  const base = { insts, byId, overview, close, grind: params.grind ?? 5 };
  if (params.live) return Object.assign(base, { T: { end: 1800, caption: null, labelsOut: 0 }, sched: {}, total: insts.length, CH: [], live: true, tabs: [], tabAt: () => 0 });
  const { sched, end, total } = scheduleBuild(insts, 0.35);
  let t = end + 0.5;
  const CH = EC_CH.map(c => { const T = esT(c.g), vid = T / c.rate; const o = Object.assign({}, c, { t0: t, Tshot: T, vid }); t += EC_LEAD + vid + EC_HOLD; o.t1 = t; return o; });
  const T = { buildEnd: end, caption: t + 0.2 }; T.end = T.caption + 4.6; T.labelsOut = CH[0].t0 + 0.4;
  return Object.assign(base, { T, sched, total, CH, live: false, tabs: [], tabAt: () => 0 });
}
function ecChapter(TL, t) { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; }
// live: every press of P is a shot with the grind set at that moment
function ecLiveShots(params) {
  const out = []; let prev = 0;
  for (const e of LIVE.ev) if (e[1] === 'shot' && e[2] === 1 && e[0] >= prev) { const g = liveVal(LIVE.ev, 'grind', e[0], params.grind ?? 5); out.push({ tp: e[0], g }); prev = e[0] + esT(g) / EC_LIVE_RATE + 0.3; }
  return out;
}

function ecState(TL, t) {
  const st = { t };
  partsAt(TL, t, st);
  let shot = null, k = -1, ch = null, u = 0, tally = [];
  if (TL.live) {
    const shots = ecLiveShots({ grind: TL.grind });
    const cur = shots.filter(s => s.tp <= t).pop();
    if (cur) shot = esAt(cur.g, (t - cur.tp) * EC_LIVE_RATE);
    tally = shots.filter(s => s.tp <= t).map(s => ({ g: s.g, done: (t - s.tp) * EC_LIVE_RATE >= esT(s.g), T: esT(s.g) })).slice(-3);
    st.grindNow = liveVal(LIVE.ev, 'grind', t, TL.grind);
    st.cam = TL.close;
  } else {
    k = ecChapter(TL, t); ch = TL.CH[k]; u = ch ? t - ch.t0 : 0;
    if (ch) shot = esAt(ch.g, (u - EC_LEAD) * ch.rate);
    tally = TL.CH.slice(0, Math.max(0, k + 1)).map((c, i) => ({ g: c.g, T: c.Tshot, done: i < k || (shot && shot.done) }));
    st.cam = mixCam(TL.overview, TL.close, easeInOut(seg(t, TL.CH[0].t0, TL.CH[0].t0 + 1.2)));
    if (t >= TL.T.caption - 0.4) st.cam = mixCam(TL.close, TL.overview, easeInOut(seg(t, TL.T.caption - 0.4, TL.T.caption + 1.0)));
  }
  st.k = k; st.ch = ch; st.u = u; st.shot = shot; st.tally = tally;
  st.bar = shot ? shot.bar : 0; st.pump = shot ? shot.pump : 0; st.grams = shot ? shot.grams : 0; st.shotT = shot ? shot.shotT : 0;
  st.flowCol = shot ? shot.Q : 1.6;
  st.stream = shot ? (shot.grams < ES.target ? shot.flowing : 0) : 0;
  return st;
}

const EC_BG = { coral: BAY_BG.coral, amber: BAY_BG.amber, lime: BAY_BG.lime };
const DEMO = {
  id: 'ESPRESSO', num: 'E1', title: 'ESPRESSO', tagline: 'MUELE · PRESIONA · PESA', category: 'CAFÉ', brand: 'SIMULAB',
  plate: ['SIMULAB · ESPRESSO · LAB E1', 'Lab E1 · por qué tu espresso sale agrio o amargo'],
  chips: ['MÁQUINA 9 BAR · 18 g → 36 g · BÁSCULA 0.1 g', 'LAB E1 · CAFÉ'],
  caption: 'La molienda decide cuánto tarda el agua.',
  intro: { seconds: 5, lines: ['¿Por qué tu espresso', 'sale agrio o amargo?'], pill: 'LAB E1 · ESPRESSO', src: (TL) => TL.T.caption, rate: 0.8 },
  major: ['maq', 'cab', 'pf'],
  params: { grind: 5 },
  knob: { key: 'grind', label: 'MOLIENDA', min: 1, max: 10, step: 1, fmt: (v) => `${v} · ${esD(v)} µm` },
  live: { label: '▶ Saca tu shot', controls: [{ key: 'shot', label: 'SACAR SHOT', keys: ['KeyP'], kbd: 'P' }] },
  timeline: (p) => ecTimeline(p || {}),
  steps: (TL) => [['0 · Armar', 0], ...TL.CH.map((c, i) => [`${i + 1} · ${c.btn}`, c.t0 - 0.05])],
  state: (TL, t) => ecState(TL, t),
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -20, x1: 20, y0: -16, y1: 16, plate: 'BARRA · LAB E1' });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawFx(G, st, TL, base) {
    drawChorros(G, base, st.flowCol, st.stream, st.t);
    // redraw the cup over the streams' lower end so they pour into it
    if (st.stream > 0) { const cup = TL.byId.taza; cup.draw(G, cup.xf(base), st, cup); }
  },
  labelAlpha(TL, inst, t) { return TL.live ? 0 : labelAlphaDefault(TL, inst, t); },
  drawNotes(G, st, TL) {
    const c = G.ctx, P = (p) => G.cam.p(p), ch = st.ch, u = st.u, sh = st.shot;
    const fade = (a, b) => seg(u, a, a + 0.25) * (1 - seg(u, b - 0.25, b));
    const cap = !TL.live && st.t >= TL.T.caption - 0.3;
    if (ch && !cap) {
      const endV = EC_LEAD + ch.vid, dur = ch.t1 - ch.t0;
      if (sh && sh.pump) callout(c, P([8, 4.8, 27]), 190, -90, sh.pre ? `PREINFUSIÓN · ${ES.preBar} BAR` : `EXTRACCIÓN · ${ES.bar} BAR`, fade(EC_LEAD + 0.3, EC_LEAD + ES.preT / ch.rate + 2.2), sh.pre ? '#ffffff' : '#c8f04a');
      const mid = [3, 0.6, 12.5];
      if (ch.id === 'grueso') callout(c, P(mid), 210, -20, 'SALE RÁPIDO Y CLARO', fade(EC_LEAD + 2.0, endV), '#ffcf6b');
      if (ch.id === 'fino') callout(c, P(mid), 210, -20, 'GOTEA LENTO Y OSCURO', fade(EC_LEAD + 2.6, endV), '#ffcf6b');
      if (ch.id === 'justo') callout(c, P(mid), 210, -20, 'FLUJO PAREJO', fade(EC_LEAD + 2.0, endV), '#c8f04a');
      if (sh && sh.done) {
        const [, name] = sh.res, a = fade(endV, dur);
        callout(c, P([3, 0, 8.6]), -260, -40, `${Math.round(sh.T)} s · ${name}`, a, sh.res[3] === 'lime' ? '#c8f04a' : sh.res[3] === 'amber' ? '#ffcf6b' : '#ff9e93');
      }
      tipCard(c, CARD.x + 30, 146, ch.tip, fade(EC_LEAD + 0.6, dur - 0.05), `MOLIENDA ${ch.g} · ${esD(ch.g)} µm`);
    }
    if (cap) {
      const a = seg(st.t, TL.T.caption + 0.5, TL.T.caption + 0.9);
      TL.CH.forEach((cc, i) => {
        const r = esVeredicto(cc.Tshot);
        pill(c, CARD.x + 30, 150 + i * 46, `${i + 1} · MOLIENDA ${cc.g} · ${Math.round(cc.Tshot)} s · ${r[1]}`, { bg: r[3] === 'lime' ? '#c8f04a' : r[3] === 'amber' ? '#ffcf6b' : '#ff9e93', size: 14, padY: 9, alpha: a * seg(st.t, TL.T.caption + 0.5 + i * 0.15, TL.T.caption + 0.8 + i * 0.15) });
      });
    }
    if (TL.live) {
      const run = sh && !sh.done;
      tipCard(c, CARD.x + 30, 146, run ? [`Molienda ${sh.g}: ${sh.pre ? 'preinfusión…' : 'extrayendo…'}`, 'Espera a que termine el shot.'] : ['Gira la MOLIENDA y presiona P.', 'Busca 36 g en 25-30 s.'], 1, 'TU TURNO');
      if (sh && sh.done) callout(c, P([3, 0, 8.6]), -260, -40, sh.choked ? `AHOGADO · ${sh.grams.toFixed(0)} g EN 60 s` : `${Math.round(sh.T)} s · ${sh.res[1]}`, 1, sh.res[3] === 'lime' ? '#c8f04a' : sh.res[3] === 'amber' ? '#ffcf6b' : '#ff9e93');
    }
  },
  drawBays(c, TL, st) {
    const sh = st.shot, tm = sh ? sh.shotT : 0;
    // BAY 01 · time with the taste zones
    const zone = !sh || !sh.done ? (sh && sh.pump ? ['CORRIENDO', BAY_BG.cyan] : ['--', BAY_BG.grey]) : [sh.res[1], EC_BG[sh.res[3]]];
    let b = bayFrame(c, 0, 'BAY 01 · TIEMPO DEL SHOT', zone[0], zone[1]);
    bigValue(c, b, tm.toFixed(1), 's', 'ideal 25-30 s · desde la bomba');
    const bx = b.x + 14, bw = b.w - 28, by = b.y + 128, XS = (s) => bx + (clamp(s, 0, 50) / 50) * bw;
    c.save();
    for (const [s0, s1, col] of [[0, 20, '#ff9e93'], [20, 25, '#ffcf6b'], [25, 30, '#c8f04a'], [30, 35, '#ffcf6b'], [35, 50, '#ff9e93']]) { c.fillStyle = col; c.fillRect(XS(s0), by, XS(s1) - XS(s0), 18); }
    c.lineWidth = 1.5; c.strokeStyle = INK; c.strokeRect(bx, by, bw, 18);
    c.font = `700 9.5px ${FONT_MONO}`; c.fillStyle = '#545867'; c.textAlign = 'center';
    for (const s of [0, 20, 25, 30, 35, 50]) c.fillText(String(s), XS(s), by + 32);
    c.fillText('AGRIO', XS(10), by + 46); c.fillText('AMARGO', XS(42.5), by + 46);
    const mx = XS(tm); c.fillStyle = INK; c.beginPath(); c.moveTo(mx, by - 2); c.lineTo(mx - 7, by - 12); c.lineTo(mx + 7, by - 12); c.closePath(); c.fill(); c.fillRect(mx - 1.5, by - 2, 3, 22);
    c.restore();
    // BAY 02 · grams in the cup
    const g = st.grams;
    b = bayFrame(c, 1, 'BAY 02 · EN LA TAZA', sh && sh.choked ? 'AHOGADO' : g >= ES.target - 0.05 ? 'LISTO' : sh && sh.flowing ? 'CAYENDO' : sh && sh.pre ? 'PREINFUSIÓN' : '--', sh && sh.choked ? BAY_BG.coral : g >= ES.target - 0.05 ? BAY_BG.lime : sh && (sh.flowing || sh.pre) ? BAY_BG.amber : BAY_BG.grey);
    bigValue(c, b, g.toFixed(1), `/ ${ES.target} g`, `${ES.dose} g de café → ${ES.target} g (1:2)`);
    c.save();
    const gx = b.x + 14, gw = b.w - 28, gy = b.y + 132;
    c.fillStyle = '#f4f1ea'; rr(c, gx, gy, gw, 20, 10); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = cafeColor(st.flowCol); rr(c, gx + 3, gy + 3, Math.max(0, (gw - 6) * g / ES.target), 14, 7); c.fill();
    c.font = `400 11px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.fillText(sh ? `presión ${sh.bar.toFixed(1)} bar · bomba ${sh.pump ? 'ON' : 'OFF'}` : 'presión 0 bar', gx, gy + 44);
    c.restore();
    // BAY 03 · grind and flow
    const gr = TL.live ? (sh && !sh.done ? sh.g : st.grindNow) : sh ? sh.g : 5, d = esD(gr), q = esQ(gr);
    b = bayFrame(c, 2, 'BAY 03 · MOLIENDA', gr <= 3 ? 'FINA' : gr >= 7 ? 'GRUESA' : 'MEDIA', gr <= 3 ? BAY_BG.coral : gr >= 7 ? BAY_BG.amber : BAY_BG.lime);
    bigValue(c, b, q.toFixed(2), 'g/s', `ajuste ${gr} · partícula ${d} µm`);
    chartBox(c, b);
    c.save(); c.fillStyle = cafeColor(q);
    const rpx = 1.5 + (d / 600) * 6.5;
    for (let i = 0; i < 40; i++) { const x = b.cx + 10 + ((i * 37) % (b.cw - 20)), y = b.cy + 10 + ((i * 53) % (b.ch - 20)); c.beginPath(); c.arc(x, y, rpx * (0.8 + ((i * 7) % 5) / 10), 0, Math.PI * 2); c.fill(); }
    c.restore(); c.save(); pill(c, b.cx + b.cw - 6, b.cy + 6, 'flujo ∝ partícula²', { align: 'right', bg: '#fffdf8', size: 9, padY: 3, padX: 6, ls: 0.5, shadow: false, lw: 1 });
    c.restore();
    // BAY 04 · results so far
    const last = st.tally.length ? st.tally[st.tally.length - 1] : null, lr = last && last.done ? esVeredicto(last.T) : null;
    b = bayFrame(c, 3, 'BAY 04 · RESULTADO', lr ? lr[1] : sh && sh.pump ? 'EXTRAYENDO' : '--', lr ? EC_BG[lr[3]] : sh && sh.pump ? BAY_BG.amber : BAY_BG.grey);
    c.save(); c.textBaseline = 'middle'; c.fillStyle = INK; c.font = `700 17px ${FONT_MONO}`;
    c.fillText(lr ? lr[1] : sh && sh.pump ? 'EXTRAYENDO…' : 'ESPERANDO', b.x + 14, b.y + 60);
    c.font = `400 11.5px ${FONT_MONO}`; c.fillStyle = '#6b6f7a'; c.fillText(lr ? lr[2] : 'muele, presiona, pesa', b.x + 14, b.y + 84);
    for (let i = 0; i < 3; i++) {
      const s = st.tally[i], x = b.x + 14 + i * 112, y = b.y + 120, r = s && s.done ? esVeredicto(s.T) : null;
      c.fillStyle = r ? (r[3] === 'lime' ? '#c8f04a' : r[3] === 'amber' ? '#ffcf6b' : '#ff9e93') : '#fffdf8'; rr(c, x, y, 104, 62, 9); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; c.textAlign = 'center'; c.font = `700 11px ${FONT_MONO}`; c.fillText(s ? `MOLIENDA ${s.g}` : `SHOT ${i + 1}`, x + 52, y + 18);
      c.font = `700 15px ${FONT_MONO}`; c.fillText(r ? `${Math.round(s.T)} s` : s ? '…' : '·', x + 52, y + 42); c.textAlign = 'left';
    }
    c.restore();
  },
  speedBadge(TL, st) {
    if (TL.live) return { txt: `TU TURNO · ×${EC_LIVE_RATE}`, bg: BAY_BG.lime };
    const ch = st.ch, sh = st.shot;
    if (!ch) return st.placedCount < TL.total ? { txt: 'ARMANDO', bg: BAY_BG.amber } : { txt: 'LISTO', bg: BAY_BG.lime };
    if (st.t >= TL.T.caption) return { txt: '3 SHOTS · 1 BALANCEADO', bg: BAY_BG.lime };
    if (sh && sh.pump) return { txt: `×${ch.rate} · ADELANTADO`, bg: BAY_BG.coral };
    return { txt: sh && sh.done ? sh.res[1] : 'PREPARANDO', bg: sh && sh.done ? EC_BG[sh.res[3]] : BAY_BG.amber };
  },
  audioCues(TL) {
    if (TL.live) return [];
    const cu = [];
    for (const ch of TL.CH) {
      const a = ch.t0 + EC_LEAD, b = a + ch.vid;
      cu.push({ type: 'whoosh', t: ch.t0, t1: ch.t0 + 0.9 }, { type: 'power', t: a }, { type: 'whir', t: a, t1: b, f: 92, gain: 0.05 });
      const r = esVeredicto(ch.Tshot);
      cu.push({ type: r[3] === 'lime' ? 'ding' : 'error', t: b + 0.1 });
    }
    cu.push({ type: 'whoosh', t: TL.T.caption - 0.3, t1: TL.T.caption + 0.9 }, { type: 'caption', t: TL.T.caption });
    return cu;
  },
};
