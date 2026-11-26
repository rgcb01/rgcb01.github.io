// node tools/new-demo.mjs <folder> "<TITLE>" <num>  ->  copies the Blink template into <folder> (relative to where you run it)
// Example, from your project folder: node ~/.claude/skills/simulab/tools/new-demo.mjs labs/lab01-tren "TREN" 01
import { cpSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [name, title = 'NUEVO', num = '01'] = process.argv.slice(2);
if (!name) { console.log('uso / usage: node tools/new-demo.mjs labs/lab01-tren "TREN" 01'); process.exit(1); }
const root = resolve(new URL('..', import.meta.url).pathname), dst = resolve(process.cwd(), name);
if (existsSync(dst)) { console.log('ya existe / already exists:', dst); process.exit(1); }
cpSync(join(root, 'demos/blink'), dst, { recursive: true });
for (const d of ['dist', 'shots', 'render', 'cover.jpg']) rmSync(join(dst, d), { recursive: true, force: true });
const f = join(dst, 'demo.js');
writeFileSync(f, readFileSync(f, 'utf8').replace("brand: 'KAPRI LAB',", "brand: 'SIMULAB',").replace(/KAPRI LAB · BLINK · LAB 00/g, `SIMULAB · ${title} · LAB ${num}`)
  .replace("title: 'BLINK'", `title: '${title}'`).replace("num: '00'", `num: '${num}'`).replace("'LAB 00 · BLINK'", `'LAB ${num} · ${title}'`));
const j = join(dst, 'demo.json'); const m = JSON.parse(readFileSync(j, 'utf8'));
m.title = `SIMULAB · Lab ${num} · ${title}`; m.note = 'Datos (con fuente) y supuestos del modelo. / Data (with sources) and model assumptions.'; writeFileSync(j, JSON.stringify(m, null, 2));
console.log('listo / ready:', dst, `\nnode ${join(root, 'tools/build.mjs')} ${name}`);
