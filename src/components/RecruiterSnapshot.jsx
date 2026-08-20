export default function RecruiterSnapshot({ snapshot }) {
  return (
    <section className="section section-standard compact-section" id="snapshot">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Recruiter Snapshot</p>
        <h2>Role fit at a glance.</h2>
      </div>
      <div className="snapshot-scan">
        <article className="snapshot-column">
          <h3>Available for</h3>
          <ul className="snapshot-list">
            {snapshot.availableFor.map((role) => (
              <li key={role}>
                {role}
              </li>
            ))}
          </ul>
        </article>
        <article className="snapshot-column">
          <h3>Strengths</h3>
          <ul className="snapshot-list">
            {snapshot.strengths.map((strength) => (
              <li key={strength}>
                {strength}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
