// Interactive UI for Lab 003 (sub-resolution assist features). Every number comes from ./model.js, run in a worker.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, RotateCcw, Trophy } from 'lucide-react';
import { SRAF_DEFAULTS, SRAF_DESIGNS, SRAF_LIMITS, srafAnalyze, srafMask, srafNormalize, srafStateAt } from './model.js';
import { SRAF_COLORS, SrafProfile, SrafSpectrum, SrafStrip, SrafWindowChart } from './figures.jsx';
import PUBLISHED from './published.json';

const Q = { wavelength: 'lambda', na: 'na', illumination: 'illum', sigmaIn: 'sin', sigmaOut: 'sout', cd: 'cd', bars: 'bars', barWidth: 'bw', barSpace: 'bs', barPitch: 'bp', defocus: 'focus', dose: 'dose' };
const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const pct = (v) => (Number.isFinite(v) ? `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(1)} %` : '–');
const VERDICT = { safe: ['SAFE', 'is-good', 'Every assist stays at least 10 % above the printing threshold across the whole CD window.'], marginal: ['MARGINAL', 'is-warn', 'Nothing prints, but an assist comes within 10 % of the threshold somewhere in the CD window.'], prints: ['PRINTS', 'is-bad', 'An assist prints inside the CD window: it would become a defect.'], none: ['NO ASSISTS', 'is-neutral', 'The bare isolated line.'], nowindow: ['NO WINDOW', 'is-warn', 'No dose keeps the line within ±10 % at 5 % EL at any focus, so assist printability cannot be judged.'] };

export const SRAF_CHAPTERS = [
  { id: 'isolated', short: 'The isolated feature', tip: 'With no neighbours, the isolated line loses its CD quickly through focus. The dashed blue outline is the window of dense lines at 200 nm pitch.', params: { bars: 0, defocus: 0, dose: null }, ui: { dense: true } },
  { id: 'helpers', short: 'Invisible helpers', tip: 'Two 30 nm assist bars per side darken the image a little, but their dips stay above the threshold, so they never print.', params: { ...SRAF_DESIGNS.recommended, defocus: 0, dose: null }, ui: { dense: false } },
  { id: 'window', short: 'A wider window', tip: 'Same line, same optics, own dose-to-size. The green defect-free window is wider in focus than the orange one without assists.', params: { ...SRAF_DESIGNS.recommended, defocus: 150, dose: null }, ui: { dense: false } },
  { id: 'defects', short: 'Helpers become defects', tip: '60 nm bars give a bigger CD-only window, but the hatched area is where they print. The defect-free window collapses.', params: { ...SRAF_DESIGNS.oversized, defocus: 0, dose: null }, ui: { dense: false } },
];

function readUrl() {
  const q = new URLSearchParams(window.location.search), p = {};
  for (const [k, n] of Object.entries(Q)) if (q.has(n)) p[k] = k === 'illumination' ? q.get(n) : k === 'dose' && q.get(n) === 'auto' ? null : Number(q.get(n));
  return { p: srafNormalize(p), advanced: q.get('adv') === '1', chapter: q.get('step') };
}
function writeUrl(p, advanced, chapter) {
  const q = new URLSearchParams();
  for (const [k, n] of Object.entries(Q)) { const v = p[k]; if (v === SRAF_DEFAULTS[k] || (k === 'dose' && v == null)) continue; q.set(n, k === 'illumination' ? v : +Number(v).toFixed(4)); }
  if (advanced) q.set('adv', '1'); if (chapter) q.set('step', chapter);
  const s = q.toString(); window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}${window.location.hash}`);
}
function useNarrow() {
  const q = '(max-width: 640px)', [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q), f = () => setN(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return n;
}
function Slider({ id, label, value, k, step, display, onChange, hint }) {
  const [min, max] = SRAF_LIMITS[k];
  return (
    <div className="lab-control">
      <div className="lab-control-top"><label htmlFor={id}>{label}</label><output htmlFor={id}>{display}</output></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={display} />
      {hint && <p className="lab-control-hint">{hint}</p>}
    </div>
  );
}
const defaultOptics = (p) => ['wavelength', 'na', 'illumination', 'sigmaIn', 'sigmaOut', 'cd'].every(k => p[k] === SRAF_DEFAULTS[k]);

// why a challenge attempt scores what it scores, from the computed windows
function explain(r) {
  const d = r.design, b = r.base, p = r.params, free = d.windows.defectFree.dof, base = b.windows.defectFree.dof;
  if (!p.bars) return ['No assists: this is the baseline to beat.'];
  const notes = [];
  if (d.verdict === 'prints') {
    const w = d.windows.cdOnly, bad = d.rows.filter(row => row.ok && row.z >= w.z0 && row.z <= w.z1 && row.Eprint > w.e0).sort((x, y) => y.Eprint - x.Eprint)[0];
    notes.push(`The assists print${bad ? ` (worst at ${fmt(bad.z)} nm focus, ${fmt(bad.onsetX)} nm from the line)` : ''} at the low-dose edge of the CD window. Narrow them or move them away.`);
  } else if (d.verdict === 'nowindow') notes.push('There is no CD window at 5 % EL with these optics, so the assists cannot be judged. Reset the optics or the line width.');
  else if (d.verdict === 'marginal') notes.push(`Nothing prints, but the margin is only ${pct(d.marginCdWindow)}: too close to the threshold for comfort.`);
  if (free > base + 1) notes.push(`Defect-free DOF ${fmt(free)} nm against ${fmt(base)} nm without assists.`);
  else if (free > 0) notes.push(`These assists do not widen the window (${fmt(free)} versus ${fmt(base)} nm). Try another spacing: the bars help when they sit roughly one dense pitch from the line.`);
  return notes;
}

export function Simulation() {
  const init = useMemo(() => (typeof window === 'undefined' ? { p: srafNormalize({}) } : readUrl()), []);
  const [params, setParams] = useState(init.p);
  const [advanced, setAdvanced] = useState(init.advanced ?? false);
  const [chapter, setChapter] = useState(init.chapter ?? null);
  const [dense, setDense] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [copied, setCopied] = useState(false);
  const worker = useRef(null), seq = useRef(0), running = useRef(false), pending = useRef(null), narrow = useNarrow(), fw = narrow ? 400 : 720;

  useEffect(() => {
    const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    w.onmessage = (e) => {
      const { id, result: r, progress, error: err } = e.data;
      if (r || err) { running.current = false; const next = pending.current; pending.current = null; if (next) send(next); }   // worker free: run only the latest setup
      if (id !== seq.current) return; if (progress) setBusy(progress); if (err) { setError(err); setBusy(null); } if (r) { setResult(r); setBusy(null); setError(null); }
    };
    worker.current = w; return () => w.terminate();
  }, []);
  // one analysis at a time; while it runs, keep only the newest request (intermediate setups are dropped, not queued)
  const send = (msg) => { if (running.current) { pending.current = msg; return; } running.current = true; worker.current?.postMessage(msg); };
  useEffect(() => { const id = ++seq.current, t = setTimeout(() => send({ id, params, reference: dense }), 90); return () => clearTimeout(t); }, [params, dense]);
  useEffect(() => { const t = setTimeout(() => writeUrl(params, advanced, chapter), 250); return () => clearTimeout(t); }, [params, advanced, chapter]);
  useEffect(() => { const c = SRAF_CHAPTERS.find(x => x.id === init.chapter); if (c) setDense(!!c.ui.dense); }, [init]);
  useEffect(() => {
    if (!challenge || !result || !defaultOptics(result.params)) return;
    const p = result.params, key = [p.bars, p.barWidth, p.barSpace, p.barPitch].join(','), d = result.design;
    setChallenge(c => (c.attempts[0]?.key === key ? c : { ...c, attempts: [{ key, p: { ...p }, safe: d.windows.safe.dof, free: d.windows.defectFree.dof, verdict: d.verdict }, ...c.attempts].slice(0, 6) }));
  }, [result, challenge]);

  const update = (patch) => { setChapter(null); setParams(p => srafNormalize({ ...p, ...patch })); };
  const goChapter = (c) => { setChapter(c.id); setDense(!!c.ui.dense); setParams(p => srafNormalize({ ...p, ...c.params })); };
  const startChallenge = () => { setChapter(null); setDense(false); setChallenge({ attempts: [] }); setParams(srafNormalize({ bars: 0 })); };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Copy this link', window.location.href); } };

  const ch = SRAF_CHAPTERS.find(c => c.id === chapter), d = result?.design, b = result?.base, v = d ? VERDICT[d.verdict] : null, ref = PUBLISHED.challenge.bestSafe;
  const best = challenge?.attempts.filter(a => a.verdict === 'safe').reduce((m, a) => Math.max(m, a.safe), 0) ?? 0;
  return (
    <div className="lab-sim sraf-sim">
      <div className="lab-sim-bar">
        <div className="lab-chips" role="group" aria-label="Guided tour"><span className="pro-mono">Guided tour</span>
          {SRAF_CHAPTERS.map((c, i) => <button key={c.id} type="button" className={chapter === c.id ? 'is-active' : ''} aria-pressed={chapter === c.id} onClick={() => goChapter(c)}>{i + 1} · {c.short}</button>)}
        </div>
        <div className="lab-sim-actions">
          <button type="button" onClick={() => { setParams(srafNormalize({})); setChapter(null); setChallenge(null); setDense(false); }}><RotateCcw size={14} /> Reset</button>
          <button type="button" onClick={copyLink}><Link2 size={14} /> {copied ? 'Link copied' : 'Copy link to this setup'}</button>
        </div>
      </div>
      <p className="lab-tour-tip" aria-live="polite">{ch ? <><strong>{ch.short}.</strong> {ch.tip}</> : challenge ? <><strong>Challenge.</strong> Maximise the defect-free depth of focus at 5 % EL. Keep every assist SAFE (at least 10 % above the threshold) across the CD window.</> : 'Change the assist bars and watch three things together: the profile, the wafer and the focus-exposure window. The URL keeps your setup.'}</p>

      <div className="sraf-main">
        <div className="sraf-figs">
          <figure className="lab-panel sraf-fig-window">
            <figcaption><span className="pro-mono">Focus-exposure window</span> Green: defect-free window with these assists. Hatched red: CD in spec, but an assist prints. Orange dashed: the same line without assists. White box: the 5 % EL rectangle that sets the DOF.</figcaption>
            {result ? <SrafWindowChart result={result} showDense={dense} width={fw} height={narrow ? 340 : 380} /> : <div className="lab-loading" role="status">{busy || 'Loading…'}</div>}
            <label className="opc-gain"><input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} /> Show dense lines (200 nm pitch) for comparison</label>
          </figure>
          {result && <figure className="lab-panel sraf-fig-cross">
            <figcaption><span className="pro-mono">At focus {fmt(params.defocus)} nm · dose {fmt(result.dose, 3)}</span> Mask, wafer and the intensity between them. Purple: assist bars. Red: anything that prints besides the line.</figcaption>
            <SrafStrip result={result} kind="mask" width={fw} />
            <SrafProfile result={result} width={fw} height={narrow ? 220 : 260} />
            <SrafStrip result={result} kind="wafer" width={fw} />
          </figure>}
          {result && advanced && <figure className="lab-panel"><figcaption><span className="pro-mono">Diffraction spectrum</span> |M(f)|² with assists (green) and without (orange dashed). Assists add light inside the purple band, where annular illumination images pairs of beams that stay in phase through focus.</figcaption><SrafSpectrum result={result} width={fw} /></figure>}
          {busy && result && <p className="opc-busy" role="status">{busy}</p>}
          {error && <p className="opc-busy is-error" role="alert">{error}</p>}
        </div>

        <aside className="lab-panel opc-side" aria-label="Controls and results">
          <div className="lab-segment opc-level" role="group" aria-label="Interaction level">
            <button type="button" className={!advanced ? 'is-active' : ''} aria-pressed={!advanced} onClick={() => { setAdvanced(false); update({ wavelength: SRAF_DEFAULTS.wavelength, na: SRAF_DEFAULTS.na, illumination: SRAF_DEFAULTS.illumination, sigmaIn: SRAF_DEFAULTS.sigmaIn, sigmaOut: SRAF_DEFAULTS.sigmaOut, cd: SRAF_DEFAULTS.cd, dose: null, barPitch: SRAF_DEFAULTS.barPitch }); }}>Basic</button>
            <button type="button" className={advanced ? 'is-active' : ''} aria-pressed={advanced} onClick={() => setAdvanced(true)}>Advanced</button>
          </div>
          {d && <div className={`sraf-verdict ${v[1]}`} role="status"><strong>{v[0]}</strong><span>{v[2]}</span>{d.verdict !== 'none' && <em>Worst assist margin in the CD window: {pct(d.marginCdWindow)}</em>}</div>}
          {d && <div className="opc-results">
            <div className="opc-row"><span>Defect-free DOF<small>Longest focus range with one 5 % EL dose interval in spec and nothing else printing</small></span><strong><em className="is-before">{fmt(b.windows.defectFree.dof)}</em><b aria-hidden="true">→</b><em className={params.bars ? (d.verdict === 'prints' ? 'is-bad' : 'is-after') : 'is-before'}>{fmt(d.windows.defectFree.dof)}</em><i> nm</i></strong></div>
            <div className="opc-row"><span>CD-only DOF<small>Same, ignoring unwanted printing</small></span><strong><em className="is-before">{fmt(b.windows.cdOnly.dof)}</em><b aria-hidden="true">→</b><em>{fmt(d.windows.cdOnly.dof)}</em><i> nm</i></strong></div>
            <div className="opc-row"><span>EL at best focus<small>(E_hi − E_lo) / E_mid for CD ±10 %</small></span><strong><em>{fmt(d.elBestFocus * 100, 1)}</em><i> %</i></strong></div>
            <div className="opc-row"><span>NILS at best focus<small>Aerial image, at the target edge</small></span><strong><em className="is-before">{fmt(b.nilsAerial, 2)}</em><b aria-hidden="true">→</b><em>{fmt(d.nilsAerial, 2)}</em></strong></div>
            <div className="opc-row"><span>CD here<small>At this focus and dose · EPE per edge</small></span><strong><em>{result.state.cd ? fmt(result.state.cd, 1) : 'no line'}</em><i> nm</i>{result.state.epe != null && <em className="sraf-epe"> {result.state.epe >= 0 ? '+' : '−'}{fmt(Math.abs(result.state.epe), 1)}</em>}</strong></div>
            <p className="lab-small">Left values (orange): the same line without assists, each at its own dose-to-size. Dose is in units of the dose that clears an open area; threshold t = 1/dose.</p>
          </div>}
          <fieldset><legend className="pro-mono">Assist bars</legend>
            <div className="lab-segment sraf-bars" role="group" aria-label="Assist bars per side">{[0, 1, 2, 3].map(n => <button key={n} type="button" className={params.bars === n ? 'is-active' : ''} aria-pressed={params.bars === n} onClick={() => update({ bars: n })}>{n} per side</button>)}</div>
            <Slider id="sraf-w" label="Assist width" k="barWidth" value={params.barWidth} step={1} display={`${params.barWidth} nm`} onChange={(x) => update({ barWidth: x })} />
            <Slider id="sraf-s" label="Spacing to the line" k="barSpace" value={params.barSpace} step={2} display={`${params.barSpace} nm`} onChange={(x) => update({ barSpace: x })} hint="Edge of the main line to the edge of the first bar." />
            <Slider id="sraf-z" label="Defocus" k="defocus" value={params.defocus} step={10} display={`${params.defocus > 0 ? '+' : ''}${params.defocus} nm`} onChange={(x) => update({ defocus: x })} />
          </fieldset>
          {advanced && <fieldset><legend className="pro-mono">Optics, exposure and layout</legend>
            <Slider id="sraf-dose" label="Dose" k="dose" value={params.dose ?? result?.design.E0 ?? 2.7} step={0.01} display={`${fmt(params.dose ?? result?.design.E0, 3)}${params.dose == null ? ' · dose-to-size' : ''}`} onChange={(x) => update({ dose: x })} hint="Threshold t = 1/dose. Lower dose: lines grow, and assists are more likely to print." />
            {params.dose != null && <button type="button" className="opc-link" onClick={() => update({ dose: null })}>Back to dose-to-size</button>}
            <div className="lab-segment" role="group" aria-label="Illumination">{['annular', 'conventional', 'dipole'].map(il => <button key={il} type="button" className={params.illumination === il ? 'is-active' : ''} aria-pressed={params.illumination === il} onClick={() => update({ illumination: il, ...(il === 'conventional' ? { sigmaOut: 0.6 } : { sigmaIn: 0.55, sigmaOut: 0.85 }) })}>{il}</button>)}</div>
            {params.illumination !== 'conventional' && <Slider id="sraf-sin" label="Inner σ" k="sigmaIn" value={params.sigmaIn} step={0.01} display={fmt(params.sigmaIn, 2)} onChange={(x) => update({ sigmaIn: x })} />}
            <Slider id="sraf-sout" label={params.illumination === 'conventional' ? 'σ' : 'Outer σ'} k="sigmaOut" value={params.sigmaOut} step={0.01} display={fmt(params.sigmaOut, 2)} onChange={(x) => update({ sigmaOut: x })} />
            <Slider id="sraf-lambda" label="Wavelength λ" k="wavelength" value={params.wavelength} step={1} display={`${params.wavelength} nm`} onChange={(x) => update({ wavelength: x })} />
            <Slider id="sraf-na" label="Numerical aperture" k="na" value={params.na} step={0.01} display={fmt(params.na, 2)} onChange={(x) => update({ na: x })} />
            <Slider id="sraf-cd" label="Main line width" k="cd" value={params.cd} step={2} display={`${params.cd} nm`} onChange={(x) => update({ cd: x })} />
            <Slider id="sraf-bp" label="Bar-to-bar pitch" k="barPitch" value={params.barPitch} step={5} display={`${params.barPitch} nm`} onChange={(x) => update({ barPitch: x })} />
          </fieldset>}
          {!challenge
            ? <button type="button" className="pro-button pro-primary opc-challenge-start" onClick={startChallenge}><Trophy size={16} /> Challenge: widen the defect-free window</button>
            : <div className="opc-challenge">
                <p className="pro-mono">Challenge · default optics</p>
                {!defaultOptics(params) && <p className="opc-warn">The challenge uses the default optics (193 nm, NA 0.85, annular 0.55–0.85, 90 nm line). Reset them to score.</p>}
                <p>No assists <strong>{fmt(PUBLISHED.designs.none.dofDefectFree)} nm</strong> · your best SAFE <strong>{best ? `${fmt(best)} nm` : '–'}</strong> · best on our {PUBLISHED.challenge.gridDesigns}-design grid <strong>{fmt(ref.safe)} nm</strong> ({ref.bars} × {ref.barWidth} nm at {ref.barSpace} nm)</p>
                {result && defaultOptics(result.params) && <ul>{explain(result).map(n => <li key={n}>{n}</li>)}</ul>}
                {challenge.attempts.length > 0 && <ol className="opc-attempts">{challenge.attempts.map((t, i) => <li key={t.key + i} className={t.verdict === 'safe' ? 'is-better' : 'is-worse'}><b className={`sraf-tag is-${t.verdict}`}>{VERDICT[t.verdict][0]}</b> {fmt(t.verdict === 'safe' ? t.safe : t.free)} nm <span>{t.p.bars ? `${t.p.bars} × ${t.p.barWidth} nm at ${t.p.barSpace} nm` : 'bare line'}</span></li>)}</ol>}
                <button type="button" className="opc-link" onClick={() => setChallenge(null)}>End challenge</button>
              </div>}
        </aside>
      </div>
    </div>
  );
}

// Publication-card figure: the window with and without safe assists (computed synchronously for the cards).
export function ShareFigure({ layout = 'wide' }) {
  const r = useMemo(() => {
    const run = (design) => { const a = srafAnalyze(design), p = a.params, m = srafMask(p), st = srafStateAt(m, p, 0, a.E0); return { a, p, st }; };
    const rec = run(SRAF_DESIGNS.recommended), none = run(SRAF_DESIGNS.none), over = run(SRAF_DESIGNS.oversized);
    const pack = (x, base) => ({ params: x.p, design: x.a, base: base.a, dense: null, dose: x.a.E0, state: { ...prof(x.st.img), t: x.st.t, printed: x.st.printed, main: x.st.main, unwanted: x.st.unwanted, cd: x.st.cd }, stateBase: { ...prof(base.st.img), t: base.st.t } });
    return { rec: pack(rec, none), over: pack(over, none) };
  }, []);
  const P = PUBLISHED.designs;
  return (
    <div className={`sraf-share is-${layout}`}>
      <div className="sraf-share-pair">
        <div><p className="pro-mono" style={{ color: SRAF_COLORS.good }}>2 × 30 nm assists · SAFE</p><SrafWindowChart result={r.rec} width={layout === 'tall' ? 720 : 560} height={layout === 'og' ? 230 : layout === 'tall' ? 250 : 300} /><p className="sraf-share-num">Defect-free DOF <em style={{ color: SRAF_COLORS.base }}>{P.none.dofDefectFree}</em> → <em style={{ color: SRAF_COLORS.good }}>{P.recommended.dofDefectFree} nm</em></p></div>
        <div><p className="pro-mono" style={{ color: SRAF_COLORS.bad }}>2 × 60 nm assists · PRINTS</p><SrafWindowChart result={r.over} width={layout === 'tall' ? 720 : 560} height={layout === 'og' ? 230 : layout === 'tall' ? 250 : 300} /><p className="sraf-share-num">CD-only {P.oversized.dofCdOnly} nm, defect-free <em style={{ color: SRAF_COLORS.bad }}>{P.oversized.dofDefectFree} nm</em></p></div>
      </div>
    </div>
  );
}
function prof(img) { const xs = [], ys = []; for (let x = -720; x <= 720; x += 4) { xs.push(x); const u = (x + img.L / 2) / img.dx, i = Math.floor(u), f = u - i; ys.push(img.I[((i % img.N) + img.N) % img.N] * (1 - f) + img.I[(((i + 1) % img.N) + img.N) % img.N] * f); } return { xs, ys }; }

export default { Simulation, ShareFigure };
