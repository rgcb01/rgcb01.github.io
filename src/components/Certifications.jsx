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
          <article className="cert-card" key={certification.title}>
            <Award size={20} />
            <div>
              <h3>{certification.title}</h3>
              <p>{certification.issuer}</p>
              {certification.credentialUrl ? (
                <a href={certification.credentialUrl} target="_blank" rel="noopener noreferrer">
                  Credential link
                </a>
              ) : (
                <span className="credential-placeholder">Credential link optional</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
