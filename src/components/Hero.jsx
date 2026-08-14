import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";

export default function Hero({ profile, badges }) {
  const hasResume = profile.resumePath && !profile.resumePath.startsWith("#");

  return (
    <section className="hero section" id="home">
      <div className="hero-content">
        <p className="eyebrow">Mechatronics Engineering Portfolio</p>
        <h1>{profile.name}</h1>
        <p className="hero-subtitle">{profile.headline}</p>
        <p className="hero-description">{profile.summary}</p>
        <div className="hero-badges" aria-label="Professional credentials and focus areas">
          {badges.map((badge) => (
            <span className="proof-chip" key={badge}>
              {badge}
            </span>
          ))}
        </div>
        <div className="hero-actions" aria-label="Portfolio actions">
          <a className="button primary" href="#projects">
            View Projects <ArrowRight size={18} />
          </a>
          <a className="button secondary" href={profile.resumePath} target={hasResume ? "_blank" : undefined} rel={hasResume ? "noopener noreferrer" : undefined}>
            {profile.resumeLabel || "View Resume"}
          </a>
          <a className="icon-link" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
            <Github size={21} />
          </a>
          <a className="icon-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
            <Linkedin size={21} />
          </a>
          <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Email">
            <Mail size={21} />
          </a>
        </div>
      </div>
      <aside className="hero-panel" aria-label="Portfolio focus">
        <img className="profile-photo" src={profile.photo} alt={profile.photoAlt} loading="eager" />
        <p className="panel-label">{profile.heroPanel.label}</p>
        <strong>{profile.heroPanel.title}</strong>
        {profile.heroPanel.items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </aside>
    </section>
  );
}
