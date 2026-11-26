// node tools/sticker.mjs <tipo> [<tipo> ...] [--zoom=30] [--rot=0.4]  ->  stickers/<tipo>.png
// One asset alone with its indigo shadow on a transparent background, to use as art outside the demos
// (handy around a lab on a web page). They stay in stickers/ so the next time nothing is redrawn.
// Types: the ids in CATALOGO.md (multimetro, taza, pila9v, servoSG90, hcsr04, uno, led5...).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { launch } from './browser.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2), flag = (k, d) => Number((args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || d);
const types = args.filter(a => !a.startsWith('--'));
if (!types.length) { console.log('uso: node tools/sticker.mjs taza pila9v [--zoom=30] [--rot=0]'); process.exit(1); }
const core = ['kit/engine.js', 'assets/materiales.js', 'assets/core.js', 'assets/placas.js', 'assets/modulos.js', 'assets/movimiento.js', 'assets/componentes.js', 'assets/instrumentos.js', 'assets/soldadura.js', 'assets/escena.js', 'kit/ui.js', 'kit/story.js', 'kit/sticker.js'];
const fonts = [['JetBrains Mono', 400, 'jetbrains-mono-latin-400-normal.woff2'], ['JetBrains Mono', 700, 'jetbrains-mono-latin-700-normal.woff2'], ['Silkscreen', 700, 'silkscreen-latin-700-normal.woff2'], ['Caveat', 700, 'caveat-latin-700-normal.woff2']]
  .map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(join(root, 'kit/fonts', f)).toString('base64')}) format('woff2');}`).join('\n');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${fonts}</style></head><body><script>\n${core.map(f => `// ==== ${f}\n${readFileSync(join(root, f), 'utf8')}`).join('\n')}\n</script></body></html>`;
mkdirSync(join(root, 'stickers'), { recursive: true });
const page = join(root, 'stickers', '.sticker.html');
writeFileSync(page, html);
const b = await launch(), p = await b.newPage();
await p.goto(`file://${page}`);
await p.evaluate(() => Promise.all(['700 20px "JetBrains Mono"', '400 20px "JetBrains Mono"', '700 40px Silkscreen', '700 30px Caveat'].map(f => document.fonts.load(f))));
for (const t of types) {
  const url = await p.evaluate(([type, zoom, rot]) => window.sticker(type, { zoom, rot }), [t, flag('zoom', 30), flag('rot', 0)]);
  writeFileSync(join(root, 'stickers', `${t}.png`), Buffer.from(url.split(',')[1], 'base64'));
  console.log(`stickers/${t}.png`);
}
await b.close();
