import { ratingText } from "./trophyUtils.js";

const fields = [
  ["rating", "Game Rating"],
  ["platinumRating", "Platinum Rating"],
  ["difficulty", "Difficulty"],
  ["enjoyment", "Enjoyment"],
  ["grind", "Grind"],
  ["missables", "Missables"],
  ["wouldPlatinumAgain", "Would Platinum Again"],
  ["favoriteTrophy", "Favorite Trophy"],
];

export default function PersonalGameReview({ manual = {} }) {
  const visibleFields = fields.filter(([key]) => manual[key] !== null && manual[key] !== undefined && manual[key] !== "");
  const hasText = Boolean(manual.review || manual.developerTake);

  return (
    <section className="personal-section trophy-detail-section">
      <div className="personal-heading">
        <p className="console-kicker">My Take</p>
        <h2>Manual notes and ratings.</h2>
      </div>
      {visibleFields.length || hasText ? (
        <div className="console-card personal-review-panel">
          <div className="review-stat-grid">
            {visibleFields.map(([key, label]) => (
              <div className="player-stat" key={key}>
                <span>{label}</span>
                <strong>{typeof manual[key] === "number" ? ratingText(manual[key]) : String(manual[key])}</strong>
              </div>
            ))}
          </div>
          {manual.review && <p>{manual.review}</p>}
          {manual.developerTake && <p>{manual.developerTake}</p>}
        </div>
      ) : (
        <div className="empty-slot premium-empty">Player notes not logged yet.</div>
      )}
    </section>
  );
}
