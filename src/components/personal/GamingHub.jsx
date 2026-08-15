import { useMemo, useState } from "react";
import CoverFallback from "./CoverFallback.jsx";
import PersonalNav from "./PersonalNav.jsx";
import PlatformStatus from "./PlatformStatus.jsx";
import { useGamingData } from "./useGamingData.js";
import { manualActivity, milestoneDefinitions, personalProfile } from "../../data/personal.js";
import { formatDate } from "./trophies/trophyUtils.js";

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value || 0);
}

function formatHours(value) {
  const numeric = Number(value || 0);
  if (numeric >= 1000) return `${new Intl.NumberFormat("en").format(Math.round(numeric))} h`;
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} h`;
}

function StatCard({ label, value, detail }) {
  return (
    <article className="player-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}

function SteamGameCard({ game }) {
  const image = game.cover || game.logoUrl || game.iconUrl;
  const achievementText = game.achievements ? `${game.achievements.percent}% achievements` : "Achievements unavailable";

  return (
    <article className={`steam-library-card ${game.achievements?.perfect ? "perfect" : ""}`}>
      {image ? <img src={image} alt={`${game.name} cover`} loading="lazy" /> : <CoverFallback title={game.name} />}
      <div>
        <div className="card-topline">
          <span>STEAM</span>
          {game.achievements?.perfect ? <em>Perfect</em> : null}
        </div>
        <h3>{game.name}</h3>
        <strong>{formatHours(game.playtimeHours)} played</strong>
        <p>{achievementText}</p>
        {game.lastPlayed ? <small>Last played {formatDate(game.lastPlayed)}</small> : null}
      </div>
    </article>
  );
}

function ActivityItem({ event }) {
  return (
    <a className="activity-row game" href={event.href || "/personal/gaming"}>
      <div>
        <span>{event.label}</span>
        <strong>{event.title}</strong>
        {event.detail ? <p>{event.detail}</p> : null}
      </div>
      <div className="activity-meta">
        <b>{event.source}</b>
        {event.date ? <em>{formatDate(event.date)}</em> : null}
      </div>
    </a>
  );
}

function filteredGames(games, filter) {
  if (filter === "PERFECT") return games.filter((game) => game.achievements?.perfect);
  if (filter === "RECENT") return games.filter((game) => game.recentlyPlayed || game.lastPlayed);
  return games;
}

export default function GamingHub() {
  const gamingData = useGamingData({
    manualActivity,
    milestoneDefinitions,
    currentGameOverride: personalProfile.currentGameOverride,
  });
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "STEAM", "PERFECT", "RECENT"];
  const visibleSteamGames = useMemo(() => filteredGames(gamingData.steamGames, filter).slice(0, 24), [gamingData.steamGames, filter]);
  const steamSummary = gamingData.steamSummary || {};

  return (
    <main className="personal-page gaming-hub-page">
      <section className="personal-hero gaming-hub-hero" id="home">
        <a className="personal-back" href="/personal">Back to Console Home</a>
        <p className="console-kicker">Gaming Hub</p>
        <h1>Cross-platform library for rgcb01.</h1>
        <p className="player-handle">PlayStation trophies stay specialized. Steam adds library, playtime and achievement context.</p>
      </section>
      <PersonalNav />
      <PlatformStatus accounts={gamingData.platformAccounts} />

      <section className="personal-section">
        <div className="personal-heading">
          <p className="console-kicker">Gaming Profile</p>
          <h2>Connected platform status and the high-signal numbers from synced public data.</h2>
        </div>
        <div className="player-stat-grid gaming-profile-grid">
          <StatCard label="Tracked Titles" value={formatNumber(gamingData.gameCount + Number(steamSummary.ownedGames || 0))} detail="PSN trophy titles + Steam owned games" />
          <StatCard label="PS Platinums" value={formatNumber(gamingData.platinumCount)} detail="PlayStation only" />
          <StatCard label="Steam Games" value={gamingData.steamConnected ? formatNumber(steamSummary.ownedGames) : "Unavailable"} detail={gamingData.steamConnected ? "Owned library" : "Steam data temporarily unavailable."} />
          <StatCard label="Steam Playtime" value={gamingData.steamConnected ? formatHours(steamSummary.totalPlaytimeHours) : "Unavailable"} detail="Official Steam playtime" />
          <StatCard label="Perfect Games" value={gamingData.steamConnected ? formatNumber(steamSummary.perfectGames) : "Unavailable"} detail="Steam achievements only" />
        </div>
      </section>

      <section className="personal-section">
        <div className="personal-heading">
          <p className="console-kicker">Recently Played</p>
          <h2>Recent public activity, clearly labeled by platform.</h2>
        </div>
        <div className="activity-feed gaming-activity-feed">
          {gamingData.activity.length ? (
            gamingData.activity.slice(0, 8).map((event) => <ActivityItem event={event} key={`${event.source}-${event.title}-${event.date}`} />)
          ) : (
            <article className="console-card player-note-empty">
              <span>Unavailable</span>
              <strong>No recent public activity yet.</strong>
              <p>PlayStation remains available; Steam appears here once the sync returns public data.</p>
            </article>
          )}
        </div>
      </section>

      <section className="personal-section gaming-platform-grid">
        <article className="currently-playing-panel">
          <div className="card-topline">
            <h3>PlayStation</h3>
            <span>CONNECTED</span>
          </div>
          <p>{formatNumber(gamingData.gameCount)} trophy titles, {formatNumber(gamingData.platinumCount)} platinums, {formatNumber(gamingData.totalTrophies)} total trophies.</p>
          <a className="console-action-link" href="/personal/trophies">Open Trophy Room</a>
        </article>
        <article className="currently-playing-panel steam-panel">
          <div className="card-topline">
            <h3>Steam</h3>
            <span>{gamingData.steamConnected ? "CONNECTED" : "UNAVAILABLE"}</span>
          </div>
          {gamingData.steamConnected ? (
            <p>{formatNumber(steamSummary.ownedGames)} owned games, {formatHours(steamSummary.totalPlaytimeHours)} total playtime, {formatNumber(steamSummary.gamesWithAchievementData)} games with achievement data.</p>
          ) : (
            <p>Steam data temporarily unavailable.</p>
          )}
        </article>
      </section>

      <section className="personal-section">
        <div className="personal-heading">
          <p className="console-kicker">Most Played on Steam</p>
          <h2>Sorted by official Steam playtime.</h2>
        </div>
        <div className="steam-leaderboard">
          {gamingData.topSteamGames.length ? (
            gamingData.topSteamGames.map((game, index) => (
              <article className="steam-rank-row" key={game.appId}>
                <b>{index + 1}</b>
                <strong>{game.name}</strong>
                <span>{formatHours(game.playtimeHours)}</span>
                <em>{game.achievements ? `${game.achievements.percent}% achievements` : "No achievement data"}</em>
              </article>
            ))
          ) : (
            <article className="console-card player-note-empty">
              <span>Steam</span>
              <strong>Most played data unavailable.</strong>
              <p>The leaderboard will populate after a successful Steam sync.</p>
            </article>
          )}
        </div>
      </section>

      <section className="personal-section" id="steam-library">
        <div className="personal-heading">
          <p className="console-kicker">Steam Library</p>
          <h2>Library cards with playtime, recent status and achievement completion where Steam exposes it.</h2>
        </div>
        <div className="gaming-filter-row" aria-label="Steam library filters">
          {filters.map((item) => (
            <button className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
        <div className="steam-library-grid">
          {visibleSteamGames.length ? (
            visibleSteamGames.map((game) => <SteamGameCard game={game} key={game.appId} />)
          ) : (
            <article className="console-card player-note-empty">
              <span>{filter}</span>
              <strong>No Steam games in this view.</strong>
              <p>{gamingData.steamConnected ? "Try another filter." : "Steam data temporarily unavailable."}</p>
            </article>
          )}
        </div>
      </section>

      {gamingData.crossPlatformGames.length ? (
        <section className="personal-section">
          <div className="personal-heading">
            <p className="console-kicker">Cross-Platform Games</p>
            <h2>Confirmed shared canonical identities across PlayStation and Steam.</h2>
          </div>
          <div className="console-grid three">
            {gamingData.crossPlatformGames.slice(0, 6).map((game) => (
              <article className="console-card cross-platform-card" key={game.internalGameId}>
                <span>PSN + STEAM</span>
                <strong>{game.title}</strong>
                <p>{game.playstation.platformProgress?.[0]?.percent ?? 0}% trophies / {game.steam.achievements?.percent ?? "No"}% achievements</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
