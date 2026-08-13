export default function DevlogSection({ entries }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Devlog</p>
        <h2>Behind-the-scenes notes about experiments and site updates.</h2>
      </div>
      <div className="devlog-list">
        {entries.map((entry) => (
          <article className="console-card devlog-entry" key={`${entry.date}-${entry.title}`}>
            <span>{entry.date} · {entry.category}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            <em>{entry.status}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
