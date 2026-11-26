# kit3d · póster "HOW IT WORKS" (A4, 3D en vivo)

Modo póster de SIMULAB (estilo "HOW IT WORKS" de KAPRI LAB): hoja A4 blanca, título grande con una palabra y un número ("Volt 1"), pregunta y párrafo, render 3D realista en vivo, 6 lecturas, un esquema en corte, una perilla de secuencia, 8 piezas numeradas y un pie en mono. Loop de 36 s: todo se arma en ~1 s y cada estación (~4.6 s) mueve piezas que explican el funcionamiento.

Todo es código: las piezas se modelan con three.js (luz de estudio, sombras suaves, AO) y el póster se dibuja en canvas. Marca: emblema de KAPRI LAB y el ícono del lab (nunca logos de terceros).

## Archivos

| archivo | qué tiene |
|---|---|
| `vendor/three-kit.min.js` | three.js r170 + RoundedBox, RoomEnvironment, EffectComposer, GTAO, Output, BufferGeometryUtils (global `THREE`) |
| `scene.js` | `K3`: render, paleta `K3.M`, ayudas de geometría, banco con placa y regla, piezas con armado fantasma, cámaras, `K3.stage` (reloj de estaciones) |
| `parts.js` | `K3P`: piezas genéricas reutilizables (motor NEMA 17, perfil 2020, pierna de celosía, torre). **Toda pieza genérica nueva va aquí.** |
| `poster.js` | el póster 2D (1080 x 1528): encabezado, lecturas, paneles, perilla, piezas, pie, globos y marcadores; `SK` para esquemas |
| `main.js` | contrato de render (`READY`, `ASPECT`, `seek`, `frameJPEG`, `EVENTS`) y la página interactiva (play, scrub, clic en la perilla) |
| `index.html` | plantilla de la página |

## Un lab nuevo

1. Copia `demos/lab25-f1` y cambia `demo.json` (`"kit": "poster3d"`, `"fps": 24`).
2. En `demo.js`: textos `{ en, es }`, tiempos de las 6 estaciones + LINE, `state(t)` (usa `K3.stage`), `build(K)` con `K.part(id, obj, { t, num, anchor | local })`, `camera(t)` con una lista de tomas (`K.look`, `K.camAt`), `update` para lo que se mueve y `schematic.draw` para el corte 2D.
3. Revisión barata: `node tools/smoke.mjs $PWD/demos/<lab>` y `node tools/stills.mjs demos/<lab> --w=540 --cols=4 ...`.
4. Preview: `tools/video.sh demos/<lab> <nombre> --preview` (540 px). Final: `tools/video.sh demos/<lab> <nombre>` (1080 x 1528, 30 fps: WebGL por software en la nube).
5. Web: `tools/video-web.sh demos/<lab> "" es` (graba en español a 720 px) y `tools/video-web.sh demos/<lab> "" en` (recodifica el video de X). `node tools/cover.mjs demos/<lab>` usa `cover` y `coverY` de `demo.json`.

## Etapas para tutoriales

`node tools/steps.mjs demos/<lab> --mode=<m> --t0=33 --az0=-22 --az1=18 --n=72 --w=960` graba solo la vista 3D como clip:
`block` (formas grandes en gris; oculta lo marcado con `K.detail()`), `grey` (todo el detalle en gris), `wire` (malla), `closed` (los cortes cerrados) o sin `--mode` (el render final). Es el mismo código con un flag.

## Idiomas

El video de X sale en inglés (como los pósters de referencia). La web abre el demo con `?embed` o `?web` y sale en español; `?lang=en` lo pone en inglés. Otros idiomas caen a inglés.

## Reconstruir vendor

```bash
npm i three@0.170.0 && cat > entry.js <<'EOF'
export * from 'three';
export { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
export { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
export { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
export { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
EOF
npx esbuild entry.js --bundle --minify --format=iife --global-name=THREE --outfile=kit3d/vendor/three-kit.min.js
```

## Realismo (desde la versión 36 s)
- Texturas procedurales en `scene.js` (TX): orange peel de pintura, metal cepillado, hierro fundido, hule, plástico, embobinado de cobre y galvanizado. Se generan en canvas al cargar, sin archivos. Las UV de box/cyl/lathe/tube van en cm reales (`UVT` = 14 cm por mosaico), así el grano mide lo mismo en un tornillo y en un tanque.
- Materiales físicos: clearcoat en pintura, anisotropía en acero, `M.galv` nuevo.
- Luz de reflejo: `studioEnv()` (softbox arriba, dos tiras laterales, tarjeta cálida), en lugar de RoomEnvironment.
- Composer con MSAA x4. Costo: ~3.3 s por cuadro a 1080 en la nube (VSM y sombras 4096 eran 10x más lentas, por eso siguen PCFSoft 2048).
- `K3P.flow(pts, o)`: pulsos que corren por un tubo o cable (diésel, corriente, refrigerante). `K3P.spray(len, r)`: cono translúcido. `K3P.gear(R, w, dientes, mat)`: engrane recto.
