# Romulo Giancarlo Colorado Balboa - Engineering Portfolio

Professional portfolio website for a New College Grad Mechatronics Engineer focused on manufacturing data, automation, industrial vision, production engineering, quality and process improvement.

## Tech Stack

- React
- Vite
- CSS
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

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

Recommended GitHub Pages settings:

1. Go to repository settings.
2. Open Pages.
3. Set source to `GitHub Actions`.
4. Push to `main`.

The workflow builds the Vite app and publishes the `dist` folder.

## Project Structure

```txt
rgcb01.github.io/
  .github/workflows/deploy.yml
  public/
    resume.pdf
  src/
    components/
    App.jsx
    data.js
    main.jsx
    styles.css
  index.html
  package.json
  vite.config.js
```

## Update Projects

Edit the `projects` array in `src/data.js`.

Each project supports:

- title
- status
- description
- tags
- GitHub link
- case study link

Use honest labels such as `Published`, `In progress` and `Planned`.

## Add Resume PDF

Place your PDF resume here:

```txt
public/resume.pdf
```

Then update `resumePath` in `src/data.js`:

```js
resumePath: "/resume.pdf"
```

If the PDF is not ready yet, keep `resumePath` pointing to `#contact`.

## Content Notes

Portfolio project descriptions should clearly state when synthetic data, portfolio datasets or industrial-style workflows are used. Avoid claims involving confidential data, production deployment or experience that cannot be defended in an interview.
