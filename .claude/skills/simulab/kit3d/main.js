// KAPRI LAB · poster3d runtime. Contract for tools/record.mjs, stills.mjs, video-web.sh:
//   window.READY, ASPECT, DURATION(), seek(t), frameJPEG(t, q), EVENTS()
// DEMO (from the demo's demo.js): texts + build(K3) + state(t) -> st + update(K3, st, t) + camera(t) -> cam
//   st: { stats:{key:v}, hot, dial, dialCaption, dialStatus, stn, hl:[part idx], status, callout:{id, text, a}, markers, focus:{id:k} }
/* global K3, DEMO, drawPoster, PW, PH, VP, callout, marker, L */
(function () {
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render'), EMBED = Q.has('embed');
  const canvas = document.getElementById('stage'), c = canvas.getContext('2d');
  let K = 1;
  function size() {
    if (RENDER) { const W = Number(Q.get('w') || 1080); canvas.width = W; canvas.height = Math.round(W * PH / PW / 2) * 2; K = W / PW; /* even height for H.264 */ canvas.style.width = canvas.width + 'px'; canvas.style.height = canvas.height + 'px'; return; }
    const bar = document.getElementById('bar'), availW = innerWidth - (EMBED ? 0 : 24), availH = innerHeight - (bar ? bar.offsetHeight : 0) - (EMBED ? 0 : 24);
    const s = EMBED ? availW / PW : Math.min(availW / PW, availH / PH), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = Math.round(PW * s) + 'px'; canvas.style.height = Math.round(PH * s) + 'px'; canvas.width = Math.round(PW * s * dpr); canvas.height = Math.round(PH * s * dpr); K = s * dpr;
    if (EMBED && parent !== window) parent.postMessage({ type: 'kapri:height', h: Math.round(PH * s) + (bar ? bar.offsetHeight : 0) }, '*');
  }
  size();
  const K3K = RENDER ? K : Math.min(K, 1.6);
  K3.init({ w: VP.w, h: VP.h, k: K3K, ao: !Q.has('noao'), mode: Q.get('mode') || '' });
  DEMO.build(K3);
  const END = DEMO.end;
  function frame(t) {
    const st = DEMO.state(t);
    K3.update(t, st.focus || {});
    if (DEMO.update) DEMO.update(K3, st, t);
    // USE_GL: a cached 3D frame (record.mjs --usegl) so another language only redraws the 2D poster
    const cam = DEMO.camera(t, st), gl = USE_GL ? (K3.applyCam(cam), USE_GL) : K3.render(cam);
    c.setTransform(K, 0, 0, K, 0, 0);
    drawPoster(c, DEMO, st, gl, (cc) => {
      cc.save(); cc.beginPath(); cc.rect(VP.x, VP.y, VP.w, VP.h); cc.clip();
      if (st.markers > 0) for (const p of K3.parts) if (p.num && p.obj.visible) { const q = K3.project(K3.anchorOf(p)); if (q.ok) marker(cc, VP.x + q.x, VP.y + q.y, p.num, st.markers); }
      if (st.callout && st.callout.a > 0 && K3.part_(st.callout.id)) { const p = K3.part_(st.callout.id); const q = K3.project(st.callout.at ? K3.V(...st.callout.at) : K3.anchorOf(p)); if (q.ok) callout(cc, VP.x + q.x, VP.y + q.y, p.num, st.callout.text, st.callout.a); }
      if (DEMO.overlay) DEMO.overlay(cc, st, t);
      cc.restore();
    });
    return st;
  }
  let USE_GL = null;
  // the 3D canvas is transparent (shadows are alpha): flatten it on white, as the poster does, before JPEG
  window.glJPEG = (q = 0.9) => { const src = K3.renderer.domElement, cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0); return cv.toDataURL('image/jpeg', q); };
  window.frameJPEGgl = async (t, src, q = 0.92) => { const img = new Image(); img.src = src; await img.decode(); USE_GL = img; try { frame(t); } finally { USE_GL = null; } return canvas.toDataURL('image/jpeg', q); };
  // tools/steps.mjs: the 3D view alone at time t, camera turned by daz degrees; anim=false keeps flows and motion off (modelling stages)
  window.glShot = (t, daz = 0, anim = true, q = 0.9) => {
    const st = DEMO.state(t); K3.update(t, {}); if (anim && DEMO.update) DEMO.update(K3, st, t);
    const cam = Object.assign({}, DEMO.camera(t, st)); cam.az += daz; K3.render(cam); return window.glJPEG(q);
  };
  window.VIEW = { w: VP.w, h: VP.h };
  window.ASPECT = PH / PW;
  // for tools/cover.mjs and link previews: the 'card' is the band around the 3D viewport
  window.STAGE = { w: PW, h: PH }; window.CARD = { x: -16, y: VP.y - 6, w: PW + 32, h: VP.h + 12 };
  window.DURATION = () => END;
  window.seek = (t) => { frame(t); return true; };
  window.frameJPEG = (t, q = 0.92) => { frame(t); return canvas.toDataURL('image/jpeg', q); };
  window.EVENTS = () => {
    const cues = DEMO.audioCues ? DEMO.audioCues() : [];
    for (const p of K3.parts) if (p.sound) cues.push({ type: 'part', t: p.t0 + p.dur * 0.55, i: p.num || 0 });
    const motor = []; if (DEMO.motorEnv) for (let t = 0; t < END; t += 1 / 50) motor.push(DEMO.motorEnv(t));
    return { COLD: 0, end: END, cues: cues.sort((a, b) => a.t - b.t), motor, motorT0: 0, duck: DEMO.duck || [] };
  };
  // ---- interactive page (web and local review): play/pause, scrub, click a dial label to jump to its station
  let playing = !RENDER, tNow = 0, last = null;
  function loop(ts) {
    if (last == null) last = ts; const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    if (playing) { tNow += dt; if (tNow > END + 1) tNow = 0; }
    frame(Math.min(tNow, END)); const sc = document.getElementById('scrub');
    if (sc && !sc.matches(':active')) sc.value = String(Math.min(tNow, END) / END * 1000);
    const pl = document.getElementById('play'); if (pl) pl.textContent = playing ? '❚❚' : '▶';
    requestAnimationFrame(loop);
  }
  if (!RENDER) {
    const sc = document.getElementById('scrub'); if (sc) sc.addEventListener('input', () => { tNow = Number(sc.value) / 1000 * END; playing = false; });
    const pl = document.getElementById('play'); if (pl) pl.addEventListener('click', () => { playing = !playing; });
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * PW, y = (e.clientY - r.top) / r.height * PH;
      if (x > 619 && y > 1047 && y < 1306 && DEMO.stationT) { const N = DEMO.dial.labels.length, cx = 619 + (998 - 619) / 2, cy = 1047 + 112; let a = Math.atan2(cy - y, x - cx) * 180 / Math.PI; if (a < -115) a += 360; const p = Math.round((245 - a) / (320 / (N - 1))); const ti = DEMO.stationT[Math.max(0, Math.min(N - 1, p))]; if (ti != null) { tNow = ti; playing = true; } }
      else playing = !playing;
    });
    addEventListener('resize', () => { size(); });
    if (EMBED && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => { playing = en.isIntersecting; }).observe(canvas);
    requestAnimationFrame(loop);
  } else frame(0);
  document.fonts.ready.then(() => { frame(0); window.READY = true; });
})();
