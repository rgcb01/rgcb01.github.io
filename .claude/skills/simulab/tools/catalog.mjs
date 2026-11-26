// node tools/catalog.mjs  ->  CATALOGO.md, generated from the code (run it after adding or changing assets).
// Lists every asset type with its pins (probed for real), options and state keys found in its code.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { launch } from './browser.mjs';
const root = resolve(new URL('..', import.meta.url).pathname);
const FILES = ['placas', 'modulos', 'movimiento', 'componentes', 'instrumentos', 'soldadura', 'cafe', 'escena', 'materiales', 'core'];
const src = Object.fromEntries(FILES.map(f => [f, readFileSync(join(root, `assets/${f}.js`), 'utf8')]));
const header = (s) => s.split('\n').filter((l, i, a) => a.slice(0, i + 1).every(x => x.startsWith('//')))
  .map(l => l.replace(/^\/\/ ?/, '')).filter(l => !/^-+$/.test(l.trim()));
// which file defines which type, plus the code block of each definition
const defs = [];
for (const f of FILES) {
  const re = /defineAsset\((['`])(.+?)\1( \+ \w+)?/g; let m;
  while ((m = re.exec(src[f]))) defs.push({ f, pat: new RegExp('^' + m[2].replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]+\}/g, '.+') + (m[3] ? '.+' : '') + '$'), at: m.index });
}
for (const d of defs) { const nx = defs.find(e => e.f === d.f && e.at > d.at); d.block = src[d.f].slice(d.at, nx ? nx.at : undefined); }

execFileSync('node', [join(root, 'tools/build.mjs'), join(root, 'demos/catalogo')]);
const browser = await launch(), page = await browser.newPage();
await page.goto('file://' + join(root, 'demos/catalogo/dist/index.html') + '?render&w=400');
await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
const info = await page.evaluate(() => {
  const groups = [[...UNO_DIG1, ...UNO_DIG2, ...UNO_PWR, ...UNO_ANA], [...ESP_ROW_A, ...ESP_ROW_B], ['a', 'b', 'TX', 'RX']];
  const out = [];
  for (const [type, spec] of Object.entries(ASSET_TYPES)) {
    let pins = spec.pins ? Object.keys(spec.pins) : [], holes = '';
    if (spec.pinFn) {
      const inst = place(type, 'x', {});
      const ok = (n) => { try { inst.pin(n); return true; } catch { return false; } };
      const hits = groups.map(g => g.filter(ok)), best = hits.reduce((a, b) => (b.length > a.length ? b : a));
      for (const n of [...best, ...hits.flat()]) if (!pins.includes(n)) pins.push(n);
      if (ok('a1')) {
        let n = 1; while (n < 99 && ok('a' + (n + 1))) n++; holes = `huecos a1..j${n} (filas a-e y f-j, canal en medio)`;
        if (ok('t+1')) { let r = 1; while (r < 99 && ok('t+' + (r + 1))) r++; holes += `; rieles t+1..t+${r}, t-1..t-${r}, b+1..b+${r}, b-1..b-${r}`; }
      }
    }
    out.push({ type, name: spec.name || '', group: spec.group || '', pins, holes });
  }
  return { assets: out, M: Object.keys(M), WIRE: ['ROJO', 'NEGRO', 'AMARILLO', 'VERDE', 'NARANJA', 'MORADO', 'GRIS', 'BLANCO', 'CAFE', 'AZUL'].filter(k => typeof globalThis[k] !== 'undefined' || eval(`typeof ${k}`) !== 'undefined') };
});
await browser.close();

const uniq = (a) => [...new Set(a)];
const L = ['# CATÁLOGO de assets', '', '> Generado por `node tools/catalog.mjs` a partir del código. No lo edites a mano: si agregas o cambias un asset, vuelve a correr el comando.', '',
  '## Cómo se usan', '', '```js', ...header(src.core).map(l => '// ' + l), '```', '',
  'Patrón base (de `demos/blink/demo.js`):', '', '```js',
  "const bb = place('protoboard400', 'bb', { at: [5.5, 0, 0] });",
  "place('led5', 'led', { at: bb.pin('f9').p, color: 'R', litKey: 'pin13', label: 'LED ROJO', code: \"led('f9', 'f10', ROJO);\" })",
  "cable('cable_d13', ['uno', 'D13'], ['bb', 'j14'], NARANJA, { label: 'D13', code: \"cable(uno.D13, 'j14', NARANJA);\" })",
  'resolveCables(insts)   // calcula la ruta de cada cable (arco + conectores dupont)', '```', '',
  '- `at`: posición en cm (x adelante, y izquierda, z arriba). `rot`: radianes.',
  '- `label`: etiqueta en pantalla. `code`: la línea que aparece en la pestaña de armado. `group`: capa de dibujo.',
  '- Opciones de cable `o`: `via`, `lift`, `lead`, `hl`, `w`, `glowKey`, `points`, `ends` (ver `assets/core.js`).', ''];
for (const f of FILES.filter(f => !['core', 'materiales', 'escena'].includes(f)).concat('escena')) {
  L.push(`## ${f}.js`, '', ...header(src[f]).map(l => '    ' + l), '');
  const rows = info.assets.filter(a => defs.some(d => d.f === f && d.pat.test(a.type)));
  if (!rows.length) continue;
  L.push('| type | nombre | grupo | pines | opts / st que lee |', '|---|---|---|---|---|');
  for (const a of rows) {
    const d = defs.find(d => d.f === f && d.pat.test(a.type));
    const opts = uniq([...d.block.matchAll(/opts\.(\w+)/g)].map(m => 'opts.' + m[1])), st = uniq([...d.block.matchAll(/\bst\.(\w+)/g)].map(m => 'st.' + m[1]));
    const pins = a.holes ? a.holes + (a.pins.length ? '; ' + a.pins.join(', ') : '') : a.pins.join(', ') || '(sin pines)';
    L.push(`| \`${a.type}\` | ${a.name.replace(/\|/g, '/')} | ${a.group} | ${pins} | ${[...opts, ...st].join(', ') || ''} |`);
  }
  L.push('');
}
L.push('## Materiales (`M.*`)', '', info.M.map(k => '`' + k + '`').join(', '), '', '## Colores de cable', '', info.WIRE.map(k => '`' + k + '`').join(', '), '');
L.push('## Funciones de escena y kit', '');
for (const f of ['assets/escena.js', 'assets/instrumentos.js', 'assets/soldadura.js', 'kit/engine.js', 'kit/story.js', 'kit/ui.js']) {
  const s = readFileSync(join(root, f), 'utf8');
  L.push(`- **${f}**: ` + [...s.matchAll(/^function (\w+)\(([^)]*)\)/gm)].map(m => `\`${m[1]}(${m[2]})\``).join(', '));
}
writeFileSync(join(root, 'CATALOGO.md'), L.join('\n') + '\n');
console.log('CATALOGO.md:', info.assets.length, 'assets');
