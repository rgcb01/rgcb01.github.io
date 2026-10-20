# Social Preview Assets

The professional social preview is original code-drawn artwork (1200 × 630 PNG):

```txt
public/assets/social/engineering-preview.png
```

Source: `scripts/create-engineering-assets.py` (Python + Pillow). The original wafer illustration is at `public/assets/engineering/wafer.svg`. These conceptual graphics contain no company imagery, logos, process diagrams, or production data.

Asset regeneration is optional and currently uses Windows Arial font paths. Normal Vite builds use the committed SVG and PNG and require no Python tooling.

Personal console metadata retains the professional profile photo:

```txt
public/assets/profile/romulo-colorado-profile.jpg
```

`siteMeta.socialImage` in `src/data/portfolio.js` controls the professional preview. `index.html` provides initial source metadata; `scripts/copy-404.mjs` synchronizes build output from portfolio data and emits route-specific tags plus structured data. Run `npm run build` and `npm run validate:professional-build` after metadata edits.
