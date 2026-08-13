import { Trophy } from "lucide-react";
import { totalTrophies } from "./trophyUtils.js";

const TROPHY_TYPES = [
  ["platinum", "Platinum"],
  ["gold", "Gold"],
  ["silver", "Silver"],
  ["bronze", "Bronze"],
];

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
        {TROPHY_TYPES.map(([type, label]) => (
          <span className={`trophy-pill ${type}`} key={type} title={`${label}: ${counts[type] ?? 0}`}>
            <Trophy aria-hidden="true" size={14} strokeWidth={2.4} />
            <span className="sr-only">{label}: </span>
            <span className="trophy-pill-count">{counts[type] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
