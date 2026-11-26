// ---------------------------------------------------------------------------
// Lab 01 code: ARMADO (one line per part, ids from demo.js) and SONAR (real Arduino sketch).
// ---------------------------------------------------------------------------
const ARMADO = [
  ['// KR-01 · cada línea coloca una pieza real'],
  ["import { Robot } from './kapri-lab.js';"],
  ["const kr = new Robot('KR-01', { escala: 'cm' });"],
  [''],
  ["kr.chasis({ acrilico: 3, mm: [210, 140] });", ['chasis']],
  ["kr.soporte('der'); kr.soporte('izq');", ['soporte_der', 'soporte_izq']],
  ["kr.motor('der', TT_1_48);", ['motor_der']],
  ["kr.motor('izq', TT_1_48);", ['motor_izq']],
  ["kr.rueda('der', { d: 65 });", ['rueda_der']],
  ["kr.rueda('izq', { d: 65 });", ['rueda_izq']],
  ['kr.ruedaLoca({ bola: 16 });', ['rueda_loca']],
  ['kr.separadores(4, { h: 10 });', ['separador_1', 'separador_2', 'separador_3', 'separador_4']],
  ["kr.uno('R3');", ['uno']],
  ["kr.portapilas('2x18650');", ['portapilas']],
  ['kr.pila(1); kr.pila(2);', ['pila_1', 'pila_2']],
  ['kr.interruptor();', ['interruptor']],
  ['kr.l298n();', ['l298n']],
  ['kr.disipador();', ['disipador']],
  ['kr.protoboard(170);', ['protoboard']],
  ['kr.soporteSensor();', ['soporte_sensor']],
  ["kr.sonar('HC-SR04');", ['hc_sr04']],
  ["kr.cable('bateria', ROJO, NEGRO);", ['cables_bateria']],
  ["kr.cable('interruptor', ROJO);", ['cable_interruptor']],
  ["kr.cable('motor_der', ROJO, NEGRO);", ['cables_motor_der']],
  ["kr.cable('motor_izq', ROJO, NEGRO);", ['cables_motor_izq']],
  ["kr.cable('5V', 'l298n', 'proto');", ['puente_5v']],
  ["kr.cable('5V', 'proto', 'uno');", ['rieles_uno']],
  ["kr.cable('VCC', 'proto', 'sonar');", ['alim_sensor']],
  ["kr.cable('TRIG', 9, AMARILLO);", ['cable_trig']],
  ["kr.cable('ECHO', 10, VERDE);", ['cable_echo']],
  ["kr.bus('ENA..IN4', [5, 6, 7, 8, 11, 12]);", ['bus_motores']],
  [''],
  ['kr.encender();', ['__power']],
];

const SONAR = [
  '// KR-01 · esquiva obstáculos con un HC-SR04', // 0
  'const int TRIG = 9, ECHO = 10;',              // 1
  'const int ENA = 5, IN1 = 7, IN2 = 8;   // der', // 2
  'const int ENB = 6, IN3 = 11, IN4 = 12; // izq', // 3
  'const int VEL = 150;           // PWM 0-255',   // 4
  'const float UMBRAL = 20.0;     // cm',          // 5
  '',                                              // 6
  'void setup() {',                                // 7
  '  pinMode(TRIG, OUTPUT);',                      // 8
  '  pinMode(ECHO, INPUT);',                       // 9
  '  int out[] = {ENA, IN1, IN2, ENB, IN3, IN4};', // 10
  '  for (int p : out) pinMode(p, OUTPUT);',       // 11
  '  Serial.begin(9600);',                         // 12
  '}',                                             // 13
  '',                                              // 14
  'float medir() {',                               // 15
  '  digitalWrite(TRIG, LOW);  delayMicroseconds(2);',  // 16
  '  digitalWrite(TRIG, HIGH); delayMicroseconds(10);', // 17
  '  digitalWrite(TRIG, LOW);',                    // 18
  '  long t = pulseIn(ECHO, HIGH, 30000); // µs',  // 19
  '  return t * 0.0343 / 2;               // cm',  // 20
  '}',                                             // 21
  '',                                              // 22
  'void motor(int en, int a, int b, int v) {',     // 23
  '  digitalWrite(a, v > 0);',                     // 24
  '  digitalWrite(b, v < 0);',                     // 25
  '  analogWrite(en, abs(v));',                    // 26
  '}',                                             // 27
  'void motores(int izq, int der) {',              // 28
  '  motor(ENB, IN3, IN4, izq);',                  // 29
  '  motor(ENA, IN1, IN2, der);',                  // 30
  '}',                                             // 31
  '',                                              // 32
  'void loop() {',                                 // 33
  '  float d = medir();',                          // 34
  '  Serial.println(d);',                          // 35
  '  if (d > 0 && d < UMBRAL) {',                  // 36
  '    motores(0, 0);       delay(150); // frena', // 37
  '    motores(-VEL, -VEL); delay(300); // reversa', // 38
  '    motores(VEL, -VEL);  delay(450); // gira',  // 39
  '  } else {',                                    // 40
  '    motores(VEL, VEL);               // avanza', // 41
  '  }',                                           // 42
  '  delay(60);              // >60 ms entre lecturas', // 43
  '}',                                             // 44
];
const LN = { setup0: 8, trigLow: 16, trigHigh: 17, trigOff: 18, pulse: 19, ret: 20, loopMeasure: 34, println: 35, cond: 36, stop: 37, back: 38, turn: 39, fwd: 41, delay: 43, motorFn: 29 };
