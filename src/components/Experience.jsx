export default function Experience({ experiences }) {
  const getYear = (dates) => dates?.match(/\d{4}/)?.[0] || "";

  return (
    <section className="section section-standard" id="experience">
      <div className="section-heading">
        <p className="eyebrow">Experience</p>
        <h2>Manufacturing, vision systems and cross-functional engineering support.</h2>
      </div>
      <div className="timeline">
        {experiences.map((item) => (
          <article className="experience-row" key={`${item.company}-${item.role}`}>
            <div className="experience-date" aria-label={`Started ${getYear(item.dates)}`}>
              {getYear(item.dates)}
            </div>
            <div className="experience-main">
              <p className="company">{item.company}</p>
              <h3>{item.role}</h3>
              <p className="meta">
                {item.dates} | {item.location}
              </p>
              <div className="mini-tag-list">
                {item.tags.map((tag) => (
                  <span className="mini-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
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
