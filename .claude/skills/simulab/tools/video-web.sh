#!/usr/bin/env bash
# tools/video-web.sh demos/<demo> [video.mp4] [lang]  ->  demos/<demo>/render/<name>-web.mp4 and <name>-web-poster.webp
# Version for a web page: rendered again with ?web (labText in kit/ui.js);
# (labText in kit/ui.js); only the inside of the paper card (no dark frame), 1280 px wide, H.264 + AAC,
# faststart. The audio comes from the X video (same timeline). Many hosts cap single files at 25 MiB.
# Without a second argument it takes the newest X video in render/ (not -web, -preview or video_noaudio).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
dir="${1:?uso: tools/video-web.sh demos/<demo> [video.mp4]}"
lang="${3:-}"; sfx="${lang:+-$lang}"
src="${2:-$(ls -t "$dir"/render/*.mp4 2>/dev/null | grep -v -e '-web.mp4' -e '-preview.mp4' -e 'video_noaudio' | head -1)}"
[ -f "$src" ] || { echo "no encuentro el video de X en $dir/render/ (corre antes tools/video.sh)"; exit 1; }
out="${src%.mp4}-web${sfx}.mp4"
node "$ROOT/tools/build.mjs" "$dir" > /dev/null
node "$ROOT/tools/record.mjs" "$dir" --web ${lang:+--lang=$lang} --fps=60 --w=1500 | grep -v '^chunk'
# Interior of the card in the 'full' layout: x 48, y 48, 1504 x 1184 on the 1600 x 1280 stage.
ffmpeg -y -v error -i "$dir/render/video_noaudio-web${sfx}.mp4" -i "$src" -map 0:v -map 1:a \
  -vf "crop=trunc(iw*1504/1600):trunc(ih*1184/1280):trunc(iw*48/1600):trunc(ih*48/1280),scale=1280:-2:flags=lanczos" \
  -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 96k -shortest "$out"
# poster: the frame the web shows before the video plays, at the cover second ("cover" in demo.json, else 40 %)
t=$(node -p "(require('$(cd "$dir" && pwd)/demo.json').cover ?? '')")
[ -n "$t" ] || t=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" | awk '{print $1 * 0.4}')
ffmpeg -y -v error -ss "$t" -i "$out" -frames:v 1 -c:v libwebp -quality 82 "${out%.mp4}-poster.webp"
bytes=$(wc -c < "$out")
echo "$out $((bytes / 1024 / 1024)) MB"
[ "$bytes" -lt 26214400 ] || { echo "pasa de 25 MiB: sube -crf o baja el ancho"; exit 1; }
