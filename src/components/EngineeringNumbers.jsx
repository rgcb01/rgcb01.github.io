export default function EngineeringNumbers({ metrics }) {
  return (
    <section className="section compact-section" id="numbers">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Engineering by the Numbers</p>
        <h2>Selected measurable outcomes from engineering work.</h2>
      </div>
      <div className="numbers-grid">
        {metrics.map((metric) => (
          <article className="number-card" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
