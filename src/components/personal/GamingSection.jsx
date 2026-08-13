import CoverFallback from "./CoverFallback.jsx";

function EmptySlot({ label, message }) {
  return (
    <div className="empty-slot">
      <strong>{label}</strong>
      <span>{message}</span>
    </div>
  );
}

function GameCard({ game }) {
  return (
    <article className="game-card">
      {game.cover ? <img src={game.cover} alt={`${game.title} cover`} loading="lazy" /> : <CoverFallback title={game.title} />}
      <div>
        <span>{game.platform}</span>
        <h3>{game.title}</h3>
        <strong>{game.status}</strong>
        {game.progress && <p>{game.progress}</p>}
        {game.platinumTarget && <p>Platinum Target: {game.platinumTarget}</p>}
        {game.note && <p>{game.note}</p>}
      </div>
    </article>
  );
}

export default function GamingSection({ currentlyPlaying, gaming }) {
  return (
    <section className="personal-section" id="gaming">
      <div className="personal-heading">
        <p className="console-kicker">Gaming</p>
        <h2>Manual gaming profile prepared for future PlayStation and Steam data.</h2>
      </div>
      <div className="currently-playing-panel">
        <div className="card-topline">
          <h3>Currently Playing</h3>
          <span className="status next">Manual</span>
        </div>
        {currentlyPlaying.length ? (
          <div className="game-row">
            {currentlyPlaying.map((game) => (
              <GameCard game={game} key={game.title} />
            ))}
          </div>
        ) : (
          <EmptySlot label="Next game session pending." message="No current game has been specified yet." />
        )}
      </div>

      <div className="console-grid two">
        <article className="console-card platform-card">
          <span>Platforms</span>
          <div className="console-chip-list">
            {gaming.platforms.map((platform) => (
              <b key={platform}>{platform}</b>
            ))}
          </div>
          <p>API integrations are intentionally deferred.</p>
        </article>
        <article className="console-card platform-card">
          <span>Data Policy</span>
          <strong>Manual and honest</strong>
          <p>No trophy counts, hours played or ratings are invented.</p>
        </article>
      </div>

      <div className="library-grid">
        {gaming.categories.map((category) => (
          <article className="console-card library-column" key={category.title}>
            <span>{category.title}</span>
            {category.items.length ? (
              category.items.map((game) => <GameCard game={game} key={game.title} />)
            ) : (
              <EmptySlot label={category.title} message={category.empty} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
