import CoverFallback from "./CoverFallback.jsx";

function MediaColumn({ title, items, empty }) {
  return (
    <article className="console-card">
      <span>{title}</span>
      {items.length ? (
        items.map((item) => (
          <div className="media-item" key={item.title}>
            {item.cover ? <img src={item.cover} alt={`${item.title} poster`} loading="lazy" /> : <CoverFallback title={item.title} type="poster" />}
            <div>
              <strong>{item.title}</strong>
              <p>{item.note}</p>
            </div>
          </div>
        ))
      ) : (
        <p>{empty}</p>
      )}
    </article>
  );
}

export default function MediaSection({ media }) {
  return (
    <section className="personal-section" id="media">
      <div className="personal-heading">
        <p className="console-kicker">Media Log</p>
        <h2>Movies and series notes, separated by current watch state.</h2>
      </div>
      <div className="console-grid three">
        <MediaColumn title="Watching Now" items={media.watchingNow} empty="Nothing logged here yet." />
        <MediaColumn title="Recently Watched" items={media.recentlyWatched} empty="Recently watched media will appear here." />
        <MediaColumn title="Favorites / Worth Remembering" items={media.favorites} empty="Favorites will be added when there is a real note to keep." />
      </div>
    </section>
  );
}
