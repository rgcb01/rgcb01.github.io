import CoverFallback from "./CoverFallback.jsx";
import { formatDate, platformLabel } from "./trophies/trophyUtils.js";

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value || 0);
}

function TrophyFeatureMini({ title, game, empty }) {
  return (
    <article className="console-card home-trophy-mini">
      <span>{title}</span>
      {game ? (
        <a href={`/personal/trophies/${game.slug}`}>
          {game.game?.cover || game.game?.psnIcon ? <img src={game.game.cover || game.game.psnIcon} alt={`${game.game?.title || "Game"} cover`} loading="lazy" /> : <CoverFallback title={game.game?.title || "Game"} />}
          <div>
            <strong>{game.game?.title || "Untitled trophy set"}</strong>
            <p>{platformLabel(game.game?.platforms)}</p>
            {game.trophyProgress?.platinumEarnedDate ? <em>{formatDate(game.trophyProgress.platinumEarnedDate)}</em> : <em>{game.trophyProgress?.progressPercent ?? 0}% complete</em>}
          </div>
        </a>
      ) : (
        <p>{empty}</p>
      )}
    </article>
  );
}

export default function TrophyRoomPreview({ trophyData }) {
  return (
    <section className="personal-section" id="trophy-preview">
      <div className="personal-heading">
        <p className="console-kicker">Trophy Room</p>
        <h2>Live PSN trophy profile, cover art and personal game files.</h2>
      </div>
      <article className="console-card trophy-preview-card console-home-trophy-card">
        <div className="trophy-preview-main">
          <span>PSN / {trophyData.psnOnlineId}</span>
          <strong>PlayStation Trophy Room</strong>
          <p>{trophyData.hasRealData ? `Synced profile: ${formatNumber(trophyData.gameCount)} games, ${formatNumber(trophyData.totalTrophies)} trophies, ${formatNumber(trophyData.platinumCount)} platinums.` : "Trophy data temporarily unavailable. Manual personal sections still work."}</p>
          <div className="source-chip-row">
            <span>{trophyData.hasRealData ? "SYNCED" : "UNAVAILABLE"}</span>
            <span>PSN</span>
            <span>IGDB</span>
            <span>LOCAL NOTES</span>
          </div>
          {trophyData.syncedAt && <em className="sync-caption">Last sync {formatDate(trophyData.syncedAt)}</em>}
        </div>
        <div className="home-trophy-feature-grid">
          <TrophyFeatureMini title="Latest Platinum" game={trophyData.latestPlatinum} empty="No earned platinum found in synced data." />
          <TrophyFeatureMini title="Current Hunt" game={trophyData.currentHunt} empty="No current hunt selected." />
        </div>
        <a className="trophy-room-link" href="/personal/trophies">Open Trophy Room</a>
      </article>
    </section>
  );
}
