// KAPRI LAB · poster3d: the 3D half of the "HOW IT WORKS" A4 poster.
// Everything is modelled as code with three.js (vendor/three-kit.min.js, global THREE).
//  K3.init({w, h, k})            renderer for the viewport (logical px * k)
//  K3.M                          shared PBR palette (enamel, steel, copper, brass, signal...)
//  K3.box/cyl/lathe/tube/...     geometry helpers (units = cm, y up)
//  K3.bench(w, d, o)             cream bench with brass plaque and ruler (every lab sits on one)
//  K3.part(id, obj, o)           a numbered part: build-in time, drop offset, ghost look, focus outline
//  K3.update(t)                  build animation + focus; K3.render(cam) -> canvas
//  K3.look(target, az, el, dist, fov) / K3.fit(obj, az, el, pad) / K3.mixCam(a, b, k)
//  K3.project(v) -> {x, y, ok}   viewport px for callouts and number markers
/* global THREE */
const K3 = (() => {
  const T = THREE;
  const S = { parts: [], partById: {}, screens: [] };
  // step-by-step mode (?mode=block|grey|wire|closed): the same model shown as a modelling stage, for tutorials
  let MODE = '';
  const sm = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);

  // ---- procedural textures: generated once on canvases, tileable, no downloaded files.
  // A tile covers UVT cm, and every helper below scales its UVs to real size, so paint grain, brushing and
  // casting look the same on a bolt and on a tank.
  const UVT = 14;
  const TX = (() => {
    const N = 256, cache = {};
    function rnd(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }
    // tileable value noise, `cells` per tile, several octaves; sx/sy stretch it (brushing)
    function noise(cells, oct, seed, sx = 1, sy = 1) {
      const out = new Float32Array(N * N); let amp = 1, tot = 0;
      for (let o = 0; o < oct; o++) {
        const cx = Math.max(1, Math.round(cells * sx * 2 ** o)), cy = Math.max(1, Math.round(cells * sy * 2 ** o)), r = rnd(seed * 977 + o * 131), g = new Float32Array(cx * cy).map(() => r());
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const fx = x / N * cx, fy = y / N * cy, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, ux = tx * tx * (3 - 2 * tx), uy = ty * ty * (3 - 2 * ty);
          const v = (i, j) => g[((j % cy) * cx) + (i % cx)];
          out[y * N + x] += amp * ((v(x0, y0) * (1 - ux) + v(x0 + 1, y0) * ux) * (1 - uy) + (v(x0, y0 + 1) * (1 - ux) + v(x0 + 1, y0 + 1) * ux) * uy);
        }
        tot += amp; amp *= 0.5;
      }
      return out.map(v => v / tot);
    }
    function canvasOf(fill) { const cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N); fill(im.data); c.putImageData(im, 0, 0); return cv; }
    function tex(cv) { const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.colorSpace = T.NoColorSpace; return t; }
    const gray = (h, lo, hi) => tex(canvasOf(d => { for (let i = 0; i < N * N; i++) { const v = Math.round(255 * (lo + (hi - lo) * h[i])); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } }));
    const normal = (h, k) => tex(canvasOf(d => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, dx = (h[y * N + (x + 1) % N] - h[y * N + (x + N - 1) % N]) * k, dy = (h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x]) * k, l = Math.hypot(dx, dy, 1); d[i * 4] = 128 + 127 * (-dx / l); d[i * 4 + 1] = 128 + 127 * (dy / l); d[i * 4 + 2] = 255 * (1 / l); d[i * 4 + 3] = 255; } }));
    const mix = (a, b, k) => a.map((v, i) => v * (1 - k) + b[i] * k);
    function get(kind) {
      if (cache[kind]) return cache[kind];
      let o;
      if (kind === 'paint') { const big = noise(3, 3, 1), peel = noise(90, 1, 2); o = { r: gray(mix(big, peel, 0.3), 0.7, 1), n: normal(peel, 1.4) }; }                 // enamel: orange peel + uneven sheen
      else if (kind === 'brushed') { const st = noise(2, 4, 3, 0.04, 40); o = { r: gray(st, 0.72, 1), n: normal(st, 0.5) }; }                                                // machined steel: fine streaks
      else if (kind === 'cast') { const f = noise(28, 3, 4), b = noise(5, 2, 5); o = { r: gray(mix(f, b, 0.5), 0.78, 1), n: normal(f, 2.5) }; }                               // cast iron: sand-cast pits
      else if (kind === 'rubber') { const f = noise(60, 2, 6); o = { r: gray(f, 0.85, 1), n: normal(f, 1) }; }
      else if (kind === 'plastic') { const f = noise(30, 2, 7), b = noise(2, 2, 8); o = { r: gray(mix(f, b, 0.6), 0.8, 1), n: normal(f, 0.8) }; }
      else if (kind === 'winding') { const h = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] = Math.abs(Math.sin(y / N * Math.PI * 24)); o = { r: gray(noise(6, 2, 9), 0.6, 1), n: normal(h, 9) }; } // enamelled wire turns
      else if (kind === 'galv') { const f = noise(8, 4, 10); o = { r: gray(f, 0.55, 1), n: normal(noise(50, 1, 11), 1) }; }                                                // galvanised / zinc
      cache[kind] = o; return o;
    }
    return { get };
  })();
  // ---- palette: muted enamel, satin steel, warm metals, one signal orange (same family as the reference posters)
  const std = (color, rough = 0.5, metal = 0, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
  const phys = (color, rough, metal, o = {}) => new T.MeshPhysicalMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
  // surface(kind, ns): roughness and normal maps from TX (roughness property becomes the top of the map's range)
  const surf = (kind, ns = 0.35) => { const t = TX.get(kind); return { roughnessMap: t.r, normalMap: t.n, normalScale: new T.Vector2(ns, ns) }; };
  const M = {
    enamel: phys('#8a9cc2', 0.5, 0.05, { clearcoat: 0.55, clearcoatRoughness: 0.22, ...surf('paint', 0.18) }),
    enamelDeep: phys('#6c80aa', 0.5, 0.05, { clearcoat: 0.5, clearcoatRoughness: 0.25, ...surf('paint', 0.18) }),
    enamelPale: phys('#b8c6e2', 0.52, 0.02, { clearcoat: 0.45, clearcoatRoughness: 0.25, ...surf('paint', 0.16) }),
    steel: phys('#c7ccd4', 0.36, 0.95, { anisotropy: 0.5, ...surf('brushed', 0.12) }),
    steelDark: phys('#868c96', 0.46, 0.9, { anisotropy: 0.4, ...surf('brushed', 0.14) }),
    chrome: phys('#eef1f4', 0.16, 1, { ...surf('brushed', 0.08) }),
    iron: std('#5b6068', 0.82, 0.6, surf('cast', 0.35)),
    copper: phys('#c96f45', 0.4, 0.92, { ...surf('winding', 0.55) }),
    brass: phys('#cfa84f', 0.36, 0.92, { anisotropy: 0.3, ...surf('brushed', 0.2) }),
    signal: phys('#ec7a2f', 0.5, 0.05, { clearcoat: 0.4, clearcoatRoughness: 0.3, ...surf('paint', 0.15) }),
    red: phys('#d9443b', 0.5, 0.05, { clearcoat: 0.35, ...surf('paint', 0.15) }),
    green: phys('#3c9d63', 0.5, 0.05, { clearcoat: 0.3, ...surf('paint', 0.15) }),
    yellow: phys('#e5b63d', 0.52, 0.05, { clearcoat: 0.35, ...surf('paint', 0.15) }),
    rubber: std('#2b2d32', 0.9, 0, surf('rubber', 0.25)),
    black: std('#1f2125', 0.6, 0.1, surf('plastic', 0.3)),
    white: std('#f3f2ee', 0.55, 0, surf('plastic', 0.25)),
    cream: std('#efe7d6', 0.75, 0, surf('plastic', 0.2)),
    creamEdge: std('#e3d8c2', 0.8, 0, surf('plastic', 0.2)),
    panel: phys('#dde0e5', 0.55, 0.08, { clearcoat: 0.3, ...surf('paint', 0.12) }),
    galv: std('#b9bec4', 0.6, 0.8, surf('galv', 0.3)),
    glass: phys('#dceaf4', 0.05, 0, { transparent: true, opacity: 0.28, depthWrite: false }),
    blueCable: std('#3f6fc0', 0.6, 0, surf('rubber', 0.3)),
    yellowCable: std('#e2b030', 0.6, 0, surf('rubber', 0.3)),
    screen: std('#101317', 0.3, 0),
  };
  const tint = (m, color) => { const c = m.clone(); c.color = new T.Color(color); return c; };

  // ---- geometry helpers (y up). Each returns a Mesh with shadows on.
  function mesh(g, m) { const o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
  function at(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; }
  // UVs in real units (one texture tile = UVT cm) so surface detail keeps its size on every part
  function uvScale(g, su, sv, from = 0, to) { const uv = g.attributes.uv; if (!uv) return g; to = to ?? uv.count; for (let i = from; i < to; i++) uv.setXY(i, uv.getX(i) * su / UVT, uv.getY(i) * sv / UVT); uv.needsUpdate = true; return g; }
  function boxUV(g, w, h, d) { // BoxGeometry / RoundedBoxGeometry: faces +x, -x, +y, -y, +z, -z, one group each
    if (!g.groups.length || !g.index) return uvScale(g, Math.max(w, d), Math.max(h, d));
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    g.groups.forEach((gr, i) => { let lo = Infinity, hi = -1; for (let k = gr.start; k < gr.start + gr.count; k++) { const v = g.index.getX(k); lo = Math.min(lo, v); hi = Math.max(hi, v); } uvScale(g, dims[i % 6][0], dims[i % 6][1], lo, hi + 1); });
    return g;
  }
  const box = (w, h, d, m, r = 0, seg = 3) => mesh(boxUV(r > 0 ? new T.RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)) : new T.BoxGeometry(w, h, d), w, h, d), m);
  const cyl = (r0, r1, h, m, seg = 40, open = false) => mesh(uvScale(new T.CylinderGeometry(r0, r1, h, seg, 1, open), Math.PI * (r0 + r1), h), m);
  const sphere = (r, m, seg = 32) => mesh(new T.SphereGeometry(r, seg, Math.round(seg * 0.6)), m);
  const torus = (R, r, m, arc = Math.PI * 2, seg = 48) => mesh(new T.TorusGeometry(R, r, 14, seg, arc), m);
  // profile = [[r, y], ...] around the y axis
  const profLen = (prof) => prof.reduce((a, p, i) => i ? a + Math.hypot(p[0] - prof[i - 1][0], p[1] - prof[i - 1][1]) : 0, 0);
  const lathe = (prof, m, seg = 48) => mesh(uvScale(new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), seg), 2 * Math.PI * Math.max(...prof.map(p => p[0])), profLen(prof)), m);
  // cutaway: a closed profile loop [[r, y], ...] turned from phi0 over phiLen, the two cut faces capped
  // (cap material = the section colour). Lathe angle phi puts a point at (r sin phi, y, r cos phi).
  function cutLathe(loop, m, phi0, phiLen, cap, seg = 56) {
    if (MODE === 'closed') { phi0 = 0; phiLen = Math.PI * 2; }
    const g = new T.Group(); const mm = m.clone(); mm.side = T.DoubleSide;
    g.add(mesh(uvScale(new T.LatheGeometry(loop.concat([loop[0]]).map(([r, y]) => new T.Vector2(r, y)), seg, phi0, phiLen), phiLen * Math.max(...loop.map(p => p[0])), profLen(loop.concat([loop[0]]))), mm));
    const sh = new T.Shape(loop.map(([r, y]) => new T.Vector2(r, y)));
    if (phiLen < Math.PI * 2 - 1e-3) for (const a of [phi0, phi0 + phiLen]) { const cm = cap.clone(); cm.side = T.DoubleSide; const c = mesh(new T.ShapeGeometry(sh), cm); c.rotation.y = a - Math.PI / 2; g.add(c); }
    return g;
  }
  function tube(pts, r, m, o = {}) {
    const curve = new T.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new T.Vector3(...p)), false, 'catmullrom', o.tension ?? 0.35);
    return mesh(uvScale(new T.TubeGeometry(curve, o.seg || Math.max(24, pts.length * 14), r, o.rs || 10, false), curve.getLength(), 2 * Math.PI * r), m);
  }
  // rounded rectangle extruded along z (plates, brackets): w x h, thickness d, corner r
  function plate(w, h, d, r, m, holes = []) {
    const s = new T.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    for (const [hx, hy, hr] of holes) { const p = new T.Path(); p.absarc(hx, hy, hr, 0, Math.PI * 2, true); s.holes.push(p); }
    const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: Math.min(0.12, d / 4), bevelSize: Math.min(0.12, r / 3), bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -d / 2); return mesh(uvScale(g, 1, 1), m);
  }
  // mark small detail (bolts, fins, hoses) so ?mode=block shows only the big shapes
  const detail = (o) => { o.userData.detail = true; return o; };
  function group(...kids) { const g = new T.Group(); for (const k of kids) if (k) g.add(k); return g; }
  // hex bolts in a ring or a list
  function bolt(r, m = M.steel) { const g = group(cyl(r, r, r * 0.7, m, 6), at(cyl(r * 0.55, r * 0.55, r * 0.5, m, 16), 0, r * 0.55, 0)); return g; }
  function boltRing(n, R, r, m) { const g = new T.Group(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = bolt(r, m); b.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); g.add(b); } return g; }
  // ribbed fins (radiators, heatsinks, cylinder fins)
  function fins(n, w, h, d, gap, m) { const g = new T.Group(); for (let i = 0; i < n; i++) g.add(at(box(w, h, d, m), 0, 0, (i - (n - 1) / 2) * gap)); return g; }
  // 3-point bend cable / hose resting on the bench
  const hose = (a, b, sag, r, m, mid) => tube(mid ? [a, ...mid, b] : [a, [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - sag, (a[2] + b[2]) / 2], b], r, m);

  // ---- canvas textures: plaques, displays, rulers (redraw with .draw(fn))
  function canvasTex(w, h, fn) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const o = { cv, c, tex, key: null, draw(f, key) { if (key != null && key === o.key) return; o.key = key; c.clearRect(0, 0, w, h); f(c, w, h); tex.needsUpdate = true; } };
    if (fn) o.draw(fn); return o;
  }
  // a flat display: returns mesh (plane facing +z) and the texture to redraw every frame
  function screen(w, h, px = 256, emissive = true) {
    const ct = canvasTex(px, Math.round(px * h / w));
    const m = new T.MeshStandardMaterial({ map: ct.tex, roughness: 0.35, metalness: 0, emissive: emissive ? new T.Color('#ffffff') : new T.Color('#000'), emissiveMap: emissive ? ct.tex : null, emissiveIntensity: emissive ? 0.55 : 0 });
    const o = mesh(new T.PlaneGeometry(w, h), m); o.castShadow = false; o.userData.ct = ct; return { mesh: o, ct };
  }

  // ---- the bench every lab sits on: cream board, chamfered, brass plaque and a ruler strip
  function bench(w, d, o = {}) {
    const g = new T.Group();
    const top = box(w, 2.4, d, M.cream, 1.1, 4); top.position.y = -1.2; g.add(top);
    const lip = box(w - 1.2, 0.5, d - 1.2, M.creamEdge, 0.4); lip.position.y = -2.6; g.add(lip);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(at(cyl(1.6, 1.8, 0.9, M.rubber, 24), sx * (w / 2 - 4), -3.2, sz * (d / 2 - 4)));
    // ruler along the front edge
    const rl = o.ruler ?? Math.min(w * 0.55, 60);
    if (rl > 0) {
      const ct = canvasTex(1024, 64, (c, W, H) => {
        c.fillStyle = '#c9a24e'; c.fillRect(0, 0, W, H); c.fillStyle = '#6b5420';
        const n = Math.round(rl); for (let i = 0; i <= n; i++) { const x = 6 + i / n * (W - 12), L = i % 10 === 0 ? 30 : i % 5 === 0 ? 20 : 12; c.fillRect(x - 1, 0, 2, L); if (i % 10 === 0) { c.font = '700 20px monospace'; c.fillText(String(i), x + 3, 54); } }
      });
      const r = mesh(new T.BoxGeometry(rl, 0.12, 3), [M.brass, M.brass, new T.MeshStandardMaterial({ map: ct.tex, roughness: 0.35, metalness: 0.6 }), M.brass, M.brass, M.brass]);
      r.position.set(o.rulerX ?? -w * 0.12, 0.06, d / 2 - 3.2); g.add(r);
    }
    // brass plaque with the lab name
    if (o.plaque) {
      const ct = canvasTex(512, 220, (c, W, H) => {
        const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#e0bd63'); gr.addColorStop(1, '#b88d35'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#7a5b1c'; c.lineWidth = 6; c.strokeRect(10, 10, W - 20, H - 20); c.fillStyle = '#4e3a10';
        c.font = '600 64px Inter, sans-serif'; c.fillText(o.plaque[0], 34, 100); c.font = '500 26px "JetBrains Mono", monospace';
        (o.plaque.slice(1)).forEach((l, i) => c.fillText(l, 36, 148 + i * 34));
      });
      const p = mesh(new T.BoxGeometry(12, 0.25, 5.2), [M.brass, M.brass, new T.MeshStandardMaterial({ map: ct.tex, roughness: 0.3, metalness: 0.75 }), M.brass, M.brass, M.brass]);
      p.position.set(o.plaqueX ?? w / 2 - 12, 0.12, d / 2 - 4.5); p.rotation.y = o.plaqueRot || 0; g.add(p);
    }
    return g;
  }

  // ---- renderer
  let renderer, scene, cam, composer, gtao, shadowLight, VW, VH, KS;
  // photo-studio light box for reflections: dim grey room, a big overhead softbox, two tall strip lights and a warm
  // bounce card. Metals and clearcoat pick up these shapes, which is most of what reads as "real" on a render.
  function studioEnv() {
    const env = new T.Scene(), geo = new T.BoxGeometry(1, 1, 1);
    const room = new T.Mesh(geo, new T.MeshBasicMaterial({ color: new T.Color('#6f7176'), side: T.BackSide })); room.scale.set(40, 22, 40); room.position.y = 9; env.add(room);
    const floor = new T.Mesh(geo, new T.MeshBasicMaterial({ color: new T.Color('#bdb6a8') })); floor.scale.set(40, 0.2, 40); floor.position.y = -1.9; env.add(floor);
    const light = (sx, sy, sz, x, y, z, k, col = '#ffffff') => { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) })); m.scale.set(sx, sy, sz); m.position.set(x, y, z); env.add(m); };
    light(14, 0.2, 9, -2, 19.5, 3, 7);            // overhead softbox
    light(0.2, 12, 2.2, -19.5, 8, -4, 5);        // left strip
    light(0.2, 12, 2.2, 19.5, 8, 6, 4, '#eef3ff'); // right strip, cool
    light(6, 6, 0.2, 6, 5, 19.5, 2.2, '#fff1dc'); // warm front card
    light(5, 4, 0.2, -8, 6, -19.5, 1.2);         // dim back card
    return env;
  }
  function init({ w, h, k = 1, ao = true, shadow = 2048, mode = '' }) {
    MODE = mode || ''; VW = w; VH = h; KS = k;
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(Math.round(w * k), Math.round(h * k), false);
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.localClippingEnabled = true; renderer.setClearColor(0xffffff, 0);
    scene = new T.Scene();
    const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(studioEnv(), 0.03).texture; scene.environmentIntensity = 1.0;
    const hemi = new T.HemisphereLight('#ffffff', '#d9d4ca', 0.55); scene.add(hemi);
    shadowLight = new T.DirectionalLight('#fffaf2', 2.1); shadowLight.position.set(-40, 90, 50); shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.set(shadow, shadow); shadowLight.shadow.radius = 6; shadowLight.shadow.bias = -0.0004; shadowLight.shadow.normalBias = 0.03;
    scene.add(shadowLight); scene.add(shadowLight.target);
    const fill = new T.DirectionalLight('#eef3ff', 0.55); fill.position.set(60, 30, -20); scene.add(fill);
    const catcher = new T.Mesh(new T.PlaneGeometry(2000, 2000), new T.ShadowMaterial({ color: '#2e2a40', opacity: 0.2 })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = -3.7; catcher.receiveShadow = true; scene.add(catcher);
    cam = new T.PerspectiveCamera(20, w / h, 1, 4000);
    if (ao) {
      composer = new T.EffectComposer(renderer, new T.WebGLRenderTarget(Math.round(w * k), Math.round(h * k), { type: T.HalfFloatType, samples: 4 })); composer.setPixelRatio(1); composer.setSize(Math.round(w * k), Math.round(h * k));
      composer.addPass(new T.RenderPass(scene, cam));
      gtao = new T.GTAOPass(scene, cam, Math.round(w * k), Math.round(h * k)); gtao.output = T.GTAOPass.OUTPUT.Default;
      gtao.updateGtaoMaterial({ radius: 6, distanceExponent: 1.4, thickness: 3, scale: 1, samples: 12 }); gtao.blendIntensity = 0.85; composer.addPass(gtao);
      composer.addPass(new T.OutputPass());
    }
    return { renderer, scene, cam };
  }
  // fit the shadow frustum to the bench once the scene is built
  function fitShadow(size = 160, center = [0, 0, 0]) {
    const s = shadowLight.shadow.camera; s.left = -size / 2; s.right = size / 2; s.top = size / 2; s.bottom = -size / 2; s.near = 1; s.far = 400; s.updateProjectionMatrix();
    shadowLight.target.position.set(...center); shadowLight.position.set(center[0] - 40, center[1] + 90, center[2] + 50);
  }

  // ---- parts: build-in, ghost look, focus outline
  const GHOST = new T.Color('#ffffff');
  function part(id, obj, o = {}) {
    obj.updateMatrixWorld(true);
    const mats = []; const edges = new T.Group();
    const lineM = new T.LineBasicMaterial({ color: '#8f9bb3', transparent: true, opacity: 0, depthWrite: false });
    const focusM = new T.LineBasicMaterial({ color: '#ec7a2f', transparent: true, opacity: 0, depthTest: true });
    const focus = new T.Group();
    obj.traverse(m => {
      if (!m.isMesh) return;
      const arr = Array.isArray(m.material) ? m.material : [m.material];
      const cl = arr.map(x => { const c = x.clone(); mats.push({ m: c, col: c.color ? c.color.clone() : null, op: c.opacity, tr: c.transparent, dw: c.depthWrite }); return c; });
      m.material = Array.isArray(m.material) ? cl : cl[0];
      if (o.edges !== false && m.geometry.attributes.position.count < 60000) {
        const eg = new T.EdgesGeometry(m.geometry, 32); const l = new T.LineSegments(eg, lineM); l.matrixAutoUpdate = false;
        l.matrix.copy(obj.matrixWorld.clone().invert().multiply(m.matrixWorld)); edges.add(l);
        if (o.outline !== false) { const f = new T.LineSegments(eg, focusM); f.matrixAutoUpdate = false; f.matrix.copy(l.matrix); focus.add(f); }
      }
    });
    obj.add(edges); obj.add(focus); edges.visible = false; focus.visible = false;
    if (MODE === 'block') obj.traverse(m => { if (m.userData.detail) m.visible = false; });
    const wire = MODE === 'wire' && id !== 'bench';   // the bench stays clay in wire mode (its big triangles read as noise)
    if (MODE === 'block' || MODE === 'grey' || MODE === 'wire') for (const s of mats) {   // clay look: one grey, no maps; wire: ink mesh lines
      const m = s.m; if (m.transparent && s.op < 0.6) continue;
      for (const k of ['map', 'roughnessMap', 'normalMap', 'emissiveMap']) if (k in m) m[k] = null;
      if (m.color) m.color.set(wire ? '#3b4a6b' : '#c9ccd1'); if ('metalness' in m) m.metalness = 0; if ('roughness' in m) m.roughness = 0.85;
      if ('clearcoat' in m) m.clearcoat = 0; if (m.emissive) m.emissive.set('#000'); m.wireframe = wire; m.needsUpdate = true; if (s.col) s.col = m.color.clone();
    }
    const p = { id, obj, mats, edges, lineM, focusM, focus, t0: o.t ?? 0, dur: o.dur ?? 0.8, from: o.from || [0, 14, 0], home: obj.position.clone(), homeR: obj.rotation.clone(), num: o.num, name: o.name, anchor: o.anchor ? new T.Vector3(...o.anchor) : null, local: o.local ? new T.Vector3(...o.local) : null, sound: o.sound !== false };
    S.parts.push(p); S.partById[id] = p; scene.add(obj); return p;
  }
  // build progress per part, ghost -> solid; focus = {id: 0..1}
  function update(t, focus = {}) {
    for (const p of S.parts) {
      const k = (t - p.t0) / p.dur; const vis = k > 0; p.obj.visible = vis; if (!vis) continue;
      const e = ease(Math.min(1, k * 1.25)), solid = sm((k - 0.35) / 0.65);
      p.obj.position.set(p.home.x + p.from[0] * (1 - e), p.home.y + p.from[1] * (1 - e), p.home.z + p.from[2] * (1 - e));
      if (p.anim) p.anim(p, t);
      const ghost = solid < 1;
      for (const s of p.mats) {
        if (s.col) s.m.color.copy(s.col).lerp(GHOST, (1 - solid) * 0.82);
        const op = s.op * (0.18 + 0.82 * solid);
        s.m.transparent = ghost || s.tr; s.m.opacity = ghost ? op : s.op; s.m.depthWrite = ghost ? solid > 0.6 : s.dw;
      }
      p.edges.visible = ghost; p.lineM.opacity = (1 - solid) * 0.9 * Math.min(1, k * 4);
      const f = focus[p.id] || 0; p.focus.visible = f > 0.01; p.focusM.opacity = f;
    }
  }
  function buildEnd() { return Math.max(0, ...S.parts.map(p => p.t0 + p.dur)); }

  // ---- camera: target + azimuth/elevation (deg) + distance; fit() frames an object
  const V = (x, y, z) => new T.Vector3(x, y, z);
  function look(target, az, el, dist, fov = 20) { return { target: V(...target), az, el, dist, fov }; }
  function fit(objOrBox, az, el, pad = 1.1, fov = 20, aspect) {
    const b = objOrBox.isBox3 ? objOrBox : new T.Box3().setFromObject(objOrBox);
    const s = b.getBoundingSphere(new T.Sphere()); const a = aspect || VW / VH;
    const half = Math.min(fov / 2, Math.atan(Math.tan(fov * Math.PI / 360) * a) * 180 / Math.PI) * Math.PI / 180;
    return { target: s.center.clone(), az, el, dist: s.radius * pad / Math.sin(half), fov };
  }
  function mixCam(a, b, k) {
    k = sm(k); const lerpA = (x, y) => { let d = ((y - x + 540) % 360) - 180; return x + d * k; };
    return { target: a.target.clone().lerp(b.target, k), az: lerpA(a.az, b.az), el: a.el + (b.el - a.el) * k, dist: Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * k), fov: a.fov + (b.fov - a.fov) * k, shift: [(a.shift?.[0] || 0) * (1 - k) + (b.shift?.[0] || 0) * k, (a.shift?.[1] || 0) * (1 - k) + (b.shift?.[1] || 0) * k] };
  }
  // shot list: [[t, cam, hold?]] -> camera at time t (moves take `move` s, then a slow push-in drift)
  function camAt(shots, t, move = 0.9, drift = 0.06) {
    let i = 0; while (i + 1 < shots.length && shots[i + 1][0] <= t) i++;
    const [t0, c0] = shots[i]; const prev = i > 0 ? shots[i - 1][1] : c0;
    const k = (t - t0) / move; const base = k < 1 && i > 0 ? mixCam(prev, c0, k) : c0;
    const tn = i + 1 < shots.length ? shots[i + 1][0] : t0 + 6; const dk = Math.max(0, Math.min(1, (t - t0) / Math.max(0.5, tn - t0)));
    const d = c0.drift ?? drift; return Object.assign({}, base, { dist: base.dist * (1 - d * dk), az: base.az + (c0.spin || 0) * dk });
  }
  function applyCam(c) {
    const az = c.az * Math.PI / 180, el = c.el * Math.PI / 180;
    cam.fov = c.fov; cam.aspect = VW / VH;
    cam.position.set(c.target.x + Math.sin(az) * Math.cos(el) * c.dist, c.target.y + Math.sin(el) * c.dist, c.target.z + Math.cos(az) * Math.cos(el) * c.dist);
    cam.lookAt(c.target); cam.updateProjectionMatrix();
    if (c.shift && (c.shift[0] || c.shift[1])) cam.setViewOffset(VW, VH, -c.shift[0], -c.shift[1], VW, VH); else cam.clearViewOffset();
    cam.updateMatrixWorld(true);
  }
  function render(c) { applyCam(c); if (composer) composer.render(); else renderer.render(scene, cam); return renderer.domElement; }
  const _v = new T.Vector3();
  function project(v) {
    _v.copy(v.isVector3 ? v : V(...v)).project(cam);
    return { x: (_v.x + 1) / 2 * VW, y: (1 - _v.y) / 2 * VH, ok: _v.z < 1 && _v.x > -1.05 && _v.x < 1.05 && _v.y > -1.05 && _v.y < 1.05 };
  }
  function anchorOf(p) { if (p.local) { p.obj.updateMatrixWorld(true); return p.obj.localToWorld(p.local.clone()); } const a = p.anchor ? p.anchor.clone() : new T.Box3().setFromObject(p.obj).getCenter(new T.Vector3()); if (p.anchor) p.obj.parent.localToWorld(a.add(p.obj.position).sub(p.home)); return a; }

  // station clock shared by every poster lab: ST = start times of the 6 stations + LINE
  // -> s (-1 off, 0..5, 6 line), ts, dial (0..7), focus k (fades in after the move, out before the next), callout alpha
  function stage(t, ST, end) {
    let s = -1; for (let i = 0; i < ST.length; i++) if (t >= ST[i]) s = i;
    const ts = s >= 0 ? ST[s] : 0, tn = ST[s + 1] ?? end, r = (a, b) => sm((t - a) / (b - a));
    return { s, ts, tn, dial: s < 0 ? 0 : s + r(ts, ts + 0.45), focus: s >= 0 ? r(ts + 0.5, ts + 0.9) * (1 - r(tn - 0.3, tn)) : 0, callout: s >= 0 && s < ST.length - 1 ? r(ts + 0.6, ts + 1.0) * (1 - r(tn - 0.25, tn)) : 0, markers: s === ST.length - 1 ? r(ts + 0.9, ts + 1.4) : 0 };
  }

  return { detail, get mode() { return MODE; }, T, M, tint, sm, ease, mesh, stage, at, box, cyl, sphere, torus, lathe, cutLathe, tube, plate, group, bolt, boltRing, fins, hose, canvasTex, screen, bench,
    init, fitShadow, part, update, buildEnd, look, fit, mixCam, camAt, applyCam, render, project, anchorOf, V,
    get scene() { return scene; }, get renderer() { return renderer; }, get cam() { return cam; }, get parts() { return S.parts; }, part_: (id) => S.partById[id] };
})();
