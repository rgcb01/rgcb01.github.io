export default function Skills({ skillGroups }) {
  return (
    <section className="section section-wide" id="skills">
      <div className="section-heading">
        <p className="eyebrow">Skills</p>
        <h2>Tools and concepts aligned with entry-level engineering roles.</h2>
      </div>
      <div className="skills-grid">
        {skillGroups.map((group) => (
          <article className="skill-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul className="skill-list">
              {group.skills.map((skill) => (
                <li key={skill}>
                  {skill}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
