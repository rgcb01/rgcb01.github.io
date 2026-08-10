export default function PortfolioRoadmap({ roadmap }) {
  return (
    <section className="section compact-section" id="roadmap">
      <div className="section-heading">
        <p className="eyebrow">Engineering Portfolio Roadmap</p>
        <h2>A focused build plan across data, quality, vision and automation projects.</h2>
      </div>
      <div className="roadmap-grid">
        {roadmap.map((stage) => (
          <article className="roadmap-card" key={stage.stage}>
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
