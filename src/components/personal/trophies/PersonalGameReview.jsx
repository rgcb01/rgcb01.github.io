import { ratingText } from "./trophyUtils.js";

const scoreFields = [
  ["rating", "Game Rating"],
  ["platinumRating", "Platinum Rating"],
  ["difficulty", "Difficulty"],
  ["enjoyment", "Enjoyment"],
  ["grind", "Grind"],
  ["missables", "Missables"],
  ["wouldPlatinumAgain", "Would Platinum Again"],
];

const textSections = [
  ["whatILiked", "What I Liked"],
  ["whatDidntWork", "What Didn't Work"],
  ["favoriteMoment", "Favorite Mechanic / Moment"],
  ["favoriteTrophy", "Favorite Trophy"],
  ["platinumWorthIt", "Was the Platinum Worth It?"],
  ["review", "Review"],
  ["developerTake", "Developer Take"],
];

function fieldValue(value) {
  if (typeof value === "number") return ratingText(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function PersonalGameReview({ manual = {} }) {
  const visibleFields = scoreFields.filter(([key]) => manual[key] !== null && manual[key] !== undefined && manual[key] !== "");
  const visibleText = textSections.filter(([key]) => manual[key] !== null && manual[key] !== undefined && manual[key] !== "");

  return (
    <section className="personal-section trophy-detail-section">
      <div className="personal-heading">
        <p className="console-kicker">My Take</p>
        <h2>Manual notes and ratings.</h2>
      </div>
      {visibleFields.length || visibleText.length ? (
        <div className="console-card personal-review-panel">
          {visibleFields.length ? (
            <div className="review-stat-grid">
              {visibleFields.map(([key, label]) => (
                <div className="player-stat" key={key}>
                  <span>{label}</span>
                  <strong>{fieldValue(manual[key])}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {visibleText.length ? (
            <div className="review-text-grid">
              {visibleText.map(([key, label]) => (
                <article className="review-text-block" key={key}>
                  <span>{label}</span>
                  <p>{manual[key]}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-slot premium-empty">Review not logged yet.</div>
      )}
    </section>
  );
}
