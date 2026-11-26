// Publication assets for Interactive Labs, rendered from the site itself so they always match the lab.
//
//   npm run labs:publish -- <slug> [--video] [--preview] [--no-build]
//   npm run labs:publish -- index                         (the /labs Open Graph image)
//
// Writes:
//   public/assets/labs/<slug>/og.png                      1200 x 630  Open Graph image (committed, used by the site)
//   exports/labs/<slug>/<slug>-linkedin.png               1080 x 1350 LinkedIn image post
//   exports/labs/<slug>/<slug>-x.png                      1600 x 900  X image post
//   exports/labs/<slug>/post.md                           draft post text for LinkedIn and X
//   with --video (needs the SimuLab source, ffmpeg, Python numpy/scipy):
//   exports/labs/<slug>/<slug>.mp4                        1500 x 1200 master explainer video with sound
//   exports/labs/<slug>/<slug>-linkedin-1080x1350.mp4     LinkedIn native video
//   exports/labs/<slug>/<slug>-x-1920x1080.mp4            X native video
// --preview renders the video at 750 px / 30 fps (about 4x faster) for checking before the final render.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARD_FORMATS } from '../../src/labs/cards.js';
import { findLab, labPath } from '../../src/labs/registry.js';
import { siteMeta } from '../../src/data/portfolio.js';
import { SKILL, chromeEnv, renderVideo } from './simulab.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), target = args.find(a => !a.startsWith('--'));
const flag = f => args.includes(`--${f}`);
if (!target) { console.error('usage: npm run labs:publish -- <slug>|index [--video] [--preview] [--no-build]'); process.exit(1); }
const lab = target === 'index' ? null : findLab(target);
if (target !== 'index' && !lab) { console.error(`unknown lab: ${target}`); process.exit(1); }

const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: ROOT }); if (r.status !== 0) throw new Error(`${cmd} ${a.join(' ')} failed`); };

async function withPreview(fn) {
  const port = 4400 + Math.floor(Math.random() * 400);
  const srv = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((ok, fail) => { const t = setTimeout(() => fail(new Error('vite preview did not start')), 30000); srv.stdout.on('data', d => { if (String(d).includes(String(port))) { clearTimeout(t); ok(); } }); });
  try { return await fn(`http://localhost:${port}`); } finally { srv.kill(); }
}

async function browser() {
  const env = chromeEnv();
  const { chromium } = await import(pathToFileURL(join(SKILL, 'node_modules/playwright/index.mjs')).href);
  return chromium.launch({ executablePath: env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
}

async function capture(b, base, path, format, out) {
  const spec = CARD_FORMATS[format];
  const page = await b.newPage({ viewport: { width: spec.w, height: spec.h }, deviceScaleFactor: 1 });
  await page.goto(`${base}${path}/card?format=${format}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.CARD_READY === true, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: spec.w, height: spec.h } });
  await page.close();
  console.log(`${format.padEnd(15)} ${spec.w}x${spec.h} -> ${out.replace(ROOT + '/', '')}`);
}

function postText(lab, content) {
  const refs = content.references.length, limits = content.limitations.slice(0, 3).map(l => l.title.charAt(0).toLowerCase() + l.title.slice(1)).join('; ');
  const url = `${siteMeta.siteUrl}${labPath(lab)}`;
  return `# Post drafts: ${lab.title}

Edit before posting. Numbers below come from the lab's model; the lab page has the sources.

## LinkedIn

${lab.question}

New interactive lab: ${lab.title}, ${lab.subtitle.charAt(0).toLowerCase()}${lab.subtitle.slice(1)}.

${lab.summary}

The big idea: ${lab.bigIdea}

Every figure comes from one documented model. The page includes the math, ${refs} cited references and an explicit list of what the model leaves out (${limits}; and more).

Try it: ${url}

#Lithography #Semiconductors #Optics #Physics #EngineeringEducation

## X

${lab.question} A lens can only image the diffraction orders it catches.

Interactive lab, with the math, sources and model limits:
${url}

## Attachments

- Image post: ${lab.slug}-linkedin.png (LinkedIn, 1080x1350), ${lab.slug}-x.png (X, 1600x900)
- Video: ${lab.slug}-linkedin-1080x1350.mp4 (LinkedIn), ${lab.slug}-x-1920x1080.mp4 (X)
- Link previews use public/assets/labs/${lab.slug}/og.png automatically.
`;
}

function composite(master, framePng, format, out) {
  const { slot } = CARD_FORMATS[format];
  // SimuLab master: 1600 x 1280 stage scaled to the video width; the paper card interior is x 48, y 48, 1504 x 1184.
  const vf = `[1:v]crop=trunc(iw*1504/1600):trunc(ih*1184/1280):trunc(iw*48/1600):trunc(ih*48/1280),scale=${slot.w}:${slot.h}:flags=lanczos[v];[0:v][v]overlay=${slot.x}:${slot.y}:shortest=1,format=yuv420p[o]`;
  run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-i', framePng, '-i', master, '-filter_complex', vf, '-map', '[o]', '-map', '1:a', '-r', '30',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out]);
  console.log(`${format.padEnd(15)} -> ${out.replace(ROOT + '/', '')}`);
}

if (!flag('no-build')) run('npm', ['run', 'build']);
const exportsDir = join(ROOT, 'exports/labs', lab ? lab.slug : 'index');
mkdirSync(exportsDir, { recursive: true });
const master = lab && flag('video') ? await renderVideo(lab.slug, { preview: flag('preview') }) : null;

await withPreview(async base => {
  const b = await browser();
  try {
    if (!lab) {
      mkdirSync(join(ROOT, 'public/assets/labs'), { recursive: true });
      await capture(b, base, '/labs', 'og', join(ROOT, 'public/assets/labs/labs-og.png'));
      return;
    }
    const pub = join(ROOT, 'public/assets/labs', lab.slug);
    mkdirSync(pub, { recursive: true });
    await capture(b, base, labPath(lab), 'og', join(pub, 'og.png'));
    await capture(b, base, labPath(lab), 'linkedin', join(exportsDir, `${lab.slug}-linkedin.png`));
    await capture(b, base, labPath(lab), 'x', join(exportsDir, `${lab.slug}-x.png`));
    writeFileSync(join(exportsDir, 'post.md'), postText(lab, await lab.loadContent()));
    if (master) {
      const sfx = flag('preview') ? '-preview' : '';
      for (const [format, name] of [['video-linkedin', `${lab.slug}-linkedin-1080x1350${sfx}.mp4`], ['video-x', `${lab.slug}-x-1920x1080${sfx}.mp4`]]) {
        const frame = join(exportsDir, `.${format}-frame.png`);
        await capture(b, base, labPath(lab), format, frame);
        composite(master, frame, format, join(exportsDir, name));
      }
    }
  } finally { await b.close(); }
});
if (lab && existsSync(join(ROOT, 'public/assets/labs', lab.slug, 'og.png'))) console.log('Rebuild (npm run build) so dist/ picks up the refreshed og.png.');
