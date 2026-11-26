// ---------------------------------------------------------------------------
// SIMULAB asset system (from KAPRI LAB by @0xKapri).
//  defineAsset(type, spec)        register a component (native coords, pins, draw)
//  place(type, id, {at, rot})     an instance inside a scene or robot frame
//  inst.pin('D9') -> {p, dir}     pin position + exit direction in the parent frame
//  cable(id, from, to, color, o)  wire that routes itself between two pins
//  drawAssembly(G, st, insts, base)  draws everything in depth order with shadows
// spec fields: name, label, O (native origin), anchor, ring [rx, ry, z], lab (label offset),
//   group: 'floor' | 'host' | 'top' | 'under' | 'wheel' | 'wire', layer, pins {name: {p, dir}},
//   draw(G, xf, st, inst), floorShadow(xf) -> [pts[]], hostShadow(xf) -> [pts[]], hostTop {z, poly}
// ---------------------------------------------------------------------------
const ASSET_TYPES = {};
const MAT_INK_HOUSING = '#2a2b33';
function defineAsset(type, spec) { spec.type = type; ASSET_TYPES[type] = spec; return spec; }

function place(type, id, o = {}) {
  const spec = ASSET_TYPES[type];
  if (!spec) throw new Error('asset desconocido: ' + type);
  const O = spec.O || [0, 0, 0];
  const inst = Object.assign(Object.create(spec), { id, type, opts: o, at: o.at || O, rot: o.rot || 0 });
  if (o.name) inst.name = o.name;
  if (o.label !== undefined) inst.label = o.label;
  if (o.layer !== undefined) inst.layer = o.layer;
  if (o.group) inst.group = o.group;
  if (o.code) inst.code = o.code;
  const c = Math.cos(inst.rot), s = Math.sin(inst.rot);
  inst.local = (p) => { const q = [p[0] - O[0], p[1] - O[1], p[2] - O[2]]; return [c * q[0] - s * q[1] + inst.at[0], s * q[0] + c * q[1] + inst.at[1], q[2] + inst.at[2]]; };
  inst.vec = (d) => [c * d[0] - s * d[1], s * d[0] + c * d[1], d[2]];
  inst.xf = (parent) => compose(parent, inst.at, inst.rot, O);
  inst.pin = (name) => {
    const pn = (spec.pins && spec.pins[name]) || (spec.pinFn && spec.pinFn(name, inst));
    if (!pn) throw new Error(`${id}: no existe el pin ${name}`);
    return { p: inst.local(pn.p), dir: inst.vec(pn.dir || [0, 0, 1]), hl: pn.hl, owner: id, name };
  };
  inst.anchorL = inst.local(spec.anchor || O);
  return inst;
}

// ---- cables -----------------------------------------------------------------------
// from/to: [instanceId, pinName] or a raw {p, dir}. o: {via, lift, lead, hl, w, glowKey, points, ends}
function cable(id, from, to, color, o = {}) {
  return { id, type: 'cable', group: 'wire', wire: true, name: o.name || id, label: o.label ?? null, color, from, to, o, layer: 9,
    anchor: null, ring: null, lab: o.lab || [0, 0, 2.0], code: o.code };
}
function routeCable(a, b, o = {}) {
  const L = o.lead ?? 0.6, hla = a.hl ?? o.hl ?? 0.9, hlb = b.hl ?? o.hl ?? 0.9;
  const A0 = add3(a.p, mul3(a.dir, hla)), B0 = add3(b.p, mul3(b.dir, hlb));
  const A1 = add3(A0, mul3(a.dir, L)), B1 = add3(B0, mul3(b.dir, L));
  const dist = Math.hypot(B1[0] - A1[0], B1[1] - A1[1]);
  const top = Math.max(A1[2], B1[2]) + (o.lift ?? clamp(dist * 0.18, 0.5, 3.2));
  const mid = o.via ? o.via : [[lerp(A1[0], B1[0], 0.3), lerp(A1[1], B1[1], 0.3), top], [lerp(A1[0], B1[0], 0.7), lerp(A1[1], B1[1], 0.7), top]];
  return { cps: [A0, A1, ...mid, B1, B0], ends: [[a.p, A0], [b.p, B0]] };
}
function resolveCables(insts) {
  const byId = Object.fromEntries(insts.map(i => [i.id, i]));
  const end = (e) => Array.isArray(e) ? byId[e[0]].pin(e[1]) : e;
  for (const cb of insts) {
    if (cb.type !== 'cable') continue;
    if (cb.o.points) { cb.cps = cb.o.points; cb.ends = null; }
    else { const r = routeCable(end(cb.from), end(cb.to), cb.o); cb.cps = r.cps; cb.ends = r.ends; }
    cb.anchorL = cb.o.lab ? cb.o.lab : cb.cps[Math.floor(cb.cps.length / 2)];
    cb.lab = cb.o.labOff || [0, 0, 2.0];
  }
  return byId;
}
function drawCable(G, base, cb, st) {
  const prog = st.parts[cb.id] ?? 1;
  if (prog <= 0) return;
  const g = cb.o.glowKey && st[cb.o.glowKey] > 0 ? cb.o.glowColor.replace('A', String(0.5 * st[cb.o.glowKey])) : null;
  if (cb.ends) for (const [p, q] of cb.ends) drawWire(G, base, [p, q], MAT_INK_HOUSING, { w: 0.28, n: 2 });
  const sp = drawWire(G, base, cb.cps, cb.color, { prog, w: cb.o.w || 0.25, glow: g });
  if (sp && prog >= 1 && !cb.ends) for (const q of [sp[0], sp[sp.length - 1]]) { G.ctx.fillStyle = MAT_INK_HOUSING; G.ctx.beginPath(); G.ctx.arc(q[0], q[1], Math.max(1.6, 0.13 * G.cam.z), 0, Math.PI * 2); G.ctx.fill(); }
}

// ---- assembly drawing ---------------------------------------------------------------
const SHADOW_FLOOR = 'rgba(58,70,170,0.88)';
const SHADOW_SOFT = 'rgba(36,40,110,0.30)';
const DROP_H = 9;
function instXf(base, inst, st) {
  const xf = inst.xf(base);
  if (inst.wire) return xf;
  const p = st.parts[inst.id] ?? 1;
  const lift = (1 - easeOut(p)) * (inst.dropH ?? DROP_H);
  return lift > 0.001 ? xf.lift(lift) : xf;
}
function fillHulls(G, list, h, color, alpha = 1) {
  const c = G.ctx; c.save(); c.globalAlpha = alpha; c.beginPath();
  for (const pts of list) { const hh = shadowPts(G, pts, h); if (hh.length < 3) continue; c.moveTo(hh[0][0], hh[0][1]); for (const q of hh.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); }
  c.fillStyle = color; c.fill('nonzero'); c.restore();
}
function drawAssembly(G, st, insts, base, o = {}) {
  const c = G.ctx, floorZ = o.floorZ ?? 0;
  const prog = (i) => st.parts[i.id] ?? 1;
  const vis = (i) => prog(i) > 0;
  // floor shadows: landed parts in one fill, dropping parts fade in
  const landed = [];
  for (const i of insts) if (i.floorShadow && prog(i) >= 1) landed.push(...i.floorShadow(i.xf(base)));
  fillHulls(G, landed, floorZ, SHADOW_FLOOR);
  for (const i of insts) { const p = prog(i); if (i.floorShadow && p > 0 && p < 1) fillHulls(G, i.floorShadow(instXf(base, i, st)), floorZ, SHADOW_FLOOR, smooth((p - 0.05) / 0.6)); }
  const D = (i) => depthOf(base.p(i.anchorL));
  const host = insts.find(i => i.group === 'host');
  const hostD = host ? D(host) : -1e9;
  const draw = (i) => {
    if (!vis(i)) return;
    if (i.type === 'cable') { drawCable(G, base, i, st); return; }
    c.save(); c.globalAlpha = clamp(prog(i) / 0.25);
    i.draw(G, instXf(base, i, st), st, i);
    c.restore();
  };
  const wheels = insts.filter(i => i.group === 'wheel');
  wheels.filter(w => D(w) <= hostD).forEach(draw);
  insts.filter(i => i.group === 'under').sort((a, b) => D(a) - D(b)).forEach(draw);
  if (host && vis(host)) {
    draw(host);
    if (prog(host) >= 1 && host.hostTop) {
      const hx = host.xf(base);
      c.save(); pathPts(c, host.hostTop.poly.map(([x, y]) => G.cam.p(hx.p([x, y, host.hostTop.z])))); c.clip();
      const tops = insts.filter(i => i.hostShadow);
      const done = []; for (const i of tops) if (prog(i) >= 1) done.push(...i.hostShadow(i.xf(base)));
      fillHulls(G, done, hx.p([0, 0, host.hostTop.z])[2], SHADOW_SOFT);
      for (const i of tops) { const p = prog(i); if (p > 0 && p < 1) fillHulls(G, i.hostShadow(instXf(base, i, st)), hx.p([0, 0, host.hostTop.z])[2], SHADOW_SOFT, smooth((p - 0.05) / 0.6)); }
      c.restore();
    }
  }
  insts.filter(i => i.group === 'top' || i.group === 'floor' || !i.group).sort((a, b) => (a.layer || 0) - (b.layer || 0) || D(a) - D(b)).forEach(draw);
  insts.filter(i => i.group === 'wire').forEach(draw);
  wheels.filter(w => D(w) > hostD).forEach(draw);
}

// ---- rings, labels, pills, handwriting -------------------------------------------------------
const RING_COLS = ['#b9f04a', '#4fd8ea', '#ff5c9a', '#ffb547'];
function drawRing(G, base, inst, t, col) {
  if (!inst.ring) return;
  const [rx, ry, z] = inst.ring, a = inst.anchor || inst.O || [0, 0, 0];
  const e = clamp(t / 0.25), f = 1 - clamp((t - 0.7) / 0.45), s = lerp(1.35, 1.0, easeOut(e));
  const pts = floorEllipse(G, inst.xf(base), [a[0], a[1], z], rx * s, ry * s, 56);
  const c = G.ctx; c.save(); c.globalAlpha = e * f;
  pathPts(c, pts); c.lineWidth = 4.2; c.strokeStyle = 'rgba(29,32,51,0.35)'; c.stroke();
  pathPts(c, pts); c.lineWidth = 2.4; c.strokeStyle = col; c.stroke();
  c.restore();
}
function pill(c, x, y, text, o = {}) {
  const size = o.size || 12.5;
  c.save();
  c.font = `700 ${size}px ${FONT_MONO}`; c.letterSpacing = (o.ls ?? 1.2) + 'px';
  const w = c.measureText(text).width + (o.padX ?? 11) * 2 + (o.dot ? 10 : 0), h = size + (o.padY ?? 8) * 2;
  let bx = x, by = y;
  if (o.align === 'center') bx = x - w / 2; else if (o.align === 'right') bx = x - w;
  if (o.valign === 'middle') by = y - h / 2;
  c.globalAlpha = o.alpha ?? 1;
  if (o.shadow !== false) { c.fillStyle = 'rgba(29,32,51,0.18)'; c.beginPath(); c.roundRect(bx + 2, by + 3, w, h, h / 2); c.fill(); }
  c.fillStyle = o.bg || '#ffffff'; c.beginPath(); c.roundRect(bx, by, w, h, h / 2); c.fill();
  c.lineWidth = o.lw ?? 1.8; c.strokeStyle = o.border || INK; c.stroke();
  if (o.dot) { c.fillStyle = o.dot; c.beginPath(); c.arc(bx + 12, by + h / 2, 3.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = o.fg || INK; c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillText(text, bx + (o.padX ?? 11) + (o.dot ? 10 : 0), by + h / 2 + 0.5);
  c.restore();
  return { x: bx, y: by, w, h };
}
function drawLabel(G, base, inst, alpha, hl) {
  if (!inst.label || alpha <= 0.01) return;
  const a = inst.anchorL, lab = inst.vec ? inst.vec(inst.lab || [0, 0, 2.2]) : (inst.lab || [0, 0, 2.2]);
  const A = G.cam.p(base.p(a)), B = G.cam.p(base.p([a[0] + lab[0], a[1] + lab[1], a[2] + lab[2]]));
  const c = G.ctx;
  c.save(); c.globalAlpha = alpha;
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(A[0], A[1], 3, 0, Math.PI * 2); c.fill();
  c.restore();
  pill(c, B[0], B[1], inst.label, { align: 'center', valign: 'middle', alpha, bg: hl ? '#c8f04a' : '#ffffff', size: 11.5, padY: 6 });
}
function hand(c, text, x, y, size, col, rot = 0, alpha = 1) {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha; c.translate(x, y); c.rotate(rot);
  c.font = `700 ${size}px Caveat, cursive`; c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.lineWidth = 5; c.strokeStyle = 'rgba(243,238,227,0.9)'; c.strokeText(text, 0, 0); c.fillText(text, 0, 0); c.restore();
}
