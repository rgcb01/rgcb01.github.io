export default function CaseStudySection({ title, children }) {
  return (
    <section className="case-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
