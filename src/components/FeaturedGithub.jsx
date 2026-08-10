import { ExternalLink, Github } from "lucide-react";

export default function FeaturedGithub({ project }) {
  return (
    <section className="section compact-section" id="featured-project">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Featured / Published</p>
        <h2>Evidence-based portfolio project with real engineering workflow.</h2>
      </div>
      <article className="featured-project-card">
        <div className="featured-media">
          <img src={project.screenshot} alt={project.screenshotAlt} loading="lazy" />
        </div>
        <div className="featured-copy">
          <div className="card-topline">
            <h3>{project.title}</h3>
            <span className="status published">{project.status}</span>
          </div>
          <p>{project.description}</p>
          <div className="tag-list">
            {project.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="metric-list" aria-label={`${project.title} key metrics`}>
            {project.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>
          <div className="card-actions">
            <a className="button primary" href={project.github} target="_blank" rel="noopener noreferrer">
              <Github size={17} />
              View Repository <ExternalLink size={16} />
            </a>
            <a className="button secondary" href={project.caseStudy} target="_blank" rel="noopener noreferrer">
              View Screenshots <ExternalLink size={16} />
            </a>
          </div>
          <p className="project-note">{project.note}</p>
        </div>
      </article>
    </section>
  );
}
