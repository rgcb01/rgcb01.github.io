# python3 tools/audio.py demos/<demo>   -> demos/<demo>/render/score_raw.wav
# Score in code (no samples): lo-fi bed at 84 BPM + effects from events.json cues.
# Cue types: part(i) wire(t1) tick power tab whoosh(t1) thud blip(f,gain) trig ping(f,gain,burst) detent plug beep(t1,f)
#            freeze ding brake caption riser(t1) thump whir(t1,f) sizzle(t1,gain) error  | motor envelope (50 Hz) | duck ranges
import json, sys, os, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

d = sys.argv[1] if len(sys.argv) > 1 else 'demos/fig01-sonar'
ev = json.load(open(os.path.join(d, 'render/events.json')))
SR = 48000; D = ev['end'] + 0.25; N = int(D * SR); rng = np.random.default_rng(7); t_all = np.arange(N) / SR
def sos(kind, f, order=2):
    if kind == 'band': return butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], btype='band', output='sos')
    return butter(order, f / (SR / 2), btype=kind, output='sos')
def env_exp(n, tau): return np.exp(-np.arange(n) / SR / tau)
def add(buf, start, sig, gain=1.0, pan=0.0):
    i0 = int(start * SR)
    if i0 >= N or i0 + len(sig) <= 0: return
    a, b = max(0, i0), min(N, i0 + len(sig)); s = sig[a - i0:b - i0] * gain
    buf[0, a:b] += s * np.sqrt(0.5 * (1 - pan)) * 1.414; buf[1, a:b] += s * np.sqrt(0.5 * (1 + pan)) * 1.414
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def tone(f, dur, tau, harm=((1, 1.0),), att=0.004):
    n = int(dur * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * k * tt) for k, a in harm) * np.minimum(1, tt / att) * np.exp(-tt / tau)
def noise(dur): return rng.standard_normal(int(dur * SR))
def plus(a, b):
    n = max(len(a), len(b)); o = np.zeros(n); o[:len(a)] += a; o[:len(b)] += b; return o
def ramp(a, b, t): return np.clip((t - a) / (b - a), 0, 1)
def sonar_ping(f, dur=1.4, tau=0.55):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (f * (1 - 0.015 * tt)) * tt) * np.minimum(1, tt / 0.004) * np.exp(-tt / tau)
    out = s.copy(); dl = int(0.13 * SR)
    for r in range(1, 4): out[dl * r:] += s[:-dl * r] * (0.32 ** r)
    return out

music = np.zeros((2, N)); sfx = np.zeros((2, N))
# ---- music bed: Fmaj7 Em7 Dm7 Cmaj7, electric piano, round bass, soft drums, vinyl
beat = 60 / 84; bar = beat * 4
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; roots = [41, 40, 38, 36]
k = 0; tb = 0.0
while tb < D:
    for hit, ln in [(0.0, 2.6), (2.5 * beat, 1.6)]:
        for j, m in enumerate(chords[k % 4]):
            f = mtof(m); n = plus(tone(f, ln, 1.4, ((1, 1.0), (2, 0.28), (3, 0.08)), 0.008), 0.5 * tone(f * 1.003, ln, 1.4, ((1, 1.0),), 0.01))
            add(music, tb + hit + j * 0.012, n * (1 + 0.12 * np.sin(2 * np.pi * 4.6 * np.arange(len(n)) / SR)), 0.030, pan=(j - 1.5) * 0.25)
    for hb in [0, 2]: add(music, tb + hb * beat, tone(mtof(roots[k % 4]), 0.9, 0.45, ((1, 1.0), (2, 0.25))), 0.11)
    if k >= 1:
        for hb in [0, 2]:
            n = int(0.35 * SR); tt = np.arange(n) / SR; f = 50 + 70 * np.exp(-tt / 0.03)
            add(music, tb + hb * beat, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16), 0.20)
        for hb in [1, 3]:
            n = int(0.25 * SR); add(music, tb + hb * beat, sosfilt(sos('band', (1400, 5200)), noise(0.25)) * np.minimum(1, np.arange(n) / SR / 0.012) * env_exp(n, 0.09), 0.09, pan=0.15)
        for e8 in range(8):
            add(music, tb + e8 * beat / 2 + (0.03 if e8 % 2 else 0), sosfilt(sos('high', 7000), noise(0.06)) * env_exp(int(0.06 * SR), 0.018), 0.035 if e8 % 2 else 0.05, pan=-0.3)
    tb += bar; k += 1
cr = np.zeros(N); idx = rng.integers(0, N, int(D * 9)); cr[idx] = rng.standard_normal(len(idx)) * 0.5
cr = sosfilt(sos('band', (900, 6000)), cr) + 0.004 * sosfilt(sos('band', (2000, 9000)), rng.standard_normal(N))
music += cr * 0.35
lp = np.stack([sosfilt(sos('low', 650, 4), music[0]), sosfilt(sos('low', 650, 4), music[1])])
w = np.zeros(N)
for a, b in ev.get('duck', []): w = np.maximum(w, ramp(a, a + 0.25, t_all) * (1 - ramp(b - 0.3, b + 0.2, t_all)))
music = (music * (1 - w) + lp * w) * (1 - 0.35 * w)

# ---- effects
penta = [72, 74, 76, 79, 81, 84, 86, 88]
for cu in ev['cues']:
    t, ty = cu['t'], cu['type']
    if ty == 'part':
        i = cu.get('i', 0); add(sfx, t - 0.01, tone(mtof(penta[i % 8] - 12), 0.18, 0.05, ((1, 1.0), (2, 0.4), (3, 0.15))), 0.30, -0.1)
        add(sfx, t - 0.01, tone(130, 0.12, 0.04), 0.35); add(sfx, t - 0.01, sosfilt(sos('high', 2500), noise(0.012)) * env_exp(int(0.012 * SR), 0.003), 0.25)
    elif ty == 'wire':
        z = sosfilt(sos('band', (1800, 6500)), noise(max(0.05, cu['t1'] - t))); z *= np.linspace(0.2, 1, len(z)) * 0.5; add(sfx, t, z, 0.05, 0.2)
        for dt in (0.0, 0.035): add(sfx, cu['t1'] + dt, plus(tone(2400, 0.03, 0.008), 0.6 * sosfilt(sos('high', 3000), noise(0.01)) * env_exp(int(0.01 * SR), 0.002)), 0.22, 0.1)
    elif ty == 'tick': add(sfx, t, tone(3200, 0.02, 0.006), 0.05, -0.6)
    elif ty == 'power':
        add(sfx, t, sosfilt(sos('high', 1500), noise(0.02)) * env_exp(int(0.02 * SR), 0.004), 0.5); add(sfx, t, tone(90, 0.2, 0.06), 0.45)
        n = int(0.35 * SR); tt = np.arange(n) / SR; f = 280 + 700 * (tt / 0.35) ** 0.7
        add(sfx, t + 0.05, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / 0.02) * np.exp(-tt / 0.25), 0.16); add(sfx, t + 0.3, tone(mtof(84), 0.6, 0.25, ((1, 1.0), (2, 0.2))), 0.12)
    elif ty == 'tab': add(sfx, t, sosfilt(sos('band', (800, 4000)), noise(0.18)) * np.hanning(int(0.18 * SR)), 0.07)
    elif ty == 'whoosh':
        wh = sosfilt(sos('band', (300, 2600)), noise(cu['t1'] - t + 0.3)); wh *= np.sin(np.linspace(0, np.pi, len(wh))) ** 2; add(sfx, t, wh, 0.12)
    elif ty == 'thud': add(sfx, t, tone(62, 0.4, 0.12, ((1, 1.0), (2, 0.3))), 0.55); add(sfx, t, sosfilt(sos('band', (250, 1800)), noise(0.25)) * env_exp(int(0.25 * SR), 0.06), 0.25)
    elif ty == 'blip': add(sfx, t, tone(cu.get('f', 4600), 0.04 if cu.get('f', 4600) < 3000 else 0.015, 0.012 if cu.get('f', 4600) < 3000 else 0.004), cu.get('gain', 0.1), 0.35)
    elif ty == 'trig': n = int(0.07 * SR); add(sfx, t, np.sign(np.sin(2 * np.pi * 1000 * np.arange(n) / SR)) * env_exp(n, 0.03), 0.06)
    elif ty == 'ping':
        add(sfx, t, sonar_ping(cu.get('f', 1760)), cu.get('gain', 0.25), -0.2)
        for j in range(cu.get('burst', 0)): add(sfx, t + j * 0.05, tone(3500, 0.02, 0.006), 0.07, -0.2)
    elif ty == 'freeze':
        add(sfx, t, tone(55, 0.9, 0.35, ((1, 1.0), (2, 0.4))), 0.5); add(sfx, t, sosfilt(sos('high', 5000), noise(1.2)) * env_exp(int(1.2 * SR), 0.35), 0.05)
        n = int(0.5 * SR); add(sfx, t - 0.5, sosfilt(sos('band', (500, 5000)), noise(0.5)) * np.linspace(0, 1, n) ** 2, 0.08)
    elif ty == 'ding':
        for j, mm in enumerate([84, 91]): add(sfx, t + j * 0.11, tone(mtof(mm), 0.6, 0.22, ((1, 1.0), (2, 0.25), (3, 0.08))), 0.16)
    elif ty == 'brake': add(sfx, t, sosfilt(sos('band', (600, 3000)), noise(0.12)) * env_exp(int(0.12 * SR), 0.04), 0.18)
    elif ty == 'caption':
        for j, mm in enumerate([65, 69, 72, 76, 79]):
            n = int(2.6 * SR); tt = np.arange(n) / SR; add(sfx, t + j * 0.03, np.sin(2 * np.pi * mtof(mm) * tt) * np.minimum(1, tt / 0.35) * np.exp(-tt / 1.6), 0.035, (j - 2) * 0.3)
        add(sfx, t, tone(mtof(96), 0.9, 0.35), 0.06)
    elif ty == 'riser':
        L = cu['t1'] - t; n = int(L * SR); tt = np.arange(n) / SR; add(sfx, t, sosfilt(sos('band', (600, 6000)), rng.standard_normal(n)) * (tt / L) ** 2.5, 0.10)
    elif ty == 'thump': add(sfx, t, tone(48, 0.6, 0.2), 0.45)
    elif ty == 'detent':   # rotary switch / button click
        add(sfx, t, sosfilt(sos('band', (1500, 5500)), noise(0.014)) * env_exp(int(0.014 * SR), 0.0025), cu.get('gain', 0.22), 0.1)
        add(sfx, t, tone(420, 0.03, 0.008), cu.get('gain', 0.22) * 0.5, 0.1)
    elif ty == 'plug':     # banana plug into a jack
        add(sfx, t, tone(160, 0.14, 0.035, ((1, 1.0), (2, 0.3))), 0.4); add(sfx, t, sosfilt(sos('band', (900, 4000)), noise(0.03)) * env_exp(int(0.03 * SR), 0.006), 0.3)
    elif ty == 'beep':     # continuity buzzer, t..t1
        L = max(0.05, cu.get('t1', t + 0.3) - t); n = int(L * SR); tt = np.arange(n) / SR; f = cu.get('f', 2700)
        env = np.minimum(1, tt / 0.006) * np.minimum(1, (L - tt) / 0.012)
        add(sfx, t, (np.sign(np.sin(2 * np.pi * f * tt)) * 0.35 + np.sin(2 * np.pi * f * tt) * 0.65) * env, cu.get('gain', 0.06), -0.1)
    elif ty == 'whir':
        L = cu['t1'] - t; n = int(L * SR); tt = np.arange(n) / SR; f = cu.get('f', 900)
        add(sfx, t, np.sin(2 * np.pi * np.cumsum(f * (1 + 0.04 * np.sin(2 * np.pi * 9 * tt))) / SR) * np.sin(np.pi * tt / L) * 0.4, cu.get('gain', 0.12))
    elif ty == 'sizzle':   # flux boiling on a hot joint, t..t1 (from Lab 03)
        L = max(0.08, cu.get('t1', t + 0.4) - t); n = int((L + 0.35) * SR); tt = np.arange(n) / SR
        env = np.minimum(1, tt / 0.03) * np.exp(-np.maximum(0, tt - L) / 0.12) * (0.75 + 0.25 * np.exp(-tt / 0.25))
        cr = np.zeros(n); idx = rng.integers(0, n, int((L + 0.35) * 160)); cr[idx] = rng.standard_normal(len(idx)) * 3.0
        z = sosfilt(sos('band', (2500, 9500)), rng.standard_normal(n)) * 0.6 + sosfilt(sos('band', (1500, 7000)), cr)
        add(sfx, t, z * env, cu.get('gain', 0.07), 0.15)
    elif ty == 'error':    # wrong result: two low descending tones (from Lab 03)
        for j, f in enumerate([392.0, 311.1]):
            n = int(0.18 * SR); tt = np.arange(n) / SR; w = np.sin(2 * np.pi * f * tt)
            add(sfx, t + j * 0.15, (np.sign(w) * 0.35 + w * 0.65) * np.minimum(1, tt / 0.005) * np.exp(-tt / 0.1), cu.get('gain', 0.1), -0.1)
# motor hum from the model's wheel speeds
menv = np.array(ev.get('motor', []))
if len(menv):
    m = np.interp(t_all, ev.get('motorT0', 0) + np.arange(len(menv)) / 50, menv, left=0, right=menv[-1]); m = sosfilt(sos('low', 8), m)
    ph = np.cumsum(2 * np.pi * (85 + 40 * m) / SR)
    motor = ((np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * 0.5 + np.sin(np.cumsum(2 * np.pi * (950 + 450 * m + 12 * np.sin(2 * np.pi * 7 * t_all)) / SR)) * 0.25 + sosfilt(sos('band', (500, 1600)), rng.standard_normal(N)) * 0.25) * m * 0.20
    sfx += motor
mix = np.tanh((music + sfx) * 1.2) / 1.2
fade = np.ones(N); fl = int(0.35 * SR); fade[-fl:] = np.linspace(1, 0, fl); fade[:int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR)); mix *= fade
mix /= max(1e-9, np.max(np.abs(mix))) / 0.8
wavfile.write(os.path.join(d, 'render/score_raw.wav'), SR, (mix.T * 32767).astype(np.int16))
print('score_raw.wav', round(D, 2), 's,', len(ev['cues']), 'cues')
