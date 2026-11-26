// node tools/stills.mjs demos/<demo> [--w=640] [--cols=3] [--full] t1 t2 ...
// -> demos/<demo>/shots/sheet.jpg (one small contact sheet = cheap to review), --full also writes f_<t>.jpg at 1600 px
import { launch } from './browser.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2), dir = resolve(args.find(a => !a.startsWith('--') && isNaN(Number(a))) || 'demos/fig01-sonar');
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d; };
const W = opt('w', 640), COLS = opt('cols', 3), full = args.includes('--full');
const times = args.filter(a => !a.startsWith('--') && !isNaN(Number(a))).map(Number);
mkdirSync(join(dir, 'shots'), { recursive: true });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1280 } });
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + join(dir, 'dist/index.html') + `?render&w=${full ? 1600 : W}`, { timeout: 180000 });
await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 }).catch(() => {});
const dur = await page.evaluate(() => window.DURATION && window.DURATION());
console.log('duration', dur && dur.toFixed(2));
const sheet = await page.evaluate(async ([times, W, COLS, full]) => {
  const H = Math.round(W * (window.ASPECT || 0.8)), rows = Math.ceil(times.length / COLS), sc = document.createElement('canvas');
  sc.width = W * COLS; sc.height = H * rows; const sx = sc.getContext('2d'); const src = document.getElementById('stage'); const fulls = [];
  times.forEach((t, i) => { window.seek(t); sx.drawImage(src, (i % COLS) * W, Math.floor(i / COLS) * H, W, H); sx.fillStyle = '#000a'; sx.fillRect((i % COLS) * W, Math.floor(i / COLS) * H, 70, 22); sx.fillStyle = '#fff'; sx.font = '700 14px monospace'; sx.fillText(t.toFixed(1) + ' s', (i % COLS) * W + 6, Math.floor(i / COLS) * H + 16); if (full) fulls.push(src.toDataURL('image/jpeg', 0.9)); });
  return { sheet: sc.toDataURL('image/jpeg', 0.85), fulls };
}, [times, W, COLS, full]);
writeFileSync(join(dir, 'shots/sheet.jpg'), Buffer.from(sheet.sheet.split(',')[1], 'base64'));
sheet.fulls.forEach((d, i) => writeFileSync(join(dir, `shots/f_${times[i].toFixed(2)}.jpg`), Buffer.from(d.split(',')[1], 'base64')));
console.log('wrote', join(dir, 'shots/sheet.jpg'), errs.length ? '\nERRORS: ' + [...new Set(errs)].join(' | ') : '');
await browser.close();
