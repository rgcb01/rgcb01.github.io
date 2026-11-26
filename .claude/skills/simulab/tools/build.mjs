// node tools/build.mjs demos/<demo>  ->  demos/<demo>/dist/index.html (one standalone page)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname), dir = resolve(process.argv[2] || 'demos/fig01-sonar');
const meta = JSON.parse(readFileSync(join(dir, 'demo.json'), 'utf8'));
const r = (p) => readFileSync(join(root, p), 'utf8');
if (meta.kit === 'poster3d') { // A4 "HOW IT WORKS" poster with live three.js (kit3d/)
  const f3 = [['Inter', 400, 'inter-latin-400-normal.woff2'], ['Inter', 500, 'inter-latin-500-normal.woff2'], ['Inter', 600, 'inter-latin-600-normal.woff2'], ['JetBrains Mono', 400, 'jetbrains-mono-latin-400-normal.woff2'], ['JetBrains Mono', 700, 'jetbrains-mono-latin-700-normal.woff2']]
    .map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${readFileSync(join(root, 'kit/fonts', f)).toString('base64')}) format('woff2');}`).join('\n');
  const p3 = [['kit3d/vendor/three-kit.min.js', r('kit3d/vendor/three-kit.min.js')], ['kit3d/scene.js', r('kit3d/scene.js')], ['kit3d/parts.js', r('kit3d/parts.js')], ['kit3d/poster.js', r('kit3d/poster.js')], ...meta.files.map(f => [`${dir.split('/').pop()}/${f}`, readFileSync(join(dir, f), 'utf8')]), ['kit3d/main.js', r('kit3d/main.js')]];
  const html3 = r('kit3d/index.html').replace('/*FONTS*/', f3).replace('/*SCRIPTS*/', () => p3.map(([n, s]) => `// ==== ${n}\n${s}`).join('\n')).replace('__TITLE__', meta.title).replace('__NOTE__', (meta.note || '').replace(/--/g, '-'));
  mkdirSync(join(dir, 'dist'), { recursive: true }); writeFileSync(join(dir, 'dist/index.html'), html3);
  console.log(join(dir, 'dist/index.html'), (html3.length / 1024).toFixed(0) + ' KB'); process.exit(0);
}
const fonts = [['JetBrains Mono', 400, 'jetbrains-mono-latin-400-normal.woff2'], ['JetBrains Mono', 700, 'jetbrains-mono-latin-700-normal.woff2'], ['Silkscreen', 700, 'silkscreen-latin-700-normal.woff2'], ['Caveat', 700, 'caveat-latin-700-normal.woff2']]
  .map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${readFileSync(join(root, 'kit/fonts', f)).toString('base64')}) format('woff2');}`).join('\n');
const core = ['kit/engine.js', 'kit/i18n.js', 'kit/i18n.dict.a.js', 'kit/i18n.dict.b.js', 'assets/materiales.js', 'assets/core.js', 'assets/placas.js', 'assets/modulos.js', 'assets/movimiento.js', 'assets/componentes.js', 'assets/instrumentos.js', 'assets/soldadura.js', 'assets/escena.js', 'kit/ui.js', 'kit/story.js'];
const extra = readdirSync(join(root, 'assets')).filter(f => f.endsWith('.js') && !core.includes('assets/' + f)).sort().map(f => 'assets/' + f);
core.splice(core.indexOf('kit/ui.js'), 0, ...extra);
const parts = [...core.map(f => [f, r(f)]), ...meta.files.map(f => [`${dir.split('/').pop()}/${f}`, readFileSync(join(dir, f), 'utf8')]), ['kit/main.js', r('kit/main.js')]];
const scripts = parts.map(([n, s]) => `// ==== ${n}\n${s}`).join('\n');
const html = r('kit/index.html').replace('/*FONTS*/', fonts).replace('/*SCRIPTS*/', () => scripts).replace('__TITLE__', meta.title).replace('__NOTE__', meta.note || '');
mkdirSync(join(dir, 'dist'), { recursive: true });
writeFileSync(join(dir, 'dist/index.html'), html);
console.log(join(dir, 'dist/index.html'), (html.length / 1024).toFixed(0) + ' KB');
