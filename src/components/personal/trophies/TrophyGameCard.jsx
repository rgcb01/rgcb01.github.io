import CoverFallback from "../CoverFallback.jsx";
import TrophyProgress from "./TrophyProgress.jsx";
import { formatDate, getManualEntry, platformLabel, ratingText } from "./trophyUtils.js";

export default function TrophyGameCard({ game, personalData, variant = "library" }) {
  const manual = getManualEntry(personalData, game.sources?.psnTitleId);
  const title = game.game?.title || "Untitled trophy set";
  const cover = game.game?.cover || game.game?.psnIcon;
  const platinumDate = game.trophyProgress?.platinumEarnedDate;
  const progress = game.trophyProgress?.progressPercent ?? 0;
  const state = game.trophyProgress?.platinumEarned ? "platinum-earned" : progress === 100 ? "completed" : progress > 5 ? "in-progress" : "low-progress";
  const href = `/personal/trophies/${game.slug}`;

  return (
    <a className={`trophy-game-card ${variant} ${state}`} href={href}>
      {cover ? <img src={cover} alt={`${title} cover`} loading="lazy" /> : <CoverFallback title={title} />}
      <div className="trophy-game-card-copy">
        <span>{platformLabel(game.game?.platforms)}</span>
        <h3>{title}</h3>
        <TrophyProgress progress={game.trophyProgress} />
        <div className="trophy-card-meta">
          {game.trophyProgress?.platinumEarned ? <b>Platinum: {formatDate(platinumDate)}</b> : <b>Platinum locked</b>}
          {ratingText(manual.rating) && <b>Rating: {ratingText(manual.rating)}</b>}
          {ratingText(manual.difficulty) && <b>Difficulty: {ratingText(manual.difficulty)}</b>}
        </div>
      </div>
    </a>
  );
}
