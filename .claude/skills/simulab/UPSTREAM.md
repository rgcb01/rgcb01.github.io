# SimuLab (vendored skill)

- Upstream: https://github.com/ecapri-dev/simulab-skill
- Commit: `3100f593331015292c2215657b90505553a40470`
- Licence: MIT. See `LICENSE` (unchanged). Engine, assets and tools by @0xKapri. Bundled three.js r170 (MIT) and fonts (SIL OFL) keep their own licence files.
- Installed with `npx skills add ecapri-dev/simulab-skill`, which rejected the skill (see fix 1), so it was copied in by hand.

## Local changes (keep when updating)

1. `SKILL.md`: the `description` value is quoted. Upstream leaves it unquoted, and it contains `: ` ("poster: live 3D"), which strict YAML parsers reject ("Nested mappings are not allowed in compact mappings"). The `skills` installer skips the skill because of this. The text is unchanged.
2. `tools/video.sh`, line 10: `|| true` after the `"fps"` lookup. Under `set -euo pipefail`, `grep` finding no `"fps"` key in a demo's `demo.json` (true of every non-poster demo) aborted the script before it rendered anything.

## Dependencies

`npm run labs:setup` (from the repository root) installs `node_modules/` here (Playwright, git-ignored) and the Python packages in `requirements.txt` (numpy, scipy, for the sound). Videos also need `ffmpeg` on `PATH`.

Do not run `npx playwright install` here if a Chrome or Chromium is already installed. `scripts/labs/simulab.mjs` points the tools at it through `CHROME_PATH`, which `tools/browser.mjs` honours.

## How this site uses it

Labs keep their SimuLab source in `src/labs/<slug>/simulab/`, not inside this folder, as `SKILL.md` asks. `scripts/labs/simulab.mjs` stages a lab into `exports/.simulab/<slug>/`, wraps the lab's shared `model.js` into `model.gen.js`, and calls `tools/build.mjs`, `stills.mjs`, `record.mjs`, `audio.py` and `master.py` from here. See `docs/LABS.md`.
