// ---------------------------------------------------------------------------
// Lab 03 · Cautín. Thermal model of 4 through-hole joints, driven by an input track [t, key, v]:
//   iron 1|0 (cautín pressed), solder 1|0 (wire at the joint), solderTip 1|0 (wire on the tip), tset °C.
// A tool touches `travel` s after it is pressed. Data with sources and assumptions: demo.json note.
// ---------------------------------------------------------------------------
const CT = {
  Tamb: 25, Tm: 183,              // Sn63Pb37 eutectic: melts at 183 °C (MG Chemicals, Kester datasheets)
  tauH: 1.0, tauC: 1.5,           // s: joint heats towards the tip while touching / cools in air (assumption)
  feed: 3.0,                      // mm of 0.8 mm wire per second while feeding (assumption)
  dmgT: 200, dmgK: 1 / 1350,      // pad damage (Tj - 200) / 1350 per s: ~10 s of contact at 340 °C (iFixit: > 10 s)
  good: [1.5, 4.5],               // mm of wire for a full fillet on a 2 mm pad (assumption)
  ideal: [2, 3], ok: 5, max: 10,  // contact time, s: ideal 2-3 s (JLCPCB, iFixit), < 5 s (onsemi), > 10 s risks the pad (iFixit, onsemi)
};
const CT_DT = 1 / 120, CT_CP = 0.25, CT_HZ = 30;
const CT_RES = {
  buena: ['VOLCÁN', 'brillante y cóncavo', '✓'], fria: ['BOLITA FRÍA', 'no mojó el pad', '✗'], poca: ['POCA SOLDADURA', 'no cubre el pad', '✗'],
  mucha: ['DEMASIADA', 'bola convexa', '✗'], pad: ['PAD LEVANTADO', 'demasiado calor', '✗'], quemada: ['QUEMADA', 'opaca: sin flux', '✗'], nada: ['SIN SOLDADURA', 'falta alambre', '✗'],
};
const ctJoint = () => ({ Tj: CT.Tamb, wet: 0, ball: 0, s: 0, flux: 0, oxid: 0, dmg: 0, lift: 0, dwell: 0, fed: 0, res: 0, burn: 0, E: 0, done: false, result: null, tDone: null });
const ctNew = (tset) => ({ t: 0, ei: 0, tset, drop: 0, tipE: 0, fedTotal: 0, cur: 0, curT: -9, prev: 0, act: 0, board: 0, U: [0, 1, 2, 3].map(ctJoint),
  inp: { iron: 0, ironT0: -9, ironT1: -9, sol: 0, solT0: -9, solT1: -9, tip: 0, tipT0: -9, tipT1: -9 } });

function ctVeredicto(u) {
  if (u.wet + u.ball < 0.3) return 'nada';
  if (u.lift > 0.5) return 'pad';
  if (u.ball > u.wet || u.s < 0.65) return 'fria';
  if (u.oxid > 0.6) return 'quemada';
  if (u.wet < CT.good[0]) return 'poca';
  if (u.wet > CT.good[1]) return 'mucha';
  return 'buena';
}
function ctInput(S, [t, key, v]) {
  const I = S.inp;
  if (key === 'tset') { S.tset = v; return; }
  const f = { iron: 'iron', solder: 'sol', solderTip: 'tip' }[key]; if (!f) return;
  if (I[f] === v) return;
  I[f] = v; if (v) I[f + 'T0'] = t; else I[f + 'T1'] = t;
  if (f === 'iron' && v && S.U.every(u => u.done)) { S.U = [0, 1, 2, 3].map(ctJoint); S.board++; S.prev = S.cur; S.cur = 0; S.curT = t; }  // board full: a new one
}
function ctStep(S, dt, travel) {
  const I = S.inp, t = S.t, Ttip = S.tset;
  const iron = I.iron && t - I.ironT0 >= travel, sol = I.sol && t - I.solT0 >= travel, tip = I.tip && t - I.tipT0 >= travel;
  const k = S.cur, u = S.U[k];
  if (iron) S.act = k;
  S.U.forEach((v, j) => {
    const touch = iron && j === k;
    v.Tj += ((touch ? Ttip : CT.Tamb) - v.Tj) * (1 - Math.exp(-dt / (touch ? CT.tauH : CT.tauC)));
    if (touch) v.dwell += dt;
    const fb = (Math.max(0, v.Tj - 150) / 150) * 0.55;                       // flux burns faster when hotter (assumption)
    v.flux *= Math.exp(-fb * dt);
    const has = v.wet + v.ball > 0.05;
    if (has && v.Tj > CT.Tm) v.oxid = clamp(v.oxid + dt * (v.flux < 0.15 ? 0.35 : 0.05) * (v.Tj - CT.Tm) / 150);
    if (v.res > 0 && v.Tj > 250) v.burn = clamp(v.burn + dt * ((v.Tj - 250) / 900) * (v.flux < 0.2 ? 1 : 0.3));
    if (v.Tj > CT.dmgT) v.dmg += dt * (v.Tj - CT.dmgT) * CT.dmgK;
    v.lift = clamp((v.dmg - 0.85) / 0.3);
    if (v.wet > 0.05 && v.Tj > CT.Tm) { const r = 4.5 * clamp((v.Tj - CT.Tm) / 50) * (v.flux > 0.1 ? 1 : 0.08); v.s += (1 - v.s) * (1 - Math.exp(-r * dt)); }
    if (v.ball > 0.05 && v.Tj > CT.Tm + 20 && v.flux > 0.2) { const m = Math.min(v.ball, v.ball * 1.5 * dt); v.ball -= m; v.wet += m; }
    v.E = clamp(v.E * Math.exp(-dt / 0.25) + (has ? v.flux * fb * 1.6 : 0) * dt * 4);
  });
  const dv = CT.feed * dt;
  if (sol && !u.done) {
    if (u.Tj >= CT.Tm) { u.wet += dv; u.flux = Math.min(1, u.flux + dv * 0.6); u.res = Math.min(1, u.res + dv * 0.5); u.fed += dv; S.fedTotal += dv; u.E = 1; }
    else if (iron && Ttip > CT.Tm) { u.ball += dv; u.fed += dv; S.fedTotal += dv; S.tipE = 1; }   // melts against the tip, beads on the cold pad
  }
  if (tip && Ttip > CT.Tm) { S.drop += dv; S.fedTotal += dv; S.tipE = 1; }
  if (iron && S.drop > 0 && !u.done) { const m = Math.min(S.drop, dt * 8); S.drop -= m; u.ball += m; u.fed += m; }
  S.tipE *= Math.exp(-dt / 0.3);
  // the attempt closes when the iron is away and the solder is solid
  if (!iron && !u.done && u.fed > 0.3 && u.Tj < CT.Tm) {
    u.done = true; u.result = ctVeredicto(u); u.tDone = t + dt;
    const nx = S.U.findIndex(w => !w.done);
    if (nx >= 0) { S.prev = k; S.cur = nx; S.curT = t + dt; }
  }
}
// simulation over an event track (cached checkpoints every CT_CP s; histories at CT_HZ for smoke and the chart)
class CtSim {
  constructor(tset, travel) { this.tset = tset; this.travel = travel; this.reset([]); }
  reset(evs) { this.evs = evs; this.cps = [ctNew(this.tset)]; this.H = { E: [[], [], [], []], tip: [], T: [] }; }
  sync(evs, v) {        // live track: on a new event drop checkpoints after it
    if (evs !== this.evs) { this.reset(evs); this.v = v; return; }
    if (v !== this.v) { this.v = v; const te = evs.length ? evs[evs.length - 1][0] : 0; while (this.cps.length > 1 && this.cps[this.cps.length - 1].t > te) this.cps.pop(); }
  }
  adv(S, t1) {
    const evs = this.evs;
    while (S.t < t1 - 1e-9) {
      const dt = Math.min(CT_DT, t1 - S.t);
      while (S.ei < evs.length && evs[S.ei][0] <= S.t + dt) ctInput(S, evs[S.ei++]);
      ctStep(S, dt, this.travel); S.t += dt;
      const i = Math.round(S.t * CT_HZ);
      if (Math.abs(S.t * CT_HZ - i) < CT_DT * CT_HZ * 0.5) { S.U.forEach((u, j) => (this.H.E[j][i] = u.E)); this.H.tip[i] = S.tipE; this.H.T[i] = Math.max(...S.U.map(u => u.Tj)); }
    }
  }
  at(t) {
    t = Math.max(0, t);
    const n = Math.floor(t / CT_CP);
    while (this.cps.length <= n) { const S = structuredClone(this.cps[this.cps.length - 1]); this.adv(S, this.cps.length * CT_CP); this.cps.push(S); }
    const S = structuredClone(this.cps[n]); this.adv(S, t); return S;
  }
  hist(arr, te) { const v = arr[Math.round(te * CT_HZ)]; return v === undefined ? 0 : v; }
}
