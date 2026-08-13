export default function DevlogSection({ entries }) {
  return (
    <section className="personal-section" id="devlog">
      <div className="personal-heading">
        <p className="console-kicker">Devlog</p>
        <h2>Informal notes about building, debugging and thinking through projects.</h2>
      </div>
      <div className="devlog-list">
        {entries.map((entry) => (
          <article className="console-card devlog-entry" key={`${entry.date}-${entry.title}`}>
            <span>{entry.date} / {entry.project}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            <div className="console-chip-list">
              {entry.tags.map((tag) => (
                <b key={tag}>{tag}</b>
              ))}
            </div>
            {entry.optionalLink && (
              <a href={entry.optionalLink} target="_blank" rel="noopener noreferrer">
                Open context
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
