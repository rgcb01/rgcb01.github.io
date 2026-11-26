import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Github, Linkedin, Link2, PlayCircle } from 'lucide-react';
import { ProfessionalNav, ProfessionalFooter } from '../ProfessionalPortfolio.jsx';
import MathTex from './MathTex.jsx';
import { domainLabel, labPath } from '../../labs/registry.js';
import { siteMeta, profile } from '../../data/portfolio.js';

function XLogo({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}

// Inline $…$ math inside authored prose.
function Prose({ text }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return <p>{parts.map((part, i) => (part.startsWith('$') ? <MathTex key={i} tex={part.slice(1, -1)} /> : part))}</p>;
}

function ShareLinks({ lab }) {
  const [copied, setCopied] = useState(false);
  const url = `${siteMeta.siteUrl}${labPath(lab)}`;
  const text = `${lab.title}: ${lab.question}`;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Copy this link', url); } };
  return (
    <div className="lab-share" aria-label="Share this lab">
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Linkedin size={15} /> Share on LinkedIn</a>
      <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><XLogo /> Post on X</a>
      <button type="button" onClick={copy}><Link2 size={15} /> {copied ? 'Link copied' : 'Copy link'}</button>
    </div>
  );
}

// SimuLab explainer: a self-contained page loaded on demand in an iframe (?embed: paper style, ?lang=en).
function Explainer({ lab }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(null);
  const frame = useRef(null);
  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'kapri:height' && Number.isFinite(event.data.h)) setHeight(Math.min(2000, Math.max(300, event.data.h)));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  useEffect(() => { if (open) frame.current?.focus(); }, [open]);
  if (!lab.explainer) return null;
  return (
    <section className="lab-section" id="explainer" aria-labelledby="explainer-title">
      <div className="lab-section-head"><p className="pro-mono">02 / GUIDED EXPLAINER</p><h2 id="explainer-title">{lab.page.explainerTitle}</h2><p>{lab.page.explainerIntro}</p></div>
      {open ? (
        <iframe ref={frame} className="lab-explainer" title={`${lab.title}, guided explainer`} src={`${lab.explainer}?embed&lang=en`} style={height ? { height } : undefined} loading="lazy" />
      ) : (
        <button type="button" className="lab-explainer-poster" onClick={() => setOpen(true)}>
          <img src={lab.socialImage} alt="" loading="lazy" width="1200" height="630" />
          <span><PlayCircle size={22} /> Load the guided explainer <small>{lab.page.explainerSize}, runs offline in the page</small></span>
        </button>
      )}
      <p className="lab-small">Explainer built with SimuLab (MIT, engine and assets by @0xKapri), {lab.page.explainerCredit} Open it <a href={`${lab.explainer}?lang=en`}>full screen</a>.</p>
    </section>
  );
}

export default function LabPage({ lab }) {
  const [mod, setMod] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!lab) return;
    Promise.all([lab.load(), lab.loadContent()]).then(([m, c]) => { setMod(m); setContent(c); }).catch(setError);
  }, [lab]);

  if (!lab) {
    return <div className="pro-site lab-site"><ProfessionalNav /><main className="pro-width lab-index-hero"><a className="lab-back" href="/labs"><ArrowLeft size={16} /> All labs</a><h1>Lab not found</h1><p className="lab-lead">This lab does not exist or has moved.</p></main><ProfessionalFooter /></div>;
  }
  const Simulation = mod?.Simulation;
  return (
    <div className="pro-site lab-site">
      <a className="pro-skip" href="#lab-content">Skip to content</a>
      <ProfessionalNav />
      <main id="lab-content">
        <header className="pro-width lab-hero">
          <nav aria-label="Breadcrumb" className="lab-breadcrumb"><a href="/labs"><ArrowLeft size={15} /> Interactive Labs</a><span>/</span><span>Lab {lab.number}</span></nav>
          <p className="pro-eyebrow"><span className="pro-signal" /> {lab.domains.map(domainLabel).join(' · ').toUpperCase()}</p>
          <h1>{lab.title}<span className="pro-title-dot">.</span></h1>
          <p className="lab-subtitle">{lab.subtitle}</p>
          <p className="lab-question">{lab.question}</p>
          <p className="lab-lead">{lab.summary}</p>
          <div className="lab-meta"><span>{lab.level}</span><span>{lab.readingTime}</span><span>Published {lab.published}</span>{lab.updated !== lab.published && <span>Updated {lab.updated}</span>}<span>By {profile.name}</span></div>
          <ShareLinks lab={lab} />
          <nav className="lab-toc" aria-label="On this page"><a href="#simulation">Simulation</a><a href="#explainer">Guided explainer</a><a href="#math">The math</a><a href="#limitations">Model limitations</a><a href="#references">References</a><a href="#reproduce">Reproduce</a></nav>
        </header>

        <section className="lab-section lab-section-sim" id="simulation" aria-labelledby="sim-title">
          <div className="pro-width">
            <div className="lab-section-head"><p className="pro-mono">01 / INTERACTIVE SIMULATION</p><h2 id="sim-title">{lab.page.simTitle}</h2><p>{lab.page.simIntro}</p></div>
            {error ? <p className="lab-small">The simulation could not load. Reload the page to try again.</p> : Simulation ? <Simulation /> : <div className="lab-loading" role="status">Loading simulation…</div>}
          </div>
        </section>

        <div className="pro-width">
          <Explainer lab={lab} />

          <section className="lab-section" id="math" aria-labelledby="math-title">
            <div className="lab-section-head"><p className="pro-mono">03 / MATHEMATICAL EXPLANATION</p><h2 id="math-title">{lab.page.mathTitle}</h2><p className="lab-bigidea">{lab.bigIdea}</p></div>
            {content ? content.mathSections.map(s => (
              <article className="lab-math" key={s.id} id={`math-${s.id}`}>
                <h3>{s.title}</h3>
                {s.body.map(t => <Prose key={t} text={t} />)}
                {s.equations?.map(e => <MathTex key={e} tex={e} display />)}
                {s.after?.map(t => <Prose key={t} text={t} />)}
                {s.afterEquations?.map(e => <MathTex key={e} tex={e} display />)}
                {s.check && <p className="lab-check"><span className="pro-mono">Hand check</span>{s.check}</p>}
              </article>
            )) : <div className="lab-loading" role="status">Loading…</div>}
          </section>

          <section className="lab-section" id="limitations" aria-labelledby="lim-title">
            <div className="lab-section-head"><p className="pro-mono">04 / MODEL LIMITATIONS</p><h2 id="lim-title">What this model leaves out.</h2><p>Read the numbers as physics teaching values, not process predictions.</p></div>
            <div className="lab-limitations">{content?.limitations.map((l, i) => <article key={l.title}><span className="pro-mono">{String(i + 1).padStart(2, '0')}</span><h3>{l.title}</h3><p>{l.text}</p></article>)}</div>
            {content?.educationalVsIndustrial && <div className="lab-compare-wrap"><table className="lab-compare"><caption className="pro-mono">Educational model versus industrial practice</caption><thead><tr><th scope="col">Aspect</th><th scope="col">This lab</th><th scope="col">Industrial OPC</th></tr></thead><tbody>{content.educationalVsIndustrial.map(r => <tr key={r[0]}><th scope="row">{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>}
          </section>

          <section className="lab-section" id="references" aria-labelledby="ref-title">
            <div className="lab-section-head"><p className="pro-mono">05 / SCIENTIFIC REFERENCES</p><h2 id="ref-title">Sources.</h2></div>
            <ol className="lab-references">{content?.references.map(r => (
              <li key={r.id} id={`ref-${r.id}`}>
                <p><strong>{r.authors}</strong> ({r.year}). <em>{r.title}</em>. {r.source}.{' '}
                  {r.doi ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">doi:{r.doi} <ArrowUpRight size={12} /></a> : r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">Archived copy <ArrowUpRight size={12} /></a> : null}</p>
                <span>{r.use}</span>
              </li>
            ))}</ol>
          </section>

          <section className="lab-section" id="reproduce" aria-labelledby="rep-title">
            <div className="lab-section-head"><p className="pro-mono">06 / REPRODUCE &amp; CITE</p><h2 id="rep-title">Check it yourself.</h2></div>
            <div className="lab-reproduce">
              <div>
                {lab.page.reproduce.map(t => <p key={t}>{t}</p>)}
                <pre><code>{lab.page.checks.join('\n')}</code></pre>
                <a className="lab-card-link" href={lab.source} target="_blank" rel="noopener noreferrer"><Github size={15} /> Source on GitHub <ArrowUpRight size={14} /></a>
              </div>
              <div>
                <p className="pro-mono">Cite as</p>
                <p className="lab-cite">{profile.name} ({lab.published.slice(0, 4)}). <em>{lab.title}: {lab.subtitle}</em>. Interactive Labs. {siteMeta.siteUrl}{labPath(lab)}</p>
                <p className="lab-small">Independent educational work built from public textbook physics. It does not represent my employer, and it uses no proprietary data.</p>
              </div>
            </div>
          </section>
          <a className="lab-back" href="/labs"><ArrowLeft size={16} /> All Interactive Labs</a>
        </div>
      </main>
      <ProfessionalFooter />
    </div>
  );
}
