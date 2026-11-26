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
    page: {
      simTitle: 'Shrink the pattern. Catch the orders.',
      simIntro: 'Scalar partially coherent imaging of an equal line/space grating. Every figure and number below comes from one model.',
      explainerTitle: 'Watch the limit appear.',
      explainerIntro: 'An isometric bench that builds itself and steps through the same six states as the guided tour. Turn the knobs at the end to drive it yourself.',
      explainerSize: 'about 0.5 MB',
      explainerCredit: 'adapted with a lithography bench of my own design.',
      mathTitle: 'Why the limit exists.',
      reproduce: ['The model is a single file of plain JavaScript with no dependencies. An automated check compares it with closed-form results: the J₁ Bessel values, the 26.5 % Rayleigh dip, the λ/NA cut-off, the exact coherent three-beam image, and the λ/(2NA) wall.'],
      checks: ['node scripts/labs/check-optical-resolution-model.mjs'],
    },
  },
  {
    slug: 'optical-proximity-correction',
    number: '02',
    title: 'Why We Intentionally Distort Photomasks',
    subtitle: 'Optical proximity correction in semiconductor lithography',
    question: 'Why does an intentionally distorted photomask print a more accurate pattern on the wafer?',
    summary: 'A lens blurs what it images: line ends print short, corners print round, and isolated lines print differently from dense ones. Let a simple optical model move every mask edge against its error, and watch serifs and hammerheads appear on their own.',
    bigIdea: 'Sometimes, printing the correct shape requires designing the wrong one. The mask is pre-distorted so that, after the lens blurs it, the print lands on the target.',
    domains: ['semiconductors', 'optics', 'engineering'],
    level: 'Intermediate',
    published: '2026-11-26',
    updated: '2026-11-26',
    status: 'published',
    readingTime: '15 min',
    socialImage: '/assets/labs/optical-proximity-correction/og.png',
    explainer: '/assets/labs/optical-proximity-correction/explainer.html',
    source: 'https://github.com/rgcb01/rgcb01.github.io/tree/main/src/labs/optical-proximity-correction',
    load: () => import('./optical-proximity-correction/Lab.jsx'),
    loadContent: () => import('./optical-proximity-correction/content.js'),
    page: {
      simTitle: 'Distort the mask. Straighten the print.',
      simIntro: 'Two-dimensional partially coherent imaging with a threshold resist. The original and corrected masks are compared under identical optics, and every number is computed live from one model.',
      explainerTitle: 'Watch the mask bend to fix the print.',
      explainerIntro: 'An exploded lithography stack: mask, light terrain cut by the resist threshold, and wafer. It steps through the same four chapters as the guided tour, then hands you the controls.',
      explainerSize: 'about 0.8 MB',
      explainerCredit: 'adapted with an exploded lithography stack of my own design.',
      mathTitle: 'Why the right mask looks wrong.',
      reproduce: [
        'The model is one dependency-free JavaScript file. The checks verify physical sanity (clear field, the ¼ edge intensity, symmetry), FFT-grid convergence from 128 to 512 points, sub-pixel EPE accuracy against exact spectral evaluation, illumination-sampling convergence and OPC improvement at independent evaluation sites.',
        'The numbers quoted in the video, the cards and the posts are regenerated from the model and compared with the committed published.json.',
      ],
      checks: ['node scripts/labs/check-opc-model.mjs', 'node scripts/labs/check-opc-published.mjs'],
    },
  },
];

export const publishedLabs = labs.filter(lab => lab.status === 'published');
export const findLab = slug => labs.find(lab => lab.slug === slug);
export const labPath = lab => `/labs/${lab.slug}`;
export const domainLabel = id => labDomains.find(d => d.id === id)?.label || id;
