export default function AchievementsPreview({ achievements }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Achievements</p>
        <h2>System preview for future milestones across projects, games and life.</h2>
      </div>
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <article className={`achievement-card ${achievement.state.toLowerCase()}`} key={achievement.title}>
            <span>{achievement.rarity}</span>
            <strong>{achievement.title}</strong>
            <p>{achievement.description}</p>
            <em>{achievement.state}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
