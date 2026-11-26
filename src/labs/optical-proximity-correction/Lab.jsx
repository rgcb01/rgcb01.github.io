// Interactive UI for Lab 002 (optical proximity correction). Every number comes from ./model.js, run in a worker.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, RotateCcw, Trophy } from 'lucide-react';
import { OPC_DEFAULTS, OPC_LIMITS, opcContours, opcExperiment, opcIsoDenseBias, opcNormalize } from './model.js';
import { OPC_COLORS, OpcStage, OpcViewer, opcViews, outlineOf } from './figures.jsx';

const Q = { wavelength: 'lambda', na: 'na', cd: 'cd', space: 'space', threshold: 'thr', mode: 'opc', strength: 'strength', bias: 'bias', serif: 'serif', hammerOverhang: 'hw', hammerLength: 'hl', hammerExtension: 'he' };
const UIQ = { advanced: 'adv', view: 'view', split: 'split', chapter: 'step' };
const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const signed = (v, d = 1) => (Number.isFinite(v) ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}` : '–');
const ALL_LAYERS = { image: false, mask: true, target: true, contour: true, epe: true };

// Guided tour: four states, the same story as the explainer
export const OPC_CHAPTERS = [
  { id: 'ideal', short: 'The ideal pattern', tip: 'Blue is what the circuit needs. Here the mask (white) is drawn exactly like it.', ui: { split: 1, view: 'all', layers: { image: false, mask: true, target: true, contour: false, epe: false } }, params: { mode: 'model', strength: 1 } },
  { id: 'reality', short: 'Reality is different', tip: 'Diffraction blurs the image: line ends print short (orange) and corners print round. Red marks the error at each site.', ui: { split: 1, view: 'lineEnds', layers: { image: true, mask: false, target: true, contour: true, epe: true } }, params: { mode: 'model', strength: 1 } },
  { id: 'distort', short: 'Distort the mask', tip: 'Model-based OPC moves every edge fragment against its error. Hammerheads and serifs appear by themselves.', ui: { split: 0, view: 'lineEnds', layers: { image: false, mask: true, target: true, contour: false, epe: false } }, params: { mode: 'model', strength: 1 } },
  { id: 'better', short: 'A better print', tip: 'Same optics, same resist. Drag the divider: orange is the original mask’s print, green the corrected one.', ui: { split: 0.5, view: 'all', layers: { image: false, mask: false, target: true, contour: true, epe: true } }, params: { mode: 'model', strength: 1 } },
];

function readUrl() {
  const q = new URLSearchParams(window.location.search), p = {}, ui = {};
  for (const [k, n] of Object.entries(Q)) if (q.has(n)) p[k] = k === 'mode' ? q.get(n) : k === 'threshold' && q.get(n) === 'auto' ? null : Number(q.get(n));
  if (q.has(UIQ.advanced)) ui.advanced = q.get(UIQ.advanced) === '1';
  if (q.has(UIQ.view)) ui.view = q.get(UIQ.view);
  if (q.has(UIQ.split)) ui.split = Math.max(0, Math.min(1, Number(q.get(UIQ.split)) || 0.5));
  if (q.has(UIQ.chapter)) ui.chapter = q.get(UIQ.chapter);
  return { p: opcNormalize(p), ui };
}
function writeUrl(p, ui) {
  const q = new URLSearchParams();
  for (const [k, n] of Object.entries(Q)) { const v = p[k]; if (v === OPC_DEFAULTS[k] || (k === 'threshold' && v == null)) continue; q.set(n, k === 'mode' ? v : +Number(v).toFixed(4)); }
  if (ui.advanced) q.set(UIQ.advanced, '1');
  if (ui.view !== 'all') q.set(UIQ.view, ui.view);
  if (Math.abs(ui.split - 0.5) > 0.005) q.set(UIQ.split, ui.split.toFixed(2));
  if (ui.chapter) q.set(UIQ.chapter, ui.chapter);
  const s = q.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}${window.location.hash}`);
}

function Slider({ id, label, value, min, max, step, display, onChange, hint }) {
  return (
    <div className="lab-control">
      <div className="lab-control-top"><label htmlFor={id}>{label}</label><output htmlFor={id}>{display}</output></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={display} />
      {hint && <p className="lab-control-hint">{hint}</p>}
    </div>
  );
}

// Diagnosis of a rule-based attempt, in plain words, from the measured metrics
function diagnose(before, after) {
  const notes = [];
  if (after.pinched || after.bridged) notes.push(`${after.pinched + after.bridged} sites pinch or bridge: the corrections are too large.`);
  if (after.lineEnd > 5) notes.push(`Line ends now print ${fmt(after.lineEnd)} nm too long: reduce the hammerhead extension.`);
  else if (after.lineEnd < -5) notes.push(`Line ends still print ${fmt(-after.lineEnd)} nm short: add hammerhead extension or overhang.`);
  if (after.outerCorner < -15) notes.push(`The outer corner is still rounded by ${fmt(-after.outerCorner)} nm: try a larger serif.`);
  else if (after.outerCorner > 5) notes.push(`The serif overshoots the corner by ${fmt(after.outerCorner)} nm.`);
  const iso = opcIsoDenseBias(after);
  if (Math.abs(iso) > 6) notes.push(`Isolated and dense lines still differ by ${fmt(iso)} nm: one global bias cannot fix both, which is why OPC moves each edge separately.`);
  if (!notes.length) notes.push('Balanced. Compare it with the model-based result.');
  return notes;
}

export function Simulation() {
  const init = useMemo(() => (typeof window === 'undefined' ? { p: opcNormalize({}), ui: {} } : readUrl()), []);
  const [params, setParams] = useState(init.p);
  const [advanced, setAdvanced] = useState(init.ui.advanced ?? false);
  const [view, setView] = useState(init.ui.view ?? 'all');
  const [split, setSplit] = useState(init.ui.split ?? 0.5);
  const [layers, setLayers] = useState(ALL_LAYERS);
  const [chapter, setChapter] = useState(init.ui.chapter ?? null);
  const [epeGain, setEpeGain] = useState(1);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [copied, setCopied] = useState(false);
  const worker = useRef(null), seq = useRef(0);

  useEffect(() => {
    const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    w.onmessage = (e) => {
      const { id, result: r, progress, error: err } = e.data;
      if (id !== seq.current) return;
      if (progress) setBusy(`Running model-based OPC · iteration ${progress.it + 1} of ${progress.n + 1}`);
      if (err) { setError(err); setBusy(null); }
      if (r) { setResult(r); setBusy(null); setError(null); }
    };
    worker.current = w;
    return () => w.terminate();
  }, []);
  useEffect(() => {
    const id = ++seq.current, t = setTimeout(() => { setBusy((b) => b || 'Computing the aerial image…'); worker.current?.postMessage({ id, params, reference: !!challenge }); }, 120);
    return () => clearTimeout(t);
  }, [params, challenge]);
  useEffect(() => { const t = setTimeout(() => writeUrl(params, { advanced, view, split, chapter }), 250); return () => clearTimeout(t); }, [params, advanced, view, split, chapter]);
  // apply a chapter from a shared URL once
  useEffect(() => { const c = OPC_CHAPTERS.find(x => x.id === init.ui.chapter); if (c) { setLayers(c.ui.layers); } }, [init]);

  // record challenge attempts as results arrive
  useEffect(() => {
    if (!challenge || !result || result.params.mode !== 'rules') return;
    const a = result.after.metrics, key = ['bias', 'serif', 'hammerOverhang', 'hammerLength', 'hammerExtension'].map(k => result.params[k]).join(',');
    setChallenge((c) => (c.attempts[0]?.key === key ? c : { ...c, attempts: [{ key, rms: a.rms, params: { ...result.params } }, ...c.attempts].slice(0, 6) }));
  }, [result, challenge]);

  const update = (patch) => { setChapter(null); setParams((p) => opcNormalize({ ...p, ...patch })); };
  const goChapter = (c) => { setChapter(c.id); setParams((p) => opcNormalize({ ...p, ...c.params })); setView(c.ui.view); setSplit(c.ui.split); setLayers(c.ui.layers); };
  const startChallenge = () => { setAdvanced(true); setChapter(null); setChallenge({ attempts: [] }); setParams((p) => opcNormalize({ ...p, mode: 'rules', bias: 0, serif: 0, hammerOverhang: 0, hammerLength: 0, hammerExtension: 0 })); setSplit(0.5); setView('all'); setLayers(ALL_LAYERS); };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Copy this link', window.location.href); } };

  const b = result?.before.metrics, a = result?.after.metrics, ch = OPC_CHAPTERS.find(c => c.id === chapter), views = result ? opcViews(result) : null;
  const rows = b && a ? [
    ['RMS EPE', 'Root-mean-square edge placement error over all edge sites', b.rms, a.rms, ' nm', 1],
    ['Max |EPE|', 'Largest error at any edge site', b.maxAbs, a.maxAbs, ' nm', 1],
    ['Within ±5 nm', 'Share of edge sites within ±5 nm of the target', b.within * 100, a.within * 100, ' %', 0],
    ['Line-end tip', 'EPE at the centre of each line tip (negative = shortened)', b.lineEnd, a.lineEnd, ' nm', 1, true],
    ['Outer corner', 'Pull-back along the corner diagonal (negative = rounded)', b.outerCorner, a.outerCorner, ' nm', 1, true],
    ['Iso-dense bias', 'Printed width error, isolated line minus dense line', opcIsoDenseBias(b), opcIsoDenseBias(a), ' nm', 1, true],
  ] : [];
  const rulesMode = params.mode === 'rules';

  return (
    <div className="lab-sim opc-sim">
      <div className="lab-sim-bar">
        <div className="lab-chips" role="group" aria-label="Guided tour">
          <span className="pro-mono">Guided tour</span>
          {OPC_CHAPTERS.map((c, i) => <button key={c.id} type="button" className={chapter === c.id ? 'is-active' : ''} aria-pressed={chapter === c.id} onClick={() => goChapter(c)}>{i + 1} · {c.short}</button>)}
        </div>
        <div className="lab-sim-actions">
          <button type="button" onClick={() => { setParams(opcNormalize({})); setChapter(null); setChallenge(null); setView('all'); setSplit(0.5); setLayers(ALL_LAYERS); }}><RotateCcw size={14} /> Reset</button>
          <button type="button" onClick={copyLink}><Link2 size={14} /> {copied ? 'Link copied' : 'Copy link to this setup'}</button>
        </div>
      </div>
      <p className="lab-tour-tip" aria-live="polite">{ch ? <><strong>{ch.short}.</strong> {ch.tip}</> : challenge ? <><strong>Challenge.</strong> Use only the rule sliders to beat the uncorrected mask, then see how close you get to model-based OPC.</> : 'Drag the divider to compare the original and the corrected mask under identical optics. The URL keeps your setup.'}</p>

      <div className="opc-main">
        <figure className="lab-panel opc-figure">
          <div className="opc-figure-bar">
            <div className="lab-segment opc-views" role="group" aria-label="Zoom">{views && Object.entries(views).map(([k, v]) => <button key={k} type="button" className={view === k ? 'is-active' : ''} aria-pressed={view === k} onClick={() => setView(k)}>{v.label}</button>)}</div>
            <div className="opc-layers" role="group" aria-label="Layers">
              {[['target', 'Target', OPC_COLORS.target], ['mask', 'Mask', OPC_COLORS.mask], ['image', 'Aerial image', '#7f8ca6'], ['contour', 'Printed', OPC_COLORS.corrected], ['epe', 'EPE', OPC_COLORS.error]].map(([k, l, col]) => (
                <button key={k} type="button" className={layers[k] ? 'is-on' : ''} aria-pressed={layers[k]} onClick={() => setLayers((s) => ({ ...s, [k]: !s[k] }))}><i style={{ background: col }} />{l}</button>
              ))}
            </div>
          </div>
          {result ? <OpcViewer result={result} view={view} layers={layers} split={split} onSplit={setSplit} epeGain={epeGain} /> : <div className="lab-loading" role="status">{busy || 'Loading…'}</div>}
          <figcaption>
            <span><i className="opc-key" style={{ borderColor: OPC_COLORS.target }} />target</span>
            <span><i className="opc-key is-fill" style={{ background: OPC_COLORS.mask }} />mask</span>
            <span><i className="opc-key is-line" style={{ background: OPC_COLORS.uncorrected }} />printed, original mask</span>
            <span><i className="opc-key is-line" style={{ background: OPC_COLORS.corrected }} />printed, corrected mask</span>
            <span><i className="opc-key is-line" style={{ background: OPC_COLORS.error }} />edge placement error{epeGain > 1 ? ` (drawn ${epeGain}× longer)` : ' (true scale)'}</span>
            <label className="opc-gain"><input type="checkbox" checked={epeGain > 1} onChange={(e) => setEpeGain(e.target.checked ? 4 : 1)} /> Exaggerate errors 4×</label>
          </figcaption>
          {busy && result && <p className="opc-busy" role="status">{busy}</p>}
          {error && <p className="opc-busy is-error" role="alert">{error}</p>}
        </figure>

        <aside className="lab-panel opc-side" aria-label="Controls and results">
          <div className="lab-segment opc-level" role="group" aria-label="Interaction level">
            <button type="button" className={!advanced ? 'is-active' : ''} aria-pressed={!advanced} onClick={() => { setAdvanced(false); setChallenge(null); update({ mode: 'model' }); }}>Basic</button>
            <button type="button" className={advanced ? 'is-active' : ''} aria-pressed={advanced} onClick={() => setAdvanced(true)}>Advanced</button>
          </div>
          {!rulesMode && <Slider id="opc-strength" label="OPC strength (model-based)" value={params.strength} min={0} max={1} step={0.05} display={`${Math.round(params.strength * 100)} %`} onChange={(v) => update({ strength: v })} hint="0 % is the original mask. 100 % applies every fragment offset found by the model." />}
          {advanced && <>
            <fieldset>
              <legend className="pro-mono">Correction method</legend>
              <div className="lab-segment">
                <button type="button" className={!rulesMode ? 'is-active' : ''} aria-pressed={!rulesMode} onClick={() => { setChallenge(null); update({ mode: 'model' }); }}>Model-based</button>
                <button type="button" className={rulesMode ? 'is-active' : ''} aria-pressed={rulesMode} onClick={() => update({ mode: 'rules' })}>Your rules</button>
              </div>
            </fieldset>
            {rulesMode && <>
              <Slider id="opc-bias" label="Edge bias" value={params.bias} {...range('bias')} step={1} display={`${signed(params.bias, 0)} nm`} onChange={(v) => update({ bias: v })} hint="Moves every edge outward (+) or inward (−)." />
              <Slider id="opc-serif" label="Serif size" value={params.serif} {...range('serif')} step={2} display={`${params.serif} nm`} onChange={(v) => update({ serif: v })} hint="Square added on the outer right-angle corner." />
              <Slider id="opc-hw" label="Hammerhead overhang" value={params.hammerOverhang} {...range('hammerOverhang')} step={1} display={`${params.hammerOverhang} nm / side`} onChange={(v) => update({ hammerOverhang: v })} />
              <Slider id="opc-hl" label="Hammerhead length" value={params.hammerLength} {...range('hammerLength')} step={2} display={`${params.hammerLength} nm`} onChange={(v) => update({ hammerLength: v })} />
              <Slider id="opc-he" label="Line-end extension" value={params.hammerExtension} {...range('hammerExtension')} step={1} display={`${params.hammerExtension} nm`} onChange={(v) => update({ hammerExtension: v })} />
            </>}
            <fieldset>
              <legend className="pro-mono">Optics and pattern</legend>
              <Slider id="opc-lambda" label="Wavelength λ" value={params.wavelength} {...range('wavelength')} step={1} display={`${params.wavelength} nm`} onChange={(v) => update({ wavelength: v })} />
              <Slider id="opc-na" label="Numerical aperture" value={params.na} {...range('na')} step={0.01} display={fmt(params.na, 2)} onChange={(v) => update({ na: v })} />
              <Slider id="opc-cd" label="Feature size (CD)" value={params.cd} {...range('cd')} step={5} display={`${params.cd} nm`} onChange={(v) => update({ cd: v })} />
              <Slider id="opc-space" label="Dense spacing" value={params.space} {...range('space')} step={5} display={`${params.space} nm`} onChange={(v) => update({ space: v })} />
              <Slider id="opc-thr" label="Resist threshold" value={params.threshold ?? result?.thr ?? 0.34} {...range('threshold')} step={0.005} display={`${fmt(params.threshold ?? result?.thr ?? NaN, 3)}${params.threshold == null ? ' · dose-to-size' : ''}`} onChange={(v) => update({ threshold: v })} hint="Printed resist remains where the blurred intensity is below this level." />
              {params.threshold != null && <button type="button" className="opc-link" onClick={() => update({ threshold: null })}>Back to dose-to-size</button>}
            </fieldset>
          </>}
          <div className="opc-results" aria-live="polite">
            <p className="pro-mono">Same optics · original → corrected</p>
            {rows.map(([name, def, v0, v1, unit, d, signedVal]) => (
              <div className="opc-row" key={name} title={def}>
                <span>{name}<small>{def}</small></span>
                <strong><em className="is-before">{signedVal ? signed(v0, d) : fmt(v0, d)}</em><b aria-hidden="true">→</b><em className="is-after">{signedVal ? signed(v1, d) : fmt(v1, d)}</em><i>{unit}</i></strong>
              </div>
            ))}
            {result?.model?.diverged && <p className="opc-warn">This simple feedback loop did not converge for these settings, so the best iteration is shown. That is a limit of the teaching algorithm: production OPC uses coupled solvers.</p>}
            {a && (a.pinched + a.bridged > 0) && <p className="opc-warn">{a.pinched + a.bridged} sites pinch or bridge on the corrected wafer.</p>}
          </div>
          {!challenge
            ? <button type="button" className="pro-button pro-primary opc-challenge-start" onClick={startChallenge}><Trophy size={16} /> Challenge: beat the original mask with rules</button>
            : <div className="opc-challenge">
                <p className="pro-mono">Challenge</p>
                <p>Uncorrected <strong>{fmt(b?.rms)} nm</strong> · your best <strong>{fmt(Math.min(...challenge.attempts.map(t => t.rms)))} nm</strong> · model-based <strong>{result?.reference ? `${fmt(result.reference.rms)} nm` : 'computing…'}</strong></p>
                {a && rulesMode && <ul>{diagnose(b, a).map(n => <li key={n}>{n}</li>)}</ul>}
                {challenge.attempts.length > 0 && <ol className="opc-attempts">{challenge.attempts.map((t, i) => <li key={t.key + i} className={t.rms < b.rms ? 'is-better' : 'is-worse'}>{fmt(t.rms)} nm <span>bias {t.params.bias}, serif {t.params.serif}, hammer {t.params.hammerOverhang}/{t.params.hammerLength}/{t.params.hammerExtension}</span></li>)}</ol>}
                <button type="button" className="opc-link" onClick={() => { setChallenge(null); update({ mode: 'model' }); }}>End challenge</button>
              </div>}
        </aside>
      </div>

      {result && <div className="opc-stages" aria-label="Stages of the same clip">
        {[['target', 'Target layout'], ['original', 'Original mask'], ['corrected', 'Corrected mask'], ['image', 'Aerial image'], ['printed', 'Printed contours']].map(([k, l]) => <figure key={k}><OpcStage result={result} kind={k} /><figcaption className="pro-mono">{l}</figcaption></figure>)}
      </div>}
    </div>
  );
}
function range(k) { return { min: OPC_LIMITS[k][0], max: OPC_LIMITS[k][1] }; }

// Publication-card figure: computed synchronously (cards are captured offline). Uses the same model.
export function ShareFigure({ layout = 'wide' }) {
  const r = useMemo(() => {
    const e = opcExperiment({});
    const pack = (img, m, mask, color) => ({ image: null, metrics: { ...m, sites: new Float32Array(m.sites.flatMap(s => [s.x, s.y, s.nx, s.ny, s.epe, 0])) }, contours: Float32Array.from(opcContours(img, e.thr, e.bounds).flat()), mask, color });
    return { e, before: pack(e.imgBefore, e.before, e.target), after: pack(e.imgAfter, e.after, e.corrected) };
  }, []);
  const result = { polys: r.e.polys, bounds: r.e.bounds, target: r.e.target, corrected: r.e.corrected, before: r.before, after: r.after };
  const b = r.e.before, a = r.e.after;
  return (
    <div className={`opc-share is-${layout}`}>
      <div className="opc-share-pair">
        <div><p className="pro-mono" style={{ color: OPC_COLORS.uncorrected }}>Mask drawn like the target</p><OpcStageStatic result={result} side="before" /></div>
        <div><p className="pro-mono" style={{ color: OPC_COLORS.corrected }}>Mask distorted by OPC</p><OpcStageStatic result={result} side="after" /></div>
      </div>
      <p className="opc-share-numbers"><span>RMS edge placement error</span> <em style={{ color: OPC_COLORS.uncorrected }}>{fmt(b.rms)} nm</em> → <em style={{ color: OPC_COLORS.corrected }}>{fmt(a.rms)} nm</em> <span>· same optics, simulated (193 nm, NA 0.93)</span></p>
    </div>
  );
}
// a single static side for the cards: mask + target + its printed contour, line-end zoom
function OpcStageStatic({ result, side }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, w = Math.max(200, cv.parentElement.clientWidth), dpr = 2;
    // tight window on the line ends: dense lines and the isolated line, tips near the top
    const P = Object.fromEntries(result.polys.map(p => [p.id, p])), xs = (id) => P[id].pts.map(q => q[0]), top = Math.max(...P.iso.pts.map(q => q[1]));
    const v = [Math.min(...xs('dense0')) - 70, top - 330, Math.max(...xs('iso')) + 70, top + 70];
    const ww = v[2] - v[0], wh = v[3] - v[1], h = Math.round(w * wh / ww), s = w / ww;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#080b12'; ctx.fillRect(0, 0, w, h);
    const X = (x) => (x - v[0]) * s, Y = (y) => (v[3] - y) * s, sd = result[side], mask = side === 'before' ? result.target : result.corrected;
    ctx.fillStyle = 'rgba(245,247,251,0.16)'; ctx.beginPath();
    for (const q of mask) ctx.rect(X(q[0]) - 0.25, Y(q[3]) - 0.25, (q[2] - q[0]) * s + 0.5, (q[3] - q[1]) * s + 0.5);
    ctx.fill(); ctx.strokeStyle = 'rgba(245,247,251,0.85)'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (const e of outlineOf(mask)) { ctx.moveTo(X(e[0]), Y(e[1])); ctx.lineTo(X(e[2]), Y(e[3])); } ctx.stroke();
    ctx.strokeStyle = OPC_COLORS.target; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    for (const p of result.polys) { ctx.beginPath(); p.pts.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.closePath(); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = side === 'before' ? OPC_COLORS.uncorrected : OPC_COLORS.corrected; ctx.lineWidth = 3; ctx.beginPath();
    const c = sd.contours; for (let k = 0; k < c.length; k += 4) { ctx.moveTo(X(c[k]), Y(c[k + 1])); ctx.lineTo(X(c[k + 2]), Y(c[k + 3])); } ctx.stroke();
  }, [result, side]);
  return <canvas ref={ref} style={{ display: 'block' }} aria-hidden="true" />;
}

export default { Simulation, ShareFigure };
