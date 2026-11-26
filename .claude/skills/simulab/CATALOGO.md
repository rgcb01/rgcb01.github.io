# CATÁLOGO de assets

> Generado por `node tools/catalog.mjs` a partir del código. No lo edites a mano: si agregas o cambias un asset, vuelve a correr el comando.

## Cómo se usan

```js
// SIMULAB asset system (from KAPRI LAB by @0xKapri).
//  defineAsset(type, spec)        register a component (native coords, pins, draw)
//  place(type, id, {at, rot})     an instance inside a scene or robot frame
//  inst.pin('D9') -> {p, dir}     pin position + exit direction in the parent frame
//  cable(id, from, to, color, o)  wire that routes itself between two pins
//  drawAssembly(G, st, insts, base)  draws everything in depth order with shadows
// spec fields: name, label, O (native origin), anchor, ring [rx, ry, z], lab (label offset),
//   group: 'floor' | 'host' | 'top' | 'under' | 'wheel' | 'wire', layer, pins {name: {p, dir}},
//   draw(G, xf, st, inst), floorShadow(xf) -> [pts[]], hostShadow(xf) -> [pts[]], hostTop {z, poly}
```

Patrón base (de `demos/blink/demo.js`):

```js
const bb = place('protoboard400', 'bb', { at: [5.5, 0, 0] });
place('led5', 'led', { at: bb.pin('f9').p, color: 'R', litKey: 'pin13', label: 'LED ROJO', code: "led('f9', 'f10', ROJO);" })
cable('cable_d13', ['uno', 'D13'], ['bb', 'j14'], NARANJA, { label: 'D13', code: "cable(uno.D13, 'j14', NARANJA);" })
resolveCables(insts)   // calcula la ruta de cada cable (arco + conectores dupont)
```

- `at`: posición en cm (x adelante, y izquierda, z arriba). `rot`: radianes.
- `label`: etiqueta en pantalla. `code`: la línea que aparece en la pestaña de armado. `group`: capa de dibujo.
- Opciones de cable `o`: `via`, `lift`, `lead`, `hl`, `w`, `glowKey`, `points`, `ends` (ver `assets/core.js`).

## placas.js

    Boards: Arduino UNO R3 (from Lab 01) and ESP32 DevKit V1 (30 pins).
    UNO native coords = KR-01 robot coords (O = PCB bottom centre at [0.665, 0, 5.7]).

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `uno` | UNO R3 | top | SCL, SDA, AREF, GND2, D13, D12, D11, D10, D9, D8, D7, D6, D5, D4, D3, D2, D1, D0, NC, IOREF, RESET, 3V3, 5V, GND, GND3, VIN, A0, A1, A2, A3, A4, A5 | st.power, st.pin13, st.tx |
| `separador` | separador | top | (sin pines) |  |
| `esp32` | ESP32 DevKit | top | EN, VP, VN, D34, D35, D32, D33, D25, D26, D27, D14, D12, D13, GND, VIN, D23, D22, TX0, RX0, D21, D19, D18, D5, TX2, RX2, D4, D2, D15, GND2, 3V3 | st.power, st.gpio2 |

## modulos.js

    Modules from Lab 01 (native coords = KR-01 robot coords): HC-SR04 + bracket,
    L298N + heatsink, battery holder 2x18650 + cells, rocker switch, mini breadboard 170.

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `soporteSensor` | soporte sensor | top | (sin pines) |  |
| `hcsr04` | HC-SR04 | top | VCC, TRIG, ECHO, GND, TX, RX | st.txFlash, st.rxFlash |
| `l298n` | L298N | top | ENA, IN1, IN2, IN3, IN4, ENB, OUT1, OUT2, OUT3, OUT4, V12, GND, V5 | opts.heatsink, st.power, st.parts |
| `disipador` | disipador | none | (sin pines) |  |
| `portapilas2x18650` | portapilas | top | +, - | opts.cells, st.parts |
| `pila18650` | pila 18650 | none | (sin pines) |  |
| `interruptor` | interruptor | top | in, out | st.power |
| `protoboard170` | protoboard | top | huecos a1..j17 (filas a-e y f-j, canal en medio) |  |

## movimiento.js

    2WD robot base (native coords = KR-01 robot frame: x forward, z up, cm). The camera draws the world
    mirrored, so +y reads as the robot's RIGHT: side names follow the screen ('der' = +y, 'izq' = -y).
    acrylic chassis (host), TT motor brackets, TT motors 1:48, 65 mm wheels, ball caster.
    kit2WD() returns the standard instances in build order.

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `chasis2wd` | chasis | host | (sin pines) | opts.engrave |
| `soporteTT_der` | soporte der | under | (sin pines) |  |
| `motorTT_der` | motor der | under | +, - |  |
| `rueda65_der` | rueda der | wheel | (sin pines) | opts.spin |
| `soporteTT_izq` | soporte izq | under | (sin pines) |  |
| `motorTT_izq` | motor izq | under | +, - |  |
| `rueda65_izq` | rueda izq | wheel | (sin pines) | opts.spin |
| `ruedaLoca` | rueda loca | under | (sin pines) |  |

## componentes.js

    Breadboard parts. Native origin = point on the breadboard top (z=0) under the part,
    so place(type, id, {at: bb.pin('a12').p}) drops it into that hole.
     protoboard400  (holes 'a1'..'j30', rails 't+1'..'t+25', 't-', 'b+', 'b-')
     led5 {color:'R'|'G'|'B'|'Y'|'W', litKey, burnKey}  legs: 'anodo' (+x), 'catodo'; burnKey = burnt look (Lab 04)
     resistencia {ohm: 220, span: 4}             legs 'a', 'b' span*0.254 apart along x
     boton {cap: '#e5484d', pressKey}           legs '1a','1b','2a','2b' (straddles the channel)
     potenciometro {angleKey}                   legs '1','w','3'
     buzzer {onKey}                             legs '+', '-'
     servoSG90 {angleKey}                       sits on the mat; connector pins 'GND','VCC','SIG'
     placaCarga {tag, text, res}                test load board on the mat (Lab 04): loops '+', '-', spots 'led', 'res'

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `protoboard400` | protoboard 400 | floor | huecos a1..j30 (filas a-e y f-j, canal en medio); rieles t+1..t+25, t-1..t-25, b+1..b+25, b-1..b-25 |  |
| `led5` | LED 5 mm | top | anodo, catodo | opts.burnKey, opts.color, opts.litKey |
| `resistencia` | resistencia | top | a, b | opts.span, opts.ohm |
| `boton` | botón | top | 1a, 1b, 2a, 2b | opts.pressKey, opts.cap |
| `potenciometro` | potenciómetro | top | 1, 3, w | opts.angleKey |
| `buzzer` | buzzer | top | +, - |  |
| `servoSG90` | servo SG90 | floor | GND, VCC, SIG | opts.angleKey |
| `placaCarga` | placa de carga | floor | +, -, led, res |  |

## instrumentos.js

    Instruments and bench items (from Lab 02). Native origin = centre of the footprint on the mat (z=0).
     multimetro      autoranging DMM lying face up: LCD (st.lcd), dial (st.dial rad, st.dialPos id),
                     buttons HOLD SELECT RANGE REL (st.press {name, k}); jacks '10A','mA','COM','V'
     pila9v          9 V battery standing; snaps '+', '-'
     capacitor       electrolytic {uf}; legs '+' (+x), '-' (-x) one hole apart (z=0 = breadboard top)
     multicontacto   power strip, 3 outlets on top; slots 'F1'..'F3' (fase, narrow) 'N1'..'N3' (neutro)
     taza            mug of coffee {steamKey}; pin 'cafe' (coffee surface centre)
     fuenteBanco     bench DC supply 0-30 V / 0-5 A (Lab 04): displays, knobs V and A, OUTPUT, CV/CC, POWER from
                     st.fuente; binding posts '+', 'GND', '-' (dir +x). fuPanelAt(inst, u, v) = point on the front panel
     caiman          build marker for an alligator clip ({ghost: true}); demos draw the moving clips
    Probes, leads and the thermocouple move, so the demo draws them (drawProbe, drawLead, drawPlug).
    Clip leads (Lab 04): drawCaiman, drawBanana, drawCableCaiman, caimanEnd. Effect: drawChispa (spark).

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `multimetro` | multímetro | floor | 10A, mA, COM, V | st.dialPos, st.lcd, st.press, st.dial |
| `pila9v` | pila 9V | floor | +, - |  |
| `capacitor` | capacitor | top | +, - |  |
| `multicontacto` | multicontacto | floor | F1, N1, F2, N2, F3, N3 | st.mains |
| `taza` | taza | floor | cafe | opts.steamKey, st.t, st.fuente |
| `fuenteBanco` | fuente de poder | floor | +, GND, - | st.fuente |
| `caiman` | caimán | floor | (sin pines) | opts.ghost, opts.color |

## soldadura.js

    Soldering bench (from Lab 03). Native origin = centre of the footprint on the mat (z=0).
     estacionSoldar   soldering station: LED display and knob from st.estacion {on, temp, set, ready};
                      pin 'cable' (mouth of the iron socket, dir +y)
     baseCautin       iron stand: cast base, spring holder and brass wool; pins 'funda' (tip rest inside the
                      spring, dir = spring axis) and 'viruta' (top of the brass wool). drawBaseFrente() draws
                      the front turns of the spring over a parked iron.
     placaPractica    practice PCB, solder side up, on 4 standoffs: 4 pads with resistor leads 'j1'..'j4'.
                      Joint k reads st.U[k] {wet, ball, s, liquid, oxid, lift, heat, res, burn}: fillet or ball,
                      heat glow, rosin residue, lifted pad (model in demos/lab03-cautin/model.js)
     cautin, tuboSoldadura   build markers for the iron and the solder tube ({ghost: true} draws nothing:
                      they move, so the demo draws them with drawCautin / drawTuboSoldadura / drawCableCautin)
    Effects: drawHumo (flux smoke from a history). 2D: corteUnion (cross-section of a joint), perfilUnion
    (verdict icon), tecla (keycap), seg7 (LED digits).

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `estacionSoldar` | estación | floor | cable | st.estacion, st.t |
| `baseCautin` | base del cautín | floor | funda, viruta | st.U |
| `placaPractica` | placa de práctica | floor | j1, j2, j3, j4 | st.U, st.t |
| `cautin` | cautín | floor | (sin pines) | opts.ghost |
| `tuboSoldadura` | soldadura 63/37 | floor | (sin pines) | opts.ghost |

## cafe.js

    Café: espresso machine, portafilter, scale and espresso cup (Lab E1 · Espresso).
    World cm, x toward the viewer's right-front, z up. Machine origin at the floor, body behind x = -2.
    Measurements are of a generic home machine of our own design (no real brand).

| type | nombre | grupo | pines | opts / st que lee |
|---|---|---|---|---|
| `maquinaEspresso` | máquina de espresso | floor | grupo | st.pump |
| `cabezalEspresso` | cabezal y manómetro | floor | (sin pines) | st.bar |
| `portafiltro` | portafiltro | floor | (sin pines) |  |
| `bascula` | báscula | floor | (sin pines) | st.grams, st.shotT |
| `tazaEspresso` | taza de espresso | floor | (sin pines) | st.grams, st.flowCol |

## escena.js

    Scenery and effects: paper floor grid, test mat (grid, ruler, zone, start line, plate),
    obstacle box, and sound FX (wave packet with echo, real-time beam, measuring cone).

## Materiales (`M.*`)

`mat`, `acr`, `yel`, `can`, `tire`, `hub`, `brass`, `steel`, `pcbB`, `pcbR`, `pcbS`, `pcbK`, `pcbG`, `blk`, `hs`, `term`, `bb`, `cellA`, `cellB`, `red`, `inner`, `box`, `gold`, `servo`, `white`, `beige`, `ledR`, `ledG`, `ledB`, `ledY`, `ledW`, `dmm`, `face`, `knob`, `nine`, `capB`, `coffee`, `mug`, `psu`, `gnd`, `teal`, `cobre`, `estano`, `estanoMate`, `punta`, `tubo`

## Colores de cable

`ROJO`, `NEGRO`, `AMARILLO`, `VERDE`, `NARANJA`, `MORADO`, `GRIS`, `BLANCO`, `CAFE`, `AZUL`

## Funciones de escena y kit

- **assets/escena.js**: `drawFloor(G, z = -1.6)`, `drawTapete(G, st, cfg)`, `drawCaja(G, b, p)`, `cajaShadow(G, b)`, `arcPts(G, cx, cy, z, r, a0, a1, n = 24)`, `strokeArc(c, pts, col, w, alpha)`, `txPos(ping, S)`, `drawPacket(G, ping, mu, S, o = {})`, `drawBeam(G, ping, a, S)`, `drawCone(G, ping, a, S)`
- **assets/instrumentos.js**: `dcMark(c, x, y, w, col)`, `beepIcon(c, x, y, s, col)`, `diodeIcon(c, x, y, s, col)`, `capIcon(c, x, y, s, col)`, `dmmSym(c, id, x, y, s, col)`, `drawLCD(c, x, y, w, h, L)`, `drawProbe(G, base, tip, ax, col, alpha = 1)`, `probeTop(tip, ax)`, `drawPlug(G, p, col, dz = 0, alpha = 1)`, `drawLead(G, jackP, dz, top, ax, color, alpha = 1, prog = 1)`, `dmmFnIcon(c, fn, x, y, s, col)`, `drawThermocouple(G, mxf, tc, cps)`, `connDiagram(c, b, conn, comp, letter)`, `fuPanelAt(inst, u, v, dx = 0)`, `fuDigits(c, x, y, h, txt, on, off)`, `fuPanel(c, F)`, `drawCaiman(G, tip, ax, col, o = {})`, `drawBanana(G, post, col, alpha = 1)`, `drawCableCaiman(G, post, tip, ax, color, alpha = 1, sag = 1.4)`, `drawChispa(G, p, k, seed = 7)`
- **assets/soldadura.js**: `filetePerfil(wet, s)`, `solderTop(U)`, `seg7(c, x, y, h, str, on, off)`, `estPanel(c, E, on, t)`, `baseResorte(G, xf, front)`, `drawBaseFrente(G, xf)`, `padRing(c, x, y, ro, ri, col = '#e8a06d')`, `placaTop(c, U)`, `drawBola(G, xf, p, r, m, shine)`, `drawUnion3D(G, xf, p, U, t)`, `drawCautin(G, tip, ax, o = {})`, `drawCableCautin(G, tip, ax, sock, dir, alpha = 1)`, `drawTuboSoldadura(G, wire, ax, L = 2.2, o = {})`, `drawHumo(G, p, amt, t, o = {})`, `corteUnion(c, cx, cy, R, J, a = 1)`, `perfilUnion(c, x, y, s, kind, col = INK)`, `tecla(c, x, y, key, label, on, col = '#c8f04a')`
- **kit/engine.js**: `hexRgb(h)`, `mixRgb(a, b, t)`, `rgbCss(c, a = 1)`, `toneRgb(m, s, steps)`, `shadeOf(n)`, `tone(m, n, alpha = 1, steps)`, `pathPts(ctx, pts)`, `inkW(G, w)`, `fillStroke(G, pts, fill, lw = 1.7, ink = INK)`, `hull(pts)`, `onPlane(G, origin, u, v, fn)`, `drawBox(G, xf, a, b, m, o = {})`, `facePlane(G, xf, which, a, b, fn)`, `rrPlan(x0, y0, x1, y1, r, seg = 5)`, `drawPrism(G, xf, plan, z0, z1, m, o = {})`, `cylBasis(ax)`, `drawCyl(G, xf, c, ax, r, L, m, o = {})`, `drawSphere(G, xf, c, r, m, o = {})`, `splinePts(xf, cps, n = 10)`, `drawWire(G, xf, cps, color, o = {})`, `shadowPts(G, worldPts, h)`, `boxCorners(xf, a, b)`, `cylCorners(xf, c, ax, r, L, seg = 16)`, `floorEllipse(G, xf, c, rx, ry, seg = 48)`, `mulberry32(a)`, `compose(parent, at = [0, 0, 0], rot = 0, O = [0, 0, 0])`, `drawFrustum(G, xf, c, ax, r0, r1, L, m, o = {})`, `drawRevol(G, xf, c, prof, m, o = {})`
- **kit/story.js**: `lastLE(arr, t)`, `scheduleBuild(insts, start = 0.35, minEnd)`, `armadoTab(lines, sched, total, names, extra = {})`, `autoArmado(insts, v = 'lab', header = '// cada línea coloca una pieza real')`, `codeTab(name, lines, evMap = {}, scrollAt)`, `partsAt(TL, t, st)`, `labelAlphaDefault(TL, inst, t)`, `buildCues(TL)`, `fitCam(pts, k = 1, zmax = 44)`, `camShift(cam, dx, dy)`, `liveVal(ev, key, t, def = 0)`, `camPut(cam, p, x, y)`, `camFly(a, b, Fa, Fb, sa, sb, f)`
- **kit/ui.js**: `rr(c, x, y, w, h, r)`, `tokenize(line)`, `drawBackdrop(c)`, `drawEmblem(c, x, y, r)`, `drawTitle(c, x, y)`, `drawEditor(c, TL, st)`, `drawSerial(c, st)`, `chip(c, x, y, text, o = {})`, `drawLeftPanel(c, TL, st)`, `defaultFooter(TL, st)`, `drawCardBase(c)`, `labText(s)`, `drawCardFrame(c)`, `drawPlate(c)`, `drawSpeedBadge(c, TL, st)`, `drawChips(c)`, `applyLayout(mode)`, `drawHandle(c)`, `bayFrame(c, i, title, status, sbg)`, `bigValue(c, b, val, unit, sub)`, `chartBox(c, b)`, `bayPiezas(c, i, TL, st)`, `grainPattern(c)`, `bubble(c, x, y, lines, a, col)`, `barPair(c, b, rows)`, `digitalTrace(c, b, pts, t, win = 2, label = 'PIN')`, `callout(c, A, dx, dy, text, a, bg)`, `tipCard(c, x, y, lines, a, tag = 'CÓMO SE USA')`
