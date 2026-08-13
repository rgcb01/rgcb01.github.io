import { totalTrophies } from "./trophyUtils.js";

export default function TrophyProgress({ progress }) {
  const counts = progress?.counts || {};
  const earned = progress?.earned ?? 0;
  const total = progress?.total ?? totalTrophies(counts);
  const percent = progress?.progressPercent ?? 0;

  return (
    <div className="trophy-progress" aria-label={`${percent}% trophy completion`}>
      <div className="trophy-progress-topline">
        <strong>{percent}%</strong>
        <span>
          {earned}/{total} trophies
        </span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <div className="trophy-count-row">
        {["platinum", "gold", "silver", "bronze"].map((type) => (
          <span className={`trophy-pill ${type}`} key={type}>
            {type.slice(0, 1).toUpperCase()} {counts[type] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}
