# Romulo Colorado - Engineering Portfolio

Recruiter-first professional portfolio for Romulo Giancarlo Colorado Balboa, a Mechatronics Engineer focused on manufacturing analytics, quality engineering, industrial computer vision, PLC automation, test and validation.

## Release Status

Professional Portfolio v1.0 is treated as stable / maintenance mode. The recruiter-facing root experience at `/` and the professional case studies under `/projects/*` should now receive content, asset and bug-fix updates rather than redesign work.

The personal console under `/personal` remains separate and is not part of the professional v1.0 freeze.

## Live Site

https://rgcb01.github.io

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

The root `/` is the stable professional experience. The personal console lives separately under `/personal` and should not influence the recruiter-facing visual system.

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

## Professional Maintenance

The professional side is maintained through local data and assets instead of redesigning components.

- Main professional data: `src/data/portfolio.js`
- Project case studies: `src/data/caseStudies.js`
- Resume PDF: `public/assets/resume/romulo-colorado-resume.pdf`
- Project images: `public/assets/projects/`
- Certificate images: `public/assets/certificates/`
- Maintenance guide: `docs/PORTFOLIO_MAINTENANCE.md`

For professional content changes, run:

```bash
npm run validate:portfolio
npm run build
```

## Personal Console Routes

The personal site is organized like a console home with dedicated apps/sections:

```txt
/personal                  summary dashboard
/personal/gaming           cross-platform Gaming Hub
/personal/trophies         PlayStation Trophy Room
/personal/trophies/<slug>  individual PlayStation trophy/game files
/personal/media            current media shelf
/personal/activity         full activity timeline
/personal/thoughts         player thoughts
/personal/builds           personal build log
/personal/system           platform status, roadmap and milestones
```

The `/personal` home is intentionally short. It only shows the most important current information:

- player identity and highest-value stats
- compact Trophy Room / Gaming status
- Continue widget
- latest achievement
- compact Currently Into preview
- recent activity preview
- Console Apps launchers
- optional platform status strip

Manual personal content remains in:

```txt
src/data/personal.js
```

Use this file for authored build-log entries, currently-into items, player thoughts, roadmap labels and manual milestone definitions. Do not copy generated PSN or Steam totals into manual data.

Its data is intentionally split into three layers:

- PSN data: trophy facts synchronized by `scripts/sync-trophies.mjs` with `psn-api`.
- IGDB data: game metadata and images enriched during sync through Twitch/IGDB credentials.
- Manual data: personal ratings, reviews and opinions in `src/data/trophies/personalTrophyData.js`.

Full content belongs on dedicated routes:

- Gaming overview: `src/components/personal/GamingHub.jsx`
- Media shelf: `src/components/personal/MediaHub.jsx`
- Activity timeline: `src/components/personal/ActivityPage.jsx`
- Thoughts: `src/components/personal/ThoughtsPage.jsx`
- Build log: `src/components/personal/BuildLogPage.jsx`
- System/roadmap/milestones: `src/components/personal/SystemPage.jsx`

Home widgets live in `src/components/personal/ConsoleHomeWidgets.jsx` and should stay compact. If a widget needs more than five records, move the full version to its dedicated route.

## Media Integration

The Media Hub keeps external metadata, external activity and manual personal status separate.

Manual media state lives in:

```txt
src/data/personal.js
```

Use `mediaLibrary.watching` for movies/TV and `mediaLibrary.reading` for books. External APIs enrich only the metadata; they do not decide whether something is currently watching, watched, reading or finished.

### Last.fm

Last.fm powers live/recent listening, top artists, top albums and compact music activity. It uses the official Last.fm API from the static sync script and writes sanitized JSON to:

```txt
public/data/generated/lastfm/
  profile.json
  recent-tracks.json
  top-artists.json
  top-albums.json
  summary.json
```

Expected local or GitHub Actions variables:

```bash
LASTFM_API_KEY=
LASTFM_USERNAME=
```

The frontend never receives the API key. `Now Playing` appears only when Last.fm explicitly marks the most recent track as currently playing; otherwise the UI says `Last listened` or `Recent Track`.

### TMDB

TMDB powers movie and TV metadata/images for manually configured entries. It uses a read access token in the sync script and writes sanitized JSON to:

```txt
public/data/generated/media/
  movies.json
  tv.json
```

Expected secret:

```bash
TMDB_READ_ACCESS_TOKEN=
```

Manual entries should use stable TMDB IDs:

```js
watching: [
  {
    type: "tv",
    tmdbId: 12345,
    status: "watching",
    progress: "Season 2",
    rating: null,
    favorite: false,
    note: ""
  }
]
```

### Open Library

Open Library powers book metadata and covers for manually configured reading entries. It does not require a secret and writes:

```txt
public/data/generated/media/books.json
```

Manual reading entries can use an Open Library Work ID or ISBN:

```js
reading: [
  {
    openLibraryKey: "OL12345W",
    isbn: "",
    status: "reading",
    progress: 42,
    rating: null,
    note: ""
  }
]
```

If a media provider is unavailable, the site continues with safe generated placeholders or manual fallback content.

Generated external data is written only to:

```txt
public/data/generated/
  psn-profile.json
  trophy-games.json
  trophy-details/
  steam/
    profile.json
    games.json
    recently-played.json
    summary.json
    achievements/
  lastfm/
    profile.json
    recent-tracks.json
    top-artists.json
    top-albums.json
    summary.json
  media/
    movies.json
    tv.json
    books.json
```

These files must be safe to publish. Do not put NPSSO values, access tokens, refresh tokens, Last.fm API keys, TMDB tokens, IGDB client secrets or Twitch secrets in React, public JSON, generated HTML or committed source files.

### Trophy Room Credentials

Local sync and GitHub Actions sync expect these environment variables:

```bash
PSN_NPSSO=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
```

For local setup, copy `.env.example` into your own uncommitted shell/environment setup and fill the values there. To get an NPSSO, sign into PlayStation in a browser and visit Sony's ssocookie endpoint while signed in. Treat the NPSSO like a password.

For GitHub Actions, configure repository secrets with the same names:

- `PSN_NPSSO`
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

### Run Trophy Sync Locally

```bash
npm run sync:trophies
npm run validate:trophies
npm run build
```

If credentials are missing or authentication fails, sync exits with a clear error and preserves the last generated dataset. The normal Vite build does not require credentials.

### IGDB Manual Overrides

PSN title names do not always match IGDB names. Add manual IGDB IDs in:

```txt
src/data/trophies/gameOverrides.js
```

Example:

```js
export const gameOverrides = {
  "NPWR00000_00": {
    igdbId: 12345,
  },
};
```

The sync uses overrides before search matching. Ambiguous or unresolved IGDB matches remain unresolved and use PSN artwork when available.

### Personal Trophy Reviews

Manual opinions live in:

```txt
src/data/trophies/personalTrophyData.js
```

Use the PSN `npCommunicationId` as the key. These values are never overwritten by sync.

```js
export const personalTrophyData = {
  "NPWR00000_00": {
    sourceGameId: "igdb:12345",
    rating: 9,
    platinumRating: null,
    difficulty: 4,
    enjoyment: 9,
    grind: null,
    missables: null,
    wouldPlatinumAgain: true,
    favoriteTrophy: "",
    whatILiked: "",
    whatDidntWork: "",
    favoriteMoment: "",
    platinumWorthIt: "",
    review: "",
    developerTake: "",
    favorite: false,
    featured: false,
  },
};
```

The current platinum hunt can be set manually with `trophyRoomSettings.currentPlatinumHunt`. If it is left `null`, the UI uses a conservative recent-progress heuristic and leaves the slot empty when a single candidate is not clear.

### Gaming V0.5 Steam Integration

The gaming system is PlayStation-first for trophy depth, with Steam added as the second live platform for library, playtime and achievement context:

```txt
GitHub Actions -> platform APIs -> sanitized generated JSON -> React / GitHub Pages
```

Public account configuration lives in:

```txt
src/data/gaming.js
```

This file may contain public usernames and enabled/disabled flags. It must not contain secrets.

Current platform state:

- PlayStation: connected through PSN sync and Trophy Room.
- Steam: optional live sync through the official Steam Web API.
- Xbox: future integration only; do not use unofficial profile scraping.
- Epic: future/manual support only unless an appropriate official API is available.

Steam sync uses repository secrets or local environment variables:

```bash
STEAM_API_KEY=
STEAM_ID=
```

Generated Steam files are written to:

```txt
public/data/generated/steam/
  profile.json
  games.json
  recently-played.json
  summary.json
  achievements/
```

Expected Steam game record shape:

```js
{
  source: "steam",
  appId,
  name,
  playtimeMinutes,
  playtimeHours,
  iconUrl,
  logoUrl,
  lastPlayed,
  recentlyPlayed,
  achievements: {
    earned,
    total,
    percent,
    perfect
  }
}
```

The script uses only official Steam Web API endpoints: `IPlayerService/GetOwnedGames`, `IPlayerService/GetRecentlyPlayedGames`, `ISteamUserStats/GetPlayerAchievements`, and `ISteamUser/GetPlayerSummaries`. It does not scrape Steam pages, use cookies, or write the API key into generated JSON.

Steam achievement refresh is intentionally bounded. The sync refreshes recent and most-played games first, reuses existing generated achievement summaries when available, and marks unavailable achievement data as `null` instead of treating it as zero. A Steam perfect game means achievement data exists, the game has at least one achievement, and all achievements are earned. It is not a PlayStation platinum.

Steam data depends on Steam privacy visibility. If credentials are missing, Steam is private, or Steam API calls fail, the build keeps working with safe unavailable placeholders or the last generated dataset.

Keep terminology source-specific:

- PlayStation uses trophies and platinum.
- Steam uses achievements.
- Xbox uses achievements and gamerscore.
- Epic uses achievements.

Do not calculate one combined cross-platform completion percentage. Platform progress stays separate even when games share IGDB metadata.

### GitHub Actions Gaming Sync

The deploy workflow runs on pushes, manual `workflow_dispatch`, and every 8 hours. When the required secrets are present, it synchronizes PSN, IGDB and Steam data before building the Pages artifact. Generated JSON is included in the deployment artifact and is not committed back to the repository by the workflow.

Validation commands:

```bash
npm run validate:portfolio
npm run validate:personal
npm run validate:media
npm run validate:trophies
npm run validate:steam
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

Project case study pages are centralized in:

```txt
src/data/caseStudies.js
```

Key professional data objects:

- `profile`
- `siteMeta`
- `about`
- `heroBadges`
- `highlights`
- `featuredProjects`
- `publications`
- `githubActivity`
- `upcomingProjects`
- `roadmap`
- `experiences`
- `skillGroups`
- `certifications`
- `awards`
- `credentialBadges`

Use accurate project statuses such as `Released`, `Working Prototype`, `In Development` and `Planned`. Portfolio experiments should clearly state when they use synthetic data or software-in-the-loop validation.

### To Add a New Professional Project

1. Add a project object to `featuredProjects` in `src/data/portfolio.js`.
2. Put the screenshot or visual asset in `public/assets/projects/`.
3. Add a matching case study object to `src/data/caseStudies.js`.
4. Add repository, DOI or evidence links only when they exist.
5. Run `npm run build`.
6. Push to `main` so GitHub Actions deploys the site.

Recommended project fields:

```js
{
  title,
  status,
  statusClass,
  problem,
  solution,
  tags,
  evidence,
  github,
  caseStudy,
  caseStudyLabel,
  screenshot,
  screenshotAlt,
  note
}
```

### To Add a Certification

1. Add a certification object to `certifications` in `src/data/portfolio.js`.
2. Add the certificate image under `public/assets/certificates/` when available.
3. Add the credential URL or credential ID when available.
4. Run `npm run build` and deploy.

### To Add an Award or Recognition

1. Add an award object to `awards` in `src/data/portfolio.js`.
2. Add a verification URL only if there is a public one.
3. Run `npm run build` and deploy.

### To Update Experience

1. Edit or add an object in `experiences` in `src/data/portfolio.js`.
2. Update `profile.headline`, `profile.summary` or `profile.availability.text` if your target role changes.
3. Hide availability by setting `profile.availability.visible` to `false`.
4. Run `npm run build` and deploy.

### To Update Resume / CV

Replace:

```txt
public/assets/resume/romulo-colorado-resume.pdf
```

Then update `profile.resumePath` in `src/data/portfolio.js` only if the filename changes.

### To Add a Dedicated Social Preview Image

Add:

```txt
public/assets/social/portfolio-preview.png
```

Then update `siteMeta.socialImage` in `src/data/portfolio.js`. Until then, the site uses the professional profile photo as the social preview fallback.

## Notes

The recruiter-facing site intentionally avoids personal/gaming content. A separate personal section or site can be added later without changing the professional navigation.

Current non-primary routes:

- `/projects/manufacturing-oee-dashboard`
- `/projects/automated-visual-quality-inspection`
- `/projects/industrial-automation-cell-simulator`
- `/personal`
- `/personal/trophies`
- `/personal/trophies/<game-slug>`

The personal route is intentionally not part of the main recruiter navigation.
