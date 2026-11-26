// node tools/jumps.mjs demos/<demo> t0 t1 step  -> prints frames that change far more than their neighbours
import { launch } from './browser.mjs';
const [a, b, step] = process.argv.slice(3).map(Number);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 800, height: 640 } });
await page.goto('file://' + (await import('node:path')).resolve(process.argv[2]) + '/dist/index.html?render&w=800');
await page.waitForFunction(() => window.READY === true);
const diffs = await page.evaluate(([a, b, step]) => {
  const cv = document.getElementById('stage'), c = cv.getContext('2d', { willReadFrequently: true });
  let prev = null; const out = [];
  for (let t = a; t <= b; t += step) {
    window.seek(t);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    if (prev) { let n = 0; for (let i = 0; i < d.length; i += 16) { if (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]) > 40) n++; } out.push([+t.toFixed(3), n]); }
    prev = d.slice();
  }
  return out;
}, [a, b, step]);
for (let i = 2; i < diffs.length - 2; i++) {
  const n = diffs[i][1], nb = (diffs[i - 2][1] + diffs[i - 1][1] + diffs[i + 1][1] + diffs[i + 2][1]) / 4;
  if (n > 3 * nb + 400) console.log('JUMP at', diffs[i][0], 'changed', n, 'neighbours', Math.round(nb));
}
console.log('scanned', diffs.length, 'frames; max', Math.max(...diffs.map(d => d[1])));
await browser.close();
