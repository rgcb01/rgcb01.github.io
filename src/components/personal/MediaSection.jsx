import CoverFallback from "./CoverFallback.jsx";

const CATEGORY_LABELS = {
  playing: "Playing",
  watching: "Watching",
  reading: "Reading",
  listening: "Listening",
};

function MediaItem({ item, category }) {
  return (
    <article className="media-item into-item">
      {item.cover ? <img src={item.cover} alt={`${item.title} cover`} loading="lazy" /> : <CoverFallback title={item.title} type={category === "watching" ? "poster" : "cover"} />}
      <div>
        <span>{CATEGORY_LABELS[category]}</span>
        <strong>{item.title}</strong>
        {item.note ? <p>{item.note}</p> : null}
      </div>
    </article>
  );
}

export default function MediaSection({ media, recentlyPlayed }) {
  const derivedPlaying = recentlyPlayed.slice(0, 1).map((game) => ({
    title: game.game?.title || "Recent game",
    cover: game.game?.cover || game.game?.psnIcon,
    note: "Latest PSN activity.",
  }));

  const categories = {
    playing: media.playing?.length ? media.playing : derivedPlaying,
    watching: media.watching || [],
    reading: media.reading || [],
    listening: media.listening || [],
  };

  const visible = Object.entries(categories).filter(([, items]) => items.length);

  return (
    <section className="personal-section" id="media">
      <div className="personal-heading">
        <p className="console-kicker">Currently Into</p>
        <h2>Current games, media and inputs without pretending the tracker is bigger than it is.</h2>
      </div>
      {visible.length ? (
        <div className="currently-into-grid">
          {visible.map(([category, items]) => (
            <article className="console-card currently-into-card" key={category}>
              <span>{CATEGORY_LABELS[category]}</span>
              {items.slice(0, 3).map((item) => (
                <MediaItem item={item} category={category} key={`${category}-${item.title}`} />
              ))}
            </article>
          ))}
        </div>
      ) : (
        <article className="console-card player-note-empty">
          <span>Local</span>
          <strong>No current media entries logged.</strong>
          <p>Watching, reading and listening entries will appear here when they are actually added.</p>
        </article>
      )}
    </section>
  );
}
