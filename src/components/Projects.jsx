import { Clock, Wrench } from "lucide-react";

export default function Projects({ currentProject, upcomingProjects }) {
  return (
    <section className="section" id="projects">
      <div className="section-heading">
        <p className="eyebrow">Engineering Projects</p>
        <h2>Current and upcoming portfolio work across vision, data, testing and automation.</h2>
      </div>
      <div className="engineering-projects-layout">
        <article className="project-card current-project-card">
          <div className="card-topline">
            <h3>{currentProject.title}</h3>
            <span className="status in-progress">{currentProject.status}</span>
          </div>
          <p>{currentProject.description}</p>
          <div className="tag-list">
            {currentProject.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="metric-list" aria-label={`${currentProject.title} planned metrics`}>
            {currentProject.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>
          <div className="card-actions">
            <span className="disabled-link">
              <Wrench size={16} /> Repository in progress
            </span>
            <span className="disabled-link">
              <Clock size={16} /> Case study coming soon
            </span>
          </div>
        </article>

        <div className="upcoming-panel">
          <h3>Upcoming</h3>
          <div className="upcoming-list">
            {upcomingProjects.map((project) => (
              <article className="upcoming-item" key={project.title}>
                <strong>{project.title}</strong>
                <p>{project.focus}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
