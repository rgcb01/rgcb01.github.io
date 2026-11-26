// ---------------------------------------------------------------------------------------------
// Lithography bench for The Optical Resolution Limit (SimuLab explainer). Own design, schematic.
// World cm, z up. The optical axis runs along +x at beam height ORB.h: laser -> illuminator -> mask ->
// aperture stop -> projection lens -> (water) -> wafer. Diffraction orders fan out along y: a direction
// sine f lands at y = f * ORB.S on the aperture-stop plane. Everything drawn reads st.* set by demo.js.
// ---------------------------------------------------------------------------------------------
const ORB = { h: 12, S: 8, xLaser: -48, xIll: -34, xMask: -22, xStop: -5, xLens: 4, xWafer: 32, stopHalfMax: 26 };
const ORM = {
  laser: { light: '#5d6272', mid: '#3e4250', dark: '#2a2d37' },
  frame: { light: '#e9e4da', mid: '#d3cbbd', dark: '#aaa192' },
  glass: { light: '#effafd', mid: '#cbecf4', dark: '#93cddd' },
  blade: { light: '#6a7080', mid: '#4a4f5c', dark: '#30333d' },
  wafer: { light: '#d9dde6', mid: '#aeb5c4', dark: '#7d8597' },
  water: { light: '#9fd8ff', mid: '#6cbcf2', dark: '#3d93d0' },
};
// schematic stripe period on mask and wafer faces (cm) for a pitch in nm: finer pitch, more lines
const orbStripe = (pitch) => 0.9 + pitch / 110;

defineAsset('orbLaser', {
  name: 'ArF laser', label: 'LASER · 193 nm', group: 'floor', layer: 0, O: [0, 0, 0], anchor: [ORB.xLaser, 0, ORB.h + 5], ring: [7, 7, 0.02], lab: [-4, 6, 6],
  floorShadow: (xf) => [boxCorners(xf, [ORB.xLaser - 6, -5, 0], [ORB.xLaser + 6, 5, ORB.h + 5])],
  draw(G, xf, st) {
    drawBox(G, xf, [ORB.xLaser - 6, -5, 0], [ORB.xLaser + 6, 5, ORB.h + 5], ORM.laser, {
      lw: 2,
      px: (c) => {
        ptxt(c, 'ArF', 1.2, 2.4, 1.5, '#f6f7f9', 700, 'left');
        ptxt(c, `${st.lambda ?? 193} nm`, 1.2, 4.3, 0.9, '#c8f04a', 700, 'left');
        c.fillStyle = '#ffb547'; pcirc(c, 5, 5 + 0.2, 0.75); c.fill();
      },
      py: (c) => { ptxt(c, 'EXCIMER · OWN DESIGN', 1, 2.2, 0.75, 'rgba(255,255,255,0.75)', 700, 'left'); },
    });
  },
});

defineAsset('orbIlluminator', {
  name: 'illuminator', label: 'ILLUMINATOR · σ', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [ORB.xIll, 0, ORB.h + 8], ring: [5, 9, 0.02], lab: [-2, 8, 5], dropH: 6,
  floorShadow: (xf) => [boxCorners(xf, [ORB.xIll - 1.5, -8, 0], [ORB.xIll + 1.5, 8, ORB.h + 8])],
  draw(G, xf, st) {
    drawBox(G, xf, [ORB.xIll - 2.5, -3, 0], [ORB.xIll + 2.5, 3, ORB.h - 8], ORM.frame, { lw: 1.6 });
    drawBox(G, xf, [ORB.xIll - 1.5, -8, ORB.h - 8], [ORB.xIll + 1.5, 8, ORB.h + 8], ORM.frame, {
      lw: 1.8,
      px: (c) => {  // the illumination pupil: where the light comes from (face is 16 x 16, centre at 8, 8)
        c.fillStyle = '#1d2033'; pcirc(c, 8, 8, 6.4); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.12; pcirc(c, 8, 8, 6.4); c.stroke();
        c.fillStyle = '#ffcf6b';
        const tilt = st.tilt || 0;
        if (tilt <= 0.001) { pcirc(c, 8, 8, 0.7); c.fill(); }
        else for (const s of [-1, 1]) { pcirc(c, 8 - s * tilt * 6.4, 8, 0.75); c.fill(); }
        ptxt(c, 'SOURCE SHAPE', 8, 15.2, 0.62, '#545867', 700, 'center');
      },
    });
  },
});

defineAsset('orbMask', {
  name: 'photomask', label: 'MASK · LINES & SPACES', group: 'floor', layer: 2, O: [0, 0, 0], anchor: [ORB.xMask, 0, ORB.h + 9], ring: [4, 12, 0.02], lab: [-2, -9, 6], dropH: 7,
  floorShadow: (xf) => [boxCorners(xf, [ORB.xMask - 1, -11, 0], [ORB.xMask + 1, 11, ORB.h + 9])],
  draw(G, xf, st) {
    drawBox(G, xf, [ORB.xMask - 2.5, -4, 0], [ORB.xMask + 2.5, 4, ORB.h - 9], ORM.frame, { lw: 1.6 });
    drawBox(G, xf, [ORB.xMask - 1, -11, ORB.h - 9], [ORB.xMask + 1, 11, ORB.h + 9], ORM.frame, { lw: 1.8 });
    drawBox(G, xf, [ORB.xMask + 1, -9, ORB.h - 7], [ORB.xMask + 1.3, 9, ORB.h + 7], ORM.glass, {
      lw: 1.2,
      px: (c) => {  // face: u 0..18 (from +y to -y), v 0..14 down. Chrome lines, clear spaces centred on the axis.
        const sp = orbStripe(st.pitch || 120), duty = 0.5;
        c.fillStyle = '#5b6170';
        for (let k = -20; k <= 20; k++) {
          const u0 = 9 + (k + duty / 2) * sp, u1 = 9 + (k + 1 - duty / 2) * sp;
          const a = Math.max(0.4, u0), b = Math.min(17.6, u1);
          if (b > a) c.fillRect(a, 0.6, b - a, 12.8);
        }
      },
    });
  },
});

defineAsset('orbStop', {
  name: 'aperture stop', label: 'APERTURE STOP · NA', group: 'floor', layer: 3, O: [0, 0, 0], anchor: [ORB.xStop, 0, ORB.h + 10], ring: [4, 16, 0.02], lab: [-2, -12, 6], dropH: 7,
  floorShadow: (xf) => [boxCorners(xf, [ORB.xStop - 1, -ORB.stopHalfMax, 0], [ORB.xStop + 1, ORB.stopHalfMax, ORB.h + 10])],
  draw(G, xf, st) {
    const g = clamp((st.na || 1) * ORB.S, 1, ORB.stopHalfMax - 2), H = ORB.stopHalfMax;
    for (const s of [-1, 1]) drawBox(G, xf, [ORB.xStop - 1.2, s * (H + 1) - 1.5, 0], [ORB.xStop + 1.2, s * (H + 1) + 1.5, ORB.h + 10], ORM.frame, { lw: 1.6 });
    drawBox(G, xf, [ORB.xStop - 1.2, -H - 2.5, ORB.h + 8], [ORB.xStop + 1.2, H + 2.5, ORB.h + 10], ORM.frame, { lw: 1.6 });
    drawBox(G, xf, [ORB.xStop - 0.6, -H, ORB.h - 7], [ORB.xStop + 0.6, -g, ORB.h + 7], ORM.blade, {
      lw: 1.7, px: (c) => { ptxt(c, `NA ${(st.na || 0).toFixed(2)}`, 0.8, 1.6, 1.1, '#c8f04a', 700, 'left'); },
    });
    drawBox(G, xf, [ORB.xStop - 0.6, g, ORB.h - 7], [ORB.xStop + 0.6, H, ORB.h + 7], ORM.blade, { lw: 1.7 });
  },
});

defineAsset('orbLens', {
  name: 'projection lens', label: 'PROJECTION LENS', group: 'floor', layer: 4, O: [0, 0, 0], anchor: [ORB.xLens, 0, ORB.h + 12.5], ring: [5, 13, 0.02], lab: [2, 8, 5], dropH: 7,
  floorShadow: (xf) => [cylCorners(xf, [ORB.xLens, 0, ORB.h], 'x', 12.5, 2.6)],
  draw(G, xf, st) {
    drawBox(G, xf, [ORB.xLens - 3, -3, 0], [ORB.xLens + 3, 3, 1.4], ORM.frame, { lw: 1.6 });
    drawBox(G, xf, [ORB.xLens - 1, -1.2, 1.4], [ORB.xLens + 1, 1.2, ORB.h - 11], ORM.frame, { lw: 1.4 });
    drawCyl(G, xf, [ORB.xLens, 0, ORB.h], 'x', 12.5, 2.6, ORM.glass, { seg: 48, lw: 1.8, alpha: 0.72 });
  },
});

defineAsset('orbWafer', {
  name: 'wafer', label: 'WAFER · RESIST', group: 'floor', layer: 5, O: [0, 0, 0], anchor: [ORB.xWafer, 0, ORB.h + 11], ring: [5, 12, 0.02], lab: [3, -9, 5], dropH: 7,
  floorShadow: (xf) => [boxCorners(xf, [ORB.xWafer + 0.6, -11, 0], [ORB.xWafer + 4, 11, ORB.h + 11])],
  draw(G, xf, st) {
    drawBox(G, xf, [ORB.xWafer + 0.6, -5, 0], [ORB.xWafer + 5, 5, 1.4], ORM.laser, { lw: 1.6 });
    drawBox(G, xf, [ORB.xWafer + 0.6, -11, 1.4], [ORB.xWafer + 3.2, 11, ORB.h + 11], ORM.laser, { lw: 1.8 });
    drawCyl(G, xf, [ORB.xWafer, 0, ORB.h], 'x', 10.5, 1.2, ORM.wafer, {
      seg: 56, lw: 1.8,
      capFx: (c) => {  // u along +y, v along +z (up). Exposure stripes follow the aerial image.
        const img = st.img, sp = orbStripe(st.pitch || 120);
        c.save(); c.beginPath(); c.rect(-6, -6, 12, 12); c.clip();
        c.fillStyle = '#4b3a7a'; c.fillRect(-6, -6, 12, 12);
        if (img && img.length) {
          const n = img.length, max = st.imgMax || 1;
          for (let k = 0; k < 120; k++) {
            const u = -6 + k * 0.1, ph = ((u / sp) % 1 + 1.5) % 1 - 0.5; // phase -0.5..0.5 of a period, 0 = space centre
            const v = img[Math.round((ph + 0.5) * (n - 1))] / max;
            c.fillStyle = `rgba(200,240,74,${(0.05 + 0.9 * v * (st.imgOn ?? 1)).toFixed(3)})`; c.fillRect(u, -6, 0.11, 12);
          }
        }
        c.restore();
        c.strokeStyle = 'rgba(29,32,51,0.6)'; c.lineWidth = 0.08; c.strokeRect(-6, -6, 12, 12);
      },
    });
  },
});

// Immersion water between lens and wafer (drawn by the demo with alpha = st.water).
function orbWater(G, base, a) {
  if (a <= 0.01) return;
  drawBox(G, base, [ORB.xWafer - 4.5, -7.5, ORB.h - 7.5], [ORB.xWafer - 0.7, 7.5, ORB.h + 7.5], ORM.water, { lw: 1.4, alpha: 0.35 * a });
}

// One light ray as a flat ribbon at beam height. col: css colour, w: width in cm.
function orbRay(G, base, a, b, col, w, alpha = 1) {
  if (alpha <= 0.01) return;
  const c = G.ctx, A = G.cam.p(base.p(a)), B = G.cam.p(base.p(b));
  c.save(); c.globalAlpha = alpha; c.lineCap = 'round';
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]);
  c.lineWidth = Math.max(2, w * G.cam.z) + 2.4; c.strokeStyle = 'rgba(29,32,51,0.55)'; c.stroke();
  c.lineWidth = Math.max(1.4, w * G.cam.z); c.strokeStyle = col; c.stroke();
  c.restore();
}
function orbBlockMark(G, base, p, alpha) {
  if (alpha <= 0.01) return;
  const c = G.ctx, P = G.cam.p(base.p(p)), r = 0.9 * G.cam.z;
  c.save(); c.globalAlpha = alpha; c.lineCap = 'round'; c.lineWidth = 3.2; c.strokeStyle = '#e5484d';
  c.beginPath(); c.moveTo(P[0] - r, P[1] - r); c.lineTo(P[0] + r, P[1] + r); c.moveTo(P[0] - r, P[1] + r); c.lineTo(P[0] + r, P[1] - r); c.stroke();
  c.restore();
}
