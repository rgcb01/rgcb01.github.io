import { useEffect, useState } from 'react';
import { domainLabel, labPath, labs, labsIndexMeta, publishedLabs } from '../../labs/registry.js';
import { siteMeta, profile } from '../../data/portfolio.js';
import { CARD_FORMATS } from '../../labs/cards.js';

// Publication assets rendered by the site itself, captured at exact pixel sizes by scripts/labs/publish.mjs.
// /labs/<slug>/card?format=og|linkedin|x|video-linkedin|video-x   and   /labs/card?format=og (index)

function Brand() {
  return <div className="card-brand"><span className="pro-monogram">RC<span>⊞</span></span><span>{profile.name.toUpperCase()}<small>INTERACTIVE LABS</small></span></div>;
}

export default function LabShareCard({ slug, format }) {
  const lab = slug ? labs.find(l => l.slug === slug) : null;
  const spec = CARD_FORMATS[format] || CARD_FORMATS.og;
  const [Figure, setFigure] = useState(null);
  useEffect(() => {
    document.documentElement.classList.add('is-card');
    if (lab) lab.load().then(m => setFigure(() => m.ShareFigure));
    else setFigure(() => () => null);
  }, [lab]);
  useEffect(() => { if (Figure) requestAnimationFrame(() => requestAnimationFrame(() => { window.CARD_READY = true; })); }, [Figure]);

  const url = `${siteMeta.siteUrl.replace('https://', '')}${lab ? labPath(lab) : labsIndexMeta.path}`;
  const kind = format?.startsWith('video') ? 'video' : 'still';
  const style = { width: spec.w, height: spec.h };
  if (!lab) {
    return <div className="pro-site card" data-format={format} style={style}>
      <div className="card-inner card-index">
        <Brand />
        <div><p className="pro-eyebrow"><span className="pro-signal" /> OPTICS · SEMICONDUCTORS · MATHEMATICS · PHYSICS · ENGINEERING</p><h1>Interactive Labs<span className="pro-title-dot">.</span></h1><p className="card-question">{labsIndexMeta.description}</p></div>
        <div className="card-foot"><span>{publishedLabs.length} lab{publishedLabs.length === 1 ? '' : 's'} · math, sources and limitations included</span><strong>{url}</strong></div>
      </div>
    </div>;
  }
  return (
    <div className={`pro-site card card-${format} card-${kind}`} data-format={format} style={style}>
      <div className="card-inner">
        <header className="card-head">
          <Brand />
          <p className="pro-eyebrow"><span className="pro-signal" /> LAB {lab.number} · {lab.domains.map(domainLabel).join(' · ').toUpperCase()}</p>
          <h1>{lab.title}<span className="pro-title-dot">.</span></h1>
          <p className="card-question">{lab.question}</p>
        </header>
        {spec.slot ? <div className="card-slot" data-video-slot style={{ left: spec.slot.x, top: spec.slot.y, width: spec.slot.w, height: spec.slot.h }} /> : <div className="card-figure">{Figure && <Figure layout={format === 'linkedin' ? 'tall' : format === 'og' ? 'og' : 'wide'} />}</div>}
        <footer className="card-foot"><span>{format === 'video-x' ? 'Interactive version, math, sources and model limitations:' : 'Try it, then read the math, sources and model limitations:'}</span><strong>{url}</strong></footer>
      </div>
    </div>
  );
}
