// ---------------------------------------------------------------------------------------------
// Why We Intentionally Distort Photomasks: optical proximity correction (OPC) model. Pure functions only.
//
// Optics: scalar Abbe imaging of a thin binary mask, conventional (disk) illumination, aberration-free and in focus.
//   The mask is bright field: clear glass (transmission 1) carrying opaque chrome features (transmission 0).
//   Its Fourier coefficients are computed analytically from rectangles, so any edge position (not just grid
//   positions) is represented exactly.
// Resist: positive tone with a constant threshold after Gaussian blur. Light above the threshold clears the
//   resist, so the printed feature (resist that remains) is where the blurred aerial image is BELOW the threshold.
// Metrics: edge placement error (EPE) at evaluation sites on the target edges, line-end shortening, corner
//   rounding and CD. All lengths are wafer-side nanometres; intensity is relative to a fully clear mask.
//
// Every number shown by the web lab, the SimuLab explainer, the videos and the cards comes from this file.
// Keep only top-level `export const` / `export function` and no imports (it is wrapped for SimuLab).
// ---------------------------------------------------------------------------------------------

export const OPC_DEFAULTS = {
  wavelength: 193, na: 0.93, sigma: 0.5,       // dry ArF, conventional illumination (typical public values)
  cd: 100, space: 100,                         // target line width and dense spacing, nm
  threshold: null,                             // null = dose-to-size: dense line printed at target CD
  blur: 12,                                    // resist diffusion length (Gaussian sigma), nm. Assumption.
  mode: 'model', strength: 1,                  // corrected mask: model-based OPC scaled by strength, or 'rules'
  bias: 0, serif: 0, hammerOverhang: 0, hammerLength: 0, hammerExtension: 0,
};
export const OPC_LIMITS = {
  wavelength: [157, 365], na: [0.5, 0.95], cd: [70, 180], space: [70, 300], threshold: [0.1, 0.6],
  strength: [0, 1], bias: [-15, 25], serif: [0, 80], hammerOverhang: [0, 40], hammerLength: [0, 90], hammerExtension: [0, 60],
};
export const OPC_FIELD = { lx: 4096, ly: 2048, lineLength: 700, isoGap: 400, elbowGap: 400, armLength: 300 };
// sourcePoints: illumination sampling; opcIterations/opcGain: feedback loop; evalStep: spacing of evaluation
// sites; cornerZone: evaluation sites skip this fraction of CD around vertices; cornerFrag: corner fragment length
// (fraction of CD); controlZone: corner-fragment control points sit this fraction of CD from the vertex.
// Values chosen by the convergence and trade-off studies in scripts/labs/check-opc-model.mjs and docs/LABS.md.
export const OPC_NUMERICS = { sourcePoints: 97, opcIterations: 16, opcGain: 0.5, evalStep: 10, cornerZone: 0.4, cornerFrag: 0.35, controlZone: 0.2, epeTolerance: 5 };

const clampTo = (v, [a, b]) => Math.min(b, Math.max(a, v));
export function opcNormalize(p = {}) {
  const o = { ...OPC_DEFAULTS, ...p }, L = OPC_LIMITS, n = (k) => clampTo(Number.isFinite(Number(o[k])) ? Number(o[k]) : OPC_DEFAULTS[k], L[k]);
  return {
    wavelength: n('wavelength'), na: n('na'), sigma: OPC_DEFAULTS.sigma, cd: n('cd'), space: n('space'), blur: OPC_DEFAULTS.blur,
    threshold: o.threshold == null || o.threshold === '' || o.threshold === 'auto' ? null : n('threshold'),
    mode: o.mode === 'rules' ? 'rules' : 'model', strength: n('strength'),
    bias: n('bias'), serif: n('serif'), hammerOverhang: n('hammerOverhang'), hammerLength: n('hammerLength'), hammerExtension: n('hammerExtension'),
  };
}

// ---- layout ---------------------------------------------------------------------------------------
// Three dense lines, one isolated line and an L-shaped elbow, all with the target width cd. Rectilinear
// polygons, counter-clockwise, y up, centred in the field.
export function opcLayout(cd = 100, space = 100) {
  const F = OPC_FIELD, h = F.lineLength / 2, pitch = cd + space;
  const width = 3 * cd + 2 * space + F.isoGap + cd + F.elbowGap + cd + F.armLength;
  const x0 = -width / 2, polys = [];
  const rect = (xa, ya, xb, yb, tag, id) => ({ tag, id, pts: [[xa, ya], [xb, ya], [xb, yb], [xa, yb]] });
  for (let k = 0; k < 3; k++) polys.push(rect(x0 + k * pitch, -h, x0 + k * pitch + cd, h, 'dense', `dense${k}`));
  const xi = x0 + 3 * cd + 2 * space + F.isoGap;
  polys.push(rect(xi, -h, xi + cd, h, 'iso', 'iso'));
  const xe = xi + cd + F.elbowGap, ytop = h - 150; // elbow: vertical arm, then an arm to the right at the top
  polys.push({ tag: 'elbow', id: 'elbow', pts: [[xe, -h], [xe + cd, -h], [xe + cd, ytop - cd], [xe + cd + F.armLength, ytop - cd], [xe + cd + F.armLength, ytop], [xe, ytop]] });
  return polys;
}
export function opcBounds(polys, pad = 0) {
  const xs = polys.flatMap(p => p.pts.map(q => q[0])), ys = polys.flatMap(p => p.pts.map(q => q[1]));
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
}

// rectilinear polygon -> horizontal slab rectangles [x0, y0, x1, y1]
export function opcPolyRects(pts) {
  const ys = [...new Set(pts.map(p => p[1]))].sort((a, b) => a - b), out = [];
  for (let j = 0; j < ys.length - 1; j++) {
    const yc = (ys[j] + ys[j + 1]) / 2, xs = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if (a[0] === b[0] && (a[1] - yc) * (b[1] - yc) < 0) xs.push(a[0]); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) out.push([xs[k], ys[j], xs[k + 1], ys[j + 1]]);
  }
  return out;
}
// union(add) minus union(sub) as disjoint rectangles (coordinate compression, merged into row runs)
export function opcRectBoolean(add, sub = []) {
  const ok = r => r[2] > r[0] + 1e-9 && r[3] > r[1] + 1e-9, A = add.filter(ok), S = sub.filter(ok);
  if (!A.length) return [];
  const xs = [...new Set([...A, ...S].flatMap(r => [r[0], r[2]]))].sort((a, b) => a - b);
  const ys = [...new Set([...A, ...S].flatMap(r => [r[1], r[3]]))].sort((a, b) => a - b), out = [];
  for (let j = 0; j < ys.length - 1; j++) {
    const yc = (ys[j] + ys[j + 1]) / 2, rowA = A.filter(r => yc > r[1] && yc < r[3]), rowS = S.filter(r => yc > r[1] && yc < r[3]);
    let run = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const xc = (xs[i] + xs[i + 1]) / 2, inR = r => xc > r[0] && xc < r[2];
      if (rowA.some(inR) && !rowS.some(inR)) { if (run) run[2] = xs[i + 1]; else run = [xs[i], ys[j], xs[i + 1], ys[j + 1]]; }
      else if (run) { out.push(run); run = null; }
    }
    if (run) out.push(run);
  }
  return out;
}
export const opcTargetMask = (polys) => opcRectBoolean(polys.flatMap(p => opcPolyRects(p.pts)));
// Boundary of a set of disjoint rectangles: every rectangle edge minus the parts shared with a touching
// neighbour. Returns segments [x0, y0, x1, y1] (for drawing masks without internal seams).
export function opcRectOutline(rects, eps = 1e-6) {
  const out = [], sub = (lo, hi, cuts) => {
    let parts = [[lo, hi]];
    for (const [a, b] of cuts) parts = parts.flatMap(([u, v]) => (b <= u + eps || a >= v - eps ? [[u, v]] : [[u, Math.max(u, a)], [Math.min(v, b), v]].filter(([x, y]) => y - x > eps)));
    return parts;
  };
  for (const r of rects) {
    const touch = (axis, at, side) => rects.filter(q => q !== r && Math.abs(q[side] - at) < eps).map(q => axis === 'x' ? [Math.max(r[0], q[0]), Math.min(r[2], q[2])] : [Math.max(r[1], q[1]), Math.min(r[3], q[3])]).filter(([a, b]) => b - a > eps);
    for (const [a, b] of sub(r[0], r[2], touch('x', r[1], 3))) out.push([a, r[1], b, r[1]]);   // bottom
    for (const [a, b] of sub(r[0], r[2], touch('x', r[3], 1))) out.push([a, r[3], b, r[3]]);   // top
    for (const [a, b] of sub(r[1], r[3], touch('y', r[0], 2))) out.push([r[0], a, r[0], b]);   // left
    for (const [a, b] of sub(r[1], r[3], touch('y', r[2], 0))) out.push([r[2], a, r[2], b]);   // right
  }
  return out;
}

// ---- FFT (radix 2), rectangular 2D -------------------------------------------------------------------
function fft1(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const p = i + k, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr;
        re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
function fft2(re, im, nx, ny, inv) {
  const rr = new Float64Array(Math.max(nx, ny)), ii = new Float64Array(Math.max(nx, ny));
  const rx = rr.subarray(0, nx), ix = ii.subarray(0, nx);
  for (let y = 0; y < ny; y++) { const o = y * nx; for (let x = 0; x < nx; x++) { rx[x] = re[o + x]; ix[x] = im[o + x]; } fft1(rx, ix, inv); for (let x = 0; x < nx; x++) { re[o + x] = rx[x]; im[o + x] = ix[x]; } }
  const ry = rr.subarray(0, ny), iy = ii.subarray(0, ny);
  for (let x = 0; x < nx; x++) { for (let y = 0; y < ny; y++) { ry[y] = re[y * nx + x]; iy[y] = im[y * nx + x]; } fft1(ry, iy, inv); for (let y = 0; y < ny; y++) { re[y * nx + x] = ry[y]; im[y * nx + x] = iy[y]; } }
}
const pow2 = (n) => 1 << Math.ceil(Math.log2(Math.max(2, n)));

// ---- illumination ---------------------------------------------------------------------------------
// Conventional disk of radius sigma (in units of NA), sampled with a Vogel (sunflower) spiral: n equal-weight,
// equal-area points, which converges smoothly as n grows (see the source-sampling study in the model checks).
export function opcSourcePoints(sigma, n = OPC_NUMERICS.sourcePoints) {
  if (sigma <= 0 || n <= 1) return [{ sx: 0, sy: 0, w: 1 }];
  const golden = Math.PI * (3 - Math.sqrt(5)), pts = [];
  for (let k = 0; k < n; k++) { const r = sigma * Math.sqrt((k + 0.5) / n), a = k * golden; pts.push({ sx: r * Math.cos(a), sy: r * Math.sin(a), w: 1 / n }); }
  return pts;
}

// ---- aerial image ---------------------------------------------------------------------------------
// (1/L) * integral_a^b exp(-i 2 pi k x / L) dx, as [re, im]
function rectFT1(a, b, k, L) {
  if (k === 0) return [(b - a) / L, 0];
  const w = 2 * Math.PI * k / L;
  return [(Math.sin(w * b) - Math.sin(w * a)) / (w * L), (Math.cos(w * b) - Math.cos(w * a)) / (w * L)];
}
// Mask Fourier coefficients for |kx| <= KX, |ky| <= KY. chrome: disjoint rectangles (from opcRectBoolean).
export function opcMaskSpectrum(chrome, KX, KY, lx = OPC_FIELD.lx, ly = OPC_FIELD.ly) {
  const nx = 2 * KX + 1, ny = 2 * KY + 1, re = new Float64Array(nx * ny), im = new Float64Array(nx * ny);
  re[KY * nx + KX] = 1;                                           // clear field
  for (const r of chrome) {
    const fx = []; for (let i = -KX; i <= KX; i++) fx.push(rectFT1(r[0], r[2], i, lx));
    for (let j = -KY; j <= KY; j++) {
      const [yr, yi] = rectFT1(r[1], r[3], j, ly), o = (j + KY) * nx;
      for (let i = 0; i < nx; i++) { const [xr, xi] = fx[i]; re[o + i] -= xr * yr - xi * yi; im[o + i] -= xr * yi + xi * yr; }
    }
  }
  return { re, im, nx, ny, KX, KY };
}

// Abbe: I = sum_s w_s |IFFT( M(f) P(f + f_s) )|^2, then resist blur. Returns the blurred intensity spectrum
// (exact, band-limited) and a display grid with `pixel` nm spacing. opts: sourcePoints, grid (force base grid size),
// pixel (display grid spacing, default 8 nm).
export function opcAerialImage(chrome, params = {}, opts = {}) {
  const p = { ...OPC_DEFAULTS, ...params }, F = OPC_FIELD, fc = p.na / p.wavelength;
  const KX = Math.ceil(fc * (1 + p.sigma) * F.lx) + 1, KY = Math.ceil(fc * (1 + p.sigma) * F.ly) + 1;
  // |E|^2 has frequencies up to 2K: a grid of at least 4K + 2 points per axis cannot alias
  const nx = opts.grid ? opts.grid[0] : pow2(4 * KX + 2), ny = opts.grid ? opts.grid[1] : pow2(4 * KY + 2);
  const M = opcMaskSpectrum(chrome, KX, KY), I = new Float64Array(nx * ny);
  const re = new Float64Array(nx * ny), im = new Float64Array(nx * ny);
  for (const s of opcSourcePoints(p.sigma, opts.sourcePoints ?? OPC_NUMERICS.sourcePoints)) {
    re.fill(0); im.fill(0);
    for (let j = -KY; j <= KY; j++) for (let i = -KX; i <= KX; i++) {
      const gx = i / F.lx + s.sx * fc, gy = j / F.ly + s.sy * fc;
      if (gx * gx + gy * gy > fc * fc) continue;
      const c = (j + KY) * M.nx + (i + KX), q = ((j + ny) % ny) * nx + ((i + nx) % nx), sg = (i + j) & 1 ? -1 : 1; // index 0 sits at -L/2
      re[q] = sg * M.re[c]; im[q] = sg * M.im[c];
    }
    fft2(re, im, nx, ny, true);
    for (let q = 0; q < nx * ny; q++) I[q] += s.w * (re[q] * re[q] + im[q] * im[q]);
  }
  // intensity spectrum (coefficients for the field origin at the centre), blurred
  const hr = Float64Array.from(I), hi = new Float64Array(nx * ny);
  fft2(hr, hi, nx, ny, false);
  const JX = 2 * KX, JY = 2 * KY, sx2 = 2 * JX + 1, spec = { re: new Float64Array(sx2 * (2 * JY + 1)), im: new Float64Array(sx2 * (2 * JY + 1)), JX, JY };
  for (let j = -JY; j <= JY; j++) for (let i = -JX; i <= JX; i++) {
    const q = ((j + ny) % ny) * nx + ((i + nx) % nx), sg = (i + j) & 1 ? -1 : 1, kx = i / F.lx, ky = j / F.ly;
    const g = Math.exp(-2 * Math.PI * Math.PI * p.blur * p.blur * (kx * kx + ky * ky)) / (nx * ny), c = (j + JY) * sx2 + (i + JX);
    spec.re[c] = sg * hr[q] * g; spec.im[c] = sg * hi[q] * g;
  }
  return { spec, grid: opcSpectrumToGrid(spec, opts.pixel ?? 8), base: [nx, ny], params: p };
}
// display grid from the spectrum (zero-padded inverse FFT); pixel centres at -L/2 + k * pixel
export function opcSpectrumToGrid(spec, pixel = 8) {
  const F = OPC_FIELD, nx = pow2(F.lx / pixel), ny = pow2(F.ly / pixel), re = new Float64Array(nx * ny), im = new Float64Array(nx * ny);
  const sx2 = 2 * spec.JX + 1;
  for (let j = -spec.JY; j <= spec.JY; j++) for (let i = -spec.JX; i <= spec.JX; i++) {
    const c = (j + spec.JY) * sx2 + (i + spec.JX), q = ((j + ny) % ny) * nx + ((i + nx) % nx), sg = (i + j) & 1 ? -1 : 1;
    re[q] = sg * spec.re[c]; im[q] = sg * spec.im[c];
  }
  fft2(re, im, nx, ny, true);
  return { data: Float32Array.from(re), nx, ny, px: F.lx / nx, py: F.ly / ny };
}
// exact intensity at (x, y) from the spectrum (used to validate the fast path)
export function opcIntensityExact(img, x, y) {
  const { spec } = img, F = OPC_FIELD, sx2 = 2 * spec.JX + 1;
  const ex = [], ey = [];
  for (let i = -spec.JX; i <= spec.JX; i++) { const a = 2 * Math.PI * i * x / F.lx; ex.push([Math.cos(a), Math.sin(a)]); }
  let total = 0;
  for (let j = -spec.JY; j <= spec.JY; j++) {
    const b = 2 * Math.PI * j * y / F.ly, cy = Math.cos(b), sy = Math.sin(b);
    let rr = 0, ri = 0; const o = (j + spec.JY) * sx2;
    for (let i = 0; i < sx2; i++) { const ar = spec.re[o + i], ai = spec.im[o + i], [c, s] = ex[i]; rr += ar * c - ai * s; ri += ar * s + ai * c; }
    total += rr * cy - ri * sy;
  }
  return total;
}
// fast intensity: Catmull-Rom bicubic on the display grid (periodic)
export function opcIntensity(img, x, y) {
  const g = img.grid, F = OPC_FIELD, u = (x + F.lx / 2) / g.px, v = (y + F.ly / 2) / g.py, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
  const w = (t) => [((-t + 2) * t - 1) * t / 2, (((3 * t - 5) * t) * t + 2) / 2, ((-3 * t + 4) * t + 1) * t / 2, ((t - 1) * t * t) / 2];
  const wu = w(fu), wv = w(fv); let s = 0;
  for (let b = 0; b < 4; b++) { const jj = (((j0 + b - 1) % g.ny) + g.ny) % g.ny; let row = 0; for (let a = 0; a < 4; a++) row += wu[a] * g.data[jj * g.nx + ((((i0 + a - 1) % g.nx) + g.nx) % g.nx)]; s += wv[b] * row; }
  return s;
}

// ---- sites, EPE, contours ---------------------------------------------------------------------------
// distance from (x, y) along (nx, ny) to the first other target rectangle (Infinity if none)
function rayGap(rects, x, y, nx, ny) {
  let best = Infinity;
  for (const r of rects) {
    let t0 = 1e-6, t1 = Infinity;
    for (const [o, d, lo, hi] of [[x, nx, r[0], r[2]], [y, ny, r[1], r[3]]]) {
      if (Math.abs(d) < 1e-12) { if (o <= lo || o >= hi) { t0 = Infinity; break; } continue; }
      let a = (lo - o) / d, b = (hi - o) / d; if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (t0 < t1 && t0 < best) best = t0;
  }
  return best;
}
const convex = (p, q, r) => ((q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0])) > 0;

// Evaluation sites, independent of the OPC control points: every `step` nm along each edge, skipping a zone of
// cornerZone * cd around every vertex, plus each line-end tip centre and a diagonal site at every corner.
// Each site carries how far it may search inside (din, to the feature's centre) and outside (dout, to halfway
// to the nearest neighbour, capped).
export function opcSites(polys, cd, opts = {}) {
  const step = opts.step ?? OPC_NUMERICS.evalStep, zone = (opts.cornerZone ?? OPC_NUMERICS.cornerZone) * cd, phase = opts.phase ?? 5;
  const rects = polys.flatMap(p => opcPolyRects(p.pts)), sites = [];
  const out = (x, y, nx, ny) => Math.min(150, rayGap(rects, x + nx * 0.5, y + ny * 0.5, nx, ny) / 2);
  for (const P of polys) {
    const n = P.pts.length;
    for (let i = 0; i < n; i++) {
      const a = P.pts[i], b = P.pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len, nx = dy, ny = -dx;
      if (len <= cd + 1e-6) { const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2; sites.push({ kind: 'lineEnd', poly: P.id, tag: P.tag, x, y, nx, ny, din: cd / 2, dout: out(x, y, nx, ny) }); continue; }
      for (let s = zone + phase; s <= len - zone; s += step) { const x = a[0] + dx * s, y = a[1] + dy * s; sites.push({ kind: 'edge', poly: P.id, tag: P.tag, x, y, nx, ny, din: cd / 2, dout: out(x, y, nx, ny) }); }
    }
    for (let i = 0; i < n; i++) {
      const p = P.pts[(i - 1 + n) % n], q = P.pts[i], r = P.pts[(i + 1) % n], isConvex = convex(p, q, r);
      const d1 = [Math.sign(q[0] - p[0]), Math.sign(q[1] - p[1])], d2 = [Math.sign(r[0] - q[0]), Math.sign(r[1] - q[1])];
      let ox = d1[0] - d2[0], oy = d1[1] - d2[1]; const l = Math.hypot(ox, oy); ox /= l; oy /= l;
      if (!isConvex) { ox = -ox; oy = -oy; }        // concave: the "outside" diagonal points into the notch
      const lens = [Math.hypot(q[0] - p[0], q[1] - p[1]), Math.hypot(r[0] - q[0], r[1] - q[1])], atEnd = lens.some(v => v <= cd + 1e-6);
      sites.push({ kind: isConvex ? (atEnd ? 'endCorner' : 'outerCorner') : 'innerCorner', poly: P.id, tag: P.tag, x: q[0], y: q[1], nx: ox, ny: oy, din: cd / Math.SQRT2, dout: Math.min(150, out(q[0], q[1], ox, oy)) });
    }
  }
  return sites;
}

// Signed EPE: target edge point -> printed contour along the outward normal (+ printed beyond the target).
// Searches from the feature's centre (din inside) outward to dout; reports pinch / bridge instead of guessing.
export function opcEpe(img, site, thr, f = opcIntensity) {
  const at = (d) => f(img, site.x + site.nx * d, site.y + site.ny * d) - thr;
  let a = -site.din, va = at(a);
  if (va >= 0) return { epe: -site.din, pinched: true };       // not printed even at the feature's centre
  const step = 2;
  for (let d = a + step; d <= site.dout + 1e-9; d += step) {
    const v = at(d);
    if (v >= 0) {                                               // bracketed: refine by bisection to 0.001 nm
      let lo = d - step, hi = d;
      for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (at(m) >= 0) hi = m; else lo = m; }
      return { epe: (lo + hi) / 2 };
    }
  }
  return { epe: site.dout, bridged: true };                     // still printed halfway to the neighbour
}

// Marching squares at level thr on the display grid, restricted to a window [x0, y0, x1, y1] (nm).
// Returns segments [x0, y0, x1, y1] with linear sub-pixel interpolation.
export function opcContours(img, thr, win) {
  const g = img.grid, F = OPC_FIELD, segs = [];
  const i0 = Math.max(0, Math.floor((win[0] + F.lx / 2) / g.px)), i1 = Math.min(g.nx - 2, Math.ceil((win[2] + F.lx / 2) / g.px));
  const j0 = Math.max(0, Math.floor((win[1] + F.ly / 2) / g.py)), j1 = Math.min(g.ny - 2, Math.ceil((win[3] + F.ly / 2) / g.py));
  const X = (i) => -F.lx / 2 + i * g.px, Y = (j) => -F.ly / 2 + j * g.py, v = (i, j) => g.data[j * g.nx + i] - thr;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    const pts = [];
    const edge = (p, q, xa, ya, xb, yb) => { if ((p < 0) !== (q < 0)) { const t = p / (p - q); pts.push([xa + (xb - xa) * t, ya + (yb - ya) * t]); } };
    edge(a, b, X(i), Y(j), X(i + 1), Y(j)); edge(b, c, X(i + 1), Y(j), X(i + 1), Y(j + 1)); edge(c, d, X(i + 1), Y(j + 1), X(i), Y(j + 1)); edge(d, a, X(i), Y(j + 1), X(i), Y(j));
    if (pts.length === 2) segs.push([...pts[0], ...pts[1]]);
    else if (pts.length === 4) { const ctr = (a + b + c + d) / 4; if ((ctr < 0) === (a < 0)) segs.push([...pts[0], ...pts[3]], [...pts[1], ...pts[2]]); else segs.push([...pts[0], ...pts[1]], [...pts[2], ...pts[3]]); }
  }
  return segs;
}

// ---- metrics ----------------------------------------------------------------------------------------
export function opcMetrics(img, sites, thr, f = opcIntensity) {
  const res = sites.map(s => ({ ...s, ...opcEpe(img, s, thr, f) }));
  const edges = res.filter(s => s.kind === 'edge' || s.kind === 'lineEnd'), e = edges.map(s => s.epe), a = e.map(Math.abs);
  const mean = (v) => (v.length ? v.reduce((p, q) => p + q, 0) / v.length : 0), pick = (k) => res.filter(s => s.kind === k).map(s => s.epe);
  const cdAt = (id) => { const L = res.filter(s => s.poly === id && s.kind === 'edge' && Math.abs(s.ny) < 1e-9 && Math.abs(s.y) < 60); return L.length ? mean(L.map(s => s.epe)) * 2 : 0; };
  const tol = OPC_NUMERICS.epeTolerance;
  return {
    sites: res, n: edges.length,
    rms: Math.sqrt(mean(e.map(v => v * v))), maxAbs: Math.max(...a), within: a.filter(v => v <= tol).length / a.length,
    pinched: res.filter(s => s.pinched).length, bridged: res.filter(s => s.bridged).length,
    lineEnd: mean(pick('lineEnd')),                       // tip-centre EPE (negative = line-end shortening)
    outerCorner: mean(pick('outerCorner')),               // right-angle outer corner, diagonal (negative = rounded off)
    innerCorner: mean(pick('innerCorner')),               // inner corner, diagonal (positive = filled in)
    endCorner: mean(pick('endCorner')),
    denseCdError: cdAt('dense1'), isoCdError: cdAt('iso'), // printed minus target CD at mid-line, nm
  };
}
export const opcIsoDenseBias = (m) => m.isoCdError - m.denseCdError;

// Dose-to-size: the threshold that prints the middle dense line at the target CD (at mid-height).
export function opcDoseToSize(img, polys, cd) {
  const P = polys.find(p => p.id === 'dense1'), xs = P.pts.map(q => q[0]), xr = Math.max(...xs);
  const site = { x: xr, y: 0, nx: 1, ny: 0, din: cd / 2, dout: 150 };
  let lo = 0.02, hi = 0.98;
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, r = opcEpe(img, site, m); if (r.pinched || r.epe > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}

// ---- OPC --------------------------------------------------------------------------------------------
// Fragments: each long edge is cut into two corner fragments (cornerLen) and middle fragments (<= maxLen); a
// line-end edge is one fragment. Control points sit at fragment midpoints, except on corner fragments, where they
// sit cornerZone * cd from the vertex: the same exclusion used for evaluation, so every target is reachable
// (no mask change can make a band-limited image reproduce the vertex itself). Hammerheads and serifs are not
// coded anywhere: they emerge when the side corner fragments and the tip move outward.
export function opcFragments(polys, cd, opts = {}) {
  const cornerLen = opts.cornerLen ?? OPC_NUMERICS.cornerFrag * cd, maxLen = opts.maxLen ?? 120, frags = [];
  const rects = polys.flatMap(p => opcPolyRects(p.pts));
  for (const P of polys) {
    const n = P.pts.length;
    for (let i = 0; i < n; i++) {
      const a = P.pts[i], b = P.pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len, nx = dy, ny = -dx;
      const isEnd = len <= cd + 1e-6;
      let cuts;
      if (isEnd) cuts = [0, len];
      else { const inner = len - 2 * cornerLen, m = Math.max(1, Math.round(inner / maxLen)); cuts = [0, cornerLen, ...Array.from({ length: m - 1 }, (_, k) => cornerLen + inner * (k + 1) / m), len - cornerLen, len]; }
      for (let k = 0; k + 1 < cuts.length; k++) {
        const s0 = cuts[k], s1 = cuts[k + 1], first = !isEnd && k === 0, last = !isEnd && k === cuts.length - 2, zone = (opts.controlZone ?? OPC_NUMERICS.controlZone) * cd;
        const sm = first ? Math.min(s1, zone) : last ? Math.max(s0, len - zone) : (s0 + s1) / 2, x = a[0] + dx * sm, y = a[1] + dy * sm;
        const gap = rayGap(rects, x + nx * 0.5, y + ny * 0.5, nx, ny);
        frags.push({ poly: P.id, kind: isEnd ? 'lineEnd' : first || last ? 'corner' : 'edge',
          a: [a[0] + dx * s0, a[1] + dy * s0], b: [a[0] + dx * s1, a[1] + dy * s1], nx, ny, d: 0,
          site: { x, y, nx, ny, din: cd / 2, dout: Math.min(150, gap / 2) },
          dmax: Math.min(0.6 * cd, gap / 2 - 10), dmin: -0.35 * cd });   // mask-rule-like limits: keep a 20 nm gap
      }
    }
  }
  return frags;
}
function strip(f, d) {
  const xs = [f.a[0], f.b[0], f.a[0] + f.nx * d, f.b[0] + f.nx * d], ys = [f.a[1], f.b[1], f.a[1] + f.ny * d, f.b[1] + f.ny * d];
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
// Mask from fragment offsets (scaled by `scale`): target + outward strips - inward strips, and the corner square
// between two outward-moved fragments at a convex turn (this is where serif-like shapes come from).
export function opcFragmentMask(polys, frags, scale = 1) {
  const add = polys.flatMap(p => opcPolyRects(p.pts)), sub = [];
  for (const f of frags) { const d = f.d * scale; if (d > 0.01) add.push(strip(f, d)); else if (d < -0.01) sub.push(strip(f, d)); }
  for (const f of frags) for (const g of frags) {
    if (f.poly !== g.poly || f.b[0] !== g.a[0] || f.b[1] !== g.a[1]) continue;
    const df = f.d * scale, dg = g.d * scale;
    if (df <= 0.01 || dg <= 0.01 || f.nx * g.ny - f.ny * g.nx >= 0) continue;   // convex turn: normals rotate clockwise
    const c = f.b, ox = c[0] + f.nx * df + g.nx * dg, oy = c[1] + f.ny * df + g.ny * dg;
    add.push([Math.min(c[0], ox), Math.min(c[1], oy), Math.max(c[0], ox), Math.max(c[1], oy)]);
  }
  return opcRectBoolean(add, sub);
}
// Model-based OPC: simple fixed-gain feedback d <- d - gain * EPE at each fragment's control point.
// Educational: no coupling-aware (Jacobian) update, no process window, no sub-resolution assists.
// Returns the best iterate and the full history; flags divergence of this simple loop when it occurs.
export function opcModelBased(polys, params, thr, opts = {}) {
  const iters = opts.iterations ?? OPC_NUMERICS.opcIterations, gain = opts.gain ?? OPC_NUMERICS.opcGain;
  const frags = opcFragments(polys, params.cd, opts), history = [];
  let best = { rms: Infinity, d: frags.map(() => 0), iteration: 0 };
  for (let it = 0; it <= iters; it++) {
    const img = opcAerialImage(opcFragmentMask(polys, frags), params, opts);
    const e = frags.map(f => opcEpe(img, f.site, thr));
    const rms = Math.sqrt(e.reduce((s, r) => s + r.epe * r.epe, 0) / e.length);
    history.push(rms);
    if (opts.onIteration) opts.onIteration(it, iters, rms);
    if (rms < best.rms) best = { rms, d: frags.map(f => f.d), iteration: it };
    if (it === iters) break;
    frags.forEach((f, k) => { f.d = clampTo(f.d - gain * e[k].epe, [f.dmin, Math.max(f.dmin, f.dmax)]); });
  }
  frags.forEach((f, k) => { f.d = best.d[k]; });
  const last = history[history.length - 1], diverged = last > history[0] || last > 1.5 * best.rms;
  return { frags, history, bestIteration: best.iteration, controlRms: best.rms, diverged };
}
// Rule-based OPC from the five manual parameters: edge bias on every edge, square serifs on outer right-angle
// corners, hammerheads (overhang per side, length along the line, extension past the tip) on every line end.
export function opcRuleMask(polys, cd, r) {
  const add = [], sub = [], b = r.bias || 0;
  // positive bias: grow every slab by b (= outward offset of the polygon); negative: remove an inward strip per edge
  for (const P of polys) for (const q of opcPolyRects(P.pts)) add.push(b > 0 ? [q[0] - b, q[1] - b, q[2] + b, q[3] + b] : q);
  if (b < 0) for (const P of polys) for (let i = 0; i < P.pts.length; i++) {
    const a = P.pts[i], c = P.pts[(i + 1) % P.pts.length], len = Math.hypot(c[0] - a[0], c[1] - a[1]), nx = (c[1] - a[1]) / len, ny = -(c[0] - a[0]) / len;
    sub.push(strip({ a, b: c, nx, ny }, b));
  }
  for (const P of polys) {
    const n = P.pts.length;
    for (let i = 0; i < n; i++) {
      const a = P.pts[i], c = P.pts[(i + 1) % n], len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len <= cd + 1e-6 && (r.hammerOverhang > 0 || r.hammerLength > 0 || r.hammerExtension > 0)) {
        const dx = (c[0] - a[0]) / len, dy = (c[1] - a[1]) / len, nx = dy, ny = -dx, h = r.hammerOverhang || 0, l = Math.max(r.hammerLength || 0, 1), e = r.hammerExtension || 0;
        const p1 = [a[0] - dx * h - nx * l, a[1] - dy * h - ny * l], p2 = [c[0] + dx * h + nx * e, c[1] + dy * h + ny * e];
        add.push([Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1])]);
      }
    }
    if (r.serif > 0) for (let i = 0; i < n; i++) {
      const p = P.pts[(i - 1 + n) % n], q = P.pts[i], s = P.pts[(i + 1) % n];
      const atEnd = Math.hypot(q[0] - p[0], q[1] - p[1]) <= cd + 1e-6 || Math.hypot(s[0] - q[0], s[1] - q[1]) <= cd + 1e-6;
      if (convex(p, q, s) && !atEnd) add.push([q[0] - r.serif / 2, q[1] - r.serif / 2, q[0] + r.serif / 2, q[1] + r.serif / 2]);
    }
  }
  return opcRectBoolean(add, sub);
}

// ---- one call for a whole experiment -------------------------------------------------------------------
// Returns target, original and corrected masks, both images, threshold and metrics before / after.
// `model` (an opcModelBased result for the same optics and threshold) can be passed in to avoid recomputing.
export const opcOpticsKey = (p) => [p.wavelength, p.na, p.cd, p.space, p.threshold ?? 'auto'].join('|');
export function opcExperiment(params = {}, opts = {}) {
  const p = opcNormalize(params), polys = opcLayout(p.cd, p.space), target = opcTargetMask(polys);
  const imgBefore = opcAerialImage(target, p, opts);
  const thr = p.threshold ?? opcDoseToSize(imgBefore, polys, p.cd);
  const sites = opcSites(polys, p.cd);
  const before = opcMetrics(imgBefore, sites, thr);
  let model = opts.model || null, corrected;
  if (p.mode === 'rules') corrected = opcRuleMask(polys, p.cd, p);
  else { if (!model) model = opcModelBased(polys, p, thr, opts); corrected = opcFragmentMask(polys, model.frags, p.strength); }
  const imgAfter = opcAerialImage(corrected, p, opts);
  const after = opcMetrics(imgAfter, sites, thr);
  return { params: p, polys, target, corrected, thr, imgBefore, imgAfter, before, after, model, bounds: opcBounds(polys, 160) };
}
