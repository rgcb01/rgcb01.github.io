#!/usr/bin/env bash
# One command: build -> frame-exact render -> score -> -14 LUFS master -> mux.
# usage: tools/video.sh demos/<demo> [nombre-salida] [--audio] [--preview]
#   --preview  quick check: 750 px, 30 fps, saves <nombre>-preview.mp4 (about 4x faster)
#   --audio  reuse render/video_noaudio.mp4 (only redo score + master + mux, ~10 s)
set -euo pipefail
DEMO="${1:?uso: tools/video.sh demos/<demo> [nombre] [--audio]}"
DEMO="$(cd "$DEMO" && pwd)"; NAME="$(basename "$DEMO")"; ONLY_AUDIO=0; FPS=60; W=1500
grep -q '"kit": *"poster3d"' "$DEMO/demo.json" 2>/dev/null && W=1080 && FPS=30 && POSTER=1  # A4 poster: 1080 x 1528 @ 30 fps (software WebGL)
F2=$(grep -o '"fps": *[0-9]*' "$DEMO/demo.json" 2>/dev/null | grep -o '[0-9]*$' || true); [ -n "$F2" ] && FPS=$F2   # a demo can ask for its own rate (e.g. 24)
for a in "${@:2}"; do case "$a" in --audio) ONLY_AUDIO=1;; --preview) FPS=30; W=750; [ -n "${POSTER:-}" ] && W=540; PREV=1;; *) NAME="$a";; esac; done
[ -n "${PREV:-}" ] && NAME="$NAME-preview"
cd "$(dirname "$0")/.."
R="$DEMO/render"
if [ "$ONLY_AUDIO" = 0 ] || [ ! -f "$R/video_noaudio.mp4" ]; then
  node tools/build.mjs "$DEMO"
  GLFLAG=""; [ -n "${POSTER:-}" ] && [ -z "${PREV:-}" ] && GLFLAG="--savegl"  # keep the 3D frames: an interrupted render resumes from them
  node tools/record.mjs "$DEMO" --fps=$FPS --w=$W $GLFLAG | grep -v '^chunk'
fi
python3 tools/audio.py "$DEMO"
python3 tools/master.py "$DEMO" "$NAME"
echo "listo: $R/$NAME.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$R/$NAME.mp4" | cut -c1-5) s)"
