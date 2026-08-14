import CoverFallback from "./CoverFallback.jsx";
import { formatDate, platformLabel } from "./trophies/trophyUtils.js";

function GameCard({ game, mode = "recent" }) {
  const title = game.game?.title || "Untitled trophy set";
  const cover = game.game?.cover || game.game?.psnIcon;
  const progress = game.trophyProgress?.progressPercent ?? 0;

  return (
    <a className="game-card console-game-link" href={`/personal/trophies/${game.slug}`}>
      {cover ? <img src={cover} alt={`${title} cover`} loading="lazy" /> : <CoverFallback title={title} />}
      <div>
        <span>{platformLabel(game.game?.platforms)}</span>
        <h3>{title}</h3>
        <strong>{mode === "closest" ? `${progress}% complete` : "Recent trophy activity"}</strong>
        <div className="mini-progress-track" aria-label={`${progress}% trophy completion`}>
          <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
        {mode === "closest" && game.trophyProgress?.platinumTrophyName ? <p>Platinum: {game.trophyProgress.platinumTrophyName}</p> : null}
        {mode !== "closest" && (game.recentActivityDate || game.trophyProgress?.lastTrophyDate) ? <p>{formatDate(game.recentActivityDate || game.trophyProgress.lastTrophyDate)}</p> : null}
      </div>
    </a>
  );
}

function EmptySlot({ label, message }) {
  return (
    <div className="empty-slot">
      <strong>{label}</strong>
      <span>{message}</span>
    </div>
  );
}

export default function GamingSection({ trophyData }) {
  return (
    <section className="personal-section" id="gaming">
      <div className="personal-heading">
        <p className="console-kicker">Gaming</p>
        <h2>Recently played titles and platinum candidates derived from synced PSN progress.</h2>
      </div>

      <div className="console-home-gaming-grid">
        <div className="currently-playing-panel" id="recent-games">
          <div className="card-topline">
            <h3>Recently Played</h3>
            <span className="status next">{trophyData.hasRealData ? "PSN" : "Waiting"}</span>
          </div>
          {trophyData.recentlyPlayed.length ? (
            <div className="game-row">
              {trophyData.recentlyPlayed.map((game) => (
                <GameCard game={game} key={game.id} />
              ))}
            </div>
          ) : (
            <EmptySlot label="Recent activity unavailable." message="The home will populate this section when generated PSN data is available." />
          )}
        </div>

        <div className="currently-playing-panel" id="closest-platinum">
          <div className="card-topline">
            <h3>Closest to Platinum</h3>
            <span className="status next">Derived</span>
          </div>
          {trophyData.closestToPlatinum.length ? (
            <div className="closest-platinum-list">
              {trophyData.closestToPlatinum.map((game) => (
                <GameCard game={game} mode="closest" key={game.id} />
              ))}
            </div>
          ) : (
            <EmptySlot label="No clear candidates yet." message="Only non-platinum games with a known platinum trophy and meaningful progress are shown here." />
          )}
        </div>
      </div>
    </section>
  );
}
