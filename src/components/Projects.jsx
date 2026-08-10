import { ExternalLink } from "lucide-react";

export default function Projects({ projects }) {
  return (
    <section className="section" id="projects">
      <div className="section-heading">
        <p className="eyebrow">Featured Projects</p>
        <h2>Portfolio projects built around manufacturing, quality and automation workflows.</h2>
      </div>
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.title}>
            <div className="card-topline">
              <h3>{project.title}</h3>
              <span className={`status ${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span>
            </div>
            <p>{project.description}</p>
            <div className="tag-list">
              {project.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="card-actions">
              {project.github ? (
                <a href={project.github} target="_blank" rel="noreferrer">
                  GitHub <ExternalLink size={16} />
                </a>
              ) : (
                <span className="disabled-link">GitHub coming soon</span>
              )}
              <span className="disabled-link">Case study coming soon</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
