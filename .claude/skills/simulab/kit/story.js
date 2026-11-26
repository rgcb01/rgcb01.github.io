// ---------------------------------------------------------------------------
// Story helpers shared by every demo. A demo's timeline returns TL with at least:
//   TL.T (named times, seconds, T.end), TL.insts, TL.sched, TL.total,
//   TL.tabs ([armadoTab, codeTab...]) and TL.tabAt(t) -> index.
// ---------------------------------------------------------------------------
function lastLE(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r < 0 ? null : arr[r]; }
const seg = (t, a, b) => clamp((t - a) / (b - a));
const mixCam = (a, b, f) => a.map((v, i) => lerp(v, b[i], f));

// one entry per instance in build order; wires and `quick` parts go faster
// Videos always open on the build: if the build is shorter than the intro question, it is stretched to fill it
// (minEnd defaults to intro.seconds - 0.4 unless intro.mode === 'teaser').
function scheduleBuild(insts, start = 0.35, minEnd) {
  if (minEnd == null) { minEnd = 0; try { if (DEMO.intro && DEMO.intro.mode !== 'teaser') minEnd = DEMO.intro.seconds - 0.4; } catch (e) { /* no DEMO yet */ } }
  const sched = {}; let t = start; let n = 0;
  for (const i of insts) {
    if (i.noBuild) continue;
    const step = i.buildStep ?? (i.wire ? 0.27 : i.quick ? 0.13 : 0.3), dur = i.wire ? 0.55 : 0.45;
    sched[i.id] = { t0: t, t1: t + dur, n: ++n }; t += step;
  }
  if (t + 0.25 < minEnd && t > start) {
    const f = (minEnd - 0.25 - start) / (t - start);
    for (const s of Object.values(sched)) { const d = s.t1 - s.t0; s.t0 = start + (s.t0 - start) * f; s.t1 = s.t0 + d; }
    t = minEnd - 0.25;
  }
  return { sched, end: t + 0.25, total: n };
}
// lines: [[text, [ids]]]; ids land with a log line. extra: {id: time} for non-part lines (e.g. '__power')
function armadoTab(lines, sched, total, names, extra = {}) {
  const rows = lines.map(([text, ids]) => ({ text, ids: ids || [], ev: [] })), logs = [];
  rows.forEach((row, li) => {
    for (const id of row.ids) {
      if (extra[id] != null) { row.ev.push(extra[id]); continue; }
      const s = sched[id]; if (!s) continue;
      row.ev.push(s.t0);
      const mm = Math.floor(s.t1 / 60), ss = (s.t1 % 60).toFixed(2).padStart(5, '0');
      logs.push({ after: li, t: s.t1, text: `» 0${mm}:${ss}  PIEZA ${String(s.n).padStart(2, '0')}/${total} · ${names[id] || id}` });
    }
    row.ev.sort((a, b) => a - b);
  });
  return { name: 'armado.js', rows, logs };
}
// automatic armado lines for a list of instances
function autoArmado(insts, v = 'lab', header = '// cada línea coloca una pieza real') {
  const lines = [[header], [`const ${v} = new Lab('${DEMO.id}');`], ['']];
  for (const i of insts) {
    if (i.noBuild) continue;
    const code = i.code || (i.type === 'cable' ? `cable(${JSON.stringify(Array.isArray(i.from) ? i.from.join('.') : 'a')}, ${JSON.stringify(Array.isArray(i.to) ? i.to.join('.') : 'b')});` : `${i.type}('${i.id}');`);
    lines.push([`${v}.${code}`, [i.id]]);
  }
  lines.push([''], [`${v}.encender();`, ['__power']]);
  return lines;
}
// code tab with events per line: evMap {lineIndex: [times]}
function codeTab(name, lines, evMap = {}, scrollAt) {
  return { name, rows: lines.map((text, i) => ({ text, ev: (evMap[i] || []).slice().sort((a, b) => a - b) })), scrollAt };
}
function partsAt(TL, t, st) {
  st.parts = {};
  let placed = 0, last = '';
  for (const i of TL.insts) {
    const s = TL.sched[i.id]; if (!s) { st.parts[i.id] = 1; continue; }
    st.parts[i.id] = seg(t, s.t0, s.t1);
    if (i.noBuild) continue;
    if (t >= s.t1) placed++;
    if (t >= s.t0) last = i.name;
  }
  st.placedCount = placed; st.lastPart = last;
  return st;
}
// default label rule: pop in when placed, majors stay until T.labelsOut (keep ids stay to T.keepOut)
function labelAlphaDefault(TL, inst, t) {
  const s = TL.sched[inst.id]; if (!s) return 0;
  const major = (DEMO.major || []).includes(inst.id), keep = (DEMO.keep || []).includes(inst.id);
  let a = clamp((t - s.t0 - 0.12) / 0.2) * (1 - clamp((t - s.t1 - 0.9) / 0.35));
  if (major && t >= s.t1) a = Math.max(a, 0.95 * clamp((t - s.t0 - 0.12) / 0.2));
  const T = TL.T;
  if (T.labelsOut != null && t >= T.labelsOut && !keep) a *= 1 - clamp((t - T.labelsOut) / 0.5);
  if (keep && T.keepOut != null) a *= 1 - clamp((t - T.keepOut) / 0.3);
  return a;
}
// generic audio cues for the build (parts + wires); demos add their own
function buildCues(TL) {
  const out = []; let k = 0;
  for (const i of TL.insts) { const s = TL.sched[i.id]; if (!s) continue; out.push(i.wire ? { type: 'wire', t: s.t0, t1: s.t1 } : { type: 'part', t: s.t1, i: k++ }); out.push({ type: 'tick', t: s.t0 }); }
  return out;
}

// ---- generic motion + camera helpers (from Lab 02) -------------------------------------------------
const pulse = (t, a, d = 0.24) => { const x = (t - a) / d; return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x); };
const lerp3 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
const norm3 = (v) => mul3(v, 1 / (Math.hypot(...v) || 1));
// point going from a to b (f = 0..1) along an arc that rises `lift` cm in the middle
const arcMove = (a, b, f, lift = 5) => add3(lerp3(a, b, f), [0, 0, lift * Math.sin(Math.PI * f)]);
// camera [zoom, x, y, z] that frames these world points in the scene area of the demo's layout
function fitCam(pts, k = 1, zmax = 44) {
  const full = DEMO.layout !== 'panel', W = full ? 1360 : 880, H = 690, zf = full ? DEMO.fullZoom || 1.25 : 1;
  const S = pts.map(p => [dot3(p, VR), -dot3(p, VU)]), xs = S.map(s => s[0]), ys = S.map(s => s[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const Z = Math.min(W / (x1 - x0), H / (y1 - y0), zmax * zf) * k;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, a = VR[0], b = VR[1], c = -VU[0], d = -VU[1], det = a * d - b * c;
  return [Z / zf, (cx * d - b * cy) / det, (a * cy - c * cx) / det, 0];
}
// shift a camera [zoom, x, y, z] so everything it frames moves dx, dy px on screen (from Lab 03)
function camShift(cam, dx, dy) {
  const z = cam[0] * (DEMO.layout !== 'panel' ? DEMO.fullZoom || 1.25 : 1), h = (dx / z) * Math.SQRT1_2, s = dy / (z * Math.SQRT1_2);
  return [cam[0], cam[1] - h - s, cam[2] + h - s, cam[3]];
}

// ---- live controls (from Lab 03): the viewer drives the lab -----------------------------------------
// DEMO.live = { label, controls: [{ key, label, keys: ['KeyC'], kbd: 'C' }] }. Pressing a control (button or key)
// starts practice: main.js rebuilds TL = DEMO.timeline({...params, live: true}) and writes every press / release to
// LIVE.ev as [t, key, 1|0] (the knob as [t, knob.key, value]); state(TL, t) reads LIVE.ev up to t. LIVE.v counts changes.
const LIVE = { on: false, ev: [], v: 0 };
// value of `key` at time t in an event list [[t, key, v]] sorted by t (def before the first event)
function liveVal(ev, key, t, def = 0) { let v = def; for (const e of ev) { if (e[0] > t) break; if (e[1] === key) v = e[2]; } return v; }
// camera [zoom, x, y, z] moved so the world point p lands on screen at (x, y) px (from Lab 03)
function camPut(cam, p, x, y) {
  const z = cam[0] * (DEMO.layout !== 'panel' ? DEMO.fullZoom || 1.25 : 1), d = sub3(p, [cam[1], cam[2], cam[3]]);
  return camShift(cam, x - (VIEW.cx + z * dot3(d, VR)), y - (VIEW.cy - z * dot3(d, VU)));
}
// camera flight (from Lab 03): from cam a (focus Fa at screen sa) to cam b (focus Fb at screen sb), f = 0..1.
// Zoom changes geometrically and lags the move when zooming in (leads it when zooming out), so the shot
// never sweeps close over other objects. sa / sb: [x, y] px; use [VIEW.cx, VIEW.cy] for a fitCam camera.
function camFly(a, b, Fa, Fb, sa, sb, f) {
  const zin = b[0] > a[0], ft = easeInOut(clamp(zin ? f / 0.7 : (f - 0.3) / 0.7)), fz = easeInOut(clamp(zin ? (f - 0.25) / 0.75 : f / 0.75));
  const z = a[0] * Math.pow(b[0] / a[0], fz), F = lerp3(Fa, Fb, ft);
  return camPut([z, F[0], F[1], F[2]], F, lerp(sa[0], sb[0], ft), lerp(sa[1], sb[1], ft));
}
