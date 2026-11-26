// Hand checks of the Optical Resolution Limit model against closed-form textbook results.
// Run: node scripts/labs/check-optical-resolution-model.mjs
import assert from 'node:assert/strict';
import { orlAnalyze, orlBesselJ1, orlTwoPoint, orlLimits, orlCapturedOrders, orlAerialImage } from '../../src/labs/optical-resolution-limit/model.js';

const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} +/- ${tol}`);

// 1. Bessel J1: first zero 3.8317 and J1(1) = 0.440051 (Abramowitz & Stegun table 9.1)
near(orlBesselJ1(1), 0.440051, 1e-6, 'J1(1)');
near(orlBesselJ1(3.831706), 0, 1e-6, 'first zero of J1');
// 2. Rayleigh: the Airy first zero sits at 0.61 lambda / NA, and two points at that distance give a ~26.5 % dip
const tp = orlTwoPoint({ wavelength: 193, na: 0.93 }, 0.61 * 193 / 0.93);
near(tp.dip, 0.265, 0.01, 'Rayleigh dip');
// 3. Coherent cutoff: the +/-1 orders pass only while lambda / p <= NA
const base = { wavelength: 193, na: 0.93, illumination: 'coherent' };
assert.deepEqual(orlCapturedOrders({ ...base, pitch: 210 }).onAxis, [-1, 0, 1], 'p = 210 nm keeps the first orders');
assert.deepEqual(orlCapturedOrders({ ...base, pitch: 205 }).onAxis, [0], 'p = 205 nm loses them (cutoff 207.5 nm)');
near(orlLimits(base).coherentPitch, 207.53, 0.01, 'coherent cutoff pitch');
// 4. Coherent three-beam image of an equal line/space grating: I(x) = (1/2 + (2/pi) cos(2 pi x / p))^2
const img = orlAerialImage({ ...base, pitch: 300 }, { samples: 5, periods: 1 });
img.x.forEach((x, i) => near(img.intensity[i], (0.5 + (2 / Math.PI) * Math.cos(2 * Math.PI * x / 300)) ** 2, 1e-12, `coherent image at x = ${x}`));
// 4b. Its amplitude crosses zero (C = 1) and NILS at the edge x = p/4 is exactly 8
const c300 = orlAnalyze({ ...base, pitch: 300 });
near(c300.contrast, 1, 1e-3, 'coherent 300 nm contrast');
near(c300.nils, 8, 1e-3, 'coherent 300 nm NILS');
// 5. Below the coherent cutoff the coherent image is flat (0th order only): contrast 0
near(orlAnalyze({ ...base, pitch: 180 }).contrast, 0, 1e-12, 'no image below the cutoff');
// 6. Off-axis illumination recovers 180 nm on the same dry lens, and nothing beats lambda / (2 NA)
assert(orlAnalyze({ ...base, pitch: 180, illumination: 'dipole', sigma: 0.55 }).contrast > 0.5, 'dipole resolves 180 nm');
near(orlLimits(base).absolutePitch, 103.76, 0.01, 'absolute limit lambda / (2 NA)');
assert.equal(orlAnalyze({ ...base, pitch: 100, illumination: 'dipole', sigma: 0.9 }).contrast, 0, 'below lambda / (2 NA): no image');
// 7. k1 at the absolute limit is 0.25
near(orlLimits({ ...base, pitch: 193 / (2 * 0.93) }).k1, 0.25, 1e-12, 'k1 at the absolute limit');
console.log('Optical resolution model checks passed: J1, Rayleigh dip, coherent cutoff, coherent image, off-axis recovery, absolute limit, k1.');
