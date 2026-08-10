export default function RecruiterSnapshot({ snapshot }) {
  return (
    <section className="section compact-section" id="snapshot">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Recruiter Snapshot</p>
        <h2>Role fit at a glance.</h2>
      </div>
      <div className="snapshot-grid">
        <article className="snapshot-card">
          <h3>Available for</h3>
          <div className="compact-chip-list">
            {snapshot.availableFor.map((role) => (
              <span className="compact-chip" key={role}>
                {role}
              </span>
            ))}
          </div>
        </article>
        <article className="snapshot-card">
          <h3>Strengths</h3>
          <div className="compact-chip-list">
            {snapshot.strengths.map((strength) => (
              <span className="compact-chip" key={strength}>
                {strength}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
