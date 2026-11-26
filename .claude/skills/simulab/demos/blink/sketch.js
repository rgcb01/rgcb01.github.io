// Lab 00 · Blink sketch (real Arduino code). LNB = line indexes used by the story.
const BLINK = [
  '// Lab 00 · Blink: tu primer programa',  // 0
  'const int LED = 13;',                      // 1
  '',                                         // 2
  'void setup() {',                           // 3
  '  pinMode(LED, OUTPUT);',                  // 4
  '}',                                        // 5
  '',                                         // 6
  'void loop() {',                            // 7
  '  digitalWrite(LED, HIGH);  // 5 V',       // 8
  '  delay(1000);              // 1 s',       // 9
  '  digitalWrite(LED, LOW);   // 0 V',       // 10
  '  delay(1000);              // 1 s',       // 11
  '}',                                        // 12
];
const LNB = { setup: 4, high: 8, d1: 9, low: 10, d2: 11 };
