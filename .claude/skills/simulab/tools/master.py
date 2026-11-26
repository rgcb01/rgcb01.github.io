# python3 tools/master.py demos/<demo> <nombre>
# score_raw.wav -> -14 LUFS master (true peak <= -1 dBTP after AAC) -> muxed with video_noaudio.mp4
# Why: AAC adds 1-4 dB of overshoot (worst at the very first frame), so we fade in 80 ms,
# lowpass at 16 kHz, limit, encode, MEASURE, and if the peak is still high, retry with a lower limit.
import json, os, re, subprocess, sys
d, name = sys.argv[1], sys.argv[2]
R = os.path.join(d, 'render')
def ff(*a): return subprocess.run(['ffmpeg', '-hide_banner', '-y', *a], capture_output=True, text=True)
out = ff('-i', f'{R}/score_raw.wav', '-af', 'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-').stderr
j = json.loads(out[out.rindex('{'):out.rindex('}') + 1])
ln = (f"loudnorm=I=-14:TP=-2:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}")
for limit in (0.70, 0.63, 0.56, 0.50):
    ff('-i', f'{R}/score_raw.wav', '-af', f'{ln},lowpass=f=16000:p=2,alimiter=limit={limit}:attack=1:release=60:level=false,afade=t=in:d=0.08', '-ar', '48000', f'{R}/score.wav')
    ff('-i', f'{R}/video_noaudio.mp4', '-i', f'{R}/score.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
       '-shortest', '-movflags', '+faststart', f'{R}/{name}.part.mp4')
    m = ff('-i', f'{R}/{name}.part.mp4', '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1]); peak = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)[-1])
    print(f'limit {limit}: {lufs} LUFS, true peak {peak} dBTP')
    if peak <= -1.0: break
os.replace(f'{R}/{name}.part.mp4', f'{R}/{name}.mp4')
print(f'listo: {R}/{name}.mp4')
