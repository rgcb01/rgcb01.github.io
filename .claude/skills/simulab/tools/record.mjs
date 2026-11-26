// node tools/record.mjs demos/<demo> [--fps=60] [--w=1500] [--t0=0] [--t1=end] [--web] [--lang=ja]
// --web: web wording (see labText in kit/ui.js), writes render/video_noaudio-web.mp4
// Frame-exact: window.frameJPEG(t) per frame, 4 pages in parallel, one mp4 per chunk, concat -c copy.
// Writes demos/<demo>/render/video_noaudio.mp4 and events.json (audio cues).
import { launch } from './browser.mjs';
import { spawn } from 'node:child_process';
import { writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const args = process.argv.slice(2), dir = resolve(args.find(a => !a.startsWith('--')) || 'demos/fig01-sonar');
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d; };
const FPS = opt('fps', 60), W = opt('w', 1500), N = 4, out = join(dir, 'render/');
const LANGQ = (args.find(a => a.startsWith('--lang=')) || '').split('=')[1] || '';
const WEB = args.includes('--web') || !!LANGQ, NAME = WEB ? 'video_noaudio-web' + (LANGQ ? '-' + LANGQ : '') : 'video_noaudio';
mkdirSync(out, { recursive: true });
// --savegl: also keep each 3D frame (poster3d) in render/gl/; --usegl: reuse them, so a second language only redraws the 2D
const SAVEGL = args.includes('--savegl'), GLDIR = out + 'gl/', USEGL = args.includes('--usegl') && existsSync(GLDIR + 'fps.txt');
const GLFPS = USEGL ? Number(readFileSync(GLDIR + 'fps.txt', 'utf8')) : FPS;
if (SAVEGL) { mkdirSync(GLDIR, { recursive: true }); writeFileSync(GLDIR + 'fps.txt', String(FPS)); }
const browser = await launch();
const open = async () => { const p = await browser.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => console.log('PAGEERROR', e.message)); await p.goto('file://' + join(dir, 'dist/index.html') + `?render&w=${W}${WEB ? '&web' : ''}${LANGQ ? '&lang=' + LANGQ : ''}`, { timeout: 180000 }); await p.waitForFunction(() => window.READY === true, null, { timeout: 180000 }); return p; };
let H = Math.round(W * 0.8);
const p0 = await open();
const ASP = await p0.evaluate(() => window.ASPECT || 0.8); if (ASP !== 0.8) { H = Math.round(W * ASP / 2) * 2; await p0.setViewportSize({ width: W, height: H }); }
const ev = await p0.evaluate(() => window.EVENTS());
if (!WEB) writeFileSync(out + 'events.json', JSON.stringify(ev));
const t0 = opt('t0', 0), t1 = Math.min(opt('t1', ev.end), ev.end), f0 = Math.round(t0 * FPS), total = Math.round(t1 * FPS) - f0;
console.log(`${t0.toFixed(2)}-${t1.toFixed(2)} s, ${total} frames @ ${FPS} fps, ${W}x${H}`);
const per = Math.ceil(total / N), clock = Date.now();
async function chunk(i, page) {
  const a = f0 + i * per, b = Math.min(f0 + total, a + per), tmp = `${out}${NAME}_chunk_${i}.part.mp4`, fin = `${out}${NAME}_chunk_${i}.mp4`;
  if (existsSync(tmp)) unlinkSync(tmp);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-f', 'mp4', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    let d;
    const cached = SAVEGL && GLFPS === FPS && existsSync(`${GLDIR}${String(f).padStart(5, '0')}.jpg`); // resume: a 3D frame kept by an earlier, interrupted run
    if (USEGL || cached) d = await page.evaluate(([t, g]) => window.frameJPEGgl(t, g, 0.92), [f / FPS, 'data:image/jpeg;base64,' + readFileSync(`${GLDIR}${String(cached ? f : Math.round(f / FPS * GLFPS)).padStart(5, '0')}.jpg`).toString('base64')]);
    else { d = await page.evaluate((t) => window.frameJPEG(t, 0.92), f / FPS); if (SAVEGL) { const g = await page.evaluate(() => window.glJPEG(0.9)); writeFileSync(`${GLDIR}${String(f).padStart(5, '0')}.jpg`, Buffer.from(g.slice(g.indexOf(',') + 1), 'base64')); } }
    if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 240 === 0) console.log(`chunk ${i}: ${f - a}/${b - a}  ${((Date.now() - clock) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  if ((await new Promise(r => ff.on('close', r))) !== 0) throw new Error('ffmpeg chunk ' + i);
  renameSync(tmp, fin); return fin;
}
const pages = [p0, ...(await Promise.all(Array.from({ length: N - 1 }, open)))];
const outs = await Promise.all(pages.map((p, i) => chunk(i, p)));
writeFileSync(out + 'list.txt', outs.map(o => `file '${o}'`).join('\n'));
await browser.close();
await new Promise((res, rej) => { const f = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', out + 'list.txt', '-c', 'copy', '-movflags', '+faststart', out + NAME + '.part.mp4'], { stdio: 'inherit' }); f.on('close', c => c === 0 ? res() : rej(new Error('concat'))); });
renameSync(out + NAME + '.part.mp4', out + NAME + '.mp4');
console.log('video ok in', ((Date.now() - clock) / 1000).toFixed(0), 's');
