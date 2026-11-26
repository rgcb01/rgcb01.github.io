// SVG figures for The Optical Resolution Limit. Pure functions of the model output: no state here.
import { orlOrderShift } from './model.js';

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const sourceShape = (p) => {
  const na = p.na;
  if (p.illumination === 'coherent' || p.sigma <= 1e-6) return [{ kind: 'dot', cx: 0, r: 0 }];
  if (p.illumination === 'conventional') return [{ kind: 'disk', cx: 0, r: p.sigma * na }];
  if (p.illumination === 'annular') return [{ kind: 'ring', cx: 0, r: p.sigma * na, r0: 0.7 * p.sigma * na }];
  return [{ kind: 'disk', cx: -p.sigma * na, r: 0.1 * na }, { kind: 'disk', cx: p.sigma * na, r: 0.1 * na }];
};
const ringPath = (cx, cy, r, r0) => `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z M ${cx + r0} ${cy} A ${r0} ${r0} 0 1 1 ${cx - r0} ${cy} A ${r0} ${r0} 0 1 1 ${cx + r0} ${cy} Z`;

// Pupil view: the pupil disk (radius NA) and the copy of the illumination source that every diffraction order
// lands on. The part of each copy inside the disk is the light that reaches the wafer.
export function PupilDiagram({ analysis, id = 'pupil', size = 340, compact = false }) {
  const p = analysis.params, na = p.na, R = na * 2.05, S = (size / 2 - 10) / R, c = size / 2;
  const X = f => c + f * S;
  const shapes = sourceShape(p);
  const M = Math.min(analysis.maxOrder, 12);
  const orders = [];
  for (let m = -M; m <= M; m++) {
    const shift = orlOrderShift(m, p.wavelength, p.pitch);
    if (Math.abs(shift) - na > R + 0.05) continue;
    orders.push({ m, shift, captured: analysis.captured.anySource.includes(m) });
  }
  const clipId = `${id}-clip`;
  const passing = orders.filter(o => o.captured).length;
  const label = `Pupil view. Numerical aperture ${fmt(na)}. ${passing} of the diffraction orders shown reach the wafer: ${orders.filter(o => o.captured).map(o => o.m).join(', ') || 'none'}.`;
  const drawShape = (o, cls, clip) => shapes.map((s, i) => {
    const cx = X(o.shift + s.cx), cy = c;
    const key = `${o.m}-${i}-${cls}`;
    if (s.kind === 'dot') return <circle key={key} className={cls} cx={cx} cy={cy} r={compact ? 5 : 6} clipPath={clip} />;
    if (s.kind === 'ring') return <path key={key} className={cls} d={ringPath(cx, cy, s.r * S, s.r0 * S)} fillRule="evenodd" clipPath={clip} />;
    return <circle key={key} className={cls} cx={cx} cy={cy} r={Math.max(3, s.r * S)} clipPath={clip} />;
  });
  return (
    <svg className="lab-svg lab-pupil" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <defs><clipPath id={clipId}><circle cx={c} cy={c} r={na * S} /></clipPath></defs>
      <line className="lab-axis" x1={8} x2={size - 8} y1={c} y2={c} />
      <line className="lab-axis" x1={c} x2={c} y1={8} y2={size - 8} />
      {na > 1 && <circle className="lab-air" cx={c} cy={c} r={S} />}
      <circle className="lab-pupil-disk" cx={c} cy={c} r={na * S} />
      {orders.map(o => <g key={o.m} className={`lab-order ${o.m === 0 ? 'is-zero' : ''}`}>{drawShape(o, 'lab-order-out')}</g>)}
      {orders.map(o => <g key={`in${o.m}`} className={`lab-order ${o.m === 0 ? 'is-zero' : ''}`}>{drawShape(o, 'lab-order-in', `url(#${clipId})`)}</g>)}
      {orders.filter(o => Math.abs(o.shift) <= R).map(o => (
        <text key={`t${o.m}`} className={`lab-order-label ${o.captured ? 'is-in' : ''}`} x={X(o.shift)} y={c - (shapes[0].r ? Math.max(shapes[0].r * S, 8) : 10) - 7} textAnchor="middle">{o.m === 0 ? '0' : o.m > 0 ? `+${o.m}` : `−${-o.m}`}</text>
      ))}
      {!compact && <>
        <text className="lab-svg-note" x={c} y={c + na * S + 16} textAnchor="middle">pupil · NA {fmt(na)}</text>
        {na > 1 && <text className="lab-svg-note" x={c} y={c - S - 6} textAnchor="middle">n sin θ = 1</text>}
      </>}
    </svg>
  );
}

// Side view of the optical train for one illumination direction: mask, diffraction orders, aperture stop, wafer.
export function OpticalTrain({ analysis, width = 560, height = 360 }) {
  const p = analysis.params, cx = width / 2, S = (width / 2 - 24) / 1.6;
  const yMask = 74, yStop = 206, yWafer = 316;
  const fs = p.illumination === 'coherent' ? 0 : -(p.illumination === 'dipole' ? p.sigma : p.sigma) * p.na;
  const orders = [];
  for (let m = -6; m <= 6; m++) {
    const f = fs + orlOrderShift(m, p.wavelength, p.pitch);
    if (Math.abs(f) > 1.6 && Math.abs(m) > 1) continue;
    orders.push({ m, f, pass: Math.abs(f) <= p.na + 1e-12 });
  }
  const stopHalf = p.na * S;
  const passCount = orders.filter(o => o.pass).length;
  const lines = 9, gw = 230, gx0 = cx - gw / 2, cell = gw / lines;
  const I = analysis.intensity, n = I.length, Imax = Math.max(1e-9, ...I);
  const label = `Side view for one illumination direction. ${passCount} order${passCount === 1 ? '' : 's'} pass the aperture: ${orders.filter(o => o.pass).map(o => o.m).join(', ')}.`;
  return (
    <svg className="lab-svg lab-train" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {/* illumination */}
      {(() => { const dx = fs * 40; return <g className="lab-illum"><line x1={cx - dx} y1={14} x2={cx} y2={yMask - 8} markerEnd="url(#lab-arrow)" /><text className="lab-svg-note" x={cx + Math.abs(dx) + 14} y={22}>illumination{fs ? ` · tilt n sin θ = ${fmt(fs)}` : ' · on axis'}</text></g>; })()}
      <defs><marker id="lab-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" className="lab-arrowhead" /></marker></defs>
      {/* mask */}
      <rect className="lab-glass" x={gx0 - 18} y={yMask - 7} width={gw + 36} height={14} rx={2} />
      {Array.from({ length: lines }, (_, i) => <rect key={i} className="lab-chrome" x={gx0 + i * cell + cell * p.duty}y={yMask - 7} width={cell * (1 - p.duty)} height={14} />)}
      <text className="lab-svg-note" x={gx0 + gw + 26} y={yMask + 4}>mask · p = {Math.round(p.pitch)} nm</text>
      {/* orders */}
      {orders.map(o => {
        const xs = cx + Math.max(-1.62, Math.min(1.62, o.f)) * S;
        const end = o.pass ? yStop : yStop - 10;
        return <g key={o.m} className={`lab-ray ${o.pass ? 'is-pass' : 'is-block'} ${o.m === 0 ? 'is-zero' : ''}`}>
          <line x1={cx} y1={yMask + 7} x2={xs} y2={end} />
          {o.pass && <line x1={xs} y1={yStop + 8} x2={cx} y2={yWafer - 6} />}
          {!o.pass && Math.abs(o.f) <= 1.6 && <g transform={`translate(${xs} ${end})`}><line x1={-5} y1={-5} x2={5} y2={5} /><line x1={-5} y1={5} x2={5} y2={-5} /></g>}
          {Math.abs(o.m) <= 3 && <text className="lab-ray-label" x={xs + (o.f >= 0 ? 6 : -6)} y={end - 8} textAnchor={o.f >= 0 ? 'start' : 'end'}>{o.m === 0 ? '0' : o.m > 0 ? `+${o.m}` : `−${-o.m}`}</text>}
        </g>;
      })}
      {/* lens + aperture stop */}
      <ellipse className="lab-lens" cx={cx} cy={yStop + 2} rx={stopHalf + 6} ry={13} />
      <rect className="lab-stop" x={6} y={yStop - 3} width={Math.max(0, cx - stopHalf - 6)} height={10} />
      <rect className="lab-stop" x={cx + stopHalf} y={yStop - 3} width={Math.max(0, width - 6 - cx - stopHalf)} height={10} />
      <text className="lab-svg-note" x={12} y={yStop + 26}>aperture stop · NA {fmt(p.na)}</text>
      {/* wafer with the aerial image as exposure */}
      <rect className="lab-wafer" x={cx - 150} y={yWafer} width={300} height={22} rx={2} />
      {Array.from({ length: 120 }, (_, k) => {
        const v = I[Math.round((k / 119) * (n - 1))] / Imax;
        return <rect key={k} x={cx - 150 + k * 2.5} y={yWafer} width={2.6} height={10} className="lab-exposure" style={{ opacity: 0.08 + 0.92 * v }} />;
      })}
      <text className="lab-svg-note" x={cx + 158} y={yWafer + 14}>wafer · aerial image</text>
    </svg>
  );
}

// Aerial image I(x) over two periods, with the mask drawn above it.
export function AerialImagePlot({ analysis, width = 560, height = 330, compact = false }) {
  const p = analysis.params, x = analysis.x, I = analysis.intensity;
  const L = 44, Rm = 12, T = compact ? 26 : 34, B = compact ? 26 : 36, W = width - L - Rm, H = height - T - B;
  const yMax = Math.max(1.05, analysis.max * 1.08);
  const X = v => L + ((v - x[0]) / (x[x.length - 1] - x[0])) * W, Y = v => T + H - (v / yMax) * H;
  const d = I.map((v, i) => `${i ? 'L' : 'M'}${X(x[i]).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(x[x.length - 1]).toFixed(1)} ${Y(0)} L${X(x[0]).toFixed(1)} ${Y(0)} Z`;
  // chrome lines on the mask strip: opaque where |x mod p| > duty * p / 2
  const bars = [];
  const x0 = x[0], x1 = x[x.length - 1];
  for (let k = Math.floor(x0 / p.pitch) - 1; k <= Math.ceil(x1 / p.pitch) + 1; k++) {
    const a = Math.max(x0, k * p.pitch + (p.duty * p.pitch) / 2), b = Math.min(x1, (k + 1) * p.pitch - (p.duty * p.pitch) / 2);
    if (b > a) bars.push([a, b]);
  }
  const ticks = [0, 0.5, 1].filter(v => v <= yMax);
  return (
    <svg className="lab-svg lab-image" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Aerial image over two periods. Contrast ${fmt(analysis.contrast)}; intensity from ${fmt(analysis.min)} to ${fmt(analysis.max)}.`}>
      <rect className="lab-mask-strip" x={L} y={T - 16} width={W} height={9} />
      {bars.map(([a, b], i) => <rect key={i} className="lab-chrome" x={X(a)} y={T - 16} width={X(b) - X(a)} height={9} />)}
      {!compact && <text className="lab-svg-note" x={L} y={T - 21}>mask (dark = chrome)</text>}
      {ticks.map(v => <g key={v}><line className="lab-grid" x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} /><text className="lab-tick" x={L - 7} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
      <path className="lab-image-area" d={area} />
      <path className="lab-image-line" d={d} />
      {analysis.contrast > 0 && <>
        <line className="lab-ref" x1={L} x2={L + W} y1={Y(analysis.max)} y2={Y(analysis.max)} />
        <line className="lab-ref" x1={L} x2={L + W} y1={Y(analysis.min)} y2={Y(analysis.min)} />
      </>}
      <line className="lab-axis" x1={L} x2={L + W} y1={Y(0)} y2={Y(0)} />
      {[-1, -0.5, 0, 0.5, 1].map(f => <text key={f} className="lab-tick" x={X(f * p.pitch)} y={Y(0) + 15} textAnchor="middle">{f === 0 ? '0' : `${f > 0 ? '' : '−'}${Math.abs(f) === 1 ? '' : '½'}p`}</text>)}
      {!compact && <text className="lab-svg-note" x={L + W} y={height - 4} textAnchor="end">position x · intensity relative to a fully open mask</text>}
    </svg>
  );
}

// Log-scale pitch ruler with the three limits and the current pitch.
export function PitchRuler({ analysis, width = 560, height = 92 }) {
  const p = analysis.params, lim = analysis.limits;
  const lo = Math.log10(Math.max(5, Math.min(lim.absolutePitch, p.pitch) / 2)), hi = Math.log10(Math.max(lim.coherentPitch, p.pitch) * 2.2);
  const L = 14, W = width - 28, X = v => L + ((Math.log10(v) - lo) / (hi - lo)) * W;
  const marks = [
    { v: lim.absolutePitch, label: 'λ/2NA', cls: 'is-wall' },
    { v: lim.currentPitch, label: 'this light', cls: 'is-current' },
    { v: lim.coherentPitch, label: 'λ/NA', cls: 'is-coherent' },
  ];
  const decades = [];
  for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) for (const k of [1, 2, 5]) { const v = k * 10 ** e; if (Math.log10(v) >= lo && Math.log10(v) <= hi) decades.push(v); }
  const y = 46;
  return (
    <svg className="lab-svg lab-ruler" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Pitch ruler. Your pitch ${Math.round(p.pitch)} nm; absolute limit ${fmt(lim.absolutePitch, 1)} nm; limit with this illumination ${fmt(lim.currentPitch, 1)} nm; coherent limit ${fmt(lim.coherentPitch, 1)} nm.`}>
      <rect className="lab-ruler-dead" x={L} y={y - 6} width={Math.max(0, X(lim.absolutePitch) - L)} height={12} />
      <line className="lab-axis" x1={L} x2={L + W} y1={y} y2={y} />
      {decades.map(v => <g key={v}><line className="lab-grid" x1={X(v)} x2={X(v)} y1={y - 4} y2={y + 4} /><text className="lab-tick" x={X(v)} y={y + 20} textAnchor="middle">{v} nm</text></g>)}
      {marks.map((m, i) => <g key={m.label} className={`lab-ruler-mark ${m.cls}`}><line x1={X(m.v)} x2={X(m.v)} y1={y - 14} y2={y + 6} /><text x={X(m.v)} y={y - 18 - (i === 1 && Math.abs(X(lim.currentPitch) - X(lim.coherentPitch)) < 60 ? 12 : 0)} textAnchor="middle">{m.label}</text></g>)}
      <g className="lab-ruler-you" transform={`translate(${X(p.pitch)} ${y + 28})`}><path d="M0 -10 L6 0 L-6 0 Z" /><text y={14} textAnchor="middle">your pitch {Math.round(p.pitch)} nm</text></g>
    </svg>
  );
}

// Two incoherent point images and their sum (Rayleigh).
export function TwoPointPlot({ profile, width = 560, height = 220 }) {
  const { x, intensity, rayleigh } = profile;
  const L = 44, Rm = 12, T = 16, B = 34, W = width - L - Rm, H = height - T - B, yMax = Math.max(1.2, profile.peak * 1.08);
  const X = v => L + ((v - x[0]) / (x[x.length - 1] - x[0])) * W, Y = v => T + H - (v / yMax) * H;
  const sep = profile.separation;
  const single = s => x.map(v => profile.airy(v - s));
  const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${X(x[i]).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="lab-svg lab-twopoint" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Two point images separated by ${fmt(sep / rayleigh)} times the Rayleigh distance; the dip between them is ${Math.round(profile.dip * 100)} percent.`}>
      {[0, 0.5, 1].map(v => <g key={v}><line className="lab-grid" x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} /><text className="lab-tick" x={L - 7} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
      <path className="lab-airy" d={path(single(-sep / 2))} />
      <path className="lab-airy" d={path(single(sep / 2))} />
      <path className="lab-image-line" d={path(intensity)} />
      <line className="lab-axis" x1={L} x2={L + W} y1={Y(0)} y2={Y(0)} />
      <text className="lab-svg-note" x={L + W} y={height - 6} textAnchor="end">position · two incoherent points, sum in bold</text>
    </svg>
  );
}
