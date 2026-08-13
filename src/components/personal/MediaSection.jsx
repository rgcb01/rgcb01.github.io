function MediaColumn({ title, items }) {
  return (
    <article className="console-card">
      <span>{title}</span>
      {items.length ? (
        items.map((item) => (
          <div className="media-item" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.shortReview}</p>
          </div>
        ))
      ) : (
        <p>Empty for now. Real notes will be added manually.</p>
      )}
    </article>
  );
}

export default function MediaSection({ media }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Media Log</p>
        <h2>Games, movies and series notes will live here.</h2>
      </div>
      <div className="console-grid three">
        <MediaColumn title="Games" items={media.games} />
        <MediaColumn title="Movies" items={media.movies} />
        <MediaColumn title="Series" items={media.series} />
      </div>
    </section>
  );
}
