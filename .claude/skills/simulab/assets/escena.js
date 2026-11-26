// ---------------------------------------------------------------------------
// Scenery and effects: paper floor grid, test mat (grid, ruler, zone, start line, plate),
// obstacle box, and sound FX (wave packet with echo, real-time beam, measuring cone).
// ---------------------------------------------------------------------------
function drawFloor(G, z = -1.6) {
  const c = G.ctx;
  c.save(); c.lineWidth = 1; c.strokeStyle = 'rgba(80,70,50,0.07)';
  for (let x = -200; x <= 300; x += 10) { const a = G.cam.p([x, -200, z]), b = G.cam.p([x, 260, z]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  for (let y = -200; y <= 260; y += 10) { const a = G.cam.p([-200, y, z]), b = G.cam.p([300, y, z]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  c.restore();
}
// cfg: {x0,x1,y0,y1, z0=-1.6, plate:'TEXTO', ruler:{zero, len, y0, y1, title, mark}, zone:{x0,x1,y0,y1,text}, start:{x, y0, y1, text}}
function drawTapete(G, st, cfg) {
  const c = G.ctx, P = (q) => G.cam.p(q), z0 = cfg.z0 ?? -1.6;
  const plan = rrPlan(cfg.x0, cfg.y0, cfg.x1, cfg.y1, 4, 6);
  const sh = plan.map(([x, y]) => P([x + 2.6, y - 0.9, z0]));
  pathPts(c, hull(sh.concat(plan.map(([x, y]) => P([x, y, z0]))))); c.fillStyle = SHADOW_FLOOR; c.fill();
  drawPrism(G, new Xf(), plan, z0, 0, M.mat, {
    lw: 2.2,
    top: (cc, sp) => {
      cc.lineWidth = 0.06;
      for (let x = cfg.x0 + 4; x < cfg.x1 - 2; x += 5) { cc.strokeStyle = (Math.round(x) % 10 === 0) ? 'rgba(60,64,110,0.13)' : 'rgba(60,64,110,0.065)'; cc.beginPath(); cc.moveTo(x, cfg.y0 + 2); cc.lineTo(x, cfg.y1 - 2); cc.stroke(); }
      for (let y = cfg.y0 + 3; y < cfg.y1 - 2; y += 5) { cc.strokeStyle = (Math.round(y) % 10 === 0) ? 'rgba(60,64,110,0.13)' : 'rgba(60,64,110,0.065)'; cc.beginPath(); cc.moveTo(cfg.x0 + 2, y); cc.lineTo(cfg.x1 - 2, y); cc.stroke(); }
      const zn = cfg.zone;
      if (zn) {
        cc.save(); prect(cc, zn.x0, zn.y0, zn.x1 - zn.x0, zn.y1 - zn.y0); cc.clip();
        cc.fillStyle = 'rgba(255,92,90,0.08)'; cc.fillRect(zn.x0, zn.y0, zn.x1 - zn.x0, zn.y1 - zn.y0);
        cc.strokeStyle = 'rgba(229,72,77,0.28)'; cc.lineWidth = 0.25;
        for (let k = -40; k < 80; k += 1.6) { cc.beginPath(); cc.moveTo(zn.x0 + k, zn.y0); cc.lineTo(zn.x0 + k - (zn.y1 - zn.y0), zn.y1); cc.stroke(); }
        cc.restore();
        prect(cc, zn.x0, zn.y0, zn.x1 - zn.x0, zn.y1 - zn.y0); cc.setLineDash([0.9, 0.6]); sp(1.6, 'rgba(229,72,77,0.9)'); cc.setLineDash([]);
        if (zn.text) ptxt(cc, zn.text, (zn.x0 + zn.x1) / 2, zn.y0 + 1.4, 0.95, 'rgba(200,52,58,0.9)', 700, 'center');
      }
      if (cfg.start) {
        const s = cfg.start;
        cc.setLineDash([1.2, 0.8]); cc.beginPath(); cc.moveTo(s.x, s.y0); cc.lineTo(s.x, s.y1); sp(1.6, 'rgba(29,32,51,0.55)'); cc.setLineDash([]);
        ptxt(cc, s.text || 'SALIDA', s.x + 1.0, s.y1 - 1.5, 0.95, 'rgba(29,32,51,0.6)', 700, 'left');
      }
      const r = cfg.ruler;
      if (r) {
        const rx0 = r.zero - r.len - 1, rx1 = r.zero + 0.6;
        cc.fillStyle = '#ffffff'; prect(cc, rx0, r.y0, rx1 - rx0, r.y1 - r.y0, 0.5); cc.fill(); sp(1.6);
        for (let k = 0; k <= r.len; k++) {
          const x = r.zero - k, L = k % 10 === 0 ? 1.7 : k % 5 === 0 ? 1.1 : 0.6, hot = k === r.hot;
          cc.beginPath(); cc.moveTo(x, r.y1); cc.lineTo(x, r.y1 - L); sp(k % 10 === 0 ? 1.4 : 0.8, hot ? '#e5484d' : INK);
          if (k % 10 === 0) ptxt(cc, String(k), x, r.y0 + 1.0, 0.95, hot ? '#e5484d' : INK, 700, 'center');
        }
        if (r.hot != null && r.hot % 10 !== 0) ptxt(cc, String(r.hot), r.zero - r.hot, r.y0 + 1.0, 0.95, '#e5484d', 700, 'center');
        if (r.title) ptxt(cc, r.title, rx0 + 0.8, r.y0 + 1.0, 0.7, 'rgba(29,32,51,0.65)', 700, 'left');
        if (st.rulerMark != null) {
          const x = st.rulerMark;
          cc.fillStyle = '#ff7a1a'; cc.beginPath(); cc.moveTo(x, r.y1 + 0.15); cc.lineTo(x - 0.75, r.y1 + 1.5); cc.lineTo(x + 0.75, r.y1 + 1.5); cc.closePath(); cc.fill(); sp(1.3);
        }
      }
      for (const [x, y] of [[cfg.x0 + 3.2, cfg.y0 + 3.2], [cfg.x1 - 3.2, cfg.y0 + 3.2], [cfg.x0 + 3.2, cfg.y1 - 3.2], [cfg.x1 - 3.2, cfg.y1 - 3.2]]) {
        cc.fillStyle = rgbCss(hexRgb(M.steel.light)); pcirc(cc, x, y, 0.75); cc.fill(); sp(1.3); cc.beginPath(); cc.moveTo(x - 0.5, y - 0.2); cc.lineTo(x + 0.5, y + 0.2); sp(1.1);
      }
      if (cfg.plate) {
        cc.fillStyle = 'rgba(255,255,255,0.7)'; prect(cc, cfg.x1 - 34, cfg.y1 - 9.5, 26, 5.2, 0.6); cc.fill(); sp(1.4);
        ptxt(cc, labText(cfg.plate), cfg.x1 - 33, cfg.y1 - 8.2, 0.95, INK, 700, 'left');
        cc.strokeStyle = 'rgba(29,32,51,0.35)'; cc.lineWidth = 0.08;
        for (let i = 0; i < 2; i++) { cc.beginPath(); cc.moveTo(cfg.x1 - 33, cfg.y1 - 6.6 + i * 0.8); cc.lineTo(cfg.x1 - 10, cfg.y1 - 6.6 + i * 0.8); cc.stroke(); }
      }
    },
  });
}

// obstacle box: b = {x0,x1,y0,y1,h, stamp, dims}; p = drop progress 0..1
function drawCaja(G, b, p) {
  if (p <= 0) return;
  const xf = new Xf(0, 0, (1 - easeOut(p)) * 30), c = G.ctx;
  c.save(); c.globalAlpha = clamp(p * 3);
  drawBox(G, xf, [b.x0, b.y0, 0], [b.x1, b.y1, b.h], M.box, {
    lw: 2.0,
    top: (cc, sp) => {
      const w = b.x1 - b.x0, d = b.y1 - b.y0;
      cc.beginPath(); cc.moveTo(0.4, d / 2); cc.lineTo(w - 0.4, d / 2); sp(1.4, 'rgba(110,70,30,0.8)');
      cc.fillStyle = 'rgba(245,226,170,0.78)'; prect(cc, -0.05, d / 2 - 2.2, w + 0.1, 4.4); cc.fill(); sp(1.2, 'rgba(150,110,50,0.8)');
      cc.fillStyle = 'rgba(255,255,255,0.35)'; prect(cc, 0, d / 2 - 1.6, w, 0.7); cc.fill();
      cc.strokeStyle = 'rgba(110,70,30,0.35)'; cc.lineWidth = 0.18;
      for (const y of [1.6, d - 1.6]) { cc.beginPath(); cc.moveTo(0.8, y); cc.lineTo(w - 0.8, y); cc.stroke(); }
    },
    px: (cc, sp) => {
      const d = b.y1 - b.y0;
      cc.fillStyle = 'rgba(245,226,170,0.78)'; prect(cc, d / 2 - 2.2, -0.02, 4.4, 3.6); cc.fill(); sp(1.2, 'rgba(150,110,50,0.8)');
      for (const u of [3.2, 5.0]) { cc.beginPath(); cc.moveTo(u, b.h - 1.6); cc.lineTo(u, b.h - 4.0); cc.moveTo(u - 0.7, b.h - 3.3); cc.lineTo(u, b.h - 4.1); cc.lineTo(u + 0.7, b.h - 3.3); sp(1.6, 'rgba(80,45,15,0.85)'); }
    },
    py: (cc) => {
      const w = b.x1 - b.x0;
      cc.save(); cc.translate(w * 0.5, b.h * 0.52); cc.rotate(-0.06);
      prect(cc, -8.2, -2.0, 16.4, 4.0, 0.4); cc.lineWidth = 0.32; cc.strokeStyle = 'rgba(214,56,62,0.9)'; cc.stroke();
      ptxt(cc, b.stamp || 'OBSTÁCULO', 0, -0.25, 2.1, 'rgba(214,56,62,0.92)', 700, 'center');
      if (b.dims) ptxt(cc, b.dims, 0, 1.35, 0.85, 'rgba(214,56,62,0.85)', 700, 'center');
      cc.restore();
    },
  });
  c.restore();
}
function cajaShadow(G, b) { return shadowPts(G, boxCorners(new Xf(), [b.x0, b.y0, 0], [b.x1, b.y1, b.h]), 0); }

// ---- sound (S = {SOUND cm/us, FREQ, BURST, TX_Y, SENSOR_Z}) ---------------------------------
function arcPts(G, cx, cy, z, r, a0, a1, n = 24) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push(G.cam.p([cx + r * Math.cos(a), cy + r * Math.sin(a), z])); } return out; }
function strokeArc(c, pts, col, w, alpha) {
  c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) c.lineTo(q[0], q[1]);
  c.lineWidth = w + 2.4; c.strokeStyle = 'rgba(29,32,51,0.55)'; c.stroke(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); c.restore();
}
function txPos(ping, S) { return [ping.x - Math.sin(ping.yaw) * S.TX_Y, ping.y + Math.cos(ping.yaw) * S.TX_Y]; }
function drawPacket(G, ping, mu, S, o = {}) {
  const yaw = ping.yaw, tx = txPos(ping, S), z = S.SENSOR_Z, d = ping.dTrue, half = (12 * Math.PI) / 180;
  const wallX = ping.x + Math.cos(yaw) * d, period = 1e6 / S.FREQ, c = G.ctx;
  for (let k = 0; k < S.BURST; k++) {
    const s = S.SOUND * (mu - k * period); if (s <= 0) continue;
    const lead = k === 0 ? 1 : 0.8;
    if (s <= d) strokeArc(c, arcPts(G, tx[0], tx[1], z, s, yaw - half, yaw + half, 18), '#27c9bb', (o.w || 4.2) * lead, o.alpha ?? 1);
    else {
      const back = s - d; if (back > d + 2.5) continue;
      strokeArc(c, arcPts(G, 2 * wallX - tx[0], tx[1], z, s, Math.PI + yaw - half, Math.PI + yaw + half, 18), '#ff5c9a', (o.w || 4.2) * lead, (o.alpha ?? 1) * (1 - clamp((back - d) / 2.5)));
    }
  }
}
function drawBeam(G, ping, a, S) {
  if (a <= 0 || !ping || !ping.dTrue) return;
  const yaw = ping.yaw, tx = txPos(ping, S), z = S.SENSOR_Z, half = (7.5 * Math.PI) / 180, d = ping.dTrue;
  const p0 = G.cam.p([tx[0], tx[1], z]), p1 = G.cam.p([tx[0] + d * Math.cos(yaw - half), tx[1] + d * Math.sin(yaw - half), z]), p2 = G.cam.p([tx[0] + d * Math.cos(yaw + half), tx[1] + d * Math.sin(yaw + half), z]);
  const c = G.ctx; c.save(); c.globalAlpha = a;
  const g = c.createLinearGradient(p0[0], p0[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
  g.addColorStop(0, 'rgba(39,201,187,0.55)'); g.addColorStop(1, 'rgba(39,201,187,0.08)');
  c.fillStyle = g; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.closePath(); c.fill(); c.restore();
}
function drawCone(G, ping, a, S) {
  if (a <= 0) return;
  const yaw = ping.yaw, tx = txPos(ping, S), z = S.SENSOR_Z, half = (7.5 * Math.PI) / 180, d = ping.dTrue;
  const c = G.ctx; c.save(); c.globalAlpha = a; c.setLineDash([5, 5]); c.lineWidth = 1.6; c.strokeStyle = 'rgba(29,32,51,0.55)';
  for (const s of [-1, 1]) { const p0 = G.cam.p([tx[0], tx[1], z]), p1 = G.cam.p([tx[0] + d * Math.cos(yaw + s * half), tx[1] + d * Math.sin(yaw + s * half), z]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
  c.setLineDash([]); c.restore();
}
