// KAPRI LAB · poster3d: the 2D half of the A4 "HOW IT WORKS" poster (1080 x 1528 logical px).
// Layout measured from the reference posters: header, big title + legend, question block, live 3D,
// six live readouts, schematic panel, selector dial, eight numbered parts and a mono footer.
// The demo gives the texts (en/es) and three draw hooks: schematic, dial status and footer status.
const PW = 1080, PH = 1528, PL = 82, PR = 998;
const VP = { x: 0, y: 290, w: 1080, h: 676 };               // the 3D viewport
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const PC = { ink: '#141518', body: '#4b4d52', mute: '#8a8c91', faint: '#c4c5c9', line: '#e6e4df', panel: '#f8f7f4', panelLine: '#e9e6e0', org: '#ec7a2f', red: '#d9443b', bar: '#e9c9a6', barOn: '#d9a066' };
// X videos are English; the web (?web or ?embed) defaults to Spanish, any other with ?lang=xx (falls back to en)
const _Q3 = new URLSearchParams(location.search), LANG = _Q3.get('lang') || (_Q3.has('web') || _Q3.has('embed') ? 'es' : 'en');
const L = (s) => s == null ? '' : typeof s === 'string' ? s : (s[LANG] ?? s.en);

function prr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function mono(c, size, col, ls = 1.6, w = 400) { c.font = `${w} ${size}px ${MONO}`; c.fillStyle = col; c.letterSpacing = ls + 'px'; }
function sans(c, size, col, w = 400, ls = 0) { c.font = `${w} ${size}px ${SANS}`; c.fillStyle = col; c.letterSpacing = ls + 'px'; }
function wrap(c, text, maxW) {
  const out = []; for (const para of String(text).split('\n')) { let line = ''; for (const w of para.split(' ')) { const tryL = line ? line + ' ' + w : w; if (c.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL; } out.push(line); } return out;
}

// logo tiles: KAPRI LAB emblem (white tile) × the lab glyph (orange tile)
function drawEmblemTile(c, x, y, s) {
  c.save(); c.shadowColor = 'rgba(30,30,40,0.12)'; c.shadowBlur = 6; c.shadowOffsetY = 1.5; c.fillStyle = '#fff'; prr(c, x, y, s, s, s * 0.24); c.fill(); c.restore();
  c.save(); c.strokeStyle = '#ecebe7'; c.lineWidth = 1; prr(c, x + 0.5, y + 0.5, s - 1, s - 1, s * 0.24); c.stroke();
  const cx = x + s / 2, cy = y + s / 2 + 2, u = s / 53;
  c.fillStyle = '#ec7a2f'; prr(c, cx - 15 * u, cy - 10 * u, 30 * u, 21 * u, 5 * u); c.fill(); c.lineWidth = 1.6 * u; c.strokeStyle = '#2a1608'; c.stroke();
  c.beginPath(); c.moveTo(cx, cy - 10 * u); c.lineTo(cx, cy - 16 * u); c.stroke(); c.fillStyle = '#9ad13a'; c.beginPath(); c.arc(cx, cy - 18 * u, 2.6 * u, 0, 7); c.fill(); c.stroke();
  for (const dx of [-7, 7]) { c.fillStyle = '#eef0f4'; c.beginPath(); c.arc(cx + dx * u, cy + 0.5 * u, 5.6 * u, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#2f343e'; c.beginPath(); c.arc(cx + dx * u, cy + 0.5 * u, 3.4 * u, 0, 7); c.fill(); }
  c.restore();
}
function drawGlyphTile(c, x, y, s, glyph) {
  c.save(); c.shadowColor = 'rgba(120,50,10,0.18)'; c.shadowBlur = 6; c.shadowOffsetY = 1.5;
  const g = c.createLinearGradient(x, y, x, y + s); g.addColorStop(0, '#ef8a4f'); g.addColorStop(1, '#de6a3a'); c.fillStyle = g; prr(c, x, y, s, s, s * 0.24); c.fill(); c.restore();
  c.save(); c.translate(x + s / 2, y + s / 2); c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round'; (glyph || GLYPHS.spark)(c, s * 0.34); c.restore();
}
const GLYPHS = {
  spark: (c, r) => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); } },
  bolt: (c, r) => { c.beginPath(); c.moveTo(r * 0.15, -r); c.lineTo(-r * 0.55, r * 0.1); c.lineTo(-r * 0.02, r * 0.1); c.lineTo(-r * 0.2, r); c.lineTo(r * 0.6, -r * 0.15); c.lineTo(r * 0.05, -r * 0.15); c.closePath(); c.fill(); },
  layers: (c, r) => { for (let i = 0; i < 4; i++) { const y = -r * 0.75 + i * r * 0.5; c.beginPath(); c.moveTo(-r, y); c.lineTo(r, y); c.stroke(); } c.beginPath(); c.moveTo(-r * 0.2, r * 0.95); c.lineTo(0, r * 0.6); c.lineTo(r * 0.2, r * 0.95); c.stroke(); },
  drill: (c, r) => { c.beginPath(); c.moveTo(-r * 0.6, -r); c.lineTo(0, -r * 0.35); c.lineTo(r * 0.6, -r); c.stroke(); c.beginPath(); c.moveTo(0, -r * 0.35); c.lineTo(0, r * 0.45); c.stroke(); c.beginPath(); c.moveTo(-r * 0.25, r * 0.45); c.lineTo(0, r); c.lineTo(r * 0.25, r * 0.45); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-r, r * 0.1); c.quadraticCurveTo(-r * 0.5, -r * 0.05, 0, r * 0.1); c.quadraticCurveTo(r * 0.5, r * 0.25, r, r * 0.1); c.stroke(); },
  fan: (c, r) => { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a + 0.6) * r * 0.6, Math.sin(a + 0.6) * r * 0.6, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); c.stroke(); } },
  atom: (c, r) => { for (let i = 0; i < 3; i++) { c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.ellipse(0, 0, r, r * 0.36, 0, 0, Math.PI * 2); c.stroke(); c.restore(); } c.beginPath(); c.arc(0, 0, r * 0.16, 0, Math.PI * 2); c.fill(); },
  flame: (c, r) => { c.beginPath(); c.moveTo(0, -r); c.bezierCurveTo(r * 0.9, -r * 0.1, r * 0.7, r, 0, r); c.bezierCurveTo(-r * 0.7, r, -r * 0.9, -r * 0.1, 0, -r); c.stroke(); c.beginPath(); c.moveTo(0, -r * 0.1); c.bezierCurveTo(r * 0.4, r * 0.3, r * 0.3, r * 0.8, 0, r * 0.8); c.bezierCurveTo(-r * 0.3, r * 0.8, -r * 0.4, r * 0.3, 0, -r * 0.1); c.fill(); },
  lens: (c, r) => { c.beginPath(); c.ellipse(0, 0, r * 0.32, r, 0, 0, Math.PI * 2); c.stroke(); for (const y of [-0.6, 0, 0.6]) { c.beginPath(); c.moveTo(-r, y * r); c.lineTo(-r * 0.32, y * r); c.lineTo(r, 0); c.stroke(); } },
  chip: (c, r) => { c.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2); c.fillRect(-r * 0.28, -r * 0.28, r * 0.56, r * 0.56); for (let i = -1; i <= 1; i++) for (const [x0, y0, x1, y1] of [[i * 0.35, -0.6, i * 0.35, -1], [i * 0.35, 0.6, i * 0.35, 1], [-0.6, i * 0.35, -1, i * 0.35], [0.6, i * 0.35, 1, i * 0.35]]) { c.beginPath(); c.moveTo(x0 * r, y0 * r); c.lineTo(x1 * r, y1 * r); c.stroke(); } },
  gear: (c, r) => { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * 0.72 : r; c.lineTo(Math.cos(a - 0.12) * rr, Math.sin(a - 0.12) * rr); c.lineTo(Math.cos(a + 0.12) * rr, Math.sin(a + 0.12) * rr); } c.closePath(); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.28, 0, Math.PI * 2); c.stroke(); },
  clock: (c, r) => { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 0.7); c.moveTo(0, 0); c.lineTo(r * 0.45, r * 0.2); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); c.stroke(); } },
  ring: (c, r) => { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.55, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.08, 0, Math.PI * 2); c.fill(); } },
  rotor: (c, r) => { c.beginPath(); c.moveTo(-r, -r * 0.55); c.lineTo(r, -r * 0.55); c.stroke(); c.beginPath(); c.moveTo(0, -r * 0.55); c.lineTo(0, r * 0.1); c.stroke(); c.beginPath(); c.ellipse(0, r * 0.45, r * 0.6, r * 0.35, 0, 0, Math.PI * 2); c.stroke(); },
  wheel: (c, r) => { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.55, 0, Math.PI * 2); c.stroke(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16); c.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); c.stroke(); } c.beginPath(); c.arc(0, 0, r * 0.12, 0, Math.PI * 2); c.fill(); },
  cup: (c, r) => { c.beginPath(); c.moveTo(-r * 0.7, -r * 0.2); c.lineTo(-r * 0.55, r * 0.75); c.lineTo(r * 0.45, r * 0.75); c.lineTo(r * 0.6, -r * 0.2); c.closePath(); c.stroke(); c.beginPath(); c.arc(r * 0.68, r * 0.2, r * 0.26, -Math.PI / 2, Math.PI / 2); c.stroke(); for (const x of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(x * r, -r * 0.45); c.quadraticCurveTo(x * r + r * 0.15, -r * 0.7, x * r, -r); c.stroke(); } },
};

function drawHeader(c, D) {
  drawEmblemTile(c, 75, 50, 53); mono(c, 13, '#a6a7ab', 0); c.fillText('×', 138, 82); drawGlyphTile(c, 158, 50, 53, GLYPHS[D.glyph]);
  mono(c, 11.5, '#8d8f94', 1.6); c.fillText(L(D.code), 238, 72); c.fillText(L(D.series || 'KAPRI LAB · HOW IT WORKS'), 238, 90);
  c.textAlign = 'right'; c.fillText(L(D.kicker[0]), PR - 2, 72); c.fillText(L(D.kicker[1]), PR - 2, 90); c.textAlign = 'left';
  sans(c, 88, PC.ink, 500, -3.2); c.fillText(L(D.title), 70, 200);
  let x = 79; mono(c, 10.5, '#7d7f84', 1.4);
  for (const [name, col] of D.legend) { c.fillStyle = col; c.beginPath(); c.arc(x + 4, 236, 4.4, 0, 7); c.fill(); mono(c, 10.5, '#7d7f84', 1.4); c.fillText(L(name), x + 13, 240); x += 22 + c.measureText(L(name)).width + 6; }
  sans(c, 21.5, '#17181b', 600, -0.3); c.fillText(L(D.question), 579, 152);
  sans(c, 14, PC.body, 400, 0); const lines = wrap(c, L(D.text), 410); lines.forEach((l, i) => c.fillText(l, 579, 184 + i * 20.6));
}

// six live readouts
function drawStats(c, D, st) {
  const n = D.stats.length, cw = (PR - PL) / n, y = 963;
  c.fillStyle = PC.line; c.fillRect(PL, y, PR - PL, 1);
  D.stats.forEach((s, i) => {
    const x = PL + i * cw; if (i) { c.fillStyle = PC.line; c.fillRect(x, y, 1, 66); }
    const v = st.stats[s.key] ?? 0, hot = st.hot === s.key, x0 = x + (i ? 10 : 0);
    sans(c, 30, PC.ink, 500, -0.8); const txt = s.fmt ? s.fmt(v) : v.toFixed(s.dp ?? 1); c.fillText(txt, x0, y + 36);
    const tw = c.measureText(txt).width; sans(c, 13, '#55575c', 500, 0); c.fillText(L(s.unit), x0 + tw + 4, y + 36);
    c.fillStyle = hot ? PC.red : '#b9bbc0'; c.beginPath(); c.arc(x0 + 3, y + 51, 2.6, 0, 7); c.fill();
    mono(c, 8.6, hot ? PC.ink : PC.mute, 1.2, hot ? 700 : 400); c.fillText(L(s.label), x0 + 10, y + 54);
    const bw = cw - (i ? 22 : 12), f = Math.max(0, Math.min(1, Math.abs(v) / s.max));
    c.fillStyle = '#efe6db'; c.fillRect(x0, y + 62, bw, 2); c.fillStyle = hot ? PC.org : PC.barOn; c.fillRect(x0, y + 62, bw * f, 2);
  });
}

function panelFrame(c, x, y, w, h, title, right) {
  c.fillStyle = PC.panel; prr(c, x, y, w, h, 11); c.fill(); c.strokeStyle = PC.panelLine; c.lineWidth = 1; prr(c, x + 0.5, y + 0.5, w - 1, h - 1, 11); c.stroke();
  mono(c, 8.6, '#55575c', 1.5, 500); c.fillText(L(title), x + 15, y + 23);
  if (right) { mono(c, 8.6, '#8a8c91', 1.4); c.textAlign = 'right'; c.fillText(L(right), x + w - 15, y + 23); c.textAlign = 'left'; }
}
function togglePill(c, x, y, a, b) {
  mono(c, 8.6, '#fff', 0.6, 500); const wa = c.measureText(a).width + 16, wb = c.measureText(b).width + 16;
  c.fillStyle = '#fff'; prr(c, x - wa - wb, y, wa + wb, 17, 4); c.fill(); c.strokeStyle = '#dedbd5'; c.stroke();
  c.fillStyle = '#1b1c20'; prr(c, x - wa - wb + 1.5, y + 1.5, wa - 2, 14, 3); c.fill();
  c.fillStyle = '#fff'; c.fillText(a, x - wa - wb + 8, y + 12); c.fillStyle = '#6d6f74'; c.fillText(b, x - wb + 8, y + 12);
}

// selector dial: labels around a 320° sweep, orange arc from OFF to the pointer
function drawDial(c, D, st, box) {
  const cx = box.x + box.w / 2, cy = box.y + 112, R = 44, labels = D.dial.labels, N = labels.length;
  const ang = (p) => (245 - p * (320 / (N - 1))) * Math.PI / 180;   // math angle, y up
  const pt = (a, r) => [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
  c.save();
  for (let i = 0; i <= 64; i++) { const a = ang(i / 64 * (N - 1)); const [x0, y0] = pt(a, R + 6), [x1, y1] = pt(a, R + (i % 8 === 0 ? 12 : 9)); c.strokeStyle = '#c9c7c2'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  const p = st.dial ?? 0;
  if (p > 0.01) { c.strokeStyle = PC.org; c.lineWidth = 4.5; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, R + 9, -ang(0), -ang(p), false); c.stroke(); }
  const g = c.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, R); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ebe9e4');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.strokeStyle = '#d6d3cd'; c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.arc(cx, cy, R - 7, 0, 7); c.strokeStyle = '#e1ded8'; c.stroke();
  const a = ang(p), [tx, ty] = pt(a, R - 9), [bx, by] = pt(a + Math.PI, R - 22);
  c.strokeStyle = '#2a2b30'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  c.strokeStyle = '#fafafa'; c.lineWidth = 5.5; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
  const [dx, dy] = pt(a, R - 15); c.fillStyle = PC.red; c.beginPath(); c.arc(dx, dy, 3, 0, 7); c.fill();
  const cur = Math.round(p);
  labels.forEach((lb, i) => {
    const aa = ang(i); const [lx, ly] = pt(aa, R + 27); const on = i === cur && Math.abs(p - cur) < 0.25;
    mono(c, 8.2, on ? PC.ink : '#8a8c91', 1, on ? 700 : 400); const txt = L(lb), w = c.measureText(txt).width;
    const ca = Math.cos(aa); c.fillText(txt, lx - w / 2 + ca * w * 0.42, ly + 3);
  });
  c.restore();
  sans(c, 11, '#2c2d31', 400, 0); wrap(c, L(st.dialCaption || ''), box.w - 30).slice(0, 3).forEach((l, i) => c.fillText(l, box.x + 15, box.y + box.h - 36 + i * 15));
}

function drawStations(c, x, y, w, names, cur) {
  mono(c, 7.6, '#8a8c91', 0.8); const parts = names.map((n, i) => `${i + 1} ${L(n)}`); const sep = '  ›  ';
  const tot = parts.reduce((s, p) => s + c.measureText(p).width, 0) + c.measureText(sep).width * (parts.length - 1); let xx = x + (w - tot) / 2;
  parts.forEach((p, i) => { mono(c, 7.6, i === cur ? PC.org : '#8a8c91', 0.8, i === cur ? 700 : 400); c.fillText(p, xx, y); xx += c.measureText(p).width; if (i < parts.length - 1) { mono(c, 7.6, '#b5b6ba', 0.8); c.fillText(sep, xx, y); xx += c.measureText(sep).width; } });
}

function drawParts(c, D, st) {
  const cols = [82, 318, 552, 786], rows = [1337, 1393];
  D.parts.forEach((p, i) => {
    const x = cols[Math.floor(i / 2)], y = rows[i % 2]; const fade = st.hl != null && !st.hl.includes(i) ? 0.32 : 1, on = st.hl != null && st.hl.includes(i);
    c.globalAlpha = fade; mono(c, 9.5, on ? PC.red : '#8a8c91', 0.5, on ? 700 : 400); c.fillText(String(i + 1).padStart(2, '0'), x, y);
    sans(c, 13, PC.ink, 600, -0.1); c.fillText(L(p.t), x + 30, y);
    sans(c, 10.6, '#6e7075', 400, 0); wrap(c, L(p.d), 196).slice(0, 2).forEach((l, j) => c.fillText(l, x + 30, y + 16 + j * 13.5)); c.globalAlpha = 1;
  });
}

function drawFooter(c, D, st) {
  mono(c, 8.6, '#8a8c91', 1.4); c.fillText(L(D.footer || 'ANATOMY · A4'), PL, 1463);
  c.fillText(L(D.flow), 345, 1463);
  mono(c, 8.6, '#2b2c30', 1.2, 500); c.textAlign = 'right'; c.fillText(L(st.status || ''), PR, 1463); c.textAlign = 'left';
}

// 3D overlays: callout pill on the focused part, black number markers in the overview
function callout(c, x, y, num, text, a = 1) {
  c.save(); c.globalAlpha = a; mono(c, 8.6, '#1b1c20', 1.3, 600); const t = L(text).toUpperCase(), w = c.measureText(t).width + 38;
  c.shadowColor = 'rgba(20,20,30,0.15)'; c.shadowBlur = 5; c.fillStyle = '#fff'; prr(c, x - 12, y - 11, w, 22, 5); c.fill(); c.shadowBlur = 0;
  c.strokeStyle = '#dcdad5'; c.lineWidth = 1; c.stroke(); c.fillStyle = PC.red; c.beginPath(); c.arc(x, y, 7.5, 0, 7); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); mono(c, 8.4, '#fff', 0, 700); c.textAlign = 'center'; c.fillText(String(num), x, y + 3); c.textAlign = 'left';
  mono(c, 8.6, '#1b1c20', 1.3, 600); c.fillText(t, x + 14, y + 3.2); c.restore();
}
function marker(c, x, y, num, a = 1) {
  c.save(); c.globalAlpha = a; c.fillStyle = '#17181c'; c.beginPath(); c.arc(x, y, 8.5, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke();
  mono(c, 8.6, '#fff', 0, 700); c.textAlign = 'center'; c.fillText(String(num), x, y + 3.1); c.restore();
}

// composite the WebGL frame into the poster with soft white edges (the reference look)
function drawViewport(c, glCanvas, fade = 1) {
  c.drawImage(glCanvas, VP.x, VP.y, VP.w, VP.h);
  const e = (x0, y0, x1, y1, w) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); return g; };
  c.save(); c.globalAlpha = fade;
  c.fillStyle = e(0, VP.y, 0, VP.y + 46); c.fillRect(VP.x, VP.y, VP.w, 46);
  c.fillStyle = e(0, VP.y + VP.h, 0, VP.y + VP.h - 30); c.fillRect(VP.x, VP.y + VP.h - 30, VP.w, 30);
  c.fillStyle = e(VP.x, 0, VP.x + 26, 0); c.fillRect(VP.x, VP.y, 26, VP.h);
  c.fillStyle = e(VP.x + VP.w, 0, VP.x + VP.w - 26, 0); c.fillRect(VP.x + VP.w - 26, VP.y, 26, VP.h);
  c.restore();
}

function drawPoster(c, D, st, gl, overlays) {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, PW, PH);
  drawViewport(c, gl);
  // the question text sits over the render's top-right (white behind it keeps it readable)
  drawHeader(c, D);
  if (overlays) overlays(c);
  drawStats(c, D, st);
  const lp = { x: PL, y: 1047, w: 515, h: 259 }, rp = { x: 619, y: 1047, w: PR - 619, h: 259 };
  panelFrame(c, lp.x, lp.y, lp.w, lp.h, D.schematic.title); togglePill(c, lp.x + lp.w - 14, lp.y + 10, L(D.schematic.toggle?.[0] || 'Section'), L(D.schematic.toggle?.[1] || 'Ortho'));
  c.save(); c.beginPath(); c.rect(lp.x + 8, lp.y + 34, lp.w - 16, 168); c.clip(); D.schematic.draw(c, { x: lp.x + 14, y: lp.y + 38, w: lp.w - 28, h: 160 }, st); c.restore();
  drawStations(c, lp.x + 10, lp.y + 214, lp.w - 20, D.stations, st.stn);
  sans(c, 11, '#2c2d31', 400, 0); c.fillText(L(D.schematic.caption), lp.x + 15, lp.y + lp.h - 18);
  panelFrame(c, rp.x, rp.y, rp.w, rp.h, D.dial.title, st.dialStatus);
  drawDial(c, D, st, rp);
  drawParts(c, D, st);
  drawFooter(c, D, st);
}

// small drawing kit for schematics (thin ink, flat fills, hatched cuts)
const SK = {
  ink: '#2b2d33', blue: '#7f97c6', blueL: '#c9d4ea', org: '#ec7a2f', orgL: '#f6c9a6', cop: '#cf7a52', gray: '#d9d9dc', grayL: '#efefef',
  line(c, pts, col = SK.ink, w = 1.1, dash) { c.save(); c.strokeStyle = col; c.lineWidth = w; if (dash) c.setLineDash(dash); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore(); },
  rect(c, x, y, w, h, fill, r = 2, col = SK.ink) { c.save(); prr(c, x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(); c.restore(); },
  circ(c, x, y, r, fill, col = SK.ink) { c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(); c.restore(); },
  hatch(c, x, y, w, h, col = '#d4785a', gap = 5) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#fbe9df'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.lineWidth = 0.9; for (let k = -h; k < w; k += gap) { c.beginPath(); c.moveTo(x + k, y + h); c.lineTo(x + k + h, y); c.stroke(); } c.restore(); c.save(); c.strokeStyle = SK.ink; c.lineWidth = 1.1; c.strokeRect(x, y, w, h); c.restore(); },
  text(c, s, x, y, col = '#6e7075', size = 7.4, al = 'left') { mono(c, size, col, 0.6); c.textAlign = al; c.fillText(L(s), x, y); c.textAlign = 'left'; },
  arrow(c, x0, y0, x1, y1, col = SK.ink) { SK.line(c, [[x0, y0], [x1, y1]], col); const a = Math.atan2(y1 - y0, x1 - x0); c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.4) * 6, y1 - Math.sin(a - 0.4) * 6); c.lineTo(x1 - Math.cos(a + 0.4) * 6, y1 - Math.sin(a + 0.4) * 6); c.fill(); c.restore(); },
};
