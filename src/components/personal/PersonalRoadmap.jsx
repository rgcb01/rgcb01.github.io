export default function PersonalRoadmap({ roadmap }) {
  return (
    <section className="personal-section" id="roadmap">
      <div className="personal-heading">
        <p className="console-kicker">Roadmap</p>
        <h2>A lightweight roadmap, not a promise board.</h2>
      </div>
      <div className="game-roadmap">
        {roadmap.map((stage) => (
          <article className={`console-card roadmap-state-card ${stage.stage.toLowerCase()}`} key={stage.stage}>
            <div className="card-topline">
              <span>{stage.stage}</span>
              <em>{stage.status}</em>
            </div>
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
