import { ExternalLink, Github } from "lucide-react";

export default function FeaturedGithub({ project }) {
  return (
    <section className="section compact-section" id="featured-github">
      <div className="featured-github">
        <div>
          <p className="eyebrow">Featured GitHub Project</p>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
          <p className="project-note">{project.note}</p>
        </div>
        <div className="repo-panel">
          <Github size={24} />
          <span className="status published">{project.status}</span>
          <strong>{project.repo}</strong>
          <a href={project.url} target="_blank" rel="noreferrer">
            View Repository <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
