import { ArrowUpRight } from 'lucide-react';
import { publishedLabs, labPath, domainLabel } from '../../labs/registry.js';

// Home page section. Lists the newest published labs; the full list lives at /labs.
export default function LabsTeaser({ number, SectionHeading }) {
  const latest = publishedLabs.slice(-3).reverse();
  return (
    <section className="pro-section pro-width" id="labs">
      <SectionHeading number={number} label="INTERACTIVE LABS" title="Physics you can move.">Educational simulations of optics, semiconductors, mathematics, physics and engineering, each with its math, sources and limitations.</SectionHeading>
      <div className="lab-teaser">
        {latest.map(lab => (
          <a className="lab-teaser-item" href={labPath(lab)} key={lab.slug}>
            <img src={lab.socialImage} alt="" loading="lazy" width="1200" height="630" />
            <div>
              <span className="pro-mono">LAB {lab.number} · {lab.domains.map(domainLabel).join(' · ')}</span>
              <h3>{lab.title}</h3>
              <p>{lab.question}</p>
              <span className="lab-card-link">Open the lab <ArrowUpRight size={15} /></span>
            </div>
          </a>
        ))}
        <a className="lab-teaser-all" href="/labs"><span className="pro-mono">ALL LABS</span><strong>Browse Interactive Labs</strong><ArrowUpRight size={20} /></a>
      </div>
    </section>
  );
}
