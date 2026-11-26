// node tools/cover.mjs [demos/<demo> ...]  ->  demos/<demo>/cover.jpg (1200x630, for link previews on X)
// Frame time: "cover" in demo.json (video seconds), else 40 % of the video. Commit the jpg if your host has no browser.
// Crop: only the inside of the paper card (no dark frame at the edges). "coverY" in demo.json moves the band (stage px, default 120).
// Only the drawing: no plate, badge, chips, bays or tip cards, and the web wording (?web).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, basename } from 'node:path';
import { launch } from './browser.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const demos = args.length ? args.map(a => basename(a)) : readdirSync(join(root, 'demos')).filter(d => d !== 'catalogo' && existsSync(join(root, 'demos', d, 'demo.json')));
const b = await launch(), p = await b.newPage();
for (const d of demos) {
  execFileSync('node', [join(root, 'tools/build.mjs'), join(root, 'demos', d)], { stdio: 'ignore' });
  const meta = JSON.parse(readFileSync(join(root, 'demos', d, 'demo.json'), 'utf8'));
  await p.goto(`file://${join(root, 'demos', d, 'dist/index.html')}?render&web&w=1920`, { timeout: 180000 });
  await p.waitForFunction(() => window.READY === true);
  const url = await p.evaluate(async ([tc, cy]) => {
    for (const f of ['drawPlate', 'drawSpeedBadge', 'drawChips', 'drawHandle', 'tipCard', 'bayPiezas']) if (typeof window[f] === 'function') window[f] = () => {};
    DEMO.drawBays = () => {};
    const t = tc ?? window.DURATION() * 0.4, img = new Image();
    img.src = window.frameJPEG(t, 0.95); await img.decode();
    const k = img.width / STAGE.w, sx = (CARD.x + 16) * k, sw = (CARD.w - 32) * k, sh = sw * 630 / 1200;
    const sy = Math.min(Math.max((CARD.y + 16) * k, cy * k), img.height - (CARD.y + 16) * k - sh);
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 630);
    return c.toDataURL('image/jpeg', 0.86);
  }, [meta.cover ?? null, meta.coverY ?? 120]);
  writeFileSync(join(root, 'demos', d, 'cover.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log(`demos/${d}/cover.jpg`);
}
await b.close();
