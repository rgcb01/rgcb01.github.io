// Validates every Interactive Lab: registry fields, required content (math, limitations, references),
// published assets, model checks, and (with --dist, after `npm run build`) the crawler HTML of each route.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { labDomains, labs, labsIndexMeta, labPath } from '../../src/labs/registry.js';
import { siteMeta } from '../../src/data/portfolio.js';

const required = ['slug', 'number', 'title', 'subtitle', 'question', 'summary', 'bigIdea', 'domains', 'level', 'published', 'updated', 'status', 'socialImage', 'source', 'load', 'loadContent', 'page'];
const pageKeys = ['simTitle', 'simIntro', 'explainerTitle', 'explainerIntro', 'explainerSize', 'explainerCredit', 'mathTitle', 'reproduce', 'checks'];
const slugs = new Set(), numbers = new Set();
for (const lab of labs) {
  for (const key of required) assert(lab[key] !== undefined && lab[key] !== '', `${lab.slug || '?'}: missing ${key}`);
  for (const key of pageKeys) assert(lab.page[key] !== undefined, `${lab.slug}: page.${key} missing`);
  for (const cmd of lab.page.checks) assert(existsSync(cmd.split(' ')[1]), `${lab.slug}: check script ${cmd} not found`);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lab.slug), `${lab.slug}: slug must be kebab-case (it is the shareable URL)`);
  assert(!slugs.has(lab.slug) && !numbers.has(lab.number), `${lab.slug}: duplicate slug or number`);
  slugs.add(lab.slug); numbers.add(lab.number);
  assert(['published', 'draft'].includes(lab.status), `${lab.slug}: status must be published or draft`);
  assert(lab.domains.length && lab.domains.every(d => labDomains.some(x => x.id === d)), `${lab.slug}: unknown domain`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(lab.published) && lab.updated >= lab.published, `${lab.slug}: dates must be YYYY-MM-DD and updated >= published`);
  assert(existsSync(join('src/labs', lab.slug, 'model.js')), `${lab.slug}: src/labs/${lab.slug}/model.js missing (one model drives every number)`);

  const content = await lab.loadContent();
  assert(content.mathSections?.length >= 1, `${lab.slug}: needs a mathematical explanation`);
  assert(content.limitations?.length >= 3, `${lab.slug}: document at least three model limitations`);
  assert(content.references?.length >= 2, `${lab.slug}: cite at least two references`);
  for (const r of content.references) {
    assert(r.authors && r.year && r.title && r.source, `${lab.slug}: reference ${r.id} incomplete`);
    assert(r.doi || r.url, `${lab.slug}: reference ${r.id} needs a DOI or a URL`);
    if (r.doi) assert(/^10\.\d{4,9}\/\S+$/.test(r.doi), `${lab.slug}: reference ${r.id} has a malformed DOI`);
  }
  const ui = readFileSync(join('src/labs', lab.slug, 'Lab.jsx'), 'utf8');
  assert(/export function Simulation\b/.test(ui) && /export function ShareFigure\b/.test(ui), `${lab.slug}: Lab.jsx must export Simulation and ShareFigure`);

  if (lab.status === 'published') {
    assert(existsSync(join('public', lab.socialImage)), `${lab.slug}: ${lab.socialImage} missing (npm run labs:publish -- ${lab.slug})`);
    if (lab.explainer) assert(existsSync(join('public', lab.explainer)), `${lab.slug}: ${lab.explainer} missing (npm run labs:explainer -- ${lab.slug} build)`);
  }
  if (existsSync(join('src/labs', lab.slug, 'simulab/demo.json'))) {
    const meta = JSON.parse(readFileSync(join('src/labs', lab.slug, 'simulab/demo.json'), 'utf8'));
    for (const f of meta.files) if (!f.endsWith('.gen.js')) assert(existsSync(join('src/labs', lab.slug, 'simulab', f)), `${lab.slug}: SimuLab file ${f} missing`);
  }
}
assert(existsSync(join('public', labsIndexMeta.socialImage)), `${labsIndexMeta.socialImage} missing (npm run labs:publish -- index)`);

// model checks: every scripts/labs/check-*.mjs must pass
for (const f of readdirSync('scripts/labs').filter(n => /^check-.*\.mjs$/.test(n))) {
  const r = spawnSync(process.execPath, [join('scripts/labs', f)], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${f} failed:\n${r.stdout}${r.stderr}`);
}

if (process.argv.includes('--dist')) {
  const routes = [labsIndexMeta.path, ...labs.filter(l => l.status === 'published').map(labPath)];
  for (const route of routes) {
    const file = join('dist', route, 'index.html');
    assert(existsSync(file), `${route}: dist HTML missing (copy-404 route)`);
    const html = readFileSync(file, 'utf8');
    assert(html.includes(`<link rel="canonical" href="${siteMeta.siteUrl}${route}"`), `${route}: wrong canonical`);
    for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) assert(new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]+"`).test(html), `${route}: missing ${property}`);
    const image = html.match(/property="og:image"\s+content="([^"]+)"/)[1].replace(siteMeta.siteUrl, '');
    assert(existsSync(join('dist', image)), `${route}: og:image ${image} not in dist`);
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema['@type'], route === labsIndexMeta.path ? 'CollectionPage' : 'LearningResource', `${route}: structured data type`);
  }
  console.log(`Lab build validation passed: ${routes.length} routes with canonical, Open Graph image and structured data.`);
}
console.log(`Labs validation passed: ${labs.length} lab(s), content, references, assets and model checks.`);
