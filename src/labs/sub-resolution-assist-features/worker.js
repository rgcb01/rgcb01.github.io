// Runs the SRAF model off the main thread. Full focus-exposure analyses are cached per design (and the no-assist
// baseline and dense reference per optics), so defocus and dose changes only need one new image.
import { SRAF_DESIGNS, srafAnalyze, srafDenseMask, srafDesignKey, srafMask, srafNormalize, srafOpticsKey, srafSpectrum, srafStateAt } from './model.js';

const cache = new Map();
const keep = (k, f) => { if (!cache.has(k)) { if (cache.size > 24) cache.delete(cache.keys().next().value); cache.set(k, f()); } return cache.get(k); };
const slim = (a) => ({ rows: a.rows.map(r => ({ z: r.z, ok: r.ok, Elo: r.Elo, Ehi: r.Ehi, Eprint: r.Eprint, Esafe: r.Esafe, onsetX: r.onsetX })), windows: a.windows, verdict: a.verdict, marginCdWindow: a.marginCdWindow, marginAccepted: a.marginAccepted, E0: a.E0, t0: a.t0, nilsAerial: a.nilsAerial, nilsResist: a.nilsResist, elBestFocus: a.elBestFocus, mask: a.mask });
const X0 = -720, X1 = 720;
const profile = (img) => { const xs = [], ys = []; for (let x = X0; x <= X1; x += 4) { xs.push(x); const u = (x + img.L / 2) / img.dx, i = Math.floor(u), f = u - i; ys.push(img.I[((i % img.N) + img.N) % img.N] * (1 - f) + img.I[(((i + 1) % img.N) + img.N) % img.N] * f); } return { xs, ys }; };

self.onmessage = (e) => {
  const { id, params, reference } = e.data, p = srafNormalize(params);
  try {
    const post = (msg) => self.postMessage({ id, ...msg });
    const opticsKey = srafOpticsKey(p), designKey = srafDesignKey(p);
    if (!cache.has('a|' + designKey)) post({ progress: 'Computing the focus-exposure window…' });
    const a = keep('a|' + designKey, () => slim(srafAnalyze(p)));
    const base = keep('b|' + opticsKey, () => slim(srafAnalyze({ ...p, bars: 0 })));
    const dense = reference ? keep('d|' + opticsKey, () => slim(srafAnalyze({ ...p, bars: 0 }, { mask: srafDenseMask(p.cd, 200) }))) : null;
    const mask = srafMask(p), dose = p.dose ?? a.E0, st = srafStateAt(mask, p, p.defocus, dose), stBase = srafStateAt(srafMask({ ...p, bars: 0 }), p, p.defocus, p.dose ?? base.E0);
    const fc = p.na / p.wavelength, spec = [], specBase = [];
    for (let k = -240; k <= 240; k++) { const f = (k / 120) * fc; spec.push(srafSpectrum(mask.all, f)); specBase.push(srafSpectrum([[-p.cd / 2, p.cd / 2]], f)); }
    post({ result: {
      params: p, design: a, base, dense, dose, doseBase: p.dose ?? base.E0,
      state: { ...profile(st.img), t: st.t, printed: st.printed, main: st.main, unwanted: st.unwanted, cd: st.cd, epe: st.epe },
      stateBase: { ...profile(stBase.img), t: stBase.t, cd: stBase.cd },
      spectrum: { f: Array.from({ length: 481 }, (_, i) => (i - 240) / 120), cur: spec, base: specBase },
      designs: SRAF_DESIGNS,
    } });
  } catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
