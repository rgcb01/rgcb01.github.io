# Professional Portfolio Maintenance

The professional site at `/` is treated as a stable v1.0 content system. Future changes should normally update data and assets, not redesign components.

## Main Files

- Professional content: `src/data/portfolio.js`
- Project case studies: `src/data/caseStudies.js`
- Professional components: `src/components/*.jsx`
- Case study components: `src/components/projects/`
- Resume: `public/assets/resume/romulo-colorado-resume.pdf`
- Project images: `public/assets/projects/`
- Certificate images: `public/assets/certificates/`
- Profile image: `public/assets/profile/`

## Add a Featured Project

1. Add a project object to `featuredProjects` in `src/data/portfolio.js`.
2. Add a matching case study object to `caseStudies` in `src/data/caseStudies.js`.
3. Use a stable route such as `/projects/my-project-slug`.
4. Add screenshots or diagrams under `public/assets/projects/`.
5. Add the GitHub URL.
6. Add DOI, paper or publication links only when they exist.
7. Run:

```bash
npm run validate:portfolio
npm run build
```

## Add or Update a Case Study

Each case study should explain:

- engineering problem
- objectives
- approach or architecture
- engineering decisions
- validation
- results
- limitations
- technologies
- evidence links

Do not imply production impact when a project uses synthetic or portfolio data.

## Add Experience

Edit `experiences` in `src/data/portfolio.js`.

Keep bullets outcome-oriented and engineering-specific. Metrics should include enough context to be defensible in an interview.

## Add a Certification

1. Add the certificate image to `public/assets/certificates/`.
2. Add an object to `certifications`.
3. Include title, issuer, issued date, credential URL or credential ID when available.
4. Write meaningful `imageAlt` text.
5. Run `npm run validate:portfolio`.

## Add an Award

Add an object to `awards` in `src/data/portfolio.js`.

Use this section for academic or professional recognition such as CENEVAL excellence recognition. Keep it separate from certifications and Credly badges.

## Add a Publication

Add an object to `publications`.

Supported professional publication types include:

- technical paper
- engineering case study
- technical report
- poster
- thesis
- conference material
- Zenodo publication

Use DOI or repository verification when available. Do not create placeholder publications.

## Add a Credly Credential

Add the badge ID/provider to `credentialBadges` in `src/data/portfolio.js`.

The visual embed layer reads from the badge ID list; keep formal certifications in `certifications`.

## Update Resume

Replace this file without changing component code:

```txt
public/assets/resume/romulo-colorado-resume.pdf
```

Then run:

```bash
npm run validate:portfolio
npm run build
```

## Update Professional Status

Update these fields in `src/data/portfolio.js`:

- `profile.availability`
- `profile.heroPanel`
- `profile.headline`
- `profile.summary`
- `about`
- `recruiterSnapshot`

These fields are intentionally centralized so the site can evolve from new graduate positioning without redesign.

## Validation Checklist

Before pushing professional content changes:

```bash
npm install
npm run validate:portfolio
npm run validate:trophies
npm run validate:steam
npm run build
```

Then verify these direct routes:

- `/`
- `/projects/manufacturing-oee-dashboard`
- `/projects/automated-visual-quality-inspection`
- `/projects/industrial-automation-cell-simulator`
- `/personal`
- `/personal/trophies`

## Stability Rule

Completed engineering work should remain higher priority than planned work. Roadmaps and upcoming concepts can stay in data, but the professional landing page should not look unfinished.
