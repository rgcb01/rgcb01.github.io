// Runs the OPC model off the main thread. Caches the uncorrected image and the model-based solution per optical
// setup, so moving OPC strength or the rule sliders only recomputes the corrected image.
import { opcAerialImage, opcBounds, opcContours, opcDoseToSize, opcFragmentMask, opcLayout, opcMetrics, opcModelBased, opcNormalize, opcOpticsKey, opcRuleMask, opcSites, opcTargetMask, OPC_FIELD } from './model.js';

let cache = null;
const crop = (img, b) => {
  const g = img.grid, F = OPC_FIELD, i0 = Math.max(0, Math.floor((b[0] + F.lx / 2) / g.px)), i1 = Math.min(g.nx - 1, Math.ceil((b[2] + F.lx / 2) / g.px));
  const j0 = Math.max(0, Math.floor((b[1] + F.ly / 2) / g.py)), j1 = Math.min(g.ny - 1, Math.ceil((b[3] + F.ly / 2) / g.py)), nx = i1 - i0 + 1, ny = j1 - j0 + 1, data = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) data[j * nx + i] = g.data[(j0 + j) * g.nx + i0 + i];
  return { data, nx, ny, x0: -F.lx / 2 + i0 * g.px, y0: -F.ly / 2 + j0 * g.py, px: g.px, py: g.py };
};
const KIND = ['edge', 'lineEnd', 'outerCorner', 'innerCorner', 'endCorner'];
const pack = (m) => {
  const s = new Float32Array(m.sites.length * 6);
  m.sites.forEach((q, i) => { s.set([q.x, q.y, q.nx, q.ny, q.epe, KIND.indexOf(q.kind) + (q.pinched ? 10 : q.bridged ? 20 : 0)], i * 6); });
  const { sites, ...rest } = m;
  return { ...rest, sites: s };
};
const segs = (img, thr, b) => Float32Array.from(opcContours(img, thr, b).flat());

self.onmessage = (e) => {
  const { id, params, reference } = e.data, p = opcNormalize(params), key = opcOpticsKey(p);
  try {
    if (!cache || cache.key !== key) {
      const polys = opcLayout(p.cd, p.space), target = opcTargetMask(polys), bounds = opcBounds(polys, 160);
      const imgBefore = opcAerialImage(target, p), thr = p.threshold ?? opcDoseToSize(imgBefore, polys, p.cd), sites = opcSites(polys, p.cd);
      const before = opcMetrics(imgBefore, sites, thr);
      const imgWin = opcBounds(polys, 520);   // image crop wider than the layout, so zoomed views never run out of image
      cache = { key, polys, target, bounds, imgWin, imgBefore, thr, sites, before, model: null, beforeOut: { metrics: pack(before), image: crop(imgBefore, imgWin), contours: segs(imgBefore, thr, bounds) } };
    }
    const c = cache;
    if ((p.mode === 'model' || reference) && !c.model) c.model = opcModelBased(c.polys, p, c.thr, { onIteration: (it, n) => self.postMessage({ id, progress: { it, n } }) });
    if (reference && !c.reference) { const m = opcMetrics(opcAerialImage(opcFragmentMask(c.polys, c.model.frags, 1), p), c.sites, c.thr); const { sites, ...rest } = m; c.reference = rest; }
    const corrected = p.mode === 'rules' ? opcRuleMask(c.polys, p.cd, p) : opcFragmentMask(c.polys, c.model.frags, p.strength);
    const imgAfter = opcAerialImage(corrected, p), after = opcMetrics(imgAfter, c.sites, c.thr);
    self.postMessage({ id, result: {
      params: p, thr: c.thr, bounds: c.bounds, polys: c.polys.map(q => ({ id: q.id, tag: q.tag, pts: q.pts })), target: c.target, corrected,
      before: c.beforeOut, after: { metrics: pack(after), image: crop(imgAfter, c.imgWin), contours: segs(imgAfter, c.thr, c.bounds) },
      reference: c.reference || null,
      model: c.model ? { history: c.model.history, diverged: c.model.diverged, bestIteration: c.model.bestIteration } : null,
    } });
  } catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
