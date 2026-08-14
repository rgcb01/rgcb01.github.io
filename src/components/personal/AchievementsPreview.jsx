function progressText(achievement) {
  if (achievement.unlocked) return "Unlocked";
  return `${achievement.current || 0}/${achievement.value}`;
}

export default function AchievementsPreview({ achievements, loading }) {
  return (
    <section className="personal-section" id="milestones">
      <div className="personal-heading">
        <p className="console-kicker">Personal Milestones</p>
        <h2>Real public milestones from PSN progress and portfolio history.</h2>
      </div>
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <article className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} key={achievement.title}>
            <span>{achievement.rarity}</span>
            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>
            <em>{loading ? "Syncing" : progressText(achievement)}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
