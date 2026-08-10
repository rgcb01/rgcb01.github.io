# Romulo Colorado - Mechatronics Engineering Portfolio

Professional portfolio website for Romulo Giancarlo Colorado Balboa, a Mechatronics Engineer focused on manufacturing data, automation, industrial vision, production engineering, quality and process improvement.

## Live Site

https://rgcb01.github.io

## Preview

![Portfolio desktop preview](assets/screenshots/portfolio-polished-desktop.png)

## Project Overview

This site is designed for New College Grad and entry-level engineering applications across manufacturing, process, quality, automation, production, validation, continuous improvement and engineering trainee roles.

The portfolio highlights:

- Professional engineering experience
- GitHub portfolio projects
- Manufacturing and quality metrics
- Computer vision and automation skills
- Certifications and contact links

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
    resume.pdf
  src/
    components/
      About.jsx
      Certifications.jsx
      Contact.jsx
      Experience.jsx
      FeaturedGithub.jsx
      Footer.jsx
      Hero.jsx
      Highlights.jsx
      Navbar.jsx
      PortfolioRoadmap.jsx
      Projects.jsx
      Skills.jsx
    App.jsx
    data.js
    main.jsx
    styles.css
  index.html
  package.json
  vite.config.js
```

## Update Projects, Skills and Certifications

Most site content is editable in:

```txt
src/data.js
```

Update these arrays and objects:

- `profile`
- `heroBadges`
- `highlights`
- `projects`
- `roadmap`
- `featuredGithub`
- `experiences`
- `skillGroups`
- `certifications`

Use honest project statuses such as `Published`, `In Progress` and `Planned`.

## Add Resume PDF

Place the resume file here:

```txt
public/resume.pdf
```

Then update `resumePath` in `src/data.js`:

```js
resumePath: "/resume.pdf"
```

If the PDF is not ready yet, keep `resumePath` pointing to `#contact`.

## Notes About Portfolio Projects

Portfolio project descriptions should clearly state when synthetic data, portfolio datasets or industrial-style workflows are used. Avoid claims involving confidential company data, production deployment or experience that cannot be defended in an interview.
