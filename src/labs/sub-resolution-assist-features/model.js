// ---------------------------------------------------------------------------------------------
// How Can Features That Never Print Help Us Print Better? Sub-resolution assist features (SRAF). Pure functions.
//
// Optics: scalar Abbe imaging of a thin binary mask made of long lines (1D cross-section, infinite along the
//   lines), partially coherent source (conventional disk, annulus or dipole) sampled with a Vogel spiral, aberration
//   free, with the exact (non-paraxial) scalar defocus phase. Same conventions as Labs 001 and 002.
// Mask: bright field. Clear glass (transmission 1) carrying opaque chrome: the main line at x = 0 and assist bars.
// Resist: positive tone. The aerial image I is blurred (Gaussian, 12 nm) into the resist-model intensity Ir.
//   Exposure dose E is measured in units of the dose that clears an open (fully clear) area: resist clears where
//   E * Ir >= 1, so the printed feature (resist that remains) is where Ir < t with threshold t = 1 / E.
// Process window: for each focus z, the doses that keep the main line's CD within +-10 % of target. Three nested
//   windows: CD-only; defect-free (also no unwanted printed feature anywhere: assist bars or side lobes); safe
//   (also a >= 10 % intensity margin against unwanted printing, an educational heuristic). Exposure latitude
//   EL = (E_hi - E_lo) / E_mid of a dose interval; DOF at 5 % EL is the longest focus range over which one dose
//   interval with EL >= 5 % fits inside the window at every focus (exposure-defocus window, B. J. Lin 1994).
//
// Every number in the web lab, the explainer, the videos and the cards comes from this file. Only top-level
// `export const` / `export function`, no imports (wrapped for SimuLab).
// ---------------------------------------------------------------------------------------------

export const SRAF_DEFAULTS = {
  wavelength: 193, na: 0.85, illumination: 'annular', sigmaIn: 0.55, sigmaOut: 0.85,   // approved optics
  cd: 90,                                                                              // main line width, nm
  bars: 2, barWidth: 30, barSpace: 110, barPitch: 200,                                 // per side; spacing = main edge to first bar edge
  defocus: 0, dose: null,                                                              // dose null = dose-to-size at best focus
  blur: 12, cdTolerance: 0.1, el: 0.05, safeMargin: 0.1,
};
export const SRAF_LIMITS = {
  wavelength: [157, 365], na: [0.5, 0.95], sigmaIn: [0, 0.9], sigmaOut: [0.1, 1], cd: [60, 160],
  bars: [0, 3], barWidth: [10, 80], barSpace: [40, 250], barPitch: [100, 300], defocus: [-400, 400], dose: [1.2, 6],
};
export const SRAF_NUMERICS = { field: 4096, grid: 1024, sourcePoints: 601, focusStep: 10, focusMax: 400, doseCenters: 600, mainSearch: 400 };
export const SRAF_DESIGNS = {
  none: { bars: 0 }, recommended: { bars: 2, barWidth: 30, barSpace: 110, barPitch: 200 }, oversized: { bars: 2, barWidth: 60, barSpace: 110, barPitch: 200 },
};

const clampTo = (v, [a, b]) => Math.min(b, Math.max(a, v));
export function srafNormalize(p = {}) {
  const o = { ...SRAF_DEFAULTS, ...p }, n = (k) => clampTo(Number.isFinite(Number(o[k])) ? Number(o[k]) : SRAF_DEFAULTS[k], SRAF_LIMITS[k]);
  const ill = ['conventional', 'annular', 'dipole'].includes(o.illumination) ? o.illumination : 'annular';
  const sOut = n('sigmaOut'), sIn = Math.min(n('sigmaIn'), sOut - 0.05);
  return {
    wavelength: n('wavelength'), na: n('na'), illumination: ill, sigmaIn: Math.max(0, sIn), sigmaOut: sOut, cd: n('cd'),
    bars: Math.round(n('bars')), barWidth: n('barWidth'), barSpace: n('barSpace'), barPitch: Math.max(n('barPitch'), n('barWidth') + 20),
    defocus: n('defocus'), dose: o.dose == null || o.dose === '' || o.dose === 'auto' ? null : n('dose'),
    blur: SRAF_DEFAULTS.blur, cdTolerance: SRAF_DEFAULTS.cdTolerance, el: SRAF_DEFAULTS.el, safeMargin: SRAF_DEFAULTS.safeMargin,
  };
}

// ---- geometry ---------------------------------------------------------------------------------------
// chrome intervals [x0, x1]: main line centred at 0, `bars` assist bars per side
export function srafMask(p) {
  const main = [[-p.cd / 2, p.cd / 2]], bars = [];
  for (let j = 0; j < p.bars; j++) { const c = p.cd / 2 + p.barSpace + p.barWidth / 2 + j * p.barPitch; bars.push([c - p.barWidth / 2, c + p.barWidth / 2], [-c - p.barWidth / 2, -c + p.barWidth / 2]); }
  return { main, bars, all: [...main, ...bars] };
}
// dense reference: lines of width cd at the given pitch (2n + 1 lines), centre line at 0
export function srafDenseMask(cd, pitch, n = 6) { const all = []; for (let i = -n; i <= n; i++) all.push([i * pitch - cd / 2, i * pitch + cd / 2]); return { main: [[-cd / 2, cd / 2]], bars: [], all, dense: true, pitch }; }

// ---- FFT ---------------------------------------------------------------------------------------------
function fft(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < h; k++) { const p = i + k, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}

// ---- illumination --------------------------------------------------------------------------------------
// source directions in units of NA, equal weights: a Vogel spiral (equal-area) inside the chosen shape, made point
// symmetric (every direction s is paired with -s, as in a real annular or dipole source). The pairing is what makes
// defocus exactly symmetric, I(x, z) = I(x, -z), for an aberration-free lens and a symmetric mask.
export function srafSource(p, n = SRAF_NUMERICS.sourcePoints) {
  const g = Math.PI * (3 - Math.sqrt(5)), half = Math.max(1, Math.ceil(n / 2)), pts = [];
  if (p.illumination === 'conventional') for (let k = 0; k < half; k++) { const r = p.sigmaOut * Math.sqrt((k + 0.5) / half), a = k * g; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
  else if (p.illumination === 'annular') { const a0 = p.sigmaIn ** 2, a1 = p.sigmaOut ** 2; for (let k = 0; k < half; k++) { const r = Math.sqrt(a0 + (a1 - a0) * (k + 0.5) / half), a = k * g; pts.push([r * Math.cos(a), r * Math.sin(a)]); } }
  else { const c = (p.sigmaIn + p.sigmaOut) / 2, rr = Math.max(0.02, (p.sigmaOut - p.sigmaIn) / 2); for (let k = 0; k < half; k++) { const r = rr * Math.sqrt((k + 0.5) / half), a = k * g; pts.push([c + r * Math.cos(a), r * Math.sin(a)]); } }
  const all = n <= 1 ? pts : [...pts, ...pts.map(([x, y]) => [-x, -y])];
  return all.map(q => ({ sx: q[0], sy: q[1], w: 1 / all.length }));
}

// ---- imaging ---------------------------------------------------------------------------------------
// mask Fourier coefficient k on the periodic field (origin at the centre)
export function srafCoef(chrome, k, L) {
  let re = k === 0 ? 1 : 0, im = 0;
  for (const [a, b] of chrome) { if (k === 0) { re -= (b - a) / L; continue; } const w = 2 * Math.PI * k / L; re -= (Math.sin(w * b) - Math.sin(w * a)) / (w * L); im -= (Math.cos(w * b) - Math.cos(w * a)) / (w * L); }
  return [re, im];
}
// Mask spectrum |M(f)|^2 for the continuous (non-periodic) object, f in cycles / nm: for the diffraction plot.
export function srafSpectrum(chrome, f) {
  if (Math.abs(f) < 1e-12) return chrome.reduce((s, [a, b]) => s + (b - a), 0) ** 2;
  let re = 0, im = 0; const w = 2 * Math.PI * f;
  for (const [a, b] of chrome) { re += (Math.sin(w * b) - Math.sin(w * a)) / w; im += (Math.cos(w * b) - Math.cos(w * a)) / w; }
  return re * re + im * im;
}
// Aerial image (blur 0) or resist-model intensity at defocus z (nm). Returns samples on N points over [-L/2, L/2).
export function srafImage(chrome, params, z = 0, opts = {}) {
  const p = { ...SRAF_DEFAULTS, ...params }, L = opts.field ?? SRAF_NUMERICS.field, N = opts.grid ?? SRAF_NUMERICS.grid, blur = opts.blur ?? p.blur;
  const fc = p.na / p.wavelength, K = Math.ceil(fc * 2 * L) + 2, kl = 1 / p.wavelength;
  const C = []; for (let k = -K; k <= K; k++) C.push(srafCoef(chrome, k, L));
  const I = new Float64Array(N), re = new Float64Array(N), im = new Float64Array(N);
  for (const s of srafSource(p, opts.sourcePoints ?? SRAF_NUMERICS.sourcePoints)) {
    re.fill(0); im.fill(0);
    for (let k = -K; k <= K; k++) {
      const fx = k / L + s.sx * fc, fy = s.sy * fc, f2 = fx * fx + fy * fy;
      if (f2 > fc * fc) continue;
      // exact scalar defocus: phase of a plane wave with transverse frequency f after propagating z (in air, n = 1)
      const ph = 2 * Math.PI * z * (Math.sqrt(kl * kl - f2) - kl), cz = Math.cos(ph), sz = Math.sin(ph), [cr, ci] = C[k + K], sg = k & 1 ? -1 : 1;
      const q = (k + N) % N; re[q] = sg * (cr * cz - ci * sz); im[q] = sg * (cr * sz + ci * cz);
    }
    fft(re, im, true);
    for (let q = 0; q < N; q++) I[q] += s.w * (re[q] * re[q] + im[q] * im[q]);
  }
  if (blur > 0) {
    const r2 = Float64Array.from(I), i2 = new Float64Array(N); fft(r2, i2, false);
    for (let k = 0; k < N; k++) { const kk = (k < N / 2 ? k : k - N) / L, g = Math.exp(-2 * Math.PI * Math.PI * blur * blur * kk * kk) / N; r2[k] *= g; i2[k] *= g; }
    fft(r2, i2, true); for (let q = 0; q < N; q++) I[q] = r2[q];
  }
  return { I, L, N, dx: L / N, z };
}
export function srafAt(img, x) { const u = (x + img.L / 2) / img.dx, i = Math.floor(u), f = u - i, g = (j) => img.I[((j % img.N) + img.N) % img.N]; return g(i) * (1 - f) + g(i + 1) * f; }

// ---- printing ------------------------------------------------------------------------------------------
// Printed intervals (Ir < t) over the whole field, with sub-sample edges. The main feature is the one containing 0.
export function srafPrinted(img, t) {
  const out = []; let start = null;
  const edge = (i) => { const a = img.I[i] - t, b = img.I[(i + 1) % img.N] - t; return -img.L / 2 + (i + a / (a - b)) * img.dx; };
  for (let i = 0; i < img.N; i++) {
    const inside = img.I[i] < t, next = img.I[(i + 1) % img.N] < t;
    if (!inside && next) start = edge(i);
    if (inside && !next && start != null) { out.push([start, edge(i)]); start = null; }
  }
  return out;
}
// Main-line CD at threshold t (bisection on each edge to 1e-4 nm); 0 if the line does not print.
export function srafCd(img, t, search = SRAF_NUMERICS.mainSearch) {
  if (srafAt(img, 0) >= t) return 0;
  const edge = (dir) => {
    let x = 0, step = img.dx;
    while (Math.abs(x) < search) { const nx = x + dir * step; if (srafAt(img, nx) >= t) { let a = x, b = nx; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (srafAt(img, m) >= t) b = m; else a = m; } return (a + b) / 2; } x = nx; }
    return dir * search;
  };
  return edge(1) - edge(-1);
}
// threshold giving a main-line CD (CD rises with t: a higher threshold, i.e. a lower dose, leaves more resist)
export function srafThresholdForCd(img, cd) { let lo = 1e-4, hi = 0.999; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (srafCd(img, m) > cd) hi = m; else lo = m; } return (lo + hi) / 2; }
// Unwanted printing: the largest threshold (lowest dose) at which nothing but the main line prints. Any printed
// interval that does not contain x = 0 counts: assist bars and side lobes alike. Returns { t, x } (where it starts).
export function srafPrintOnset(img, mainHalf) {
  // minimum of Ir outside the main feature region, where the main region is the connected dark zone around 0 at
  // threshold t; the onset threshold is the smallest local minimum that lies outside the main dark zone
  let best = { t: Infinity, x: null };
  for (let i = 1; i < img.N - 1; i++) {
    const v = img.I[i]; if (!(v <= img.I[i - 1] && v <= img.I[i + 1])) continue;
    const x = -img.L / 2 + i * img.dx; if (Math.abs(x) <= mainHalf) continue;
    // is this minimum separated from the main line at threshold v (a bright point between them above v)?
    let sep = false; const dir = x > 0 ? -1 : 1; for (let j = i; Math.abs(-img.L / 2 + j * img.dx) > 0.5; j += dir) if (img.I[j] > v + 1e-9) { sep = true; break; }
    if (sep && v < best.t) best = { t: v, x };
  }
  return best;
}
// NILS = w * |d ln I / dx| at the target edge x = cd / 2. Computed on the AERIAL image (blur 0) by default;
// pass the resist-model image to get the blurred value.
export function srafNils(img, cd) { const x = cd / 2, h = img.dx / 4, d = (srafAt(img, x + h) - srafAt(img, x - h)) / (2 * h); return cd * Math.abs(d) / srafAt(img, x); }

// ---- focus-exposure analysis ---------------------------------------------------------------------------
// For each focus sample: the CD-only dose window [Elo, Ehi] (CD within tolerance), the dose floor below which
// something other than the main line prints (Eprint = 1 / t_onset), and the safe floor (margin).
export function srafFocusScan(mask, p, opts = {}) {
  const zmax = opts.focusMax ?? SRAF_NUMERICS.focusMax, dz = opts.focusStep ?? SRAF_NUMERICS.focusStep, rows = [];
  for (let z = -zmax; z <= zmax + 1e-9; z += dz) {
    const img = srafImage(mask.all, p, z, opts);
    const tLo = srafThresholdForCd(img, (1 - p.cdTolerance) * p.cd), tHi = srafThresholdForCd(img, (1 + p.cdTolerance) * p.cd);
    // the window exists only if the line really reaches both CD limits at this focus
    const okLo = Math.abs(srafCd(img, tLo) - (1 - p.cdTolerance) * p.cd) < 0.05, okHi = Math.abs(srafCd(img, tHi) - (1 + p.cdTolerance) * p.cd) < 0.05;
    const onset = mask.dense ? { t: Infinity, x: null } : srafPrintOnset(img, (1 + p.cdTolerance) * p.cd / 2 + 2);   // dense: neighbours are intended
    rows.push({ z, ok: okLo && okHi, Elo: 1 / tHi, Ehi: 1 / tLo, Eprint: Number.isFinite(onset.t) ? 1 / onset.t : 0, onsetX: onset.x, onsetT: onset.t,
      Esafe: Number.isFinite(onset.t) ? (1 + p.safeMargin) / onset.t : 0 });
  }
  return rows;
}
// Longest focus range over which one dose interval with EL >= el fits inside [lo(z), hi(z)] at every focus.
// Dose centres are scanned (doseCenters); window edges are interpolated linearly between focus samples.
export function srafDof(rows, floorKey, el, opts = {}) {
  const ok = rows.filter(r => r.ok); if (!ok.length) return { dof: 0 };
  const lo = (r) => Math.max(r.Elo, floorKey ? r[floorKey] : 0), hi = (r) => r.Ehi;
  const Emin = Math.min(...ok.map(lo)), Emax = Math.max(...ok.map(hi)), n = opts.doseCenters ?? SRAF_NUMERICS.doseCenters;
  let best = { dof: 0 };
  const evalAt = (c) => {
    const h = el * c / 2;                                                   // interval [c - h, c + h]: (2h) / c = el
    // two constraints per focus: room under the upper dose edge (u) and above the lower edge (l)
    const u = rows.map(r => (r.ok ? hi(r) - (c + h) : -1)), l = rows.map(r => (r.ok ? (c - h) - lo(r) : -1));
    const inside = (k) => u[k] >= 0 && l[k] >= 0;
    // where between an inside sample a and an outside sample b the window is left: interpolate each violated
    // constraint on its own and keep the nearer crossing (interpolating their minimum would bias the edge)
    const cross = (a, b) => {
      let t = 1;
      for (const g of [u, l]) if (g[b] < 0 && rows[b].ok && g[a] >= 0) t = Math.min(t, g[a] / (g[a] - g[b]));
      if (!rows[b].ok) t = 0;
      return rows[a].z + (rows[b].z - rows[a].z) * t;
    };
    let i = 0;
    while (i < rows.length) {
      if (!inside(i)) { i++; continue; }
      let j = i; while (j + 1 < rows.length && inside(j + 1)) j++;
      const zl = i > 0 ? cross(i, i - 1) : rows[i].z, zr = j < rows.length - 1 ? cross(j, j + 1) : rows[j].z;
      if (zr - zl > best.dof) best = { dof: zr - zl, z0: zl, z1: zr, e0: c - h, e1: c + h };
      i = j + 1;
    }
  };
  // coarse scan of the dose centre, then a fine scan around the best one (the optimum usually sits where the
  // interval just touches a window edge, so a coarse grid alone under-reads the DOF)
  const step = (Emax - Emin) / n;
  for (let k = 0; k <= n; k++) evalAt(Emin + step * k);
  if (best.dof > 0) { const c0 = (best.e0 + best.e1) / 2; for (let k = -200; k <= 200; k++) evalAt(c0 + step * k / 100); }
  return best;
}
// Everything for one design: dose-to-size at best focus, NILS (aerial and resist), the three windows and DOFs,
// the state at the chosen focus and dose, and the assist-feature verdict over the accepted (defect-free) window.
export function srafAnalyze(params = {}, opts = {}) {
  const p = srafNormalize(params), mask = opts.mask || srafMask(p);
  const img0 = srafImage(mask.all, p, 0, opts), t0 = srafThresholdForCd(img0, p.cd), E0 = 1 / t0;
  const aerial0 = srafImage(mask.all, p, 0, { ...opts, blur: 0 });
  const rows = srafFocusScan(mask, p, opts);
  const cdOnly = srafDof(rows, null, p.el, opts), defectFree = srafDof(rows, 'Eprint', p.el, opts), safe = srafDof(rows, 'Esafe', p.el, opts);
  const row0 = rows.reduce((a, r) => (Math.abs(r.z) < Math.abs(a.z) ? r : a));
  // assist margin over the CD-only window and over the accepted rectangle: lowest (1 / E) / t_onset - 1
  const marginIn = (rect) => { if (!rect || !rect.dof) return null; let m = Infinity; for (const r of rows) { if (r.z < rect.z0 - 1e-9 || r.z > rect.z1 + 1e-9 || !Number.isFinite(r.onsetT)) continue; m = Math.min(m, r.onsetT * rect.e0 - 1); } return Number.isFinite(m) ? m : null; };
  const dose = p.dose ?? E0, imgZ = p.defocus === 0 ? img0 : srafImage(mask.all, p, p.defocus, opts), tz = 1 / dose;
  const printed = srafPrinted(imgZ, tz), mainIdx = printed.findIndex(([a, b]) => a <= 0 && b >= 0), cdZ = srafCd(imgZ, tz);
  const marginCdWindow = marginIn(cdOnly), marginAccepted = marginIn(safe.dof ? safe : defectFree);
  // 'none': no assists; 'nowindow': assists, but no CD window to judge their printability in
  const verdict = !mask.bars.length ? 'none' : marginCdWindow == null ? 'nowindow' : marginCdWindow >= p.safeMargin ? 'safe' : marginCdWindow >= 0 ? 'marginal' : 'prints';
  return {
    params: p, mask, t0, E0, rows,
    nilsAerial: srafNils(aerial0, p.cd), nilsResist: srafNils(img0, p.cd), elBestFocus: (row0.Ehi - row0.Elo) / ((row0.Ehi + row0.Elo) / 2),
    windows: { cdOnly, defectFree, safe }, verdict, marginCdWindow, marginAccepted,
    atFocus: { z: p.defocus, dose, img: imgZ, printed, unwanted: printed.filter((_, i) => i !== mainIdx), cd: cdZ, epe: cdZ ? (cdZ - p.cd) / 2 : null },
  };
}

// State at one focus and dose (fast: one image). Used for interactive defocus and dose changes.
export function srafStateAt(mask, params, z, dose, opts = {}) {
  const p = { ...SRAF_DEFAULTS, ...params }, img = srafImage(mask.all, p, z, opts), t = 1 / dose;
  const printed = srafPrinted(img, t), mi = printed.findIndex(([a, b]) => a <= 0 && b >= 0), cd = srafCd(img, t);
  return { img, t, printed, main: mi >= 0 ? printed[mi] : null, unwanted: printed.filter((_, i) => i !== mi), cd, epe: cd ? (cd - p.cd) / 2 : null };
}
export const srafDesignKey = (p) => [p.wavelength, p.na, p.illumination, p.sigmaIn, p.sigmaOut, p.cd, p.bars, p.barWidth, p.barSpace, p.barPitch].join('|');
export const srafOpticsKey = (p) => [p.wavelength, p.na, p.illumination, p.sigmaIn, p.sigmaOut, p.cd].join('|');

