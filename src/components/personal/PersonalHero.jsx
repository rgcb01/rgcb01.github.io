export default function PersonalHero({ profile }) {
  return (
    <section className="personal-hero" id="profile">
      <a className="personal-back" href="/">Back to professional portfolio</a>
      <div className="player-hero-shell">
        <div>
          <p className="console-kicker">Player Profile</p>
          <h1>{profile.name}</h1>
          <div className="personal-manifesto">
            {profile.introLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <aside className="player-status-card">
          <span>Status</span>
          <strong>{profile.status}</strong>
          <ul>
            {profile.currently.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
      <div className="player-stat-grid compact">
        {profile.fields.map((field) => (
          <div className="player-stat" key={field.label}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
