// Validation of the OPC model (Lab 002). Run: node scripts/labs/check-opc-model.mjs [--report]
// Each check prints what it measured; --report also writes the numbers to exports/labs/opc-validation.json.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  OPC_FIELD, opcAerialImage, opcContours, opcDoseToSize, opcEpe, opcExperiment, opcFragmentMask, opcIntensity,
  opcIntensityExact, opcLayout, opcMetrics, opcNormalize, opcRuleMask, opcSites, opcTargetMask,
} from '../../src/labs/optical-proximity-correction/model.js';

const report = {}, log = (k, v, msg) => { report[k] = v; console.log(`  ${msg}`); };
const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} ± ${tol}`);
const p = opcNormalize({}), polys = opcLayout(p.cd, p.space), target = opcTargetMask(polys), sites = opcSites(polys, p.cd);
const pick = (m) => ({ rms: m.rms, maxAbs: m.maxAbs, within: m.within, lineEnd: m.lineEnd, outerCorner: m.outerCorner, endCorner: m.endCorner, innerCorner: m.innerCorner, isoCdError: m.isoCdError, denseCdError: m.denseCdError });
const maxDiff = (a, b) => Math.max(...Object.keys(a).map(k => Math.abs(a[k] - b[k])));

console.log('1. Physical sanity');
{
  const big = opcAerialImage([[-600, -400, 600, 400]], { ...p, blur: 0 });
  near(opcIntensityExact(big, 1600, 900), 1, 0.01, 'clear field = 1');
  near(opcIntensityExact(big, 0, 0), 0, 0.01, 'centre of a large chrome square = 0');
  const coh = opcAerialImage([[-900, -900, 0, 900]], { ...p, sigma: 0, blur: 0 });
  const edge = opcIntensityExact(coh, 0, 0);
  log('edgeIntensityCoherent', edge, `coherent intensity at a long straight edge: ${edge.toFixed(4)} (textbook value 0.25)`);
  near(edge, 0.25, 0.02, 'coherent edge intensity');
  // a single line centred on the origin is mirror-symmetric, so its two edges must print identically
  const one = opcAerialImage([[-50, -350, 50, 350]], p), L = opcEpe(one, { x: -50, y: 20, nx: -1, ny: 0, din: 50, dout: 150 }, 0.34).epe, R = opcEpe(one, { x: 50, y: 20, nx: 1, ny: 0, din: 50, dout: 150 }, 0.34).epe;
  log('symmetry', Math.abs(L - R), `centred single line, left vs right edge EPE: ${L.toFixed(4)} / ${R.toFixed(4)} nm`);
  near(L, R, 0.01, 'mirror-symmetric line');
}

console.log('2. Spatial convergence (base FFT grid 128 / 256 / 512 points along y, x scaled to keep the pixel square)');
{
  const runs = [[128, 128], [256, 256], [512, 512]].map(g => { const img = opcAerialImage(target, p, { grid: [g[0] * 2 > 1024 ? 1024 : g[0] * 2, g[1]] }); const thr = opcDoseToSize(img, polys, p.cd); return { g, thr, m: pick(opcMetrics(img, sites, thr)), I: opcIntensityExact(img, 37, 113) }; });
  const auto = opcAerialImage(target, p);
  console.log(`  automatic base grid for these optics: ${auto.base.join(' x ')} (alias-free: at least 4K + 2 per axis)`);
  for (const r of runs) console.log(`  grid ${String(r.g[0] * 2).padStart(4)} x ${String(r.g[1]).padStart(3)}: threshold ${r.thr.toFixed(6)} | RMS EPE ${r.m.rms.toFixed(4)} nm | line end ${r.m.lineEnd.toFixed(4)} nm | I(37, 113) = ${r.I.toFixed(8)}`);
  const d = Math.max(maxDiff(runs[0].m, runs[2].m), maxDiff(runs[1].m, runs[2].m));
  log('gridConvergenceNm', d, `largest metric change between grids: ${d.toExponential(2)} nm`);
  assert(d < 0.01, 'metrics must not depend on the FFT grid');
}

console.log('3. Display-grid interpolation and sub-pixel EPE accuracy');
{
  const img = opcAerialImage(target, p), thr = opcDoseToSize(img, polys, p.cd), sub = sites.filter((_, i) => i % 7 === 0);
  let worstI = 0; for (const s of sub) worstI = Math.max(worstI, Math.abs(opcIntensity(img, s.x + 3.3, s.y - 2.1) - opcIntensityExact(img, s.x + 3.3, s.y - 2.1)));
  log('bicubicIntensityError', worstI, `bicubic (8 nm grid) vs exact spectral intensity, worst of ${sub.length} points: ${worstI.toExponential(2)}`);
  let worstE = 0; for (const s of sub) { const a = opcEpe(img, s, thr), b = opcEpe(img, s, thr, opcIntensityExact); worstE = Math.max(worstE, Math.abs(a.epe - b.epe)); }
  log('epeFastVsExactNm', worstE, `EPE fast path vs exact intensity, worst site: ${worstE.toFixed(4)} nm`);
  assert(worstE < 0.05, 'fast EPE within 0.05 nm of exact');
  // root finder on an analytic edge: I(x) = 0.5 + 0.5 tanh((x - x0) / w) crosses thr at x0 + w atanh(2 thr - 1)
  const f = (_, x) => 0.5 + 0.5 * Math.tanh((x - 3.217) / 21), want = 3.217 + 21 * Math.atanh(2 * 0.3 - 1);
  const r = opcEpe(null, { x: 0, y: 0, nx: 1, ny: 0, din: 50, dout: 80 }, 0.3, f);
  log('rootFinderErrorNm', Math.abs(r.epe - want), `analytic edge: EPE ${r.epe.toFixed(5)} nm vs exact ${want.toFixed(5)} nm`);
  near(r.epe, want, 0.002, 'bisection accuracy');
  // marching-squares contour vs exact edge position, on the drawn contour (8 nm grid, linear interpolation)
  const segs = opcContours(img, thr, [-OPC_FIELD.lx / 2, -OPC_FIELD.ly / 2, OPC_FIELD.lx / 2, OPC_FIELD.ly / 2]);
  let worstC = 0;
  for (const s of sub.filter(s => s.kind === 'edge')) {
    const e = opcEpe(img, s, thr, opcIntensityExact).epe, px = s.x + s.nx * e, py = s.y + s.ny * e;
    let best = Infinity; for (const g of segs) { const dx = g[2] - g[0], dy = g[3] - g[1], t = Math.max(0, Math.min(1, ((px - g[0]) * dx + (py - g[1]) * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(g[0] + t * dx - px, g[1] + t * dy - py)); }
    worstC = Math.max(worstC, best);
  }
  log('contourErrorNm', worstC, `drawn contour vs exact edge position, worst: ${worstC.toFixed(3)} nm (display only; metrics use the exact search)`);
  assert(worstC < 1, 'drawn contour within 1 nm');
}

console.log('4. Illumination sampling convergence (Vogel spiral, reference 1000 points)');
{
  const run = (n) => { const img = opcAerialImage(target, p, { sourcePoints: n }); const thr = opcDoseToSize(img, polys, p.cd); return pick(opcMetrics(img, sites, thr)); };
  const ref = run(1000), rows = [19, 37, 61, 97, 151, 271].map(n => ({ n, m: run(n) }));
  for (const r of rows) console.log(`  ${String(r.n).padStart(4)} points: RMS ${r.m.rms.toFixed(3)} | line end ${r.m.lineEnd.toFixed(3)} | outer corner ${r.m.outerCorner.toFixed(3)} | iso CD ${r.m.isoCdError.toFixed(3)} | max change vs 1000 points ${maxDiff(r.m, ref).toFixed(3)} nm`);
  const d = maxDiff(rows.find(r => r.n === 97).m, ref);
  log('sourceSamplingNm', d, `default (97 points) differs from 1000 points by at most ${d.toFixed(3)} nm on every reported metric`);
  assert(d < 0.2, 'source sampling converged to 0.2 nm');
}

console.log('5. OPC performance at independent evaluation sites (default optics)');
{
  const r = opcExperiment({}), b = r.before, a = r.after;
  const ctrl = new Set(r.model.frags.map(f => `${f.site.x.toFixed(3)},${f.site.y.toFixed(3)}`)), shared = r.after.sites.filter(s => ctrl.has(`${s.x.toFixed(3)},${s.y.toFixed(3)}`) && s.kind === 'edge').length;
  console.log(`  ${a.n} evaluation sites; ${shared} coincide with one of ${r.model.frags.length} OPC control points`);
  for (const [k, label] of [['rms', 'RMS EPE'], ['maxAbs', 'max |EPE|'], ['lineEnd', 'line-end tip EPE'], ['outerCorner', 'outer corner'], ['endCorner', 'line-end corners'], ['innerCorner', 'inner corner'], ['isoCdError', 'iso CD error'], ['denseCdError', 'dense CD error']]) console.log(`  ${label.padEnd(18)} ${b[k].toFixed(2).padStart(7)} -> ${a[k].toFixed(2).padStart(7)} nm`);
  console.log(`  within ±5 nm       ${(b.within * 100).toFixed(0).padStart(6)}% -> ${(a.within * 100).toFixed(0)}% | pinched ${a.pinched}, bridged ${a.bridged} | OPC control RMS by iteration ${r.model.history.map(v => v.toFixed(1)).join(' ')}`);
  report.defaultResult = { threshold: r.thr, before: pick(b), after: pick(a), withinBefore: b.within, withinAfter: a.within, iterations: r.model.history.length - 1 };
  assert(a.rms < 0.5 * b.rms && a.maxAbs < b.maxAbs && a.within > b.within, 'OPC must improve independent-site EPE');
  assert(a.pinched === 0 && a.bridged === 0 && b.pinched === 0 && b.bridged === 0, 'no pinching or bridging at defaults');
  assert(a.outerCorner < -5, 'corners must stay visibly rounded (no forced perfect result)');
  const none = opcMetrics(opcAerialImage(opcRuleMask(polys, p.cd, { bias: 0, serif: 0, hammerOverhang: 0, hammerLength: 0, hammerExtension: 0 }), p), sites, r.thr);
  near(none.rms, b.rms, 1e-9, 'empty rule set reproduces the uncorrected mask');
  const zero = opcMetrics(opcAerialImage(opcFragmentMask(polys, r.model.frags, 0), p), sites, r.thr);
  near(zero.rms, b.rms, 1e-9, 'OPC strength 0 reproduces the uncorrected mask');
}

console.log('6. Simple-loop behaviour at a tighter pitch (algorithm limit, not a lithography limit)');
{
  const rows = [100, 90, 80].map(cd => { const r = opcExperiment({ cd, space: cd }); return { cd, k1: cd * p.na / p.wavelength, before: r.before.rms, after: r.after.rms, hist: r.model.history, diverged: r.model.diverged, pinched: r.after.pinched + r.after.bridged }; });
  for (const r of rows) console.log(`  CD = space = ${r.cd} nm (k1 ${r.k1.toFixed(2)}): RMS ${r.before.toFixed(2)} -> ${r.after.toFixed(2)} nm | loop ${r.diverged ? 'did not converge' : 'converged'} | control RMS ${r.hist[0].toFixed(1)} -> ${r.hist[r.hist.length - 1].toFixed(1)}${r.pinched ? ` | ${r.pinched} pinched/bridged sites` : ''}`);
  report.pitchStudy = rows.map(r => ({ cd: r.cd, k1: r.k1, before: r.before, after: r.after, diverged: r.diverged }));
}

if (process.argv.includes('--report')) { mkdirSync('exports/labs', { recursive: true }); writeFileSync('exports/labs/opc-validation.json', JSON.stringify(report, null, 2)); console.log('wrote exports/labs/opc-validation.json'); }
console.log('OPC model checks passed: physical sanity, grid convergence, sub-pixel EPE, contour accuracy, source sampling, OPC at independent sites.');
