export default function EngineeringNumbers({ metrics }) {
  return (
    <section className="section section-wide compact-section" id="numbers">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Engineering by the Numbers</p>
        <h2>Selected measurable outcomes from engineering work.</h2>
      </div>
      <div className="numbers-grid">
        {metrics.map((metric, index) => (
          <article className="number-card" key={metric.label}>
            <span className="number-index">{String(index + 1).padStart(2, "0")}</span>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            {metric.context ? <p>{metric.context}</p> : null}
            {metric.sourceHref ? <a href={metric.sourceHref}>View evidence</a> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
