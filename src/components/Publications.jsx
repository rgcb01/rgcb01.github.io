import { ExternalLink, FileText, Github } from "lucide-react";

export default function Publications({ publications }) {
  return (
    <section className="section section-standard compact-section" id="publications">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Engineering Publications</p>
        <h2>Technical writing that documents reproducible portfolio experiments.</h2>
      </div>
      <div className="publication-grid">
        {publications.map((publication) => (
          <article className="publication-card" key={publication.title}>
            <div className="publication-year">{publication.year}</div>
            <div className="publication-record">
              <span className="publication-type">{publication.type}</span>
              <h3>{publication.title}</h3>
              <p>{publication.description}</p>
              <p className="publication-meta">
                {publication.author}
                {publication.doi ? ` · DOI ${publication.doi}` : ""}
              </p>
              <div className="card-actions">
                {publication.doiUrl && (
                  <a className="button primary" href={publication.doiUrl} target="_blank" rel="noopener noreferrer">
                    DOI / Zenodo <ExternalLink size={16} />
                  </a>
                )}
                <a className="button secondary" href={publication.repository} target="_blank" rel="noopener noreferrer">
                  <Github size={16} />
                  Repository <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <FileText className="publication-icon" size={22} aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
