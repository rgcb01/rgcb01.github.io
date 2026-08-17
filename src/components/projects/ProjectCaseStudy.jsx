import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import ArchitectureDiagram from "./ArchitectureDiagram.jsx";
import CaseStudySection from "./CaseStudySection.jsx";

function ListBlock({ items }) {
  if (!items?.length) return <p className="muted-copy">No additional items.</p>;
  return (
    <ul className="case-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function ProjectCaseStudy({ study }) {
  if (!study) {
    return (
      <main className="case-study-page">
        <section className="section">
          <a className="back-link" href="/">
            <ArrowLeft size={17} /> Back to Portfolio
          </a>
          <h1>Case study not found</h1>
          <p className="hero-description">The project case study you requested is not available.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="case-study-page">
      <section className="section case-hero">
        <a className="back-link" href="/">
          <ArrowLeft size={17} /> Back to Portfolio
        </a>
        <div className="case-hero-grid">
          <div>
            <div className="card-topline">
              <p className="eyebrow">Project Case Study</p>
              <span className={`status ${study.statusClass}`}>{study.status}</span>
            </div>
            <h1>{study.title}</h1>
            <p className="hero-description">{study.summary}</p>
            <div className="card-actions">
              <a className="button primary" href={study.repository} target="_blank" rel="noopener noreferrer">
                <Github size={17} />
                Repository <ExternalLink size={16} />
              </a>
              {study.paper && (
                <a className="button secondary" href={study.paper} target="_blank" rel="noopener noreferrer">
                  DOI / Paper <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
          <div className="case-hero-media">
            <img src={study.image} alt={study.imageAlt} loading="eager" />
          </div>
        </div>
      </section>

      <section className="section case-layout">
        <CaseStudySection title="Engineering Problem">
          <p>{study.problem}</p>
        </CaseStudySection>

        <CaseStudySection title="Objectives">
          <ListBlock items={study.objectives} />
        </CaseStudySection>

        <CaseStudySection title="Architecture / Approach">
          <ArchitectureDiagram items={study.architecture} />
          <ListBlock items={study.approach} />
        </CaseStudySection>

        <CaseStudySection title="Engineering Decisions">
          <ListBlock items={study.decisions} />
        </CaseStudySection>

        <CaseStudySection title="Validation">
          <ListBlock items={study.validation} />
        </CaseStudySection>

        <CaseStudySection title="Results">
          <ListBlock items={study.results} />
        </CaseStudySection>

        <CaseStudySection title="Limitations">
          <ListBlock items={study.limitations} />
        </CaseStudySection>

        <CaseStudySection title="What I Learned">
          <ListBlock items={study.learned} />
        </CaseStudySection>

        <CaseStudySection title="Technologies">
          <div className="tag-list">
            {study.technologies.map((tag) => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        </CaseStudySection>

        <CaseStudySection title="Evidence">
          <div className="case-evidence">
            {study.evidence.map((item) => (
              <a href={item.href} key={item.label} target="_blank" rel="noopener noreferrer">
                {item.label} <ExternalLink size={15} />
              </a>
            ))}
          </div>
          {study.doi && <p className="project-note">DOI: {study.doi}</p>}
        </CaseStudySection>

        {study.nextSteps?.length > 0 && (
          <CaseStudySection title="Next Steps">
            <ListBlock items={study.nextSteps} />
          </CaseStudySection>
        )}
      </section>
    </main>
  );
}
