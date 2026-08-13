import { useEffect, useMemo, useState } from "react";
import PersonalHero from "../PersonalHero.jsx";
import PersonalNav from "../PersonalNav.jsx";
import { personalProfile } from "../../../data/personal.js";
import { personalTrophyData, trophyRoomSettings } from "../../../data/trophies/personalTrophyData.js";
import TrophyGameCard from "./TrophyGameCard.jsx";
import TrophyProgress from "./TrophyProgress.jsx";
import { byDateNewest, formatDate, getManualEntry, loadJson, platformLabel, ratingText, totalTrophies } from "./trophyUtils.js";
import CoverFallback from "../CoverFallback.jsx";

const defaultProfile = {
  source: "playstation",
  psnOnlineId: trophyRoomSettings.psnOnlineId,
  synchronized: false,
  syncedAt: null,
  profile: null,
  stats: { gameCount: 0, averageCompletion: null, completeGameCount: 0 },
};

function sortGames(games, sort, personalData) {
  const copy = [...games];
  if (sort === "oldest") return copy.sort((a, b) => new Date(a.trophyProgress?.platinumEarnedDate || 0) - new Date(b.trophyProgress?.platinumEarnedDate || 0));
  if (sort === "rating") return copy.sort((a, b) => (getManualEntry(personalData, b.sources?.psnTitleId).rating ?? -1) - (getManualEntry(personalData, a.sources?.psnTitleId).rating ?? -1));
  if (sort === "difficulty") return copy.sort((a, b) => (getManualEntry(personalData, b.sources?.psnTitleId).difficulty ?? -1) - (getManualEntry(personalData, a.sources?.psnTitleId).difficulty ?? -1));
  if (sort === "alpha") return copy.sort((a, b) => (a.game?.title || "").localeCompare(b.game?.title || ""));
  if (sort === "progress") return copy.sort((a, b) => (b.trophyProgress?.progressPercent ?? 0) - (a.trophyProgress?.progressPercent ?? 0));
  if (sort === "release") return copy.sort((a, b) => new Date(b.game?.releaseDate || 0) - new Date(a.game?.releaseDate || 0));
  if (sort === "recent") return copy.sort((a, b) => byDateNewest(a, b, (game) => game.recentActivityDate || game.trophyProgress?.lastTrophyDate));
  return copy.sort((a, b) => byDateNewest(a, b, (game) => game.trophyProgress?.platinumEarnedDate));
}

function statCards(profile, games) {
  const counts = profile.profile?.earnedTrophies || {};
  const total = totalTrophies(counts);
  return [
    ["PSN ID", profile.psnOnlineId || "rgcb01"],
    ["Trophy Level", profile.profile?.trophyLevel ?? "Not synced"],
    ["Platinum", counts.platinum ?? 0],
    ["Gold", counts.gold ?? 0],
    ["Silver", counts.silver ?? 0],
    ["Bronze", counts.bronze ?? 0],
    ["Total", total || 0],
    ["Games", profile.stats?.gameCount ?? games.length],
    ["Average", profile.stats?.averageCompletion == null ? "Unknown" : `${profile.stats.averageCompletion}%`],
    ["100%", profile.stats?.completeGameCount ?? 0],
  ];
}

function FeaturedTrophyCard({ title, game, personalData, empty }) {
  if (!game) {
    return (
      <article className="console-card trophy-feature-card empty-feature">
        <span>{title}</span>
        <strong>{empty}</strong>
      </article>
    );
  }
  const manual = getManualEntry(personalData, game.sources?.psnTitleId);
  const cover = game.game?.cover || game.game?.psnIcon;
  const artwork = game.game?.artwork || game.game?.screenshots?.[0] || cover;
  const isPlatinum = title.toLowerCase().includes("platinum");

  return (
    <article className={`console-card trophy-feature-card ${isPlatinum ? "latest-platinum-card" : "active-hunt-card"}`} style={artwork ? { "--feature-art": `url("${artwork}")` } : undefined}>
      <div className="feature-card-topline">
        <span>{title}</span>
        <b>{isPlatinum ? "PLATINUM EARNED" : "ACTIVE HUNT"}</b>
      </div>
      <div className="trophy-feature-layout">
        {cover ? <img src={cover} alt={`${game.game.title} cover`} loading="lazy" /> : <CoverFallback title={game.game.title} />}
        <div>
          <h3>{game.game.title}</h3>
          <p>{platformLabel(game.game?.platforms)}</p>
          <TrophyProgress progress={game.trophyProgress} />
          <div className="trophy-card-meta">
            {game.trophyProgress?.platinumTrophyName && <b>{game.trophyProgress.platinumTrophyName}</b>}
            {game.trophyProgress?.platinumEarnedDate && <b>{formatDate(game.trophyProgress.platinumEarnedDate)}</b>}
            {ratingText(manual.rating) && <b>Rating: {ratingText(manual.rating)}</b>}
          </div>
          <a className="trophy-text-link" href={`/personal/trophies/${game.slug}`}>Open game file</a>
        </div>
      </div>
    </article>
  );
}

export default function TrophyRoom() {
  const [profile, setProfile] = useState(defaultProfile);
  const [games, setGames] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [platinumSort, setPlatinumSort] = useState("newest");
  const [librarySort, setLibrarySort] = useState("recent");
  const [libraryFilter, setLibraryFilter] = useState("all");

  useEffect(() => {
    Promise.all([loadJson("/data/generated/psn-profile.json"), loadJson("/data/generated/trophy-games.json")]).then(([profileData, gameData]) => {
      setProfile(profileData || defaultProfile);
      setGames(Array.isArray(gameData?.games) ? gameData.games : []);
      setLoaded(true);
    });
  }, []);

  const platinums = useMemo(() => sortGames(games.filter((game) => game.trophyProgress?.platinumEarned), platinumSort, personalTrophyData), [games, platinumSort]);
  const latestPlatinum = games.find((game) => game.slug === profile.stats?.latestPlatinumSlug) || platinums[0];
  const currentHunt = games.find((game) => game.slug === profile.stats?.currentPlatinumHuntSlug);

  const platformFilters = useMemo(() => {
    const platforms = new Set();
    games.forEach((game) => (game.game?.platforms || []).forEach((platform) => platforms.add(platform)));
    return [...platforms].filter((platform) => /^PS/.test(platform));
  }, [games]);

  const libraryGames = useMemo(() => {
    const filtered = games.filter((game) => {
      const progress = game.trophyProgress?.progressPercent ?? 0;
      if (libraryFilter === "all") return true;
      if (libraryFilter === "platinum") return game.trophyProgress?.platinumEarned;
      if (libraryFilter === "complete") return progress === 100;
      if (libraryFilter === "in-progress") return progress > 0 && progress < 100;
      if (libraryFilter === "low") return progress <= 5;
      return (game.game?.platforms || []).includes(libraryFilter);
    });
    return sortGames(filtered, librarySort, personalTrophyData);
  }, [games, libraryFilter, librarySort]);

  return (
    <main className="personal-page trophy-room-page">
      <PersonalHero profile={{ ...personalProfile, status: "TROPHY SYSTEM / PLAYSTATION", introLines: ["Trophy Room.", "Verified progress.", "Manual opinions only."] }} />
      <PersonalNav />
      <section className="personal-section" id="trophy-room">
        <div className="personal-heading trophy-room-heading">
          <p className="console-kicker">PlayStation Trophy Room</p>
          <h2>Trophy progress from PSN, metadata from IGDB, opinions from my own notes.</h2>
          <p>{profile.synchronized ? `Last synchronized ${formatDate(profile.syncedAt)}.` : "Trophy data has not been synchronized yet."}</p>
          <div className="source-chip-row" aria-label="Trophy Room data sources">
            <span>PSN</span>
            <span>IGDB</span>
            <span>LOCAL</span>
          </div>
        </div>
        <div className="player-stat-grid trophy-stat-grid">
          {statCards(profile, games).map(([label, value]) => (
            <div className="player-stat" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="psn-card-panel">
          <span>Secondary verification</span>
          <img src="https://card.psnprofiles.com/2/rgcb01.png" alt="PSNProfiles trophy card for rgcb01" loading="lazy" />
        </div>
      </section>

      {!loaded || !profile.synchronized ? (
        <section className="personal-section">
          <div className="empty-slot">Trophy data has not been synchronized yet.</div>
        </section>
      ) : (
        <>
          <section className="personal-section trophy-feature-grid">
            <FeaturedTrophyCard title="Latest Platinum" game={latestPlatinum} personalData={personalTrophyData} empty="No platinum trophy found in synchronized data." />
            <FeaturedTrophyCard title="Current Platinum Hunt" game={currentHunt} personalData={personalTrophyData} empty="No single current hunt could be selected." />
          </section>

          <section className="personal-section" id="platinums">
            <div className="section-toolbar">
              <div className="personal-heading">
                <p className="console-kicker">Platinum Collection</p>
                <h2>Earned platinum trophies, newest first by default.</h2>
              </div>
              <select value={platinumSort} onChange={(event) => setPlatinumSort(event.target.value)} aria-label="Sort platinum collection">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="rating">Rating</option>
                <option value="difficulty">Difficulty</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
            {platinums.length ? <div className="trophy-gallery">{platinums.map((game) => <TrophyGameCard game={game} personalData={personalTrophyData} key={game.id} />)}</div> : <div className="empty-slot">No earned platinum trophies found in synchronized data.</div>}
          </section>

          <section className="personal-section" id="all-trophy-games">
            <div className="section-toolbar">
              <div className="personal-heading">
                <p className="console-kicker">All Trophy Games</p>
                <h2>Full PSN trophy library from the generated summary file.</h2>
              </div>
              <select value={librarySort} onChange={(event) => setLibrarySort(event.target.value)} aria-label="Sort trophy games">
                <option value="recent">Recently played</option>
                <option value="progress">Trophy progress</option>
                <option value="alpha">Alphabetical</option>
                <option value="release">Release year</option>
              </select>
            </div>
            <div className="filter-row" aria-label="Filter trophy games">
              {[
                ["all", "All"],
                ["platinum", "Platinum"],
                ["complete", "100%"],
                ["in-progress", "In Progress"],
                ["low", "Not Started / Low"],
                ...platformFilters.map((platform) => [platform, platform]),
              ].map(([value, label]) => (
                <button className={libraryFilter === value ? "active" : ""} key={value} type="button" onClick={() => setLibraryFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
            {libraryGames.length ? <div className="trophy-library">{libraryGames.map((game) => <TrophyGameCard game={game} personalData={personalTrophyData} key={game.id} />)}</div> : <div className="empty-slot">No games match this filter.</div>}
          </section>
        </>
      )}
    </main>
  );
}
