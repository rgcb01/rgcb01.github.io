import { ExternalLink, Github, TrendingUp } from "lucide-react";

export default function Projects({ upcomingProjects, githubActivity }) {
  return (
    <section className="section compact-section" id="engineering-activity">
      <div className="section-heading">
        <p className="eyebrow">Next Engineering Direction</p>
        <h2>Portfolio progression toward test, validation and semiconductor manufacturing data.</h2>
      </div>
      <div className="engineering-projects-layout">
        <div className="upcoming-panel">
          <h3>Planned / Next</h3>
          <div className="upcoming-list">
            {upcomingProjects.map((project) => (
              <article className="upcoming-item" key={project.title}>
                <div className="card-topline">
                  <strong>{project.title}</strong>
                  <span className="status next">{project.status}</span>
                </div>
                <p>{project.focus}</p>
                <div className="mini-tag-list">
                  {project.tags.map((tag) => (
                    <span className="mini-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <article className="repo-panel">
          <TrendingUp size={24} />
          <h3>{githubActivity.title}</h3>
          <p>{githubActivity.description}</p>
          <div className="card-actions">
            {githubActivity.links.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <a
                  href={link.href}
                  key={link.label}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  <Github size={16} />
                  {link.label} {external && <ExternalLink size={15} />}
                </a>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
