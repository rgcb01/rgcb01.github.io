import { Award, ExternalLink } from "lucide-react";

export default function Awards({ awards }) {
  if (!awards?.length) return null;

  return (
    <section className="section compact-section" id="awards">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Awards / Recognition</p>
        <h2>Academic and engineering recognition kept separate from certifications.</h2>
      </div>
      <div className="award-grid">
        {awards.map((award) => (
          <article className="award-card" key={`${award.title}-${award.issued}`}>
            <div className="cert-icon" aria-hidden="true">
              <Award size={20} />
            </div>
            <div>
              <span className="publication-type">{award.category}</span>
              <h3>{award.title}</h3>
              <p>{award.description}</p>
              <p className="meta">
                {award.issuer} | {award.issued}
              </p>
              {award.verificationUrl ? (
                <a className="credential-link" href={award.verificationUrl} target="_blank" rel="noopener noreferrer">
                  View verification <ExternalLink size={15} />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
