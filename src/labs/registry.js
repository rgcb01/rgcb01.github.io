// Interactive Labs registry: the single list every lab page, the /labs index, the home page teaser,
// the crawler metadata (scripts/copy-404.mjs) and the publication scripts read from.
// Keep this file free of JSX so Node scripts can import it. Each lab's UI is loaded lazily via `load`.
//
// Add a lab: create src/labs/<slug>/ (model.js, content.js, Lab.jsx), add an entry here,
// then run `npm run labs:validate`. See docs/LABS.md.

export const labDomains = [
  { id: 'optics', label: 'Optics' },
  { id: 'semiconductors', label: 'Semiconductors' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'engineering', label: 'Engineering' },
];

export const labsIndexMeta = {
  path: '/labs',
  title: 'Interactive Labs | Rómulo Colorado',
  description: 'Interactive simulations of optics, semiconductors, mathematics, physics and engineering. Each lab comes with its math, sources and documented model limitations.',
  socialImage: '/assets/labs/labs-og.png',
};

export const labs = [
  {
    slug: 'optical-resolution-limit',
    number: '01',
    title: 'The Optical Resolution Limit',
    subtitle: 'Diffraction and resolution in semiconductor lithography',
    question: 'Why can’t a lithography scanner print an arbitrarily small pattern?',
    summary: 'Shrink a line/space pattern until the lens can no longer catch its diffraction orders. Then win resolution back with numerical aperture, shorter wavelengths and off-axis illumination, up to the hard limit λ/(2NA).',
    bigIdea: 'A lens can only image what it can catch. The finest pitch it prints is set by λ/NA, and no illumination trick goes below λ/(2NA).',
    domains: ['optics', 'semiconductors', 'physics'],
    level: 'Introductory to intermediate',
    published: '2026-11-26',
    updated: '2026-11-26',
    status: 'published',
    readingTime: '12 min',
    socialImage: '/assets/labs/optical-resolution-limit/og.png',
    explainer: '/assets/labs/optical-resolution-limit/explainer.html',
    source: 'https://github.com/rgcb01/rgcb01.github.io/tree/main/src/labs/optical-resolution-limit',
    load: () => import('./optical-resolution-limit/Lab.jsx'),
    loadContent: () => import('./optical-resolution-limit/content.js'),
  },
];

export const publishedLabs = labs.filter(lab => lab.status === 'published');
export const findLab = slug => labs.find(lab => lab.slug === slug);
export const labPath = lab => `/labs/${lab.slug}`;
export const domainLabel = id => labDomains.find(d => d.id === id)?.label || id;
