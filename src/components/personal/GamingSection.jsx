function EmptySlot({ label }) {
  return <div className="empty-slot">{label} · Coming soon</div>;
}

export default function GamingSection({ gaming }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Gaming</p>
        <h2>Platform and backlog structure without API integrations yet.</h2>
      </div>
      <div className="console-grid two">
        <article className="console-card">
          <span>Platforms</span>
          <div className="console-chip-list">
            {gaming.platforms.map((platform) => (
              <b key={platform}>{platform}</b>
            ))}
          </div>
          <p>API integrations are intentionally deferred.</p>
        </article>
        <article className="console-card">
          <span>Platinum Collection</span>
          <strong>{gaming.platinumCount ?? "Not tracked yet"}</strong>
          <p>No trophy counts are invented in V0.1.</p>
        </article>
      </div>
      <div className="console-grid three">
        <EmptySlot label="Currently Playing" />
        <EmptySlot label="Recently Played" />
        <EmptySlot label="Backlog / Next Games" />
      </div>
    </section>
  );
}
