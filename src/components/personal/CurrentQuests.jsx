export default function CurrentQuests({ quests }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Current Quests</p>
        <h2>Manual status cards for what is active right now.</h2>
      </div>
      <div className="quest-grid">
        {quests.map((quest) => (
          <article className="console-card" key={quest.label}>
            <span>{quest.label}</span>
            <strong>{quest.value}</strong>
            <p>{quest.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
