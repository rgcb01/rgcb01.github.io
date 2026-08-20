import { ExternalLink, FileText, Github } from "lucide-react";

export default function FeaturedGithub({ projects }) {
  return (
    <section className="section section-wide" id="projects">
      <div className="section-heading">
        <p className="eyebrow">Featured Engineering Projects</p>
        <h2>Flagship portfolio work across manufacturing analytics, quality inspection and PLC automation.</h2>
      </div>
      <div className="featured-projects-grid">
        {projects.map((project, index) => (
          <article className="featured-project-card" key={project.title}>
            <div className="featured-media">
              {project.screenshot ? (
                <img src={project.screenshot} alt={project.screenshotAlt} loading="lazy" />
              ) : (
                <div className="project-placeholder" role="img" aria-label={`${project.title} screenshot pending`}>
                  <span>Screenshot pending</span>
                </div>
              )}
            </div>
            <div className="featured-copy">
              <div className="project-showcase-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className={`status ${project.statusClass}`}>{project.status}</span>
              </div>
              <div className="card-topline">
                <h3>{project.title}</h3>
              </div>
              <span className="project-field-label">Problem</span>
              <p className="project-problem">{project.problem}</p>
              <span className="project-field-label">Solution</span>
              <p>{project.solution}</p>
              <span className="project-field-label">Evidence</span>
              <ul className="evidence-list" aria-label={`${project.title} evidence`}>
                {project.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="tag-list">
                {project.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="card-actions">
                <a className="button primary" href={project.github} target="_blank" rel="noopener noreferrer">
                  <Github size={17} />
                  Repository <ExternalLink size={16} />
                </a>
                {project.caseStudy && (
                  <a className="button secondary" href={project.caseStudy}>
                    <FileText size={17} />
                    {project.caseStudyLabel}
                  </a>
                )}
                {project.paper && (
                  <a className="button secondary" href={project.paper} target="_blank" rel="noopener noreferrer">
                    DOI / Paper <ExternalLink size={16} />
                  </a>
                )}
              </div>
              <p className="project-note">{project.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
