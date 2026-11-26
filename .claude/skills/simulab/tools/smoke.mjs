// node tools/smoke.mjs <abs path to demos/<demo>> ["&web" | "&lang=es"]: loads dist/index.html and seeks a few times; prints page errors. Cheap check before a render.
import { launch } from './browser.mjs';
const b = await launch(); const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + process.argv[2] + '/dist/index.html?render&w=360' + (process.argv[3] || ''), { timeout: 180000 });
await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
for (const t of [1, 5, 8, 11, 13.5, 16, 18.5, 21, 24.5]) await p.evaluate((t) => window.seek(t), t);
console.log('ok', process.argv[2].split('/').pop(), process.argv[3] || '');
await b.close();
