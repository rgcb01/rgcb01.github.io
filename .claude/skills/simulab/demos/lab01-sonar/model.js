// ---------------------------------------------------------------------------
// KR-01 model. Every number the figure shows comes from this file.
// Facts: HC-SR04 datasheet (ElecFreaks): 10 us trigger, 8 cycles at 40 kHz,
// 2-400 cm, 15 deg, >60 ms between readings, uS/58 = cm. TT motor 1:48,
// wheel 65 mm. Speed of sound 343 m/s at 20 C.
// Assumption (stated on the page): 25 cm/s ground speed at PWM 150.
// ---------------------------------------------------------------------------
const K = {
  SOUND: 0.0343,          // cm per microsecond (343 m/s, 20 C)
  TRIG_US: 10,
  FREQ: 40000, BURST: 8,  // 8 cycles at 40 kHz = 200 us
  LOOP_DELAY: 0.060,      // s, delay(60)
  TIMEOUT_US: 30000,      // pulseIn timeout
  PWM: 150,
  V: 25,                  // cm/s at PWM 150 (model assumption)
  TAU: 0.06,              // s, motor speed response
  WHEEL_R: 3.25,          // cm (65 mm wheel)
  TRACK: 17.2,            // cm between wheel centres (drawn at y = ±8.6)
  AXLE_X: -4.5,           // wheel axle, robot local x: the robot pivots here, not at the chassis centre
  SENSOR_X: 10.4,         // sensor face, robot local x
  SENSOR_Z: 5.9,
  TX_Y: 1.3, RX_Y: -1.3,
  D0: 70,                 // start distance sensor -> box
  UMBRAL: 20,             // cm
  T_STOP: 0.150, T_BACK: 0.300, T_TURN: 0.450,
  MAX_RANGE: 400,
};
K.BOX = { x0: K.SENSOR_X + K.D0, x1: K.SENSOR_X + K.D0 + 30, y0: -11, y1: 11, h: 8 };
K.LAMBDA = (K.SOUND * 1e6) / K.FREQ; // cm (0.8575)

function rayToBox(px, py, dx, dy) {
  const b = K.BOX;
  let tmin = -Infinity, tmax = Infinity;
  for (const [p, d, lo, hi] of [[px, dx, b.x0, b.x1], [py, dy, b.y0, b.y1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return 0; continue; }
    let t1 = (lo - p) / d, t2 = (hi - p) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
  }
  if (tmax < tmin || tmin <= 0 || tmin > K.MAX_RANGE) return 0;
  return tmin;
}

function simulate(umbral) {
  const dt = 0.0005;
  const st = { t: 0, x: 0, y: 0, yaw: 0, vL: 0, vR: 0, thL: 0, thR: 0, cL: 0, cR: 0 };
  const samples = [], pings = [];
  let decision = null, lastSample = -1, ax = K.AXLE_X, ay = 0; // axle midpoint; the chassis origin sits -AXLE_X ahead
  const rec = () => {
    const k = Math.round(st.t * 1000);
    if (k !== lastSample) { samples.push({ t: st.t, x: st.x, y: st.y, yaw: st.yaw, thL: st.thL, thR: st.thR, vL: st.vL, vR: st.vR, cL: st.cL, cR: st.cR }); lastSample = k; }
  };
  const advance = (dur) => {
    const n = Math.max(1, Math.round(dur / dt));
    const h = dur / n;
    for (let i = 0; i < n; i++) {
      const a = 1 - Math.exp(-h / K.TAU);
      st.vL += (st.cL * K.V - st.vL) * a;
      st.vR += (st.cR * K.V - st.vR) * a;
      // izq is the -y wheel (movimiento.js), so izq ahead of der turns toward +y: the robot's right on screen
      const v = (st.vL + st.vR) / 2, w = (st.vL - st.vR) / K.TRACK;
      ax += v * Math.cos(st.yaw) * h;
      ay += v * Math.sin(st.yaw) * h;
      st.yaw += w * h;
      st.x = ax - K.AXLE_X * Math.cos(st.yaw);
      st.y = ay - K.AXLE_X * Math.sin(st.yaw);
      st.thL += (st.vL / K.WHEEL_R) * h;
      st.thR += (st.vR / K.WHEEL_R) * h;
      st.t += h;
      rec();
    }
  };
  const motors = (l, r) => { st.cL = l; st.cR = r; };
  rec();
  let tEnd = 99;
  while (st.t < tEnd) {
    // medir(): TRIG LOW 2us, HIGH 10us, then pulseIn
    const sx = st.x + Math.cos(st.yaw) * K.SENSOR_X, sy = st.y + Math.sin(st.yaw) * K.SENSOR_X;
    const dTrue = rayToBox(sx, sy, Math.cos(st.yaw), Math.sin(st.yaw));
    const tStart = st.t;
    advance(12e-6);
    const echoUs = dTrue > 0 ? Math.round((2 * dTrue) / K.SOUND) : 0;
    advance((echoUs > 0 ? echoUs : K.TIMEOUT_US) * 1e-6);
    const d = echoUs * K.SOUND / 2; // what the Arduino computes
    const ping = { t: tStart, tReturn: st.t, d, dTrue, echoUs, x: sx, y: sy, yaw: st.yaw };
    pings.push(ping);
    if (d > 0 && d < umbral) {
      if (!decision) { decision = { ping: pings.length - 1, t: st.t }; tEnd = st.t + K.T_STOP + K.T_BACK + K.T_TURN + 3.4; }
      motors(0, 0); advance(K.T_STOP);
      motors(-1, -1); advance(K.T_BACK);
      motors(1, -1); advance(K.T_TURN);
    } else {
      motors(1, 1);
    }
    advance(K.LOOP_DELAY);
    if (st.t > 12) break;
  }
  return { samples, pings, decision, umbral, tEnd: st.t };
}

function sampleAt(sim, t) {
  const S = sim.samples;
  if (t <= S[0].t) return S[0];
  if (t >= S[S.length - 1].t) return S[S.length - 1];
  let lo = 0, hi = S.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m].t <= t) lo = m; else hi = m; }
  const a = S[lo], b = S[hi], f = (t - a.t) / Math.max(1e-9, b.t - a.t);
  const o = {};
  for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f;
  return o;
}

function lastPingBefore(sim, t) {
  let p = null;
  for (const q of sim.pings) { if (q.tReturn <= t) p = q; else break; }
  return p;
}
