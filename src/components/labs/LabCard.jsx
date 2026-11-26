import { ArrowUpRight } from 'lucide-react';
import { domainLabel, labPath } from '../../labs/registry.js';

export default function LabCard({ lab }) {
  return (
    <article className="lab-card">
      <a className="lab-card-image" href={labPath(lab)} aria-label={`Open ${lab.title}`}>
        <div className="pro-image-bar"><span>LAB / {lab.number}</span><span>{lab.status === 'published' ? 'INTERACTIVE' : 'IN PREPARATION'}</span></div>
        <img src={lab.socialImage} alt="" loading="lazy" width="1200" height="630" />
      </a>
      <div className="lab-card-copy">
        <p className="pro-mono">{lab.domains.map(domainLabel).join(' · ')}</p>
        <h3><a href={labPath(lab)}>{lab.title}</a></h3>
        <p className="lab-card-question">{lab.question}</p>
        <p>{lab.summary}</p>
        <div className="lab-card-meta"><span>{lab.level}</span><span>{lab.readingTime}</span><span>Published {lab.published}</span></div>
        <a className="lab-card-link" href={labPath(lab)}>Open the lab <ArrowUpRight size={15} /></a>
      </div>
    </article>
  );
}
