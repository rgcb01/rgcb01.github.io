# Romulo Colorado - Engineering Portfolio

Recruiter-first professional portfolio for Romulo Giancarlo Colorado Balboa, a Mechatronics Engineer focused on manufacturing analytics, quality engineering, industrial computer vision, PLC automation, test and validation.

## Live Site

https://rgcb01.github.io

## Preview

![Portfolio desktop preview](assets/screenshots/portfolio-polished-desktop.png)

## Project Overview

This React/Vite site presents a professional engineering portfolio for New College Graduate and entry-level roles across:

- Manufacturing engineering
- Process engineering
- Quality engineering
- Automation and controls
- Production engineering
- Test and validation
- Semiconductor manufacturing engineering

The content is data-driven and highlights three flagship engineering projects:

- Manufacturing OEE Dashboard
- Automated Visual Quality Inspection
- Industrial Automation Cell Simulator

It also includes technical publications, reusable case study pages, GitHub engineering activity, credentials, engineering metrics, skills and recruiter-oriented role fit.

## Tech Stack

- React
- Vite
- CSS
- lucide-react icons
- GitHub Pages
- GitHub Actions

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build creates `dist/404.html` from the compiled app so GitHub Pages can serve SPA routes such as `/personal` and `/projects/manufacturing-oee-dashboard`.

## Deploy

This repo uses GitHub Actions for deployment.

Recommended GitHub Pages settings:

1. Go to repository settings.
2. Open Pages.
3. Set source to `GitHub Actions`.
4. Push to `main`.

The workflow at `.github/workflows/deploy.yml` builds the Vite app and publishes the `dist` folder.

## Project Structure

```txt
rgcb01.github.io/
  .github/workflows/deploy.yml
  public/
    assets/
      certificates/
      profile/
      projects/
  src/
    components/
      personal/
      projects/
    data/
      caseStudies.js
      personal.js
      portfolio.js
    App.jsx
    data.js
    main.jsx
    styles.css
  index.html
  package.json
  vite.config.js
```

## Updating Portfolio Content

Most professional content is centralized in:

```txt
src/data/portfolio.js
```

Key data objects:

- `profile`
- `heroBadges`
- `highlights`
- `featuredProjects`
- `publications`
- `githubActivity`
- `caseStudies`
- `personalProfile`
- `upcomingProjects`
- `roadmap`
- `experiences`
- `skillGroups`
- `certifications`

Use accurate project statuses such as `Released`, `Working Prototype`, `In Development` and `Planned`. Portfolio experiments should clearly state when they use synthetic data or software-in-the-loop validation.

## Notes

The recruiter-facing site intentionally avoids personal/gaming content. A separate personal section or site can be added later without changing the professional navigation.

Current non-primary routes:

- `/projects/manufacturing-oee-dashboard`
- `/projects/automated-visual-quality-inspection`
- `/projects/industrial-automation-cell-simulator`
- `/personal`

The personal route is intentionally not part of the main recruiter navigation.
