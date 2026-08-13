import { useEffect, useMemo, useState } from "react";
import PersonalNav from "../PersonalNav.jsx";
import CoverFallback from "../CoverFallback.jsx";
import { personalTrophyData } from "../../../data/trophies/personalTrophyData.js";
import PersonalGameReview from "./PersonalGameReview.jsx";
import TrophyList from "./TrophyList.jsx";
import TrophyProgress from "./TrophyProgress.jsx";
import { formatDate, getManualEntry, loadJson, platformLabel } from "./trophyUtils.js";

export default function TrophyGamePage({ slug }) {
  const [games, setGames] = useState([]);
  const [details, setDetails] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadJson("/data/generated/trophy-games.json"), loadJson(`/data/generated/trophy-details/${slug}.json`)]).then(([gameData, detailData]) => {
      setGames(Array.isArray(gameData?.games) ? gameData.games : []);
      setDetails(detailData);
      setLoaded(true);
    });
  }, [slug]);

  const game = useMemo(() => games.find((item) => item.slug === slug) || details?.game || null, [games, details, slug]);
  const manual = getManualEntry(personalTrophyData, game?.sources?.psnTitleId);

  if (!loaded) {
    return (
      <main className="personal-page trophy-room-page">
        <PersonalNav />
        <section className="personal-section">
          <div className="empty-slot">Loading trophy file.</div>
        </section>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="personal-page trophy-room-page">
        <PersonalNav />
        <section className="personal-section">
          <a className="personal-back" href="/personal/trophies">Back to Trophy Room</a>
          <div className="empty-slot">Trophy game not found. The data may not have been synchronized yet.</div>
        </section>
      </main>
    );
  }

  const cover = game.game?.cover || game.game?.psnIcon;
  const background = game.game?.artwork || game.game?.screenshots?.[0] || cover;

  return (
    <main className="personal-page trophy-room-page">
      <section className="personal-section trophy-game-hero" style={background ? { "--hero-art": `url("${background}")` } : undefined}>
        <a className="personal-back" href="/personal/trophies">Back to Trophy Room</a>
        <div className="trophy-game-hero-grid">
          {cover ? <img className="trophy-detail-cover" src={cover} alt={`${game.game.title} cover`} loading="eager" /> : <CoverFallback title={game.game.title} />}
          <div>
            <p className="console-kicker">{platformLabel(game.game?.platforms)}</p>
            <h1>{game.game.title}</h1>
            <p>{game.game.summary || "No IGDB summary has been matched yet."}</p>
            <div className="trophy-card-meta">
              {game.game.releaseDate && <b>Released {formatDate(game.game.releaseDate)}</b>}
              {game.game.developer && <b>Developer: {game.game.developer}</b>}
              {game.game.publisher && <b>Publisher: {game.game.publisher}</b>}
              {game.sync?.enrichmentStatus && <b>Metadata: {game.sync.enrichmentStatus}</b>}
            </div>
            {!!game.game.genres?.length && (
              <div className="source-chip-row trophy-genre-row">
                {game.game.genres.slice(0, 5).map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <PersonalNav />
      <section className="personal-section trophy-detail-section">
        <div className="personal-heading">
          <p className="console-kicker">My Trophy Progress</p>
          <h2>Completion, earned dates, counts and playtime where available.</h2>
        </div>
        <div className="console-grid two">
          <article className="console-card">
            <span>Progress</span>
            <TrophyProgress progress={game.trophyProgress} />
          </article>
          <article className="console-card">
            <span>Timeline</span>
            <strong>{game.trophyProgress?.platinumEarned ? "Platinum earned" : "Platinum not earned"}</strong>
            <p>First trophy: {formatDate(game.trophyProgress?.firstTrophyDate)}</p>
            <p>Latest trophy: {formatDate(game.trophyProgress?.lastTrophyDate)}</p>
            <p>Platinum date: {formatDate(game.trophyProgress?.platinumEarnedDate)}</p>
            <p>Playtime: {game.playtime ?? "Not available"}</p>
          </article>
        </div>
      </section>
      <TrophyList trophies={details?.trophies || []} />
      <PersonalGameReview manual={manual} />
    </main>
  );
}
