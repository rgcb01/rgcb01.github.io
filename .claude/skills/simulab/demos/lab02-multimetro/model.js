// ---------------------------------------------------------------------------
// Lab 02 · Multímetro. Simulated readings with typical values (sources in demo.json note).
// One chapter per function; fn = id in the FUNCIONES bay (10 functions: hz chapter covers Hz and %).
// ---------------------------------------------------------------------------
const MM = {
  bat9: 9.42, mains: 126.8, r: 218.6, ledVf: 1.82, cap: 98.7, pwmHz: 490.2, duty: (128 / 255) * 100,
  tRoom: 24.1, tCoffee: 68.4, vLed: 2.0, rLed: 220,
};
MM.iLed = ((5 - MM.vLed) / MM.rLed) * 1000; // 13.6 mA, same circuit as Lab 00
const MM_FN = [
  ['vdc', 'VOLTAJE DC'], ['vac', 'VOLTAJE AC'], ['ohm', 'RESISTENCIA'], ['cont', 'CONTINUIDAD'], ['diode', 'DIODO'],
  ['cap', 'CAPACITANCIA'], ['hz', 'FRECUENCIA'], ['pct', 'CICLO %'], ['temp', 'TEMPERATURA'], ['ma', 'CORRIENTE'],
];
const MM_CH = [
  { id: 'anat', btn: 'Conoce', title: 'CONOCE TU MULTÍMETRO', dial: 'OFF', dur: 5.4,
    tip: ['Negro: siempre en COM.', 'Rojo: en VΩ casi siempre.'] },
  { id: 'vdc', btn: 'V DC', title: 'VOLTAJE DC', dial: 'VDC', fn: 'vdc', dur: 6.8, conn: 'paralelo', red: ['pila', '+'], black: ['pila', '-'], lab: 'pila',
    tip: ['En paralelo: rojo al +, negro al -.', 'Si sale -9.42, invertiste las puntas.'] },
  { id: 'vac', btn: 'V AC', title: 'VOLTAJE AC', dial: 'VAC', fn: 'vac', dur: 6.8, conn: 'paralelo', red: ['strip', 'F3'], black: ['strip', 'N3'], lab: 'strip',
    tip: ['127 V: dedos detrás de la guarda.', 'HOLD congela la lectura.'] },
  { id: 'ohm', btn: 'Ω', title: 'RESISTENCIA', dial: 'OHM', fn: 'ohm', dur: 5.4, conn: 'apagado', red: ['bb', 'h14'], black: ['bb', 'h10'], lab: 'res',
    tip: ['Siempre SIN energía.', '220 Ω ±5 %: 218.6 está bien.'] },
  { id: 'cont', btn: 'Continuidad', title: 'CONTINUIDAD', dial: 'OHM', sel: 'beep', fn: 'cont', dur: 6.4, conn: 'apagado', red: ['bb', 'c25'], black: ['bb', 'c22'], lab: 'btn',
    tip: ['Pita si hay camino (pocos Ω).', 'Para cables, fusibles y botones.'] },
  { id: 'diode', btn: 'Diodo', title: 'DIODO', dial: 'OHM', sel: 'diode', fn: 'diode', dur: 5.8, conn: 'apagado', red: ['bb', 'h10'], black: ['bb', 'h9'], lab: 'led',
    tip: ['Rojo al ánodo: muestra la caída.', 'LED rojo ≈ 1.8 V. Al revés: OL.'] },
  { id: 'cap', btn: 'Capacitancia', title: 'CAPACITANCIA', dial: 'CAP', fn: 'cap', dur: 5.6, conn: 'descargado', red: ['bb', 'd5'], black: ['bb', 'd4'], lab: 'cap',
    tip: ['Descárgalo antes de medir.', 'Rojo a la pata +. Tarda un poco.'] },
  { id: 'hz', btn: 'Hz y %', title: 'FRECUENCIA Y CICLO', dial: 'HZ', fn: 'hz', dur: 6.6, conn: 'paralelo', red: ['uno', 'D9'], black: ['uno', 'GND2'], lab: 'uno',
    tip: ['analogWrite(9, 128) en el UNO:', '490 Hz y 50 % de ciclo.'] },
  { id: 'temp', btn: '°C', title: 'TEMPERATURA', dial: 'TEMP', fn: 'temp', dur: 6.0, conn: 'termopar', lab: 'taza',
    tip: ['Termopar tipo K en VΩ y COM.', 'Del aire (24 °C) al café.'] },
  { id: 'ma', btn: 'mA', title: 'CORRIENTE', dial: 'mA', fn: 'ma', dur: 7.4, conn: 'serie', red: ['bb', 'i17'], black: ['bb', 'i14'], lab: 'led',
    tip: ['Corriente: EN SERIE.', 'Abre el circuito; el multímetro lo cierra.'] },
  { id: 'big', btn: '10A', title: 'CORRIENTE GRANDE', dial: 'mA', dur: 4.2, conn: 'serie',
    tip: ['Motores y cargas grandes: jack 10A.', 'Al terminar, regresa el rojo a VΩ.'] },
];
