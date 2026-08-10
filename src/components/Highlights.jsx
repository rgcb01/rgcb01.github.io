import { BadgeCheck } from "lucide-react";

export default function Highlights({ highlights }) {
  return (
    <section className="section compact-section" id="highlights">
      <div className="section-heading">
        <p className="eyebrow">Professional Highlights</p>
        <h2>Compact signals for engineering recruiters and hiring managers.</h2>
      </div>
      <div className="highlight-grid">
        {highlights.map((highlight) => (
          <article className="highlight-card" key={`${highlight.label}-${highlight.title}`}>
            <BadgeCheck size={19} />
            <div>
              <span className="highlight-label">{highlight.label}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
