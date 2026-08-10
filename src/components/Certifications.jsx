import { Award } from "lucide-react";

export default function Certifications({ certifications }) {
  return (
    <section className="section" id="certifications">
      <div className="section-heading">
        <p className="eyebrow">Certifications</p>
        <h2>Additional training in language, quality, robotics and engineering tools.</h2>
      </div>
      <div className="cert-grid">
        {certifications.map((certification) => (
          <article className="cert-card" key={certification}>
            <Award size={20} />
            <span>{certification}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
