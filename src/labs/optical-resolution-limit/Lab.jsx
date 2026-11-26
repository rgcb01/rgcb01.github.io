// Interactive UI for The Optical Resolution Limit. Every number comes from ./model.js.
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link2, RotateCcw } from 'lucide-react';
import {
  ORL_CHAPTERS, ORL_DEFAULTS, ORL_ILLUMINATIONS, ORL_LIMITS, ORL_PRESETS,
  orlAiry, orlAnalyze, orlNormalize, orlTwoPoint,
} from './model.js';
import { AerialImagePlot, OpticalTrain, PitchRuler, PupilDiagram, TwoPointPlot } from './figures.jsx';

const QUERY = { wavelength: 'lambda', na: 'na', pitch: 'pitch', illumination: 'illum', sigma: 'sigma' };
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '–');
const nm = v => `${v >= 100 ? Math.round(v) : v.toFixed(1)} nm`;

// Log-scale slider helpers (pitch and wavelength span decades)
const toLog = (v, [a, b]) => Math.round(((Math.log10(v) - Math.log10(a)) / (Math.log10(b) - Math.log10(a))) * 1000);
const fromLog = (s, [a, b]) => 10 ** (Math.log10(a) + (s / 1000) * (Math.log10(b) - Math.log10(a)));
const niceRound = v => (v >= 100 ? Math.round(v) : v >= 20 ? Math.round(v * 2) / 2 : Math.round(v * 10) / 10);

export function paramsFromSearch(search) {
  const q = new URLSearchParams(search), out = {};
  for (const [key, name] of Object.entries(QUERY)) if (q.has(name)) out[key] = key === 'illumination' ? q.get(name) : Number(q.get(name));
  return orlNormalize(out);
}
function paramsToSearch(p) {
  const q = new URLSearchParams(window.location.search);
  for (const [key, name] of Object.entries(QUERY)) q.set(name, String(key === 'illumination' ? p[key] : +Number(p[key]).toFixed(3)));
  return `?${q.toString()}`;
}

function Slider({ id, label, value, display, min, max, step, onChange, disabled, hint }) {
  return (
    <div className={`lab-control ${disabled ? 'is-disabled' : ''}`}>
      <div className="lab-control-top"><label htmlFor={id}>{label}</label><output htmlFor={id}>{display}</output></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => onChange(Number(e.target.value))} aria-valuetext={display} />
      {hint && <p className="lab-control-hint">{hint}</p>}
    </div>
  );
}

function Readout({ label, value, sub, tone }) {
  return <div className={`lab-readout ${tone ? `is-${tone}` : ''}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}

export function Simulation() {
  const [params, setParams] = useState(() => (typeof window === 'undefined' ? orlNormalize(ORL_DEFAULTS) : paramsFromSearch(window.location.search)));
  const [chapter, setChapter] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sepFactor, setSepFactor] = useState(1);
  const deferred = useDeferredValue(params);
  const analysis = useMemo(() => orlAnalyze(deferred), [deferred]);
  const lim = analysis.limits;

  useEffect(() => {
    const t = setTimeout(() => window.history.replaceState(null, '', `${window.location.pathname}${paramsToSearch(params)}${window.location.hash}`), 250);
    return () => clearTimeout(t);
  }, [params]);

  const update = patch => { setChapter(null); setParams(p => orlNormalize({ ...p, ...patch })); };
  const preset = ORL_PRESETS.find(pr => pr.wavelength === params.wavelength && Math.abs(pr.na - params.na) < 1e-9);
  const activeChapter = ORL_CHAPTERS.find(c => c.id === chapter);

  const two = useMemo(() => {
    const r = orlTwoPoint(deferred, sepFactor * (0.61 * deferred.wavelength) / deferred.na);
    return { ...r, separation: sepFactor * r.rayleigh, airy: v => orlAiry(v, deferred.wavelength, deferred.na) };
  }, [deferred, sepFactor]);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}${paramsToSearch(params)}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Copy this link', url); }
  };

  const orders = analysis.captured.anySource;
  const tone = analysis.band.tone;
  const immersionNote = params.na > 1 ? 'NA above 1 needs an immersion liquid between lens and wafer.' : null;

  return (
    <div className="lab-sim">
      <div className="lab-sim-bar">
        <div className="lab-chips" role="group" aria-label="Guided tour">
          <span className="pro-mono">Guided tour</span>
          {ORL_CHAPTERS.map((c, i) => <button key={c.id} type="button" className={chapter === c.id ? 'is-active' : ''} aria-pressed={chapter === c.id} onClick={() => { setParams(orlNormalize(c.params)); setChapter(c.id); }}>{i + 1} · {c.short}</button>)}
        </div>
        <div className="lab-sim-actions">
          <button type="button" onClick={() => { setParams(orlNormalize(ORL_DEFAULTS)); setChapter(null); }}><RotateCcw size={14} /> Reset</button>
          <button type="button" onClick={copyLink}><Link2 size={14} /> {copied ? 'Link copied' : 'Copy link to this setup'}</button>
        </div>
      </div>
      <p className="lab-tour-tip" aria-live="polite">{activeChapter ? <><strong>{activeChapter.tip[0]}</strong> {activeChapter.tip[1]}</> : 'Move the sliders, or step through the guided tour. The URL keeps your settings, so you can share this exact setup.'}</p>

      <div className="lab-sim-grid">
        <aside className="lab-panel lab-controls" aria-label="Simulation controls">
          <fieldset>
            <legend className="pro-mono">Scanner presets</legend>
            <div className="lab-presets">{ORL_PRESETS.map(pr => <button key={pr.id} type="button" title={pr.note} className={preset?.id === pr.id ? 'is-active' : ''} aria-pressed={preset?.id === pr.id} onClick={() => update({ wavelength: pr.wavelength, na: pr.na })}><strong>{pr.label}</strong><span>{pr.wavelength} nm · NA {pr.na}</span></button>)}</div>
          </fieldset>
          <Slider id="orl-pitch" label="Pitch p (line + space)" value={toLog(params.pitch, ORL_LIMITS.pitch)} display={nm(params.pitch)} min={0} max={1000} step={1} onChange={s => update({ pitch: niceRound(fromLog(s, ORL_LIMITS.pitch)) })} />
          <Slider id="orl-wavelength" label="Wavelength λ" value={toLog(params.wavelength, ORL_LIMITS.wavelength)} display={nm(params.wavelength)} min={0} max={1000} step={1} onChange={s => update({ wavelength: niceRound(fromLog(s, ORL_LIMITS.wavelength)) })} />
          <Slider id="orl-na" label="Numerical aperture NA" value={params.na} display={fmt(params.na)} min={ORL_LIMITS.na[0]} max={ORL_LIMITS.na[1]} step={0.01} onChange={v => update({ na: v })} hint={immersionNote} />
          <fieldset>
            <legend className="pro-mono">Illumination</legend>
            <div className="lab-segment">{ORL_ILLUMINATIONS.map(il => <button key={il.id} type="button" title={il.hint} className={params.illumination === il.id ? 'is-active' : ''} aria-pressed={params.illumination === il.id} onClick={() => update({ illumination: il.id, sigma: il.id === 'coherent' ? params.sigma : params.sigma || 0.6 })}>{il.label}</button>)}</div>
            <p className="lab-control-hint">{ORL_ILLUMINATIONS.find(il => il.id === params.illumination)?.hint}</p>
          </fieldset>
          <Slider id="orl-sigma" label={params.illumination === 'dipole' ? 'Pole position σ' : 'Partial coherence σ'} value={params.sigma} display={fmt(params.sigma)} min={0} max={params.illumination === 'dipole' ? 0.9 : 1} step={0.01} onChange={v => update({ sigma: v })} disabled={params.illumination === 'coherent'} />
        </aside>

        <div className="lab-figures-col">
          <div className="lab-figures">
            <figure className="lab-panel lab-fig-train">
              <figcaption><span className="pro-mono">Fig. 1 · Side view</span> Diffraction orders leaving the mask for one illumination direction. Orders outside the aperture stop are blocked (×).</figcaption>
              <OpticalTrain analysis={analysis} />
            </figure>
            <figure className="lab-panel lab-fig-pupil">
              <figcaption><span className="pro-mono">Fig. 2 · Pupil view</span> Each order is a copy of the light source, shifted by mλ/p. Only light inside the NA disk reaches the wafer.</figcaption>
              <PupilDiagram analysis={analysis} />
            </figure>
          </div>
          <div className="lab-readouts" aria-live="polite">
            <Readout label="Verdict" value={analysis.band.label} sub={`orders reaching the wafer: ${orders.map(m => (m > 0 ? `+${m}` : m < 0 ? `−${-m}` : '0')).join(' ')}`} tone={tone} />
            <Readout label="Image contrast" value={fmt(analysis.contrast)} sub="(Imax − Imin) / (Imax + Imin)" tone={tone} />
            <Readout label="NILS at edge" value={fmt(analysis.nils, 1)} sub="normalized image log-slope" />
            <Readout label="k₁ (half-pitch)" value={fmt(lim.k1)} sub={lim.k1 < 0.25 ? 'below the 0.25 floor' : 'p/2 · NA/λ'} tone={lim.k1 < 0.25 ? 'bad' : undefined} />
            <Readout label="λ/p vs NA" value={`${fmt(params.wavelength / params.pitch)} ${params.wavelength / params.pitch <= params.na ? '≤' : '>'} ${fmt(params.na)}`} sub={params.wavelength / params.pitch <= params.na ? 'first orders fit on axis' : 'first orders miss on axis'} />
            <Readout label="Limits for this lens" value={`${nm(lim.absolutePitch)}`} sub={`λ/2NA · with this light ${nm(lim.currentPitch)} · coherent ${nm(lim.coherentPitch)}`} />
          </div>
        </div>
      </div>

      <div className="lab-sim-lower">
        <figure className="lab-panel">
          <figcaption><span className="pro-mono">Fig. 3 · Aerial image</span> Light intensity just above the resist, over two periods. Dashed lines mark I<sub>max</sub> and I<sub>min</sub>.</figcaption>
          <AerialImagePlot analysis={analysis} />
        </figure>
        <figure className="lab-panel">
          <figcaption><span className="pro-mono">Fig. 4 · Pitch ruler</span> Smaller pitches sit to the left. Nothing in the shaded zone can be imaged by this lens.</figcaption>
          <PitchRuler analysis={analysis} />
          <div className="lab-rayleigh">
            <p className="pro-mono">Fig. 5 · Two points (Rayleigh)</p>
            <TwoPointPlot profile={two} />
            <Slider id="orl-sep" label="Separation" value={sepFactor} display={`${fmt(sepFactor)} × R = ${nm(two.separation)}`} min={0.3} max={2} step={0.01} onChange={setSepFactor} hint={`R = 0.61 λ/NA = ${nm(two.rayleigh)}. Dip between the peaks: ${Math.round(two.dip * 100)} % (Rayleigh: about 26 %).`} />
          </div>
        </figure>
      </div>
    </div>
  );
}

// Publication-card figure (/labs/<slug>/card?format=...): the same lens and pitch under on-axis and tilted light.
// Sizes are in CSS pixels at the card's native size, so text never rescales.
const SHARE_SIZES = {
  og: { pupil: 190, w: 0, h: 0 },
  wide: { pupil: 220, w: 560, h: 170 },
  tall: { pupil: 250, w: 640, h: 200 },
};
export function ShareFigure({ layout = 'wide' }) {
  const states = [ORL_CHAPTERS[3], ORL_CHAPTERS[4]];
  const size = SHARE_SIZES[layout] || SHARE_SIZES.wide;
  const p0 = states[0].params;
  return (
    <div className={`lab-share-figure is-${layout}`}>
      <p className="lab-share-caption pro-mono">Same lens · same pitch: {p0.wavelength} nm · NA {p0.na} · p = {p0.pitch} nm</p>
      <div className="lab-share-states">
        {states.map((ch, i) => {
          const a = orlAnalyze(ch.params);
          return (
            <div className={`lab-share-state is-${a.band.tone}`} key={ch.id}>
              <p className="pro-mono">{i === 0 ? 'On-axis light' : 'Tilted (dipole) light'}</p>
              <div className="lab-share-row">
                <div style={{ width: size.pupil }}><PupilDiagram analysis={a} id={`share-${ch.id}`} size={size.pupil} compact /></div>
                {size.w > 0 && <div style={{ width: size.w }}><AerialImagePlot analysis={a} width={size.w} height={size.h} compact /></div>}
              </div>
              <p className="lab-share-verdict">{a.contrast >= 0.2 ? `Lines print · contrast ${a.contrast.toFixed(2)}` : 'No image · only the 0th order passes'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default { Simulation, ShareFigure };
