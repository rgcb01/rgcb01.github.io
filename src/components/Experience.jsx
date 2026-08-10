export default function Experience({ experiences }) {
  return (
    <section className="section" id="experience">
      <div className="section-heading">
        <p className="eyebrow">Experience</p>
        <h2>Manufacturing, vision systems and cross-functional engineering support.</h2>
      </div>
      <div className="timeline">
        {experiences.map((item) => (
          <article className="experience-card" key={`${item.company}-${item.role}`}>
            <div>
              <p className="company">{item.company}</p>
              <h3>{item.role}</h3>
              <p className="meta">
                {item.dates} | {item.location}
              </p>
            </div>
            <ul>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
