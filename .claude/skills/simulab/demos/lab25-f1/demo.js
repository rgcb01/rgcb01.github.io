// Lab 25 · APEX 1: a 2026-rules Formula 1 car on a display bench, engine cover cut open in one quarter (poster3d kit).
// V6 turbo (up to 400 kW) + MGU-K (350 kW out, 350 kW back under braking), battery, gearbox, active front and rear wings.
// 1 unit = 5 cm (3.4 m wheelbase = 68 units). Numbers: datos.md and the note in demo.json.
/* global K3, K3P, SK */
const G = (() => {
  const T = { fire: 1.6, deploy: 6.3, straight: 11.0, brake: 15.7, corner: 20.4, over: 25.1, line: 29.8, end: 36.0 }; // built by ~1.2 s, 4.7 s per station
  const ST = [T.fire, T.deploy, T.straight, T.brake, T.corner, T.over, T.line];
  const sm = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x), ramp = (t, a, b) => sm((t - a) / (b - a)), lin = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  // ---- the model (datos.md): 2026 power unit rules; speeds, flap angles and battery levels are assumptions
  const ICE_KW = 400, K_KW = 350, HARVEST_MJ = K_KW * 3.0 / 1000, FLAP_CORNER = 28, FLAP_STRAIGHT = 8;
  // piecewise value: [[t, v], ...] eased between keys
  const keys = (t, ks) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return ks[i - 1][1] + (ks[i][1] - ks[i - 1][1]) * sm((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return ks[ks.length - 1][1]; };
  const speedAt = (t) => keys(t, [[T.fire + 0.3, 0], [T.deploy, 140], [T.straight, 250], [T.brake + 0.2, 330], [T.brake + 3.4, 100], [T.corner + 0.6, 100], [T.over, 160], [T.line, 300]]);
  const iceAt = (t) => keys(t, [[T.fire + 0.2, 0], [T.fire + 1.2, ICE_KW], [T.brake + 0.1, ICE_KW], [T.brake + 0.6, 0], [T.corner + 1.6, 0], [T.corner + 2.6, ICE_KW]]);
  const kAt = (t) => keys(t, [[T.deploy + 0.3, 0], [T.deploy + 1.2, K_KW], [T.straight + 2.0, K_KW], [T.brake, 220], [T.brake + 0.6, -K_KW], [T.brake + 3.6, -K_KW], [T.corner + 0.4, 0], [T.over + 0.3, 0], [T.over + 1.0, K_KW]]);
  const battAt = (t) => keys(t, [[T.deploy + 0.6, 3.6], [T.straight, 2.8], [T.brake + 0.4, 2.2], [T.corner, 3.25], [T.over + 0.6, 3.25], [T.line, 2.0]]);
  const harvAt = (t) => keys(t, [[T.brake + 0.6, 0], [T.brake + 3.6, HARVEST_MJ]]);
  const flapAt = (t) => keys(t, [[T.straight + 0.3, FLAP_CORNER], [T.straight + 1.0, FLAP_STRAIGHT], [T.brake + 0.1, FLAP_STRAIGHT], [T.brake + 0.7, FLAP_CORNER], [T.over + 0.4, FLAP_CORNER], [T.over + 1.1, FLAP_STRAIGHT], [T.line + 0.2, FLAP_STRAIGHT], [T.line + 0.9, FLAP_CORNER]]);
  const D = {
    code: 'LAB 25', glyph: 'wheel', title: 'Apex 1',
    kicker: [{ en: 'F1 CAR, 2026 RULES, V6 TURBO + MGU-K', es: 'AUTO DE F1, REGLAS 2026, V6 TURBO + MGU-K' }, { en: 'LIVE 3D · 36 S LOOP', es: '3D EN VIVO · LOOP 36 S' }],
    legend: [['CARBON', '#2b2d32'], [{ en: 'LIVERY', es: 'PINTURA' }, '#26346a'], ['COPPER', '#c96f45'], [{ en: 'ELECTRIC', es: 'ELÉCTRICO' }, '#4f8ff0'], [{ en: 'HOT GAS', es: 'GAS CALIENTE' }, '#ff8a3d'], ['SIGNAL', '#ec7a2f']],
    question: { en: 'How does a 2026 F1 car split its power?', es: '¿Cómo reparte su potencia un F1 2026?' },
    text: { en: 'A 2026 F1 car has two engines on one crankshaft. A 1.6-litre V6 turbo burns sustainable fuel and gives up to 400 kW. An electric motor, the MGU-K, adds up to 350 kW from a battery, and under braking it turns into a generator and puts energy back. The wings move too: open on the straights, closed in the corners. None of it is a recording. Claude wrote every part as code, the way you would model it in Blender, and each number follows the physics of its step.',
      es: 'Un F1 2026 tiene dos motores en un mismo cigüeñal. Un V6 turbo de 1.6 litros quema combustible sustentable y da hasta 400 kW. Un motor eléctrico, el MGU-K, suma hasta 350 kW desde una batería, y al frenar se vuelve generador y regresa energía. Las alas también se mueven: abiertas en las rectas y cerradas en las curvas. Nada es una grabación. Claude escribió cada pieza como código, como si la modelaras en Blender, y cada número sale de la física de su paso.' },
    stats: [
      { key: 'speed', label: { en: 'SPEED', es: 'VELOCIDAD' }, unit: 'km/h', max: 340, dp: 0 },
      { key: 'ice', label: { en: 'V6 TURBO', es: 'V6 TURBO' }, unit: 'kW', max: 400, dp: 0 },
      { key: 'mguk', label: { en: 'MGU-K, + OUT / - BACK', es: 'MGU-K, + DA / - RECUPERA' }, unit: 'kW', max: 350, dp: 0, fmt: (v) => (v > 0.5 ? '+' : v < -0.5 ? '-' : '') + Math.abs(v).toFixed(0) },
      { key: 'batt', label: { en: 'BATTERY, 4 MJ WINDOW', es: 'BATERÍA, VENTANA 4 MJ' }, unit: 'MJ', max: 4, dp: 2 },
      { key: 'harv', label: { en: 'RECOVERED THIS LAP', es: 'RECUPERADO EN LA VUELTA' }, unit: 'MJ', max: 8.5, dp: 2 },
      { key: 'flap', label: { en: 'REAR FLAP ANGLE', es: 'ÁNGULO DEL FLAP' }, unit: '°', max: 30, dp: 0 },
    ],
    stations: [['FIRE', 'ENCIENDE'], ['DEPLOY', 'ENTREGA'], ['STRAIGHT', 'RECTA'], ['BRAKE', 'FRENA'], ['CORNER', 'CURVA'], ['OVERTAKE', 'ADELANTA']].map(([en, es]) => ({ en, es })),
    dial: { title: { en: 'LAP SEQUENCE', es: 'SECUENCIA DE VUELTA' } },
    flow: { en: 'FIRE, DEPLOY, STRAIGHT, BRAKE, CORNER, OVERTAKE', es: 'ENCIENDE, ENTREGA, RECTA, FRENA, CURVA, ADELANTA' },
    footer: { en: 'ANATOMY · A4', es: 'ANATOMÍA · A4' },
    parts: [
      { t: { en: 'Front wing', es: 'Ala delantera' }, d: { en: 'Two flaps that move: open on straights, closed in corners.', es: 'Dos flaps que se mueven: abiertos en recta, cerrados en curva.' } },
      { t: { en: 'Monocoque', es: 'Monocasco' }, d: { en: 'Carbon survival cell, halo and bodywork on a 3.4 m wheelbase.', es: 'Celda de carbono, halo y carrocería en 3.4 m entre ejes.' } },
      { t: { en: 'Energy store', es: 'Batería' }, d: { en: 'Lithium-ion pack that feeds the MGU-K and takes back what it recovers.', es: 'Batería de litio que alimenta al MGU-K y guarda lo que recupera.' } },
      { t: { en: 'V6 engine', es: 'Motor V6' }, d: { en: '1.6 litres, 90° V, sustainable fuel, up to 400 kW.', es: '1.6 litros en V a 90°, combustible sustentable, hasta 400 kW.' } },
      { t: { en: 'Turbocharger', es: 'Turbo' }, d: { en: 'Exhaust gas spins it to push in more air. No MGU-H from 2026.', es: 'El escape lo gira para meter más aire. Sin MGU-H desde 2026.' } },
      { t: { en: 'MGU-K', es: 'MGU-K' }, d: { en: 'Motor and generator in one: 350 kW out, 350 kW back.', es: 'Motor y generador en uno: da 350 kW y recupera 350 kW.' } },
      { t: { en: 'Gearbox', es: 'Caja de cambios' }, d: { en: 'Takes both engines to the rear wheels.', es: 'Lleva la fuerza de los dos motores a las ruedas traseras.' } },
      { t: { en: 'Rear wing', es: 'Ala trasera' }, d: { en: 'Its flap lies flat on straights to cut drag.', es: 'Su flap se acuesta en las rectas para bajar el arrastre.' } },
    ],
    schematic: { title: { en: 'THE CAR, SIDE VIEW', es: 'EL AUTO, DE LADO' }, caption: { en: 'Blue: battery energy, out to the MGU-K or back under braking. Orange: the V6 and its exhaust.', es: 'Azul: energía de la batería, hacia el MGU-K o de regreso al frenar. Naranja: el V6 y su escape.' } },
    end: T.end,
  };
  D.dial.labels = [{ en: 'OFF', es: 'APAGADO' }, ...D.stations, { en: 'LINE', es: 'TODO' }];
  D.stationT = [0, ...ST];
  const CAP = {
    off: { en: 'Parked on the bench. Engine off, battery charged, wings in corner mode.', es: 'En el banco. Motor apagado, batería cargada y alas en modo curva.' },
    s: [
      { en: 'The V6 turbo fires on 100 % sustainable fuel and pulls on its own: up to 400 kW.', es: 'El V6 turbo prende con combustible 100 % sustentable y jala solo: hasta 400 kW.' },
      { en: 'The battery feeds the MGU-K: up to 350 kW more on the same crankshaft, about 750 kW in all.', es: 'La batería alimenta al MGU-K: hasta 350 kW más en el mismo cigüeñal, unos 750 kW en total.' },
      { en: 'Straight mode: front and rear flaps open, drag drops and the car keeps pulling.', es: 'Modo recta: los flaps de adelante y atrás se abren, baja el arrastre y el auto sigue jalando.' },
      { en: 'Braking: the MGU-K turns into a generator and sends up to 350 kW back to the battery.', es: 'Al frenar, el MGU-K se vuelve generador y manda hasta 350 kW de regreso a la batería.' },
      { en: 'Corner mode: the flaps close and the wings press the car onto the track for grip.', es: 'Modo curva: los flaps se cierran y las alas pegan el auto a la pista para tener agarre.' },
      { en: 'Overtake mode: extra electric energy keeps the MGU-K at 350 kW for longer.', es: 'Modo adelantar: energía eléctrica extra mantiene al MGU-K en 350 kW por más tiempo.' },
      { en: 'All at once: up to 400 kW from fuel, 350 kW from the battery, up to 8.5 MJ recovered a lap.', es: 'Todo junto: hasta 400 kW del combustible, 350 kW de la batería y hasta 8.5 MJ recuperados por vuelta.' },
    ],
  };
  const FOCUS = ['ice', 'mguk', 'rwing', 'mguk', 'fwing', 'battery', null];
  const NAMES = [{ en: 'V6 turbo', es: 'V6 turbo' }, { en: 'MGU-K', es: 'MGU-K' }, { en: 'Rear wing', es: 'Ala trasera' }, { en: 'MGU-K as generator', es: 'MGU-K como generador' }, { en: 'Front wing', es: 'Ala delantera' }, { en: 'Battery', es: 'Batería' }];
  const HL = [[3, 4], [2, 5], [0, 7], [5, 2], [0, 7], [2, 5]], HOT = ['ice', 'mguk', 'flap', 'harv', 'flap', 'batt'];
  D.state = (t) => {
    const g = K3.stage(t, ST, T.end), s = g.s;
    const speed = speedAt(t), ice = iceAt(t), mguk = kAt(t), batt = battAt(t), harv = harvAt(t), flap = flapAt(t), on = t > T.fire + 0.2;
    const st = { t, g, on, speed, ice, mguk, flap, brake: mguk < -1 ? Math.min(1, -mguk / K_KW) : 0, stats: { speed, ice, mguk, batt, harv, flap }, stn: s >= 0 && s < 6 ? s : -1, dial: g.dial };
    st.hot = s >= 0 && s < 6 ? HOT[s] : null; st.hl = s >= 0 && s < 6 ? HL[s] : null;
    st.dialCaption = s < 0 ? CAP.off : CAP.s[s];
    st.dialStatus = s < 0 ? { en: 'PARKED', es: 'EN PITS' } : s === 6 ? { en: 'FLAT OUT', es: 'A FONDO' } : `${speed.toFixed(0)} KM/H · ${(ice + Math.max(0, mguk)).toFixed(0)} KW`;
    const f = (x, d = 0) => x.toFixed(d);
    st.status = s < 0 ? { en: 'PARKED · engine off · battery 3.60 MJ', es: 'EN PITS · motor apagado · batería 3.60 MJ' } : [{ en: `FIRE · V6 ${f(ice)} kW`, es: `ENCIENDE · V6 ${f(ice)} kW` }, { en: `DEPLOY · ${f(ice)} + ${f(Math.max(0, mguk))} kW`, es: `ENTREGA · ${f(ice)} + ${f(Math.max(0, mguk))} kW` },
      { en: `STRAIGHT · flap ${f(flap)}° · ${f(speed)} km/h`, es: `RECTA · flap ${f(flap)}° · ${f(speed)} km/h` }, { en: `BRAKE · ${f(harv, 2)} MJ back`, es: `FRENA · ${f(harv, 2)} MJ de regreso` }, { en: `CORNER · flap ${f(flap)}° · ${f(speed)} km/h`, es: `CURVA · flap ${f(flap)}° · ${f(speed)} km/h` }, { en: `OVERTAKE · MGU-K ${f(Math.max(0, mguk))} kW`, es: `ADELANTA · MGU-K ${f(Math.max(0, mguk))} kW` }, { en: `LINE · ${f(speed)} km/h · ${f(batt, 2)} MJ left`, es: `TODO · ${f(speed)} km/h · quedan ${f(batt, 2)} MJ` }][s];
    st.focus = {}; if (FOCUS[s]) st.focus[FOCUS[s]] = g.focus;
    if (s >= 0 && s < 6) st.callout = { id: FOCUS[s], text: NAMES[s], a: g.callout };
    st.markers = g.markers;
    return st;
  };
  return { D, T, ST, ramp, lin, sm, speedAt, iceAt, kAt };
})();
const DEMO = G.D;

// ================= 3D =================
// Car along x (nose = +x), ground = bench top (y 0), camera side = +z. Bodies of revolution along x are modelled along +y and turned.
DEMO.build = (K) => {
  const { T: THREE, M, box, cyl, lathe, cutLathe, tube, plate, at, group, detail } = K;
  const S = DEMO.S = {}; const t0 = (i) => 0.1 + i * 0.075; // snaps together in about one second
  const PH0 = 0, PHL = Math.PI * 1.5; // cut quarter faces up and toward the camera (+z)
  const LIV = K.tint(M.enamelDeep, '#26346a'), CARB = K.tint(M.enamel, '#25272d'), TI = K.tint(M.steel, '#c3c8cf'), HOT = K.tint(M.copper, '#b8754d'), CUT = K.tint(M.signal, '#d8865a');
  CARB.clearcoat = 0.7; CARB.roughness = 0.38;
  const alongX = (obj, y = 0, z = 0) => { const g = new THREE.Group(); g.add(obj); g.rotation.z = -Math.PI / 2; g.position.set(0, y, z); return g; };
  K.part('bench', K.bench(150, 66, { plaque: ['Apex 1', 'LAB 25 · F1 2026', '400 kW + 350 kW'], plaqueX: 50, ruler: 40, rulerX: -40 }), { t: 0, dur: 0.4, from: [0, -6, 0], outline: false, sound: false });

  // wheels: 18 in rims, tyres ~72 cm tall (assumption), front 28 cm / rear 37.5 cm wide; brake discs glow under braking
  const R = 7.2, discM = new THREE.MeshPhysicalMaterial({ color: '#3a3b40', roughness: 0.6, metalness: 0.2, emissive: '#ff5a10', emissiveIntensity: 0 }); S.discM = discM;
  const wheel = (w, side) => {
    const g = new THREE.Group(), h = w / 2;
    g.add(lathe([[4.7, -h], [6.3, -h], [6.9, -h + 0.45], [R, -h + 1.3], [R, h - 1.3], [6.9, h - 0.45], [6.3, h], [4.7, h]], M.rubber, 64));
    g.add(at(K.torus(6.55, 0.09, M.signal, Math.PI * 2, 64), 0, side * (h + 0.02), 0, Math.PI / 2, 0, 0));          // sidewall stripe
    g.add(cyl(4.65, 4.65, w - 0.5, K.tint(M.steelDark, '#3a3d44'), 40));                                            // rim barrel
    const face = new THREE.Group(); for (let i = 0; i < 10; i++) face.add(at(box(3.6, 0.35, 0.5, K.tint(M.steelDark, '#4a4e57'), 0.1), 2.2 * Math.cos(i / 10 * Math.PI * 2), 0, 2.2 * Math.sin(i / 10 * Math.PI * 2), 0, -i / 10 * Math.PI * 2, 0));
    face.add(cyl(0.9, 0.9, 0.9, M.signal, 6)); face.position.y = side * (h - 0.3); g.add(face);
    g.add(at(cyl(3.4, 3.4, 0.45, discM, 40), 0, -side * (h + 0.4), 0));                                              // disc, inboard
    g.add(detail(at(box(1.6, 0.9, 2.6, M.red, 0.2), 2.7, -side * (h + 0.4), 2.2)));                                // caliper
    g.rotation.x = Math.PI / 2; const spin = new THREE.Group(); spin.add(g); return spin;
  };
  const W = new THREE.Group(); S.wheels = [];
  for (const [x, w, z] of [[30, 5.6, 16.2], [-38, 7.5, 15.25]]) for (const s of [1, -1]) { const wh = wheel(w, s); wh.position.set(x, R, s * z); W.add(wh); S.wheels.push(wh); }
  // suspension: two wishbones per corner and the rear driveshafts
  for (const s of [1, -1]) {
    for (const [a, b] of [[[27, 8.6, s * 5.4], [30, 8.4, s * 13.0]], [[33, 8.6, s * 5.2], [30, 8.4, s * 13.0]], [[27, 4.8, s * 5.4], [30, 5.8, s * 13.0]], [[33, 4.8, s * 5.2], [30, 5.8, s * 13.0]]]) W.add(detail(K3P.strut(a, b, 0.22, CARB)));
    for (const [a, b] of [[[-35, 8.2, s * 2.6], [-38, 8.6, s * 11.2]], [[-41, 8.2, s * 2.4], [-38, 8.6, s * 11.2]], [[-35, 4.4, s * 2.6], [-38, 5.4, s * 11.2]], [[-41, 4.4, s * 2.4], [-38, 5.4, s * 11.2]]]) W.add(detail(K3P.strut(a, b, 0.22, CARB)));
    W.add(at(cyl(0.45, 0.45, 8.6, M.steel, 16), -38, 7.0, s * 6.9, Math.PI / 2, 0, 0));
  }
  K.part('wheels', W, { t: t0(0) });

  // 2 monocoque + bodywork: tub, nose, cockpit, halo, airbox, sidepods, floor and the engine cover (cut)
  const C = new THREE.Group();
  C.add(at(box(30, 7, 11, LIV, 2.2), 21, 7.5, 0));                                                                // tub, x 6..36
  C.add(alongX(lathe([[3.3, 35], [3.1, 40], [2.6, 46], [1.9, 51], [1.2, 54.5], [0, 55.4]], LIV), 7.2, 0));        // nose cone
  C.add(at(box(7.5, 0.5, 5.6, M.black, 0.25), 14.5, 11.05, 0));                                                    // cockpit opening
  const helmet = group(K.sphere(1.75, M.white), at(box(1.2, 0.8, 2.6, M.black, 0.3), 1.2, 0.2, 0)); helmet.position.set(13, 12.2, 0); C.add(helmet);
  C.add(tube([[8.4, 11.2, 4.4], [10, 13.8, 4.3], [13.4, 14.5, 3.0], [15.8, 14.6, 0], [13.4, 14.5, -3.0], [10, 13.8, -4.3], [8.4, 11.2, -4.4]], 0.36, TI, { tension: 0.5 })); // halo
  C.add(K3P.strut([15.8, 14.6, 0], [18.6, 11.0, 0], 0.32, TI));                                                    // halo pillar
  C.add(at(box(4, 5.6, 3.6, LIV, 1.2), 6.2, 13.6, 0));                                                             // airbox / roll hoop
  C.add(at(box(0.3, 2.4, 2.2, M.black, 0.3), 8.15, 14.9, 0));                                                      // airbox mouth
  for (const s of [1, -1]) {                                                                                       // sidepods with inlets, x 6..20
    C.add(at(box(14, 6, 7, LIV, 1.8), 13, 5.1, s * 9));
    C.add(at(box(0.4, 4.0, 5.2, M.black, 0.3), 20.0, 5.4, s * 9));
    C.add(detail(at(box(12, 0.3, 0.4, M.signal), 13, 8.12, s * 12.3)));                                              // pinstripe
    C.add(at(box(12, 3.6, 4.4, LIV, 1.4), 0.5, 3.9, s * 8.1));                                                     // sidepod tail, kept low
  }
  C.add(at(box(58, 0.6, 22, CARB, 0.3), -7, 1.7, 0));                                                              // floor, x -36..22
  C.add(detail(at(box(50, 0.4, 3, K.tint(M.cream, '#c7a77a'), 0.1), -5, 1.2, 0)));                               // plank
  // engine cover: a coke-bottle shell along x, open in the quarter that faces the camera
  const cover = [[6.0, 5], [6.6, -4], [6.4, -14], [5.0, -24], [3.6, -34], [2.0, -42], [1.6, -42], [3.2, -34], [4.6, -24], [6.0, -14], [6.2, -4], [5.6, 5]];
  C.add(alongX(cutLathe(cover, LIV, PH0, PHL, CUT), 8.0, 0));
  C.add(detail(alongX(cutLathe([[6.65, -10], [6.7, -12], [6.5, -12], [6.45, -10]], M.signal, PH0, PHL, CUT), 8.0, 0)));  // orange band
  K.part('chassis', C, { t: t0(1), num: 2, anchor: [21, 11, 5.5] });

  // 1 front wing: main plane + two moving flaps, end plates, pylons to the nose
  const FW = new THREE.Group();
  FW.add(at(box(6, 0.35, 34, CARB, 0.15), 52, 1.6, 0));
  S.fflaps = [];
  for (const [x, y, len] of [[49.0, 2.4, 3.8], [46.0, 3.1, 3.2]]) { const f = new THREE.Group(); f.add(at(box(len, 0.26, 32.4, M.signal, 0.1), -len / 2, 0, 0)); f.position.set(x, y, 0); FW.add(f); S.fflaps.push(f); }
  for (const s of [1, -1]) FW.add(at(plate(12, 4.2, 0.35, 0.6, CARB), 49, 2.9, s * 17.2));
  for (const s of [1, -1]) FW.add(K3P.strut([51, 1.8, s * 2.2], [50, 5.9, s * 1.2], 0.3, CARB));
  K.part('fwing', FW, { t: t0(2), num: 1, anchor: [52, 3, 12] });

  // 3 energy store: lithium-ion pack in front of the engine, cells as ribs
  const ES = group(box(6, 2.8, 7, K.tint(M.steelDark, '#5d6470'), 0.4), detail(at(K.fins(6, 5.2, 0.4, 0.5, 1.05, K.tint(M.blueCable, '#4f8ff0')), 0, 1.6, 0, 0, Math.PI / 2, 0)));
  ES.position.set(2, 3.4, 0); K.part('battery', ES, { t: t0(3), num: 3 });

  // 6 MGU-K: motor-generator in front of the crank, case cut to show the copper winding and the rotor
  const MK = new THREE.Group();
  MK.add(cutLathe([[1.9, -6], [1.9, -2], [1.4, -2], [1.4, -6]], M.steel, PH0, PHL, CUT));
  MK.add(lathe([[1.38, -5.6], [1.38, -2.4]], M.copper, 40));
  S.krotor = group(cyl(0.9, 0.9, 3.4, M.steelDark, 24).translateY(-4), detail(at(K.box(0.3, 3.2, 1.6, M.chrome, 0.1), 0, -4, 0)));
  MK.add(S.krotor);
  const mk = alongX(MK, 4.2, 0); K.part('mguk', mk, { t: t0(4), num: 6, anchor: [-4, 6.2, 1.6] });
  S.hv = [[3.6, 4.4, 3.2], [2.6, 6.2, 3.6], [0, 6.6, 3.0], [-2.6, 6.0, 1.6]]; C.add(detail(tube(S.hv, 0.32, M.signal)));      // HV cable, battery to MGU-K

  // 4 V6: crankcase, two banks at 90°, heads with coils, plenum, crank, headers
  const V = new THREE.Group();
  V.add(at(box(13, 3.6, 5.4, M.iron, 0.5), -13.5, 4.4, 0));
  for (const s of [1, -1]) {
    const bank = group(box(13, 4.2, 3.0, M.iron, 0.4), at(box(13.4, 1.4, 3.4, K.tint(M.steel, '#9aa1ab'), 0.4), 0, 2.6, 0));
    for (let i = 0; i < 3; i++) bank.add(detail(at(cyl(0.38, 0.38, 1.4, M.red, 12), -4.2 + i * 4.2, 3.9, 0)));
    bank.rotation.x = s * Math.PI / 4; bank.position.set(-13.5, 7.0, s * 2.4); V.add(bank);
  }
  V.add(at(box(11, 1.4, 2.6, CARB, 0.4), -13.5, 10.4, 0));                                                          // plenum
  S.crank = alongX(group(cyl(0.6, 0.6, 15, M.chrome, 16).translateY(-13.5), detail(at(box(0.5, 1.6, 2.2, M.steel, 0.1), 0, -9.5, 0)), detail(at(box(0.5, 1.6, 2.2, M.steel, 0.1), 0, -17.5, 0))), 4.4, 0);
  V.add(S.crank);
  for (const s of [1, -1]) for (let i = 0; i < 3; i++) V.add(detail(tube([[-9.3 - i * 4.2, 7.4, s * 5.0], [-10 - i * 4.2, 5.6, s * 5.3], [-16 - i * 1.4, 5.2, s * 4.4], [-20.5, 5.4, s * 2.6], [-24.0, 5.6, s * 0.8], [-24.3, 6.4, 0]], 0.36, HOT)));
  K.part('ice', V, { t: t0(5), num: 4, anchor: [-13.5, 10, 4] });

  // 5 turbo: compressor (front) and turbine (back) on one shaft, housings cut, plus the tail pipe
  const TB = new THREE.Group();
  TB.add(cutLathe([[2.4, -21.2], [2.6, -22.0], [2.0, -22.8], [1.1, -22.8], [1.3, -21.2]], K.tint(M.steel, '#b9c0cb'), PH0, PHL, CUT));
  TB.add(cutLathe([[2.5, -23.4], [2.7, -24.4], [2.1, -25.2], [1.2, -25.2], [1.3, -23.4]], HOT, PH0, PHL, CUT));
  S.tshaft = group(at(K3P.bladeRing(0.5, 1.9, 1.0, 12, 0.7, M.chrome, { th: 0.08 }), 0, -22.0, 0), at(K3P.bladeRing(0.5, 2.0, 1.0, 13, -0.7, HOT, { th: 0.09 }), 0, -24.3, 0), cyl(0.25, 0.25, 4.4, M.steel, 12).translateY(-23.2));
  TB.add(S.tshaft);
  const tb = alongX(TB, 8.2, 0);
  const tg = group(tb, detail(tube([[-25.2, 8.2, 0], [-27, 9.6, 0], [-33, 10.2, 0], [-38, 10.0, 0], [-43.5, 9.6, 0]], 0.75, HOT)));
  K.part('turbo', tg, { t: t0(6), num: 5, anchor: [-23, 10.4, 2] });

  // 7 gearbox: tapered casing, cut to show two shafts of gears
  const GB = new THREE.Group();
  GB.add(alongX(cutLathe([[3.0, -26], [3.0, -33], [2.4, -40], [1.9, -40], [2.5, -33], [2.5, -26]], K.tint(M.steelDark, '#6d737d'), PH0, PHL, CUT), 5.4, 0));
  S.gears = [];
  for (let i = 0; i < 4; i++) { const a = K3P.gear(1.7 - i * 0.2, 0.7, 24 - i * 3, M.steel); a.rotation.z = Math.PI / 2; a.position.set(-27.5 - i * 2.3, 5.6, 0); GB.add(a); S.gears.push(a); }
  GB.add(at(cyl(0.3, 0.3, 11, M.chrome, 12), -31, 5.6, 0, 0, 0, Math.PI / 2));
  K.part('gearbox', GB, { t: t0(7), num: 7, anchor: [-31, 8, 2.5] });

  // 8 rear wing: main plane, moving flap, end plates, swan-neck pylons, rain light
  const RW = new THREE.Group();
  RW.add(at(box(5, 0.5, 20, CARB, 0.2), -50.5, 16.4, 0));
  S.rflap = new THREE.Group(); S.rflap.add(at(box(3.8, 0.3, 19.8, M.signal, 0.12), -1.9, 0, 0)); S.rflap.position.set(-48.2, 17.4, 0); RW.add(S.rflap);
  for (const s of [1, -1]) RW.add(at(plate(9, 11, 0.4, 0.8, CARB), -50.5, 13.4, s * 10.3));
  for (const s of [1, -1]) RW.add(K3P.strut([-40.5, 7.6, s * 1.4], [-49.2, 16.2, s * 1.4], 0.32, CARB));
  RW.add(detail(at(box(1.0, 0.8, 2.4, K.tint(M.red, '#ff3b30'), 0.2), -46.6, 5.2, 0)));
  K.part('rwing', RW, { t: t0(8), num: 8, anchor: [-50, 19, 6] });

  // flows: battery energy (blue out, green back), intake air (white), exhaust (orange), air over the rear wing
  S.eOut = K3P.flow(S.hv, { r: 0.34, color: '#4f8ff0', gap: 1.2 }); K.scene.add(S.eOut.obj);
  S.eBack = K3P.flow(S.hv, { r: 0.34, color: '#3c9d63', gap: 1.2 }); K.scene.add(S.eBack.obj);
  S.intake = K3P.flow([[9, 15.4, 0], [5, 15.3, 0], [-2, 13.8, 0], [-8, 11.6, 0], [-13, 11.2, 0]], { r: 0.34, len: 0.9, color: '#f2f2f2', glow: 0.6, gap: 2.2 }); K.scene.add(S.intake.obj);
  S.exh = K3P.flow([[-14, 5.2, 4.4], [-20.5, 5.4, 2.6], [-24, 5.6, 0.8], [-24.3, 8.2, 0], [-27, 9.6, 0], [-33, 10.2, 0], [-38, 10.0, 0], [-46, 9.6, 0]], { r: 0.4, len: 1.0, color: '#ff8a3d', gap: 2.4 }); K.scene.add(S.exh.obj);
  S.airS = [], S.airC = [];
  for (const z of [-5, 0, 5]) {
    const a = K3P.flow([[-30, 19.6, z], [-44, 19.6, z], [-52, 19.7, z], [-66, 19.8, z]], { r: 0.26, len: 1.6, color: '#9cc4ee', glow: 0.8, gap: 6 }); K.scene.add(a.obj); S.airS.push(a);
    const b = K3P.flow([[-30, 19.6, z], [-44, 19.7, z], [-50, 21.0, z], [-56, 24.0, z], [-64, 27.6, z]], { r: 0.26, len: 1.6, color: '#9cc4ee', glow: 0.8, gap: 6 }); K.scene.add(b.obj); S.airC.push(b);
  }
  S.jet = K3P.spray(10, 2.2, '#ff8a3d'); S.jet.obj.rotation.z = Math.PI / 2; S.jet.obj.position.set(-44, 9.7, 0); K.scene.add(S.jet.obj);
  for (const p of K.parts) if (p.id !== 'bench') p.dur = 0.5;
  K.fitShadow(190, [0, 8, 0]);

  const CM = DEMO.CAM = {
    build: K.look([0, 7, 0], 30, 18, 300, 20), over: K.look([0, 7, 0], 34, 17, 262, 20), line: K.look([0, 7, 0], 28, 15, 258, 20),
    fire: K.look([-10, 8, 2], 30, 32, 168, 20), deploy: K.look([-1, 6, 2], 40, 30, 150, 20), straight: K.look([-2, 10, 0], 16, 12, 250, 20),
    brake: K.look([20, 7, 8], 56, 16, 175, 20), corner: K.look([-38, 13, 0], -32, 16, 190, 20), over_: K.look([2, 7, 0], 58, 11, 235, 20),
  };
  CM.build.drift = 0.03; CM.over.drift = 0.02; CM.line.spin = 6;
  DEMO.SHOTS = [[0, CM.build], [1.0, CM.over], [G.T.fire, CM.fire], [G.T.deploy, CM.deploy], [G.T.straight, CM.straight], [G.T.brake, CM.brake], [G.T.corner, CM.corner], [G.T.over, CM.over_], [G.T.line, CM.line]];
};
DEMO.camera = (t) => K3.camAt(DEMO.SHOTS, t, 0.85, 0.06);

DEMO.update = (K, st, t) => {
  const S = DEMO.S, T = G.T, win = (a, b, f = 0.35) => G.ramp(t, a, a + f) * (1 - G.ramp(t, b - f, b)), line = G.ramp(t, T.line + 0.2, T.line + 0.8);
  // integrate wheel and engine angles from the speed history so every seek gives the same frame (shown far slower than real)
  let aw = 0, ae = 0; for (let x = 0; x < t; x += 1 / 60) { aw += G.speedAt(x) / 330 * 9 / 60; ae += (x > T.fire + 0.2 ? 0.35 + 0.65 * G.iceAt(x) / 400 : 0) * 14 / 60; }
  for (const w of S.wheels) w.rotation.z = -aw;
  S.crank.children[0].rotation.y = ae; S.krotor.rotation.y = ae; S.tshaft.rotation.y = ae * 1.7; S.gears.forEach((g, i) => { g.rotation.x = ae * (0.6 + i * 0.15); });
  // flaps: angle of attack in degrees (corner 28, straight 8)
  const fa = -st.flap * Math.PI / 180; S.rflap.rotation.z = fa; S.fflaps[0].rotation.z = fa * 0.8; S.fflaps[1].rotation.z = fa;
  // brakes
  S.discM.emissiveIntensity = 2.4 * st.brake * (0.85 + 0.15 * Math.sin(t * 23));
  // energy: out (blue) when the MGU-K drives, back (green) when it harvests
  S.eOut.set(t, 1.4, Math.min(1, Math.max(0, st.mguk) / 120));
  S.eBack.set(t, 1.4, Math.min(1, Math.max(0, -st.mguk) / 120), -1);
  const run = st.on ? Math.min(1, st.ice / 150) : 0;
  S.intake.set(t, 0.8, Math.max(win(T.fire + 0.4, T.deploy), line) * run);
  S.exh.set(t, 1.1, Math.max(win(T.fire + 0.4, T.deploy), win(T.over, T.line), line) * run);
  S.jet.set(Math.max(win(T.fire + 0.6, T.deploy, 0.5), line) * run * 0.6);
  const air = Math.max(win(T.straight, T.brake), win(T.corner, T.over), line) * Math.min(1, st.speed / 120), kc = Math.max(0, Math.min(1, (st.flap - 8) / 20));
  S.airS.forEach(f => f.set(t, 0.9, air * (1 - kc))); S.airC.forEach(f => f.set(t, 0.9, air * kc));
};

// ================= 2D schematic: the car from the side =================
DEMO.schematic.draw = (c, b, st) => {
  const { x, y, w } = b, O = SK.org, on = (i) => st.stn === i, t = st.t;
  const gy = y + 118, X = (u) => x + 24 + (w - 44) * u, Y = (v) => gy - v;   // u: 0 rear .. 1 nose; v: height in px
  // ground, wheels, body outline
  SK.line(c, [[X(-0.02), gy], [X(1.02), gy]], '#b9bbc0', 1);
  for (const u of [0.16, 0.77]) { SK.circ(c, X(u), Y(17), 17, '#2b2d33'); SK.circ(c, X(u), Y(17), 9, on(3) && st.brake > 0.1 ? SK.orgL : '#d9d9dc'); }
  SK.line(c, [[X(0.05), Y(10)], [X(0.92), Y(10)]], SK.ink, 1.4);
  SK.line(c, [[X(0.08), Y(16)], [X(0.22), Y(26)], [X(0.38), Y(34)], [X(0.47), Y(40)], [X(0.5), Y(52)], [X(0.54), Y(40)], [X(0.62), Y(32)], [X(0.85), Y(28)], [X(1.0), Y(20)]], SK.ink, 1.2);
  // power unit blocks: battery, MGU-K, V6, turbo
  SK.rect(c, X(0.47), Y(25), X(0.53) - X(0.47), 12, on(5) || on(1) ? SK.orgL : '#c9d4ea');
  SK.rect(c, X(0.41), Y(28), X(0.45) - X(0.41), 14, on(1) || on(3) ? SK.orgL : '#f3d9c8');
  SK.rect(c, X(0.29), Y(32), X(0.4) - X(0.29), 20, on(0) ? SK.orgL : '#e8e2d9');
  SK.circ(c, X(0.265), Y(26), 5, on(0) ? SK.orgL : '#f3d9c8');
  SK.text(c, 'V6', X(0.345), Y(19), on(0) ? O : '#6e7075', 7, 'center'); SK.text(c, 'K', X(0.43), Y(18), on(1) || on(3) ? O : '#6e7075', 7, 'center'); SK.text(c, 'ES', X(0.5), Y(16), on(5) ? O : '#5b86b8', 7, 'center');
  // energy arrows between battery and MGU-K
  const k = st.stats.mguk;
  if (Math.abs(k) > 5) for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1, a = X(0.47), bb = X(0.45); const xx = k > 0 ? a - (a - bb) * ph : bb + (a - bb) * ph; SK.arrow(c, xx + (k > 0 ? 4 : -4), Y(34), xx + (k > 0 ? -2 : 2), Y(34), k > 0 ? '#4f8ff0' : '#3c9d63'); }
  // wings with the live flap angle
  const fl = st.flap * Math.PI / 180;
  const wing = (u, v, len, hot) => { SK.line(c, [[X(u), Y(v)], [X(u) - len, Y(v)]], SK.ink, 2); SK.line(c, [[X(u) - len - 2, Y(v + 3)], [X(u) - len - 2 - Math.cos(fl) * len * 0.8, Y(v + 3) - Math.sin(fl) * len * 0.8]], hot ? O : SK.ink, 2); };
  wing(0.07, 44, 14, on(2) || on(4)); wing(1.0, 8, 12, on(2) || on(4));
  // air over the rear wing: straight on straights, kicked up in corners (the push down on the car)
  if (st.speed > 30) for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1, xx = X(0.12) - ph * 44, up = Math.max(0, (st.flap - 8) / 20) * ph * 22; SK.arrow(c, xx + 6, Y(56) - up * 0.6, xx, Y(56) - up, '#7fb0e8'); }
  SK.text(c, `${st.stats.flap.toFixed(0)}°`, X(0.02), Y(64), on(2) || on(4) ? O : '#6e7075', 7, 'left');
  SK.text(c, `${st.speed.toFixed(0)} km/h`, X(1.0), Y(64), '#6e7075', 8, 'right');
};

DEMO.audioCues = () => {
  const T = G.T, cues = [];
  for (const t of G.ST) cues.push({ type: 'detent', t }, { type: 'whoosh', t: t + 0.05, t1: t + 0.8 });
  cues.push({ type: 'thud', t: T.fire + 0.3 }, { type: 'whir', t: T.fire + 0.3, t1: T.brake + 0.4, f: 160, gain: 0.18 }, { type: 'whir', t: T.deploy + 0.4, t1: T.straight + 2, f: 420, gain: 0.08 }, { type: 'whir', t: T.brake + 0.6, t1: T.brake + 3.6, f: 300, gain: 0.08 }, { type: 'whir', t: T.corner + 1.6, t1: T.end, f: 170, gain: 0.18 }, { type: 'ding', t: T.over + 0.6 });
  return cues;
};
