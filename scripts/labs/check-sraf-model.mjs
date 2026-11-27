// Validation of the SRAF model (Lab 003). Run: node scripts/labs/check-sraf-model.mjs [--report]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  SRAF_DESIGNS, srafAnalyze, srafAt, srafCd, srafDenseMask, srafDof, srafImage, srafMask, srafNils, srafNormalize, srafPrinted,
  srafPrintOnset, srafThresholdForCd, srafFocusScan,
} from '../../src/labs/sub-resolution-assist-features/model.js';
import { orlAerialImage } from '../../src/labs/optical-resolution-limit/model.js';
import { opcAerialImage, opcIntensityExact } from '../../src/labs/optical-proximity-correction/model.js';

const report = {}, log = (k, v, msg) => { report[k] = v; console.log(`  ${msg}`); };
const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} ± ${tol}`);
const P = srafNormalize({}), REC = srafNormalize(SRAF_DESIGNS.recommended), fake = (fn, L = 4096, N = 8192) => ({ L, N, dx: L / N, I: Float64Array.from({ length: N }, (_, i) => fn(-L / 2 + i * L / N)) });
const key = (a) => ({ E0: a.E0, nils: a.nilsAerial, cdOnly: a.windows.cdOnly.dof, defectFree: a.windows.defectFree.dof, safe: a.windows.safe.dof });
const maxDiff = (a, b) => Math.max(...Object.keys(a).map(k => Math.abs(a[k] - b[k])));

console.log('1. Dose, threshold and exposure latitude definitions');
{
  const img = srafImage(srafMask(REC).all, REC, 0), t0 = srafThresholdForCd(img, REC.cd);
  near(srafCd(img, t0), REC.cd, 1e-3, 'dose-to-size prints the target CD');
  let prev = 0; for (const E of [2.2, 2.5, 2.8, 3.1, 3.4]) { const cd = srafCd(img, 1 / E); assert(cd < prev || prev === 0, 'CD must fall as dose rises (dark line, positive resist)'); prev = cd; }
  const open = srafImage([], REC, 0); near(srafAt(open, 123), 1, 1e-9, 'open frame intensity = 1, so dose 1 clears it exactly');
  const a = srafAnalyze(SRAF_DESIGNS.recommended), r0 = a.rows.find(r => r.z === 0);
  near(srafCd(img, 1 / r0.Ehi), 0.9 * REC.cd, 0.01, 'E_hi prints CD - 10 %'); near(srafCd(img, 1 / r0.Elo), 1.1 * REC.cd, 0.01, 'E_lo prints CD + 10 %');
  log('elBestFocus', a.elBestFocus, `EL at best focus = (E_hi - E_lo) / E_mid = (${r0.Ehi.toFixed(4)} - ${r0.Elo.toFixed(4)}) / ${((r0.Ehi + r0.Elo) / 2).toFixed(4)} = ${(a.elBestFocus * 100).toFixed(2)} %`);
}

console.log('2. Defocus');
{
  const m = srafMask(REC), a = srafImage(m.all, REC, 160), b = srafImage(m.all, REC, -160);
  let d = 0; for (let x = -600; x <= 600; x += 7) d = Math.max(d, Math.abs(srafAt(a, x) - srafAt(b, x)));
  log('defocusSymmetry', d, `I(x, +160 nm) vs I(x, -160 nm), max difference ${d.toExponential(2)} (aberration-free: must be symmetric)`); assert(d < 1e-12);
  // coherent two-beam image of an equal line/space grating (only orders 0, +-1 pass): exact defocus formula
  const pitch = 256, L = 4096, ch = []; for (let c = -L / 2 + pitch / 2; c < L / 2; c += pitch) ch.push([c - pitch / 4, c + pitch / 4]);
  const q = { ...REC, illumination: 'conventional', sigmaOut: 0, na: 0.85 }, z = 300, img = srafImage(ch, q, z, { sourcePoints: 1, blur: 0 });
  const c0 = 0.5, c1 = 1 / Math.PI, dphi = 2 * Math.PI * z * (Math.sqrt(1 / 193 ** 2 - 1 / pitch ** 2) - 1 / 193);
  // clear spaces centred at x = 0, duty 1/2: c0 = 1/2, c(+-1) = 1/pi; only orders 0 and +-1 pass (lambda / p = 0.75 < NA)
  // E = c0 + 2 c1 cos(2 pi x / p) e^(i dphi)  =>  I = c0^2 + 4 c1^2 cos^2 + 4 c0 c1 cos(2 pi x / p) cos(dphi)
  let worst = 0; for (let x = -128; x <= 128; x += 4) { const cx = Math.cos(2 * Math.PI * x / pitch), want = c0 * c0 + 4 * c1 * c1 * cx * cx + 4 * c0 * c1 * cx * Math.cos(dphi); worst = Math.max(worst, Math.abs(srafAt(img, x) - want)); }
  log('defocusAnalytic', worst, `coherent two-beam grating at z = ${z} nm vs |c0 - 2 c1 cos(2 pi x / p) e^(i dphi)|^2: max error ${worst.toExponential(2)}`); assert(worst < 1e-12);
}

console.log('3. Contours, NILS and printability on analytic profiles');
{
  const sig = 40, img = fake(x => 1 - 0.8 * Math.exp(-x * x / (2 * sig * sig))), t = 0.5, want = 2 * sig * Math.sqrt(-2 * Math.log((1 - t) / 0.8));
  log('contourError', Math.abs(srafCd(img, t) - want), `CD of a Gaussian dip: ${srafCd(img, t).toFixed(5)} vs exact ${want.toFixed(5)} nm`); near(srafCd(img, t), want, 0.01, 'contour');
  const pr = srafPrinted(img, t); near(pr[0][1] - pr[0][0], want, 0.05, 'printed interval width');
  const p2 = 200, w = 100, cos = fake(x => 0.6 - 0.4 * Math.cos(2 * Math.PI * x / p2)), nilsWant = w * (0.4 * 2 * Math.PI / p2 * Math.sin(2 * Math.PI * (w / 2) / p2)) / (0.6 - 0.4 * Math.cos(2 * Math.PI * (w / 2) / p2));
  log('nilsError', Math.abs(srafNils(cos, w) - nilsWant), `NILS of a sinusoid: ${srafNils(cos, w).toFixed(5)} vs exact ${nilsWant.toFixed(5)}`); near(srafNils(cos, w), nilsWant, 1e-3, 'NILS');
  // main dip plus a side dip of known depth 0.42 at x = 250: onset must be found at 0.42 and only above it
  const side = fake(x => 1 - 0.9 * Math.exp(-x * x / 800) - 0.58 * Math.exp(-((x - 250) ** 2) / 300));
  const on = srafPrintOnset(side, 60), sideMin = Math.min(...Array.from({ length: 400 }, (_, i) => srafAt(side, 200 + i * 0.25)));
  log('printOnset', on.t, `side dip: onset threshold ${on.t.toFixed(5)} at x = ${on.x.toFixed(1)} nm (minimum ${sideMin.toFixed(5)})`); near(on.t, sideMin, 1e-3, 'onset');
  assert.equal(srafPrinted(side, on.t - 0.005).length, 1, 'just below onset only the main line prints'); assert.equal(srafPrinted(side, on.t + 0.005).length, 2, 'just above onset the side dip prints');
}

console.log('4. Process-window rectangle on a synthetic window');
{
  const k = 2e-6, rows = []; for (let z = -400; z <= 400; z += 10) rows.push({ z, ok: true, Elo: 1, Ehi: 1.2 - k * z * z, Eprint: 0 });
  const c = 1 / (1 - 0.025), want = 2 * Math.sqrt((1.2 - c * 1.025) / k), got = srafDof(rows, null, 0.05, { doseCenters: 4000 }).dof;
  log('pwSynthetic', Math.abs(got - want), `E_lo = 1, E_hi = 1.2 - k z^2: DOF at 5 % EL ${got.toFixed(2)} vs exact ${want.toFixed(2)} nm`); near(got, want, 1.0, 'synthetic DOF');
}

console.log('5. Convergence: spatial grid, field, illumination sampling, focus grid, dose grid');
{
  const base = key(srafAnalyze(SRAF_DESIGNS.recommended));
  const runs = [
    ['grid 2048', { grid: 2048 }], ['grid 4096', { grid: 4096 }], ['field 8192 (grid 2048)', { field: 8192, grid: 2048 }],
    ['source 151 points', { sourcePoints: 151 }], ['source 2401 points', { sourcePoints: 2401 }], ['source 9601 points', { sourcePoints: 9601 }],
    ['focus step 20 nm', { focusStep: 20 }], ['focus step 5 nm', { focusStep: 5 }], ['dose centres 150', { doseCenters: 150 }], ['dose centres 2400', { doseCenters: 2400 }],
  ];
  const out = {};
  for (const [label, o] of runs) { const r = key(srafAnalyze(SRAF_DESIGNS.recommended, o)); out[label] = maxDiff(r, base); console.log(`  ${label.padEnd(24)} DOF ${r.cdOnly.toFixed(1)} / ${r.defectFree.toFixed(1)} / ${r.safe.toFixed(1)} nm, NILS ${r.nils.toFixed(4)}, E0 ${r.E0.toFixed(4)} | max change vs default ${out[label].toFixed(3)}`); }
  report.convergence = out;
  assert(out['grid 4096'] < 0.25 && out['field 8192 (grid 2048)'] < 1.0, 'spatial convergence: within 0.25 nm (grid) and 1 nm (field size)');
  assert(out['source 9601 points'] < 0.5, 'illumination sampling: every metric within 0.5 nm (DOF) of 9601 points');
  assert(out['focus step 5 nm'] < 2.0 && out['dose centres 2400'] < 0.5, 'focus and dose grids');
}

console.log('6. Accepted windows re-checked point by point (CD in tolerance, nothing else prints)');
{
  for (const [label, d] of [['recommended', SRAF_DESIGNS.recommended], ['2 x 40 nm', { bars: 2, barWidth: 40 }]]) {
    const a = srafAnalyze(d), p = a.params, w = a.windows.defectFree; let bad = 0, n = 0;
    for (let z = w.z0; z <= w.z1 + 1e-9; z += (w.z1 - w.z0) / 12) {
      const img = srafImage(a.mask.all, p, z);
      for (let k = 0; k <= 10; k++) { const E = w.e0 + (w.e1 - w.e0) * k / 10, pr = srafPrinted(img, 1 / E), cd = srafCd(img, 1 / E); n++; if (pr.length !== 1 || Math.abs(cd - p.cd) > p.cdTolerance * p.cd + 0.05) bad++; }
    }
    log(`accepted_${label}`, bad, `${label}: ${n} focus-dose points inside the defect-free rectangle (${w.dof.toFixed(0)} nm x ${(100 * (w.e1 - w.e0) / ((w.e1 + w.e0) / 2)).toFixed(1)} %): ${bad} fail`);
    assert.equal(bad, 0, `${label}: accepted window must be clean`);
  }
  const o = srafAnalyze(SRAF_DESIGNS.oversized), w = o.windows.cdOnly, img = srafImage(o.mask.all, o.params, 0);
  const extra = srafPrinted(img, 1 / w.e0).length - 1;
  log('oversizedPrints', extra, `oversized (2 x 60 nm): at best focus and the low-dose edge of its CD-only window, ${extra} extra features print; defect-free DOF ${o.windows.defectFree.dof.toFixed(0)} nm`);
  assert(extra > 0 && o.verdict === 'prints');
  // assists with no CD window at all are 'nowindow', never 'none' (which is reserved for layouts without assists)
  { const nw = srafAnalyze({ wavelength: 365, na: 0.5 }); assert.equal(nw.mask.bars.length, 4); assert.equal(nw.windows.cdOnly.dof, 0); assert.equal(nw.verdict, 'nowindow'); }
}

console.log('7. Consistency with Labs 001 and 002');
{
  const pitch = 256, L = 4096, ch = []; for (let c = -L / 2 + pitch / 2; c < L / 2; c += pitch) ch.push([c - pitch / 4, c + pitch / 4]);
  const a = srafImage(ch, { ...REC, illumination: 'conventional', sigmaOut: 0, na: 0.93 }, 0, { sourcePoints: 1, blur: 0 }), b = orlAerialImage({ wavelength: 193, na: 0.93, pitch, illumination: 'coherent', sigma: 0 }, { samples: 65, periods: 1 });
  let d1 = 0; b.x.forEach((x, i) => { d1 = Math.max(d1, Math.abs(srafAt(a, x) - b.intensity[i])); });
  const a2 = srafImage(ch, { ...REC, illumination: 'annular', sigmaIn: 0.56, sigmaOut: 0.8, na: 0.93 }, 0, { sourcePoints: 4000, blur: 0 }), b2 = orlAerialImage({ wavelength: 193, na: 0.93, pitch, illumination: 'annular', sigma: 0.8 }, { samples: 65, periods: 1, sourceGrid: 301 });
  let d2 = 0; b2.x.forEach((x, i) => { d2 = Math.max(d2, Math.abs(srafAt(a2, x) - b2.intensity[i])); });
  const w = 100, i2 = opcAerialImage([[-w / 2, -800, w / 2, 800]], { wavelength: 193, na: 0.93, sigma: 0.5, blur: 12 }), i1 = srafImage([[-w / 2, w / 2]], { ...REC, illumination: 'conventional', sigmaOut: 0.5, na: 0.93 }, 0, { sourcePoints: 400 });
  let d3 = 0; for (let x = -300; x <= 300; x += 5) d3 = Math.max(d3, Math.abs(opcIntensityExact(i2, x, 0) - srafAt(i1, x)));
  log('lab001Coherent', d1, `Lab 001, coherent lines and spaces: max |dI| ${d1.toExponential(2)}`); log('lab001Annular', d2, `Lab 001, annular 0.56-0.8 (4000 vs 301 x 301 source samples): max |dI| ${d2.toExponential(2)}`);
  log('lab002LongLine', d3, `Lab 002, 2D line 1600 nm long at mid-height vs 1D: max |dI| ${d3.toExponential(2)}`);
  assert(d1 < 1e-12 && d2 < 5e-4 && d3 < 5e-3);
}

if (process.argv.includes('--report')) { mkdirSync('exports/labs', { recursive: true }); writeFileSync('exports/labs/sraf-validation.json', JSON.stringify(report, null, 2)); console.log('wrote exports/labs/sraf-validation.json'); }
console.log('SRAF model checks passed: dose/EL definitions, defocus (symmetry and exact two-beam), contours, NILS, printability, process window, convergence, accepted windows, cross-lab consistency.');
