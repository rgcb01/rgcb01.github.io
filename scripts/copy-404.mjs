import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { siteMeta, profile } from "../src/data/portfolio.js";
import { caseStudies } from "../src/data/caseStudies.js";
import { labsIndexMeta, labPath, publishedLabs } from "../src/labs/registry.js";

const indexPath = join("dist", "index.html");
const fallbackPath = join("dist", "404.html");
const spaRoutes = [
  "personal",
  join("personal", "gaming"),
  join("personal", "trophies"),
  join("personal", "media"),
  join("personal", "activity"),
  join("personal", "thoughts"),
  join("personal", "builds"),
  join("personal", "system"),
  join("projects", "manufacturing-oee-dashboard"),
  join("projects", "automated-visual-quality-inspection"),
  join("projects", "industrial-automation-cell-simulator"),
];

const generatedGamesPath = join("dist", "data", "generated", "trophy-games.json");

if (!existsSync(indexPath)) {
  throw new Error("dist/index.html was not found. Run this script after vite build.");
}

// Emit route-specific metadata into actual HTML for crawlers without JavaScript.
const template = readFileSync(indexPath, 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function pageHtml(path, study, page) {
  const personal = path.startsWith('/personal');
  const title = page?.title || (study ? `${study.title} | Rómulo Colorado Case Study` : personal ? 'Rómulo Colorado | Personal Console' : siteMeta.title);
  const description = page?.description || study?.summary || (personal ? 'Personal console for rgcb01: gaming, media, activity and build notes.' : siteMeta.description);
  const image = `${siteMeta.siteUrl}${page?.image || (personal ? profile.photo : siteMeta.socialImage)}`;
  const url = `${siteMeta.siteUrl}${path}`;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`);
  const values = { description, 'og:title': title, 'og:description': description, 'og:url': url, 'og:image': image, 'twitter:title': title, 'twitter:description': description, 'twitter:image': image };
  if (page?.imageAlt) values['og:image:alt'] = page.imageAlt;
  for (const [name, value] of Object.entries(values)) {
    html = html.replace(new RegExp(`(<meta\\s+(?:name|property)="${name}"\\s+content=")[^"]*("\\s*\\/?>)`), (_, prefix, suffix) => `${prefix}${escape(value)}${suffix}`);
  }
  html = html.replace(/(<link rel="canonical" href=")[^"]*("\s*\/?>)/, (_, prefix, suffix) => `${prefix}${escape(url)}${suffix}`);
  if (personal) html = html.replace(/\s*<meta property="og:image:(?:width|height|alt)"[^>]*>/g, '');
  const person = { '@type': 'Person', name: profile.name, url: siteMeta.siteUrl, jobTitle: profile.role, worksFor: {'@type': 'Organization', name: profile.employer}, sameAs: [profile.linkedin, profile.github] };
  const structured = page?.schema ? {'@context':'https://schema.org', ...page.schema(url, person)} : study ? {'@context':'https://schema.org', '@type':'SoftwareSourceCode', name:study.title, description:study.summary, url, author:person, codeRepository:study.repository} : {'@context':'https://schema.org', ...person, description:siteMeta.description};
  if (!personal) html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(structured).replaceAll('<','\\u003c')}</script>\n</head>`);
  return html;
}
writeFileSync(indexPath, pageHtml('/'));
copyFileSync(indexPath, fallbackPath);

for (const route of spaRoutes) {
  const routeDirectory = join("dist", route);
  mkdirSync(routeDirectory, { recursive: true });
  const urlPath = `/${route.split(/[/\\]/).join('/')}`;
  writeFileSync(join(routeDirectory, "index.html"), pageHtml(urlPath, caseStudies.find(study => urlPath === `/projects/${study.slug}`)));
}

// Interactive Labs: the index and one directly addressable page per published lab.
const labPages = [
  { path: labsIndexMeta.path, title: labsIndexMeta.title, description: labsIndexMeta.description, image: labsIndexMeta.socialImage, imageAlt: 'Interactive Labs: simulations of optics, semiconductors, mathematics, physics and engineering.',
    schema: (url, person) => ({ '@type': 'CollectionPage', name: 'Interactive Labs', description: labsIndexMeta.description, url, author: person,
      hasPart: publishedLabs.map(lab => ({ '@type': 'LearningResource', name: lab.title, url: `${siteMeta.siteUrl}${labPath(lab)}` })) }) },
  ...publishedLabs.map(lab => ({
    path: labPath(lab), title: `${lab.title} | Interactive Labs | Rómulo Colorado`, description: `${lab.question} ${lab.summary}`, image: lab.socialImage, imageAlt: `${lab.title}: ${lab.subtitle}. Interactive lab preview.`,
    schema: (url, person) => ({ '@type': 'LearningResource', name: lab.title, alternativeHeadline: lab.subtitle, description: lab.summary, url, author: person,
      learningResourceType: 'Interactive simulation', educationalLevel: lab.level, datePublished: lab.published, dateModified: lab.updated,
      about: lab.domains, isAccessibleForFree: true, inLanguage: 'en', image: `${siteMeta.siteUrl}${lab.socialImage}` }),
  })),
];
for (const page of labPages) {
  const routeDirectory = join("dist", ...page.path.split("/").filter(Boolean));
  mkdirSync(routeDirectory, { recursive: true });
  writeFileSync(join(routeDirectory, "index.html"), pageHtml(page.path, null, page));
}

if (existsSync(generatedGamesPath)) {
  const payload = JSON.parse(readFileSync(generatedGamesPath, "utf8"));
  for (const game of payload.games || []) {
    if (!game.slug) continue;
    const routeDirectory = join("dist", "personal", "trophies", game.slug);
    mkdirSync(routeDirectory, { recursive: true });
    writeFileSync(join(routeDirectory, "index.html"), pageHtml(`/personal/trophies/${game.slug}`));
  }
}

console.log("Created GitHub Pages SPA fallback files for direct routes.");
