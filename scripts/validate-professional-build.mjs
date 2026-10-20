import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { siteMeta, profile } from '../src/data/portfolio.js';
import { caseStudies } from '../src/data/caseStudies.js';

// Inspect emitted files, not the React metadata updates: social crawlers need HTML.
for (const study of [null, ...caseStudies]) {
  const route = study ? `/projects/${study.slug}` : '/';
  const html = readFileSync(join('dist', route, 'index.html'), 'utf8');
  assert(html.includes(`<link rel="canonical" href="${siteMeta.siteUrl}${route}"`), `${route}: wrong canonical`);
  assert(html.includes(study ? study.title : profile.role), `${route}: missing professional metadata`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    assert(new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]+"`).test(html), `${route}: missing ${property}`);
  }
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'], study ? 'SoftwareSourceCode' : 'Person');
  assert.equal(study ? schema.author.worksFor.name : schema.worksFor.name, profile.employer);
  assert(existsSync(join('dist', siteMeta.socialImage)), 'Missing raster social preview');
}
for (const route of ['personal', 'personal/gaming', 'personal/trophies', 'personal/media', 'personal/activity', 'personal/thoughts', 'personal/builds', 'personal/system']) {
  const html = readFileSync(join('dist', route, 'index.html'), 'utf8');
  assert(html.includes(`href="${siteMeta.siteUrl}/${route}"`), `${route}: missing direct-route canonical`);
  assert(!html.includes('application/ld+json'), `${route}: professional schema leaked to personal console`);
}
assert(existsSync('dist/404.html'), 'GitHub Pages fallback missing');
console.log('Professional build validation passed: crawler metadata, structured data, social asset, case study and personal direct routes, SPA fallback.');
