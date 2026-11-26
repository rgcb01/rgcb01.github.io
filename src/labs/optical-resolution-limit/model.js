// ---------------------------------------------------------------------------------------------
// The Optical Resolution Limit: pure physics model (no drawing, no DOM).
//
// Scalar, thin-mask, aberration-free partially coherent imaging of a 1D binary line/space grating
// (Abbe source-point integration), plus the two-point Rayleigh criterion for incoherent point sources.
// Every number shown by the interactive lab and by the SimuLab explainer/video is computed here, so the
// web page and the video cannot disagree. All lengths are wafer-side nanometres (projection reduction
// such as 4x does not change wafer-side results). Pupil coordinates are direction sines f = n sin(theta),
// so the pupil is a disk of radius NA and diffraction order m of pitch p is displaced by m * lambda / p.
//
// This file must stay a plain ES module with only `export const` / `export function` at top level:
// scripts/labs/sync-simulab-model.mjs wraps it into a classic script for the SimuLab bundle.
// ---------------------------------------------------------------------------------------------

export const ORL_LIMITS = {
  wavelength: [10, 450],   // nm
  na: [0.1, 1.35],         // 1.35: practical ceiling of water-immersion ArF (n_water ~ 1.44 at 193 nm; Lin 2004)
  pitch: [10, 1000],       // nm
  sigma: [0, 1],
};

// Typical public values. Illustrative, not the specification of any particular tool.
export const ORL_PRESETS = [
  { id: 'i-line', label: 'i-line', wavelength: 365, na: 0.65, note: 'Mercury lamp i-line, dry lens' },
  { id: 'krf', label: 'KrF', wavelength: 248, na: 0.8, note: 'KrF excimer laser, dry lens' },
  { id: 'arf-dry', label: 'ArF dry', wavelength: 193, na: 0.93, note: 'ArF excimer laser, dry lens' },
  { id: 'arf-immersion', label: 'ArF immersion', wavelength: 193, na: 1.35, note: 'ArF with water between lens and wafer' },
  { id: 'euv', label: 'EUV', wavelength: 13.5, na: 0.33, note: 'Extreme ultraviolet, reflective optics' },
  { id: 'high-na-euv', label: 'High-NA EUV', wavelength: 13.5, na: 0.55, note: 'Extreme ultraviolet, 0.55 NA optics' },
];

export const ORL_ILLUMINATIONS = [
  { id: 'coherent', label: 'Coherent', hint: 'A single on-axis plane wave (sigma = 0).' },
  { id: 'conventional', label: 'Conventional', hint: 'A filled disk of source directions with radius sigma x NA.' },
  { id: 'annular', label: 'Annular', hint: 'A ring of source directions between 0.7 sigma and sigma.' },
  { id: 'dipole', label: 'Dipole', hint: 'Two poles on the x axis centred at +/- sigma, radius 0.1 (off-axis illumination).' },
];

export const ORL_DEFAULTS = { wavelength: 193, na: 1.35, pitch: 120, illumination: 'conventional', sigma: 0.6, duty: 0.5 };

// Printability bands for the aerial image contrast. Heuristic thresholds for teaching, not resist data.
export const ORL_BANDS = [
  { min: 0.5, id: 'strong', label: 'Strong image', tone: 'good' },
  { min: 0.2, id: 'weak', label: 'Weak image', tone: 'warn' },
  { min: 0.005, id: 'faint', label: 'Too faint to print', tone: 'bad' },
  { min: -1, id: 'none', label: 'No image: only the 0th order passes', tone: 'bad' },
];

const clampTo = (v, [a, b]) => Math.min(b, Math.max(a, v));

export function orlNormalize(params = {}) {
  const p = { ...ORL_DEFAULTS, ...params };
  return {
    wavelength: clampTo(Number(p.wavelength) || ORL_DEFAULTS.wavelength, ORL_LIMITS.wavelength),
    na: clampTo(Number(p.na) || ORL_DEFAULTS.na, ORL_LIMITS.na),
    pitch: clampTo(Number(p.pitch) || ORL_DEFAULTS.pitch, ORL_LIMITS.pitch),
    illumination: ORL_ILLUMINATIONS.some(i => i.id === p.illumination) ? p.illumination : ORL_DEFAULTS.illumination,
    sigma: clampTo(Number.isFinite(Number(p.sigma)) ? Number(p.sigma) : ORL_DEFAULTS.sigma, ORL_LIMITS.sigma),
    duty: clampTo(Number(p.duty) || 0.5, [0.05, 0.95]),
  };
}

// Fourier coefficient of order m for a binary amplitude mask: clear (transmission 1) for a fraction
// `duty` of each period, opaque chrome elsewhere, clear space centred at x = 0.
export function orlOrderAmplitude(m, duty = 0.5) {
  if (m === 0) return duty;
  return Math.sin(Math.PI * m * duty) / (Math.PI * m);
}

// Direction sine of order m relative to the incident direction.
export const orlOrderShift = (m, wavelength, pitch) => (m * wavelength) / pitch;

// Source points in units of NA (u, v), each with a weight; the weights sum to 1.
export function orlSourcePoints(illumination, sigma, n = 31) {
  if (illumination === 'coherent' || sigma <= 1e-6) return [{ u: 0, v: 0, w: 1 }];
  const inside = (u, v) => {
    const r = Math.hypot(u, v);
    if (illumination === 'conventional') return r <= sigma;
    if (illumination === 'annular') return r <= sigma && r >= 0.7 * sigma;
    if (illumination === 'dipole') return Math.hypot(Math.abs(u) - sigma, v) <= 0.1;
    return false;
  };
  const pts = [];
  const extent = illumination === 'dipole' ? Math.min(1.2, sigma + 0.1) : sigma;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u = -extent + (2 * extent * (i + 0.5)) / n, v = -extent + (2 * extent * (j + 0.5)) / n;
    if (inside(u, v)) pts.push({ u, v, w: 1 });
  }
  if (!pts.length) return [{ u: illumination === 'dipole' ? sigma : 0, v: 0, w: 1 }];
  const total = pts.length;
  for (const q of pts) q.w = 1 / total;
  return pts;
}

// Orders that can possibly reach the pupil for any source point.
function orlOrderRange(p) {
  const reach = p.na * (1 + Math.max(p.sigma, p.illumination === 'dipole' ? p.sigma + 0.1 : 0));
  return Math.min(60, Math.ceil((reach * p.pitch) / p.wavelength) + 1);
}

// Aerial image over `periods` periods (x from -periods * p / 2 to +periods * p / 2).
// Abbe: I(x) = sum_s w_s | sum_m c_m P(f_s + m lambda / p) exp(i 2 pi m x / p) |^2, P = 1 inside |f| <= NA.
// Source points that let the same set of orders through are grouped and evaluated once.
export function orlAerialImage(params, { samples = 241, periods = 2, sourceGrid = 31 } = {}) {
  const p = orlNormalize(params);
  const M = orlOrderRange(p);
  const src = orlSourcePoints(p.illumination, p.sigma, sourceGrid);
  const groups = new Map();
  for (const s of src) {
    const fx = s.u * p.na, fy = s.v * p.na, pass = [];
    for (let m = -M; m <= M; m++) {
      const gx = fx + orlOrderShift(m, p.wavelength, p.pitch);
      if (gx * gx + fy * fy <= p.na * p.na + 1e-12) pass.push(m);
    }
    const key = pass.join(',');
    const g = groups.get(key);
    if (g) g.w += s.w; else groups.set(key, { orders: pass, w: s.w });
  }
  const xs = [], I = new Float64Array(samples);
  for (let k = 0; k < samples; k++) xs.push(-periods * p.pitch / 2 + (periods * p.pitch * k) / (samples - 1));
  for (const { orders, w } of groups.values()) {
    if (!orders.length) continue;
    const amps = orders.map(m => orlOrderAmplitude(m, p.duty));
    for (let k = 0; k < samples; k++) {
      let re = 0, im = 0;
      const ph = (2 * Math.PI * xs[k]) / p.pitch;
      for (let j = 0; j < orders.length; j++) { re += amps[j] * Math.cos(orders[j] * ph); im += amps[j] * Math.sin(orders[j] * ph); }
      I[k] += w * (re * re + im * im);
    }
  }
  return { x: xs, intensity: Array.from(I), groups: [...groups.values()], maxOrder: M, params: p };
}

// Intensity at a single position x (nm), same model; used for slopes and for the SimuLab panels.
export function orlIntensityAt(params, x, sourceGrid = 31) {
  const r = orlAerialImage(params, { samples: 3, periods: 0, sourceGrid });
  let I = 0;
  for (const { orders, w } of r.groups) {
    let re = 0, im = 0;
    const ph = (2 * Math.PI * x) / r.params.pitch;
    for (const m of orders) { const a = orlOrderAmplitude(m, r.params.duty); re += a * Math.cos(m * ph); im += a * Math.sin(m * ph); }
    I += w * (re * re + im * im);
  }
  return I;
}

// Orders captured for the central (on-axis) source direction and for the whole source.
export function orlCapturedOrders(params) {
  const p = orlNormalize(params);
  const M = orlOrderRange(p);
  const onAxis = [], anySource = new Set();
  for (let m = -M; m <= M; m++) if (Math.abs(orlOrderShift(m, p.wavelength, p.pitch)) <= p.na + 1e-12) onAxis.push(m);
  for (const s of orlSourcePoints(p.illumination, p.sigma, 31)) {
    for (let m = -M; m <= M; m++) {
      const gx = s.u * p.na + orlOrderShift(m, p.wavelength, p.pitch), gy = s.v * p.na;
      if (gx * gx + gy * gy <= p.na * p.na + 1e-12) anySource.add(m);
    }
  }
  return { onAxis, anySource: [...anySource].sort((a, b) => a - b) };
}

// Resolution limits for a line/space grating (full pitch) and the two-point Rayleigh distance.
export function orlLimits(params) {
  const p = orlNormalize(params);
  const outer = p.illumination === 'coherent' ? 0 : p.illumination === 'dipole' ? Math.min(1, p.sigma + 0.1) : p.sigma;
  return {
    coherentPitch: p.wavelength / p.na,                 // on-axis: +/-1 orders need lambda / p <= NA
    currentPitch: p.wavelength / (p.na * (1 + outer)),  // most oblique source point bends one order back in
    absolutePitch: p.wavelength / (2 * p.na),           // two-beam imaging, k1 = 0.25: no illumination beats this
    rayleigh: (0.61 * p.wavelength) / p.na,             // two incoherent points, first zero of the Airy pattern
    k1: (p.pitch / 2) * (p.na / p.wavelength),          // half-pitch k1 factor
  };
}

// Contrast, NILS and verdict for the current settings.
export function orlAnalyze(params, opts = {}) {
  const img = orlAerialImage(params, opts);
  const p = img.params, I = img.intensity;
  let max = -Infinity, min = Infinity;
  for (const v of I) { if (v > max) max = v; if (v < min) min = v; }
  const contrast = max + min > 1e-12 ? (max - min) / (max + min) : 0;
  // NILS at the nominal feature edge (clear space of width duty * p centred at 0): w * |dI/dx| / I
  const xe = (p.duty * p.pitch) / 2, h = p.pitch * 1e-3;
  const Ie = orlIntensityAt(p, xe), dI = (orlIntensityAt(p, xe + h) - orlIntensityAt(p, xe - h)) / (2 * h);
  const width = Math.min(p.duty, 1 - p.duty) * p.pitch;
  const nils = Ie > 1e-9 ? (width * Math.abs(dI)) / Ie : 0;
  const captured = orlCapturedOrders(p);
  const firstOrders = captured.anySource.some(m => m !== 0);
  const c = firstOrders ? contrast : 0;
  const band = ORL_BANDS.find(b => c >= b.min && (b.id !== 'none' || !firstOrders)) || ORL_BANDS[ORL_BANDS.length - 1];
  return { ...img, max, min, contrast: c, nils: firstOrders ? nils : 0, edgeIntensity: Ie, captured, limits: orlLimits(p), band: firstOrders ? band : ORL_BANDS[ORL_BANDS.length - 1] };
}

// ---- two-point (Rayleigh) resolution for incoherent point images ------------------------------------
// Bessel J1, rational approximations (Numerical Recipes, bessj1), |error| < 1e-7 over the range used here.
export function orlBesselJ1(x) {
  const ax = Math.abs(x);
  if (ax < 8) {
    const y = x * x;
    const a = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.4826 + y * -30.16036606)))));
    const b = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))));
    return a / b;
  }
  const z = 8 / ax, y = z * z, xx = ax - 2.356194491;
  const a = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * -0.240337019e-6)));
  const b = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * a - z * Math.sin(xx) * b);
  return x < 0 ? -ans : ans;
}

// Airy intensity of a point image at radius r (nm): [2 J1(v) / v]^2 with v = 2 pi NA r / lambda.
export function orlAiry(r, wavelength, na) {
  const v = (2 * Math.PI * na * r) / wavelength;
  if (Math.abs(v) < 1e-6) return 1;
  const a = (2 * orlBesselJ1(v)) / v;
  return a * a;
}

// Profile through two incoherent point images separated by `separation` nm.
export function orlTwoPoint(params, separation, { samples = 241 } = {}) {
  const p = orlNormalize(params);
  const span = Math.max(separation * 1.6, (1.4 * p.wavelength) / p.na);
  const x = [], I = [];
  for (let k = 0; k < samples; k++) {
    const xx = -span + (2 * span * k) / (samples - 1);
    x.push(xx);
    I.push(orlAiry(xx - separation / 2, p.wavelength, p.na) + orlAiry(xx + separation / 2, p.wavelength, p.na));
  }
  const peak = Math.max(...I), centre = orlAiry(separation / 2, p.wavelength, p.na) * 2;
  return { x, intensity: I, peak, centre, dip: peak > 0 ? 1 - centre / peak : 0, rayleigh: (0.61 * p.wavelength) / p.na };
}

// Guided story shared by the web lab ("Guided tour" buttons) and the SimuLab explainer/video.
// Each chapter is one state of the model; the text only describes what the model computes for it.
export const ORL_CHAPTERS = [
  { id: 'resolved', short: 'Resolved', params: { wavelength: 193, na: 0.93, pitch: 300, illumination: 'coherent', sigma: 0 },
    tip: ['300 nm pitch: the ±1 orders', 'fit inside NA 0.93. Lines print.'] },
  { id: 'too-fine', short: 'Too fine', params: { wavelength: 193, na: 0.93, pitch: 180, illumination: 'coherent', sigma: 0 },
    tip: ['180 nm: λ/p = 1.07 > NA.', 'Only the 0th order passes. Flat light.'] },
  { id: 'immersion', short: 'Add water', params: { wavelength: 193, na: 1.35, pitch: 180, illumination: 'coherent', sigma: 0 },
    tip: ['Water lifts NA to 1.35.', 'The ±1 orders are back inside.'] },
  { id: 'shrink-again', short: 'Shrink again', params: { wavelength: 193, na: 1.35, pitch: 120, illumination: 'coherent', sigma: 0 },
    tip: ['120 nm: λ/p = 1.61 > 1.35.', 'Lost again with straight-on light.'] },
  { id: 'off-axis', short: 'Tilt the light', params: { wavelength: 193, na: 1.35, pitch: 120, illumination: 'dipole', sigma: 0.6 },
    tip: ['Dipole light: 0th order at one edge,', 'one 1st order at the other. Two beams.'] },
  { id: 'the-wall', short: 'The wall', params: { wavelength: 193, na: 1.35, pitch: 70, illumination: 'dipole', sigma: 0.9 },
    tip: ['70 nm < λ/(2NA) = 71.5 nm.', 'No illumination can bring it back.'] },
];
