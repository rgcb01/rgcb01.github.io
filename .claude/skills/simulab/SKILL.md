---
name: simulab
description: "Turn any idea, from any niche, into an interactive isometric 3D lab (one offline HTML page) and a 60 fps video with sound. The viewer watches it build itself, steps through guided chapters (wrong way, right way, too much), turns a knob or presses a key to break it, and every number on screen comes from one sourced model. Works for cooking, coffee, sports, fishing, finance, biology, machines, electronics, software, a hobby or a job. Poster mode turns a real machine (a car, an engine, a reactor, an appliance) into a realistic \"HOW IT WORKS\" poster: live 3D with studio light, a cutaway, 6 live readouts and a 36 s loop. Use when someone asks to explain how something works visually, wants a \"simulator\", \"lab\", \"interactive explainer\", \"visual learning\" piece, or wants an idea or project shown working instead of described."
---

# SIMULAB

One idea, one lab. The page opens on the objects building themselves under a question ("Why does your espresso taste sour or bitter?"). Then guided chapters show the wrong way, the right way and too much, while 4 panels at the bottom read the live numbers. At the end the viewer drives it: a knob and a key, and the lab says what happened and why. The same code records the video frame by frame, with sound on the same timeline.

`SKILL_DIR` is the folder this file lives in. Put the user's labs in their own project (for example `./labs/`), never inside `SKILL_DIR`.

## First run

```
cd "$SKILL_DIR" && npm install && pip install -r requirements.txt && npx playwright install chromium
```

The page needs nothing else. The video needs `ffmpeg` on PATH; the sound needs Python 3 with numpy and scipy.

## The 7 examples

Open one before you start and copy the closest.

| Lab | Niche | The question | The one input | Worth stealing |
|---|---|---|---|---|
| `demos/labE1-espresso` | Coffee | Why does espresso taste sour or bitter? | Grind setting | A non-machine topic in 3 files, chapters with labelled time-lapse (×2, ×5), a knob plus a "pull your shot" key, a taste verdict. |
| `demos/lab03-cautin` | Electronics, craft | Why doesn't your solder joint come out right? | Contact time and tip temperature | A thermal model on an event track, a cross-section inset, live practice with hold keys. |
| `demos/lab02-multimetro` | Tools | What are the 10 functions of a multimeter? | The dial | One chapter per function, everyday objects as the things being measured. |
| `demos/lab01-sonar` | Robotics | How does a robot hear a wall? | Distance to the wall | A sound wave packet and its echo, a threshold you move. |
| `demos/blink` | Code | How does your Arduino blink an LED? | Time | The template: 6 parts, auto-routed wires, a code tab. |
| `demos/lab25-f1` | Machines (poster mode) | How does a 2026 F1 car split its power? | Lap sequence | Realistic 3D poster: V6, turbo, MGU-K and battery in a cutaway, moving wings, energy flows, step clips for tutorials. |
| `demos/catalogo` | | Every asset on one mat | | Check an asset before you use it. |

```
node "$SKILL_DIR/tools/build.mjs" "$SKILL_DIR/demos/labE1-espresso"   # -> demos/labE1-espresso/dist/index.html
```

## The method (this decides whether it works)

1. **Turn the topic into a question with one moving part and one number.** "Coffee" makes a generic picture. "Why does a shot under 20 s taste sour?" forces a grinder, a flow and a timer. If the topic is abstract, give it a body: money becomes coins dropping into jars, a muscle becomes a lever with a weight, a network becomes boxes on a conveyor, a fish fight becomes a reel with a drag and a line that can snap. Ask the user which part confuses people most; that part gets the camera.
2. **Numbers before drawing.** Research the real values first: datasheets, manuals, standards, recognised guides. Write each one with its source. Anything you cannot source is an assumption and is labelled as one. Never invent a number or a source. This list becomes the `note` in `demo.json`, shown under the lab.
3. **The model comes first.** `model.js` holds pure functions of one input (grind, time, angle, force, rate). Every part, label, panel and verdict reads from it, so nothing on screen can disagree. Check one value by hand and show the check (espresso: setting 5 is 400 µm and fills 36 g in 28 s).
4. **Build from the library, add to it.** Read `CATALOGO.md`. If the objects exist, the lab is only story. If one is missing, make it once in `assets/<family>.js` with `defineAsset` in real centimetres, add it to `demos/catalogo`, run `node tools/catalog.mjs`. `assets/cafe.js` is a complete small family (machine, portafilter, scale, cup) to copy from.
5. **Chapters by contrast.** One idea per chapter. The pattern that works: the wrong way, the right way, too much. Speed up long processes and say so on screen (`×5 · ADELANTADO`). End on one sentence, the caption: "The grind decides how long the water takes."
6. **Let them break it.** A `knob` for the input and a `live` key. The lab answers every attempt with a verdict and why. Whoever can push it past its limit learns what each number does.
7. **Review on stills, never from memory.** You cannot watch the video; you can look at frames. After every change run a small contact sheet and read it against the checklist below. Fix collisions with a number in the code, never by hiding them with the camera.
8. **Video last.** Preview first (`--preview`, about 4× faster), final render only when the preview is clean.
9. **Ship one file.** `dist/index.html` is offline and around 400-450 KB. Keep it under 1 MB so link cards show on X and Slack. `cover.mjs` makes the 1200x630 preview image.

## Files of one lab

```
labs/<lab>/
  demo.json   title, the model note (data with sources + assumptions), "files" to bundle, "cover" second
  model.js    the pure model (no drawing)
  demo.js     instances, timeline, state(TL, t), drawScene, drawFx, drawNotes, drawBays, audioCues
  story.js    optional: long timelines and camera moves
```

Start from the template: `node "$SKILL_DIR/tools/new-demo.mjs" labs/lab01-tema "TEMA" 01`.

`DEMO` contract (read by `kit/main.js`). Required: `timeline(params)`, `state(TL, t)`, `drawScene(G, st, TL)`. Optional: `brand`, `num`, `title`, `plate`, `chips`, `intro {seconds, lines: [l1, l2], pill}`, `caption`, `steps(TL)`, `params`, `knob` or `knobs [{key, label, min, max, step, unit, fmt}]`, `live {label, controls: [{key, label, keys: ['KeyP'], kbd: 'P'}]}`, `drawFx`, `drawNotes`, `drawBays(c, TL, st)`, `speedBadge`, `footer`, `labelAlpha`, `major`, `audioCues(TL)`, `motorEnv`, `duck`, `layout: 'full' | 'panel'`, `fullZoom`.

- `timeline(params)` returns `TL` with `T` (named times in seconds, `T.end`, `T.caption`), `insts`, `byId`, `sched`, `total` from `scheduleBuild(insts)`. With `params.live` return a long `T.end` and no `sched`.
- `state(TL, t)` calls `partsAt(TL, t, st)`, sets `st.cam = [zoom, x, y, z]` (use `fitCam(points)` and `mixCam`), and anything the drawing needs. In live mode read `LIVE.ev` (`[t, key, value]`) with `liveVal`.
- Panels: `bayFrame(c, i, title, status, bg)` (i = 0..3), `bigValue`, `chartBox`, `barPair`. Notes: `callout(c, screenPoint, dx, dy, text, alpha, bg)`, `tipCard(c, x, y, [l1, l2], alpha, tag)`, `pill`.
- Drawing: `drawBox`, `drawPrism`, `drawCyl`, `drawFrustum`, `drawSphere`, `drawRevol`, `drawWire`, `onPlane` (2D detail on a 3D face, in cm), materials `M.*`, text `ptxt`.
- Sounds in `audioCues`: `power`, `whoosh {t1}`, `whir {t1, f, gain}`, `blip {f}`, `ding`, `error`, `thud`, `beep {t1, f}`, `sizzle {t1}`, `detent`, `plug`, `caption`. Parts and wires sound by themselves.

## Commands

```
node "$SKILL_DIR/tools/build.mjs" labs/<lab>                                  # one offline HTML page
node "$SKILL_DIR/tools/stills.mjs" labs/<lab> --w=640 --cols=3 3 8 14 20 26 32  # contact sheet: labs/<lab>/shots/sheet.jpg
node "$SKILL_DIR/tools/jumps.mjs" labs/<lab> 0 20 0.05                         # find frame-to-frame jumps
bash "$SKILL_DIR/tools/video.sh" labs/<lab> <name> --preview                   # 750 px, 30 fps
bash "$SKILL_DIR/tools/video.sh" labs/<lab> <name>                             # 1500x1200, 60 fps, -14 LUFS, true peak <= -1 dBTP
node "$SKILL_DIR/tools/cover.mjs" labs/<lab>                                   # cover.jpg 1200x630
```

## Poster mode: a real machine, "HOW IT WORKS" (kit3d)

Use it when the topic is a machine or a system with parts you can see: a car, an engine, a reactor, an appliance, a tool. The result is an A4 poster (1080 x 1528) with a live three.js render (studio light, soft shadows, procedural paint, brushed metal, rubber and copper textures), a title with one word and a number ("Apex 1"), the question and a paragraph, 6 live readouts, a 2D schematic, a sequence dial, 8 numbered parts and a footer. The loop is 36 s: every part snaps into place in about 1 s, then 6 stations of 4.7 s each move the parts that explain the machine, then LINE shows everything at once. The example is `demos/lab25-f1`; `kit3d/README.md` has the details.

1. **Spec sheet before code.** One question, the 8 parts that explain the machine with real sizes, position and material, one fixed scale (F1: 1 unit = 5 cm), what moves and which number changes in each of the 6 stations, the part shown in cutaway and what is really inside it, 6 readouts. Every number with its source; the rest labelled as an assumption in the `note` of `demo.json` and in `datos.md`.
2. **Copy the example.** `cp -r "$SKILL_DIR/demos/lab25-f1" labs/<lab>`; keep `"kit": "poster3d"` and `"fps": 24` in `demo.json`.
3. **`demo.js`**, in this order: texts `{ en, es }`; station times `T`; the model as keyed values (`keys(t, [[t, v], ...])`) and `state(t)` with `K3.stage`; `build(K)` with one `K.part(id, obj, { t, num, anchor })` per numbered part, made from `box`, `cyl`, `lathe`, `cutLathe` (the cutaway: open quarter toward the camera, orange caps), `tube`, `plate`, `fins`, `bolt` and `K3P` (`strut`, `flow`, `spray`, `gear`, `bladeRing`); `update(K, st, t)` for what moves; `camera(t)` with one `K.look(target, az, el, dist)` per station; `schematic.draw` for the 2D panel.
4. **Mark small detail** (bolts, hoses, fins, cables) with `K.detail(obj)`, so the blockout stage shows only the big shapes.
5. **Motion is a function of t.** Integrate angles from the speed history inside `update`, so any second you seek looks the same. Spin parts slower than real and say so in the note.
6. **Review** with `tools/smoke.mjs` and a contact sheet. Look for overlaps from the top: no part, cable or label may cover another.
7. **Stages for tutorials.** `tools/steps.mjs` renders the 3D view alone as a short clip: `--mode=block` (big shapes, clay), `grey` (all detail, clay), `wire` (mesh lines), `closed` (cutaways closed), or the final look. Same code, one flag.
8. **Video.** `video.sh` records 1080 x 1528 at the demo's fps. A poster render keeps its 3D frames in `render/gl/`, so an interrupted render resumes where it stopped.

```
node "$SKILL_DIR/tools/build.mjs" labs/<lab>
node "$SKILL_DIR/tools/smoke.mjs" "$PWD/labs/<lab>"
node "$SKILL_DIR/tools/stills.mjs" labs/<lab> --w=540 --cols=4 1.4 4 8.5 13 18 22.5 27 33
node "$SKILL_DIR/tools/steps.mjs" labs/<lab> --mode=block --t0=33 --az0=-22 --az1=18 --n=72 --w=960
bash "$SKILL_DIR/tools/video.sh" labs/<lab> <name>
```

Taste: white page, cream bench with a brass plaque, camera on the +z side (az 30 is a 3/4 front view), one paint colour for the body, steel, copper and brass for what is machined, signal orange only on 2 or 3 parts and on the cut faces. No downloaded models or textures, no third-party logos: draw your own design and say "generic, not a real team or brand" in the note.

## Review checklist

- **Nothing overlaps.** No part, wire, label or card covers another in any frame.
- **Numbers match the picture.** The panels agree with what the objects are doing.
- **One idea per chapter**, and each state holds long enough to read: 1 s for a short phrase plus 0.25 s per word beyond three.
- **The intro question reads in 5 s.** The video opens on the build with the question on top, then the working part.
- **Time-lapse is labelled** whenever model time runs faster than video time.
- **Text is in the user's language.** Technical terms stay as people say them.

## Taste, with numbers

- Fixed isometric camera (azimuth 45°, elevation 30°), ink `#1d2033`, hard indigo shadows, paper grain. Fonts: JetBrains Mono, Silkscreen, Caveat.
- The object fills 60-70 % of the scene. Labels never under 11 px on the 1600x1280 stage.
- One accent colour for the thing that is changing right now.
- Real brands: draw your own design and say so in the note ("own design, not a real brand").

## Languages

Write the lab's text in the user's language. `?lang=en|pt|ja|zh|ko|ru` translates text that has an entry in `kit/i18n.dict.*.js`; add entries there for a new lab if the user wants other languages.

## Credits

Engine, assets and tools from KAPRI LAB by @0xKapri. Poster mode bundles three.js r170 (MIT) in `kit3d/vendor`. Fonts under the SIL Open Font License (`kit/fonts/LICENSE-*`). MIT licence.
