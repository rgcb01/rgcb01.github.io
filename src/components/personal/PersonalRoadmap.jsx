export default function PersonalRoadmap({ roadmap }) {
  return (
    <section className="personal-section">
      <div className="personal-heading">
        <p className="console-kicker">Roadmap</p>
        <h2>A low-pressure plan for the personal side of the site.</h2>
      </div>
      <div className="console-grid three">
        {roadmap.map((stage) => (
          <article className="console-card" key={stage.stage}>
            <span>{stage.stage}</span>
            <ul>
              {stage.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
