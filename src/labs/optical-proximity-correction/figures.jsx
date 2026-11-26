// Canvas figures for Lab 002. Pure drawing from a worker result; semantic colours are fixed across the lab,
// the explainer and the cards: blue target, white mask, orange uncorrected print, green corrected print, red error.
import { useEffect, useRef, useState } from 'react';
import { opcRectOutline } from './model.js';

export const OPC_COLORS = { target: '#4da6ff', mask: '#f5f7fb', uncorrected: '#ff9f43', corrected: '#3ddc84', error: '#ff4d5e' };
const KIND = ['edge', 'lineEnd', 'outerCorner', 'innerCorner', 'endCorner'];

// windows of interest (nm) derived from the layout, so they follow feature-size changes
export function opcViews(result) {
  const P = Object.fromEntries(result.polys.map(p => [p.id, p])), b = result.bounds;
  const xs = (id) => P[id].pts.map(q => q[0]), ys = (id) => P[id].pts.map(q => q[1]);
  const top = Math.max(...ys('iso')), elbow = P.elbow.pts[5];
  return {
    all: { label: 'Whole clip', win: b },
    lineEnds: { label: 'Line ends', win: [Math.min(...xs('dense0')) - 70, top - 230, Math.max(...xs('iso')) + 70, top + 110] },
    corner: { label: 'Corner', win: [elbow[0] - 170, elbow[1] - 330, elbow[0] + 470, elbow[1] + 110] },
    isoDense: { label: 'Iso vs dense', win: [Math.min(...xs('dense0')) - 70, -170, Math.max(...xs('iso')) + 70, 170] },
  };
}

// fit a window into a canvas aspect, keeping the window centred
function fit(win, w, h) {
  const ww = win[2] - win[0], wh = win[3] - win[1], s = Math.min(w / ww, h / wh), cx = (win[0] + win[2]) / 2, cy = (win[1] + win[3]) / 2;
  return { s, X: (x) => w / 2 + (x - cx) * s, Y: (y) => h / 2 - (y - cy) * s };
}

const heatCache = new WeakMap(), outlineCache = new WeakMap();
function outlineOf(rects) { if (!outlineCache.has(rects)) outlineCache.set(rects, opcRectOutline(rects)); return outlineCache.get(rects); }
function heatCanvas(img) {
  if (heatCache.has(img)) return heatCache.get(img);
  const c = document.createElement('canvas'); c.width = img.nx; c.height = img.ny;
  const ctx = c.getContext('2d'), id = ctx.createImageData(img.nx, img.ny);
  for (let j = 0; j < img.ny; j++) for (let i = 0; i < img.nx; i++) {
    const v = Math.max(0, Math.min(1, img.data[j * img.nx + i] / 1.25)), o = ((img.ny - 1 - j) * img.nx + i) * 4; // flip: canvas y down
    id.data[o] = 10 + 120 * v; id.data[o + 1] = 15 + 128 * v; id.data[o + 2] = 28 + 150 * v; id.data[o + 3] = 255;
  }
  ctx.putImageData(id, 0, 0); heatCache.set(img, c); return c;
}

function drawLayers(ctx, side, result, T, o) {
  const { s, X, Y } = T, L = o.layers;
  if (L.image) {
    const img = side.image, hc = heatCanvas(img), x0 = X(img.x0 - img.px / 2), y1 = Y(img.y0 + (img.ny - 0.5) * img.py);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(hc, x0, y1, img.nx * img.px * s, img.ny * img.py * s);
  }
  if (L.mask) {
    ctx.fillStyle = 'rgba(245,247,251,0.16)'; ctx.beginPath();
    for (const r of side.mask) ctx.rect(X(r[0]) - 0.25, Y(r[3]) - 0.25, (r[2] - r[0]) * s + 0.5, (r[3] - r[1]) * s + 0.5);
    ctx.fill('nonzero');
    ctx.strokeStyle = OPC_COLORS.mask; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const e of outlineOf(side.mask)) { ctx.moveTo(X(e[0]), Y(e[1])); ctx.lineTo(X(e[2]), Y(e[3])); }
    ctx.stroke();
  }
  if (L.target) {
    ctx.strokeStyle = OPC_COLORS.target; ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]);
    for (const p of result.polys) { ctx.beginPath(); p.pts.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.closePath(); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  if (L.contour) {
    const c = side.contours; ctx.strokeStyle = side.color; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let k = 0; k < c.length; k += 4) { ctx.moveTo(X(c[k]), Y(c[k + 1])); ctx.lineTo(X(c[k + 2]), Y(c[k + 3])); }
    ctx.stroke();
  }
  if (L.epe) {
    const q = side.metrics.sites, g = o.epeGain || 1; ctx.strokeStyle = OPC_COLORS.error; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let k = 0; k < q.length; k += 6) { const e = q[k + 4]; if (Math.abs(e) < 0.5) continue; ctx.moveTo(X(q[k]), Y(q[k + 1])); ctx.lineTo(X(q[k] + q[k + 2] * e * g), Y(q[k + 1] + q[k + 3] * e * g)); }
    ctx.stroke();
  }
}

// Main viewer: original (left of the split) versus corrected (right), identical optics.
export function OpcViewer({ result, view = 'all', layers, split = 0.5, onSplit, epeGain = 1, height = 0.56 }) {
  const ref = useRef(null), [w, setW] = useState(800);
  useEffect(() => { const el = ref.current?.parentElement; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width))); ro.observe(el); return () => ro.disconnect(); }, []);
  const h = Math.round(w * (w < 640 ? 0.85 : height));
  useEffect(() => {
    const cv = ref.current; if (!cv || !result) return;
    const dpr = window.devicePixelRatio || 1; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#080b12'; ctx.fillRect(0, 0, w, h);
    const views = opcViews(result), T = fit(views[view]?.win || result.bounds, w, h), sx = Math.round(split * w);
    const sides = [
      { ...result.before, mask: result.target, color: OPC_COLORS.uncorrected, clip: [0, sx] },
      { ...result.after, mask: result.corrected, color: OPC_COLORS.corrected, clip: [sx, w] },
    ];
    for (const sd of sides) { if (sd.clip[1] - sd.clip[0] < 1) continue; ctx.save(); ctx.beginPath(); ctx.rect(sd.clip[0], 0, sd.clip[1] - sd.clip[0], h); ctx.clip(); drawLayers(ctx, sd, result, T, { layers, epeGain }); ctx.restore(); }
    // split handle and side labels
    ctx.fillStyle = '#f5f7fb'; ctx.fillRect(sx - 1, 0, 2, h);
    ctx.beginPath(); ctx.arc(sx, h / 2, 13, 0, Math.PI * 2); ctx.fillStyle = '#101827'; ctx.fill(); ctx.strokeStyle = '#f5f7fb'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#f5f7fb'; ctx.beginPath(); ctx.moveTo(sx - 4, h / 2 - 5); ctx.lineTo(sx - 8, h / 2); ctx.lineTo(sx - 4, h / 2 + 5); ctx.moveTo(sx + 4, h / 2 - 5); ctx.lineTo(sx + 8, h / 2); ctx.lineTo(sx + 4, h / 2 + 5); ctx.fill();
    ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'top';
    const tag = (txt, x, col, align) => { ctx.textAlign = align; const tw = ctx.measureText(txt).width; const bx = align === 'left' ? x : x - tw - 16; ctx.fillStyle = 'rgba(8,11,18,0.82)'; ctx.fillRect(bx, 10, tw + 16, 22); ctx.fillStyle = col; ctx.fillText(txt, align === 'left' ? x + 8 : x - 8, 15); };
    if (sx > 120) tag('ORIGINAL MASK', 10, OPC_COLORS.uncorrected, 'left');
    if (w - sx > 120) tag('CORRECTED MASK', w - 10, OPC_COLORS.corrected, 'right');
    // scale bar: 100 nm
    const bar = 100 * T.s; ctx.fillStyle = '#b5c0d0'; ctx.fillRect(14, h - 20, bar, 2); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = '10px Cascadia Code, SFMono-Regular, Consolas, monospace'; ctx.fillText('100 nm', 14, h - 24);
  }, [result, view, layers, split, epeGain, w, h]);

  const drag = (e) => { const r = ref.current.getBoundingClientRect(); onSplit?.(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); };
  const m = result?.before?.metrics, a = result?.after?.metrics;
  const label = result ? `Top-down view, ${view}. Left: original mask, printed contour in orange, RMS edge placement error ${m.rms.toFixed(1)} nm. Right: corrected mask, printed contour in green, RMS ${a.rms.toFixed(1)} nm. Blue dashed: target.` : 'Loading';
  return (
    <div className="opc-viewer">
      <canvas ref={ref} role="img" aria-label={label}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }}
        onPointerMove={(e) => { if (e.buttons) drag(e); }} />
      <input className="opc-split" type="range" min="0" max="100" value={Math.round(split * 100)} aria-label="Before and after split position" onChange={(e) => onSplit?.(Number(e.target.value) / 100)} />
    </div>
  );
}

// Small multiples: one stage each, whole clip.
export function OpcStage({ result, kind }) {
  const ref = useRef(null), [w, setW] = useState(200);
  useEffect(() => { const el = ref.current?.parentElement; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.max(120, e.contentRect.width))); ro.observe(el); return () => ro.disconnect(); }, []);
  const h = Math.round(w * 0.62);
  useEffect(() => {
    const cv = ref.current; if (!cv || !result) return;
    const dpr = window.devicePixelRatio || 1; cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#080b12'; ctx.fillRect(0, 0, w, h);
    const T = fit(result.bounds, w, h), before = { ...result.before, mask: result.target, color: OPC_COLORS.uncorrected }, after = { ...result.after, mask: result.corrected, color: OPC_COLORS.corrected };
    const only = (o) => ({ target: false, mask: false, image: false, contour: false, epe: false, ...o });
    if (kind === 'target') { ctx.fillStyle = 'rgba(77,166,255,0.35)'; for (const r of result.target) ctx.fillRect(T.X(r[0]), T.Y(r[3]), (r[2] - r[0]) * T.s, (r[3] - r[1]) * T.s); drawLayers(ctx, before, result, T, { layers: only({ target: true }) }); }
    if (kind === 'original') drawLayers(ctx, before, result, T, { layers: only({ mask: true }) });
    if (kind === 'corrected') drawLayers(ctx, after, result, T, { layers: only({ mask: true }) });
    if (kind === 'image') drawLayers(ctx, after, result, T, { layers: only({ image: true }) });
    if (kind === 'printed') { drawLayers(ctx, before, result, T, { layers: only({ target: true, contour: true }) }); drawLayers(ctx, after, result, T, { layers: only({ contour: true }) }); }
  }, [result, kind, w, h]);
  return <canvas ref={ref} aria-hidden="true" />;
}

export function siteKind(code) { return KIND[code % 10]; }
export { outlineOf };
