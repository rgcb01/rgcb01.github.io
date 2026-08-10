import { Award, ExternalLink } from "lucide-react";

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
            {certification.image ? (
              <img className="cert-image" src={certification.image} alt={certification.imageAlt} loading="lazy" />
            ) : (
              <div className="cert-icon" aria-hidden="true">
                <Award size={20} />
              </div>
            )}
            <div className="cert-copy">
              <h3>{certification.title}</h3>
              <p>{certification.issuer}</p>
              {certification.issued ? <span className="cert-meta">Issued: {certification.issued}</span> : null}
              {certification.credentialId ? (
                <span className="cert-meta">Credential ID: {certification.credentialId}</span>
              ) : null}
              {certification.credentialUrl ? (
                <a className="credential-link" href={certification.credentialUrl} target="_blank" rel="noopener noreferrer">
                  View credential <ExternalLink size={15} />
                </a>
              ) : (
                <span className="credential-placeholder">Credential image available</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
