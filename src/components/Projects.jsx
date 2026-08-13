export default function Projects({ upcomingProjects }) {
  return (
    <section className="section compact-section" id="engineering-activity">
      <div className="section-heading">
        <p className="eyebrow">Next Engineering Direction</p>
        <h2>Portfolio progression toward test, validation and semiconductor manufacturing data.</h2>
      </div>
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
    </section>
  );
}
