export default function PersonalHero({ profile }) {
  return (
    <section className="personal-hero">
      <a className="personal-back" href="/">← Back to professional portfolio</a>
      <p className="console-kicker">Save File 01</p>
      <h1>{profile.name}</h1>
      <p>{profile.subtitle}</p>
      <div className="player-stat-grid">
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
