// KAPRI LAB · poster3d parts library: reusable 3D builders (units cm, y up). Every new generic piece goes here,
// not inside a demo, so the next lab only tells its story.
//  K3P.nema17(rot)                 NEMA 17 stepper (42 mm body, aluminium end caps, shaft up)
//  K3P.extrusion(w, h, d)          2020-style aluminium extrusion as a rounded bar
//  K3P.lattice(H, R, mat, step)    triangular truss leg (3 chords + zig-zag braces), base at y 0
//  K3P.tower(H, base, top, mat)    tapered 4-chord lattice tower (derricks, masts), base at y 0
//  K3P.strut(p0, p1, r, mat)       a round bar between two points
//  K3P.flow(pts, o)                glowing dots running along a pipe or cable (fuel, current, coolant): .set(t, speed, alpha)
//  K3P.spray(len, r, color)        a translucent cone (injector spray, nozzle jet, mud jet): .set(k) 0..1
//  K3P.bladeRing(rIn, rOut, chord, n, twist, mat, o)  a ring of n twisted blades around the y axis, merged into one mesh
//  K3P.gear(R, w, teeth, mat)      a spur gear lying in the XZ plane (axis y), for pinions and ring gears
/* global K3 */
const K3P = (() => {
  const K = K3, T = K.T, M = K.M;
  const alu = () => { const m = K.tint(M.steel, '#b9c0cb'); m.roughness = 0.42; return m; };
  function strut(p0, p1, r, mat, seg = 6) {
    const a = p0.isVector3 ? p0 : new T.Vector3(...p0), b = p1.isVector3 ? p1 : new T.Vector3(...p1);
    const c = K.cyl(r, r, a.distanceTo(b), mat, seg); c.position.copy(a).add(b).multiplyScalar(0.5); c.lookAt(b); c.rotateX(Math.PI / 2); return c;
  }
  function nema17(rot = 0) {
    const A = alu(); const g = K.group(K.box(4.2, 4.2, 4.2, M.black, 0.3), K.at(K.box(4.25, 1.2, 4.25, A, 0.2), 0, 1.4, 0), K.at(K.box(4.25, 1.2, 4.25, A, 0.2), 0, -1.4, 0), K.at(K.cyl(1.1, 1.1, 0.4, A, 24), 0, 2.25, 0), K.at(K.cyl(0.25, 0.25, 2.2, M.chrome, 12), 0, 3.2, 0));
    g.rotation.z = rot; return g;
  }
  const extrusion = (w, h, d) => K.box(w, h, d, alu(), 0.25);
  function lattice(H, R, mat, step = 2.2, chord = 0.28, brace = 0.12) {
    const g = new T.Group();
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; g.add(K.at(K.cyl(chord, chord, H, mat, 8), Math.cos(a) * R, H / 2, Math.sin(a) * R)); }
    for (let y = step * 0.7; y < H - step * 0.5; y += step) for (let k = 0; k < 3; k++) {
      const a0 = k / 3 * Math.PI * 2, a1 = (k + 1) / 3 * Math.PI * 2;
      g.add(strut([Math.cos(a0) * R, y, Math.sin(a0) * R], [Math.cos(a1) * R, y + step / 2, Math.sin(a1) * R], brace, mat));
    }
    return g;
  }
  function tower(H, B, Tp, mat, step = 3, chord = 0.2, brace = 0.09) {
    const g = new T.Group();
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(strut([sx * B / 2, 0, sz * B / 2], [sx * Tp / 2, H, sz * Tp / 2], chord, mat, 8));
    for (let y = 2; y < H; y += step) { const w = B + (Tp - B) * y / H; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) g.add(strut([a[0] * w / 2, y, a[1] * w / 2], [b[0] * w / 2, y + step / 2, b[1] * w / 2], brace, mat)); }
    return g;
  }
  // dots that run along the same curve a K.tube was built on, so the eye reads direction and speed of a flow
  function flow(pts, o = {}) {
    const curve = new T.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new T.Vector3(...p)), false, 'catmullrom', o.tension ?? 0.35);
    const n = o.n || Math.max(4, Math.round(curve.getLength() / (o.gap || 4)));
    const mat = new T.MeshStandardMaterial({ color: o.color || '#ec7a2f', emissive: o.color || '#ec7a2f', emissiveIntensity: o.glow ?? 1.4, roughness: 0.4, transparent: true, opacity: 0, depthWrite: false });
    const geo = o.len ? new T.CapsuleGeometry(o.r || 0.5, o.len, 4, 10) : new T.SphereGeometry(o.r || 0.5, 12, 8);
    const g = new T.Group(), dots = [];
    for (let i = 0; i < n; i++) { const d = new T.Mesh(geo, mat); d.visible = false; g.add(d); dots.push(d); }
    const tg = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    return { obj: g, curve, mat, set(t, speed = 0.4, alpha = 1, dir = 1) {
      mat.opacity = alpha; for (let i = 0; i < n; i++) {
        const d = dots[i]; d.visible = alpha > 0.01; if (!d.visible) continue;
        let u = ((dir * t * speed + i / n) % 1 + 1) % 1; d.position.copy(curve.getPointAt(u));
        if (o.len) { curve.getTangentAt(u, tg); d.quaternion.setFromUnitVectors(up, tg); }
        const edge = Math.min(1, u / 0.06, (1 - u) / 0.06); d.scale.setScalar(Math.max(0.05, edge));
      }
    } };
  }
  function spray(len, r, color = '#e5b63d') {
    const mat = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
    const geo = new T.ConeGeometry(r, len, 18, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(Math.PI);  // apex at origin, opening toward +y
    const m = new T.Mesh(geo, mat); m.visible = false;
    return { obj: m, set(k) { m.visible = k > 0.01; mat.opacity = 0.55 * k; m.scale.set(0.4 + 0.6 * k, Math.max(0.05, k), 0.4 + 0.6 * k); } };
  }
  function gear(R, w, teeth, mat, hub = 0.35) {
    const sh = new T.Shape(), tr = R * 0.14;
    for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2, da = Math.PI / teeth;
      for (const [aa, rr] of [[a - da * 0.55, R - tr], [a - da * 0.3, R], [a + da * 0.3, R], [a + da * 0.55, R - tr]]) { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; i === 0 && aa === a - da * 0.55 ? sh.moveTo(x, y) : sh.lineTo(x, y); } }
    const hole = new T.Path(); hole.absarc(0, 0, R * hub, 0, Math.PI * 2, true); sh.holes.push(hole);
    const g = new T.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelSize: Math.min(0.12, w * 0.1), bevelThickness: Math.min(0.12, w * 0.1), bevelSegments: 1, curveSegments: 6 });
    g.translate(0, 0, -w / 2); g.rotateX(Math.PI / 2); return K.mesh(g, mat);
  }
  // fans, compressor and turbine stages: blades are thin boxes twisted about their radial axis; hub ring optional
  function bladeRing(rIn, rOut, chord, n, twist, mat, o = {}) {
    const geos = [], L = rOut - rIn, th = o.th || Math.max(0.1, chord * 0.07);
    for (let i = 0; i < n; i++) {
      const g = new T.BoxGeometry(L, chord, th, 3, 1, 1), pos = g.attributes.position;
      if (o.taper) for (let k = 0; k < pos.count; k++) { const u = pos.getX(k) / L + 0.5; pos.setY(k, pos.getY(k) * (1 - o.taper * u)); }
      g.rotateX(twist); g.translate(rIn + L / 2, 0, 0); g.rotateY(i / n * Math.PI * 2); geos.push(g.toNonIndexed());
    }
    if (o.hub !== false) geos.push(new T.CylinderGeometry(rIn + 0.05, rIn + 0.05, chord * 1.15, 48, 1, false).toNonIndexed());
    const merged = T.mergeGeometries(geos); merged.computeVertexNormals();
    return K.mesh(merged, mat);
  }
  return { alu, strut, nema17, extrusion, lattice, tower, flow, spray, gear, bladeRing };
})();
