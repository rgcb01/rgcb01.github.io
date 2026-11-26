// node tools/steps.mjs demos/<lab> --mode=grey --t0=33 --t1=33 --az0=-20 --az1=20 --n=72 --fps=24 --w=1080 [--anim] [--out=name]
// The 3D view alone (no poster) as a short MP4: one modelling stage of a poster3d lab, for tutorials and articles.
//   --mode  ''(final) | block (big shapes, clay) | grey (all detail, clay) | wire (mesh lines) | closed (cutaways closed)
//   --t0/--t1  lab time swept over the clip (same value = frozen; 0 -> 1.3 = the build-in)
//   --az0/--az1  camera turn in degrees across the clip; --anim keeps flows and motion (off by default for stages)
// -> demos/<lab>/render/steps/<out or mode>.mp4 (white background, H.264)
import { launch } from './browser.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2), dir = resolve(args.find(a => !a.startsWith('--')));
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const mode = opt('mode', ''), t0 = +opt('t0', 33), t1 = +opt('t1', opt('t0', 33)), az0 = +opt('az0', 0), az1 = +opt('az1', 0);
const N = +opt('n', 72), FPS = +opt('fps', 24), W = +opt('w', 1080), anim = args.includes('--anim'), name = opt('out', mode || 'final');
const out = join(dir, 'render/steps'), tmp = join(out, `_${name}`); mkdirSync(tmp, { recursive: true });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('file://' + join(dir, 'dist/index.html') + `?render&w=${W}${mode ? '&mode=' + mode : ''}`, { timeout: 180000 });
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const ease = (x) => x * x * (3 - 2 * x);
for (let i = 0; i < N; i++) {
  const u = N > 1 ? i / (N - 1) : 0, t = t0 + (t1 - t0) * u, az = az0 + (az1 - az0) * ease(u);
  const d = await page.evaluate(([t, az, anim]) => window.glShot(t, az, anim, 0.93), [t, az, anim]);
  writeFileSync(join(tmp, `${String(i).padStart(4, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  if (i % 12 === 0) process.stdout.write(`${name} ${i}/${N}\n`);
}
await browser.close();
const file = join(out, `${name}.mp4`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(tmp, '%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '19', '-preset', 'veryfast', '-movflags', '+faststart', file]);
rmSync(tmp, { recursive: true, force: true });
console.log('wrote', file);
