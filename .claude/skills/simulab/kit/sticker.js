// ---------------------------------------------------------------------------
// Sticker: one asset alone, with its indigo floor shadow, on a transparent canvas.
// tools/sticker.mjs builds a page with the kit + this file and calls window.sticker(type, o).
// o: { zoom (px per cm, default 30), rot (radians), opts (place options), state (st keys: power, lit...) }
// Returns a PNG data URL trimmed to the drawing (plus a small margin).
// ---------------------------------------------------------------------------
window.sticker = (type, o = {}) => {
  const zoom = o.zoom || 30, W = 2400, H = 1800, pad = 6;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const inst = place(type, 'sticker', Object.assign({ at: [0, 0, 0], rot: o.rot || 0, label: null }, o.opts || {}));
  if (inst.group === 'wheel' || inst.group === 'under' || inst.group === 'host') inst.group = 'floor';
  const st = Object.assign({ t: 0, power: 1, parts: {}, serial: [] }, o.state || {});
  LWS = clamp(0.55 + zoom / 40, 0.72, 1.25);
  drawAssembly({ ctx: c, cam: new Cam(zoom, inst.anchorL || [0, 0, 0], W / 2, H * 0.55), k: 1 }, st, [inst], new Xf());
  // trim to the pixels that were drawn
  const d = c.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error('el sticker salió vacío: ' + type);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
};
window.READY = true;
