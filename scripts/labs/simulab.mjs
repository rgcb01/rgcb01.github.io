// SimuLab bridge for Interactive Labs: stages a lab's SimuLab source, wraps its shared ES-module model into a
// classic script, and runs the vendored skill tools (.claude/skills/simulab).
//
//   node scripts/labs/simulab.mjs <slug> build                 -> public/assets/labs/<slug>/explainer.html
//   node scripts/labs/simulab.mjs <slug> stills [t1 t2 ...]    -> exports/labs/<slug>/stills.jpg (review sheet)
//   node scripts/labs/simulab.mjs <slug> video [--preview]     -> exports/labs/<slug>/<slug>[-preview].mp4
//
// A lab opts in by having src/labs/<slug>/simulab/demo.json. "model.gen.js" in its "files" list is generated
// from src/labs/<slug>/model.js and exposed as a global named by "modelGlobal" (default ORL).
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SKILL = join(ROOT, '.claude/skills/simulab');

export function chromeEnv() {
  // The skill's tools honour CHROME_PATH. Point them at an installed Chrome/Chromium so a Playwright version
  // mismatch between the skill and the machine never forces a browser download.
  if (process.env.CHROME_PATH) return process.env;
  const candidates = ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const base of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', join(process.env.HOME || '', '.cache/ms-playwright')].filter(Boolean)) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base).filter(n => /^chromium-\d+$/.test(n)).sort().reverse())
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) candidates.push(join(base, d, sub));
  }
  const found = candidates.find(p => existsSync(p));
  return found ? { ...process.env, CHROME_PATH: found } : process.env;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: chromeEnv(), ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.status})`);
}

// export const / export function at top level -> one IIFE returning those names
export function wrapModel(source, globalName) {
  const names = [...source.matchAll(/^export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  if (/^export\s+(?!const|function)/m.test(source) || /^import\s/m.test(source)) throw new Error('model.js must only use top-level `export const` / `export function` and no imports');
  const body = source.replace(/^export\s+/gm, '');
  return `// GENERATED from model.js by scripts/labs/simulab.mjs. Do not edit.\nconst ${globalName} = (() => {\n${body}\nreturn { ${names.join(', ')} };\n})();\n`;
}

export function stage(slug) {
  const src = join(ROOT, 'src/labs', slug, 'simulab');
  if (!existsSync(join(src, 'demo.json'))) throw new Error(`${slug} has no SimuLab source (src/labs/${slug}/simulab/demo.json)`);
  if (!existsSync(join(SKILL, 'node_modules/playwright'))) throw new Error('SimuLab dependencies missing: run `npm run labs:setup`');
  const dir = join(ROOT, 'exports/.simulab', slug);
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(src)) cpSync(join(src, f), join(dir, f), { recursive: true });
  const meta = JSON.parse(readFileSync(join(src, 'demo.json'), 'utf8'));
  if (meta.files.includes('model.gen.js')) writeFileSync(join(dir, 'model.gen.js'), wrapModel(readFileSync(join(ROOT, 'src/labs', slug, 'model.js'), 'utf8'), meta.modelGlobal || 'ORL'));
  return dir;
}

export function buildExplainer(slug) {
  const dir = stage(slug);
  run('node', [join(SKILL, 'tools/build.mjs'), dir]);
  const out = join(ROOT, 'public/assets/labs', slug);
  mkdirSync(out, { recursive: true });
  copyFileSync(join(dir, 'dist/index.html'), join(out, 'explainer.html'));
  console.log(`explainer -> public/assets/labs/${slug}/explainer.html`);
  return dir;
}

async function writeEvents(dir) {
  // record.mjs skips events.json for translated renders, so read the audio cues straight from the page.
  process.env.CHROME_PATH = chromeEnv().CHROME_PATH || '';
  const { launch } = await import(join(SKILL, 'tools/browser.mjs'));
  const b = await launch(), p = await b.newPage();
  await p.goto('file://' + join(dir, 'dist/index.html') + '?render&lang=en');
  await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  writeFileSync(join(dir, 'render/events.json'), JSON.stringify(await p.evaluate(() => window.EVENTS())));
  await b.close();
}

export async function renderVideo(slug, { preview = false } = {}) {
  const dir = buildExplainer(slug), R = join(dir, 'render');
  rmSync(R, { recursive: true, force: true }); mkdirSync(R, { recursive: true });
  const fps = preview ? 30 : 60, w = preview ? 750 : 1500;
  run('node', [join(SKILL, 'tools/record.mjs'), dir, '--lang=en', `--fps=${fps}`, `--w=${w}`]);
  renameSync(join(R, 'video_noaudio-web-en.mp4'), join(R, 'video_noaudio.mp4'));
  await writeEvents(dir);
  run('python3', [join(SKILL, 'tools/audio.py'), dir]);
  const name = preview ? `${slug}-preview` : slug;
  run('python3', [join(SKILL, 'tools/master.py'), dir, name]);
  const out = join(ROOT, 'exports/labs', slug);
  mkdirSync(out, { recursive: true });
  copyFileSync(join(R, `${name}.mp4`), join(out, `${name}.mp4`));
  console.log(`video -> exports/labs/${slug}/${name}.mp4`);
  return join(out, `${name}.mp4`);
}

export function stills(slug, times) {
  const dir = buildExplainer(slug);
  run('node', [join(SKILL, 'tools/stills.mjs'), dir, '--w=640', '--cols=3', ...(times.length ? times : ['3', '9', '14', '19', '24', '29', '33', '36', '40'])]);
  const out = join(ROOT, 'exports/labs', slug);
  mkdirSync(out, { recursive: true });
  copyFileSync(join(dir, 'shots/sheet.jpg'), join(out, 'stills.jpg'));
  console.log(`stills -> exports/labs/${slug}/stills.jpg`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [slug, cmd = 'build', ...rest] = process.argv.slice(2);
  if (!slug) { console.error('usage: node scripts/labs/simulab.mjs <slug> build|stills|video [--preview]'); process.exit(1); }
  if (cmd === 'build') buildExplainer(slug);
  else if (cmd === 'stills') stills(slug, rest);
  else if (cmd === 'video') await renderVideo(slug, { preview: rest.includes('--preview') });
  else { console.error(`unknown command ${cmd}`); process.exit(1); }
}
