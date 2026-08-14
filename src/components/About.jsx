export default function About({ about }) {
  return (
    <section className="section" id="about">
      <div className="section-heading">
        <p className="eyebrow">{about.eyebrow}</p>
        <h2>{about.title}</h2>
      </div>
      <div className="text-panel">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
