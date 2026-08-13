import { ExternalLink, FileText, Github } from "lucide-react";

export default function FeaturedGithub({ projects }) {
  return (
    <section className="section" id="projects">
      <div className="section-heading">
        <p className="eyebrow">Featured Engineering Projects</p>
        <h2>Flagship portfolio work across manufacturing analytics, quality inspection and PLC automation.</h2>
      </div>
      <div className="featured-projects-grid">
        {projects.map((project) => (
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
              <div className="card-topline">
                <h3>{project.title}</h3>
                <span className={`status ${project.statusClass}`}>{project.status}</span>
              </div>
              <p className="project-problem">{project.problem}</p>
              <p>{project.solution}</p>
              <div className="tag-list">
                {project.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <ul className="evidence-list" aria-label={`${project.title} evidence`}>
                {project.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="card-actions">
                <a className="button primary" href={project.github} target="_blank" rel="noopener noreferrer">
                  <Github size={17} />
                  Repository <ExternalLink size={16} />
                </a>
                {project.caseStudy && (
                  <a className="button secondary" href={project.caseStudy} target="_blank" rel="noopener noreferrer">
                    <FileText size={17} />
                    {project.caseStudyLabel} <ExternalLink size={16} />
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
