// ---------------------------------------------------------------------------
// Lab E1 · Espresso. One input, the grind setting (1 fine .. 10 coarse), decides how fast 9 bar of water
// crosses the puck, and so how long 36 g take and how the shot tastes. Data and assumptions: demo.json note.
// ---------------------------------------------------------------------------
const ES = {
  dose: 18, target: 36,          // g in, g out: 1:2 ratio (Clive Coffee, Equator Coffees)
  bar: 9, preT: 5, preBar: 3,    // 9 bar brew pressure (INEI 9 ± 1 bar); 5 s pre-infusion at ~3 bar (assumption)
  d0: 200, dK: 40,               // grind setting g -> particle size 200 + 40 g µm (assumption)
  dRef: 400, tRef: 28,           // calibration: setting 5 (400 µm) pulls 36 g in 28 s (assumption, inside 25-30 s)
  maxT: 60,                      // the barista stops a choked shot at 60 s (assumption)
};
const esD = (g) => ES.d0 + ES.dK * g;
// flow through the puck grows with particle size squared (Darcy / Kozeny-Carman: permeability ∝ d²)
const esQ = (g) => (ES.target / (ES.tRef - ES.preT)) * Math.pow(esD(g) / ES.dRef, 2);
// time from pump on to 36 g (or to the 60 s stop)
const esT = (g) => Math.min(ES.maxT, ES.preT + ES.target / esQ(g));
// taste by shot time: < 20 s sour, > 35 s bitter (Clive Coffee troubleshooting guide); 25-30 s the target window
const ES_RES = [
  [20, 'AGRIO', 'muy rápido: le falta extracción', 'coral'],
  [25, 'UN POCO RÁPIDO', 'muele un poco más fino', 'amber'],
  [30, 'BALANCEADO', 'en la ventana de 25-30 s', 'lime'],
  [35, 'UN POCO LENTO', 'muele un poco más grueso', 'amber'],
  [1e9, 'AMARGO', 'muy lento: se extrajo de más', 'coral'],
];
const esVeredicto = (T) => ES_RES.find(r => T < r[0]);
// shot state at model time tm (s since the pump started)
function esAt(g, tm) {
  const Q = esQ(g), T = esT(g), on = tm >= 0 && tm < T;
  const grams = clamp(Q * (Math.min(tm, T) - ES.preT), 0, ES.target);
  let bar = 0;
  if (tm >= 0 && tm < T) bar = tm < ES.preT ? ES.preBar * smooth(tm / 1.2) : lerp(ES.preBar, ES.bar, smooth((tm - ES.preT) / 0.8));
  else if (tm >= T) bar = ES.bar * (1 - smooth((tm - T) / 0.6));
  const flowing = on && tm > ES.preT ? 1 : 0;
  return { g, Q, T, grams, choked: tm >= T && grams < ES.target - 0.05, pre: on && tm < ES.preT, bar, pump: on ? 1 : 0, flowing, done: tm >= T, shotT: clamp(tm, 0, T), res: esVeredicto(T) };
}
