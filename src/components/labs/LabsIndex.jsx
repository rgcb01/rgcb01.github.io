import { useState } from 'react';
import { ProfessionalNav, ProfessionalFooter } from '../ProfessionalPortfolio.jsx';
import LabCard from './LabCard.jsx';
import { labDomains, labs } from '../../labs/registry.js';

export default function LabsIndex() {
  const [domain, setDomain] = useState('all');
  const visible = labs.filter(lab => lab.status === 'published' && (domain === 'all' || lab.domains.includes(domain)));
  const counts = Object.fromEntries(labDomains.map(d => [d.id, labs.filter(l => l.status === 'published' && l.domains.includes(d.id)).length]));
  return (
    <div className="pro-site lab-site">
      <a className="pro-skip" href="#labs-content">Skip to content</a>
      <ProfessionalNav />
      <main id="labs-content">
        <section className="pro-width lab-index-hero">
          <p className="pro-eyebrow"><span className="pro-signal" /> INTERACTIVE LABS</p>
          <h1>Interactive Labs<span className="pro-title-dot">.</span></h1>
          <p className="lab-lead">Simulations for learning how things work in optics, semiconductors, mathematics, physics and engineering. Each lab runs one model, and every number on screen comes from it. Each lab also shows its math, cites its sources and states what the model leaves out.</p>
          <ul className="lab-principles">
            <li><strong>One model</strong><span>Figures, readouts and the video all read the same code.</span></li>
            <li><strong>Sourced</strong><span>Equations and constants trace back to cited literature.</span></li>
            <li><strong>Honest limits</strong><span>Every lab lists what its model does not capture.</span></li>
          </ul>
        </section>
        <section className="pro-width lab-index-list" aria-labelledby="labs-list-title">
          <div className="lab-filter" role="group" aria-label="Filter labs by domain">
            <h2 id="labs-list-title" className="pro-mono">Labs · {visible.length}</h2>
            <button type="button" className={domain === 'all' ? 'is-active' : ''} aria-pressed={domain === 'all'} onClick={() => setDomain('all')}>All</button>
            {labDomains.map(d => <button type="button" key={d.id} className={domain === d.id ? 'is-active' : ''} aria-pressed={domain === d.id} onClick={() => setDomain(d.id)} disabled={!counts[d.id]}>{d.label} <span>{counts[d.id]}</span></button>)}
          </div>
          <div className="lab-grid">{visible.map(lab => <LabCard lab={lab} key={lab.slug} />)}</div>
          <p className="lab-index-note">New labs are added over time. Domains without a lab yet are shown greyed out.</p>
        </section>
      </main>
      <ProfessionalFooter />
    </div>
  );
}
