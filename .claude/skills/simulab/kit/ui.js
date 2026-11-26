// ---------------------------------------------------------------------------
// Stage UI (1600 x 1280): dark frame, left code panel, paper card, bays. Reads DEMO.*
// ---------------------------------------------------------------------------
const STAGE = { w: 1600, h: 1280 };
const CARD = { x: 588, y: 32, w: 980, h: 1216 };
const VIEW = { cx: 1078, cy: 540 };
const ED = { x: 44, y: 244, w: 508, h: 816, lh: 22.6, top: 284, font: 13.4 };
const UIC = { bg: '#121316', panel: '#0c0d10', line: '#26292f', dim: '#7d828c', txt: '#d9dce3', org: '#ff7a1a', lime: '#c8f04a', cyan: '#4fd8ea', pink: '#ff5c9a', amber: '#ffb547', coral: '#ff6a5c' };
const BAY_BG = { lime: '#c8f04a', amber: '#ffcf6b', cyan: '#7fe6f2', pink: '#ff9ec0', coral: '#ff9e93', grey: '#e6e2d8' };
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

// ---- code tokenizer (C / JS / Python-ish) ----
const KW = new Set(['const', 'int', 'float', 'long', 'void', 'if', 'else', 'for', 'while', 'return', 'import', 'from', 'new', 'abs', 'bool', 'byte', 'unsigned', 'def', 'True', 'False', 'None', 'let', 'true', 'false']);
const COL = { def: '#d9dce3', kw: '#ff7ab2', fn: '#6fd3ff', num: '#ffb547', str: '#b8ec6c', com: '#6c7280', con: '#c9a8ff', pun: '#9aa0aa' };
function tokenize(line) {
  const out = [], re = /(\/\/.*$|#.*$)|('[^']*'|"[^"]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push([m[1], COL.com]);
    else if (m[2]) out.push([m[2], COL.str]);
    else if (m[3]) out.push([m[3], COL.num]);
    else if (m[4]) { const w = m[4], rest = line.slice(re.lastIndex); out.push([w, KW.has(w) ? COL.kw : /^\s*\(/.test(rest) ? COL.fn : /^[A-Z][A-Z0-9_]+$/.test(w) ? COL.con : COL.def]); }
    else if (m[5]) out.push([m[5], null]);
    else out.push([m[6], COL.pun]);
  }
  return out;
}

let _traces = null;
function drawBackdrop(c) {
  c.fillStyle = UIC.bg; c.fillRect(0, 0, STAGE.w, STAGE.h);
  if (!_traces) {
    const rnd = mulberry32(7), T = [];
    for (let i = 0; i < 70; i++) {
      let x = Math.round(rnd() * 80) * 20, y = Math.round(rnd() * 64) * 20; const pts = [[x, y]];
      for (let k = 0; k < 4; k++) { if (rnd() < 0.5) x += (rnd() < 0.5 ? -1 : 1) * Math.round(rnd() * 8 + 2) * 20; else y += (rnd() < 0.5 ? -1 : 1) * Math.round(rnd() * 8 + 2) * 20; pts.push([x, y]); }
      T.push(pts);
    }
    _traces = T;
  }
  c.save(); c.lineWidth = 2; c.strokeStyle = '#1c1e23'; c.lineJoin = 'round';
  for (const p of _traces) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) c.lineTo(q[0], q[1]); c.stroke(); c.fillStyle = '#23262c'; for (const q of [p[0], p[p.length - 1]]) { c.beginPath(); c.arc(q[0], q[1], 4, 0, Math.PI * 2); c.fill(); } }
  c.restore();
}
function drawEmblem(c, x, y, r) {
  c.save();
  c.fillStyle = '#1b1c20'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.lineWidth = 3; c.strokeStyle = UIC.org; c.stroke();
  c.fillStyle = '#ff8a2e'; rr(c, x - 19, y - 12, 38, 26, 6); c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a1200'; c.stroke();
  c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x, y - 20); c.stroke(); c.fillStyle = UIC.lime; c.beginPath(); c.arc(x, y - 22, 3.2, 0, Math.PI * 2); c.fill(); c.stroke();
  for (const dx of [-9, 9]) { c.fillStyle = '#e8ebf0'; c.beginPath(); c.arc(x + dx, y + 1, 7.2, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = '#3a3f4b'; c.beginPath(); c.arc(x + dx, y + 1, 4.6, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(200,206,220,0.7)'; for (const [a, b] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5], [0, 0]]) c.fillRect(x + dx + a - 0.6, y + 1 + b - 0.6, 1.2, 1.2); }
  c.restore();
}
function drawTitle(c, x, y) {
  const title = DEMO.title;
  c.save();
  let size = 104; c.font = `700 ${size}px Silkscreen, monospace`; c.letterSpacing = '2px';
  while (c.measureText(title).width > 480 && size > 56) { size -= 4; c.font = `700 ${size}px Silkscreen, monospace`; }
  c.textBaseline = 'alphabetic';
  for (let i = 9; i >= 1; i--) { c.fillStyle = i > 6 ? '#000000' : '#3b1500'; c.fillText(title, x + i * 0.9, y + i * 0.9); }
  const g = c.createLinearGradient(0, y - size * 0.8, 0, y);
  g.addColorStop(0, '#fff3e2'); g.addColorStop(0.55, '#ffc58f'); g.addColorStop(1, '#ff7a1a');
  c.fillStyle = g; c.fillText(title, x, y);
  c.restore();
  c.save(); c.font = `700 13.5px ${FONT_MONO}`; c.letterSpacing = '4px'; c.fillStyle = '#8b909a'; c.fillText(DEMO.tagline, x + 4, y + 40); c.restore();
}

function drawEditor(c, TL, st) {
  const t = st.t, x = ED.x, y = ED.y, w = ED.w, h = ED.h;
  const tabIdx = TL.tabAt(t), tab = TL.tabs[tabIdx];
  c.save();
  c.fillStyle = UIC.panel; rr(c, x, y, w, h, 14); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2a2d33'; c.stroke();
  c.fillStyle = '#16181c'; rr(c, x, y, w, 40, [14, 14, 0, 0]); c.fill();
  c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x + w, y + 40); c.strokeStyle = '#2a2d33'; c.stroke();
  [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([col, i]) => { c.fillStyle = col; c.globalAlpha = 0.85; c.beginPath(); c.arc(x + 20 + i * 17, y + 20, 5.5, 0, Math.PI * 2); c.fill(); });
  c.globalAlpha = 1;
  c.font = `700 12.5px ${FONT_MONO}`; c.letterSpacing = '0.5px';
  let tx = x + 82;
  TL.tabs.forEach((tb, i) => {
    const on = i === tabIdx, tw = c.measureText(tb.name).width + 26;
    if (on) { c.fillStyle = '#0c0d10'; c.fillRect(tx, y + 6, tw, 34); c.fillStyle = UIC.org; c.fillRect(tx, y + 37, tw, 3); }
    c.fillStyle = on ? '#f1f2f5' : '#6b707a'; c.fillText(tb.name, tx + 13, y + 26); tx += tw + 4;
  });
  c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '1px'; c.fillStyle = UIC.dim; c.textAlign = 'right';
  c.fillText(DEMO.port || 'COM4 · 9600 BAUD', x + w - 14, y + 25); c.textAlign = 'left';
  const top = ED.top, rows = Math.floor((y + h - 10 - top) / ED.lh);
  c.save(); rr(c, x + 1, top - 4, w - 2, y + h - top + 2, [0, 0, 14, 14]); c.clip();
  c.font = `400 ${ED.font}px ${FONT_MONO}`; c.letterSpacing = '0px';
  const items = [];
  tab.rows.forEach((row, li) => {
    items.push({ kind: 'code', text: row.text, li, ev: row.ev, ids: row.ids });
    if (tab.logs) for (const lg of tab.logs) if (lg.after === li && lg.t <= t) items.push({ kind: 'log', text: lg.text, t: lg.t, h: smooth((t - lg.t) / 0.22) });
  });
  let activeRow = 0, activeT = -1;
  items.forEach((it, r) => {
    if (it.kind !== 'code') return;
    const lt = lastLE(it.ev, t);
    it.heat = lt == null ? 0 : smooth((t - lt) / 0.06) * Math.exp(-(t - lt) / 0.45);
    if (lt != null && lt >= activeT) { activeT = lt; activeRow = r; }
  });
  let scroll;
  if (tab.logs) {
    if (!tab._scrollKeys) {
      const target = (tt) => {
        let ar = 0, at = -1, r = 0;
        tab.rows.forEach((row, li) => { const lt = lastLE(row.ev, tt); if (lt != null && lt >= at) { at = lt; ar = r; } r += 1 + tab.logs.filter(lg => lg.after === li && lg.t <= tt).length; });
        const total = tab.rows.length + tab.logs.filter(lg => lg.t <= tt).length;
        return clamp(ar - Math.floor(rows * 0.62), 0, Math.max(0, total - rows));
      };
      const times = [...new Set([...tab.rows.flatMap(r => r.ev), ...tab.logs.map(l => l.t)])].sort((a, b) => a - b);
      const keys = []; let prev = target(-1);
      for (const tt of times) { const v = target(tt + 1e-6); if (v !== prev) { keys.push([tt, v - prev]); prev = v; } }
      tab._scrollKeys = { base: target(-1), keys };
    }
    scroll = tab._scrollKeys.base; for (const [tt, dv] of tab._scrollKeys.keys) scroll += dv * smooth((t - tt) / 0.3);
  } else scroll = tab.scrollAt ? tab.scrollAt(t) : 0;
  const gx = x + 14, cx0 = x + 54;
  let cum = 0;
  items.forEach((it, r) => {
    const yy = top + (cum - scroll) * ED.lh;
    cum += it.kind === 'log' ? it.h : 1;
    it.y = yy; it.endX = cx0;
    if (yy < top - ED.lh || yy > y + h) return;
    if (it.kind === 'code') {
      const isActive = r === activeRow && activeT >= 0 && (t - activeT) < 3.0;
      const act = isActive ? smooth((t - activeT) / 0.06) : 0;
      if (Math.max(it.heat, act) > 0.02) {
        c.fillStyle = `rgba(255,181,71,${0.08 * it.heat + 0.08 * act})`; c.fillRect(x + 2, yy - 2, w - 4, ED.lh);
        c.fillStyle = `rgba(255,181,71,${Math.min(1, 0.8 * it.heat + act)})`; c.fillRect(x + 2, yy - 2, 4, ED.lh);
      }
      c.fillStyle = isActive ? '#c9ccd3' : '#454a54'; c.textAlign = 'right'; c.fillText(String(it.li + 1).padStart(3, ' '), gx + 26, yy + 13); c.textAlign = 'left';
      let px = cx0;
      for (const [tok, col] of tokenize(it.text)) { c.fillStyle = col || COL.def; c.fillText(tok, px, yy + 13); px += c.measureText(tok).width; }
      it.endX = px;
    } else {
      c.globalAlpha = it.h;
      const parts = it.text.match(/^(»)( \d+:\d+\.\d+)(  PIEZA )(\d+\/\d+)( · .*)$/);
      let px = cx0;
      if (parts) for (const [s, col] of [[parts[1], UIC.amber], [parts[2], '#5d636e'], [parts[3], UIC.lime], [parts[4], UIC.lime], [parts[5], '#8a909b']]) { c.fillStyle = col; c.fillText(s, px, yy + 13); px += c.measureText(s).width; }
      c.globalAlpha = 1;
    }
  });
  c.restore(); c.restore();
  return { items, activeRow, scroll, tab: tabIdx };
}
function drawSerial(c, st) {
  const x = 44, y = 1072, w = 508, h = 104;
  c.save();
  c.fillStyle = UIC.panel; rr(c, x, y, w, h, 12); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2a2d33'; c.stroke();
  c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '1.5px'; c.fillStyle = UIC.dim; c.fillText(DEMO.serialTitle || 'MONITOR SERIE · 9600', x + 16, y + 22);
  c.fillStyle = st.tx ? UIC.amber : '#3a3e46'; c.beginPath(); c.arc(x + w - 22, y + 18, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = UIC.dim; c.textAlign = 'right'; c.fillText('TX', x + w - 34, y + 22); c.textAlign = 'left';
  c.font = `400 13px ${FONT_MONO}`; c.letterSpacing = '0px';
  const L = st.serial || [];
  L.forEach((sl, i) => {
    const yy = y + 44 + i * 17.5;
    c.fillStyle = '#4b505a'; c.fillText('>', x + 16, yy);
    c.fillStyle = sl.hot ? UIC.coral : (i === L.length - 1 ? '#e6e8ee' : '#9aa0aa'); c.fillText(sl.text, x + 32, yy);
    if (sl.note) { c.fillStyle = UIC.coral; c.fillText('  ' + sl.note, x + 32 + c.measureText(sl.text).width, yy); }
  });
  if (!L.length) { c.fillStyle = '#4b505a'; c.fillText(st.power ? '> listo' : '> esperando energía…', x + 16, y + 44); }
  c.restore();
}
function chip(c, x, y, text, o = {}) {
  c.save(); c.font = `700 ${o.size || 11}px ${FONT_MONO}`; c.letterSpacing = (o.ls ?? 1.5) + 'px';
  const tw = c.measureText(text).width, w = tw + 26 + (o.dot ? 14 : 0), h = o.h || 30, bx = o.align === 'right' ? x - w : x;
  c.fillStyle = o.bg || '#16181c'; rr(c, bx, y, w, h, h / 2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = o.border || '#2a2d33'; c.stroke();
  if (o.dot) { c.fillStyle = o.dot; c.beginPath(); c.arc(bx + 15, y + h / 2, 4, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = o.fg || '#c9ccd3'; c.textBaseline = 'middle'; c.fillText(text, bx + 13 + (o.dot ? 12 : 0), y + h / 2 + 0.5);
  c.restore(); return w;
}
function drawLeftPanel(c, TL, st) {
  drawEmblem(c, 78, 76, 32);
  chip(c, 124, 60, DEMO.category || 'ROBÓTICA', { dot: UIC.lime, bg: '#1b1d22', fg: '#e8eaee', border: '#34373e' });
  c.save(); c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '2px'; c.fillStyle = '#5d626c'; c.fillText(labText(`${DEMO.brand || 'SIMULAB'} · LAB ${DEMO.num}`), 262, 80); c.restore();
  drawTitle(c, 50, 190);
  const ed = drawEditor(c, TL, st);
  drawSerial(c, st);
  let fx = 44;
  for (const ch of (DEMO.footer ? DEMO.footer(TL, st) : defaultFooter(TL, st))) fx += chip(c, fx, 1194, ch.text, { dot: ch.dot }) + 8;
  c.save(); c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '1px'; c.fillStyle = '#5d626c'; c.textAlign = 'right'; c.fillText(DEMO.handle || 'x.com/0xKapri', 552, 1214); c.restore();
  return ed;
}
function defaultFooter(TL, st) {
  const done = st.placedCount >= TL.total;
  return [{ text: done ? (st.power ? 'CORRIENDO' : 'LISTO') : 'ARMANDO', dot: done ? UIC.lime : UIC.amber }, { text: `${String(st.placedCount).padStart(2, '0')}/${TL.total} PIEZAS` }];
}

// ---- paper card ---------------------------------------------------------------------
function drawCardBase(c) {
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.35)'; rr(c, CARD.x + 6, CARD.y + 8, CARD.w, CARD.h, 26); c.fill();
  c.fillStyle = '#f3eee3'; rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 26); c.fill();
  c.restore();
}
// web wording: swap the video wording when WEB (main.js) is on
function labText(s) { return WEB && s ? s.replace(/\bFIG\. ?(\d+)(?: · LAB)?/g, 'LAB $1').replace(/\bFig\. ?(\d+)/g, 'Lab $1') : s; }
function drawCardFrame(c) {
  c.save();
  rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 26); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.setLineDash([7, 5]); c.lineWidth = 1.5; c.strokeStyle = 'rgba(29,32,51,0.35)'; rr(c, CARD.x + 14, CARD.y + 14, CARD.w - 28, CARD.h - 28, 16); c.stroke(); c.setLineDash([]);
  c.restore();
}
function drawPlate(c) {
  const x = CARD.x + 30, y = 60, [t1, t2] = DEMO.plate.map(labText);
  c.save();
  c.font = `400 12.5px ${FONT_MONO}`; c.letterSpacing = '0.5px';
  const w = Math.max(c.measureText(t2).width + 36, 440), h = 64;
  c.fillStyle = 'rgba(29,32,51,0.2)'; rr(c, x + 3, y + 4, w, h, 12); c.fill();
  c.fillStyle = '#fffdf8'; rr(c, x, y, w, h, 12); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.font = `700 15px ${FONT_MONO}`; c.letterSpacing = '3px'; c.fillText(t1, x + 18, y + 27);
  c.fillStyle = '#545867'; c.font = `400 12.5px ${FONT_MONO}`; c.letterSpacing = '0.5px'; c.fillText(t2, x + 18, y + 49);
  c.restore();
}
function drawSpeedBadge(c, TL, st) {
  const b = DEMO.speedBadge ? DEMO.speedBadge(TL, st) : (st.placedCount < TL.total ? { txt: 'ARMANDO', bg: BAY_BG.amber } : { txt: 'TIEMPO REAL ×1', bg: BAY_BG.lime });
  pill(c, CARD.x + CARD.w - 28, 66, b.txt, { align: 'right', bg: b.bg, size: 12.5, padY: 9, dot: INK });
}
function drawChips(c) {
  pill(c, CARD.x + 28, 966, labText(DEMO.chips[0]), { bg: '#fffdf8', size: 11, padY: 7, ls: 1.6, shadow: false, lw: 1.5 });
  pill(c, CARD.x + CARD.w - 28, 966, labText(DEMO.chips[1]), { bg: '#fffdf8', size: 11, padY: 7, ls: 1.6, align: 'right', shadow: false, lw: 1.5 });
}

// ---- layout: 'full' (default) = the card fills the stage; 'panel' = code panel on the left ----------
function applyLayout(mode) { if (mode !== 'panel') { Object.assign(CARD, { x: 32, w: 1536 }); VIEW.cx = CARD.x + CARD.w / 2; } }
function drawHandle(c) {
  c.save(); c.font = `700 11px ${FONT_MONO}`; c.letterSpacing = '1.5px'; c.fillStyle = '#7a7e88'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(DEMO.handle || 'x.com/0xKapri', VIEW.cx, 979); c.restore();
}

// ---- bays (4 across the card: 224 px in panel, 363 px in full). bayFrame + bigValue + chart helpers ------
function bayFrame(c, i, title, status, sbg) {
  const w = (CARD.w - 84) / 4, h = 208, x = CARD.x + 24 + i * (w + 12), y = 1012;
  c.save();
  c.fillStyle = 'rgba(29,32,51,0.16)'; rr(c, x + 3, y + 4, w, h, 14); c.fill();
  c.fillStyle = '#fffdf8'; rr(c, x, y, w, h, 14); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  c.font = `700 10.5px ${FONT_MONO}`; c.letterSpacing = '1.1px'; c.fillStyle = '#2a2d3a'; c.textBaseline = 'middle'; c.fillText(title, x + 14, y + 22);
  c.restore();
  pill(c, x + w - 12, y + 10, status, { align: 'right', bg: sbg, size: 9.5, padY: 4, padX: 7, ls: 1, shadow: false, lw: 1.4 });
  return { x, y, w, h, cx: x + 14, cy: y + 116, cw: w - 28, ch: 74 };
}
function bigValue(c, b, val, unit, sub) {
  c.save(); c.textBaseline = 'alphabetic';
  c.font = `700 34px ${FONT_MONO}`; c.letterSpacing = '-0.5px'; c.fillStyle = INK; c.fillText(val, b.x + 14, b.y + 76);
  if (unit) { const vw = c.measureText(val).width; c.font = `700 14px ${FONT_MONO}`; c.fillStyle = '#545867'; c.fillText(unit, b.x + 20 + vw, b.y + 76); }
  c.font = `400 11.5px ${FONT_MONO}`; c.letterSpacing = '0.3px'; c.fillStyle = '#6b6f7a'; c.fillText(sub, b.x + 14, b.y + 98);
  c.restore();
}
function chartBox(c, b) { c.fillStyle = '#f4f1ea'; rr(c, b.cx, b.cy, b.cw, b.ch, 6); c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.3)'; c.stroke(); }
// generic bay: parts placed
function bayPiezas(c, i, TL, st) {
  const done = st.placedCount >= TL.total;
  const b = bayFrame(c, i, `BAY 0${i + 1} · PIEZAS`, done ? 'LISTO' : 'ARMANDO', done ? BAY_BG.lime : BAY_BG.amber);
  bigValue(c, b, `${String(st.placedCount).padStart(2, '0')}/${TL.total}`, '', st.lastPart ? '› ' + st.lastPart : '› esperando…');
  const n = TL.total, cols = Math.min(16, n), size = Math.min(10, (b.cw - (cols - 1) * 2.3) / cols);
  for (let k = 0; k < n; k++) {
    const col = k % cols, row = Math.floor(k / cols), x = b.x + 14 + col * (size + 2.3), y = b.y + 128 + row * 15;
    const on = k < st.placedCount, last = k === st.placedCount - 1 && !done;
    c.fillStyle = last ? '#c8f04a' : on ? '#e3a35a' : '#ece6da'; c.fillRect(x, y, size, 11);
    c.lineWidth = 1; c.strokeStyle = on ? 'rgba(29,32,51,0.75)' : 'rgba(29,32,51,0.2)'; c.strokeRect(x + 0.5, y + 0.5, size - 1, 10);
  }
  c.save(); c.font = `400 10.5px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.fillText('colocadas desde código', b.x + 14, b.y + 186); c.restore();
}

// ---- grain -------------------------------------------------------------------------------
let _grain = null;
function grainPattern(c) {
  if (_grain) return _grain;
  const g = document.createElement('canvas'); g.width = 384; g.height = 384;
  const gc = g.getContext('2d'), id = gc.createImageData(384, 384), rnd = mulberry32(42);
  for (let i = 0; i < 384 * 384; i++) { let v = 255 - rnd() * 15; if (rnd() < 0.014) v -= 28 + rnd() * 46; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v * 0.98; id.data[i * 4 + 3] = 255; }
  gc.putImageData(id, 0, 0); _grain = c.createPattern(g, 'repeat'); return _grain;
}
function bubble(c, x, y, lines, a, col) {
  c.save(); c.globalAlpha = a; c.font = `700 13px ${FONT_MONO}`; c.letterSpacing = '0px';
  const w = Math.max(...lines.map(l => c.measureText(l).width)) + 26, h = lines.length * 20 + 14;
  c.fillStyle = '#1d2026'; rr(c, x, y, w, h, 9); c.fill(); c.lineWidth = 2; c.strokeStyle = col; c.stroke();
  lines.forEach((l, i) => { c.fillStyle = i === lines.length - 1 ? col : '#c9ccd3'; c.fillText(l, x + 13, y + 22 + i * 20); });
  c.restore();
}
// two horizontal bars from the centre (values -1..1): forward lime, reverse coral
function barPair(c, b, rows) {
  c.save();
  rows.forEach(([name, v], i) => {
    const yy = b.cy + 10 + i * 34, bx = b.cx + 34, bw = b.cw - 34, mid = bx + bw / 2;
    c.font = `700 9.5px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.fillText(name, b.cx, yy + 9);
    c.fillStyle = '#f4f1ea'; rr(c, bx, yy, bw, 16, 8); c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(29,32,51,0.3)'; c.stroke();
    const len = clamp(v, -1, 1) * (bw / 2 - 4);
    c.fillStyle = v >= 0 ? '#9ed43a' : '#ff7a6b'; rr(c, Math.min(mid, mid + len), yy + 3, Math.abs(len), 10, 5); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(mid, yy - 2); c.lineTo(mid, yy + 18); c.stroke();
  });
  c.restore();
}
// digital trace (0/1 history): pts = [[t, v]], window seconds
function digitalTrace(c, b, pts, t, win = 2, label = 'PIN') {
  c.save(); chartBox(c, b);
  c.font = `700 9px ${FONT_MONO}`; c.fillStyle = '#8a8e99'; c.fillText(label, b.cx + 6, b.cy + 14);
  const X = (tt) => b.cx + b.cw - 8 - ((t - tt) / win) * (b.cw - 52), Y = (v) => b.cy + b.ch - 14 - v * 36;
  c.strokeStyle = '#e0a21a'; c.lineWidth = 2; c.beginPath();
  let v0 = 0; for (const [tt, v] of pts) { if (tt <= t - win) v0 = v; }
  c.moveTo(X(t - win), Y(v0));
  for (const [tt, v] of pts) { if (tt <= t - win || tt > t) continue; c.lineTo(X(tt), Y(v0)); c.lineTo(X(tt), Y(v)); v0 = v; }
  c.lineTo(X(t), Y(v0)); c.stroke(); c.restore();
}

// ---- callouts and tip card (from Lab 02) -----------------------------------------------------
// label pill joined to screen point A by a leader line; dx<0 puts the pill on the left
function callout(c, A, dx, dy, text, a, bg) {
  if (a <= 0.01) return;
  const B = [A[0] + dx, A[1] + dy];
  c.save(); c.globalAlpha = a; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineWidth = 1.7; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(A[0], A[1], 3.6, 0, Math.PI * 2); c.fill(); c.restore();
  pill(c, B[0], B[1], text, { align: dx < 0 ? 'right' : 'left', valign: 'middle', alpha: a, bg: bg || '#ffffff', size: 12.5, padY: 7 });
}
// two-line tip card (paper box, ink border, second line orange) with a lime tag on top
function tipCard(c, x, y, lines, a, tag = 'CÓMO SE USA') {
  if (a <= 0.01) return;
  const [l1, l2] = lines;
  c.save(); c.globalAlpha = a; c.font = `700 18px ${FONT_MONO}`; c.letterSpacing = '0px';
  const w = Math.max(c.measureText(l1).width, c.measureText(l2 || '').width) + 40, h = l2 ? 76 : 50;
  c.fillStyle = 'rgba(29,32,51,0.22)'; rr(c, x + 4, y + 5, w, h, 14); c.fill();
  c.fillStyle = '#fffdf8'; rr(c, x, y, w, h, 14); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.textBaseline = 'middle'; c.fillText(l1, x + 20, y + 26); if (l2) { c.fillStyle = '#e8590c'; c.fillText(l2, x + 20, y + 52); }
  c.restore();
  if (tag) pill(c, x + 18, y - 13, tag, { bg: '#c8f04a', size: 10.5, padY: 4, ls: 2, alpha: a });
}
