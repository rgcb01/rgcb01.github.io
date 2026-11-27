// SVG figures for Lab 003. Semantic colours: blue target, white main mask feature, purple assist bars, orange
// no-assist (uncorrected) results, green with-assist results, red unwanted printing and errors.
export const SRAF_COLORS = { target: '#4da6ff', mask: '#f5f7fb', assist: '#b07cff', base: '#ff9f43', good: '#3ddc84', bad: '#ff4d5e', dense: '#8fa3c7' };
const X0 = -720, X1 = 720;
const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');

// Top-down strips: mask (white line, purple assists) or wafer (printed resist, blue target outline).
export function SrafStrip({ result, kind, width = 720, height = 56, label = true }) {
  const X = (x) => ((x - X0) / (X1 - X0)) * width, m = result.design.mask, p = result.params, st = result.state, good = p.bars > 0;
  return (
    <svg className="lab-svg sraf-strip" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={kind === 'mask' ? `Mask: main line ${p.cd} nm and ${p.bars * 2} assist bars ${p.barWidth} nm wide` : `Wafer at ${p.defocus} nm defocus: main line ${fmt(st.cd, 1)} nm${st.unwanted.length ? `, ${st.unwanted.length} unwanted printed features` : ', nothing else prints'}`}>
      <rect x="0" y="0" width={width} height={height} className={kind === 'mask' ? 'sraf-glass' : 'sraf-wafer'} />
      {kind === 'mask' && <>
        {m.main.map(([a, b], i) => <rect key={i} x={X(a)} y={6} width={X(b) - X(a)} height={height - 12} fill={SRAF_COLORS.mask} />)}
        {m.bars.map(([a, b], i) => <rect key={i} x={X(a)} y={6} width={Math.max(1, X(b) - X(a))} height={height - 12} fill={SRAF_COLORS.assist} />)}
      </>}
      {kind === 'wafer' && <>
        {st.main && <rect x={X(st.main[0])} y={6} width={X(st.main[1]) - X(st.main[0])} height={height - 12} fill={good ? SRAF_COLORS.good : SRAF_COLORS.base} opacity="0.9" />}
        {st.unwanted.map(([a, b], i) => <rect key={i} x={X(a)} y={6} width={Math.max(1.5, X(b) - X(a))} height={height - 12} fill={SRAF_COLORS.bad} />)}
        <rect x={X(-p.cd / 2)} y={4} width={X(p.cd / 2) - X(-p.cd / 2)} height={height - 8} fill="none" stroke={SRAF_COLORS.target} strokeWidth="1.5" strokeDasharray="5 3" />
      </>}
      {label && <text x="8" y="14" className="lab-svg-note">{kind === 'mask' ? 'MASK' : 'WAFER'}</text>}
    </svg>
  );
}

// Cross-section of the resist-model intensity at the current focus, with the printing threshold.
export function SrafProfile({ result, width = 720, height = 260 }) {
  const p = result.params, st = result.state, sb = result.stateBase, L = 40, R = 10, T = 14, B = 30, W = width - L - R, H = height - T - B, ymax = 1.45;
  const X = (x) => L + ((x - X0) / (X1 - X0)) * W, Y = (v) => T + H - (Math.min(v, ymax) / ymax) * H, good = p.bars > 0;
  const path = (xs, ys) => xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(ys[i]).toFixed(1)}`).join(' ');
  const fillBelow = ([a, b], color, key) => { const pts = st.xs.map((x, i) => [x, st.ys[i]]).filter(([x]) => x >= a && x <= b); if (pts.length < 2) return null; return <path key={key} d={`M${X(a)} ${Y(st.t)} ${pts.map(([x, v]) => `L${X(x).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')} L${X(b)} ${Y(st.t)} Z`} fill={color} opacity="0.45" />; };
  return (
    <svg className="lab-svg sraf-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Resist-model intensity across the line at ${p.defocus} nm defocus. Printing threshold ${fmt(st.t, 3)}. ${st.unwanted.length ? 'An assist or side lobe dips below the threshold and prints.' : 'Every assist dip stays above the threshold.'}`}>
      {result.design.mask.bars.map(([a, b], i) => <rect key={i} x={X(a)} y={T} width={Math.max(1, X(b) - X(a))} height={H} fill={SRAF_COLORS.assist} opacity="0.14" />)}
      {[0, 0.5, 1].map(v => <g key={v}><line className="lab-grid" x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} /><text className="lab-tick" x={L - 6} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
      {st.main && fillBelow(st.main, good ? SRAF_COLORS.good : SRAF_COLORS.base, 'm')}
      {st.unwanted.map((iv, i) => fillBelow(iv, SRAF_COLORS.bad, `u${i}`))}
      {good && <path d={path(sb.xs, sb.ys)} fill="none" stroke={SRAF_COLORS.base} strokeWidth="1.4" strokeDasharray="5 4" />}
      <path d={path(st.xs, st.ys)} fill="none" stroke={good ? SRAF_COLORS.good : SRAF_COLORS.base} strokeWidth="2.2" />
      <line x1={L} x2={L + W} y1={Y(st.t)} y2={Y(st.t)} stroke="#f5f7fb" strokeWidth="1.2" strokeDasharray="6 4" />
      <text x={L + 4} y={Y(st.t) - 6} textAnchor="start" className="lab-svg-note">threshold · resist remains below it</text>
      {[-1, 1].map(s => <line key={s} x1={X(s * p.cd / 2)} x2={X(s * p.cd / 2)} y1={T + H} y2={T + H + 6} stroke={SRAF_COLORS.target} strokeWidth="2" />)}
      <line className="lab-axis" x1={L} x2={L + W} y1={Y(0)} y2={Y(0)} />
      {[-600, -300, 0, 300, 600].map(x => <text key={x} className="lab-tick" x={X(x)} y={height - 8} textAnchor="middle">{x} nm</text>)}
    </svg>
  );
}

// Focus-exposure window: the signature figure.
export function SrafWindowChart({ result, width = 720, height = 380, showBase = true, showDense = false }) {
  const d = result.design, b = result.base, dn = result.dense, p = result.params;
  const all = [d, showBase ? b : null, showDense ? dn : null].filter(Boolean).flatMap(a => a.rows.filter(r => r.ok));
  const lo = Math.min(...all.map(r => r.Elo)) * 0.96, hi = Math.max(...all.map(r => r.Ehi)) * 1.03;
  const L = 52, R = 14, T = 16, B = 40, W = width - L - R, H = height - T - B, zmax = 400;
  const X = (z) => L + ((z + zmax) / (2 * zmax)) * W, Y = (E) => T + H - ((E - lo) / (hi - lo)) * H;
  // runs of ok rows (a window can split into pieces)
  const runs = (rows) => { const out = []; let cur = []; for (const r of rows) { if (r.ok) cur.push(r); else if (cur.length) { out.push(cur); cur = []; } } if (cur.length) out.push(cur); return out; };
  const band = (rows, top, bot) => runs(rows).map(run => `M${run.map(r => `${X(r.z).toFixed(1)} ${Y(top(r)).toFixed(1)}`).join(' L')} L${run.slice().reverse().map(r => `${X(r.z).toFixed(1)} ${Y(bot(r)).toFixed(1)}`).join(' L')} Z`).join(' ');
  const cdBand = band(d.rows, r => r.Ehi, r => r.Elo);
  const freeBand = band(d.rows.map(r => ({ ...r, ok: r.ok && r.Ehi > Math.max(r.Elo, r.Eprint) })), r => r.Ehi, r => Math.max(r.Elo, r.Eprint));
  const printBand = band(d.rows.map(r => ({ ...r, ok: r.ok && r.Eprint > r.Elo })), r => Math.min(r.Ehi, r.Eprint), r => r.Elo);
  const rect = (w, cls, color, dash) => (w && w.dof > 0 ? <rect x={X(w.z0)} y={Y(w.e1)} width={X(w.z1) - X(w.z0)} height={Y(w.e0) - Y(w.e1)} fill="none" stroke={color} strokeWidth={cls === 'main' ? 2.4 : 1.6} strokeDasharray={dash} /> : null);
  const safe = d.windows.safe, cdOnly = d.windows.cdOnly, hasBars = p.bars > 0;
  const doseTicks = []; for (let k = 0; k <= 4; k++) doseTicks.push(lo + (hi - lo) * k / 4);
  return (
    <svg className="lab-svg sraf-window" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Focus-exposure window. Defect-free depth of focus at 5 percent exposure latitude: ${fmt(d.windows.defectFree.dof)} nm with this design, ${fmt(b.windows.defectFree.dof)} nm without assists.${d.verdict === 'prints' ? ' Assists print inside the CD-only window.' : ''}`}>
      <defs>
        <pattern id="sraf-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="rgba(255,77,94,0.10)" /><line x1="0" y1="0" x2="0" y2="7" stroke={SRAF_COLORS.bad} strokeWidth="2" /></pattern>
        <clipPath id="sraf-plot"><rect x={L} y={T} width={W} height={H} /></clipPath>
      </defs>
      {doseTicks.map((v, i) => <g key={i}><line className="lab-grid" x1={L} x2={L + W} y1={Y(v)} y2={Y(v)} /><text className="lab-tick" x={L - 6} y={Y(v) + 4} textAnchor="end">{v.toFixed(2)}</text></g>)}
      {[-400, -200, 0, 200, 400].map(z => <g key={z}><line className="lab-grid" x1={X(z)} x2={X(z)} y1={T} y2={T + H} /><text className="lab-tick" x={X(z)} y={T + H + 16} textAnchor="middle">{z}</text></g>)}
      <g clipPath="url(#sraf-plot)">
        {showDense && dn && <path d={band(dn.rows, r => r.Ehi, r => r.Elo)} fill="none" stroke={SRAF_COLORS.dense} strokeWidth="1.4" strokeDasharray="3 4" />}
        <path d={cdBand} fill="rgba(245,247,251,0.06)" stroke="rgba(245,247,251,0.45)" strokeWidth="1.2" />
        {hasBars && <path d={freeBand} fill={d.verdict === 'prints' ? 'rgba(61,220,132,0.16)' : 'rgba(61,220,132,0.28)'} />}
        {!hasBars && <path d={freeBand} fill="rgba(255,159,67,0.22)" />}
        {hasBars && printBand && <path d={printBand} fill="url(#sraf-hatch)" />}
        {hasBars && <path d={d.rows.filter(r => r.ok).map((r, i) => `${i ? 'L' : 'M'}${X(r.z).toFixed(1)} ${Y(r.Esafe).toFixed(1)}`).join(' ')} fill="none" stroke={SRAF_COLORS.assist} strokeWidth="1.2" strokeDasharray="2 3" />}
        {showBase && hasBars && <path d={band(b.rows, r => r.Ehi, r => r.Elo)} fill="none" stroke={SRAF_COLORS.base} strokeWidth="1.5" strokeDasharray="6 4" />}
        {showBase && hasBars && rect(b.windows.defectFree, 'base', SRAF_COLORS.base, '6 4')}
        {hasBars && d.verdict === 'prints' && rect(cdOnly, 'ghost', 'rgba(245,247,251,0.5)', '2 4')}
        {rect(hasBars ? (safe.dof ? safe : d.windows.defectFree) : d.windows.defectFree, 'main', hasBars ? SRAF_COLORS.good : SRAF_COLORS.base)}
        <g><line x1={X(p.defocus)} x2={X(p.defocus)} y1={T} y2={T + H} stroke="#f5f7fb" strokeWidth="1" opacity="0.5" /><circle cx={X(p.defocus)} cy={Y(result.dose)} r="5" fill="#f5f7fb" stroke="#080b12" strokeWidth="1.5" /></g>
      </g>
      <line className="lab-axis" x1={L} x2={L + W} y1={T + H} y2={T + H} />
      <text className="lab-svg-note" x={L + W / 2} y={height - 4} textAnchor="middle">focus (nm)</text>
      <text className="lab-svg-note" x={12} y={T + H / 2} transform={`rotate(-90 12 ${T + H / 2})`} textAnchor="middle">dose (× dose to clear)</text>
    </svg>
  );
}

// Diffraction spectrum of the mask, in units of NA / lambda, with the band that annular light images in focus-
// tolerant pairs: a frequency f is imaged by two beams symmetric about the axis when the source point sits at -f/2.
export function SrafSpectrum({ result, width = 720, height = 220 }) {
  const p = result.params, s = result.spectrum, L = 40, R = 10, T = 12, B = 32, W = width - L - R, H = height - T - B, fmax = 2;
  const norm = Math.max(...s.base, ...(p.bars ? s.cur : [])) * 1.05, X = (f) => L + ((f + fmax) / (2 * fmax)) * W, Y = (v) => T + H - Math.min(1, v / norm) * H;
  const path = (arr) => s.f.map((f, i) => (Math.abs(f) <= fmax ? `${i ? 'L' : 'M'}${X(f).toFixed(1)} ${Y(arr[i]).toFixed(1)}` : '')).join(' ').replace(/^ L/, 'M');
  const annular = p.illumination !== 'conventional', b0 = 2 * p.sigmaIn, b1 = 2 * p.sigmaOut;
  return (
    <svg className="lab-svg sraf-spectrum" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mask diffraction spectrum with and without assists">
      <rect x={X(-(1 + p.sigmaOut))} y={T} width={X(1 + p.sigmaOut) - X(-(1 + p.sigmaOut))} height={H} fill="rgba(77,166,255,0.06)" />
      {annular && [-1, 1].map(sg => <rect key={sg} x={X(sg > 0 ? b0 : -b1)} y={T} width={X(b1) - X(b0)} height={H} fill="rgba(176,124,255,0.14)" />)}
      <path d={path(s.base)} fill="none" stroke={SRAF_COLORS.base} strokeWidth="1.4" strokeDasharray={p.bars ? '5 4' : undefined} />
      {p.bars > 0 && <path d={path(s.cur)} fill="none" stroke={SRAF_COLORS.good} strokeWidth="2" />}
      <line className="lab-axis" x1={L} x2={L + W} y1={T + H} y2={T + H} />
      {[-2, -1, 0, 1, 2].map(f => <text key={f} className="lab-tick" x={X(f)} y={T + H + 14} textAnchor="middle">{f}</text>)}
      <text className="lab-svg-note" x={L + W / 2} y={height - 3} textAnchor="middle">frequency × λ/NA · blue: reaches the lens · purple: focus-tolerant band</text>
    </svg>
  );
}
