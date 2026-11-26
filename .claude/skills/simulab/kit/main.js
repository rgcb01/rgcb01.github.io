// ---------------------------------------------------------------------------
// Generic player: composes a frame from DEMO hooks, 5 s intro, play loop, controls,
// window.seek / frameJPEG for frame-exact video, window.EVENTS for the audio score.
// DEMO hooks: timeline(params) state(TL,t) drawScene(G,st,TL)->base  [drawFx drawNotes drawBays
//   editorFx speedBadge footer drawOverCard labelAlpha labelHot audioCues motorEnv duck steps knob knobs live]
// ---------------------------------------------------------------------------
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let K_SCALE = 1;
let PARAMS = Object.assign({}, DEMO.params || {});
const LAYOUT = new URLSearchParams(location.search).get('layout') || DEMO.layout || 'full'; // ?layout=panel to compare
const FULL = LAYOUT !== 'panel';          // 'full' (default): no code panel, the card fills the stage
applyLayout(LAYOUT);                      // before the timeline: cameras placed with camPut need the final VIEW
let TL = DEMO.timeline(PARAMS);
// ?embed: for an <iframe> on your site. Shows only the inside of the paper card (no dark frame),
// light controls, reports its height to the parent page and pauses while it is off screen.
const EMBED = new URLSearchParams(location.search).has('embed');
// ?embed or ?web: web wording (see labText in ui.js).
const WEB = EMBED || new URLSearchParams(location.search).has('web') || LANG !== 'es';
const INSET = 16; // just inside the card's ink border and dashed line: every pixel shown is paper
const VIEWPORT = EMBED ? { x: CARD.x + INSET, y: CARD.y + INSET, w: CARD.w - 2 * INSET, h: CARD.h - 2 * INSET } : { x: 0, y: 0, w: STAGE.w, h: STAGE.h };
const INTRO = DEMO.intro || null;          // {seconds, lines:[a, b], pill, mode: 'build' (default) | 'teaser', src, rate}
const TEASER = !!(INTRO && INTRO.mode === 'teaser'); // 'build': the question sits over the first seconds of the build
const COLD = TEASER ? INTRO.seconds : 0;

function render(tv) {
  if (TEASER && tv < COLD) { const st = renderCore(INTRO.src(TL) + tv * INTRO.rate); introOverlay(tv); return st; }
  const st = renderCore(tv - COLD);
  if (INTRO && !TEASER && tv < INTRO.seconds && !LIVE.on) introOverlay(tv);
  return st;
}
function introOverlay(tv) {
  const c = ctx, x = VIEW.cx, y = 196, [l1, l2] = INTRO.lines;
  const a = TEASER ? 1 : clamp(tv / 0.25) * clamp((INTRO.seconds - tv) / 0.35);
  c.save(); c.globalAlpha = a;
  c.font = `700 34px ${FONT_MONO}`; c.letterSpacing = '0px';
  const w = Math.max(c.measureText(l1).width, c.measureText(l2).width) + 64, h = 124;
  c.fillStyle = 'rgba(29,32,51,0.25)'; rr(c, x - w / 2 + 5, y - h / 2 + 6, w, h, 18); c.fill();
  c.fillStyle = '#fffdf8'; rr(c, x - w / 2, y - h / 2, w, h, 18); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(l1, x, y - 21); c.fillStyle = '#e8590c'; c.fillText(l2, x, y + 23);
  c.restore();
  pill(c, x - w / 2 + 24, y - h / 2 - 15, labText(INTRO.pill || `LAB ${DEMO.num}`), { bg: '#c8f04a', size: 11, padY: 5, ls: 2, alpha: a });
  if (TEASER && tv > COLD - 0.22) { c.save(); c.fillStyle = `rgba(255,253,248,${clamp((tv - (COLD - 0.22)) / 0.22)})`; rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 26); c.fill(); c.restore(); }
}
function renderCore(t) {
  t = clamp(t, 0, TL.T.end);
  const st = DEMO.state(TL, t);
  st.t = t;
  const c = ctx, k = K_SCALE;
  c.setTransform(k, 0, 0, k, -VIEWPORT.x * k, -VIEWPORT.y * k); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (!EMBED) drawBackdrop(c);
  const ed = FULL ? { tab: -1 } : drawLeftPanel(c, TL, st);
  drawCardBase(c);
  c.save(); rr(c, CARD.x + 3, CARD.y + 3, CARD.w - 6, CARD.h - 6, 24); c.clip();
  const [zoom, cx, cy, cz] = st.cam;
  const zk = zoom * (FULL ? DEMO.fullZoom || 1.25 : 1);
  const cam = new Cam(zk, [cx, cy, cz], VIEW.cx, VIEW.cy);
  LWS = clamp(0.55 + zk / 40, 0.72, 1.25);
  const G = { ctx: c, cam, k };
  drawFloor(G);
  const base = DEMO.drawScene(G, st, TL) || new Xf();
  TL.insts.forEach((i, n) => { const s = TL.sched[i.id]; if (!s || t < s.t0 || t > s.t0 + 1.3) return; drawRing(G, base, i, t - s.t0, RING_COLS[n % RING_COLS.length]); });
  if (DEMO.drawFx) DEMO.drawFx(G, st, TL, base);
  for (const i of TL.insts) { const a = (DEMO.labelAlpha || labelAlphaDefault)(TL, i, t); if (a > 0.01) drawLabel(G, base, i, a, DEMO.labelHot ? DEMO.labelHot(i, st) : false); }
  if (DEMO.drawNotes) DEMO.drawNotes(G, st, TL, base);
  c.restore();
  c.save(); rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 26); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = grainPattern(c); c.globalAlpha = 0.85; c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h); c.restore();
  if (DEMO.drawOverCard) DEMO.drawOverCard(c, st, TL);
  drawCardFrame(c); drawPlate(c); drawSpeedBadge(c, TL, st); drawChips(c); if (FULL) drawHandle(c);
  if (DEMO.drawBays) DEMO.drawBays(c, TL, st); else bayPiezas(c, 0, TL, st);
  if (TL.T.caption != null && t >= TL.T.caption && DEMO.caption) {
    const f = easeOut(clamp((t - TL.T.caption) / 0.45));
    c.save(); c.globalAlpha = f;
    const y = 900 + (1 - f) * 18, x = VIEW.cx;
    c.font = `700 25px ${FONT_MONO}`; c.letterSpacing = '0px';
    const w = c.measureText(DEMO.caption).width + 56, h = 64;
    c.fillStyle = 'rgba(29,32,51,0.22)'; rr(c, x - w / 2 + 4, y - h / 2 + 5, w, h, 16); c.fill();
    c.fillStyle = '#fffdf8'; rr(c, x - w / 2, y - h / 2, w, h, 16); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(DEMO.caption, x, y + 1);
    c.restore();
    pill(c, x - w / 2 + 22, y - h / 2 - 14, 'LA GRAN IDEA', { bg: '#ff7a1a', fg: '#fff', size: 11, padY: 5, ls: 2, alpha: f });
  }
  if (!FULL && DEMO.editorFx) DEMO.editorFx(c, ed, st, TL);
  if (ed.tab === 0 && ed.items) {
    for (const it of ed.items) {
      if (it.kind !== 'code' || !it.ids) continue;
      for (const id of it.ids) {
        const s = TL.sched[id]; if (!s) continue;
        const age = t - s.t0; if (age < 0 || age > 0.75) continue;
        const a = clamp(age / 0.12) * (1 - clamp((age - 0.45) / 0.3));
        const inst = TL.byId[id]; if (!inst) continue;
        const A = [it.endX + 10, it.y + 9];
        if (A[1] < ED.top - 4 || A[1] > ED.y + ED.h) continue;
        const B = cam.p(base.p(inst.anchorL));
        c.save(); c.globalAlpha = a; c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = UIC.amber;
        c.beginPath(); c.moveTo(A[0], A[1]); c.bezierCurveTo(A[0] + 160, A[1], B[0] - 220, B[1] - 60, B[0], B[1]); c.stroke(); c.setLineDash([]);
        c.fillStyle = UIC.amber; c.beginPath(); c.arc(A[0], A[1], 3.5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(B[0], B[1], 5, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
        c.restore();
      }
    }
  }
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.16; c.fillStyle = grainPattern(c); c.fillRect(0, 0, STAGE.w, STAGE.h); c.restore();
  return st;
}

// ---------------- sizing, playback, controls ----------------
const RENDER = new URLSearchParams(location.search).has('render');
// embed: the parent page sizes the <iframe> to this height (message 'kapri:height')
function reportHeight() { if (window.parent !== window) window.parent.postMessage({ type: 'kapri:height', h: Math.ceil(document.body.getBoundingClientRect().height) }, '*'); }
let onScreen = true;
function fit() {
  if (RENDER) { const W = Number(new URLSearchParams(location.search).get('w') || STAGE.w); canvas.width = W; canvas.height = Math.round(W * STAGE.h / STAGE.w); K_SCALE = W / STAGE.w; canvas.style.width = canvas.width + 'px'; canvas.style.height = canvas.height + 'px'; return; }
  if (EMBED) {
    const W = document.documentElement.clientWidth, s = W / VIEWPORT.w, dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = W + 'px'; canvas.style.height = Math.round(VIEWPORT.h * s) + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(VIEWPORT.h * s * dpr); K_SCALE = s * dpr;
    requestAnimationFrame(reportHeight); return;
  }
  const bar = document.getElementById('bar');
  const availW = window.innerWidth - 24, availH = window.innerHeight - (bar ? bar.offsetHeight : 0) - 24;
  const s = Math.min(availW / STAGE.w, availH / STAGE.h, 1.25), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = Math.round(STAGE.w * s) + 'px'; canvas.style.height = Math.round(STAGE.h * s) + 'px';
  canvas.width = Math.round(STAGE.w * s * dpr); canvas.height = Math.round(STAGE.h * s * dpr); K_SCALE = s * dpr;
}
const D = () => TL.T.end + COLD;
window.DURATION = D;
window.seek = (t) => { render(t); return true; };
window.frameJPEG = (t, q = 0.92) => { render(t); return canvas.toDataURL('image/jpeg', q); };
window.TIMES = () => TL.T;
window.EVENTS = () => {
  const cues = [...buildCues(TL), ...(DEMO.audioCues ? DEMO.audioCues(TL) : [])].filter(cu => !(FULL && cu.type === 'tab'));
  const out = cues.map(cu => Object.assign({}, cu, { t: cu.t + COLD, t1: cu.t1 != null ? cu.t1 + COLD : undefined }));
  if (TEASER) { const s0 = INTRO.src(TL); for (const cu of cues) if (cu.teaser) { const tv = (cu.t - s0) / INTRO.rate; if (tv >= 0 && tv < COLD) out.push(Object.assign({}, cu, { t: tv, t1: cu.t1 != null ? (cu.t1 - s0) / INTRO.rate : undefined, gain: (cu.gain || 0.25) * 0.8, burst: 0 })); } out.push({ type: 'riser', t: Math.max(0, COLD - 2.2), t1: COLD }); out.push({ type: 'thump', t: COLD - 0.02 }); }
  const motor = DEMO.motorEnv ? DEMO.motorEnv(TL) : [];
  const duck = (DEMO.duck ? DEMO.duck(TL) : []).map(([a, b]) => [a + COLD, b + COLD]);
  if (TEASER) duck.unshift([0, COLD - 0.3]);
  return { COLD, end: D(), cues: out, motor, motorT0: COLD, duck };
};

let playing = !RENDER, tNow = 0, last = null, speed = 1;
function loop(ts) {
  if (EMBED && (!onScreen || document.hidden)) { last = ts; requestAnimationFrame(loop); return; } // off screen: no CPU, time stands still
  if (last == null) last = ts;
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  if (playing) { tNow += dt * speed; if (LIVE.on) { if (tNow > D()) { tNow = D(); playing = false; } } else if (tNow > D() + 1.2) tNow = 0; }
  render(Math.min(tNow, D()));
  syncUI(); requestAnimationFrame(loop);
}
function syncUI() {
  const sc = document.getElementById('scrub'); if (!sc) return;
  if (!sc.matches(':active')) sc.value = String(Math.min(tNow, D()) / D() * 1000);
  document.getElementById('play').textContent = playing ? '❚❚' : '▶';
  document.getElementById('clock').textContent = Math.min(tNow, D()).toFixed(1) + ' s';
  if (LIVE_DEF) {
    const lb = document.getElementById('livebtn'); if (lb) lb.classList.toggle('on', LIVE.on);
    for (const b of document.querySelectorAll('#live .hold')) b.classList.toggle('on', LIVE.on && liveVal(LIVE.ev, b.dataset.key, Infinity) === 1);
    sc.disabled = LIVE.on;
  }
}
// ---- live controls (from Lab 03): see LIVE in kit/story.js --------------------------------------------
const LIVE_DEF = DEMO.live || null;
function liveStart() { LIVE.on = true; LIVE.ev = []; LIVE.v++; PARAMS.live = true; TL = DEMO.timeline(PARAMS); tNow = 0; playing = true; speed = 1; const s = document.getElementById('spd'); if (s) s.textContent = '×1'; }
function liveStop() { if (!LIVE.on) return; LIVE.on = false; LIVE.ev = []; LIVE.v++; PARAMS.live = false; TL = DEMO.timeline(PARAMS); }
function liveSet(key, v) {
  if (!LIVE.on) liveStart();
  const t = Math.max(0, tNow - COLD);
  if (LIVE.ev.length && LIVE.ev[LIVE.ev.length - 1][0] > t) LIVE.ev = LIVE.ev.filter(e => e[0] <= t);
  if (liveVal(LIVE.ev, key, Infinity) === v) return;
  LIVE.ev.push([t, key, v]); LIVE.v++; playing = true;
}
function setupLive(host) {
  const box = document.getElementById('live');
  if (!LIVE_DEF) { if (box) box.style.display = 'none'; return; }
  const lb = document.createElement('button'); lb.id = 'livebtn'; lb.textContent = tr(LIVE_DEF.label || 'Practica'); lb.onclick = () => { liveStop(); liveStart(); }; host.appendChild(lb);
  const ctl = (e) => LIVE_DEF.controls.find(ct => (ct.keys || []).includes(e.code));
  for (const ct of LIVE_DEF.controls) {
    const b = document.createElement('button'); b.className = 'hold'; b.dataset.key = ct.key;
    b.innerHTML = `<kbd>${ct.kbd || ''}</kbd>${tr(ct.label)}`; b.title = tr('Mantén presionado');
    const up = () => { if (LIVE.on) liveSet(ct.key, 0); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (b.setPointerCapture) b.setPointerCapture(e.pointerId); liveSet(ct.key, 1); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    box.appendChild(b);
  }
  window.addEventListener('keydown', (e) => { const ct = ctl(e); if (!ct) return; e.preventDefault(); if (!e.repeat) liveSet(ct.key, 1); });
  window.addEventListener('keyup', (e) => { const ct = ctl(e); if (ct && LIVE.on) liveSet(ct.key, 0); });
  window.addEventListener('blur', () => { if (LIVE.on) for (const ct of LIVE_DEF.controls) liveSet(ct.key, 0); });
}
function setupControls() {
  document.documentElement.lang = LANG_TAG;
  for (const [id, es] of [['play', 'Reproducir / pausar (espacio)'], ['restart', 'Desde el inicio'], ['spd', 'Velocidad']]) document.getElementById(id).title = tr(es);
  document.getElementById('scrub').setAttribute('aria-label', tr('Línea de tiempo'));
  const noteEl = document.getElementById('note'); if (noteEl) noteEl.textContent = tr(noteEl.textContent);
  const host = document.getElementById('steps');
  const steps = () => (DEMO.steps ? DEMO.steps(TL) : [['1 · Armar', 0]]).map(([n, tc]) => [n, tc + COLD]);
  steps().forEach(([name], i) => { const b = document.createElement('button'); b.textContent = tr(name); b.onclick = () => { liveStop(); tNow = steps()[i][1]; playing = true; }; host.appendChild(b); });
  setupLive(host);
  document.getElementById('play').onclick = () => { playing = !playing; if (!LIVE.on && tNow >= D()) tNow = 0; };
  document.getElementById('restart').onclick = () => { liveStop(); tNow = 0; playing = true; };
  const sc = document.getElementById('scrub'); sc.oninput = () => { if (LIVE.on) return; tNow = (sc.value / 1000) * D(); playing = false; };
  // knobs (from Lab 04 there can be several: DEMO.knobs = [{key, label, min, max, step, unit, fmt(v), live}]).
  // fmt(v) -> text next to the slider; live: true -> moving it starts the practice (the video ignores it).
  const knobs = DEMO.knobs || (DEMO.knob ? [DEMO.knob] : []), proto = document.getElementById('knob');
  if (!knobs.length) proto.style.display = 'none';
  let prev = proto;
  knobs.forEach((kb, i) => {
    const knob = i === 0 ? proto : prev.parentNode.insertBefore(proto.cloneNode(true), prev.nextSibling);
    if (i) knob.id = 'knob' + i;
    prev = knob;
    knob.querySelector('span.k').textContent = tr(kb.label);
    const inp = knob.querySelector('input'), val = knob.querySelector('span.v');
    const show = () => { val.textContent = kb.fmt ? kb.fmt(PARAMS[kb.key]) : PARAMS[kb.key] + ' ' + tr(kb.unit || ''); };
    Object.assign(inp, { min: kb.min, max: kb.max, step: kb.step || 1, value: PARAMS[kb.key] });
    show();
    inp.oninput = () => { PARAMS[kb.key] = Number(inp.value); show(); if (LIVE.on || kb.live) liveSet(kb.key, PARAMS[kb.key]); else { TL = DEMO.timeline(PARAMS); tNow = Math.min(tNow, D()); } };
  });
  document.getElementById('spd').onclick = (e) => { speed = speed === 1 ? 0.5 : 1; e.target.textContent = speed === 1 ? '×1' : '×0.5'; };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); playing = !playing; } });
}
async function boot() {
  await Promise.all(['700 20px "JetBrains Mono"', '400 20px "JetBrains Mono"', '700 40px Silkscreen', '700 30px Caveat'].map(f => document.fonts.load(f)));
  if (EMBED) {
    document.body.classList.add('embed');
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(canvas);
  }
  fit();
  if (!RENDER) { setupControls(); window.addEventListener('resize', fit); requestAnimationFrame(loop); }
  else { document.body.classList.add('render'); render(0); }
  window.READY = true;
}
boot();
